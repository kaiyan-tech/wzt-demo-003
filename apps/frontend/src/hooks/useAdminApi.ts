/**
 * API Hooks 统一导出
 *
 * 为保持向后兼容，此文件重新导出所有 API Hooks。
 * 新代码应直接从 '@/hooks/api' 导入。
 */

export {
  // Health
  useHealthQuery,
  healthQueryKey,

  // Organizations
  useOrgTreeQuery,
  useOrgMutations,
  orgsQueryKey,

  // Roles
  useRolesQuery,
  useRoleMutations,
  rolesQueryKey,

  // Users
  useUsersQuery,
  useUserMutations,
  usersQueryKey,
  usersQueryKeyPrefix,

  // Permissions
  usePermissionsQuery,
  permissionsQueryKey,

  // 统一的 query keys
  queryKeys,
} from './api';

// useDashboardTabs 是一个简单的 memo hook，保留在这里
import { useMemo } from 'react';

export function useDashboardTabs(initialTab: string) {
  return useMemo(() => initialTab, [initialTab]);
}
