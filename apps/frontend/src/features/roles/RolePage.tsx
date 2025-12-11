import { useState } from 'react';
import {
  DataScope,
  Permission,
  PERMISSION_METADATA,
  getPermissionsByModule,
  type PermissionDto,
  type RoleDto,
} from '@shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { PermissionButton } from '@/components/permission';
import { ConfirmDialog } from '@/components/feedback';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { usePermissionsQuery, useRoleMutations, useRolesQuery } from '@/hooks/api';
import { RoleForm, type RoleFormData } from './RoleForm';

const DATA_SCOPE_LABELS: Record<DataScope, string> = {
  [DataScope.ALL]: '全部数据',
  [DataScope.ORG_TREE]: '本部门及子部门',
  [DataScope.ORG]: '本部门',
  [DataScope.SELF]: '仅本人',
};

export default function RolePage() {
  const { toast } = useToast();
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const deleteConfirm = useConfirm<RoleDto>();

  const rolesQuery = useRolesQuery({ enabled: true });
  const permissionsQuery = usePermissionsQuery({
    enabled: true,
    initialData: {
      items: PERMISSION_METADATA as PermissionDto[],
      grouped: getPermissionsByModule() as Record<string, PermissionDto[]>,
    },
  });
  const { save, remove } = useRoleMutations();

  const permissions = permissionsQuery.data?.grouped ?? {};

  const handleSubmit = async (data: RoleFormData) => {
    try {
      await save.mutateAsync({
        id: editingRole?.id,
        payload: data,
      });
      toast({ title: '角色已保存' });
      setEditingRole(null);
    } catch (err) {
      toast({ title: '保存失败', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.state.data) return;
    try {
      await remove.mutateAsync(deleteConfirm.state.data.id);
      toast({ title: '角色已删除' });
    } catch (err) {
      toast({ title: '删除失败', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
  };

  return (
    <PageContainer
      title="角色与权限"
      description="配置数据范围与权限点，供用户分配"
      actions={
        <Button variant="outline" onClick={() => rolesQuery.refetch()}>
          刷新
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* 角色列表 */}
        <div className="space-y-3">
          {rolesQuery.data?.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => setEditingRole(role)}
              onDelete={() => deleteConfirm.confirm(role)}
            />
          ))}

          {rolesQuery.data?.length === 0 && (
            <Card className="p-4 text-sm text-muted-foreground">暂无角色，请创建</Card>
          )}
        </div>

        {/* 角色表单 */}
        <RoleForm
          key={editingRole?.id ?? 'new'}
          role={editingRole}
          permissions={permissions}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={save.isPending}
        />
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.state.open}
        onOpenChange={(open) => !open && deleteConfirm.reset()}
        title="删除角色"
        description={`确定要删除角色 "${deleteConfirm.state.data?.name}" 吗？此操作不可恢复。`}
        variant="destructive"
        confirmText="删除"
        onConfirm={handleDelete}
        loading={remove.isPending}
      />
    </PageContainer>
  );
}

// 角色卡片组件
function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-medium">{role.name}</div>
          <div className="text-sm text-muted-foreground">
            数据范围：{DATA_SCOPE_LABELS[role.dataScope as DataScope] ?? role.dataScope}
          </div>
          <div className="text-sm text-muted-foreground">
            权限：{role.permissionCodes.length > 0 ? `${role.permissionCodes.length} 项` : '无'}
          </div>
        </div>
        <div className="flex gap-2">
          <PermissionButton
            size="sm"
            variant="outline"
            permission={Permission.ROLE_UPDATE}
            onClick={onEdit}
          >
            编辑
          </PermissionButton>
          {!role.isSystem && (
            <PermissionButton
              size="sm"
              variant="ghost"
              permission={Permission.ROLE_DELETE}
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              删除
            </PermissionButton>
          )}
        </div>
      </div>
    </Card>
  );
}
