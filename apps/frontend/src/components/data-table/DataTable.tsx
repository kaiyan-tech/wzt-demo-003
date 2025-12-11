'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TanStackTable,
  type RowSelectionState,
  type PaginationState,
  type OnChangeFn,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTablePagination } from './DataTablePagination';

export interface DataTableProps<TData, TValue> {
  /** 列定义 */
  columns: ColumnDef<TData, TValue>[];
  /** 数据源 */
  data: TData[];
  /** 是否显示分页（默认 true） */
  showPagination?: boolean;
  /** 分页配置 */
  pagination?: {
    /** 每页条数选项 */
    pageSizeOptions?: number[];
    /** 初始每页条数 */
    initialPageSize?: number;
  };
  /** 服务端分页配置 */
  serverPagination?: {
    /** 总页数 */
    pageCount: number;
    /** 分页状态 */
    state: PaginationState;
    /** 分页状态变化回调 */
    onPaginationChange: OnChangeFn<PaginationState>;
  };
  /** 是否启用行选择 */
  enableRowSelection?: boolean;
  /** 行选择状态变化回调 */
  onRowSelectionChange?: (rows: TData[]) => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 空状态提示文本 */
  emptyText?: string;
  /** 自定义工具栏（渲染在表格上方） */
  toolbar?: (table: TanStackTable<TData>) => React.ReactNode;
  /** 表格容器的额外类名 */
  className?: string;
  /** 获取行 ID 的函数（用于行选择等场景） */
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  showPagination = true,
  pagination,
  serverPagination,
  enableRowSelection = false,
  onRowSelectionChange,
  loading = false,
  emptyText = '暂无数据',
  toolbar,
  className,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // 客户端分页状态（仅在非服务端分页时使用）
  const [clientPagination, setClientPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pagination?.initialPageSize ?? 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: serverPagination?.state ?? clientPagination,
    },
    // 分页配置
    ...(serverPagination
      ? {
          pageCount: serverPagination.pageCount,
          manualPagination: true,
          onPaginationChange: serverPagination.onPaginationChange,
        }
      : {
          onPaginationChange: setClientPagination,
          getPaginationRowModel: getPaginationRowModel(),
        }),
    // 行选择
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    // 排序
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // 筛选
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // 列可见性
    onColumnVisibilityChange: setColumnVisibility,
    // 核心
    getCoreRowModel: getCoreRowModel(),
    // 行 ID
    getRowId,
  });

  // 当行选择变化时，通知外部
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onRowSelectionChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 工具栏 */}
      {toolbar?.(table)}

      {/* 表格主体 */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // 加载状态
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="ml-2 text-muted-foreground">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              // 数据行
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // 空状态
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <span className="text-muted-foreground">{emptyText}</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {showPagination && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pagination?.pageSizeOptions}
          showSelectedCount={enableRowSelection}
        />
      )}
    </div>
  );
}

// 导出 TanStack Table 类型供外部使用
export type { TanStackTable as DataTableInstance };
