#!/usr/bin/env bash
# cron-billing-check.sh
# 用途: 周期性检查阿里云余额，余额不足时告警
# 建议 crontab: 0 */6 * * * bash /path/to/cron-billing-check.sh

OUTPUT=$(bash "$(dirname "$0")/check-aliyun-billing.sh" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 2 ]; then
  echo "🔴 [紧急] $OUTPUT"
  # === 可配置的告警通道 ===
  #
  # 钉钉 Webhook:
  # curl -X POST -H "Content-Type: application/json" \
  #   -d '{"msgtype":"text","text":{"content":"【神机营】阿里云余额紧急告警: 余额低于 ¥20，请立即充值！"}}' \
  #   $DINGTALK_WEBHOOK_URL
  #
  # 飞书 Webhook:
  # curl -X POST -H "Content-Type: application/json" \
  #   -d '{"msg_type":"text","content":{"text":"【神机营】阿里云余额紧急告警: 余额低于 ¥20，请立即充值！"}}' \
  #   $FEISHU_WEBHOOK_URL
  #
  # 企业微信 Webhook:
  # curl -X POST -H "Content-Type: application/json" \
  #   -d '{"msgtype":"text","text":{"content":"【神机营】阿里云余额紧急告警: 余额低于 ¥20，请立即充值！"}}' \
  #   $WECHAT_WEBHOOK_URL
  #
elif [ $EXIT_CODE -eq 1 ]; then
  echo "🔴 [API故障] $OUTPUT"
else
  echo "🟢 $OUTPUT"
fi
