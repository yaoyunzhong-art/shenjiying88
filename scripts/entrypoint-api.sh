#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# M5 API 容器入口脚本
#
# 职责:
#   1. 等待 PostgreSQL 就绪
#   2. 等待 Redis 就绪
#   3. 运行 Prisma 迁移 (可选,通过 PRISMA_MIGRATE 控制)
#   4. 执行数据库 Seed (可选,通过 PRISMA_SEED 控制)
#   5. 启动 NestJS 应用
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── 配置 ──────────────────────────────────────────────
API_PORT="${API_PORT:-3001}"
DATABASE_URL="${DATABASE_URL:-postgresql://m5:m5_prod_password@postgres:5432/m5}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
PRISMA_MIGRATE="${PRISMA_MIGRATE:-false}"
PRISMA_SEED="${PRISMA_SEED:-false}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# ─── 颜色输出 ──────────────────────────────────────────
info()  { echo "[ENTRYPOINT] [INFO]  $*"; }
warn()  { echo "[ENTRYPOINT] [WARN]  $*"; }
error() { echo "[ENTRYPOINT] [ERROR] $*" >&2; }
ok()    { echo "[ENTRYPOINT] [OK]    $*"; }

# ─── 等待 PostgreSQL ───────────────────────────────────
wait_for_postgres() {
    local host port user db
    host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
    port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    user=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
    db=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    host="${host:-postgres}"
    port="${port:-5432}"
    user="${user:-m5}"

    info "等待 PostgreSQL 就绪 ($host:$port)..."

    local retries=30
    local count=0
    until pg_isready -h "$host" -p "$port" -U "$user" -d "${db:-m5}" 2>/dev/null; do
        count=$((count + 1))
        if [ "$count" -ge "$retries" ]; then
            error "PostgreSQL 超过 $retries 次重试仍未就绪，退出"
            exit 1
        fi
        warn "PostgreSQL 未就绪，等待 2s (${count}/${retries})"
        sleep 2
    done
    ok "PostgreSQL 就绪"
}

# ─── 等待 Redis ────────────────────────────────────────
wait_for_redis() {
    info "等待 Redis 就绪 ($REDIS_HOST:$REDIS_PORT)..."

    local retries=30
    local count=0
    until redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -q "PONG"; do
        count=$((count + 1))
        if [ "$count" -ge "$retries" ]; then
            error "Redis 超过 $retries 次重试仍未就绪，退出"
            exit 1
        fi
        warn "Redis 未就绪，等待 2s (${count}/${retries})"
        sleep 2
    done
    ok "Redis 就绪"
}

# ─── 执行 Prisma 迁移 ──────────────────────────────────
run_prisma_migrate() {
    info "执行 Prisma 数据库迁移..."
    npx prisma migrate deploy --schema ./prisma/schema.prisma
    ok "Prisma 迁移完成"
}

# ─── 执行 Seed ─────────────────────────────────────────
run_prisma_seed() {
    info "执行数据库 Seed..."
    if [ -f prisma/seed.js ] || [ -f prisma/seed.ts ]; then
        npx prisma db seed --schema ./prisma/schema.prisma
        ok "Seed 完成"
    else
        warn "未找到 seed 文件，跳过"
    fi
}

# ─── 主流程 ────────────────────────────────────────────
main() {
    info "M5 API 入口脚本启动"
    info "环境: NODE_ENV=${NODE_ENV:-production}"
    info "端口: $API_PORT"
    info "数据库: $DATABASE_URL"

    # 等待依赖服务
    wait_for_postgres
    wait_for_redis

    # 数据库迁移
    if [ "$PRISMA_MIGRATE" = "true" ]; then
        run_prisma_migrate
    else
        info "PRISMA_MIGRATE=false，跳过数据库迁移"
    fi

    # Seed
    if [ "$PRISMA_SEED" = "true" ]; then
        run_prisma_seed
    else
        info "PRISMA_SEED=false，跳过 Seed"
    fi

    # 启动应用
    info "启动 NestJS 应用 (port $API_PORT)..."
    exec node dist/main.js
}

main
