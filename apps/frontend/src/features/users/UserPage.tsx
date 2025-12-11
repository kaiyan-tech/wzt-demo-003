import { useState } from 'react';
import type { UserSummary } from '@shared';
import { Permission } from '@shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { PermissionButton } from '@/components/permission';
import { ConfirmDialog } from '@/components/feedback';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgTreeQuery, useRolesQuery, useUsersQuery, useUserMutations } from '@/hooks/api';
import { UserForm, type UserFormData } from './UserForm';

export default function UserPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const deleteConfirm = useConfirm<UserSummary>();

  const usersQuery = useUsersQuery({ page, pageSize: 10 });
  const orgsQuery = useOrgTreeQuery({ enabled: true });
  const rolesQuery = useRolesQuery({ enabled: true });
  const { save, resetPassword, remove } = useUserMutations();

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await save.mutateAsync({ id: editingUser.id, payload: data });
        if (data.password) {
          await resetPassword.mutateAsync({ id: editingUser.id, password: data.password });
        }
      } else {
        await save.mutateAsync({ payload: data });
      }
      toast({ title: '用户已保存' });
      setEditingUser(null);
    } catch (err) {
      toast({ title: '操作失败', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.state.data) return;
    try {
      await remove.mutateAsync(deleteConfirm.state.data.id);
      toast({ title: '用户已删除' });
    } catch (err) {
      toast({ title: '删除失败', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  return (
    <PageContainer
      title="用户管理"
      description="创建账号、分配角色、重置密码"
      actions={
        <Button variant="outline" onClick={() => usersQuery.refetch()}>
          刷新
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* 用户列表 */}
        <div className="space-y-3">
          {usersQuery.data?.items.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => setEditingUser(user)}
              onDelete={() => deleteConfirm.confirm(user)}
            />
          ))}

          {usersQuery.data?.items.length === 0 && (
            <Card className="p-4 text-sm text-muted-foreground">暂无用户</Card>
          )}

          {/* 分页 */}
          {usersQuery.data && usersQuery.data.totalPages > 1 && (
            <Pagination current={page} total={usersQuery.data.totalPages} onChange={setPage} />
          )}
        </div>

        {/* 用户表单 */}
        <UserForm
          key={editingUser?.id ?? 'new'}
          user={editingUser}
          organizations={orgsQuery.data ?? []}
          roles={rolesQuery.data ?? []}
          onSubmit={handleSubmit}
          onCancel={() => setEditingUser(null)}
          isSubmitting={save.isPending || resetPassword.isPending}
        />
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.state.open}
        onOpenChange={(open) => !open && deleteConfirm.reset()}
        title="删除用户"
        description={`确定要删除用户 "${deleteConfirm.state.data?.name}" 吗？此操作不可恢复。`}
        variant="destructive"
        confirmText="删除"
        onConfirm={handleDelete}
        loading={remove.isPending}
      />
    </PageContainer>
  );
}

// 用户卡片组件
function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: UserSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">
            {user.email} · {user.username}
          </div>
          <div className="text-sm text-muted-foreground">
            组织：{user.orgName || '-'} · 角色：{user.roles.map((r) => r.name).join(', ') || '无'}
          </div>
        </div>
        <div className="flex gap-2">
          <PermissionButton
            size="sm"
            variant="outline"
            permission={Permission.USER_UPDATE}
            onClick={onEdit}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            size="sm"
            variant="ghost"
            permission={Permission.USER_DELETE}
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            删除
          </PermissionButton>
        </div>
      </div>
    </Card>
  );
}

// 分页组件
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        上一页
      </Button>
      <span className="text-sm text-muted-foreground">
        {current} / {total}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
      >
        下一页
      </Button>
    </div>
  );
}
