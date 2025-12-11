import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DataScope, type Permission } from '@shared';
import { useAuth } from './AuthContext';

interface PermissionContextType {
  permissions: Set<string>;
  dataScope: DataScope;
  hasPermission: (permission: string | Permission) => boolean;
  hasAnyPermission: (permissions: Array<string | Permission>) => boolean;
  hasAllPermissions: (permissions: Array<string | Permission>) => boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionContextType>(() => {
    const permissions = new Set(user?.permissions ?? []);
    const dataScope = user?.dataScope ?? DataScope.SELF;

    return {
      permissions,
      dataScope,
      hasPermission: (p) => permissions.has(p),
      hasAnyPermission: (ps) => ps.some((p) => permissions.has(p)),
      hasAllPermissions: (ps) => ps.every((p) => permissions.has(p)),
    };
  }, [user?.permissions, user?.dataScope]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
}
