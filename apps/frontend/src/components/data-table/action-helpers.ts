import { Permission } from '@shared';

interface ActionItem<TData> {
  /** 操作类型 */
  type: 'view' | 'edit' | 'delete' | 'copy' | 'link' | 'custom';
  /** 显示标签 */
  label: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 点击回调 */
  onClick: (row: TData) => void;
  /** 所需权限 */
  permission?: Permission;
  /** 无权限时的行为 */
  unauthorizedBehavior?: 'hide' | 'disable';
  /** 是否显示（动态判断） */
  show?: (row: TData) => boolean;
  /** 是否禁用（动态判断） */
  disabled?: (row: TData) => boolean;
  /** 是否为危险操作（显示为红色） */
  destructive?: boolean;
}

// 导出类型供外部使用
export type { ActionItem };

// 便捷工厂函数：创建常用操作配置
export function createViewAction<TData>(
  onClick: (row: TData) => void,
  options?: Partial<ActionItem<TData>>,
): ActionItem<TData> {
  return {
    type: 'view',
    label: '查看',
    onClick,
    ...options,
  };
}

export function createEditAction<TData>(
  onClick: (row: TData) => void,
  permission?: Permission,
  options?: Partial<ActionItem<TData>>,
): ActionItem<TData> {
  return {
    type: 'edit',
    label: '编辑',
    onClick,
    permission,
    unauthorizedBehavior: 'hide',
    ...options,
  };
}

export function createDeleteAction<TData>(
  onClick: (row: TData) => void,
  permission?: Permission,
  options?: Partial<ActionItem<TData>>,
): ActionItem<TData> {
  return {
    type: 'delete',
    label: '删除',
    onClick,
    permission,
    unauthorizedBehavior: 'hide',
    destructive: true,
    ...options,
  };
}

export function createCopyAction<TData>(
  onClick: (row: TData) => void,
  options?: Partial<ActionItem<TData>>,
): ActionItem<TData> {
  return {
    type: 'copy',
    label: '复制',
    onClick,
    ...options,
  };
}
