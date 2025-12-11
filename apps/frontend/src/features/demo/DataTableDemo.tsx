'use client';

import * as React from 'react';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { Permission } from '@shared';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DataTableRowActions,
  createSelectColumn,
  createEditAction,
  createDeleteAction,
} from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';

// 测试数据类型
type DemoItem = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  createdAt: string;
};

// 生成测试数据
function generateTestData(count: number): DemoItem[] {
  const statuses: Array<'active' | 'inactive'> = ['active', 'inactive'];
  const roles = ['管理员', '编辑', '查看者', '访客'];
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `用户 ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: statuses[i % 2],
    role: roles[i % roles.length],
    createdAt: new Date(Date.now() - i * 86400000).toLocaleDateString('zh-CN'),
  }));
}

// 全量数据（用于模拟服务端分页）
const ALL_DATA = generateTestData(100);

export default function DataTableDemo() {
  const { toast } = useToast();
  const [dataSize, setDataSize] = React.useState(15);
  const [data, setData] = React.useState<DemoItem[]>(() => generateTestData(15));

  // 服务端分页状态
  const [serverMode, setServerMode] = React.useState(false);
  const [serverLoading, setServerLoading] = React.useState(false);
  const [serverData, setServerData] = React.useState<DemoItem[]>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const totalCount = ALL_DATA.length;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // 模拟服务端 API 请求
  const fetchServerData = React.useCallback(
    async (pageIndex: number, pageSize: number) => {
      setServerLoading(true);
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      const start = pageIndex * pageSize;
      const end = start + pageSize;
      const pageData = ALL_DATA.slice(start, end);
      setServerData(pageData);
      setServerLoading(false);
      toast({
        title: '服务端分页',
        description: `加载第 ${pageIndex + 1} 页数据（${start + 1}-${Math.min(end, totalCount)}）`,
      });
    },
    [toast, totalCount],
  );

  // 切换到服务端模式时加载数据
  React.useEffect(() => {
    if (serverMode) {
      fetchServerData(pagination.pageIndex, pagination.pageSize);
    }
  }, [serverMode, pagination.pageIndex, pagination.pageSize, fetchServerData]);

  // 切换数据大小
  const handleDataSizeChange = (size: number) => {
    if (serverMode) {
      setServerMode(false);
    }
    setDataSize(size);
    setData(generateTestData(size));
    toast({ title: `已生成 ${size} 条数据` });
  };

  // 切换服务端模式
  const handleServerModeToggle = () => {
    setServerMode(!serverMode);
    if (!serverMode) {
      setPagination({ pageIndex: 0, pageSize: 10 });
    }
  };

  // 处理编辑
  const handleEdit = React.useCallback(
    (item: DemoItem) => {
      toast({ title: '编辑', description: `编辑用户: ${item.name}` });
    },
    [toast],
  );

  // 处理删除
  const handleDelete = React.useCallback(
    (item: DemoItem) => {
      setData((prev) => prev.filter((d) => d.id !== item.id));
      toast({ title: '删除', description: `已删除用户: ${item.name}` });
    },
    [toast],
  );

  // 处理批量删除
  const handleBatchDelete = (items: DemoItem[]) => {
    const ids = new Set(items.map((item) => item.id));
    setData((prev) => prev.filter((d) => !ids.has(d.id)));
    toast({ title: '批量删除', description: `已删除 ${items.length} 个用户` });
  };

  // 列定义
  const columns: ColumnDef<DemoItem>[] = React.useMemo(
    () => [
      createSelectColumn<DemoItem>(),
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
        cell: ({ row }) => (
          <span
            data-testid="status-cell"
            className={row.original.status === 'active' ? 'text-green-600' : 'text-gray-500'}
          >
            {row.original.status === 'active' ? '启用' : '禁用'}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: '角色',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="创建日期" />,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DataTableRowActions
            row={row}
            actions={[
              createEditAction<DemoItem>((item) => handleEdit(item), Permission.USER_UPDATE),
              createDeleteAction<DemoItem>((item) => handleDelete(item), Permission.USER_DELETE),
            ]}
          />
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  return (
    <PageContainer
      title="DataTable 组件演示"
      description="测试 DataTable 组件的各项功能"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant={serverMode ? 'default' : 'outline'}
            size="sm"
            onClick={handleServerModeToggle}
          >
            {serverMode ? '服务端分页 (100条)' : '切换服务端分页'}
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button
            variant={!serverMode && dataSize === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleDataSizeChange(0)}
            disabled={serverMode}
          >
            空数据
          </Button>
          <Button
            variant={!serverMode && dataSize === 5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleDataSizeChange(5)}
            disabled={serverMode}
          >
            5 条
          </Button>
          <Button
            variant={!serverMode && dataSize === 15 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleDataSizeChange(15)}
            disabled={serverMode}
          >
            15 条
          </Button>
          <Button
            variant={!serverMode && dataSize === 50 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleDataSizeChange(50)}
            disabled={serverMode}
          >
            50 条
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={serverMode ? serverData : data}
        enableRowSelection
        getRowId={(row) => row.id}
        loading={serverLoading}
        {...(serverMode && {
          serverPagination: {
            pageCount,
            state: pagination,
            onPaginationChange: setPagination,
          },
        })}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchPlaceholder="搜索用户..."
            searchColumn="name"
            columnLabels={{
              name: '姓名',
              email: '邮箱',
              status: '状态',
              role: '角色',
              createdAt: '创建日期',
            }}
            onBatchDelete={serverMode ? undefined : handleBatchDelete}
          />
        )}
      />
    </PageContainer>
  );
}
