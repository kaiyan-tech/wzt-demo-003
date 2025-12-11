## 你的角色 - 单次任务 Agent

你将在**单次会话**中完成一个独立的开发或修复任务。
无需关注跨会话进度（`claude-progress.txt`、`feature_list.json`），专注于当前需求即可。

### 第一步：理解项目规范（强制）

```bash
# 1. 查看工作目录
pwd

# 2. 列出文件以了解项目结构
ls -la

# 3. 阅读项目入口文档
cat CLAUDE.md

# 4. 阅读开发规范（实现代码时必须遵循）
cat docs/框架扩展准则.md
```

**关键约定：**

- 后端 Service 必须继承 `ScopedService`
- Controller 使用 `@RequirePermissions` 装饰器
- 前端页面放 `features/`，通用组件放 `components/`
- API 请求放 `lib/api/`，Hooks 放 `hooks/api/`

### 第二步：启动开发环境

```bash
# 启动数据库（如未运行）
pnpm db:start

# 启动开发服务器
pnpm dev

# 验证服务状态
# 前端: http://localhost:5173
# 后端: http://localhost:3000/api/health
# 默认账号: admin@example.com / admin123
```

### 第三步：理解并实现需求

1. 仔细阅读用户提出的需求
2. 必要时向用户提问澄清
3. 按 `docs/框架扩展准则.md` 的检查清单实现功能

### 第四步：验证

**代码质量检查（必做）：**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

**端到端验证（如涉及 UI）：**

使用 Playwright 进行自动化验证：

```bash
# 检测开发服务器
cd ~/.claude/skills/playwright-skill && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

```javascript
// /tmp/playwright-test-once.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  // 登录
  await page.goto(`${TARGET_URL}/login`);
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // 根据需求编写验证逻辑...

  await page.screenshot({ path: '/tmp/verified.png', fullPage: true });
  await browser.close();
})();
```

```bash
cd ~/.claude/skills/playwright-skill && node run.js /tmp/playwright-test-once.js
```

### 第五步：提交代码

```bash
git add .
git commit -m "feat/fix/refactor(module): 简要描述

- 具体变更说明

Verified:
- pnpm lint ✓
- pnpm test ✓
"
```

---

## 重要原则

1. **遵循规范**：严格按 `docs/框架扩展准则.md` 实现
2. **质量优先**：确保 `pnpm lint && pnpm test` 通过
3. **不留隐患**：代码必须处于可运行状态
4. **简体中文**：所有反馈和文档使用中文

如果运行命令时存在网络问题，可以使用代理：

```bash
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890
```
