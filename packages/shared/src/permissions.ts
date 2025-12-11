/**
 * 权限枚举定义
 * 这是权限系统的单一事实来源，前后端共享
 */

// 权限枚举
export enum Permission {
  // 用户管理
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_RESET_PASSWORD = 'user:reset-password',

  // 组织管理
  ORG_READ = 'org:read',
  ORG_CREATE = 'org:create',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',

  // 角色管理
  ROLE_READ = 'role:read',
  ROLE_CREATE = 'role:create',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN = 'role:assign',

  // 审计日志
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',

  // 系统管理
  SYSTEM_SETTINGS = 'system:settings',
}

// 权限模块
export enum PermissionModule {
  USER = 'user',
  ORG = 'org',
  ROLE = 'role',
  AUDIT = 'audit',
  SYSTEM = 'system',
}

// 权限元数据
export interface PermissionMetadata {
  code: string;
  module: string;
  description: string;
}

// 所有权限的元数据
export const PERMISSION_METADATA: PermissionMetadata[] = [
  // 用户管理权限
  { code: Permission.USER_READ, module: PermissionModule.USER, description: '查看用户' },
  { code: Permission.USER_CREATE, module: PermissionModule.USER, description: '创建用户' },
  { code: Permission.USER_UPDATE, module: PermissionModule.USER, description: '更新用户' },
  { code: Permission.USER_DELETE, module: PermissionModule.USER, description: '删除用户' },
  { code: Permission.USER_RESET_PASSWORD, module: PermissionModule.USER, description: '重置密码' },

  // 组织管理权限
  { code: Permission.ORG_READ, module: PermissionModule.ORG, description: '查看组织' },
  { code: Permission.ORG_CREATE, module: PermissionModule.ORG, description: '创建组织' },
  { code: Permission.ORG_UPDATE, module: PermissionModule.ORG, description: '更新组织' },
  { code: Permission.ORG_DELETE, module: PermissionModule.ORG, description: '删除组织' },

  // 角色管理权限
  { code: Permission.ROLE_READ, module: PermissionModule.ROLE, description: '查看角色' },
  { code: Permission.ROLE_CREATE, module: PermissionModule.ROLE, description: '创建角色' },
  { code: Permission.ROLE_UPDATE, module: PermissionModule.ROLE, description: '更新角色' },
  { code: Permission.ROLE_DELETE, module: PermissionModule.ROLE, description: '删除角色' },
  { code: Permission.ROLE_ASSIGN, module: PermissionModule.ROLE, description: '分配角色' },

  // 审计日志权限
  { code: Permission.AUDIT_READ, module: PermissionModule.AUDIT, description: '查看审计日志' },
  { code: Permission.AUDIT_EXPORT, module: PermissionModule.AUDIT, description: '导出审计日志' },

  // 系统管理权限
  { code: Permission.SYSTEM_SETTINGS, module: PermissionModule.SYSTEM, description: '系统设置' },
];

// 按模块分组的权限
export function getPermissionsByModule(): Record<string, PermissionMetadata[]> {
  const grouped: Record<string, PermissionMetadata[]> = {};

  for (const perm of PERMISSION_METADATA) {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push(perm);
  }

  return grouped;
}

// 数据范围枚举
export enum DataScope {
  ALL = 'ALL', // 全部数据
  ORG_TREE = 'ORG_TREE', // 本部门及子部门
  ORG = 'ORG', // 本部门
  SELF = 'SELF', // 仅本人
}
