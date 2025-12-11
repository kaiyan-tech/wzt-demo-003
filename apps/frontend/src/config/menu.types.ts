import type { LucideIcon } from 'lucide-react';
import type { Permission } from '@shared';

export interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  permissions?: Permission[];
  children?: MenuItem[];
  hidden?: boolean;
}

export type MenuConfig = MenuItem[];
