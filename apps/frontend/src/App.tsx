import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Permission } from '@shared';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionRoute } from '@/components/permission';
import { AdminLayout } from '@/components/layout/AdminLayout';
// 使用新的 features 模块
import { HomePage } from '@/features/dashboard';
import { OrganizationPage } from '@/features/organizations';
import { RolePage } from '@/features/roles';
import { UserPage } from '@/features/users';
import { DataTableDemo } from '@/features/demo';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionProvider>
          <BrowserRouter>
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 受保护路由 */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route
                  path="orgs"
                  element={
                    <PermissionRoute permission={Permission.ORG_READ}>
                      <OrganizationPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="roles"
                  element={
                    <PermissionRoute permission={Permission.ROLE_READ}>
                      <RolePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <PermissionRoute permission={Permission.USER_READ}>
                      <UserPage />
                    </PermissionRoute>
                  }
                />
                <Route path="demo/data-table" element={<DataTableDemo />} />
                <Route path="403" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Toaster />
          </BrowserRouter>
        </PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
