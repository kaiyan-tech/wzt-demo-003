import { useQuery } from '@tanstack/react-query';
import type { PermissionDto } from '@shared';
import { permissionApi } from '@/lib/api';

export const permissionsQueryKey = ['permissions'] as const;

type PermissionsData = { items: PermissionDto[]; grouped: Record<string, PermissionDto[]> };

export function usePermissionsQuery(options?: {
  enabled?: boolean;
  initialData?: PermissionsData;
}) {
  return useQuery<PermissionsData, Error>({
    queryKey: permissionsQueryKey,
    queryFn: permissionApi.list,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}
