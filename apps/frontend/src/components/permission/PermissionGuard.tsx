import type { ReactNode } from 'react';
import type { Permission } from '@shared';
import { useHasPermission } from '@/hooks/useHasPermission';

interface PermissionGuardProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  mode = 'all',
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission, mode);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
