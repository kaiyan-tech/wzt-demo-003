import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 使用 Pino Logger - 参考《开沿工程指导手册》5.1 节
  app.useLogger(app.get(Logger));

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 配置（支持逗号分隔多域名，避免凭证模式下的通配符）
  const allowOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ['http://localhost:5173'];

  app.enableCors({
    origin: allowOrigins,
    credentials: true,
  });

  // API 前缀
  app.setGlobalPrefix('api');

  // FC Custom Runtime 使用 FC_SERVER_PORT，本地开发使用 PORT 或默认 9000
  const port = process.env.FC_SERVER_PORT || process.env.PORT || 9000;
  await app.listen(port, '0.0.0.0');

  app.get(Logger).log(`HTTP server listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
