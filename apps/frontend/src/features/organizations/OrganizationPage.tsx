import { useState } from 'react';
import type { OrganizationTreeNode } from '@shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { ConfirmDialog } from '@/components/feedback';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { useOrgMutations, useOrgTreeQuery } from '@/hooks/api';
import { OrganizationForm, type OrgFormData } from './OrganizationForm';
import { OrganizationTree } from './OrganizationTree';

export default function OrganizationPage() {
  const { toast } = useToast();
  const [editingOrg, setEditingOrg] = useState<OrganizationTreeNode | null>(null);
  const deleteConfirm = useConfirm<OrganizationTreeNode>();

  const orgsQuery = useOrgTreeQuery({ enabled: true });
  const { create, update, remove } = useOrgMutations();

  const handleSubmit = async (data: OrgFormData) => {
    try {
      if (editingOrg) {
        await update.mutateAsync({
          id: editingOrg.id,
          payload: data,
        });
        toast({ title: '组织已更新' });
      } else {
        await create.mutateAsync(data);
        toast({ title: '组织已创建' });
      }
      setEditingOrg(null);
    } catch (err) {
      toast({ title: '操作失败', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.state.data) return;
    try {
      await remove.mutateAsync(deleteConfirm.state.data.id);
      toast({ title: '组织已删除' });
    } catch (err) {
      toast({ title: '删除失败', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  const handleCancel = () => {
    setEditingOrg(null);
  };

  return (
    <PageContainer
      title="组织管理"
      description="支持树状结构，调整上级与排序"
      actions={
        <Button variant="outline" onClick={() => orgsQuery.refetch()}>
          刷新
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* 组织树 */}
        <Card className="min-h-[360px] p-4">
          {orgsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : (orgsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">暂无组织数据</p>
          ) : (
            <OrganizationTree
              nodes={orgsQuery.data ?? []}
              onEdit={setEditingOrg}
              onDelete={(org) => deleteConfirm.confirm(org)}
            />
          )}
        </Card>

        {/* 组织表单 */}
        <OrganizationForm
          key={editingOrg?.id ?? 'new'}
          organization={editingOrg}
          organizations={orgsQuery.data ?? []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={create.isPending || update.isPending}
        />
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.state.open}
        onOpenChange={(open) => !open && deleteConfirm.reset()}
        title="删除组织"
        description={`确定要删除组织 "${deleteConfirm.state.data?.name}" 吗？此操作不可恢复。`}
        variant="destructive"
        confirmText="删除"
        onConfirm={handleDelete}
        loading={remove.isPending}
      />
    </PageContainer>
  );
}
