#!/bin/bash
# 🐜 fuse-check.sh — 熔断检测脚本 (V17: fuse-check)
# 读取同源fail计数器，连续同源fail×3触发P0熔断停线
# Part of: shenjiying88 V17 fuse-mechanism-v2
# Usage:
#   bash scripts/fuse-check.sh <module> <fail_type>
#   bash scripts/fuse-check.sh --reset
#   bash scripts/fuse-check.sh --reset --source="module"

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
FUSE_STATE="${PROJECT}/.fuse-state.json"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 帮助信息 ──────────────────────────────────────────────────────
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage:"
  echo "  bash scripts/fuse-check.sh <module> <fail_type>   记录一次同源失败"
  echo "  bash scripts/fuse-check.sh --reset               重置所有熔断"
  echo "  bash scripts/fuse-check.sh --reset --source=X    重置指定源熔断"
  echo ""
  echo "熔断规则:"
  echo "  同源 fail ×1 → 正常派修"
  echo "  同源 fail ×2 → P1 标记审查"
  echo "  同源 fail ×3 → P0 停线熔断"
  exit 0
fi

# ── 初始化状态文件 ────────────────────────────────────────────────
if [ ! -f "$FUSE_STATE" ]; then
  echo '{"fails":[],"paused":false}' > "$FUSE_STATE"
fi

# ── 重置模式 ─────────────────────────────────────────────────────
if [ "${1:-}" = "--reset" ]; then
  SOURCE=""
  for arg in "$@"; do
    case "$arg" in
      --source=*) SOURCE="${arg#--source=}" ;;
    esac
  done

  if [ -n "$SOURCE" ]; then
    # 按 sourceKey 重置
    python3 -c "
import json
with open('$FUSE_STATE') as f:
    d = json.load(f)
d['fails'] = [f for f in d['fails'] if f.get('module') != '$SOURCE']
with open('$FUSE_STATE', 'w') as f:
    json.dump(d, f)
print('FUSE_RESET_SOURCE: $SOURCE')
" 2>&1
    echo "[fuse-check] $NOW — ℹ️ 熔断重置: $SOURCE"
  else
    # 全部重置
    echo '{"fails":[],"paused":false}' > "$FUSE_STATE"
    echo "[fuse-check] $NOW — ℹ️ 熔断全部重置"
  fi
  exit 0
fi

# ── 记录失败模式 ─────────────────────────────────────────────────
MODULE=${1:-"unknown"}
FAIL_TYPE=${2:-"unknown"}

echo "[fuse-check] $NOW — 🔌 检查熔断: module=$MODULE fail_type=$FAIL_TYPE"

# 用 python3 处理 JSON 逻辑
python3 -c "
import json, sys
with open('$FUSE_STATE') as f:
    d = json.load(f)

found = False
for f in d['fails']:
    if f['module'] == '$MODULE':
        f['count'] += 1
        f['last'] = '$FAIL_TYPE'
        f['last_at'] = '$NOW'
        found = True
        if f['count'] >= 3:
            d['paused'] = True
            print(f'⛔ FUSE TRIPPED (P0): $MODULE failed {f[\"count\"]} times! Pipeline PAUSED')
        elif f['count'] >= 2:
            print(f'⚠️ FUSE WARNING (P1): $MODULE failed {f[\"count\"]} times — 2h RCA required')
        else:
            print(f'ℹ️ FUSE LOG: $MODULE failed {f[\"count\"]} time — normal dispatch')
        break

if not found:
    d['fails'].append({'module': '$MODULE', 'count': 1, 'last': '$FAIL_TYPE', 'last_at': '$NOW'})
    print(f'ℹ️ FUSE LOG: $MODULE failed 1 time — normal dispatch')

with open('$FUSE_STATE', 'w') as f:
    json.dump(d, f, indent=2)
" 2>&1

echo "[fuse-check] $NOW — ✅ FUSE_CHECK_DONE"
