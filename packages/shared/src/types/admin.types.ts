import type { DataScope } from '../permissions';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface OrganizationTreeNode {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  children?: OrganizationTreeNode[];
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  dataScope: DataScope;
  permissionCodes: string[];
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDto {
  code: string;
  module: string;
  description: string;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  status: UserStatus;
  orgId: string;
  orgName?: string;
  orgPath?: string;
  roles: Array<{ id: string; name: string }>;
  permissions: string[];
  dataScope: DataScope;
  createdAt: string;
  updatedAt: string;
}
