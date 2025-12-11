'use client';

import * as React from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2, Copy, ExternalLink } from 'lucide-react';
import type { Row } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermission } from '@/contexts/PermissionContext';
import type { ActionItem } from './action-helpers';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  /** 操作项配置 */
  actions: ActionItem<TData>[];
  /** 菜单标题 */
  menuLabel?: string;
  /** 是否显示分隔线（在 view/edit 和 delete 之间） */
  showSeparator?: boolean;
}

// 默认图标映射
const defaultIcons: Record<ActionItem<never>['type'], React.ReactNode> = {
  view: <Eye className="mr-2 h-4 w-4" />,
  edit: <Pencil className="mr-2 h-4 w-4" />,
  delete: <Trash2 className="mr-2 h-4 w-4" />,
  copy: <Copy className="mr-2 h-4 w-4" />,
  link: <ExternalLink className="mr-2 h-4 w-4" />,
  custom: null,
};

export function DataTableRowActions<TData>({
  row,
  actions,
  menuLabel = '操作',
  showSeparator = true,
}: DataTableRowActionsProps<TData>) {
  const rowData = row.original;
  const { hasPermission } = usePermission();

  // 检查权限并过滤可见的操作项
  const processedActions = React.useMemo(() => {
    return actions
      .map((action) => {
        // 先检查自定义 show 条件
        if (action.show && !action.show(rowData)) {
          return null;
        }

        // 检查权限
        if (action.permission) {
          const hasPerm = hasPermission(action.permission);
          if (!hasPerm) {
            if (action.unauthorizedBehavior === 'disable') {
              return { ...action, _forceDisabled: true };
            }
            // 默认隐藏
            return null;
          }
        }

        return action;
      })
      .filter(
        (action): action is ActionItem<TData> & { _forceDisabled?: boolean } => action !== null,
      );
  }, [actions, rowData, hasPermission]);

  // 分离普通操作和危险操作
  const normalActions = processedActions.filter((a) => !a.destructive);
  const dangerousActions = processedActions.filter((a) => a.destructive);

  if (processedActions.length === 0) {
    return null;
  }

  const renderMenuItem = (
    action: ActionItem<TData> & { _forceDisabled?: boolean },
    index: number,
  ) => {
    const isDisabled = action._forceDisabled || (action.disabled?.(rowData) ?? false);
    const icon = action.icon ?? defaultIcons[action.type];

    return (
      <DropdownMenuItem
        key={index}
        onClick={() => action.onClick(rowData)}
        disabled={isDisabled}
        className={action.destructive ? 'text-destructive focus:text-destructive' : undefined}
      >
        {icon}
        {action.label}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 普通操作 */}
        {normalActions.map((action, index) => renderMenuItem(action, index))}

        {/* 分隔线 */}
        {showSeparator && normalActions.length > 0 && dangerousActions.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {/* 危险操作 */}
        {dangerousActions.map((action, index) =>
          renderMenuItem(action, normalActions.length + index),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
