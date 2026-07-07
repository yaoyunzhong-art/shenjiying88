#!/usr/bin/env bash
# setup-monitoring-cron.sh · 配置/卸载 等待期监控 cron (Pulse-68 闭环)
#
# 功能:
#   写入 crontab, 自动跑监控日报 / RFC 提醒 / Standup 准备
#   默认时区: Asia/Shanghai (crontab 自身无时区概念,脚本内部已设 TZ)
#
# 用法:
#   bash scripts/setup-monitoring-cron.sh                  # 默认 dry-run 预览
#   bash scripts/setup-monitoring-cron.sh --install       # 安装 crontab
#   bash scripts/setup-monitoring-cron.sh --uninstall     # 卸载本脚本相关的 cron
#   bash scripts/setup-monitoring-cron.sh --show          # 显示当前已装的 cron
#   bash scripts/setup-monitoring-cron.sh --dry-run       # 预览将要安装的内容
#
# 退出码:
#   0 - 成功 (install/uninstall/show/dry-run)
#   1 - crontab 命令不可用
#   2 - 参数错误
#
# 关联: scripts/monitoring-daily.sh · scripts/rfc-remind.sh · scripts/standup-prep.py

set -u

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---------- 参数 ----------
ACTION="dry-run"  # install | uninstall | show | dry-run
for arg in "$@"; do
  case "$arg" in
    --install)   ACTION="install" ;;
    --uninstall) ACTION="uninstall" ;;
    --show)      ACTION="show" ;;
    --dry-run)   ACTION="dry-run" ;;
    -h|--help)
      cat <<'USAGE'
setup-monitoring-cron.sh · 配置/卸载 等待期监控 cron

用法:
  bash scripts/setup-monitoring-cron.sh [选项]

选项:
  --install    写入 crontab (含防重复检查)
  --uninstall  移除本脚本相关的 cron 行
  --show       显示当前 crontab 中相关的 cron 行
  --dry-run    只预览,不实际修改 (默认)
  -h, --help   显示本帮助

监控任务:
  - 每日 00:00  monitoring-daily.sh      -> /var/log/rfc.log
  - 每 6 小时   rfc-remind.sh 24         -> /var/log/rfc-remind.log
  - 工作日 8:30 standup-prep.py --force  -> /var/log/standup.log

示例:
  bash scripts/setup-monitoring-cron.sh --show
  bash scripts/setup-monitoring-cron.sh --dry-run
  bash scripts/setup-monitoring-cron.sh --install
USAGE
      exit 0
      ;;
    *)
      echo -e "${RED}❌ 未知参数: $arg${NC}" >&2
      exit 2
      ;;
  esac
done

# ---------- 前置检查 ----------
if ! command -v crontab >/dev/null 2>&1; then
  echo -e "${RED}❌ 未找到 crontab 命令${NC}" >&2
  echo -e "${YELLOW}   macOS:  应已自带 (cron / launchd)${NC}" >&2
  echo -e "${YELLOW}   Linux:  apt install cron / yum install cronie${NC}" >&2
  exit 1
fi

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MONITORING_SCRIPT="$REPO_ROOT/scripts/monitoring-daily.sh"
RFC_REMIND_SCRIPT="$REPO_ROOT/scripts/rfc-remind.sh"
STANDUP_SCRIPT="$REPO_ROOT/scripts/standup-prep.py"

# ---------- 工具函数 ----------
log()  { printf '%b\n' "$*"; }
ok()   { log "${GREEN}✅${NC} $*"; }
warn() { log "${YELLOW}⚠️ ${NC} $*"; }
err()  { log "${RED}❌${NC} $*" >&2; }
info() { log "${CYAN}ℹ️ ${NC} $*"; }

# ---------- Cron 模板 (用唯一标记识别本脚本的 cron 行) ----------
CRON_MARKER="# >>> shenjiying-monitoring-cron (DO NOT EDIT THIS LINE MANUALLY) <<<"
CRON_FOOTER="# <<< shenjiying-monitoring-cron <<<"

build_cron_block() {
  cat <<EOF
$CRON_MARKER
0 0 * * *    cd $REPO_ROOT && bash $MONITORING_SCRIPT >> /var/log/rfc.log 2>&1
0 */6 * * *  cd $REPO_ROOT && bash $RFC_REMIND_SCRIPT 24 >> /var/log/rfc-remind.log 2>&1
30 8 * * 1-5 cd $REPO_ROOT && python3 $STANDUP_SCRIPT --force >> /var/log/standup.log 2>&1
$CRON_FOOTER
EOF
}

# ---------- 检查依赖脚本存在 ----------
check_scripts() {
  local missing=0
  for f in "$MONITORING_SCRIPT" "$RFC_REMIND_SCRIPT" "$STANDUP_SCRIPT"; do
    if [ ! -f "$f" ]; then
      err "依赖脚本不存在: $f"
      missing=1
    fi
  done
  return "$missing"
}

# ---------- 当前 crontab ----------
get_current_crontab() {
  crontab -l 2>/dev/null || echo ""
}

# ---------- 防重复: 检测是否已存在本脚本的 cron ----------
has_existing_block() {
  local crontab_content="$1"
  echo "$crontab_content" | grep -qF "$CRON_MARKER"
}

count_existing_blocks() {
  local crontab_content="$1"
  # 一个完整的 block 包含 marker + footer + 3 行 cron
  echo "$crontab_content" | grep -cF "$CRON_MARKER"
}

# ---------- 操作: show ----------
do_show() {
  echo ""
  echo "============================================"
  echo "🔍 当前 crontab 中的 shenjiying-monitoring 行"
  echo "============================================"
  echo ""

  local current
  current=$(get_current_crontab)
  if [ -z "$current" ]; then
    info "(crontab 为空)"
    return 0
  fi

  if ! echo "$current" | grep -qF "$CRON_MARKER"; then
    info "(未找到 shenjiying-monitoring cron 块)"
    return 0
  fi

  echo "$current" | awk -v marker="$CRON_MARKER" -v footer="$CRON_FOOTER" '
    $0 == marker { capture = 1 }
    capture { print "  " $0 }
    $0 == footer { capture = 0 }
  '
  echo ""
  echo "---------------------------------------------"
  echo ""
  local count
  count=$(count_existing_blocks "$current")
  if [ "$count" -gt 1 ]; then
    warn "检测到 $count 个 shenjiying-monitoring 块 (建议运行 --uninstall 后 --install)"
  fi
  echo "============================================"
}

# ---------- 操作: dry-run ----------
do_dry_run() {
  echo ""
  echo "============================================"
  echo "📋 预览: 将要写入 crontab 的内容"
  echo "============================================"
  echo ""
  echo "(标识块唯一,运行 --install 时若检测到已存在会跳过重复写入)"
  echo ""

  build_cron_block | sed 's/^/  /'
  echo ""
  echo "============================================"
  echo ""
  info "时区: Asia/Shanghai (脚本内部 TZ 设置)"
  info "日志: /var/log/rfc.log /var/log/rfc-remind.log /var/log/standup.log"
  info "如需真正写入,运行: bash scripts/setup-monitoring-cron.sh --install"
  echo ""
}

# ---------- 操作: install ----------
do_install() {
  echo ""
  echo "============================================"
  echo "🚀 安装 shenjiying-monitoring cron"
  echo "============================================"
  echo ""

  if ! check_scripts; then
    exit 1
  fi
  ok "依赖脚本检查通过"
  echo ""

  local current
  current=$(get_current_crontab)

  if has_existing_block "$current"; then
    local count
    count=$(count_existing_blocks "$current")
    if [ "$count" -eq 1 ]; then
      warn "检测到已存在的 shenjiying-monitoring 块,跳过写入 (幂等保护)"
      info "如需更新内容,先运行 --uninstall 再 --install"
      echo ""
      do_show
      return 0
    else
      err "检测到 $count 个 shenjiying-monitoring 块,污染!"
      info "建议: bash scripts/setup-monitoring-cron.sh --uninstall 后 --install"
      exit 1
    fi
  fi

  local new_block
  new_block=$(build_cron_block)

  # 备份当前 crontab
  local backup_file
  backup_file="/tmp/shenjiying-crontab.backup.$(TZ='Asia/Shanghai' date '+%Y%m%d-%H%M%S')"
  if [ -n "$current" ]; then
    echo "$current" > "$backup_file"
    ok "已备份当前 crontab 到: $backup_file"
  else
    info "(当前 crontab 为空,无需备份)"
  fi

  # 追加新块 (在末尾追加一个空行 + 新块)
  local merged
  if [ -n "$current" ]; then
    merged=$(printf '%s\n\n%s\n' "$current" "$new_block")
  else
    merged="$new_block"
  fi

  # 写入
  echo "$merged" | crontab -
  ok "crontab 已更新"
  echo ""

  # 验证
  echo "---------------------------------------------"
  echo ""
  do_show
  echo ""
  info "验证命令: crontab -l | grep shenjiying-monitoring"
  info "查看日志: tail -f /var/log/rfc.log /var/log/rfc-remind.log /var/log/standup.log"
  echo ""
  warn "macOS 用户注意: 系统默认禁用 cron,需要 sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.vfs.cron.plist"
}

# ---------- 操作: uninstall ----------
do_uninstall() {
  echo ""
  echo "============================================"
  echo "🗑️  卸载 shenjiying-monitoring cron"
  echo "============================================"
  echo ""

  local current
  current=$(get_current_crontab)
  if [ -z "$current" ]; then
    info "(crontab 为空,无需操作)"
    return 0
  fi

  if ! has_existing_block "$current"; then
    info "(未找到 shenjiying-monitoring 块,无需操作)"
    return 0
  fi

  # 删除整个 marker ... footer 块
  local filtered
  filtered=$(echo "$current" | awk -v marker="$CRON_MARKER" -v footer="$CRON_FOOTER" '
    $0 == marker { skip = 1; next }
    $0 == footer { skip = 0; next }
    skip { next }
    { print }
  ')

  # 清理可能的多余空行
  filtered=$(echo "$filtered" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')
  if [ -z "$(echo "$filtered" | tr -d '[:space:]')" ]; then
    # 全部删完,直接清空 crontab
    crontab -r 2>/dev/null || echo "" | crontab -
    ok "已清空 crontab (无其它任务)"
  else
    echo "$filtered" | crontab -
    ok "已删除 shenjiying-monitoring 块"
  fi

  # 备份
  local backup_file
  backup_file="/tmp/shenjiying-crontab.before-uninstall.$(TZ='Asia/Shanghai' date '+%Y%m%d-%H%M%S')"
  echo "$current" > "$backup_file"
  info "原 crontab 已备份到: $backup_file"
  echo ""

  do_show
}

# ---------- Main ----------
case "$ACTION" in
  install)    do_install ;;
  uninstall)  do_uninstall ;;
  show)       do_show ;;
  dry-run)    do_dry_run ;;
esac

exit 0
