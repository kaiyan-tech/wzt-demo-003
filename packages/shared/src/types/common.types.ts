/**
 * 通用 ID 类型
 */
export type ID = string;

/**
 * 可选的类型工具
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必选的类型工具
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 排序方向
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 排序参数
 */
export interface SortParams {
  field: string;
  order: SortOrder;
}
