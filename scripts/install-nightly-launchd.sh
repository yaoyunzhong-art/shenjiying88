#!/bin/bash
# install-nightly-launchd.sh — 安装/卸载 Foundation11 夜间任务 launchd agent
#
# 用法:
#   bash scripts/install-nightly-launchd.sh install   # 安装并加载
#   bash scripts/install-nightly-launchd.sh uninstall # 卸载
#   bash scripts/install-nightly-launchd.sh status    # 查看状态

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.shenjiying88.nightly-foundation11.plist"
PLIST_SOURCE="$SCRIPT_DIR/$PLIST_NAME"
PLIST_TARGET="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== Foundation11 Launchd Agent 管理脚本 ==="
echo "源: $PLIST_SOURCE"
echo "目标: $PLIST_TARGET"
echo ""

case "${1:-}" in
  install)
    if [ ! -f "$PLIST_SOURCE" ]; then
      echo "❌ 源 plist 文件不存在: $PLIST_SOURCE"
      exit 1
    fi

    mkdir -p "$HOME/Library/LaunchAgents"
    cp "$PLIST_SOURCE" "$PLIST_TARGET"
    echo "✅ 已复制 plist 到 LaunchAgents"

    launchctl unload "$PLIST_TARGET" 2>/dev/null || true
    launchctl load "$PLIST_TARGET"
    echo "✅ launchd agent 已加载 (每天 0:00 执行 nightly-jobs.sh)"
    echo ""
    echo "查看日志:"
    echo "  tail -f $PROJECT_ROOT/docs/monitoring/nightly/launchd.log"
    echo ""
    echo "手动触发 (测试用):"
    echo "  launchctl kickstart -kp $PLIST_TARGET"
    ;;

  uninstall)
    launchctl unload "$PLIST_TARGET" 2>/dev/null || true
    rm -f "$PLIST_TARGET"
    echo "✅ 已卸载 launchd agent"
    ;;

  status)
    if launchctl print "gui/$(id -u)/$PLIST_NAME" >/dev/null 2>&1; then
      echo "✅ Agent 已加载"
      launchctl print "gui/$(id -u)/$PLIST_NAME" 2>/dev/null | grep -E "(com.apple|^lastExitStatus|label)" || true
    else
      echo "⚠️  Agent 未加载"
    fi
    ;;

  *)
    echo "用法: $0 {install|uninstall|status}"
    exit 1
    ;;
esac
