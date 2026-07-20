#!/usr/bin/env bash
# ============================================================================
# Gate5-C1 deviceToken 持久化评估脚本
#
# 背景:
#   Gate5 合规财务审计签署条件之一：deviceToken 必须持久化存储。
#   评估 PushRecord.deviceToken 当前存储方式是否满足合规要求。
#
# 扫描范围:
#   apps/api/src/modules/push/
#
# 输出:
#   pass  /  warning  /  fail
# ============================================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PUSH_DIR="$REPO_DIR/apps/api/src/modules/push"

PASS=0
WARN=0
FAIL=0
MESSAGES=()

log_pass()  { MESSAGES+=("[PASS]  $1");  PASS=$((PASS+1)); true; }
log_warn()  { MESSAGES+=("[WARN]  $1");  WARN=$((WARN+1)); true; }
log_fail()  { MESSAGES+=("[FAIL]  $1");  FAIL=$((FAIL+1)); true; }

echo "============================================"
echo " Gate5-C1 deviceToken 持久化评估"
echo " 扫描目录: ${PUSH_DIR}"
echo "============================================"
echo ""

# ── Step 1: 检查 PushRecord 实体文件是否存在 ────────────────────────────
ENTITY_FILE="$PUSH_DIR/push.entity.ts"
if [[ ! -f "$ENTITY_FILE" ]]; then
  log_fail "push.entity.ts 不存在于 $PUSH_DIR"
else
  log_pass "push.entity.ts 存在"

  # ── Step 2: 检查 PushRecord 是否为 TypeORM @Entity ──
  if grep -q '@Entity(' "$ENTITY_FILE" 2>/dev/null; then
    log_pass "PushRecord 或相关实体使用了 TypeORM @Entity 装饰器"
  else
    log_warn "PushRecord 定义中未发现 @Entity 装饰器（可能为纯 interface）"
  fi

  # ── Step 3: 检查 deviceToken 字段类型定义 ──
  DEVTOKEN_LINE=$(grep -n 'deviceToken' "$ENTITY_FILE" | head -5)
  if echo "$DEVTOKEN_LINE" | grep -q 'deviceToken'; then
    log_pass "deviceToken 字段已定义"
    echo "     定义内容:"
    echo "$DEVTOKEN_LINE" | sed 's/^/        /'
  else
    log_fail "push.entity.ts 中未找到 deviceToken 字段"
  fi

  # ── Step 4: 检查是否有 @Column 装饰器（DB 列映射） ──
  COLUMN_CONTEXT=$(grep -B2 -A2 'deviceToken' "$ENTITY_FILE" 2>/dev/null || true)
  if echo "$COLUMN_CONTEXT" | grep -q '@Column'; then
    log_pass "deviceToken 字段使用了 @Column 装饰器（DB 列映射）"
  else
    log_fail "deviceToken 字段未使用 @Column 装饰器（非 DB 持久化）"
    echo "     deviceToken 定义上下文："
    echo "$COLUMN_CONTEXT" | sed 's/^/       /'
  fi

  # ── Step 5: 检查是否有索引 ──
  INDEX_USED=false
  if grep -q '@Index' "$ENTITY_FILE" 2>/dev/null; then
    INDEX_USED=true
  fi
  # 检查 PushRecord 接口/类相关上下文中是否有 @Index
  if echo "$COLUMN_CONTEXT" | grep -q '@Index'; then
    INDEX_USED=true
  fi
  if $INDEX_USED; then
    log_pass "deviceToken 或相关字段使用了 @Index 索引"
  else
    log_warn "deviceToken 字段未发现 @Index 索引（高频查询建议索引）"
  fi

  # ── Step 6: 检查是否有 @OneToMany / @ManyToOne 等 ORM 关系 ──
  if grep -q '@OneToMany\|@ManyToOne\|@JoinColumn' "$ENTITY_FILE" 2>/dev/null; then
    log_pass "PushRecord 定义了 ORM 关系映射"
  else
    log_warn "PushRecord 未定义 ORM 关系（纯接口无关系映射是正常的）"
  fi
fi

echo ""
echo "── Step 7: 检查 PushRecord 存储方式 ──"

SERVICE_FILE="$PUSH_DIR/push.service.ts"
STORAGE_TYPE="unknown"
STORAGE_EVIDENCE=""

if [[ -f "$SERVICE_FILE" ]]; then
  # 检查是否使用私有 Map（内存存储）
  if grep -q 'private.*pushHistory.*Map\|private.*Map.*PushRecord' "$SERVICE_FILE" 2>/dev/null; then
    STORAGE_TYPE="memory"
    STORAGE_EVIDENCE=$(grep -n 'private.*pushHistory\|private.*Map.*PushRecord' "$SERVICE_FILE" 2>/dev/null | head -3)
  fi

  # 检查是否使用 DB Repository（TypeORM）
  if grep -q '@InjectRepository\|this\.pushRecordRepo\|this\.pushRepository\|findOne.*deviceToken' "$SERVICE_FILE" 2>/dev/null; then
    STORAGE_TYPE="database"
    STORAGE_EVIDENCE=$(grep -n '@InjectRepository\|this\.pushRecordRepo\|this\.pushRepository\|findOne.*deviceToken' "$SERVICE_FILE" 2>/dev/null | head -3)
  fi

  # 检查是否使用 Redis
  if grep -q 'this\.redis\|@InjectRedis\|redisClient\|RedisService' "$SERVICE_FILE" 2>/dev/null; then
    if [[ "$STORAGE_TYPE" != "database" ]]; then
      STORAGE_TYPE="redis"
    else
      STORAGE_TYPE="database+redis"
    fi
    STORAGE_EVIDENCE="$STORAGE_EVIDENCE"$'\n'"$(grep -n 'this\.redis\|@InjectRedis\|redisClient' "$SERVICE_FILE" 2>/dev/null | head -3)"
  fi
fi

case "$STORAGE_TYPE" in
  "database")
    log_pass "PushRecord 使用数据库持久化存储 (TypeORM)"
    echo "     $STORAGE_EVIDENCE" | sed 's/^/       /'
    ;;
  "redis")
    log_pass "PushRecord 使用 Redis 持久化存储"
    echo "     $STORAGE_EVIDENCE" | sed 's/^/       /'
    ;;
  "database+redis")
    log_pass "PushRecord 同时使用数据库 + Redis 持久化存储"
    echo "     $STORAGE_EVIDENCE" | sed 's/^/       /'
    ;;
  "memory")
    log_fail "PushRecord 使用 内存存储 (private Map) — 不符合 Gate5 持久化要求"
    echo "     $STORAGE_EVIDENCE" | sed 's/^/       /'
    echo ""
    echo "     ── 建议 ──"
    echo "     方案A：改为 TypeORM 数据库存储"
    echo "       1. 将 PushRecord 改为 @Entity() class"
    echo "       2. deviceToken 添加 @Column({ type: 'varchar', length: 256 })"
    echo "       3. 添加 @Index() 加速按 deviceToken 查询"
    echo "       4. 注入 Repository<PushRecordEntity>"
    echo "       5. 实现 CRUD (findByDeviceToken / save / update)"
    echo ""
    echo "     方案B：改为 Redis 存储（用于高并发推送场景）"
    echo "       1. 注入 RedisService 或 @InjectRedis()"
    echo "       2. deviceToken → PushRecord[] 用 Redis Hash 或 Sorted Set 存储"
    echo "       3. TTL 策略按合规要求配置"
    ;;
  *)
    # 如果没匹配到，再检查 service 中实际的存储方式
    log_fail "无法确定 PushRecord 存储方式"
    echo "     Service 文件: $SERVICE_FILE"
    echo "     请人工检查存储逻辑"
    ;;
esac

echo ""
echo "── Step 8: 检查 push.module.ts 是否导入 TypeORM ──"
MODULE_FILE="$PUSH_DIR/push.module.ts"
if [[ -f "$MODULE_FILE" ]]; then
  if grep -q 'TypeOrmModule\|TypeOrmModule.forFeature' "$MODULE_FILE" 2>/dev/null; then
    log_pass "push.module.ts 已导入 TypeORM"
  else
    log_warn "push.module.ts 未导入 TypeORM (如果需 DB 存储需添加)"
  fi
fi

echo ""
echo "── Step 9: 检查是否有 deviceToken 相关的 DB migration ──"
MIGRATIONS_FOUND=$(find "$REPO_DIR" -path "*/migrations/*" -name "*.ts" \
  -exec grep -l "deviceToken\|device_token\|push_record" {} \; 2>/dev/null || true)
if [[ -n "$MIGRATIONS_FOUND" ]]; then
  log_pass "发现 deviceToken / push_record 相关 migration 文件"
  echo "$MIGRATIONS_FOUND" | sed 's/^/       /'
else
  log_warn "未发现 deviceToken / push_record 相关 migration 文件（首次部署需创建）"
fi

echo ""
echo "============================================"
echo " 评估结果汇总"
echo "============================================"
echo ""
echo "  PASS:   $PASS"
echo "  WARN:   $WARN"
echo "  FAIL:   $FAIL"
echo ""

# 打印详细消息
echo "── 详细检查项 ──"
for msg in "${MESSAGES[@]}"; do
  echo "  $msg"
done

echo ""
echo "── 最终判定 ──"
if (( FAIL > 0 )); then
  echo "  ❌ FAIL — 存在 $FAIL 项未通过，请修复后再签署"
  echo ""
  echo "  关键修复项（优先级从高到低）："
  for msg in "${MESSAGES[@]}"; do
    if [[ "$msg" == "[FAIL]"* ]]; then
      echo "    - ${msg#*]  }"
    fi
  done
  exit 1
elif (( WARN > 0 )); then
  echo "  ⚠️  WARNING — 全部 PASS，但有 $WARN 项建议关注"
  exit 0
else
  echo "  ✅ PASS — 全部检查项通过，deviceToken 已满足持久化要求"
  exit 0
fi
