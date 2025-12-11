import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';

export interface MigrationResult {
  success: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
}

@Injectable()
export class PrismaMigrationRunner {
  private readonly logger = new Logger(PrismaMigrationRunner.name);

  /**
   * 执行 Prisma 迁移
   * @param databaseUrl 可选，传入时会覆盖环境变量中的 DATABASE_URL
   */
  async runMigration(databaseUrl?: string): Promise<MigrationResult> {
    this.logger.log(`Starting prisma migrate deploy.`);

    // FC3 custom.debian12 环境中，直接用 node 运行 prisma CLI
    // 避免 npx 路径查找问题
    const isFC = !!process.env.FC_SERVER_PORT;
    let cmd: string;
    let args: string[];

    if (process.platform === 'win32') {
      cmd = 'npx.cmd';
      args = ['prisma', 'migrate', 'deploy'];
    } else if (isFC) {
      // FC 环境：直接用 node 运行 prisma CLI 入口
      cmd = '/var/fc/lang/nodejs22/bin/node';
      args = [join(process.cwd(), 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'];
    } else {
      cmd = 'npx';
      args = ['prisma', 'migrate', 'deploy'];
    }

    // FC3 custom.debian12 环境中 node 不在默认 PATH，需要添加（供 prisma 内部调用）
    const spawnEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...(isFC ? { PATH: `/var/fc/lang/nodejs22/bin:${process.env.PATH || ''}` } : {}),
      ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
    };

    this.logger.log(`Running: ${cmd} ${args.join(' ')}`);

    return new Promise<MigrationResult>((resolve) => {
      const child = spawn(cmd, args, {
        env: spawnEnv,
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        this.logger.error(`Prisma migrate deploy failed to start.`, error?.stack || error);
        resolve({
          success: false,
          message: `Prisma migrate deploy failed to start: ${error?.message || String(error)}`,
          stderr,
        });
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`Prisma migrate deploy finished.`);
          resolve({
            success: true,
            message: 'Prisma migrate deploy succeeded',
            stdout,
            stderr,
          });
        } else {
          this.logger.error(`Prisma migrate deploy failed. exitCode=${code}`, stderr);
          resolve({
            success: false,
            message: `Prisma migrate deploy failed with exit code ${code}`,
            stdout,
            stderr,
          });
        }
      });
    });
  }
}
