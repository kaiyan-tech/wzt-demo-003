import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  DataScope,
  type PaginatedResponse,
  type RegisterDto,
  type UserStatus,
  type UserSummary,
} from '@shared';
import { Prisma, type User, type UserRole, type Role } from '@prisma/client';

/** Prisma 查询返回的用户数据（包含组织和角色关联） */
type UserWithRelations = User & {
  organization?: { name: string; path: string } | null;
  roles: (UserRole & { role: Role & { permissions: { permissionCode: string }[] } })[];
};
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, ScopedService } from '../common/scoped.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UserService extends ScopedService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 自助注册（使用默认角色和根组织）
   */
  async create(dto: RegisterDto & { passwordHash: string }) {
    return this.createInternal({
      username: dto.email,
      email: dto.email,
      name: dto.name ?? dto.email,
      passwordHash: dto.passwordHash,
      status: 'ACTIVE',
    });
  }

  /**
   * 管理员创建用户
   */
  async createByAdmin(currentUser: CurrentUser, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.ensureOrgAccessible(currentUser, dto.orgId);
    const roleIds = dto.roleIds?.length ? await this.validateRoleIds(dto.roleIds) : undefined;
    return this.createInternal({
      username: dto.username,
      email: dto.email,
      name: dto.name ?? dto.username,
      passwordHash,
      orgId: dto.orgId,
      status: dto.status ?? 'ACTIVE',
      roleIds,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true, path: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { select: { permissionCode: true } },
              },
            },
          },
        },
      },
    });
  }

  async findAll(
    currentUser: CurrentUser,
    query: QueryUserDto,
  ): Promise<PaginatedResponse<UserSummary>> {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;

    const scopeFilter = this.getScopeFilter(currentUser, 'orgId', 'id');
    const where: Prisma.UserWhereInput = { ...scopeFilter };

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { email: { contains: query.keyword, mode: 'insensitive' } },
        { username: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.orgId) {
      const canAccess = await this.canAccessOrg(currentUser, query.orgId);
      if (!canAccess) {
        throw new ForbiddenException('无权访问该组织下的用户');
      }
      where.orgId = query.orgId;
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          organization: { select: { name: true, path: true } },
          roles: {
            include: {
              role: {
                include: {
                  permissions: { select: { permissionCode: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: users.map((user) => this.mapToSummary(user)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateByAdmin(currentUser: CurrentUser, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const canAccess = await this.canAccessOrg(currentUser, user.orgId);
    if (!canAccess && currentUser.id !== id) {
      throw new ForbiddenException('无权操作该用户');
    }

    const targetOrgId = dto.orgId ?? user.orgId;
    if (dto.orgId) {
      await this.ensureOrgAccessible(currentUser, dto.orgId);
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) {
        throw new ConflictException('邮箱已被占用');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (usernameExists) {
        throw new ConflictException('用户名已被占用');
      }
    }

    const roleIds = dto.roleIds ? await this.validateRoleIds(dto.roleIds) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username: dto.username ?? user.username,
          email: dto.email ?? user.email,
          name: dto.name ?? user.name,
          status: (dto.status ?? user.status) as UserStatus,
          orgId: targetOrgId,
        },
      });

      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
      }
    });

    return this.findSummary(id);
  }

  async resetPassword(currentUser: CurrentUser, id: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const canAccess = await this.canAccessOrg(currentUser, user.orgId);
    if (!canAccess && currentUser.id !== id) {
      throw new ForbiddenException('无权操作该用户');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { success: true };
  }

  async deleteByAdmin(currentUser: CurrentUser, id: string) {
    // 不允许删除自己
    if (currentUser.id === id) {
      throw new ForbiddenException('不能删除自己的账号');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const canAccess = await this.canAccessOrg(currentUser, user.orgId);
    if (!canAccess) {
      throw new ForbiddenException('无权操作该用户');
    }

    // 删除用户角色关联，然后删除用户
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return { success: true };
  }

  async findSummary(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true, path: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { select: { permissionCode: true } },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.mapToSummary(user);
  }

  private async createInternal(params: {
    username: string;
    email: string;
    name?: string;
    passwordHash: string;
    orgId?: string;
    status?: UserStatus;
    roleIds?: string[];
  }) {
    await this.ensureUniqueUser(params.username, params.email);
    const orgId = await this.resolveOrgId(params.orgId);
    const roleIds =
      params.roleIds?.length && params.roleIds.length > 0
        ? await this.validateRoleIds(params.roleIds)
        : await this.getDefaultRoleIds();

    const user = await this.prisma.user.create({
      data: {
        username: params.username,
        email: params.email,
        name: params.name ?? params.username,
        passwordHash: params.passwordHash,
        status: params.status ?? 'ACTIVE',
        orgId,
      },
    });

    if (roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: user.id, roleId })),
      });
    }

    return this.findSummary(user.id);
  }

  private async ensureUniqueUser(username: string, email: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    if (existing) {
      throw new ConflictException('用户名或邮箱已存在');
    }
  }

  private async resolveOrgId(orgId?: string) {
    if (orgId) {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) {
        throw new BadRequestException('组织不存在');
      }
      return orgId;
    }

    const rootOrg = await this.prisma.organization.findFirst({
      where: { code: 'ROOT' },
      select: { id: true },
    });
    if (rootOrg) return rootOrg.id;

    const anyOrg = await this.prisma.organization.findFirst({ select: { id: true } });
    if (!anyOrg) {
      throw new BadRequestException('系统未初始化组织，请先创建组织');
    }
    return anyOrg.id;
  }

  private async validateRoleIds(roleIds: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('存在无效的角色');
    }
    return roleIds;
  }

  private async getDefaultRoleIds() {
    const role = await this.prisma.role.findFirst({
      where: { name: '普通用户' },
      select: { id: true },
    });
    return role ? [role.id] : [];
  }

  private mapToSummary(user: UserWithRelations): UserSummary {
    const permissionSet = new Set<string>();
    let dataScope = DataScope.SELF;

    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(rp.permissionCode);
      }
      dataScope = this.getMaxDataScope(dataScope, ur.role.dataScope as DataScope);
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      status: user.status as UserStatus,
      orgId: user.orgId,
      orgName: user.organization?.name,
      orgPath: user.organization?.path,
      roles: user.roles.map((r) => ({
        id: r.roleId,
        name: r.role.name,
      })),
      permissions: Array.from(permissionSet),
      dataScope,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async ensureOrgAccessible(currentUser: CurrentUser, orgId: string) {
    const canAccess = await this.canAccessOrg(currentUser, orgId);
    if (!canAccess && currentUser.dataScope !== DataScope.ALL) {
      throw new ForbiddenException('无权操作该组织');
    }
  }

  private getMaxDataScope(a: DataScope, b: DataScope): DataScope {
    const order = {
      [DataScope.ALL]: 4,
      [DataScope.ORG_TREE]: 3,
      [DataScope.ORG]: 2,
      [DataScope.SELF]: 1,
    };
    return order[a] >= order[b] ? a : b;
  }
}
