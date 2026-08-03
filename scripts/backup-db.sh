#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# backup-db.sh — 数据库备份骨架脚本
#
# 用途:
#   对 PostgreSQL 数据库执行 pg_dump 全量备份, 按环境区分备份目录,
#   保留 N 天历史, 可选上传到远端存储 (OSS/S3).
#
# 用法:
#   ./scripts/backup-db.sh                    # 读取默认 .env 执行备份
#   ./scripts/backup-db.sh --env staging      # staging 环境备份
#   ./scripts/backup-db.sh --env prod         # 生产环境备份
#   ./scripts/backup-db.sh --help             # 查看帮助
#
# 环境变量 (传入或 .env 文件):
#   BACKUP_DIR    — 本地备份存放目录 (默认: ./backups/postgres)
#   PGHOST        — 数据库主机
#   PGPORT        — 数据库端口
#   PGUSER        — 数据库用户
#   PGPASSWORD    — 数据库密码
#   PGDATABASE    — 数据库名
#   DATABASE_URL  — 完整 JDBC 连接串 (优先级高于上述 PG* 变量)
#   BACKUP_RETENTION_DAYS — 保留天数 (默认: 14)
#   BACKUP_REMOTE_URL     — 远端存储路径 (可选, 例如 s3://my-bucket/db-backup/)
#
# 依赖:
#   - pg_dump ≥ 15
#   - gzip
#   - [可选] aws CLI (用于远端上传)
#   - [可选] openssl (用于加密)
#
# 注意:
#   ⚠️ 这是骨架脚本, 使用前请根据实际环境填写 .env 变量.
#   ⚠️ 生产环境建议配合 cron 使用 (如 crontab -e 每天 03:00).
#   ⚠️ 加密功能 (BACKUP_ENCRYPT_KEY) 需手动开启.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── 配置 ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 默认值
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# ─── 加载 .env ─────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# ─── 解析参数 ──────────────────────────────────────────
ENV_NAME="${1:-dev}"  # default: dev
while [ $# -gt 0 ]; do
  case "$1" in
    --env) ENV_NAME="$2"; shift 2 ;;
    --help) head -30 "$0"; exit 0 ;;
    *) shift ;;
  esac
done

echo "🔧 环境: $ENV_NAME"

# ─── 准备备份目录 ───────────────────────────────────────
BACKUP_ENV_DIR="$BACKUP_DIR/$ENV_NAME"
mkdir -p "$BACKUP_ENV_DIR"

BACKUP_FILE="$BACKUP_ENV_DIR/${PGDATABASE:-shenjiying}_${TIMESTAMP}.sql.gz"
BACKUP_LOG="$BACKUP_ENV_DIR/backup_${TIMESTAMP}.log"

echo "📁 备份目录: $BACKUP_ENV_DIR"
echo "📄 备份文件: $BACKUP_FILE"

# ─── 执行 pg_dump ──────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
  echo "🔄 使用 DATABASE_URL 连接..."
  pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE" 2>> "$BACKUP_LOG"
elif [ -n "${PGHOST:-}" ]; then
  echo "🔄 使用 PG* 变量连接..."
  PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$PGHOST" \
    -p "${PGPORT:-5432}" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    --no-owner --no-acl | gzip > "$BACKUP_FILE" 2>> "$BACKUP_LOG"
else
  echo "❌ 错误: 请设置 DATABASE_URL 或 PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE"
  exit 1
fi

# ─── 校验 ──────────────────────────────────────────────
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ 备份完成: $FILE_SIZE"
else
  echo "❌ 错误: 备份文件为空或创建失败"
  exit 1
fi

# ─── 加密 (可选) ────────────────────────────────────────
if [ -n "${BACKUP_ENCRYPT_KEY:-}" ]; then
  echo "🔐 使用 BACKUP_ENCRYPT_KEY 加密备份..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "${BACKUP_FILE}.enc" \
    -pass "pass:$BACKUP_ENCRYPT_KEY"
  rm "$BACKUP_FILE"
  mv "${BACKUP_FILE}.enc" "$BACKUP_FILE"
  echo "✅ 加密完成"
fi

# ─── 远端上传 (可选) ────────────────────────────────────
if [ -n "${BACKUP_REMOTE_URL:-}" ]; then
  echo "☁️ 上传到远端存储 $BACKUP_REMOTE_URL ..."
  # 示例: aws s3 cp "$BACKUP_FILE" "$BACKUP_REMOTE_URL"
  echo "   (上传逻辑待根据实际存储配置启用)"
fi

# ─── 清理过期备份 ──────────────────────────────────────
echo "🧹 清理超过 ${BACKUP_RETENTION_DAYS} 天的旧备份..."
find "$BACKUP_ENV_DIR" -name "*.sql.gz" -type f -mtime "+$BACKUP_RETENTION_DAYS" -exec rm -v {} \;
find "$BACKUP_ENV_DIR" -name "*.log" -type f -mtime "+$BACKUP_RETENTION_DAYS" -exec rm -v {} \;

echo "🎉 备份流程完成"
exit 0
