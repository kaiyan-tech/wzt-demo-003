import type { HealthCheckResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/PageContainer';
import { useHealthQuery } from '@/hooks/api';

export default function HomePage() {
  const healthQuery = useHealthQuery({ enabled: true });

  return (
    <PageContainer title="控制台" description="欢迎使用开沿权限基座框架">
      <OverviewPanel
        health={healthQuery.data}
        isLoading={healthQuery.isLoading}
        onRefresh={() => healthQuery.refetch()}
      />
    </PageContainer>
  );
}

function OverviewPanel({
  health,
  isLoading,
  onRefresh,
}: {
  health?: HealthCheckResponse;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <h3 className="mb-2 text-lg font-semibold">系统状态</h3>
            <p className="mb-4 text-muted-foreground">基础鉴权与健康检查已接入。</p>
            <div className="space-y-2 text-sm">
              <div>
                后端状态:{' '}
                {isLoading ? (
                  <span className="text-yellow-500">检查中...</span>
                ) : health ? (
                  <span className="text-green-600">正常</span>
                ) : (
                  <span className="text-red-500">未连接</span>
                )}
              </div>
              {health && (
                <>
                  <div>版本：{health.version}</div>
                  <div>时间：{new Date(health.timestamp).toLocaleString()}</div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onRefresh}>刷新状态</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">功能导航</h4>
          <p className="mt-2 text-2xl font-bold">组织管理</p>
          <p className="mt-1 text-sm text-muted-foreground">管理企业组织架构</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">功能导航</h4>
          <p className="mt-2 text-2xl font-bold">用户管理</p>
          <p className="mt-1 text-sm text-muted-foreground">管理系统用户账号</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">功能导航</h4>
          <p className="mt-2 text-2xl font-bold">角色权限</p>
          <p className="mt-1 text-sm text-muted-foreground">配置角色与权限</p>
        </Card>
      </div>
    </div>
  );
}
