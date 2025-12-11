import { Permission, type OrganizationTreeNode } from '@shared';
import { PermissionButton } from '@/components/permission';

interface OrganizationTreeProps {
  nodes: OrganizationTreeNode[];
  onEdit: (org: OrganizationTreeNode) => void;
  onDelete: (org: OrganizationTreeNode) => void;
}

export function OrganizationTree({ nodes, onEdit, onDelete }: OrganizationTreeProps) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <ul className="space-y-2">
      {nodes.map((node) => (
        <li key={node.id} className="rounded-md border bg-card p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{node.name}</div>
              <div className="text-xs text-muted-foreground">编码：{node.code}</div>
            </div>
            <div className="flex gap-2">
              <PermissionButton
                size="sm"
                variant="outline"
                permission={Permission.ORG_UPDATE}
                onClick={() => onEdit(node)}
              >
                编辑
              </PermissionButton>
              <PermissionButton
                size="sm"
                variant="ghost"
                permission={Permission.ORG_DELETE}
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(node)}
              >
                删除
              </PermissionButton>
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="mt-2 border-l pl-4">
              <OrganizationTree nodes={node.children} onEdit={onEdit} onDelete={onDelete} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
