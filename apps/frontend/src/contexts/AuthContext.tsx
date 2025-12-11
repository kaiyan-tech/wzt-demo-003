import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { UserSummary } from '@shared';
import { authApi, setToken, clearToken, getToken } from '@/lib/api';

/**
 * 认证上下文类型
 */
interface AuthContextType {
  /** 当前用户，null 表示未登录 */
  user: UserSummary | null;
  /** 是否正在加载认证状态 */
  isLoading: boolean;
  /** 登录 */
  login: (email: string, password: string) => Promise<void>;
  /** 注册 */
  register: (email: string, password: string, name?: string) => Promise<void>;
  /** 登出 */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 认证 Provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查是否已登录
  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // token 无效，清除
          clearToken();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    setToken(accessToken);
    const userData = await authApi.getMe();
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { accessToken } = await authApi.register(email, password, name);
    setToken(accessToken);
    const userData = await authApi.getMe();
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的 Hook
 */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
