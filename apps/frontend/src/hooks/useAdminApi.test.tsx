import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useOrgTreeQuery, usePermissionsQuery, useUsersQuery } from './useAdminApi';
import { orgApi, permissionApi, userApi } from '@/lib/api';
import type { OrganizationTreeNode, PaginatedResponse, PermissionDto, UserSummary } from '@shared';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    orgApi: {
      ...actual.orgApi,
      fetchTree: vi.fn(),
    },
    permissionApi: {
      ...actual.permissionApi,
      list: vi.fn(),
    },
    roleApi: {
      ...actual.roleApi,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    userApi: {
      ...actual.userApi,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      resetPassword: vi.fn(),
    },
  };
});

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAdminApi hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useOrgTreeQuery 会调用 orgApi.fetchTree 并返回数据', async () => {
    const mockOrgs: OrganizationTreeNode[] = [
      { id: '1', name: '总部', code: 'HQ', level: 0, path: 'HQ', sortOrder: 0, parentId: null },
    ];
    vi.mocked(orgApi.fetchTree).mockResolvedValue(mockOrgs);

    const { result } = renderHook(() => useOrgTreeQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(mockOrgs));
    expect(orgApi.fetchTree).toHaveBeenCalledTimes(1);
  });

  it('usePermissionsQuery 返回权限分组数据', async () => {
    const mockPermissions: { items: PermissionDto[]; grouped: Record<string, PermissionDto[]> } = {
      items: [],
      grouped: { user: [{ code: 'user:read', module: 'user', description: '查看用户' }] },
    };
    vi.mocked(permissionApi.list).mockResolvedValue(mockPermissions);

    const { result } = renderHook(() => usePermissionsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data?.grouped).toEqual(mockPermissions.grouped));
    expect(permissionApi.list).toHaveBeenCalledTimes(1);
  });

  it('useUsersQuery 携带分页参数请求用户列表', async () => {
    const mockResponse: PaginatedResponse<UserSummary> = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
      totalPages: 0,
    };
    vi.mocked(userApi.list).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUsersQuery({ page: 2, pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data?.page).toBe(2));
    expect(userApi.list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      keyword: undefined,
      orgId: undefined,
    });
  });
});
