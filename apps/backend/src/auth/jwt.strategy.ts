import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DataScope } from '@shared';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // JWT 通过 Header 传递 - 参考《开沿核心技术宪章》5.1 节
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organization: { select: { path: true } },
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
      throw new UnauthorizedException();
    }

    // 聚合权限列表
    const permissions = [
      ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permissionCode))),
    ];

    // 取最宽松的数据范围（ALL > ORG_TREE > ORG > SELF）
    const scopePriority: Record<DataScope, number> = {
      [DataScope.ALL]: 4,
      [DataScope.ORG_TREE]: 3,
      [DataScope.ORG]: 2,
      [DataScope.SELF]: 1,
    };
    const dataScope = user.roles.reduce((max, ur) => {
      const currentScope = ur.role.dataScope as DataScope;
      return scopePriority[currentScope] > scopePriority[max] ? currentScope : max;
    }, DataScope.SELF);

    return {
      id: user.id,
      username: user.username,
      orgId: user.orgId,
      orgPath: user.organization.path,
      dataScope,
      permissions,
    };
  }
}
