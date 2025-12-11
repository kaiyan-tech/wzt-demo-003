// 核心客户端
export { api, apiRequest, ApiError, setToken, getToken, clearToken } from './client';

// 认证
export { authApi } from './auth';

// 用户
export { usersApi, userApi } from './users';
export type { UserCreatePayload, UserUpdatePayload, UserListParams } from './users';

// 角色
export { rolesApi, roleApi } from './roles';
export type { RoleSavePayload, RoleUpdatePayload } from './roles';

// 组织
export { orgsApi, orgApi } from './organizations';
export type { OrgCreatePayload, OrgUpdatePayload } from './organizations';

// 权限
export { permissionsApi, permissionApi } from './permissions';
