# ═══════════════════════════════════════════════════════════════════════
# Testing System Installation · 测试体系安装脚本 V1.0
# ═══════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "  神机营 SaaS · 测试体系安装程序 V1.0"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# 检查环境
check_requirements() {
    echo "━━━ 环境检查 ━━━"
    
    # Node.js
    if command -v node &> /dev/null; then
        echo "✓ Node.js: $(node --version)"
    else
        echo "✗ Node.js 未安装"
        exit 1
    fi
    
    # pnpm
    if command -v pnpm &> /dev/null; then
        echo "✓ pnpm: $(pnpm --version)"
    else
        echo "✗ pnpm 未安装"
        exit 1
    fi
    
    # bash 4+
    if [[ "${BASH_VERSION}" < "4.0" ]]; then
        echo "✗ Bash版本过低 (需要4.0+)"
        exit 1
    fi
    echo "✓ Bash: $BASH_VERSION"
    
    echo ""
}

# 安装
install() {
    echo "━━━ 安装测试体系 ━━━"
    
    # 当前目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    TESTING_DIR="$SCRIPT_DIR/testing-system"
    
    # 创建必要目录
    mkdir -p "$TESTING_DIR"/{scheduler,monitoring,reporting,testcases,health,alerts,logs,reports,testdata}
    echo "✓ 目录结构已创建"
    
    # 使脚本可执行
    chmod +x "$TESTING_DIR"/**/*.sh 2>/dev/null || true
    chmod +x "$TESTING_DIR"/testing-master.sh
    echo "✓ 脚本权限已设置"
    
    # 安装npm依赖 (如果有)
    if [ -f "apps/api/package.json" ]; then
        echo "检查pnpm依赖..."
        cd apps/api && pnpm install --silent 2>/dev/null || true
        cd "$SCRIPT_DIR"
    fi
    
    echo ""
    echo "━━━ 安装选项 ━━━"
    echo ""
    echo "1. 仅安装测试体系 (不安装Cron)"
    echo "2. 安装测试体系 + Cron定时任务 (推荐)"
    echo "3. 立即启动测试体系"
    echo ""
    read -p "请选择 [1/2/3]: " choice
    
    case "$choice" in
        1)
            echo "安装完成"
            ;;
        2)
            bash "$TESTING_DIR/testing-master.sh" install
            echo "安装完成 (Cron已配置)"
            ;;
        3)
            bash "$TESTING_DIR/testing-master.sh" install
            bash "$TESTING_DIR/testing-master.sh" start
            ;;
        *)
            echo "无效选择"
            ;;
    esac
}

# 卸载
uninstall() {
    echo "━━━ 卸载测试体系 ━━━"
    
    # 停止所有服务
    bash testing-system/testing-master.sh stop 2>/dev/null || true
    
    # 移除Cron
    crontab -r 2>/dev/null || true
    
    # 可选: 保留日志和报告
    # rm -rf testing-system
    
    echo "✓ 卸载完成 (日志和报告已保留)"
}

# 主菜单
case "${1:-install}" in
    "install")
        check_requirements
        install
        ;;
    "uninstall")
        uninstall
        ;;
    "check")
        check_requirements
        ;;
    *)
        echo "用法: $0 [install|uninstall|check]"
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  安装完成!"
echo ""
echo "  启动测试体系: bash testing-system/testing-master.sh start"
echo "  查看状态:     bash testing-system/testing-master.sh status"
echo "  查看帮助:     bash testing-system/testing-master.sh help"
echo "═══════════════════════════════════════════════════════════════════════"
