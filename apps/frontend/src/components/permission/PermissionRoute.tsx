import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Permission } from '@shared';
import { useHasPermission } from '@/hooks/useHasPermission';

interface PermissionRouteProps {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: ReactNode;
  redirectTo?: string;
}

export function PermissionRoute({
  permission,
  mode = 'all',
  children,
  redirectTo = '/403',
}: PermissionRouteProps) {
  const hasPermission = useHasPermission(permission, mode);

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
