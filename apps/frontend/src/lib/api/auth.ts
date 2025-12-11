import type { AuthResponse, LoginDto, RegisterDto, UserSummary } from '@shared';
import { apiRequest } from './client';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (email: LoginDto['email'], password: LoginDto['password']) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * 用户注册
   */
  register: (
    email: RegisterDto['email'],
    password: RegisterDto['password'],
    name?: RegisterDto['name'],
  ) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  /**
   * 获取当前用户信息
   */
  getMe: () => apiRequest<UserSummary>('/api/auth/me'),
};
