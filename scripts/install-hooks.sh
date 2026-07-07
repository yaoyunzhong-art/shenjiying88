#!/usr/bin/env bash
# install-hooks.sh · 一键安装/卸载团队 Git Hooks (Pulse-68 等待期)
#
# 设计:
#   - 所有 hooks 放在 .githooks/ (仓库根),commit 到 git,团队共享
#   - 通过 `git config core.hooksPath .githooks` 让 git 自动调用
#   - 不依赖 .git/hooks/ (local-only,每个开发者都不同)
#
# 用法:
#   bash scripts/install-hooks.sh                # 默认安装 (--install)
#   bash scripts/install-hooks.sh --install      # 安装 hooks
#   bash scripts/install-hooks.sh --uninstall    # 卸载 hooks
#   bash scripts/install-hooks.sh --verify       # 检查当前 hooks 状态
#   bash scripts/install-hooks.sh --dry-run      # 只打印将执行的操作,不实际改 git config
#
# 关联: .githooks/pre-commit · .githooks/commit-msg · scripts/commit-lint.sh

set -u

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---------- 参数 ----------
ACTION="install"  # install | uninstall | verify | dry-run
for arg in "$@"; do
  case "$arg" in
    --install)   ACTION="install" ;;
    --uninstall) ACTION="uninstall" ;;
    --verify)    ACTION="verify" ;;
    --dry-run)   ACTION="dry-run" ;;
    -h|--help)
      cat <<'USAGE'
install-hooks.sh · 一键安装团队 Git Hooks

用法:
  bash scripts/install-hooks.sh [选项]

选项:
  --install    安装 .githooks/ 为 core.hooksPath (默认)
  --uninstall  恢复 core.hooksPath 到 .git/hooks/
  --verify     检查当前 hooks 状态 (不修改任何配置)
  --dry-run    只打印将执行的操作,不实际修改 git config
  -h, --help   显示本帮助

示例:
  bash scripts/install-hooks.sh --verify
  bash scripts/install-hooks.sh --install
  bash scripts/install-hooks.sh --uninstall
USAGE
      exit 0
      ;;
    *)
      echo -e "${RED}❌ 未知参数: $arg${NC}" >&2
      exit 2
      ;;
  esac
done

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

REQUIRED_HOOKS=(pre-commit commit-msg)

# ---------- 工具函数 ----------
log()    { printf '%b\n' "$*"; }
ok()     { log "${GREEN}✅${NC} $*"; }
warn()   { log "${YELLOW}⚠️ ${NC} $*"; }
err()    { log "${RED}❌${NC} $*" >&2; }
info()   { log "${CYAN}ℹ️ ${NC} $*"; }

# ---------- 前置检查 ----------
check_prereqs() {
  if ! command -v git >/dev/null 2>&1; then
    err "未找到 git,请先安装 git"
    exit 1
  fi
  if ! git -C "$REPO_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
    err "当前目录不是 git 仓库: $REPO_ROOT"
    exit 1
  fi
}

check_githooks_dir() {
  if [ ! -d "$GITHOOKS_DIR" ]; then
    err "未找到 $GITHOOKS_DIR, 无法安装 hooks"
    err "请确认 .githooks/ 目录已 commit 到仓库"
    exit 1
  fi
  for hook in "${REQUIRED_HOOKS[@]}"; do
    if [ ! -f "$GITHOOKS_DIR/$hook" ]; then
      err "$GITHOOKS_DIR/$hook 不存在,无法安装"
      exit 1
    fi
  done
}

ensure_executable() {
  local hook_file="$1"
  if [ ! -x "$hook_file" ]; then
    info "为 $hook_file 添加可执行权限"
    chmod +x "$hook_file"
  fi
}

current_hooks_path() {
  git -C "$REPO_ROOT" config --get core.hooksPath 2>/dev/null || echo ""
}

# ---------- 操作: verify ----------
do_verify() {
  echo ""
  echo "============================================"
  echo "🔍 Hooks 状态检查"
  echo "============================================"
  echo ""
  echo "📁 仓库根:        $REPO_ROOT"
  echo "📁 .githooks/:    $GITHOOKS_DIR"
  echo ""
  local current
  current=$(current_hooks_path)
  if [ -z "$current" ]; then
    info "core.hooksPath:  (未设置,使用默认 .git/hooks/)"
  else
    info "core.hooksPath:  $current"
  fi
  echo ""

  for hook in "${REQUIRED_HOOKS[@]}"; do
    local team_hook="$GITHOOKS_DIR/$hook"
    local default_hook="$REPO_ROOT/.git/hooks/$hook"
    echo "  🪝 $hook"
    if [ -f "$team_hook" ]; then
      if [ -x "$team_hook" ]; then
        ok "    [TEAM ✓] $team_hook (可执行)"
      else
        warn "  [TEAM ⚠️] $team_hook (存在但不可执行)"
      fi
    else
      warn "  [TEAM ✗] $team_hook 不存在"
    fi
    if [ -f "$default_hook" ] && [ ! -L "$default_hook" ] && [ "$(basename "$(readlink "$default_hook" 2>/dev/null || echo)")" != "" ]; then
      info "  [LOCAL]  $default_hook (本地覆盖,git 不会调用除非 core.hooksPath=.git/hooks)"
    fi
    echo ""
  done

  echo "============================================"
  if [ -z "$current" ] || [ "$current" = ".git/hooks" ] || [ "$current" = ".git/hooks/" ]; then
    warn "当前使用本地 .git/hooks,团队 hooks 不会被调用"
    info "运行: bash scripts/install-hooks.sh --install"
  elif [ "$current" = ".githooks" ] || [ "$current" = ".githooks/" ]; then
    ok "当前 core.hooksPath 指向 .githooks/,团队 hooks 已生效"
  else
    warn "core.hooksPath 指向 $current,可能与本项目不一致"
  fi
  echo "============================================"
}

# ---------- 操作: install ----------
do_install() {
  local dry_run="$1"
  echo ""
  echo "============================================"
  echo "🚀 安装团队 Git Hooks$([ "$dry_run" = "1" ] && echo " (DRY-RUN)" || echo "")"
  echo "============================================"
  echo ""

  check_githooks_dir

  # 1. 给所有 hooks 加可执行权限
  info "[1/3] 确保 hooks 可执行"
  for hook in "${REQUIRED_HOOKS[@]}"; do
    local hook_path="$GITHOOKS_DIR/$hook"
    if [ ! -x "$hook_path" ]; then
      if [ "$dry_run" = "1" ]; then
        info "  [DRY-RUN] 将执行: chmod +x $hook_path"
      else
        chmod +x "$hook_path"
        ok "  chmod +x $hook_path"
      fi
    else
      ok "  $hook_path 已可执行"
    fi
  done
  echo ""

  # 2. 设置 core.hooksPath
  local current
  current=$(current_hooks_path)
  info "[2/3] 设置 core.hooksPath"
  if [ "$current" = ".githooks" ] || [ "$current" = ".githooks/" ]; then
    ok "  core.hooksPath 已指向 .githooks,无需修改"
  else
    if [ -n "$current" ]; then
      warn "  当前 core.hooksPath=$current,将被覆盖为 .githooks"
    fi
    if [ "$dry_run" = "1" ]; then
      info "  [DRY-RUN] 将执行: git config core.hooksPath .githooks"
    else
      git -C "$REPO_ROOT" config core.hooksPath .githooks
      ok "  已设置: core.hooksPath = .githooks"
    fi
  fi
  echo ""

  # 3. 验证
  info "[3/3] 验证安装结果"
  if [ "$dry_run" = "1" ]; then
    info "  [DRY-RUN] 跳过验证"
  else
    do_verify
  fi
}

# ---------- 操作: uninstall ----------
do_uninstall() {
  local dry_run="$1"
  echo ""
  echo "============================================"
  echo "🗑️  卸载团队 Git Hooks$([ "$dry_run" = "1" ] && echo " (DRY-RUN)" || echo "")"
  echo "============================================"
  echo ""

  local current
  current=$(current_hooks_path)
  info "[1/2] 当前 core.hooksPath: ${current:-(未设置)}"

  if [ "$current" = ".githooks" ] || [ "$current" = ".githooks/" ]; then
    if [ "$dry_run" = "1" ]; then
      info "  [DRY-RUN] 将执行: git config --unset core.hooksPath"
    else
      git -C "$REPO_ROOT" config --unset core.hooksPath
      ok "  已取消 core.hooksPath (恢复默认 .git/hooks/)"
    fi
  else
    warn "  当前 hooksPath 不是 .githooks,无需操作"
  fi
  echo ""

  info "[2/2] .githooks/ 目录保留 (commit 到 git),不影响后续使用"
  echo ""

  if [ "$dry_run" = "1" ]; then
    info "[DRY-RUN] 跳过验证"
  else
    do_verify
  fi
}

# ---------- Main ----------
check_prereqs

case "$ACTION" in
  install)  do_install "0" ;;
  uninstall) do_uninstall "0" ;;
  verify)   do_verify ;;
  dry-run)
    case "${1:-}" in
      --uninstall) do_uninstall "1" ;;
      *) do_install "1" ;;
    esac
    ;;
esac

exit 0
