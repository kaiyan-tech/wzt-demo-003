import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSION_METADATA, type RoleDto } from '@shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  private readonly permissionSet = new Set(PERMISSION_METADATA.map((p) => p.code));

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: { select: { permissionCode: true } },
        users: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      dataScope: role.dataScope as RoleDto['dataScope'],
      permissionCodes: role.permissions.map((p) => p.permissionCode),
      userCount: role.users.length,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));
  }

  async create(dto: CreateRoleDto) {
    this.validatePermissions(dto.permissionCodes);

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          dataScope: dto.dataScope,
          isSystem: false,
        },
      });

      await tx.rolePermission.createMany({
        data: dto.permissionCodes.map((code) => ({
          roleId: role.id,
          permissionCode: code,
        })),
      });

      return {
        ...role,
        permissionCodes: dto.permissionCodes,
      };
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { select: { permissionCode: true } } },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('系统角色不允许重命名');
    }

    const permissionCodes = dto.permissionCodes ?? role.permissions.map((p) => p.permissionCode);
    this.validatePermissions(permissionCodes);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.role.update({
        where: { id },
        data: {
          name: dto.name ?? role.name,
          description: dto.description ?? role.description,
          dataScope: dto.dataScope ?? (role.dataScope as RoleDto['dataScope']),
        },
      });

      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({
        data: permissionCodes.map((code) => ({
          roleId: id,
          permissionCode: code,
        })),
      });

      return {
        ...updated,
        permissionCodes,
      };
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    if (role.isSystem) {
      throw new BadRequestException('系统角色不允许删除');
    }

    const userCount = await this.prisma.userRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new BadRequestException('角色已分配用户，无法删除');
    }

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  private validatePermissions(codes: string[]) {
    const invalid = codes.filter((code) => !this.permissionSet.has(code));
    if (invalid.length > 0) {
      throw new BadRequestException(`无效的权限: ${invalid.join(', ')}`);
    }
  }
}
