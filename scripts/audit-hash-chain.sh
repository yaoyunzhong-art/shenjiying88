#!/usr/bin/env bash
# ============================================================
# 审计哈希链 - 计算当日审计报告SHA-256并追加到链文件
# 格式: YYYY-MM-DD | SHA256:xxx | PREV:yyy
# 🐜 [V17: audit-quality-fuse]
# ============================================================
set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
KNOWLEDGE_DIR="$PROJECT/docs/knowledge"
CHAIN_FILE="$PROJECT/.audit-hash-chain"
TODAY="$(date +%Y-%m-%d)"

# 收集所有审计文件并计算整体哈希
ALL_AUDIT_FILES=$(find "$KNOWLEDGE_DIR" -name "*-audit.md" -type f 2>/dev/null | sort)

if [ -z "$ALL_AUDIT_FILES" ]; then
    echo "⚠️  未找到审计文件"
    exit 1
fi

# 计算所有审计文件的 SHA-256 联合哈希 (对整个内容排序后cat再哈希)
HASH=$(cat $ALL_AUDIT_FILES | shasum -a 256 | cut -d' ' -f1)

# 获取前一次哈希
if [ -f "$CHAIN_FILE" ]; then
    PREV_HASH=$(tail -1 "$CHAIN_FILE" | sed -E 's/^[^|]*\| SHA256:([^ ]+).*$/\1/')
else
    PREV_HASH="0000000000000000000000000000000000000000000000000000000000000000"
fi

# 追加新记录
echo "$TODAY | SHA256:$HASH | PREV:$PREV_HASH" >> "$CHAIN_FILE"

echo "=== 哈希链追加完成 ==="
echo "  日期: $TODAY"
echo "  当前哈希: $HASH"
echo "  前驱哈希: $PREV_HASH"
echo "  链文件: $CHAIN_FILE"
echo ""
echo "链完整性验证:"
CHAIN_COUNT=$(wc -l < "$CHAIN_FILE")
echo "  链长度: $CHAIN_COUNT 条记录"

# 验证链完整性 (从头到尾)
echo "  链验证: "
PREV_CHECK="0000000000000000000000000000000000000000000000000000000000000000"
VERIFIED=true
while IFS=" | " read -r DATE HASH_STR PREV_STR; do
    HASH_VAL=$(echo "$HASH_STR" | sed 's/^SHA256://')
    PREV_VAL=$(echo "$PREV_STR" | sed 's/^PREV://')
    if [ "$PREV_VAL" != "$PREV_CHECK" ]; then
        echo "    ❌ 断链: $DATE 的前驱 $PREV_VAL 不匹配 $PREV_CHECK"
        VERIFIED=false
    fi
    PREV_CHECK="$HASH_VAL"
done < "$CHAIN_FILE"

if [ "$VERIFIED" = true ]; then
    echo "    ✅ 链完整: 所有记录哈希一致"
fi
