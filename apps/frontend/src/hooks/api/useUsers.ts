import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { PaginatedResponse, UserSummary } from '@shared';
import { userApi, type ApiError, type UserCreatePayload, type UserUpdatePayload } from '@/lib/api';
import { orgsQueryKey } from './useOrganizations';

export const usersQueryKeyPrefix = ['users'] as const;

export const usersQueryKey = (page: number, keyword?: string, orgId?: string | null) =>
  ['users', page, keyword || '', orgId || ''] as const;

function invalidateAdminLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: orgsQueryKey });
  void queryClient.invalidateQueries({ queryKey: ['roles'] });
  void queryClient.invalidateQueries({ queryKey: usersQueryKeyPrefix });
}

export function useUsersQuery({
  page,
  pageSize,
  keyword,
  orgId,
  enabled = true,
}: {
  page: number;
  pageSize: number;
  keyword?: string;
  orgId?: string;
  enabled?: boolean;
}) {
  return useQuery<PaginatedResponse<UserSummary>, ApiError>({
    queryKey: usersQueryKey(page, keyword, orgId),
    queryFn: () => userApi.list({ page, pageSize, keyword, orgId }),
    placeholderData: (previousData) => previousData,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: string;
      payload: UserCreatePayload | UserUpdatePayload;
    }) =>
      id
        ? userApi.update(id, payload as UserUpdatePayload)
        : userApi.create(payload as UserCreatePayload),
    onSuccess: () => {
      invalidateAdminLists(queryClient);
    },
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      userApi.resetPassword(id, password),
  });

  const remove = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      invalidateAdminLists(queryClient);
    },
  });

  return { save, resetPassword, remove };
}
