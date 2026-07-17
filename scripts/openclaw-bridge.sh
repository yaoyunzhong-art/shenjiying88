#!/usr/bin/env bash
# openclaw-bridge.sh
# Tree ↔ OpenClaw 本地握手脚本
#
# 用途: 在不触碰生产部署的前提下，验证本地 OpenClaw/龙虾哥服务是否可达，
#       并输出一段可直接发送到龙虾哥对话框的握手消息。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_ENDPOINT="${OPENCLAW_ENDPOINT:-ws://127.0.0.1:18789}"
HANDSHAKE_MESSAGE="${HANDSHAKE_MESSAGE:-大飞哥，树哥已完成本地握手预检；当前生产部署保持只读观察中，请龙虾哥继续接棒时不要触碰 infra/、.gitlab-ci.yml 与正在运行的 ACK 发布链路。}"

echo "=== [1/3] 本地 OpenClaw 握手预检 ==="
node "$ROOT_DIR/scripts/lobster-handshake.mjs" "$OPENCLAW_ENDPOINT"

echo ""
echo "=== [2/3] 安全边界 ==="
echo "✅ 仅探测本地 OpenClaw 监听与 websocket/http 健康"
echo "✅ 不调用外部模型 API"
echo "✅ 不读取或修改任何生产部署配置"

echo ""
echo "=== [3/3] 发给龙虾哥的握手消息 ==="
printf '%s\n' "$HANDSHAKE_MESSAGE"
echo ""
echo "如需手动发送:"
echo "1) 打开 OpenClaw 聊天页"
echo "2) 粘贴上方握手消息"
echo "3) 明确说明当前生产部署处于保护状态，仅允许只读观察"
