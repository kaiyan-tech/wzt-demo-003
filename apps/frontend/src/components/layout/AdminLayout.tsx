import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Breadcrumb } from './Breadcrumb';
import { SidebarMenu } from './SidebarMenu';

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      {/* 直接并列 Sidebar 和 SidebarInset，不加额外包装 */}
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg font-semibold text-primary">开沿</span>
            <span className="text-sm text-muted-foreground">Framework</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu />
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="px-2 text-xs text-sidebar-foreground/70">开沿权限基座</div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <div className="text-sm font-medium">{user.name || user.username}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              退出
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
