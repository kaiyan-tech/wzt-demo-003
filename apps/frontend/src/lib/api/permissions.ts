import type { PermissionDto } from '@shared';
import { apiRequest } from './client';

/**
 * 权限 API
 */
export const permissionsApi = {
  list: () =>
    apiRequest<{ items: PermissionDto[]; grouped: Record<string, PermissionDto[]> }>(
      '/api/permissions',
    ),
};

// 向后兼容的别名
export const permissionApi = permissionsApi;
