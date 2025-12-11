# DataTable 使用指南

> 本文档介绍如何使用 `DataTable` 组件构建功能完善的 CRUD 数据表。

## 快速开始

### 1. 基础用法

```tsx
import { DataTable, ColumnDef } from '@/components/data-table';

// 定义数据类型
type User = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

// 定义列
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: '姓名',
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
  {
    accessorKey: 'status',
    header: '状态',
  },
];

// 使用组件
function UserPage() {
  const data: User[] = [...];

  return <DataTable columns={columns} data={data} />;
}
```

### 2. 添加排序功能

使用 `DataTableColumnHeader` 实现可排序的列头：

```tsx
import { DataTable, DataTableColumnHeader, ColumnDef } from '@/components/data-table';

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="姓名" />,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="邮箱" />,
  },
];
```

### 3. 添加行选择

```tsx
function UserPage() {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  return (
    <DataTable
      columns={columns}
      data={data}
      enableRowSelection
      onRowSelectionChange={setSelectedUsers}
    />
  );
}
```

### 4. 添加行操作菜单

```tsx
import {
  DataTable,
  DataTableRowActions,
  createEditAction,
  createDeleteAction,
  ColumnDef,
} from '@/components/data-table';
import { Permission } from '@shared';

const columns: ColumnDef<User>[] = [
  // ...其他列
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          createEditAction((user) => handleEdit(user), Permission.USER_UPDATE),
          createDeleteAction((user) => handleDelete(user), Permission.USER_DELETE),
        ]}
      />
    ),
  },
];
```

### 5. 添加工具栏

```tsx
import { DataTable, DataTableToolbar } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function UserPage() {
  return (
    <DataTable
      columns={columns}
      data={data}
      enableRowSelection
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchPlaceholder="搜索用户..."
          searchColumn="name"
          columnLabels={{
            name: '姓名',
            email: '邮箱',
            status: '状态',
          }}
          onBatchDelete={(rows) => handleBatchDelete(rows)}
          rightActions={
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新建用户
            </Button>
          }
        />
      )}
    />
  );
}
```

## 完整 CRUD 示例

以下是一个完整的用户管理页面示例：

```tsx
'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Permission } from '@shared';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DataTableRowActions,
  createSelectColumn,
  createEditAction,
  createDeleteAction,
  ColumnDef,
} from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PermissionButton } from '@/components/permission/PermissionButton';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { useUsersQuery, useUserMutations } from '@/hooks/api/useUsers';

type User = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

export function UserPage() {
  // 状态
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const deleteConfirm = useConfirm<User>();
  const batchDeleteConfirm = useConfirm<User[]>();

  // 数据查询
  const { data, isLoading } = useUsersQuery();
  const { remove, batchRemove } = useUserMutations();

  // 列定义
  const columns: ColumnDef<User>[] = React.useMemo(
    () => [
      createSelectColumn<User>(),
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="姓名" />,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="邮箱" />,
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <span className={row.original.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
            {row.original.status === 'active' ? '启用' : '禁用'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DataTableRowActions
            row={row}
            actions={[
              createEditAction((user) => setEditingUser(user), Permission.USER_UPDATE),
              createDeleteAction((user) => deleteConfirm.confirm(user), Permission.USER_DELETE),
            ]}
          />
        ),
      },
    ],
    [deleteConfirm],
  );

  // 处理删除
  const handleDelete = async () => {
    if (deleteConfirm.state.data) {
      await remove.mutateAsync(deleteConfirm.state.data.id);
      deleteConfirm.reset();
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (batchDeleteConfirm.state.data) {
      const ids = batchDeleteConfirm.state.data.map((u) => u.id);
      await batchRemove.mutateAsync(ids);
      batchDeleteConfirm.reset();
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        enableRowSelection
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchPlaceholder="搜索用户..."
            searchColumn="name"
            columnLabels={{
              name: '姓名',
              email: '邮箱',
              status: '状态',
            }}
            onBatchDelete={(rows) => batchDeleteConfirm.confirm(rows)}
            rightActions={
              <PermissionButton
                permission={Permission.USER_CREATE}
                size="sm"
                onClick={() => setEditingUser({} as User)}
              >
                <Plus className="mr-2 h-4 w-4" />
                新建用户
              </PermissionButton>
            }
          />
        )}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.state.open}
        onOpenChange={(open) => !open && deleteConfirm.reset()}
        title="删除用户"
        description={`确定要删除用户 "${deleteConfirm.state.data?.name}" 吗？此操作不可撤销。`}
        variant="destructive"
        confirmText="删除"
        onConfirm={handleDelete}
        loading={remove.isPending}
      />

      {/* 批量删除确认弹窗 */}
      <ConfirmDialog
        open={batchDeleteConfirm.state.open}
        onOpenChange={(open) => !open && batchDeleteConfirm.reset()}
        title="批量删除"
        description={`确定要删除选中的 ${batchDeleteConfirm.state.data?.length ?? 0} 个用户吗？此操作不可撤销。`}
        variant="destructive"
        confirmText="删除"
        onConfirm={handleBatchDelete}
        loading={batchRemove?.isPending}
      />
    </div>
  );
}
```

## 服务端分页

对于大数据量场景，建议使用服务端分页：

```tsx
import { DataTable, PaginationState } from '@/components/data-table';

function UserPage() {
  // 分页状态
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // 查询（传入分页参数）
  const { data, isLoading } = useUsersQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      loading={isLoading}
      serverPagination={{
        pageCount: data?.totalPages ?? 0,
        state: pagination,
        onPaginationChange: setPagination,
      }}
    />
  );
}
```

## API 参考

### DataTable Props

| 属性                   | 类型                      | 默认值       | 说明             |
| ---------------------- | ------------------------- | ------------ | ---------------- |
| `columns`              | `ColumnDef<TData>[]`      | 必填         | 列定义           |
| `data`                 | `TData[]`                 | 必填         | 数据源           |
| `showPagination`       | `boolean`                 | `true`       | 是否显示分页     |
| `pagination`           | `object`                  | -            | 分页配置         |
| `serverPagination`     | `object`                  | -            | 服务端分页配置   |
| `enableRowSelection`   | `boolean`                 | `false`      | 是否启用行选择   |
| `onRowSelectionChange` | `(rows: TData[]) => void` | -            | 行选择变化回调   |
| `loading`              | `boolean`                 | `false`      | 是否显示加载状态 |
| `emptyText`            | `string`                  | `'暂无数据'` | 空状态提示文本   |
| `toolbar`              | `(table) => ReactNode`    | -            | 自定义工具栏     |
| `className`            | `string`                  | -            | 容器额外类名     |
| `getRowId`             | `(row: TData) => string`  | -            | 获取行 ID 函数   |

### DataTableToolbar Props

| 属性                | 类型                      | 默认值      | 说明                 |
| ------------------- | ------------------------- | ----------- | -------------------- |
| `table`             | `Table<TData>`            | 必填        | TanStack Table 实例  |
| `searchPlaceholder` | `string`                  | `'搜索...'` | 搜索框占位符         |
| `searchColumn`      | `string`                  | -           | 搜索列的 accessorKey |
| `columnLabels`      | `Record<string, string>`  | -           | 列名称映射           |
| `showViewOptions`   | `boolean`                 | `true`      | 是否显示列可见性切换 |
| `onBatchDelete`     | `(rows: TData[]) => void` | -           | 批量删除回调         |
| `leftActions`       | `ReactNode`               | -           | 左侧额外操作         |
| `rightActions`      | `ReactNode`               | -           | 右侧额外操作         |

### DataTableRowActions Props

| 属性            | 类型                  | 默认值   | 说明           |
| --------------- | --------------------- | -------- | -------------- |
| `row`           | `Row<TData>`          | 必填     | 当前行         |
| `actions`       | `ActionItem<TData>[]` | 必填     | 操作项配置     |
| `menuLabel`     | `string`              | `'操作'` | 菜单标题       |
| `showSeparator` | `boolean`             | `true`   | 是否显示分隔线 |

### ActionItem 配置

| 属性                   | 类型                                                           | 说明           |
| ---------------------- | -------------------------------------------------------------- | -------------- |
| `type`                 | `'view' \| 'edit' \| 'delete' \| 'copy' \| 'link' \| 'custom'` | 操作类型       |
| `label`                | `string`                                                       | 显示标签       |
| `icon`                 | `ReactNode`                                                    | 自定义图标     |
| `onClick`              | `(row: TData) => void`                                         | 点击回调       |
| `permission`           | `Permission`                                                   | 所需权限       |
| `unauthorizedBehavior` | `'hide' \| 'disable'`                                          | 无权限时的行为 |
| `show`                 | `(row: TData) => boolean`                                      | 动态显示判断   |
| `disabled`             | `(row: TData) => boolean`                                      | 动态禁用判断   |
| `destructive`          | `boolean`                                                      | 是否为危险操作 |

## 便捷工厂函数

```tsx
import {
  createViewAction,
  createEditAction,
  createDeleteAction,
  createCopyAction,
} from '@/components/data-table';

// 创建查看操作
createViewAction((row) => console.log(row));

// 创建编辑操作（带权限）
createEditAction((row) => console.log(row), Permission.USER_UPDATE);

// 创建删除操作（带权限）
createDeleteAction((row) => console.log(row), Permission.USER_DELETE);

// 创建复制操作
createCopyAction((row) => navigator.clipboard.writeText(row.id));
```
