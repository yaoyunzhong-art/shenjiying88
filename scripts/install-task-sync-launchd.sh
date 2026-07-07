#!/bin/bash
# install-task-sync-launchd.sh · 安装任务同步 launchd 服务
#
# 用途: 安装每小时运行的任务同步脚本为 macOS launchd 服务
# 调用: bash scripts/install-task-sync-launchd.sh [--uninstall]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.shenjiying88.task-sync.plist"
PLIST_SOURCE="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

INSTALL=false
UNINSTALL=false

if [[ "$1" == "--install" ]]; then
  INSTALL=true
elif [[ "$1" == "--uninstall" ]]; then
  UNINSTALL=true
fi

if [[ "$UNINSTALL" == "true" ]]; then
  echo "🔧 卸载任务同步 launchd 服务..."
  if [[ -f "$PLIST_DEST" ]]; then
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm "$PLIST_DEST"
    echo "✅ 已卸载: $PLIST_DEST"
  else
    echo "ℹ️ 未安装: $PLIST_NAME"
  fi
  exit 0
fi

if [[ "$INSTALL" == "false" ]]; then
  echo "📋 任务同步 launchd 配置:"
  echo ""
  echo "  频率: 每小时 (3600秒)"
  echo "  脚本: $SCRIPT_DIR/task-sync.sh"
  echo "  日志: logs/task-sync.log"
  echo "  Plist: $PLIST_SOURCE"
  echo ""
  echo "  安装到: $PLIST_DEST"
  echo ""
  echo "🚀 安装命令:"
  echo "  bash scripts/install-task-sync-launchd.sh --install"
  echo ""
  echo "🚀 卸载命令:"
  echo "  bash scripts/install-task-sync-launchd.sh --uninstall"
  echo ""
  echo "📝 手动管理:"
  echo "  launchctl load $PLIST_DEST   # 启动"
  echo "  launchctl unload $PLIST_DEST # 停止"
  echo "  launchctl start $PLIST_DEST  # 立即执行一次"
  exit 0
fi

# 安装
echo "🔧 安装任务同步 launchd 服务..."

# 确保 LaunchAgents 目录存在
mkdir -p "$HOME/Library/LaunchAgents"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/../logs"

# 复制 plist
cp "$PLIST_SOURCE" "$PLIST_DEST"
echo "✅ 已安装: $PLIST_DEST"

# 加载服务
launchctl load "$PLIST_DEST"
echo "✅ 服务已加载"

echo ""
echo "📋 服务状态:"
echo "  标签: com.shenjiying88.task-sync"
echo "  频率: 每小时 (3600秒)"
echo "  日志: $SCRIPT_DIR/../logs/task-sync.log"
echo ""
echo "🚀 管理命令:"
echo "  launchctl list | grep task-sync      # 查看状态"
echo "  launchctl start com.shenjiying88.task-sync  # 立即执行"
echo "  launchctl unload $PLIST_DEST         # 停止服务"
