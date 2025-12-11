# 开沿 Monorepo

基于 pnpm workspace 的全栈项目模板（React + NestJS + PostgreSQL + Vite + Tailwind + shadcn/ui）。

## 使用方式

本仓库有两种使用方式，请根据你的身份选择对应章节：

| 身份             | 说明                                           | 跳转                                |
| ---------------- | ---------------------------------------------- | ----------------------------------- |
| **新项目开发者** | 想基于此模板创建自己的项目                     | [一、创建独立项目](#一创建独立项目) |
| **模板维护者**   | 在 `kaiyan-tech/ky-framework` 仓库迭代模板功能 | [二、维护模板仓库](#二维护模板仓库) |

---

## 一、创建独立项目

> 适用于：想基于此模板创建新项目的开发者

### 1.1 初始化

```bash
# 克隆模板
git clone https://github.com/kaiyan-tech/ky-framework.git <your-project-name>
cd <your-project-name>

# 准备配置（填入阿里云凭证、数据库、VPC 等）
cp scripts/setup.env scripts/setup.env
# 编辑 scripts/setup.env

# 运行初始化
./scripts/setup.sh

# 或仅本地开发（跳过云端配置）
./scripts/setup.sh --skip-cloud
```

初始化脚本自动完成：

- 检查环境 → 安装依赖 → 重置 Git
- 生成环境配置（根目录 `.env`、`apps/backend/.env`、`apps/frontend/.env`）
- 初始化本地数据库（Docker，**数据库名 = 项目名**）
- 创建 OSS/FC 资源
- 创建 GitHub 仓库
- 同步 GitHub Secrets & Variables（含 `ENABLE_DEPLOY=true`）
- 首次部署

### 1.2 日常开发

```bash
# 启动本地数据库（Docker）
pnpm db:start      # 重置: pnpm db:reset
# 首次迁移/种子
pnpm db:setup      # 或 pnpm db:migrate && pnpm db:seed
# 提示：正常重启 Docker 后无需重复迁移；仅在 schema 变更或重置后再执行迁移/种子。

# 启动开发服务器
pnpm dev:backend   # localhost:3000
pnpm dev:frontend  # localhost:5173

# 或同时启动
pnpm dev

# 其他命令
pnpm lint          # 代码检查
pnpm test          # 运行测试
pnpm db:migrate    # 创建数据库迁移
pnpm db:studio     # Prisma Studio 可视化
```

### 1.3 CI/CD

| 触发条件    | 行为                                                |
| ----------- | --------------------------------------------------- |
| Push → main | CI 检查；若 `ENABLE_DEPLOY=true` 则自动部署生产环境 |
| 提交 PR     | CI 检查（lint/test/build）                          |

回滚：`git revert <commit> && git push origin main`

### 1.4 分支规范

| 类型 | 命名              | 示例                  |
| ---- | ----------------- | --------------------- |
| 功能 | `feature/<描述>`  | `feature/user-auth`   |
| 修复 | `fix/<描述>`      | `fix/login-redirect`  |
| 紧急 | `hotfix/<描述>`   | `hotfix/api-crash`    |
| 重构 | `refactor/<描述>` | `refactor/db-queries` |

---

## 二、维护模板仓库

> 适用于：在 `kaiyan-tech/ky-framework` 仓库迭代模板功能的维护者

### 2.1 本地开发

```bash
# 复制环境配置
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 启动本地 Docker 数据库（默认数据库名: ky_framework）
pnpm db:start
pnpm db:setup  # 首次需要。重启 Docker 后不需要重复迁移，除非重置数据或修改 schema。

# 启动开发
pnpm dev
```

本地数据库名通过 `docker-compose.yml` 的 `DB_NAME` 环境变量控制，默认为 `ky_framework`。
模板仓库的 CI **不会触发部署**（未设置 `ENABLE_DEPLOY` 变量），仅运行 lint/test/build。

### 2.2 项目结构

```
ky-framework/
├── apps/
│   ├── backend/           # NestJS 后端
│   │   ├── prisma/        # Schema 与迁移
│   │   └── src/
│   └── frontend/          # React + Vite 前端
├── packages/
│   └── shared/            # 共享类型
├── scripts/
│   ├── setup.sh           # 初始化入口
│   ├── setup.mjs          # 初始化核心逻辑
│   ├── db-setup.sh        # 本地数据库初始化
│   └── setup.env.example  # 初始化配置模板
├── infra/
│   ├── s.yaml             # Serverless Devs 配置（默认环境）
│   ├── s.prod.yaml        # 生产环境 Serverless Devs 配置
│   └── oss/               # OSS 配置模板
├── .github/workflows/     # CI/CD 流水线
└── docs/                  # 文档
```

### 2.3 维护注意事项

修改以下文件时需确保模板仓库和独立项目两种场景都能正常工作：

| 文件                        | 注意点                                             |
| --------------------------- | -------------------------------------------------- |
| `.github/workflows/`        | 部署步骤必须有 `vars.ENABLE_DEPLOY == 'true'` 守卫 |
| `scripts/setup.mjs`         | 新增 GitHub Secret 需同步到此脚本                  |
| `scripts/setup.env.example` | 新增云端配置项需同步到此模板                       |

### 2.4 CI/CD 行为对比

| 仓库     | ENABLE_DEPLOY | Push → main     |
| -------- | ------------- | --------------- |
| 模板仓库 | 未设置        | 仅 CI（不部署） |
| 独立项目 | true          | CI + 部署       |

---

## 三、技术要点

- **权限基座**：完整的 RBAC 权限管理系统
  - 17 个细粒度权限（用户/组织/角色/审计/系统）
  - 4 级数据范围控制（全部/本部门树/本部门/仅本人）
  - 树形组织结构（物化路径存储）
- **认证**：JWT 全流程（登录、注册、路由保护）
- **管理后台**：开箱即用的控制台界面（组织/角色/用户管理）
- **审计日志**：自动记录所有写操作
- **部署**：阿里云 FC（Custom Runtime）+ OSS（前端静态）
- **数据库迁移**：生产环境通过 FC 内部接口触发，CI 不直连
- **监控**：前端 Sentry（可选），后端 JSON 日志

**默认账号**：`admin@example.com` / `admin123`（首次 `pnpm db:seed` 后可用）

---

## 四、详细文档

- [快速开始](./docs/快速开始.md)
- [核心技术宪章](./docs/开沿核心技术宪章.md) - 架构决策
- [工程指导手册](./docs/开沿工程指导手册.md) - 开发流程
- [数据库迁移规则](./docs/数据库迁移规则.md)
