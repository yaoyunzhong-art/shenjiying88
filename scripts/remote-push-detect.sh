#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# remote-push-detect.sh — Gate6-C2 远程推送禁令检测
#
# V23铁律: 远程推送0次 — 禁止从本仓库向任何远程仓库执行git push
#
# 功能:
#   自动化检测当前仓库是否有违反V23铁律(远程推送0次)的情况
#
# 检测项:
#   1. git remote -v 所有remote地址 (列出所有远程仓库)
#   2. .git/config 中 pushUrl 配置 (检查是否有绕开remote标准的push目标)
#   3. 对比本地HEAD和远程HEAD (检测是否有未推送的本地提交)
#   4. 检查是否配置了push相关的git alias/post-hook (检测隐藏推送机制)
#   5. commit信息中是否包含"push"关键词 (辅助审计)
#
# 输出:
#   PASS  (🟢) — 无任何推送违规，V23铁律合规
#   WARNING (🟡) — 存在推送相关配置但未实际推送
#   FAIL  (🔴) — 检测到实际远程推送记录，V23铁律违反
#
# 语法:
#   bash scripts/remote-push-detect.sh
#
# 选项:
#   --verbose    输出详细信息
#   --help       显示帮助
#
# V23审计条件: V23-G6-C2 (2026-07-30截止)
# 责任人: E38沈监管
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── 配置 ────────────────────────────────────────────────────────────

VERBOSE=false
for arg in "$@"; do
  case "$arg" in
    --verbose) VERBOSE=true ;;
    --help|-h)
      sed -n '2,10p' "$0" | sed 's/^# //'
      echo ""
      echo "语法: bash scripts/remote-push-detect.sh [--verbose]"
      echo "选项:"
      echo "  --verbose    输出详细信息"
      echo "  --help       显示帮助"
      exit 0
      ;;
  esac
done

PROJECT="$(cd "$(git rev-parse --show-toplevel 2>/dev/null)" && pwd || echo "")"
if [ -z "$PROJECT" ] || ! git rev-parse --git-dir 2>/dev/null >/dev/null; then
  echo ""
  echo "============================================="
  echo "  [Gate6-C2] 错误：不在git仓库中"
  echo "============================================="
  echo ""
  echo "STATUS=fail"
  echo "COLOR=red"
  echo "REASON=not_in_git_repo"
  exit 1
fi
cd "$PROJECT"

NOW="$(date '+%Y-%m-%d %H:%M:%S')"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"

# ── 状态变量 ────────────────────────────────────────────────────────

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0
DETAILS=""
GLOBAL_STATUS="PASS"

# ── 辅助函数 ────────────────────────────────────────────────────────

log()   { echo "  $1"; }
detail(){ DETAILS="${DETAILS}${1}"$'\n'; }
pass()  { PASS_COUNT=$((PASS_COUNT+1)); log "  ✓ PASS: $1"; }
warn()  { WARN_COUNT=$((WARN_COUNT+1)); [ "$GLOBAL_STATUS" = "PASS" ] && GLOBAL_STATUS="WARNING"; log "  ⚠ WARN: $1"; }
fail()  { FAIL_COUNT=$((FAIL_COUNT+1)); GLOBAL_STATUS="FAIL"; log "  ✗ FAIL: $1"; }

# 隐藏token显示
sanitize_url() {
  echo "$1" | sed 's/oauth2:[^@]*@/oauth2:***@/g; s/token=[^&]*/token=***/g; s/access_token=[^&]*/access_token=***/g'
}

# ── 检查项1: remote 地址 ──────────────────────────────────────────

check_remote_urls() {
  echo ""
  echo "  ── [检查项1] Remote 地址 ──"
  echo ""

  local remotes
  remotes="$(git remote -v 2>/dev/null)" || {
    pass "没有配置任何remote地址 → 零推送配置"
    detail "[1] remote: 无remote配置"
    return
  }

  if [ -z "$remotes" ]; then
    pass "没有配置remote地址 → 安全"
    detail "[1] remote: 无remote配置"
    return
  fi

  local line_count
  line_count="$(echo "$remotes" | wc -l | tr -d ' ')"
  local unique_names
  unique_names="$(echo "$remotes" | awk '{print $1}' | sort -u | tr '\n' ' ')"

  echo "  共 ${line_count} 条remote记录 (${unique_names}):"
  echo ""

  local has_push_remote=false
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    local name url mode
    name="$(echo "$line" | awk '{print $1}')"
    url="$(echo "$line" | awk '{print $2}')"
    mode="$(echo "$line" | awk '{print $3}')"
    local safe_url
    safe_url="$(sanitize_url "$url")"

    if [ "$mode" = "(push)" ]; then
      has_push_remote=true
      echo "      ${name} ← ${safe_url}  (push可写)"
    else
      echo "      ${name} → ${safe_url}  (${mode})"
    fi
  done <<< "$remotes"

  echo ""
  if [ "$has_push_remote" = true ]; then
    local push_count
    push_count="$(echo "$remotes" | grep '(push)' | wc -l | tr -d ' ')"
    warn "存在 ${push_count} 个可推送的remote: 具有push权限的remote"
    detail "[1] remote: ${line_count}条, 可推送remote=${push_count}个"
  else
    pass "所有remote为只读fetch模式，无push权限"
    detail "[1] remote: ${line_count}条, 均为只读"
  fi
}

# ── 检查项2: pushUrl 配置 ────────────────────────────────────────

check_push_url() {
  echo ""
  echo "  ── [检查项2] .git/config pushUrl 配置 ──"
  echo ""

  local git_config="${PROJECT}/.git/config"
  if [ ! -f "$git_config" ]; then
    fail "无法读取 .git/config — git仓库状态异常"
    detail "[2] pushUrl: .git/config 不可读"
    return
  fi

  local push_urls
  push_urls="$(grep -n 'pushUrl' "$git_config" 2>/dev/null || true)"

  if [ -z "$push_urls" ]; then
    pass ".git/config 中没有配置 pushUrl → 无推送重定向"
    detail "[2] pushUrl: 未配置"
    return
  fi

  local cnt
  cnt="$(echo "$push_urls" | wc -l | tr -d ' ')"
  warn "检测到 ${cnt} 处 pushUrl 配置 — pushUrl会覆盖默认remote URL"
  echo ""
  while IFS= read -r line; do
    local safe_line
    safe_line="$(sanitize_url "$line")"
    echo "      ${safe_line}"
  done <<< "$push_urls"
  echo ""
  local sanitized
  sanitized="$(echo "$push_urls" | head -3 | sanitize_url | tr '\n' ';')"
  detail "[2] pushUrl: 发现${cnt}处 (${sanitized})"
}

# ── 检查项3: git alias / hook 中隐藏的push ──────────────────────────

check_git_aliases() {
  echo ""
  echo "  ── [检查项3] Git alias / hook 检测 ──"
  echo ""

  # 检查git config中的alias是否包含push
  local push_aliases
  push_aliases="$(git config --global --list 2>/dev/null | grep 'alias\..*push' || true)"
  push_aliases="${push_aliases}$(git config --local --list 2>/dev/null | grep 'alias\..*push' || true)"

  if [ -n "$push_aliases" ]; then
    warn "存在包含push的git alias:"
    echo ""
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      echo "      ${line}"
    done <<< "$push_aliases"
    echo ""
    detail "[3] aliases: 存在push alias"
  else
    pass "没有包含push的git alias"
    detail "[3] aliases: 无push alias"
  fi

  # 检查post-commit/pre-push hook
  local hooks_dir="${PROJECT}/.git/hooks"
  if [ -d "$hooks_dir" ]; then
    local suspicious_hooks
    suspicious_hooks=""
    for h in "$hooks_dir"/post-commit "$hooks_dir"/post-merge "$hooks_dir"/pre-push; do
      [ -f "$h" ] && [ -x "$h" ] && suspicious_hooks="${suspicious_hooks}${h} "
    done

    if [ -n "$suspicious_hooks" ]; then
      warn "存在可能触发推送的git hooks:"
      for h in $suspicious_hooks; do
        echo "      $(basename "$h") (可执行)"
      done
      echo ""
      detail "[3] hooks: 存在可执行hooks (${suspicious_hooks})"
    else
      pass "没有预置的push类git hooks"
      detail "[3] hooks: 无push hook"
    fi
  fi
}

# ── 检查项4: 本地HEAD vs 远程HEAD 差异 ──────────────────────────

check_head_diff() {
  echo ""
  echo "  ── [检查项4] 本地HEAD vs 远程HEAD 差异 ──"
  echo ""

  local local_head
  local_head="$(git rev-parse HEAD 2>/dev/null)" || {
    fail "无法获取本地HEAD"
    detail "[4] head-diff: 本地HEAD获取失败"
    return
  }
  echo "  本地HEAD: ${local_head:0:12}"
  echo ""

  local remotes_with_push
  remotes_with_push="$(git remote -v 2>/dev/null | grep '(push)' | awk '{print $1}' | sort -u)"

  if [ -z "$remotes_with_push" ]; then
    pass "没有可推送的remote，不需要对比远程HEAD"
    detail "[4] head-diff: 无可推送remote"
    return
  fi

  local any_ahead=false
  echo "  Remote 对比:"
  echo ""
  while IFS= read -r remote; do
    [ -z "$remote" ] && continue

    local remote_head
    remote_head="$(git ls-remote "${remote}" HEAD 2>/dev/null | awk '{print $1}' || echo "")"

    if [ -z "$remote_head" ]; then
      # 尝试查找远程分支的HEAD
      local current_on_remote
      current_on_remote="$(git ls-remote "${remote}" "refs/heads/${CURRENT_BRANCH}" 2>/dev/null | awk '{print $1}' || echo "")"
      if [ -n "$current_on_remote" ]; then
        remote_head="$current_on_remote"
        echo "      ${remote}/${CURRENT_BRANCH}: ${remote_head:0:12}"
      else
        echo "      ${remote}: 无法获取HEAD (可能仓库为空或无访问权限)"
        warn "${remote}: 无法获取远程HEAD"
        detail "[4] head-diff: ${remote} HEAD不可达"
        continue
      fi
    else
      echo "      ${remote} HEAD: ${remote_head:0:12}"
    fi

    pass "${remote}: 可获取远程引用"

    if [ "$local_head" = "$remote_head" ]; then
      pass "${remote}: 本地HEAD与远程HEAD一致 → 无未推送提交"
      detail "[4] head-diff: ${remote} HEAD一致"
    else
      any_ahead=true
      local ahead=0
      local remote_branch
      remote_branch="refs/heads/${CURRENT_BRANCH}"

      # 计算本地领先多少
      ahead="$(git rev-list --count "${remote}/${CURRENT_BRANCH}"..HEAD 2>/dev/null || echo "?")"
      echo "      → 本地领先远程: ${ahead} 个提交"

      if [ "$ahead" != "?" ] && [ "$ahead" -gt 0 ]; then
        fail "${remote}: 本地有${ahead}个未推送提交 — 违反V23铁律!"
        detail "[4] head-diff: ${remote} 本地领先${ahead}, 有未推送提交"
      elif [ "$ahead" = "?" ]; then
        warn "${remote}: 无法精确计算差异 (远程分支可能不存在)"
        detail "[4] head-diff: ${remote} HEAD不一致但无法计算差异"
      else
        # local is behind, that's fine (we pulled from remote)
        local behind
        behind="$(git rev-list --count HEAD.."${remote}/${CURRENT_BRANCH}" 2>/dev/null || echo "?")"
        echo "      → 远程领先本地: ${behind} 个提交 (本地落后远程，无推送)"
        pass "${remote}: 本地落后于远程 → 无未推送提交"
        detail "[4] head-diff: ${remote} 本地落后${behind}"
      fi
    fi
    echo ""
  done <<< "$remotes_with_push"

  if [ "$any_ahead" = false ]; then
    pass "所有远程HEAD检查完毕，无未推送提交"
  fi
}

# ── 检查项5: 提交历史审计 ──────────────────────────────────────────

check_commit_audit() {
  echo ""
  echo "  ── [检查项5] 提交历史审计 ──"
  echo ""

  # 统计本地提交总数（含远程tracking branch）
  local local_only_count=0
  local current_branch="${CURRENT_BRANCH}"

  # 获取当前分支的本地-only提交（不在任何远程分支上）
  local remotes_with_push
  remotes_with_push="$(git remote -v 2>/dev/null | grep '(push)' | awk '{print $1}' | sort -u)"

  if [ -n "$remotes_with_push" ]; then
    # 构建排除所有远程分支的引用
    local exclude_args=""
    while IFS= read -r remote; do
      [ -z "$remote" ] && continue
      # 检查远程分支是否存在
      local has_branch
      has_branch="$(git ls-remote --heads "${remote}" "${current_branch}" 2>/dev/null || true)"
      if [ -n "$has_branch" ]; then
        exclude_args="${exclude_args} --not --remotes=${remote}"
      fi
    done <<< "$remotes_with_push"

    if [ -n "$exclude_args" ]; then
      local locally_committed
      locally_committed="$(git rev-list HEAD ${exclude_args} 2>/dev/null | wc -l | tr -d ' ' || echo "0")"
      local_only_count="$locally_committed"
    fi
  fi

  echo "  当前分支: ${current_branch}"
  echo "  本地仅有的提交(不在任何远程): ${local_only_count}"

  if [ "$local_only_count" -gt 0 ]; then
    fail "存在 ${local_only_count} 个仅本地的提交 — 这些提交未推送到远程且是违反铁律的证据!"
    detail "[5] audit: 存在${local_only_count}个本地专有提交"
    if [ "$VERBOSE" = true ]; then
      echo ""
      echo "  未推送的提交:"
      local exclude_args_output=""
      while IFS= read -r remote; do
        [ -z "$remote" ] && continue
        exclude_args_output="${exclude_args_output} --not --remotes=${remote}"
      done <<< "$remotes_with_push"
      git log --oneline HEAD ${exclude_args_output} 2>/dev/null | head -20 || true
    fi
  else
    pass "没有检测到仅本地的提交 → 零推送"
    detail "[5] audit: 零本地专有提交"
  fi
}

# ── 主流程 ──────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  [Gate6-C2] 远程推送禁令检测"
echo "  仓库: $(basename "$PROJECT")"
echo "  分支: ${CURRENT_BRANCH}"
echo "  时间: ${NOW}"
echo "============================================="

check_remote_urls
check_push_url
check_git_aliases
check_head_diff
check_commit_audit

# ── 汇总 ────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  检测汇总"
echo "  通过: ${PASS_COUNT} | 警告: ${WARN_COUNT} | 失败: ${FAIL_COUNT}"
echo "============================================="
echo ""

case "${GLOBAL_STATUS}" in
  "PASS")
    echo "  结果: PASS 🟢"
    echo ""
    echo "  V23铁律: 远程推送0次 ✅"
    echo "  Gate6-C2: 合规通过"
    echo "============================================="
    echo ""
    echo "STATUS=pass"
    echo "COLOR=green"
    echo "PASS=${PASS_COUNT}"
    echo "WARN=${WARN_COUNT}"
    echo "FAIL=${FAIL_COUNT}"
    echo "SUMMARY=无远程推送违规"
    echo "DETAILS<<ENDDETAILS"
    echo "${DETAILS}" | head -c 2000
    echo "ENDDETAILS"
    exit 0
    ;;
  "WARNING")
    echo "  结果: WARNING 🟡"
    echo ""
    echo "  V23铁律: 存在远程推送配置或潜在风险"
    echo "  建议检查:"
    echo "    1. pushUrl配置 — 若不需要则删除"
    echo "    2. git alias中的push命令 — 考虑移除"
    echo "    3. git hooks — 确认不会触发自动推送"
    echo "============================================="
    echo ""
    echo "STATUS=warning"
    echo "COLOR=yellow"
    echo "PASS=${PASS_COUNT}"
    echo "WARN=${WARN_COUNT}"
    echo "FAIL=${FAIL_COUNT}"
    echo "SUMMARY=存在推送配置或潜在风险"
    echo "DETAILS<<ENDDETAILS"
    echo "${DETAILS}" | head -c 2000
    echo "ENDDETAILS"
    exit 1
    ;;
  "FAIL")
    echo "  结果: FAIL 🔴"
    echo ""
    echo "  ⚠ V23铁律违反: 检测到远程推送记录!"
    echo "  违反详情:"
    echo ""
    # 提取违反项
    echo "  ${DETAILS}" | grep -E '\[(4|5)\]' | while IFS= read -r line; do
      echo "    • ${line}"
    done
    echo ""
    echo "  Gate6-C2 监管响应流程:"
    echo "    [1] 立即停止对当前分支进一步的推送操作"
    echo "    [2] 通知 E38沈监管 说明推送原因并评估影响"
    echo "    [3] 通知 E2李安全 评估安全影响"
    echo "    [4] 修复后方可继续开发"
    echo "============================================="
    echo ""
    echo "STATUS=fail"
    echo "COLOR=red"
    echo "PASS=${PASS_COUNT}"
    echo "WARN=${WARN_COUNT}"
    echo "FAIL=${FAIL_COUNT}"
    echo "SUMMARY=检测到远程推送记录，违反V23铁律"
    echo "DETAILS<<ENDDETAILS"
    echo "${DETAILS}" | head -c 2000
    echo "ENDDETAILS"
    exit 2
    ;;
esac
