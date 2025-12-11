import type { ComponentProps } from 'react';
import type { Permission } from '@shared';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/hooks/useHasPermission';

interface PermissionButtonProps extends ComponentProps<typeof Button> {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  unauthorizedBehavior?: 'hide' | 'disable';
}

export function PermissionButton({
  permission,
  mode = 'all',
  unauthorizedBehavior = 'hide',
  children,
  disabled,
  ...props
}: PermissionButtonProps) {
  const hasPermission = useHasPermission(permission, mode);

  if (!hasPermission && unauthorizedBehavior === 'hide') {
    return null;
  }

  return (
    <Button
      {...props}
      disabled={disabled || (!hasPermission && unauthorizedBehavior === 'disable')}
    >
      {children}
    </Button>
  );
}
