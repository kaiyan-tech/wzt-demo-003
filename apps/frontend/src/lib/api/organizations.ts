import type { OrganizationTreeNode } from '@shared';
import { apiRequest } from './client';

export type OrgCreatePayload = {
  name: string;
  code: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type OrgUpdatePayload = Partial<
  Omit<OrgCreatePayload, 'parentId'> & { parentId: string | null }
>;

/**
 * 组织管理 API
 */
export const orgsApi = {
  fetchTree: () => apiRequest<OrganizationTreeNode[]>('/api/orgs/tree'),

  create: (payload: OrgCreatePayload) =>
    apiRequest<OrganizationTreeNode>('/api/orgs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: OrgUpdatePayload) =>
    apiRequest<OrganizationTreeNode>(`/api/orgs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/orgs/${id}`, {
      method: 'DELETE',
    }),
};

// 向后兼容的别名
export const orgApi = orgsApi;
