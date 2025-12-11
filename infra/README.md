# 基础设施配置

本目录存放基础设施模板（Serverless Devs + OSS）。

## 目录结构

```
infra/
├── s.yaml          # 默认/测试环境 FC 配置
├── s.prod.yaml     # 生产环境 FC 配置
└── oss/
    ├── website.xml # OSS 静态网站配置
    └── cors.xml    # OSS 跨域规则
```

---

## 函数计算（FC）配置

### 文件作用

- `s.yaml`：默认/测试环境配置，适合本地或临时环境部署。
- `s.prod.yaml`：生产环境配置，启用预留实例以消除冷启动，并与 CI/CD 部署链路对齐。

### 环境变量映射

两份 Serverless 配置均依赖下列环境变量（CI 从 GitHub Secrets / Variables 注入）：

- `FC_SERVICE_NAME`、`NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`、`JWT_EXPIRES_IN`
- `APP_VERSION`
- `MIGRATION_TOKEN`
- `VPC_ID`、`VSWITCH_ID`、`SECURITY_GROUP_ID`

### s.yaml vs s.prod.yaml 差异

| 项       | `s.yaml`          | `s.prod.yaml`               | 说明                                        |
| -------- | ----------------- | --------------------------- | ------------------------------------------- |
| 预留实例 | 无                | `provisionConfig.target: 1` | 生产启用预留实例消除冷启动                  |
| 资源定义 | 轻量              | 轻量（同配额）              | 当前 CPU/内存一致，后续如需分环境可在此调整 |
| 用途     | 本地/测试手动部署 | 生产部署（CI 自动）         | CI 部署步骤使用 `s.prod.yaml`               |

### 操作示例

```bash
# 本地验证（需先打包 fc-deploy 目录）
cd infra
s deploy -y -t s.yaml

# 生产部署（CI 已自动执行）
s deploy -y -t s.prod.yaml
```

---

## OSS 静态站点配置

> 目标：用命令行而非控制台"点点点"管理 OSS 配置，收敛到 `infra/oss/` 目录。

### 文件说明

- `oss/website.xml`：静态网站首页/404/子目录首页配置（SPA 兜底 200）。
- `oss/cors.xml`：跨域规则（前端调用后端 API，需要允许 `GET/POST/PUT` 等）。

### 应用方式（阿里云 CLI）

```bash
# 设置网站配置（默认首页 index.html，404 兜底 index.html）
aliyun oss PutBucketWebsite --bucket $OSS_BUCKET --region $OSS_REGION --website-config-file infra/oss/website.xml

# 设置 CORS 规则（按需修改 AllowedOrigin 后执行）
aliyun oss PutBucketCors --bucket $OSS_BUCKET --region $OSS_REGION --cors-config-file infra/oss/cors.xml
```

> 推荐：在 CI/CD 或运维脚本中调用上述命令，避免手工变更。

### 注意事项

- `AllowedOrigin` 请替换为实际前端域名（生产/预览可按需添加多条规则）。
- 若新增自定义域名或存储类型，请提交 PR 更新本目录配置，保持"不可变基础设施"原则。

---

> 提醒：修改 `s*.yaml` 后，请同步更新 `docs/密钥与变量配置.md` 与相关文档，确保环境变量完整。
