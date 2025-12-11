import { useMemo } from 'react';
import type { Permission } from '@shared';
import { usePermission } from '@/contexts/PermissionContext';

export function useHasPermission(
  permission: Permission | Permission[],
  mode: 'any' | 'all' = 'all',
) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  return useMemo(() => {
    if (Array.isArray(permission)) {
      return mode === 'any' ? hasAnyPermission(permission) : hasAllPermissions(permission);
    }
    return hasPermission(permission);
  }, [permission, mode, hasPermission, hasAnyPermission, hasAllPermissions]);
}
