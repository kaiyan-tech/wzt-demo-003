import { SetMetadata } from '@nestjs/common';

/**
 * 权限装饰器的元数据键
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Public 装饰器的元数据键
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 声明接口需要的权限
 *
 * 使用示例:
 * ```typescript
 * @RequirePermissions(Permission.USER_CREATE)
 * @Post()
 * create(@Body() dto: CreateUserDto) {
 *   // ...
 * }
 *
 * // 需要多个权限
 * @RequirePermissions(Permission.USER_UPDATE, Permission.USER_DELETE)
 * @Put(':id')
 * update() {
 *   // ...
 * }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 标记接口为公开,跳过认证和权限检查
 *
 * 使用示例:
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) {
 *   // ...
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
