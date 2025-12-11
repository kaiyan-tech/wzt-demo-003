#!/usr/bin/env node

/**
 * 开沿框架一站式初始化脚本
 * 在 git clone 后运行，完成所有配置和部署
 *
 * 功能：
 * 1. 收集配置信息（交互式或命令行参数）
 * 2. 重置 Git 历史
 * 3. 初始化本地开发环境（Docker PostgreSQL）
 * 4. 创建阿里云资源（OSS Bucket）
 * 5. 部署到阿里云 FC
 * 6. 创建 GitHub 仓库并同步 Secrets
 * 7. 推送代码触发 CI/CD
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// 颜色和日志
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

const useColor = Boolean(process.stdout.isTTY);
const c = (code, text) => (useColor ? `${code}${text}${colors.reset}` : text);

const log = (...args) => console.log(c(colors.cyan, '[setup]'), ...args);
const warn = (...args) => console.warn(c(colors.yellow, '[setup][warn]'), ...args);
const error = (...args) => {
  console.error(c(colors.red, '[setup][error]'), ...args);
  process.exit(1);
};
const success = (msg) => console.log(c(colors.green, '  ✓'), msg);
const step = (n, total, msg) => console.log(c(colors.blue, `\n[${n}/${total}]`), msg);

const rl = createInterface({ input, output });

// ============================================
// 工具函数
// ============================================

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    if (arg === '--skip-cloud') {
      flags.skipCloud = true;
      continue;
    }
    if (arg === '--skip-local-db') {
      flags.skipLocalDb = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const [k, v] = arg.replace(/^--/, '').split('=');
      if (v !== undefined) {
        flags[k] = v;
        continue;
      }

      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[k] = next;
        i++;
      } else {
        flags[k] = true;
      }
      continue;
    }
    rest.push(arg);
  }
  return { flags, rest };
}

function printHelp() {
  console.log(`
开沿框架一站式初始化脚本

用法: ./scripts/setup.sh [options]

必填参数（缺省则进入交互模式）：
  --name <name>              项目名称
  --github-org <org>         GitHub 组织/用户名
  --ak-id <id>               阿里云 AccessKey ID
  --ak-secret <secret>       阿里云 AccessKey Secret
  --db-url <url>             生产数据库连接串

可选参数：
  --region <region>          阿里云地域（默认 cn-shenzhen）
  --oss-bucket <name>        OSS Bucket 名称（默认使用项目名）
  --vpc-id <id>              VPC ID
  --vsw-id <id>              VSwitch ID
  --sg-id <id>               Security Group ID
  --config <path>            指定配置文件（默认 scripts/setup.env）

控制选项：
  --skip-cloud               跳过云端部署（仅本地初始化）
  --skip-local-db            跳过本地数据库初始化
  --help, -h                 显示帮助

示例（全量免交互）：
  ./scripts/setup.sh \\
    --name my-project \\
    --github-org your-org \\
    --ak-id LTAI5t*** \\
    --ak-secret *** \\
    --db-url "postgresql://user:pass@host:5432/db" \\
    --vpc-id vpc-xxx \\
    --vsw-id vsw-xxx \\
    --sg-id sg-xxx
`);
}

async function prompt(question, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const value = await rl.question(`${question}${suffix}: `);
  return value.trim() || defaultValue;
}

async function promptRequired(question) {
  while (true) {
    const value = await prompt(question);
    if (value) return value;
    console.log(c(colors.yellow, '  该项必填，请重新输入。'));
  }
}

async function promptOptional(question, defaultValue = '') {
  return await prompt(question, defaultValue);
}

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function runCmd(cmd, args, options = {}) {
  const { cwd = ROOT_DIR, capture = false, env = {} } = options;
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';
    if (capture && child.stdout) {
      child.stdout.on('data', (d) => (stdout += d.toString()));
    }
    if (capture && child.stderr) {
      child.stderr.on('data', (d) => (stderr += d.toString()));
    }
    child.on('error', () => resolve({ code: 1, stdout, stderr }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function ensureCommand(cmd, versionArg = ['--version']) {
  const res = await runCmd(cmd, versionArg, { capture: true });
  return res.code === 0 ? res.stdout.trim() : null;
}

async function loadConfigFile(configPath) {
  const config = {};

  if (!configPath) return config;

  try {
    const content = await fs.readFile(configPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (value) {
        config[key] = value;
      }
    }

    if (Object.keys(config).length > 0) {
      log(`已加载配置文件: ${path.relative(ROOT_DIR, configPath)}`);
    }
  } catch (err) {
    // 配置文件不存在，忽略
  }

  return config;
}

// ============================================
// 环境检查
// ============================================

async function checkDocker() {
  const dockerInfo = await runCmd('docker', ['info'], { capture: true });
  if (dockerInfo.code !== 0) {
    warn('Docker 未运行，本地数据库初始化将跳过');
    return false;
  }
  return true;
}

async function checkServerlessDevs() {
  const sVer = await ensureCommand('s', ['-v']);
  if (!sVer) {
    log('未检测到 Serverless Devs (s)，尝试安装...');
    const res = await runCmd('npm', ['install', '-g', '@serverless-devs/s']);
    if (res.code !== 0) {
      error('安装 Serverless Devs 失败，请手动安装: npm install -g @serverless-devs/s');
    }
  }
  return true;
}

async function checkAliyunCli() {
  const aliyunVer = await ensureCommand('aliyun', ['--version']);
  if (!aliyunVer) {
    error('未检测到 aliyun CLI，请先安装: brew install aliyun-cli');
  }
  return true;
}

async function checkGhCli() {
  const ghVer = await ensureCommand('gh', ['--version']);
  if (!ghVer) {
    error('未检测到 GitHub CLI (gh)，请安装: https://cli.github.com/');
  }
  const status = await runCmd('gh', ['auth', 'status'], { capture: true });
  if (status.code !== 0) {
    error('gh 未登录，请先运行: gh auth login');
  }
  return true;
}

// ============================================
// 核心功能
// ============================================

async function resetGitHistory() {
  log('重置 Git 历史...');
  await fs.rm(path.join(ROOT_DIR, '.git'), { recursive: true, force: true });
  await runCmd('git', ['init', '-b', 'main']);
  success('Git 已重置为新仓库');
}

async function generatePrismaClient() {
  log('生成 Prisma Client...');
  const res = await runCmd('pnpm', ['--filter', 'backend', 'prisma:generate']);
  if (res.code !== 0) {
    error('Prisma Client 生成失败');
  }
  success('Prisma Client 生成完成');
}

async function initLocalDatabase() {
  log('初始化本地数据库...');
  const res = await runCmd('bash', ['scripts/db-setup.sh']);
  if (res.code !== 0) {
    warn('本地数据库初始化失败，可稍后手动运行: pnpm db:setup');
    return false;
  }
  success('本地数据库初始化完成');
  return true;
}

async function writeEnvFiles(answers, fcDomain = '') {
  log('写入环境变量文件...');

  const dbName = answers.projectName;
  const backendDbUrl =
    answers.localDatabaseUrl ||
    `postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public`;
  const prodDbUrl = answers.databaseUrl || '';

  // 根目录 .env（供 docker-compose 读取 DB_NAME）
  const rootEnv = `# Docker Compose 环境变量
# 本地数据库名（与 apps/backend/.env 中的 DATABASE_URL 一致）
DB_NAME="${dbName}"
`;
  await fs.writeFile(path.join(ROOT_DIR, '.env'), rootEnv.trim() + '\n');

  // 后端 .env（本地开发）
  const backendEnv = `# 本地开发环境配置
# 使用 Docker PostgreSQL: pnpm db:start

# 数据库连接（本地/远程）
DATABASE_URL="${backendDbUrl}"
DATABASE_URL_PROD="${prodDbUrl}"

# JWT 配置
JWT_SECRET="${answers.jwtSecret}"
JWT_EXPIRES_IN="7d"

# 应用配置
NODE_ENV="development"
PORT=3000

# CORS
CORS_ORIGIN="http://localhost:5173"

# 迁移令牌
MIGRATION_TOKEN="${answers.migrationToken}"
`;

  await fs.writeFile(path.join(ROOT_DIR, 'apps', 'backend', '.env'), backendEnv.trim() + '\n');

  // 前端 .env
  const frontendEnv = `VITE_API_BASE_URL=${fcDomain}
VITE_SENTRY_DSN=
`;
  await fs.writeFile(path.join(ROOT_DIR, 'apps', 'frontend', '.env'), frontendEnv.trim() + '\n');

  success('环境变量文件已写入');
}

async function updateInfraRegion(region) {
  log(`更新部署配置 (region: ${region})...`);

  for (const file of ['s.yaml', 's.prod.yaml']) {
    const filePath = path.join(ROOT_DIR, 'infra', file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const updated = content.replace(/region:\s*cn-shenzhen/g, `region: ${region}`);
      await fs.writeFile(filePath, updated);
    } catch (err) {
      warn(`更新 ${file} 失败: ${err.message}`);
    }
  }

  success('部署配置已更新');
}

async function createOssBucket(bucket, region, env) {
  log(`创建 OSS Bucket: ${bucket}...`);

  const profile = `setup-${Date.now()}`;
  await runCmd('aliyun', [
    'configure', 'set',
    '--profile', profile,
    '--mode', 'AK',
    '--access-key-id', env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    '--access-key-secret', env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    '--region', region,
  ]);

  const endpoint = `oss-${region}.aliyuncs.com`;

  // 创建 Bucket
  const mb = await runCmd('aliyun', [
    '--profile', profile,
    'oss', 'mb', `oss://${bucket}`,
    '--region', region,
    '--endpoint', endpoint,
  ], { capture: true });

  if (mb.code !== 0) {
    const out = mb.stdout + mb.stderr;
    if (out.includes('BucketAlreadyExists') || out.includes('BucketAlreadyOwnedByYou')) {
      warn(`Bucket ${bucket} 已存在，继续使用`);
    } else {
      error(`创建 Bucket 失败: ${out}`);
    }
  } else {
    success(`OSS Bucket ${bucket} 创建成功`);
  }

  // 设置 ACL
  await runCmd('aliyun', [
    '--profile', profile,
    'oss', 'set-acl', `oss://${bucket}`, 'public-read',
    '-b', '-e', endpoint,
  ], { capture: true });

  // 配置静态网站
  const websiteXml = path.join(ROOT_DIR, 'infra', 'oss', 'website.xml');
  await runCmd('aliyun', [
    '--profile', profile,
    'oss', 'website', '--method', 'put', `oss://${bucket}`, websiteXml,
    '-e', endpoint,
  ], { capture: true });

  // 配置 CORS
  const corsXml = path.join(ROOT_DIR, 'infra', 'oss', 'cors.xml');
  await runCmd('aliyun', [
    '--profile', profile,
    'oss', 'cors', '--method', 'put', `oss://${bucket}`, corsXml,
    '-e', endpoint,
  ], { capture: true });

  success('OSS 配置完成');
}

async function findPrismaClientDir() {
  const pnpmDir = path.join(ROOT_DIR, 'node_modules', '.pnpm');

  async function searchDir(dir, depth = 0) {
    if (depth > 6) return null;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === '.prisma') {
            return path.join(dir, entry.name);
          }
          if (entry.name.includes('prisma') || entry.name === 'node_modules') {
            const result = await searchDir(path.join(dir, entry.name), depth + 1);
            if (result) return result;
          }
        }
      }
    } catch {}
    return null;
  }

  return searchDir(pnpmDir);
}

async function buildAndDeploy(answers, env) {
  log('构建项目...');

  // 构建 shared（按路径，避免依赖包名）
  if ((await runCmd('pnpm', ['--filter', './packages/shared', 'build'])).code !== 0) {
    error('构建 shared 失败');
  }

  // 构建 backend
  if ((await runCmd('pnpm', ['--filter', 'backend', 'build'])).code !== 0) {
    error('构建 backend 失败');
  }

  success('项目构建完成');

  // 创建 FC 部署包
  log('创建 FC 部署包...');
  const fcDeployDir = path.join(ROOT_DIR, 'fc-deploy');
  await fs.rm(fcDeployDir, { recursive: true, force: true });

  const pnpmDeploy = await runCmd('pnpm', [
    'deploy', fcDeployDir,
    '--filter', 'backend',
    '--prod',
    '--ignore-scripts',
    '--frozen-lockfile',
  ]);
  if (pnpmDeploy.code !== 0) {
    error('pnpm deploy 失败');
  }

  // 复制 dist
  await fs.cp(
    path.join(ROOT_DIR, 'apps', 'backend', 'dist'),
    path.join(fcDeployDir, 'dist'),
    { recursive: true }
  );

  // 复制 Prisma Client
  const prismaSrc = await findPrismaClientDir();
  if (prismaSrc) {
    await fs.cp(prismaSrc, path.join(fcDeployDir, 'node_modules', '.prisma'), {
      recursive: true,
      dereference: true,
    });
  } else {
    error('未找到 Prisma Client，请确保已运行 prisma generate');
  }

  // 复制 @shared 包
  const sharedDest = path.join(fcDeployDir, 'node_modules', '@shared');
  await fs.rm(sharedDest, { recursive: true, force: true });
  await fs.mkdir(sharedDest, { recursive: true });
  await fs.cp(
    path.join(ROOT_DIR, 'packages', 'shared', 'dist'),
    path.join(sharedDest, 'dist'),
    { recursive: true }
  );
  await fs.copyFile(
    path.join(ROOT_DIR, 'packages', 'shared', 'package.json'),
    path.join(sharedDest, 'package.json')
  );

  success('FC 部署包创建完成');

  // 生成 env.yaml
  const envForS = {
    NODE_ENV: 'production',
    DATABASE_URL: answers.databaseUrl,
    JWT_SECRET: answers.jwtSecret,
    JWT_EXPIRES_IN: '7d',
    APP_VERSION: `init-${Date.now()}`,
    MIGRATION_TOKEN: answers.migrationToken,
    VPC_ID: answers.vpcId || '',
    VSWITCH_ID: answers.vswitchId || '',
    SECURITY_GROUP_ID: answers.securityGroupId || '',
    FC_REGION: answers.region,
    FC_SERVICE_NAME: answers.name,
    ALIBABA_CLOUD_ACCESS_KEY_ID: env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    FC_CODE_TEMP_OSS_ENDPOINT: `https://oss-${answers.region}.aliyuncs.com`,
  };

  const yamlEscape = (val) => {
    const str = String(val ?? '');
    if (str === '' || /^[A-Za-z0-9_@%+=:,./-]+$/.test(str)) return str;
    return `"${str.replace(/"/g, '\\"')}"`;
  };

  const envYamlBody = Object.entries(envForS)
    .map(([k, v]) => `      ${k}: ${yamlEscape(v)}`)
    .join('\n');
  const envYaml = `environments:\n  - name: default\n    env:\n${envYamlBody}\n`;

  const envFile = path.join(ROOT_DIR, 'infra', 'env.yaml');
  await fs.writeFile(envFile, envYaml);

  // 部署 FC
  log('部署到阿里云 FC...');
  const deployArgs = ['deploy', '-y', '--use-local', '-t', 'infra/s.prod.yaml', '--env-file', envFile, '--env', 'default'];
  const deploy = await runCmd('s', deployArgs, { env: { ...process.env, ...envForS } });

  if (deploy.code !== 0) {
    error('FC 部署失败，请检查凭证和网络');
  }

  success('FC 部署完成');

  // 获取 FC 域名
  const info = await runCmd('s', ['info', '--output', 'json', '-t', 'infra/s.prod.yaml', '--env-file', envFile, '--env', 'default'], {
    capture: true,
    env: { ...process.env, ...envForS },
  });

  let fcDomain = '';
  if (info.code === 0) {
    try {
      const text = info.stdout || '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(text.slice(start, end + 1));
        fcDomain = parsed?.url?.system_url || parsed?.system_url || '';
        if (fcDomain && !fcDomain.startsWith('http')) {
          fcDomain = `https://${fcDomain}`;
        }
      }
    } catch {}
  }

  if (fcDomain) {
    success(`FC 域名: ${fcDomain}`);
  } else {
    warn('未能获取 FC 域名，可稍后通过 s info 查看');
  }

  return fcDomain;
}

async function createGithubRepo(org, name) {
  log(`创建 GitHub 仓库: ${org}/${name}...`);

  const res = await runCmd('gh', ['repo', 'create', `${org}/${name}`, '--public'], { capture: true });
  if (res.code !== 0) {
    const errMsg = (res.stderr || res.stdout || '').trim();
    if (errMsg.includes('already exists')) {
      warn(`仓库 ${org}/${name} 已存在，继续使用`);
      return `git@github.com:${org}/${name}.git`;
    }
    error(`创建 GitHub 仓库失败: ${errMsg}`);
  }

  success(`GitHub 仓库创建成功: ${org}/${name}`);
  return `git@github.com:${org}/${name}.git`;
}

async function syncGithubSecrets(answers, fcDomain, repoSlug) {
  log('同步 GitHub Secrets...');

  const migrationEndpoint = fcDomain
    ? `${fcDomain.replace(/\/$/, '')}/api/internal/db-migrate`
    : '';

  const secrets = {
    ALIYUN_ACCESS_KEY_ID: answers.akId,
    ALIYUN_ACCESS_KEY_SECRET: answers.akSecret,
    OSS_BUCKET_PROD: answers.ossBucket,
    FC_SERVICE_NAME: answers.name,
    DATABASE_URL: answers.databaseUrl,
    JWT_SECRET: answers.jwtSecret,
    VPC_ID: answers.vpcId || '',
    VSWITCH_ID: answers.vswitchId || '',
    SECURITY_GROUP_ID: answers.securityGroupId || '',
    VITE_API_BASE_URL: fcDomain || '',
    VITE_SENTRY_DSN: '',
    MIGRATION_TOKEN_PROD: answers.migrationToken,
    MIGRATION_ENDPOINT_PROD: migrationEndpoint,
  };

  for (const [key, val] of Object.entries(secrets)) {
    if (!val) continue;
    const args = ['secret', 'set', key, '--body', val, '--repo', repoSlug];
    const res = await runCmd('gh', args, { capture: true });
    if (res.code === 0) {
      console.log(c(colors.dim, `    ${key}`));
    } else {
      warn(`写入 Secret 失败: ${key}`);
    }
  }

  log('设置 GitHub Variables...');
  const variableRes = await runCmd('gh', ['variable', 'set', 'ENABLE_DEPLOY', '--body', 'true', '--repo', repoSlug], { capture: true });
  if (variableRes.code === 0) {
    console.log(c(colors.dim, '    ENABLE_DEPLOY=true'));
  } else {
    warn('设置 GitHub Variable 失败: ENABLE_DEPLOY');
  }

  success('GitHub Secrets 和 Variables 同步完成');
}

async function cleanupTemplateFiles() {
  const filesToRemove = [
    path.join(ROOT_DIR, 'scripts', 'setup.env'),
  ];

  for (const file of filesToRemove) {
    try {
      await fs.rm(file, { force: true });
      console.log(c(colors.dim, `  已清理: ${path.relative(ROOT_DIR, file)}`));
    } catch {
      // ignore
    }
  }
}

async function gitCommitAndPush(remote) {
  log('提交并推送代码...');

  await runCmd('git', ['add', '.']);
  await runCmd('git', ['commit', '--no-verify', '-m', 'feat: 项目初始化']);
  await runCmd('git', ['remote', 'add', 'origin', remote]);

  const push = await runCmd('git', ['push', '-u', 'origin', 'main']);
  if (push.code !== 0) {
    error('git push 失败，请检查远程仓库权限');
  }

  success('代码已推送，CI/CD 流水线将自动运行');
}

// ============================================
// 主流程
// ============================================

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  const defaultConfigFile = 'setup.env';
  const configPathFlag = typeof flags.config === 'string' ? flags.config : '';
  const resolvedConfigPath = configPathFlag
    ? (path.isAbsolute(configPathFlag) ? configPathFlag : path.resolve(ROOT_DIR, configPathFlag))
    : path.join(ROOT_DIR, 'scripts', defaultConfigFile);

  // 加载配置文件
  const config = await loadConfigFile(resolvedConfigPath);

  // 合并配置优先级: 命令行参数 > 配置文件 > 交互式输入
  const getConfig = (flagKey, configKey) => {
    const fromFlag = typeof flags[flagKey] === 'string' ? flags[flagKey] : '';
    if (fromFlag) return fromFlag;
    return typeof config[configKey] === 'string' ? config[configKey] : '';
  };
  const skipCloud = Boolean(flags.skipCloud || config.SKIP_CLOUD === 'true');
  const skipLocalDb = Boolean(flags.skipLocalDb || config.SKIP_LOCAL_DB === 'true');

  console.log(`
${c(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${c(colors.white, '  开沿框架一站式初始化')}
${c(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
`);

  console.log(c(colors.blue, '模式: 独立项目初始化'));
  console.log(c(colors.dim, `配置文件: ${path.relative(ROOT_DIR, resolvedConfigPath)}`));

  // 收集配置
  console.log(c(colors.blue, '\n📝 项目配置\n'));

  // 项目名称
  let projectName = getConfig('name', 'PROJECT_NAME');
  if (!projectName) {
    projectName = await promptRequired('项目名称');
  }
  console.log(`  项目名称: ${c(colors.green, projectName)}`);

  // GitHub 组织
  let githubOrg = getConfig('github-org', 'GITHUB_ORG');
  if (!skipCloud) {
    if (!githubOrg) {
      githubOrg = await promptRequired('GitHub 组织/用户名');
    }
    console.log(`  GitHub 组织: ${c(colors.green, githubOrg)}`);
  }

  // Region
  let region = getConfig('region', 'REGION') || 'cn-shenzhen';
  console.log(`  阿里云 Region: ${c(colors.green, region)}`);

  const repoSlug = !skipCloud && githubOrg
    ? `${githubOrg}/${projectName}`
    : '';

  const answers = {
    projectName,
    name: getConfig('fc-service', 'FC_SERVICE_NAME') || `${projectName}-backend`,
    githubOrg: githubOrg || '',
    region,
    jwtSecret: generateSecret(32),
    migrationToken: generateSecret(24),
  };

  answers.ossBucket = getConfig('oss-bucket', 'OSS_BUCKET') || `${projectName}-frontend`;
  answers.localDatabaseUrl = getConfig('local-db-url', 'LOCAL_DATABASE_URL') || '';

  // 云端配置
  if (!skipCloud) {
    console.log(c(colors.blue, '\n🔐 阿里云配置\n'));

    // AccessKey ID
    let akId = getConfig('ak-id', 'ALIYUN_ACCESS_KEY_ID');
    if (!akId) {
      akId = await promptRequired('AccessKey ID');
    } else {
      console.log(`  AccessKey ID: ${c(colors.green, akId.slice(0, 8) + '***')}`);
    }
    answers.akId = akId;

    // AccessKey Secret
    let akSecret = getConfig('ak-secret', 'ALIYUN_ACCESS_KEY_SECRET');
    if (!akSecret) {
      akSecret = await promptRequired('AccessKey Secret');
    } else {
      console.log(`  AccessKey Secret: ${c(colors.green, '***')}`);
    }
    answers.akSecret = akSecret;

    // 数据库 URL
    let dbUrl = getConfig('db-url', 'DATABASE_URL');
    if (!dbUrl) {
      dbUrl = await promptRequired('生产数据库 URL');
    } else {
      console.log(`  数据库 URL: ${c(colors.green, dbUrl.replace(/:[^:@]+@/, ':***@'))}`);
    }
    answers.databaseUrl = dbUrl;

    console.log(c(colors.blue, '\n🌐 VPC 配置（FC 访问 RDS 必须同 VPC）\n'));

    // VPC 配置
    let vpcId = getConfig('vpc-id', 'VPC_ID');
    let vswitchId = getConfig('vsw-id', 'VSWITCH_ID');
    let sgId = getConfig('sg-id', 'SECURITY_GROUP_ID');

    if (!vpcId && !vswitchId && !sgId) {
      vpcId = await promptOptional('VPC ID');
      vswitchId = await promptOptional('VSwitch ID');
      sgId = await promptOptional('Security Group ID');
    } else {
      if (vpcId) console.log(`  VPC ID: ${c(colors.green, vpcId)}`);
      if (vswitchId) console.log(`  VSwitch ID: ${c(colors.green, vswitchId)}`);
      if (sgId) console.log(`  Security Group ID: ${c(colors.green, sgId)}`);
    }

    answers.vpcId = vpcId;
    answers.vswitchId = vswitchId;
    answers.securityGroupId = sgId;
  }

  console.log(c(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c(colors.white, '  开始初始化...'));
  console.log(c(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  let fcDomain = '';
  let templateFilesCleaned = false;

  const cleanTemplate = async () => {
    if (templateFilesCleaned) return;
    await cleanupTemplateFiles();
    templateFilesCleaned = true;
  };

  const aliyunEnv = skipCloud ? null : {
    ALIBABA_CLOUD_ACCESS_KEY_ID: answers.akId,
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: answers.akSecret,
  };

  const steps = [];

  steps.push({
    label: '重置 Git 历史',
    run: resetGitHistory,
  });

  steps.push({
    label: '生成 Prisma Client',
    run: async () => {
      if (skipLocalDb) {
        await generatePrismaClient();
      } else {
        console.log(c(colors.dim, '  （将由 db-setup.sh 统一处理）'));
      }
    },
  });

  steps.push({
    label: '写入环境变量',
    run: async () => {
      await writeEnvFiles(answers);
    },
  });

  if (!skipLocalDb) {
    steps.push({
      label: '初始化本地数据库',
      run: async () => {
        const dockerOk = await checkDocker();
        if (dockerOk) {
          await initLocalDatabase();
        }
      },
    });
  }

  if (!skipCloud) {
    steps.push({
      label: `更新部署配置 (region: ${answers.region})`,
      run: async () => {
        await checkServerlessDevs();
        await checkAliyunCli();
        await checkGhCli();
        await updateInfraRegion(answers.region);
      },
    });

    steps.push({
      label: `创建 OSS Bucket (${answers.ossBucket})`,
      run: async () => {
        await createOssBucket(answers.ossBucket, answers.region, aliyunEnv);
      },
    });

    steps.push({
      label: '构建并部署到阿里云',
      run: async () => {
        fcDomain = await buildAndDeploy(answers, aliyunEnv);
        await writeEnvFiles(answers, fcDomain);
      },
    });

    steps.push({
      label: 'GitHub 仓库配置',
      run: async () => {
        const remote = await createGithubRepo(answers.githubOrg, projectName);
        await syncGithubSecrets(answers, fcDomain, repoSlug);
        await cleanTemplate();
        await gitCommitAndPush(remote);
      },
    });
  }

  const totalSteps = steps.length;

  try {
    for (const [idx, item] of steps.entries()) {
      step(idx + 1, totalSteps, item.label);
      await item.run();
    }

    if (!templateFilesCleaned) {
      await cleanTemplate();
    }

    const repoInfo = (!skipCloud && repoSlug)
      ? `https://github.com/${repoSlug}`
      : '已跳过云端部署，未创建远端仓库';

    // 完成
    console.log(`
${c(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${c(colors.green, '  ✅ 初始化完成！')}
${c(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${c(colors.white, '📍 访问地址:')}
   本地前端: ${c(colors.blue, 'http://localhost:5173')}
   本地后端: ${c(colors.blue, 'http://localhost:3000/api')}${fcDomain ? `
   云端后端: ${c(colors.blue, fcDomain)}` : ''}

${c(colors.white, '📌 仓库:')}
   ${repoInfo}

${c(colors.white, '📖 本地开发:')}
   ${c(colors.green, 'pnpm dev')}

${c(colors.white, '🔑 默认账号:')}
   admin / admin123
`);
  } catch (err) {
    console.error(c(colors.red, '\n❌ 初始化失败:'), err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
