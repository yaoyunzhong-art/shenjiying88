#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# restore-db.sh — 数据库恢复骨架脚本
#
# 用途:
#   从 backup-db.sh 生成的 .sql.gz 备份文件中恢复 PostgreSQL 数据库.
#   支持按文件名指定备份, 或自动选择最新的备份.
#
# 用法:
#   ./scripts/restore-db.sh                           # 恢复最新备份到默认 DB
#   ./scripts/restore-db.sh --file backups/dev/dump_20260723_030000.sql.gz  # 指定文件
#   ./scripts/restore-db.sh --env staging             # 恢复 staging 最新备份
#   ./scripts/restore-db.sh --help                    # 查看帮助
#
# 环境变量 (传入或 .env 文件):
#   BACKUP_DIR    — 本地备份存放目录 (默认: ./backups/postgres)
#   PGHOST        — 数据库主机
#   PGPORT        — 数据库端口
#   PGUSER        — 数据库用户
#   PGPASSWORD    — 数据库密码
#   PGDATABASE    — 数据库名
#   DATABASE_URL  — 完整 JDBC 连接串 (优先级高于上述 PG* 变量)
#   BACKUP_ENCRYPT_KEY — 备份加密密钥 (若备份有加密)
#   RESTORE_DROP_FIRST — 是否先 DROP 旧数据库再重建 (默认: false, 建议手动操作)
#
# 依赖:
#   - psql ≥ 15
#   - gunzip
#   - [可选] openssl (用于解密加密备份)
#
# 注意:
#   ⚠️ 这是骨架脚本, 使用前请根据实际环境填写 .env 变量.
#   ⚠️ 恢复会覆盖目标库全部数据, 生产环境务必谨慎操作!
#   ⚠️ 建议恢复前先执行备份 (backup-db.sh) 保底.
#   ⚠️ DROP 数据库操作在脚本中默认禁用, 请手动重建或修改脚本.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── 配置 ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/postgres}"
RESTORE_DROP_FIRST="${RESTORE_DROP_FIRST:-false}"

# ─── 加载 .env ─────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# ─── 颜色 ──────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# ─── 解析参数 ──────────────────────────────────────────
RESTORE_FILE=""
ENV_NAME="dev"

while [ $# -gt 0 ]; do
  case "$1" in
    --file) RESTORE_FILE="$2"; shift 2 ;;
    --env) ENV_NAME="$2"; shift 2 ;;
    --help) head -28 "$0"; exit 0 ;;
    *) shift ;;
  esac
done

# ─── 确定恢复文件 ───────────────────────────────────────
if [ -z "$RESTORE_FILE" ]; then
  # 自动选择 ENV 下最新备份
  RESTORE_FILE=$(ls -t "$BACKUP_DIR/$ENV_NAME"/*.sql.gz 2>/dev/null | head -1 || true)
  if [ -z "$RESTORE_FILE" ]; then
    echo -e "${RED}❌ 未找到 $ENV_NAME 环境的最新备份文件${NC}"
    exit 1
  fi
  echo "🔍 自动选择最新备份: $RESTORE_FILE"
else
  echo "📄 使用指定备份: $RESTORE_FILE"
fi

if [ ! -f "$RESTORE_FILE" ]; then
  echo -e "${RED}❌ 备份文件不存在: $RESTORE_FILE${NC}"
  exit 1
fi

# ─── 确认 ──────────────────────────────────────────────
echo ""
echo -e "${YELLOW}⚠️  ⚠️  ⚠️  重要警告 ⚠️  ⚠️  ⚠️${NC}"
echo "即将恢复数据库: ${DATABASE_URL:-postgresql://...}"
echo "这将会覆盖目标数据库的全部当前数据!"
echo "恢复文件: $RESTORE_FILE"
echo ""
echo -n "确认恢复? (输入 YES 继续): "
read -r CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "❌ 已取消."
  exit 1
fi

# ─── 解密 (可选) ────────────────────────────────────────
RESTORE_INPUT="$RESTORE_FILE"
if [[ "$RESTORE_FILE" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPT_KEY:-}" ]; then
    echo -e "${RED}❌ 备份已加密, 但 BACKUP_ENCRYPT_KEY 未设置${NC}"
    exit 1
  fi
  DECRYPTED_FILE="${RESTORE_FILE%.enc}"
  echo "🔓 解密备份文件..."
  openssl enc -d -aes-256-cbc -pbkdf2 \
    -in "$RESTORE_FILE" \
    -out "$DECRYPTED_FILE" \
    -pass "pass:$BACKUP_ENCRYPT_KEY"
  RESTORE_INPUT="$DECRYPTED_FILE"
fi

# ─── 执行恢复 ──────────────────────────────────────────
echo "🔄 开始恢复数据库..."

if [ -n "${DATABASE_URL:-}" ]; then
  gunzip -c "$RESTORE_INPUT" | psql "$DATABASE_URL" 2>&1
elif [ -n "${PGHOST:-}" ]; then
  PGPASSWORD="$PGPASSWORD" gunzip -c "$RESTORE_INPUT" | \
    psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE" 2>&1
else
  echo -e "${RED}❌ 错误: 请设置 DATABASE_URL 或 PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 数据库恢复完成${NC}"

# ─── 清理解密临时文件 ──────────────────────────────────
if [ -n "${DECRYPTED_FILE:-}" ] && [ -f "$DECRYPTED_FILE" ]; then
  rm "$DECRYPTED_FILE"
  echo "🧹 临时解密文件已清理"
fi

exit 0
