/**
 * API 模块统一导出
 *
 * 为保持向后兼容，此文件重新导出所有 API 模块。
 * 新代码应直接从 '@/lib/api' 导入。
 */

// 核心客户端
export { api, apiRequest, ApiError, setToken, getToken, clearToken } from './api/client';

// 认证
export { authApi } from './api/auth';

// 用户
export { usersApi, userApi } from './api/users';
export type { UserCreatePayload, UserUpdatePayload, UserListParams } from './api/users';

// 角色
export { rolesApi, roleApi } from './api/roles';
export type { RoleSavePayload, RoleUpdatePayload } from './api/roles';

// 组织
export { orgsApi, orgApi } from './api/organizations';
export type { OrgCreatePayload, OrgUpdatePayload } from './api/organizations';

// 权限
export { permissionsApi, permissionApi } from './api/permissions';
