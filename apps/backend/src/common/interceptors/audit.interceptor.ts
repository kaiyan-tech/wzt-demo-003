import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { CurrentUser } from '../scoped.service';

type AuthenticatedRequest = Request & { user?: CurrentUser | null };

/**
 * 审计日志拦截器
 *
 * 自动记录所有写操作(POST、PUT、DELETE、PATCH)的审计日志
 *
 * 记录内容:
 * - 操作用户
 * - HTTP 方法和路径
 * - 请求参数(自动过滤敏感信息)
 * - 客户端 IP
 * - 请求耗时
 *
 * 敏感信息过滤:
 * - password
 * - passwordHash
 * - token
 * - secret
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;

    // 只记录写操作
    const shouldAudit = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (!shouldAudit) {
      return next.handle();
    }

    const startTime = Date.now();
    const user = request.user;

    // 如果没有用户信息(公开接口),跳过审计
    if (!user || !user.id) {
      return next.handle();
    }

    const path = request.url;
    const params = this.sanitizeParams({
      body: request.body as unknown,
      query: request.query as unknown,
      params: request.params as unknown,
    });

    // 获取客户端 IP
    const ipCandidate: string | string[] | undefined =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      'unknown';
    const ip = Array.isArray(ipCandidate) ? ipCandidate[0] : ipCandidate;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // 异步写入审计日志,不阻塞响应
        void this.prisma.auditLog
          .create({
            data: {
              userId: user.id,
              action: `${method} ${path}`,
              method,
              path,
              params,
              ip,
              duration,
            },
          })
          .catch((error) => {
            // 审计日志写入失败不应影响业务
            console.error('Failed to create audit log:', error);
          });
      }),
    );
  }

  /**
   * 过滤敏感信息
   */
  private sanitizeParams(params: unknown): Prisma.InputJsonValue {
    const sensitiveFields = new Set([
      'password',
      'passwordhash',
      'password_hash',
      'token',
      'accesstoken',
      'refreshtoken',
      'secret',
      'apikey',
      'api_key',
    ]);

    const sanitize = (value: unknown): Prisma.InputJsonValue => {
      if (value === null || value === undefined) {
        return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
      }
      if (Array.isArray(value)) {
        return value.map(sanitize) as unknown as Prisma.InputJsonValue;
      }
      if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        const result: Record<string, Prisma.InputJsonValue> = {};
        for (const [key, val] of entries) {
          result[key] = sensitiveFields.has(key.toLowerCase()) ? '***' : sanitize(val);
        }
        return result as Prisma.InputJsonValue;
      }
      if (['string', 'number', 'boolean'].includes(typeof value)) {
        return value as Prisma.InputJsonValue;
      }
      const stringified = JSON.stringify(value) ?? '';
      return stringified as Prisma.InputJsonValue;
    };

    return sanitize(params);
  }
}
