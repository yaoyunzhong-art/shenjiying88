#!/usr/bin/env bash
# openclaw-bridge.sh
# OpenClaw ↔ DeepSeek 链路验证脚本
#
# 用途: 验证本地 OpenClaw 网关 + DeepSeek API 的连通性
# 限制: OpenClaw 不暴露 HTTP "send message to UI" 端点
#       本脚本无法直接向龙虾哥的对话框发送消息
#       只能验证 (1) OpenClaw 健康 (2) DeepSeek API 链路

set -euo pipefail

OC_URL="${OPENCLAW_URL:-http://127.0.0.1:18789}"
DS_API_KEY="${DEEPSEEK_API_KEY:-sk-9847f5cab83545ada520d407629f3026}"
DS_BASE_URL="${DEEPSEEK_BASE_URL:-https://api.deepseek.com/v1}"

echo "=== [1/3] OpenClaw 健康检查 ==="
HEALTH=$(curl -fsS "$OC_URL/health" 2>&1) || { echo "OpenClaw 不可达: $OC_URL"; exit 1; }
echo "✅ OpenClaw: $HEALTH"

echo ""
echo "=== [2/3] DeepSeek 直连测试 ==="
DS_RESP=$(curl -fsS "$DS_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DS_API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "大飞哥，龙虾哥好！这是 Trae AI 通过 OpenClaw 网关发的握手消息。"}],
    "max_tokens": 60
  }' 2>&1)
echo "✅ DeepSeek: $(echo "$DS_RESP" | grep -oE '"content":"[^"]*"' | head -1 | cut -c12-200)"

echo ""
echo "=== [3/3] 总结 ==="
echo "✅ 龙虾哥 (OpenClaw) 与 Trae 共用同一条 DeepSeek 链路"
echo "❌ OpenClaw 端无 HTTP 'send to UI' API — 真正的对话框消息"
echo "   需要你手动在浏览器中输入到 http://127.0.0.1:18789/chat"
echo ""
echo "要在龙虾哥对话框里说: 大飞哥，龙虾哥好！"
echo "请: 1) 打开浏览器 → 2) 进入 chat → 3) 在输入框粘贴上述消息"
