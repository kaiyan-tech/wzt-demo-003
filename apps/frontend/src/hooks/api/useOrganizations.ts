import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrganizationTreeNode } from '@shared';
import { orgApi, type ApiError, type OrgUpdatePayload } from '@/lib/api';

export const orgsQueryKey = ['orgs'] as const;

export function useOrgTreeQuery(options?: { enabled?: boolean }) {
  return useQuery<OrganizationTreeNode[], ApiError>({
    queryKey: orgsQueryKey,
    queryFn: orgApi.fetchTree,
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useOrgMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: orgsQueryKey });
  };

  const create = useMutation({
    mutationFn: orgApi.create,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OrgUpdatePayload }) =>
      orgApi.update(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => orgApi.delete(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
