import { useMemo } from 'react';
import { usePermission } from '@/contexts/PermissionContext';
import { menuConfig } from '@/config/menu.config';
import type { MenuItem } from '@/config/menu.types';

/**
 * 根据权限过滤菜单
 */
export function useFilteredMenu(): MenuItem[] {
  const { hasAnyPermission } = usePermission();

  return useMemo(() => {
    const filterMenu = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => {
          if (item.hidden) return false;
          if (!item.permissions || item.permissions.length === 0) return true;
          return hasAnyPermission(item.permissions);
        })
        .map((item) => ({
          ...item,
          children: item.children ? filterMenu(item.children) : undefined,
        }))
        .filter((item) => {
          if (item.children && item.children.length === 0) return false;
          return true;
        });
    };

    return filterMenu(menuConfig);
  }, [hasAnyPermission]);
}
