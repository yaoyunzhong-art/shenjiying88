#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# V7.0 安装脚本 · 全自动后台测试执行器
# 安装后每天自动在后台静默执行测试
# ═══════════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

SCRIPT_DIR="$(pwd)/scripts"
PLIST_FILE="com.shenjiying88.testing-silent.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/"

echo "═══════════════════════════════════════════════════════════"
echo "V7.0 全自动后台测试执行器安装"
echo "═══════════════════════════════════════════════════════════"

# 检查脚本是否存在
if [ ! -f "$SCRIPT_DIR/testing-silent-run.sh" ]; then
    echo "错误: 找不到测试脚本 $SCRIPT_DIR/testing-silent-run.sh"
    exit 1
fi

# 使脚本可执行
chmod +x "$SCRIPT_DIR/testing-silent-run.sh"

# 创建 LaunchAgents 目录
mkdir -p "$PLIST_DEST"

# 生成 plist
cat > "$PLIST_DEST/$PLIST_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shenjiying88.testing-silent</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/testing-silent-run.sh</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/logs/testing/launchd.out.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/logs/testing/launchd.error.log</string>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    
    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

echo "已创建 LaunchAgent: $PLIST_DEST/$PLIST_FILE"

# 加载服务
echo "加载 LaunchAgent..."
launchctl load "$PLIST_DEST/$PLIST_FILE" 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "安装完成!"
echo ""
echo "服务状态:"
launchctl list | grep "com.shenjiying88.testing-silent" || echo "服务已加载(需要重启或重新登录)"
echo ""
echo "手动启动: launchctl load $PLIST_DEST/$PLIST_FILE"
echo "手动停止: launchctl unload $PLIST_DEST/$PLIST_FILE"
echo "查看日志: tail -f logs/testing/silent-test-$(date +%Y-%m-%d).log"
echo "═══════════════════════════════════════════════════════════"
