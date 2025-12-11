import { useQuery } from '@tanstack/react-query';
import type { HealthCheckResponse } from '@shared';
import type { ApiError } from '@/lib/api';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const healthQueryKey = ['health'] as const;

export function useHealthQuery(options?: { enabled?: boolean }) {
  return useQuery<HealthCheckResponse, ApiError>({
    queryKey: healthQueryKey,
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/api/health`);
      if (!res.ok) {
        throw new Error('健康检查失败');
      }
      return res.json() as Promise<HealthCheckResponse>;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
}
