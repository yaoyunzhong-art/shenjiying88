#!/usr/bin/env bash
# check-aliyun-billing.sh
# 用途: 检查阿里云余额是否即将耗尽，防止SLB锁定导致全体503
# 使用方式: bash scripts/check-aliyun-billing.sh

set -euo pipefail

ALARM_THRESHOLD=${ALARM_THRESHOLD:-100}      # 低于100元告警
CRITICAL_THRESHOLD=${CRITICAL_THRESHOLD:-20} # 低于20元紧急

echo "=== 阿里云余额检查 ==="
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"

# 检查 aliyun CLI 是否可用
if ! command -v aliyun &>/dev/null; then
  echo "⚠️ aliyun CLI 未安装"
  echo "  请先安装: pip install aliyun-python-sdk-core"
  echo "  或手动登录阿里云控制台检查"
  echo ""
  echo "=== 手动检查步骤 ==="
  echo "1. 登录阿里云控制台: https://usercenter2.aliyun.com"
  echo "2. 查看账户余额"
  echo "3. 如低于 ¥100 请及时充值"
  exit 0
fi

# 获取余额
BALANCE=$(aliyun bssopenapi QueryAccountBalance --output json 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'AvailableAmount' in d:
    print(float(d['AvailableAmount']))
else:
    print(-1)
" 2>/dev/null || echo "-2")

echo "当前余额: ¥${BALANCE}"

if [ "$(echo "$BALANCE < 0" | bc -l 2>/dev/null || echo 1)" -eq 1 ]; then
  echo "❌ 余额不足或无法查询！"
  echo ""
  echo "=== 紧急步骤 ==="
  echo "1. 登录阿里云控制台: https://usercenter2.aliyun.com"
  echo "2. 充值至少 ¥500"
  echo "3. 确认余额后重新检查"
  exit 1
fi

if [ "$(echo "$BALANCE < $CRITICAL_THRESHOLD" | bc -l)" -eq 1 ]; then
  echo "🔴 紧急: 余额低于¥${CRITICAL_THRESHOLD}！立即充值！"
  exit 2
elif [ "$(echo "$BALANCE < $ALARM_THRESHOLD" | bc -l)" -eq 1 ]; then
  echo "🟡 警告: 余额低于¥${ALARM_THRESHOLD}，建议充值"
  exit 0
else
  echo "✅ 余额充足"
  exit 0
fi
