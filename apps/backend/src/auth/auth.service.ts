import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import {
  DataScope,
  type LoginDto,
  type RegisterDto,
  type UserStatus,
  type UserSummary,
} from '@shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      ...dto,
      passwordHash: hashedPassword,
    });

    return this.generateToken(user.id, user.email || '');
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 状态校验
    if (user.status === 'LOCKED') {
      throw new UnauthorizedException('账号已被锁定，请联系管理员');
    }
    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('账号未激活');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    return this.generateToken(user.id, user.email || '');
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * 获取当前用户的完整信息（包含权限与数据范围）
   */
  async getCurrentUserWithPermissions(userId: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    const permissionSet = new Set<string>();
    let effectiveDataScope: DataScope = DataScope.SELF;

    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(rp.permissionCode);
      }
      effectiveDataScope = this.getMaxDataScope(effectiveDataScope, ur.role.dataScope as DataScope);
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
      roles: user.roles.map((ur) => ({ id: ur.roleId, name: ur.role.name })),
      permissions: Array.from(permissionSet),
      dataScope: effectiveDataScope,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
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
