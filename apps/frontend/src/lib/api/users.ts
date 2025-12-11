import type { PaginatedResponse, UserStatus, UserSummary } from '@shared';
import { apiRequest } from './client';

export type UserCreatePayload = {
  username: string;
  email: string;
  name?: string;
  password: string;
  orgId: string;
  status?: UserStatus;
  roleIds?: string[];
};

export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'password'>> & {
  password?: string;
};

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orgId?: string;
}

/**
 * 用户管理 API
 */
export const usersApi = {
  list: (params: UserListParams = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    if (params.keyword) search.set('keyword', params.keyword);
    if (params.orgId) search.set('orgId', params.orgId);
    const query = search.toString();
    return apiRequest<PaginatedResponse<UserSummary>>(`/api/users${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiRequest<UserSummary>(`/api/users/${id}`),

  create: (payload: UserCreatePayload) =>
    apiRequest<UserSummary>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UserUpdatePayload) =>
    apiRequest<UserSummary>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  resetPassword: (id: string, password: string) =>
    apiRequest<{ success: boolean }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),
};

// 向后兼容的别名
export const userApi = usersApi;
