import { useState, useCallback } from 'react';

interface ConfirmState<T = unknown> {
  open: boolean;
  data: T | null;
}

/**
 * 确认弹窗状态管理 Hook
 *
 * @example
 * const { state, confirm, cancel, reset } = useConfirm<UserSummary>();
 *
 * // 触发确认
 * <Button onClick={() => confirm(user)}>删除</Button>
 *
 * // 确认弹窗
 * <ConfirmDialog
 *   open={state.open}
 *   onOpenChange={(open) => !open && reset()}
 *   title="删除用户"
 *   description={`确定要删除 ${state.data?.name} 吗？`}
 *   onConfirm={() => handleDelete(state.data!)}
 * />
 */
export function useConfirm<T = unknown>() {
  const [state, setState] = useState<ConfirmState<T>>({
    open: false,
    data: null,
  });

  const confirm = useCallback((data: T) => {
    setState({ open: true, data });
  }, []);

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ open: false, data: null });
  }, []);

  return { state, confirm, cancel, reset };
}
