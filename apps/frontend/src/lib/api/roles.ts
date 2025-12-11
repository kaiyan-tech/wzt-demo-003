import type { DataScope, Permission, RoleDto } from '@shared';
import { apiRequest } from './client';

export type RoleSavePayload = {
  name: string;
  description?: string;
  dataScope: DataScope;
  permissionCodes: Permission[];
};

export type RoleUpdatePayload = Partial<RoleSavePayload>;

/**
 * 角色管理 API
 */
export const rolesApi = {
  list: () => apiRequest<RoleDto[]>('/api/roles'),

  create: (payload: RoleSavePayload) =>
    apiRequest<RoleDto>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: RoleUpdatePayload) =>
    apiRequest<RoleDto>(`/api/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/roles/${id}`, {
      method: 'DELETE',
    }),
};

// 向后兼容的别名
export const roleApi = rolesApi;
