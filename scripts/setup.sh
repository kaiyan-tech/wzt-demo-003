#!/bin/bash

# 开沿框架一站式初始化脚本
# 用法: ./scripts/setup.sh [options]
# 完成: git 重置 → 依赖安装 → 本地数据库 → 阿里云部署 → GitHub 配置

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup][warn]${NC} $*"; }
error() { echo -e "${RED}[setup][error]${NC} $*"; exit 1; }

# 检查 Node.js
log "检查 Node.js..."
if ! command -v node &> /dev/null; then
    error "未找到 Node.js，请先安装 Node.js >= 22"
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    error "Node.js 版本需要 >= 22，当前版本: $(node -v)"
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# 检查 pnpm
log "检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    log "未找到 pnpm，正在安装..."
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v | cut -d. -f1)
if [ "$PNPM_VERSION" -lt 10 ]; then
    error "pnpm 版本需要 >= 10，当前版本: $(pnpm -v)"
fi
echo -e "  ${GREEN}✓${NC} pnpm $(pnpm -v)"

log "安装依赖 (pnpm install)..."
pnpm install

# 调用 Node.js 脚本完成剩余初始化
log "启动初始化向导..."
node scripts/setup.mjs "$@"
