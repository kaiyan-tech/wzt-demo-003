import { useMemo, useState } from 'react';
import { DataScope, Permission, PermissionModule, type PermissionDto, type RoleDto } from '@shared';
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

export interface RoleFormData {
  name: string;
  description: string;
  dataScope: DataScope;
  permissionCodes: Permission[];
}

interface RoleFormProps {
  role: RoleDto | null;
  permissions: Record<string, PermissionDto[]>;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DATA_SCOPE_OPTIONS: Array<{ label: string; value: DataScope }> = [
  { label: '全部数据', value: DataScope.ALL },
  { label: '本部门及子部门', value: DataScope.ORG_TREE },
  { label: '本部门', value: DataScope.ORG },
  { label: '仅本人', value: DataScope.SELF },
];

const PERMISSION_MODULE_LABELS: Record<PermissionModule, string> = {
  [PermissionModule.USER]: '用户管理',
  [PermissionModule.ORG]: '组织管理',
  [PermissionModule.ROLE]: '角色管理',
  [PermissionModule.AUDIT]: '审计日志',
  [PermissionModule.SYSTEM]: '系统设置',
};

export function RoleForm({ role, permissions, onSubmit, onCancel, isSubmitting }: RoleFormProps) {
  const isEditing = !!role;
  const allPermissions = useMemo(() => Object.values(Permission) as Permission[], []);
  const permissionSet = useMemo(() => new Set<Permission>(allPermissions), [allPermissions]);

  const [form, setForm] = useState<RoleFormData>({
    name: role?.name ?? '',
    description: role?.description ?? '',
    dataScope: (role?.dataScope as DataScope) ?? DataScope.SELF,
    permissionCodes:
      role?.permissionCodes.filter((code): code is Permission =>
        permissionSet.has(code as Permission),
      ) ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const togglePermission = (code: string) => {
    if (!permissionSet.has(code as Permission)) return;
    const permissionCode = code as Permission;
    setForm((prev) => ({
      ...prev,
      permissionCodes: prev.permissionCodes.includes(permissionCode)
        ? prev.permissionCodes.filter((c) => c !== permissionCode)
        : [...prev.permissionCodes, permissionCode],
    }));
  };

  const selectAllPermissions = () =>
    setForm((prev) => ({ ...prev, permissionCodes: allPermissions }));

  const clearPermissions = () => setForm((prev) => ({ ...prev, permissionCodes: [] }));

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{isEditing ? '编辑角色' : '新建角色'}</h3>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>

      <PermissionGuard
        permission={isEditing ? Permission.ROLE_UPDATE : Permission.ROLE_CREATE}
        fallback={<p className="text-sm text-muted-foreground">暂无权限</p>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>数据范围</Label>
            <Select
              value={form.dataScope}
              onValueChange={(v) => setForm((prev) => ({ ...prev, dataScope: v as DataScope }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SCOPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>权限点</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={clearPermissions}>
                  清空
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={selectAllPermissions}>
                  全部选中
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-auto rounded-md border p-3">
              {Object.entries(permissions).map(([module, perms]) => (
                <div key={module} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold mb-2">
                    {PERMISSION_MODULE_LABELS[module as PermissionModule] ?? module}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {perms.map((perm) => (
                      <label key={perm.code} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.permissionCodes.includes(perm.code as Permission)}
                          onCheckedChange={() => togglePermission(perm.code)}
                        />
                        {perm.description}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(permissions).length === 0 && (
                <p className="text-sm text-muted-foreground">暂无权限清单</p>
              )}
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
