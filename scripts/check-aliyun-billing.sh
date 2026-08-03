#!/usr/bin/env bash
# check-aliyun-billing.sh
# 用途: 检查阿里云余额是否即将耗尽，防止SLB锁定导致全体503
# 使用方式: bash scripts/check-aliyun-billing.sh

set -euo pipefail

ALARM_THRESHOLD=${ALARM_THRESHOLD:-100}      # 低于100元告警
CRITICAL_THRESHOLD=${CRITICAL_THRESHOLD:-20} # 低于20元紧急
BALANCE_OVERRIDE="${ALIYUN_BALANCE_CNY:-}"

echo "=== 阿里云余额检查 ==="
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"

read_balance_from_json() {
  python3 -c "
import sys, json
raw = sys.stdin.read().strip()
if not raw:
    print('')
    raise SystemExit(0)
data = json.loads(raw)
if isinstance(data, dict):
    if 'Data' in data and isinstance(data['Data'], dict) and 'AvailableAmount' in data['Data']:
        print(data['Data']['AvailableAmount'])
    elif 'AvailableAmount' in data:
        print(data['AvailableAmount'])
    else:
        print('')
" 2>/dev/null || true
}

is_valid_number() {
  printf '%s' "$1" | grep -qE '^[0-9]+([.][0-9]+)?$'
}

if [ -n "$BALANCE_OVERRIDE" ]; then
  BALANCE="$BALANCE_OVERRIDE"
  echo "余额来源: 环境变量 ALIYUN_BALANCE_CNY"
else
  # 检查 aliyun CLI 是否可用
  if ! command -v aliyun &>/dev/null; then
    echo "⚠️ aliyun CLI 未安装"
    echo "  请先安装或在当前会话提供 ALIYUN_BALANCE_CNY"
    echo "  例如: export ALIYUN_BALANCE_CNY=109.37"
    exit 1
  fi

  BALANCE_JSON="$(aliyun bssopenapi query-account-balance --output json 2>/dev/null || true)"
  if [ -z "$BALANCE_JSON" ]; then
    BALANCE_JSON="$(aliyun bssopenapi QueryAccountBalance --output json 2>/dev/null || true)"
  fi
  BALANCE="$(printf '%s' "$BALANCE_JSON" | read_balance_from_json)"
fi

echo "当前余额: ¥${BALANCE}"

if ! is_valid_number "$BALANCE"; then
  echo "⚠️ 无法自动查询余额"
  echo ""
  echo "=== 补救步骤 ==="
  echo "1. 登录阿里云控制台: https://usercenter2.aliyun.com"
  echo "2. 查看账户可用额度"
  echo "3. 或执行: export ALIYUN_BALANCE_CNY='<当前余额>' 后重新检查"
  exit 1
fi

if [ "$(echo "$BALANCE < $CRITICAL_THRESHOLD" | bc -l)" -eq 1 ]; then
  echo "🔴 紧急: 余额低于¥${CRITICAL_THRESHOLD}！立即充值！"
  exit 2
elif [ "$(echo "$BALANCE < $ALARM_THRESHOLD" | bc -l)" -eq 1 ]; then
  echo "🟡 警告: 余额低于¥${ALARM_THRESHOLD}，建议充值"
  exit 3
else
  echo "✅ 余额充足"
  exit 0
fi
