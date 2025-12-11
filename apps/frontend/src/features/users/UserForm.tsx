import { useMemo, useState } from 'react';
import type { OrganizationTreeNode, RoleDto, UserStatus, UserSummary } from '@shared';
import { Permission } from '@shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGuard } from '@/components/permission';
import { useHasPermission } from '@/hooks/useHasPermission';

export interface UserFormData {
  username: string;
  email: string;
  name: string;
  password: string;
  orgId: string;
  status: UserStatus;
  roleIds: string[];
}

interface UserFormProps {
  user: UserSummary | null;
  organizations: OrganizationTreeNode[];
  roles: RoleDto[];
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: '正常' },
  { value: 'INACTIVE', label: '停用' },
  { value: 'LOCKED', label: '锁定' },
];

function flattenOrgs(
  orgs: OrganizationTreeNode[],
  level = 0,
): Array<OrganizationTreeNode & { level: number }> {
  const result: Array<OrganizationTreeNode & { level: number }> = [];
  for (const org of orgs) {
    result.push({ ...org, level });
    if (org.children && org.children.length > 0) {
      result.push(...flattenOrgs(org.children, level + 1));
    }
  }
  return result;
}

export function UserForm({
  user,
  organizations,
  roles,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserFormProps) {
  const isEditing = !!user;
  const canResetPassword = useHasPermission(Permission.USER_RESET_PASSWORD);

  const [form, setForm] = useState<UserFormData>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    name: user?.name ?? '',
    password: '',
    orgId: user?.orgId ?? '',
    status: user?.status ?? 'ACTIVE',
    roleIds: user?.roles.map((r) => r.id) ?? [],
  });

  const orgOptions = useMemo(() => flattenOrgs(organizations), [organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const updateField = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRole = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{isEditing ? '编辑用户' : '新建用户'}</h3>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>

      <PermissionGuard
        permission={isEditing ? Permission.USER_UPDATE : Permission.USER_CREATE}
        fallback={<p className="text-sm text-muted-foreground">暂无权限</p>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {isEditing && canResetPassword && (
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码（可选）</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="留空则不修改"
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>组织</Label>
            <Select value={form.orgId} onValueChange={(v) => updateField('orgId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择组织" />
              </SelectTrigger>
              <SelectContent>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {'· '.repeat(org.level) + org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>状态</Label>
            <Select
              value={form.status}
              onValueChange={(v) => updateField('status', v as UserStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>角色</Label>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.roleIds.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  {role.name}
                </label>
              ))}
              {roles.length === 0 && <p className="text-sm text-muted-foreground">暂无角色</p>}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : isEditing ? '保存' : '创建'}
          </Button>
        </form>
      </PermissionGuard>
    </Card>
  );
}
