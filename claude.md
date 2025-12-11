# 开沿 Monorepo

全栈项目：React + NestJS + PostgreSQL + Vite + Tailwind + shadcn/ui
前后端分离：前端必须构建为纯静态SPA文件部署到阿里云OSS，后端则部署到阿里云函数计算FC。

## 文档索引

| 文档                       | 何时阅读                                    |
| -------------------------- | ------------------------------------------- |
| `README.md`                | 了解项目整体使用方式、日常开发命令          |
| `docs/框架扩展准则.md`     | **开发新功能前必读** - 规范、模式、检查清单 |
| `docs/开沿核心技术宪章.md` | 做架构决策、理解设计原则时                  |
| `docs/数据库迁移规则.md`   | 修改数据库 schema 前必读                    |
| `docs/快速开始.md`         | 新人入门 - 初始化脚本与环境配置             |
| `docs/密钥与变量配置.md`   | 配置 CI/CD Secrets 时                       |
| `docs/FC部署补丁.md`       | 处理部署问题、了解 FC 限制时                |
| `infra/README.md`          | 了解 Serverless 与 OSS 部署配置时           |

## 结构

```
apps/backend/     # NestJS API (localhost:3000, /api 前缀)
apps/frontend/    # React SPA (localhost:5173)
packages/shared/  # 共享类型
```

## 前端架构

```
apps/frontend/src/
├── features/          # 业务模块（页面 + 表单组件）
│   ├── dashboard/     # 控制台
│   ├── users/         # 用户管理
│   ├── roles/         # 角色管理
│   └── organizations/ # 组织管理
├── components/
│   ├── ui/            # shadcn/ui 原生组件
│   ├── layout/        # 布局组件
│   ├── permission/    # 权限组件
│   └── feedback/      # 反馈组件（ConfirmDialog）
├── hooks/api/         # 按模块拆分的 API Hooks
├── lib/api/           # 按模块拆分的 API 请求
└── contexts/          # AuthContext, PermissionContext
```

关键约定：

- 页面组件放 `features/`，通用组件放 `components/`
- 使用 `ConfirmDialog` 替代 `window.confirm`
- 使用 shadcn/ui 的 `Select`/`Checkbox` 替代原生表单元素

## 命令

```bash
pnpm dev           # 启动前后端
pnpm db:start      # 启动数据库（Docker）
pnpm db:setup      # 首次初始化（迁移 + 种子）
pnpm lint && pnpm test
```

## 约定

- API 路径自带 `/api` 前缀（如 `/api/auth/login`）
- 数据库变更必须通过 Prisma migration
- 共享类型放 `packages/shared`
- 默认账号：`admin@example.com` / `admin123`
