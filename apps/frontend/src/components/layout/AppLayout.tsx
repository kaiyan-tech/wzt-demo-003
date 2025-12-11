import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
import { SidebarMenu } from './SidebarMenu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold">
              <span className="text-primary">开沿</span>
              <span className="text-muted-foreground">Framework</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu />
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            {user ? (
              <div className="space-y-2 rounded-md border bg-sidebar/60 p-3 text-xs">
                <div className="font-semibold text-sidebar-foreground">
                  {user.name || user.username}
                </div>
                <div className="text-sidebar-foreground/70">{user.email}</div>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                    退出登录
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">登录</Link>
              </Button>
            )}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-14 items-center gap-2 border-b bg-white px-3 shadow-sm">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">权限基座控制台</div>
          </div>
          <div className="flex-1 bg-slate-50">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
