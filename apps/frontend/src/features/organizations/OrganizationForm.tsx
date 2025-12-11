import { useMemo, useState, type FormEvent } from 'react';
import { Permission, type OrganizationTreeNode } from '@shared';
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
import { PermissionGuard } from '@/components/permission';

export interface OrgFormData {
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
}

interface OrganizationFormProps {
  organization: OrganizationTreeNode | null;
  organizations: OrganizationTreeNode[];
  onSubmit: (data: OrgFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

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

export function OrganizationForm({
  organization,
  organizations,
  onSubmit,
  onCancel,
  isSubmitting,
}: OrganizationFormProps) {
  const isEditing = !!organization;

  const [form, setForm] = useState<OrgFormData>({
    name: organization?.name ?? '',
    code: organization?.code ?? '',
    parentId: organization?.parentId ?? null,
    sortOrder: organization?.sortOrder ?? 0,
  });

  const orgOptions = useMemo(() => flattenOrgs(organizations), [organizations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{isEditing ? '编辑组织' : '新建组织'}</h3>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>

      <PermissionGuard
        permission={isEditing ? Permission.ORG_UPDATE : Permission.ORG_CREATE}
        fallback={<p className="text-sm text-muted-foreground">暂无权限</p>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">编码</Label>
            <Input
              id="code"
              required
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>上级组织</Label>
            <Select
              value={form.parentId ?? '__none__'}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, parentId: v === '__none__' ? null : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="无（设为根节点）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无（设为根节点）</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {'· '.repeat(org.level) + org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序</Label>
            <Input
              id="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : isEditing ? '保存' : '创建'}
          </Button>
        </form>
      </PermissionGuard>
    </Card>
  );
}
