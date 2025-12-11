import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSION_METADATA } from '@shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始执行数据库种子脚本...');

  // 1. 同步权限到数据库
  console.log('\n📋 同步权限...');
  for (const perm of PERMISSION_METADATA) {
    await prisma.permission.upsert({
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
    console.log(`  ✓ ${perm.code} - ${perm.description}`);
  }
  console.log(`✅ 同步了 ${PERMISSION_METADATA.length} 个权限`);

  // 2. 创建根组织
  console.log('\n🏢 创建根组织...');
  const rootOrg = await prisma.organization.upsert({
    where: { code: 'ROOT' },
    update: {},
    create: {
      name: '总公司',
      code: 'ROOT',
      path: '', // 占位,创建后更新为实际 ID
      level: 0,
      sortOrder: 0,
    },
  });
  await prisma.organization.update({
    where: { id: rootOrg.id },
    data: { path: `/${rootOrg.id}/` },
  });
  console.log(`  ✓ 创建根组织: ${rootOrg.name}`);

  // 3. 创建超级管理员角色
  console.log('\n👑 创建超级管理员角色...');
  const adminRole = await prisma.role.upsert({
    where: { name: '超级管理员' },
    update: {},
    create: {
      name: '超级管理员',
      description: '系统超级管理员，拥有所有权限',
      isSystem: true,
      dataScope: 'ALL',
    },
  });
  console.log(`  ✓ 创建角色: ${adminRole.name}`);

  // 4. 为超级管理员角色分配所有权限
  console.log('\n🔐 分配权限...');
  for (const perm of PERMISSION_METADATA) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionCode: {
          roleId: adminRole.id,
          permissionCode: perm.code,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionCode: perm.code,
      },
    });
  }
  console.log(`  ✓ 为超级管理员分配了 ${PERMISSION_METADATA.length} 个权限`);

  // 5. 创建超级管理员用户
  console.log('\n👤 创建超级管理员用户...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      name: '系统管理员',
      email: 'admin@example.com',
      phone: '13808520487',
      status: 'ACTIVE',
      orgId: rootOrg.id,
    },
  });
  console.log(`  ✓ 创建用户: ${adminUser.username}`);
  console.log(`  ℹ️  默认密码: admin123`);
  console.log(`  ⚠️  生产环境请立即修改密码！`);

  // 6. 为管理员用户分配超级管理员角色
  console.log('\n🔗 分配角色...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log(`  ✓ 为 ${adminUser.username} 分配 ${adminRole.name} 角色`);

  // 7. 创建示例组织（可选）
  console.log('\n🏗️  创建示例组织结构...');

  const techDept = await prisma.organization.upsert({
    where: { code: 'TECH' },
    update: {},
    create: {
      name: '技术部',
      code: 'TECH',
      parentId: rootOrg.id,
      path: '', // 占位,创建后更新为实际 ID
      level: 1,
      sortOrder: 1,
    },
  });
  await prisma.organization.update({
    where: { id: techDept.id },
    data: { path: `/${rootOrg.id}/${techDept.id}/` },
  });
  console.log(`  ✓ 创建部门: ${techDept.name}`);

  const salesDept = await prisma.organization.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      name: '销售部',
      code: 'SALES',
      parentId: rootOrg.id,
      path: '', // 占位,创建后更新为实际 ID
      level: 1,
      sortOrder: 2,
    },
  });
  await prisma.organization.update({
    where: { id: salesDept.id },
    data: { path: `/${rootOrg.id}/${salesDept.id}/` },
  });
  console.log(`  ✓ 创建部门: ${salesDept.name}`);

  // 8. 创建普通用户角色示例
  console.log('\n📝 创建示例角色...');

  const userRole = await prisma.role.upsert({
    where: { name: '普通用户' },
    update: {},
    create: {
      name: '普通用户',
      description: '普通用户角色，具有基本查看权限',
      isSystem: false,
      dataScope: 'SELF',
    },
  });
  console.log(`  ✓ 创建角色: ${userRole.name}`);

  // 为普通用户角色分配基本权限
  const basicPermissions = ['user:read', 'org:read', 'role:read'];
  for (const permCode of basicPermissions) {
    await prisma.rolePermission.upsert({
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
  console.log(`  ✓ 为普通用户分配了 ${basicPermissions.length} 个基本权限`);

  console.log('\n✅ 数据库种子数据创建完成！');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 统计信息:');
  console.log(`  • 权限: ${PERMISSION_METADATA.length} 个`);
  console.log(`  • 组织: ${await prisma.organization.count()} 个`);
  console.log(`  • 角色: ${await prisma.role.count()} 个`);
  console.log(`  • 用户: ${await prisma.user.count()} 个`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
