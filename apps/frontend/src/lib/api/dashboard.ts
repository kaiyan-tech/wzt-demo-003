import { api } from './client';

// 类型定义
export interface SalesTrendItem {
  month: string;
  amount: number;
  quantity: number;
}

export interface SalesByCategoryItem {
  category: string;
  amount: number;
  quantity: number;
}

export interface SalesByRegionItem {
  region: string;
  amount: number;
  quantity: number;
}

export interface SummaryStats {
  totalAmount: number;
  totalQuantity: number;
  categoryCount: number;
  regionCount: number;
  recordCount: number;
}

export interface RegionCategoryMatrixItem {
  region: string;
  category: string;
  amount: number;
}

// API 方法
export const dashboardApi = {
  getSalesTrend: () => api.get<SalesTrendItem[]>('/api/dashboard/sales-trend'),
  getSalesByCategory: () => api.get<SalesByCategoryItem[]>('/api/dashboard/sales-by-category'),
  getSalesByRegion: () => api.get<SalesByRegionItem[]>('/api/dashboard/sales-by-region'),
  getSummary: () => api.get<SummaryStats>('/api/dashboard/summary'),
  getRegionCategoryMatrix: () =>
    api.get<RegionCategoryMatrixItem[]>('/api/dashboard/region-category-matrix'),
};
