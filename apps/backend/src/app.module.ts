import { Module } from '@nestjs/common';
import { Request } from 'express';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MigrationModule } from './migration/migration.module';
import { OrganizationModule } from './organization/organization.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JSON 日志配置 - 参考《开沿工程指导手册》5.1 节
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        // 自定义日志字段
        customProps: (req: Request & { id?: string; user?: { id?: string } }) => {
          const userId = req.user?.id ?? null;
          const requestId = (req.headers['x-fc-request-id'] as string | undefined) || req.id;
          return {
            requestId,
            userId,
            context: {
              path: req.url,
              method: req.method,
            },
          };
        },
      },
    }),

    // 数据库模块
    PrismaModule,

    // 业务模块
    AuthModule,
    UserModule,
    MigrationModule,
    OrganizationModule,
    RoleModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
