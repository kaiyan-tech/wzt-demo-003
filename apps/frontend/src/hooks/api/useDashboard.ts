import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  type SalesTrendItem,
  type SalesByCategoryItem,
  type SalesByRegionItem,
  type SummaryStats,
  type RegionCategoryMatrixItem,
} from '@/lib/api/dashboard';
import type { ApiError } from '@/lib/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  salesTrend: () => [...dashboardKeys.all, 'sales-trend'] as const,
  salesByCategory: () => [...dashboardKeys.all, 'sales-by-category'] as const,
  salesByRegion: () => [...dashboardKeys.all, 'sales-by-region'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  regionCategoryMatrix: () => [...dashboardKeys.all, 'region-category-matrix'] as const,
};

export function useSalesTrendQuery() {
  return useQuery<SalesTrendItem[], ApiError>({
    queryKey: dashboardKeys.salesTrend(),
    queryFn: dashboardApi.getSalesTrend,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });
}

export function useSalesByCategoryQuery() {
  return useQuery<SalesByCategoryItem[], ApiError>({
    queryKey: dashboardKeys.salesByCategory(),
    queryFn: dashboardApi.getSalesByCategory,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSalesByRegionQuery() {
  return useQuery<SalesByRegionItem[], ApiError>({
    queryKey: dashboardKeys.salesByRegion(),
    queryFn: dashboardApi.getSalesByRegion,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSummaryStatsQuery() {
  return useQuery<SummaryStats, ApiError>({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardApi.getSummary,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRegionCategoryMatrixQuery() {
  return useQuery<RegionCategoryMatrixItem[], ApiError>({
    queryKey: dashboardKeys.regionCategoryMatrix(),
    queryFn: dashboardApi.getRegionCategoryMatrix,
    staleTime: 1000 * 60 * 5,
  });
}
