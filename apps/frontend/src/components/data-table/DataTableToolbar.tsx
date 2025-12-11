'use client';

import * as React from 'react';
import { X, Search, Trash2 } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './DataTableViewOptions';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 搜索列的 accessorKey */
  searchColumn?: string;
  /** 列名称映射（用于 ViewOptions） */
  columnLabels?: Record<string, string>;
  /** 是否显示列可见性切换按钮 */
  showViewOptions?: boolean;
  /** 批量删除回调（当有选中行时显示） */
  onBatchDelete?: (selectedRows: TData[]) => void;
  /** 批量删除按钮文本 */
  batchDeleteText?: string;
  /** 额外的操作按钮（渲染在左侧） */
  leftActions?: React.ReactNode;
  /** 额外的操作按钮（渲染在右侧） */
  rightActions?: React.ReactNode;
  /** 额外类名 */
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = '搜索...',
  searchColumn,
  columnLabels,
  showViewOptions = true,
  onBatchDelete,
  batchDeleteText = '删除所选',
  leftActions,
  rightActions,
  className,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  // 全局搜索值
  const [searchValue, setSearchValue] = React.useState('');

  // 处理搜索
  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchColumn) {
        table.getColumn(searchColumn)?.setFilterValue(value);
      } else {
        // 如果没有指定搜索列，设置全局过滤
        table.setGlobalFilter(value);
      }
    },
    [table, searchColumn],
  );

  // 重置所有筛选
  const handleReset = React.useCallback(() => {
    setSearchValue('');
    table.resetColumnFilters();
    table.setGlobalFilter('');
  }, [table]);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {/* 左侧区域 */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* 搜索框 */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>

        {/* 额外的左侧操作 */}
        {leftActions}

        {/* 重置筛选按钮 */}
        {isFiltered && (
          <Button variant="ghost" onClick={handleReset} className="h-8 px-2 lg:px-3">
            重置
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* 批量删除按钮 */}
        {hasSelection && onBatchDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onBatchDelete(selectedRows.map((row) => row.original))}
            className="h-8"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {batchDeleteText} ({selectedRows.length})
          </Button>
        )}
      </div>

      {/* 右侧区域 */}
      <div className="flex items-center gap-2">
        {/* 额外的右侧操作 */}
        {rightActions}

        {/* 列可见性切换 */}
        {showViewOptions && <DataTableViewOptions table={table} columnLabels={columnLabels} />}
      </div>
    </div>
  );
}
