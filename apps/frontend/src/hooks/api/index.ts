// Health
import { healthQueryKey as _healthQueryKey } from './useHealth';
export { useHealthQuery, healthQueryKey } from './useHealth';

// Organizations
import { orgsQueryKey as _orgsQueryKey } from './useOrganizations';
export { useOrgTreeQuery, useOrgMutations, orgsQueryKey } from './useOrganizations';

// Roles
import { rolesQueryKey as _rolesQueryKey } from './useRoles';
export { useRolesQuery, useRoleMutations, rolesQueryKey } from './useRoles';

// Users
import { usersQueryKey as _usersQueryKey } from './useUsers';
export { useUsersQuery, useUserMutations, usersQueryKey, usersQueryKeyPrefix } from './useUsers';

// Permissions
import { permissionsQueryKey as _permissionsQueryKey } from './usePermissions';
export { usePermissionsQuery, permissionsQueryKey } from './usePermissions';

// 统一的 query keys（向后兼容）
export const queryKeys = {
  health: _healthQueryKey,
  orgs: _orgsQueryKey,
  roles: _rolesQueryKey,
  permissions: _permissionsQueryKey,
  users: _usersQueryKey,
};
