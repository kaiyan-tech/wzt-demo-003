import {
  Building2,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Settings,
  Shield,
  Table,
  Users,
} from 'lucide-react';
import { Permission } from '@shared';
import type { MenuConfig } from './menu.types';

export const menuConfig: MenuConfig = [
  {
    key: 'dashboard',
    label: '控制台',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    key: 'system',
    label: '系统管理',
    icon: Settings,
    children: [
      {
        key: 'orgs',
        label: '组织管理',
        icon: Building2,
        path: '/orgs',
        permissions: [Permission.ORG_READ],
      },
      {
        key: 'users',
        label: '用户管理',
        icon: Users,
        path: '/users',
        permissions: [Permission.USER_READ],
      },
      {
        key: 'roles',
        label: '角色权限',
        icon: Shield,
        path: '/roles',
        permissions: [Permission.ROLE_READ],
      },
    ],
  },
  {
    key: 'audit',
    label: '审计日志',
    icon: FileText,
    path: '/audit',
    permissions: [Permission.AUDIT_READ],
  },
  {
    key: 'demo',
    label: '开发示例',
    icon: FlaskConical,
    children: [
      {
        key: 'data-table-demo',
        label: 'DataTable 组件',
        icon: Table,
        path: '/demo/data-table',
      },
    ],
  },
];
