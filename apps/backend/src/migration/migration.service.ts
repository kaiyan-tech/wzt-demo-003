import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PERMISSION_METADATA } from '@shared';
import { PrismaMigrationRunner, MigrationResult } from './prisma-migration.runner';
import { RunMigrationDto } from './dto/run-migration.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly runner: PrismaMigrationRunner,
    private readonly prisma: PrismaService,
  ) {}

  async runMigration(dto: RunMigrationDto): Promise<MigrationResult> {
    const { gitSha } = dto;

    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      const errorMsg = 'DATABASE_URL is not configured';
      this.logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        stdout: '',
        stderr: '',
      };
    }

    this.logger.log(`Starting migration for production environment, gitSha: ${gitSha || 'N/A'}`);

    const result = await this.runner.runMigration(databaseUrl);

    if (result.success) {
      this.logger.log('Migration completed for production environment');
    } else {
      this.logger.error(`Migration failed for production environment: ${result.stderr}`);
    }

    return result;
  }

  async runSeed(): Promise<{ created: boolean; adminExists: boolean }> {
    this.logger.log('Starting seed execution');

    await this.ensureRequiredTables();
    await this.syncPermissions();
    const rootOrg = await this.upsertRootOrganization();
    const adminRole = await this.upsertAdminRole();
    await this.assignAllPermissions(adminRole.id);
    const { user: adminUser, created } = await this.ensureAdminUser(rootOrg.id);
    await this.ensureUserRole(adminUser.id, adminRole.id);
    await this.upsertSampleOrganizations(rootOrg.id);
    await this.upsertDefaultUserRole();

    this.logger.log('Seed execution finished');
    return { created, adminExists: !created };
  }

  private async ensureRequiredTables() {
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const existingTables = tables.map((row) => row.tablename?.toString().toLowerCase());
    const requiredTables = [
      'organizations',
      'users',
      'roles',
      'permissions',
      'user_roles',
      'role_permissions',
      'audit_logs',
    ];
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table));
    if (missingTables.length > 0) {
      const message = `数据库缺少必要的表: ${missingTables.join(', ')}，请先执行迁移`;
      this.logger.error(message);
      throw new Error(message);
    }
  }

  private async syncPermissions() {
    for (const perm of PERMISSION_METADATA) {
      await this.prisma.permission.upsert({
        where: { code: perm.code },
        update: {
          module: perm.module,
          description: perm.description,
        },
        create: {
          code: perm.code,
          module: perm.module,
          description: perm.description,
        },
      });
    }
  }

  private async upsertRootOrganization() {
    const rootOrg = await this.prisma.organization.upsert({
      where: { code: 'ROOT' },
      update: {},
      create: {
        name: '总公司',
        code: 'ROOT',
        path: '',
        level: 0,
        sortOrder: 0,
      },
    });

    if (rootOrg.path !== `/${rootOrg.id}/`) {
      await this.prisma.organization.update({
        where: { id: rootOrg.id },
        data: { path: `/${rootOrg.id}/` },
      });
    }

    return rootOrg;
  }

  private async upsertAdminRole() {
    return this.prisma.role.upsert({
      where: { name: '超级管理员' },
      update: {},
      create: {
        name: '超级管理员',
        description: '系统超级管理员，拥有所有权限',
        isSystem: true,
        dataScope: 'ALL',
      },
    });
  }

  private async assignAllPermissions(adminRoleId: string) {
    for (const perm of PERMISSION_METADATA) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionCode: {
            roleId: adminRoleId,
            permissionCode: perm.code,
          },
        },
        update: {},
        create: {
          roleId: adminRoleId,
          permissionCode: perm.code,
        },
      });
    }
  }

  private async ensureAdminUser(orgId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      return { user: existing, created: false };
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await this.prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        name: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        status: 'ACTIVE',
        orgId,
      },
    });

    return { user, created: true };
  }

  private async ensureUserRole(userId: string, roleId: string) {
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
  }

  private async upsertSampleOrganizations(rootOrgId: string) {
    const techDept = await this.prisma.organization.upsert({
      where: { code: 'TECH' },
      update: {},
      create: {
        name: '技术部',
        code: 'TECH',
        parentId: rootOrgId,
        path: '',
        level: 1,
        sortOrder: 1,
      },
    });
    if (techDept.path !== `/${rootOrgId}/${techDept.id}/`) {
      await this.prisma.organization.update({
        where: { id: techDept.id },
        data: { path: `/${rootOrgId}/${techDept.id}/` },
      });
    }

    const salesDept = await this.prisma.organization.upsert({
      where: { code: 'SALES' },
      update: {},
      create: {
        name: '销售部',
        code: 'SALES',
        parentId: rootOrgId,
        path: '',
        level: 1,
        sortOrder: 2,
      },
    });
    if (salesDept.path !== `/${rootOrgId}/${salesDept.id}/`) {
      await this.prisma.organization.update({
        where: { id: salesDept.id },
        data: { path: `/${rootOrgId}/${salesDept.id}/` },
      });
    }
  }

  private async upsertDefaultUserRole() {
    const userRole = await this.prisma.role.upsert({
      where: { name: '普通用户' },
      update: {},
      create: {
        name: '普通用户',
        description: '普通用户角色，具有基本查看权限',
        isSystem: false,
        dataScope: 'SELF',
      },
    });

    const basicPermissions = ['user:read', 'org:read', 'role:read'];
    for (const permCode of basicPermissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionCode: {
            roleId: userRole.id,
            permissionCode: permCode,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionCode: permCode,
        },
      });
    }
  }
}
