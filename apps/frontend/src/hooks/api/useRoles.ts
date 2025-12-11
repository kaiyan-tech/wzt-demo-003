import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RoleDto } from '@shared';
import { roleApi, type ApiError, type RoleSavePayload, type RoleUpdatePayload } from '@/lib/api';
import { orgsQueryKey } from './useOrganizations';
import { usersQueryKeyPrefix } from './useUsers';

export const rolesQueryKey = ['roles'] as const;

function invalidateAdminLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: orgsQueryKey });
  void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
  void queryClient.invalidateQueries({ queryKey: usersQueryKeyPrefix });
}

export function useRolesQuery(options?: { enabled?: boolean }) {
  return useQuery<RoleDto[], ApiError>({
    queryKey: rolesQueryKey,
    queryFn: roleApi.list,
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useRoleMutations() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: RoleSavePayload }) =>
      id ? roleApi.update(id, payload as RoleUpdatePayload) : roleApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      invalidateAdminLists(queryClient);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => roleApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      invalidateAdminLists(queryClient);
    },
  });

  return { save, remove };
}
