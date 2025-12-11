import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { Request } from 'express';
import type { CurrentUser } from '../scoped.service';

type AuthenticatedRequest = Request & { user?: CurrentUser | null };

/**
 * 权限守卫
 *
 * 检查用户是否具备访问接口所需的权限
 * 配合 @RequirePermissions 装饰器使用
 *
 * 逻辑:
 * 1. 如果接口未标记 @RequirePermissions,则放行
 * 2. 如果用户未登录,在此之前会被 JwtAuthGuard 拦截
 * 3. 检查用户权限列表是否包含所需的所有权限
 * 4. 缺少任何一个权限则返回 403 Forbidden
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取接口所需的权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有标记权限要求,则放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 获取当前用户(由 JwtAuthGuard 注入)
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // 理论上不会到这里,因为 JwtAuthGuard 会先拦截
    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 检查用户是否具备所有所需权限
    const userPermissions: string[] = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (perm) => !userPermissions.includes(perm),
      );
      throw new ForbiddenException(`缺少权限: ${missingPermissions.join(', ')}`);
    }

    return true;
  }
}
