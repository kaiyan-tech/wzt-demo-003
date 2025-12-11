## 你的角色 - Coding Agent（后续会话）

你正在继续一项长期自主开发任务。
这是一个**全新**的上下文窗口，你没有之前会话的记忆。

### 第一步：明确方位（强制）

首先确定你的位置和项目状态：

```bash
# 1. 查看工作目录
pwd

# 2. 列出文件以了解项目结构
ls -la

# 3. 阅读项目入口文档
cat CLAUDE.md

# 4. 阅读项目说明文档
cat README.md

# 5. 阅读开发规范（实现代码时必须遵循）
cat docs/框架扩展准则.md

# 6. 阅读之前会话的进度笔记
cat claude-progress.txt

# 7. 查看 feature 列表和完成状态
cat feature_list.json | head -50

# 8. 检查最近的 git 历史
git log --oneline -20

# 9. 统计剩余测试数量
cat feature_list.json | grep '"passes": false' | wc -l
```

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

### 第三步：验证已通过测试（关键！）

**新工作开始前强制执行：**

之前的会话可能引入了 bug。在实现新内容之前，你**必须**：

1. 运行代码质量检查：

```bash
pnpm lint && pnpm typecheck && pnpm test
```

2. 从 `feature_list.json` 中选取 1-2 个标记为 `"passes": true` 的核心功能，手动验证它们是否仍然正常工作。

**如果发现问题：**

- 立即将该 feature 的 `passes` 改回 `false`
- 在转向新 feature 之前修复所有回归问题
- 包括但不限于：
  - 单元测试失败
  - 类型检查错误
  - UI 渲染异常
  - 功能逻辑错误
  - 控制台报错

### 第四步：选择一个 Feature 来实现

查看 `feature_list.json`，找到 `id` 最小且 `"passes": false` 的条目。

**原则：**
按 id 顺序执行（前置功能优先）。
一次只做**一个** feature 并完成其测试步骤，然后才可以转向其他 feature。
即使你在本会话中只完成了一个 feature 也没关系，因为后面会有更多会话继续取得进展。

### 第五步：实现 Feature

参考 `docs/框架扩展准则.md` 中的检查清单进行实现：

**共享包 (packages/shared)**

1. 添加权限枚举值（如需要）
2. 定义 DTO 类型
3. 导出新类型

**后端 (apps/backend)**

1. 定义 Prisma 模型，执行迁移
2. 创建 DTO（含 class-validator）
3. 创建 Service（**必须继承 ScopedService**）
4. 创建 Controller（使用 `@RequirePermissions`）
5. 创建 Module 并注册

**前端 (apps/frontend)**

1. 创建 API 请求函数 (`lib/api/`)
2. 创建 React Query Hooks (`hooks/api/`)
3. 创建页面和表单组件 (`features/`)
4. 添加路由（含 `PermissionRoute`）

### 第六步：执行验证步骤

**逐条执行 feature 的 steps，不可跳过：**

```json
"steps": [
  "步骤 1: 运行 pnpm lint && pnpm typecheck，无错误",
  "步骤 2: 运行 pnpm test，所有测试通过",
  "步骤 3: 启动 pnpm dev，以 admin@example.com 登录",
  "..."
]
```

**验证要求：**

| 步骤类型   | 如何执行                                        |
| ---------- | ----------------------------------------------- |
| 代码检查   | 运行 `pnpm lint && pnpm typecheck && pnpm test` |
| 登录验证   | 使用 Playwright 自动化登录流程                  |
| 页面验证   | 使用 Playwright 导航并截图                      |
| 交互验证   | 使用 Playwright 执行点击、输入等操作            |
| 持久化验证 | 使用 Playwright 刷新页面并验证数据              |
| 响应式验证 | 使用 Playwright 切换视口并截图                  |

### 使用 Playwright 进行 UI 验证

**Skill 路径：** `~/.claude/skills/playwright-skill`（以下用 `$SKILL_DIR` 表示）

**第一步：检测开发服务器**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**第二步：编写测试脚本到 /tmp**

```javascript
// /tmp/playwright-test-feature.js
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
  console.log('✅ 登录成功');

  // 导航到目标页面
  await page.click('text=项目管理'); // 根据实际菜单文字调整
  await page.waitForSelector('.project-list'); // 等待列表加载

  // 验证页面内容
  const title = await page.textContent('h1');
  console.log('页面标题:', title);

  // 截图留档
  await page.screenshot({ path: '/tmp/feature-verified.png', fullPage: true });
  console.log('📸 截图已保存');

  await browser.close();
})();
```

**第三步：执行测试**

```bash
cd $SKILL_DIR && node run.js /tmp/playwright-test-feature.js
```

**常用验证模式：**

```javascript
// 响应式验证
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];
for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.screenshot({ path: `/tmp/${vp.name}.png`, fullPage: true });
}

// 表单提交验证
await page.fill('input[name="name"]', '测试数据');
await page.click('button[type="submit"]');
await page.waitForSelector('.toast-success');

// 刷新后数据持久化验证
await page.reload();
await page.waitForSelector('.data-row');
const count = await page.locator('.data-row').count();
console.log('数据行数:', count);
```

**注意事项：**

- 测试脚本写到 `/tmp/` 目录
- 使用 `headless: false` 可视化调试
- 截图保存到 `/tmp/` 用于验证留档

**只有全部 steps 通过，才能标记 `passes: true`**

### 第七步：更新 feature_list.json（小心！）

**你只能修改一个字段：`passes`**

验证通过后，将：

```json
"passes": false
```

改为：

```json
"passes": true
```

**绝不：**

- 移除测试
- 编辑 description
- 修改 steps
- 合并或拆分测试
- 重新排序测试

### 第八步：提交代码

```bash
git add .
git commit -m "feat(module): 实现 XXX 功能

- 完成 feature_list.json 中 id: X 的测试用例
- [具体变更说明]

Verified:
- pnpm lint ✓
- pnpm test ✓
- 手动验证 ✓
"
```

### 第九步：更新进度笔记

更新 `claude-progress.txt`，包含：

- 你本会话完成了什么
- 你完成了哪些测试
- 发现或修复的任何问题
- 接下来应该做什么
- 当前完成状态（例如，“45/200 测试通过”）

### 第十步：干净地结束会话

在上下文填满之前：

1. ✅ 所有代码已提交
2. ✅ `feature_list.json` 已更新（如有通过的测试）
3. ✅ `claude-progress.txt` 已更新
4. ✅ `pnpm lint && pnpm test` 通过
5. ✅ 应用处于可运行状态

---

## 重要原则

### 代码规范

实现代码时**必须**遵循 `docs/框架扩展准则.md`：

- 后端 Service 继承 `ScopedService`
- 使用 `@RequirePermissions` 装饰器
- 前端使用 `PermissionGuard` / `PermissionButton`
- 页面放 `features/`，通用组件放 `components/`
- API 请求放 `lib/api/`，Hooks 放 `hooks/api/`

### 质量标准

- 零 lint 错误
- 零 typecheck 错误
- 所有测试通过
- 无控制台报错
- UI 符合设计规范

### 时间分配

- 你有无限的时间（跨越多个会话）
- 本会话目标：完美完成至少一个 feature
- 优先级：修复回归 > 实现新功能

---

**从运行第一步（明确方位）开始。**

所有反馈和文档使用**简体中文**。

如果运行命令时存在网络问题，可以使用代理：

```bash
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890
```
