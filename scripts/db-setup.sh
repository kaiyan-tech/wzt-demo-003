#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 读取数据库名：优先从根目录 .env 读取，否则使用默认值
if [ -f "$ROOT_DIR/.env" ]; then
  # 从 .env 文件读取 DB_NAME
  DB_NAME=$(grep -E '^DB_NAME=' "$ROOT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
fi
DB_NAME="${DB_NAME:-ky_framework}"
export DB_NAME

MIGRATIONS_DIR="${ROOT_DIR}/apps/backend/prisma/migrations"
MIGRATION_NAME="init_full_schema"
MAX_RETRIES="${MAX_RETRIES:-90}"

echo "📦 确认依赖..."
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ 未找到 Docker，请先安装并启动 Docker Desktop。"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker 未运行，请启动 Docker Desktop 后重试。"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ 未找到 pnpm，请先安装 pnpm（npm install -g pnpm）。"
  exit 1
fi

echo ""
echo "🐳 启动本地 PostgreSQL（docker compose up -d）..."
if ! docker compose up -d; then
  echo "❌ Docker 启动失败，请检查 docker compose 日志。"
  echo "   提示：docker compose logs -f postgres"
  exit 1
fi

echo ""
echo "⏳ 等待数据库就绪（最多 ${MAX_RETRIES}s）..."
echo "   数据库名: ${DB_NAME}"
for i in $(seq 1 "${MAX_RETRIES}"); do
  if docker compose exec -T postgres pg_isready -U postgres -d "$DB_NAME" >/dev/null 2>&1; then
    echo "✅ 数据库已就绪"
    break
  fi

  if [ "$i" -eq "${MAX_RETRIES}" ]; then
    echo "❌ 数据库启动超时，请检查 docker compose logs -f postgres"
    exit 1
  fi
  sleep 1
done

echo ""
echo "⚙️  生成 Prisma Client..."
pnpm --filter backend prisma:generate

echo ""
echo "📊 执行数据库迁移..."

has_valid_migrations() {
  if [ ! -d "$MIGRATIONS_DIR" ]; then
    return 1
  fi
  # 查找以 14 位时间戳开头的迁移目录（排除 migration_lock.toml 等文件）
  # 使用 -name 通配符匹配，兼容 macOS BSD find 和 Linux GNU find
  find "$MIGRATIONS_DIR" -maxdepth 1 -mindepth 1 -type d \
    -name '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*' \
    -print -quit | grep -q .
}

if has_valid_migrations; then
  MIGRATE_CMD=(pnpm --filter backend prisma:migrate:deploy)
  echo "检测到迁移目录，运行 prisma migrate deploy。"
else
  MIGRATE_CMD=(pnpm --filter backend prisma:migrate:dev --name "$MIGRATION_NAME")
  echo "未检测到有效迁移目录，运行 prisma migrate dev --name ${MIGRATION_NAME}。"
fi

set +e
"${MIGRATE_CMD[@]}"
MIGRATE_EXIT=$?
set -e

if [ "$MIGRATE_EXIT" -ne 0 ]; then
  echo "❌ 数据库迁移失败。"
  echo "  恢复建议："
  echo "    1) pnpm db:reset"
  echo "    2) pnpm db:setup"
  exit "$MIGRATE_EXIT"
fi

echo ""
echo "🔨 构建共享包（seed 依赖）..."
SHARED_DIST="${ROOT_DIR}/packages/dist/index.mjs"
if [ -f "$SHARED_DIST" ]; then
  echo "  ✓ 共享包已构建，跳过"
else
  pnpm --filter ./packages/shared build
fi

echo ""
echo "🌱 初始化种子数据..."
set +e
pnpm --filter backend prisma:seed
SEED_EXIT=$?
set -e

if [ "$SEED_EXIT" -ne 0 ]; then
  echo "❌ 种子数据失败，请检查日志。"
  echo "   手动重试：pnpm --filter backend prisma:seed"
  exit "$SEED_EXIT"
fi

echo ""
echo "✅ 数据库初始化完成"
