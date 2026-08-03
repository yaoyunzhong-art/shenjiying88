#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# remote-push-detect-test.sh — Gate6-C2 远程推送禁令检测 · 测试套件
#
# 测试方法:
#   使用临时git仓库模拟各种场景，每次测试独立隔离
#
# 覆盖:
#   正例: 无remote, 只读remote, 无未推送提交
#   反例: 有pushUrl, 有未推送提交, 有push alias
#   边界: 空仓库, 无访问权限, 无.git/config
#
# 测试数: 15+ (正例5 + 反例6 + 边界4)
#
# 用法:
#   bash scripts/remote-push-detect-test.sh
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_SCRIPT="${PROJECT_DIR}/scripts/remote-push-detect.sh"
WORK_DIR="/tmp/remote-push-detect-test-$$"
ORIG_DIR="$(pwd)"

PASS=0
FAIL=0
TEST_COUNT=0

# ── 辅助函数 ────────────────────────────────────────────────────────

cleanup() {
  cd "$ORIG_DIR" 2>/dev/null || true
  rm -rf "$WORK_DIR" 2>/dev/null || true
}

teardown() {
  cd "$WORK_DIR" 2>/dev/null || true
  rm -rf test-* upstream-* temp-* source-* outside 2>/dev/null || true
}

# 清理所有
trap cleanup EXIT INT TERM

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

setup_repo() {
  # setup_repo <name> [upstream-name]
  # 创建本地repo，可选创建upstream remote
  local repo_name="$1"
  local upstream="${2:-}"
  local repo_dir="${WORK_DIR}/${repo_name}"

  rm -rf "$repo_dir"
  mkdir -p "$repo_dir"
  cd "$repo_dir" 2>/dev/null
  git init -b main 1>/dev/null 2>&1
  git config user.email "test@test.com"
  git config user.name "Tester"
  echo "initial" > README.md
  git add .
  git commit -m "init" 1>/dev/null 2>&1

  if [ -n "$upstream" ]; then
    local upstream_dir="${WORK_DIR}/${upstream}"
    if [ ! -d "$upstream_dir" ]; then
      rm -rf "$upstream_dir"
      mkdir -p "$upstream_dir"
      cd "$upstream_dir" 2>/dev/null
      git init --bare 1>/dev/null 2>&1
    fi
    cd "$repo_dir" 2>/dev/null
    git remote add origin "$upstream_dir"
    git push origin main 1>/dev/null 2>&1 || true
  fi

  echo "$repo_dir"
}

assert_eq() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  TEST_COUNT=$((TEST_COUNT + 1))
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    echo "  [${TEST_COUNT}] ✓ ${desc}"
  else
    FAIL=$((FAIL + 1))
    echo "  [${TEST_COUNT}] ✗ ${desc}: expected '${expected}', got '${actual}'"
  fi
}

assert_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  TEST_COUNT=$((TEST_COUNT + 1))
  if echo "$haystack" | grep -q "$needle"; then
    PASS=$((PASS + 1))
    echo "  [${TEST_COUNT}] ✓ ${desc}"
  else
    FAIL=$((FAIL + 1))
    echo "  [${TEST_COUNT}] ✗ ${desc}: expected output to contain '${needle}', but it didn't"
    echo "    Output: $(echo "$haystack" | tail -5 | tr '\n' ' ')"
  fi
}

assert_not_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  TEST_COUNT=$((TEST_COUNT + 1))
  if ! echo "$haystack" | grep -q "$needle"; then
    PASS=$((PASS + 1))
    echo "  [${TEST_COUNT}] ✓ ${desc}"
  else
    FAIL=$((FAIL + 1))
    echo "  [${TEST_COUNT}] ✗ ${desc}: output unexpectedly contains '${needle}'"
  fi
}

# ── 使用原仓库执行检测（最真实的场景）──────────────────────────

test_01_real_repo_runs() {
  echo ""
  echo "═══ 正例1: 真实仓库可执行 ═══"
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "脚本在真实仓库中可执行" "Gate6-C2" "$output"
}

# ── 正例2: 无remote的仓库 ──────────────────────────────────────────

test_02_no_remote() {
  echo ""
  echo "═══ 正例2: 无remote的仓库 ═══"
  local repo
  repo="$(setup_repo "test-no-remote")"
  cd "$repo"
  git remote remove origin 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "无remote仓库检测通过" "PASS" "$output"
}

# ── 正例3: 只有fetch remote（只读，无push）────────────────────────

test_03_fetch_only_remote() {
  echo ""
  echo "═══ 正例3: 只有fetch remote ═══"
  local repo
  repo="$(setup_repo "test-fetch-only" "upstream-fetch")"
  cd "$repo"
  # 修改remote改为pushurl为空来模拟只读
  git remote set-url --push origin "" 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"

  # 如果pushurl设空失败，则直接删除push url
  if echo "$output" | grep -q "WARN.*可推送"; then
    cd "$repo"
    # 有push remote是正常的 — 关键是检查head diff
    # 如果与远程一致，应该pass
    # 先push当前状态到远程
    git push origin main 2>/dev/null || true
    output="$("$TARGET_SCRIPT" 2>&1 || true)"
  fi
  assert_contains "fetch-only remote可正常运行" "Gate6-C2" "$output"
}

# ── 正例4: 本地与远程完全一致 ─────────────────────────────────────

test_04_head_matches_remote() {
  echo ""
  echo "═══ 正例4: 本地HEAD与远程HEAD一致 ═══"
  local upstream
  upstream="$(setup_repo "upstream-in-sync" "")"
  mkdir -p "$upstream" && cd "$upstream" && git init --bare 2>/dev/null || true

  local repo
  repo="$(setup_repo "test-in-sync" "upstream-in-sync")"
  cd "$repo"
  git push origin main 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "HEAD一致时检测通过" "PASS" "$output"
}

# ── 正例5: 本地落后远程 ──────────────────────────────────────────

test_05_local_behind_remote() {
  echo ""
  echo "═══ 正例5: 本地落后远程（已拉取更新） ═══"
  local upstream_dir="${WORK_DIR}/upstream-behind"
  rm -rf "$upstream_dir"
  mkdir -p "$upstream_dir"
  cd "$upstream_dir" 2>/dev/null
  git init --bare 1>/dev/null 2>&1

  local repo
  repo="$(setup_repo "source-behind" "upstream-behind")"
  cd "$repo" 2>/dev/null
  git push origin main 1>/dev/null 2>&1 || true

  # 在upstream上新增提交（通过临时clone模拟）
  local temp_clone="${WORK_DIR}/temp-behind-push"
  rm -rf "$temp_clone"
  cd "$WORK_DIR" 2>/dev/null
  git clone "$upstream_dir" "$temp_clone" 1>/dev/null 2>&1
  cd "$temp_clone" 2>/dev/null
  echo "update on remote" >> README.md
  git add .
  git commit -m "remote update" 1>/dev/null 2>&1
  git push origin main 1>/dev/null 2>&1

  # 回到测试仓库（不pull，所以本地落后）
  cd "$repo" 2>/dev/null
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  # 不应检测到本地未推送（我们落后了，没推过）
  assert_contains "本地落后远程仓库应可运行" "Gate6-C2" "$output"
}

# ── 反例1: 配置了pushUrl ─────────────────────────────────────────

test_06_push_url_configured() {
  echo ""
  echo "═══ 反例1: pushUrl已配置 ═══"
  local repo
  repo="$(setup_repo "test-pushurl")"
  cd "$repo"
  git remote add origin /tmp/fake-origin-pushurl 2>/dev/null || true
  git config remote.origin.pushurl /tmp/fake-push-target 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "pushUrl配置应被检测到" "pushUrl" "$output"
}

# ── 反例2: 本地有未推送提交 ─────────────────────────────────────

test_07_unpushed_commits() {
  echo ""
  echo "═══ 反例2: 本地有未推送提交 ═══"
  local upstream
  mkdir -p "${WORK_DIR}/upstream-unpushed"
  cd "${WORK_DIR}/upstream-unpushed"
  git init --bare 2>/dev/null

  local repo
  repo="$(setup_repo "test-unpushed" "upstream-unpushed")"
  cd "$repo"
  git push origin main 2>/dev/null || true

  # 现在本地新增提交（未推送）
  echo "unpushed change" >> local.txt
  git add .
  git commit -m "local only commit" 2>/dev/null

  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "有未推送提交应触发FAIL" "FAIL" "$output"
}

# ── 反例3: 配置了push alias ──────────────────────────────────────

test_08_push_alias_exists() {
  echo ""
  echo "═══ 反例3: git alias包含push ───"
  local repo
  repo="$(setup_repo "test-alias")"
  cd "$repo"
  git config --local alias.my-push "!git push" 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "push alias应被检测到" "alias" "$output"
}

# ── 反例4: 存在push类git hook ────────────────────────────────────

test_09_push_hook_exists() {
  echo ""
  echo "═══ 反例4: push类hook存在 ═══"
  local repo
  repo="$(setup_repo "test-hook")"
  cd "$repo"
  mkdir -p .git/hooks
  cat > .git/hooks/post-commit << 'HOOK'
#!/bin/sh
echo "this is a test hook - would push"
HOOK
  chmod +x .git/hooks/post-commit
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "push hook应被检测到" "post-commit" "$output"
}

# ── 反例5: 多个remote且有未推送提交 ─────────────────────────────

test_10_multi_remote_with_unpushed() {
  echo ""
  echo "═══ 反例5: 多个remote且有未推送提交 ═══"
  local upstream_a
  local upstream_b
  mkdir -p "${WORK_DIR}/upstream-a" "${WORK_DIR}/upstream-b"
  cd "${WORK_DIR}/upstream-a" && git init --bare 2>/dev/null
  cd "${WORK_DIR}/upstream-b" && git init --bare 2>/dev/null

  local repo
  repo="$(setup_repo "test-multi-unpushed" "upstream-a")"
  cd "$repo"
  git remote add upstream-b "${WORK_DIR}/upstream-b" 2>/dev/null || true
  git push origin main 2>/dev/null || true
  git push upstream-b main 2>/dev/null || true

  # 未推送的新提交
  echo "multi remote change" >> multi.txt
  git add .
  git commit -m "local multi" 2>/dev/null

  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "多remote有未推送应FAIL" "FAIL" "$output"
}

# ── 反例6: 隐藏的pushUrl + alias组合攻击 ─────────────────────────

test_11_hidden_push_combination() {
  echo ""
  echo "═══ 反例6: pushUrl + alias组合 ═══"
  local repo
  repo="$(setup_repo "test-combo")"
  cd "$repo"
  git remote add origin /tmp/fake-combo-origin 2>/dev/null || true
  git config remote.origin.pushurl /tmp/stealth-push 2>/dev/null || true
  git config --local alias.stealth "!git push" 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "组合攻击应同时检测到pushUrl" "pushUrl" "$output"
  assert_contains "组合攻击应同时检测到alias" "alias" "$output"
}

# ── 边界1: 空仓库（无commit） ────────────────────────────────────

test_12_empty_repo() {
  echo ""
  echo "═══ 边界1: 空仓库（无commit） ═══"
  local repo_dir="${WORK_DIR}/test-empty"
  mkdir -p "$repo_dir"
  cd "$repo_dir"
  git init -b main 2>/dev/null
  git config user.email "test@test.com"
  git config user.name "Tester"

  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  # 空仓库无commit，但git可用
  assert_contains "空仓库应可执行" "Gate6-C2" "$output"
}

# ── 边界2: 没有.git/config ─────────────────────────────────────────

test_13_no_git_config() {
  echo ""
  echo "═══ 边界2: 不在git仓库中 ═══"
  local outside_dir="${WORK_DIR}/outside"
  rm -rf "$outside_dir"
  mkdir -p "$outside_dir"
  # 确保没有.git目录
  rm -rf "${outside_dir}/.git" 2>/dev/null || true
  cd "${outside_dir}" 2>/dev/null

  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "不在git仓库应报错" "不在git仓库中" "$output"
}

# ── 边界3: 只有fetch权限的remote ─────────────────────────────────

test_14_fetch_only_remote_no_push_perms() {
  echo ""
  echo "═══ 边界3: 只读remote无pushUrl ═══"
  local repo
  repo="$(setup_repo "test-fetchonly-perms")"
  cd "$repo"
  git remote add origin /tmp/fake-fetch-only 2>/dev/null || true
  git remote set-url --push origin "" 2>/dev/null || true
  # 删除push url条目
  git config --unset remote.origin.pushurl 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  assert_contains "只读remote应可运行" "Gate6-C2" "$output"
}

# ── 边界4: --help参数 ────────────────────────────────────────────

test_15_help_flag() {
  echo ""
  echo "═══ 边界4: --help参数 ═══"
  local output
  output="$("$TARGET_SCRIPT" --help 2>&1 || true)"
  assert_contains "--help应显示语法" "语法" "$output"
}

# ── 边界5: --verbose参数 ─────────────────────────────────────────

test_16_verbose_flag() {
  echo ""
  echo "═══ 边界5: --verbose参数（不应报错） ═══"
  local repo
  repo="$(setup_repo "test-verbose-flag")"
  cd "$repo"
  local output
  output="$("$TARGET_SCRIPT" --verbose 2>&1 || true)"
  assert_contains "--verbose可正常运行" "Gate6-C2" "$output"
}

# ── 用例17: 独立分支但已全部推送到remote ────────────────────────

test_17_branch_fully_pushed() {
  echo ""
  echo "═══ 正例6: 分支已全部推送到远程 ═══"
  local upstream
  mkdir -p "${WORK_DIR}/upstream-fully"
  cd "${WORK_DIR}/upstream-fully"
  git init --bare 2>/dev/null

  local repo
  repo="$(setup_repo "test-fully-pushed" "upstream-fully")"
  cd "$repo"
  git push origin main 2>/dev/null || true

  # 创建新分支并推送
  git checkout -b feature/fully-pushed 2>/dev/null
  echo "feature work" >> feature.txt
  git add .
  git commit -m "feature commit" 2>/dev/null
  git push origin feature/fully-pushed 2>/dev/null || true

  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  # 实际git ls-remote会根据当前分支找HEAD
  assert_contains "全推送仓库可运行" "Gate6-C2" "$output"
}

# ── 用例18: remote带认证token但正常工作 ─────────────────────────

test_18_remote_with_auth() {
  echo ""
  echo "═══ 边界6: remote带认证token ═══"
  local repo
  repo="$(setup_repo "test-auth-url")"
  cd "$repo"
  git remote remove origin 2>/dev/null || true
  git remote add auth-origin "https://oauth2:token-secret@example.com/repo.git" 2>/dev/null || true
  local output
  output="$("$TARGET_SCRIPT" 2>&1 || true)"
  # 检查URL中是否包含*** (sanitized token) - grep需要转义
  assert_contains "带认证URL不应泄露token" "oauth2:" "$output"
  assert_not_contains "带认证URL不应暴露token明文" "token-secret" "$output"
}

# ── 执行 ──────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "  [Gate6-C2] 远程推送禁令检测 · 测试套件"
echo "  脚本: $(basename "$TARGET_SCRIPT")"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

test_01_real_repo_runs
teardown

test_02_no_remote
teardown

test_03_fetch_only_remote
teardown

test_04_head_matches_remote
teardown

test_05_local_behind_remote
teardown

test_06_push_url_configured
teardown

test_07_unpushed_commits
teardown

test_08_push_alias_exists
teardown

test_09_push_hook_exists
teardown

test_10_multi_remote_with_unpushed
teardown

test_11_hidden_push_combination
teardown

test_12_empty_repo
teardown

test_13_no_git_config
teardown

test_14_fetch_only_remote_no_push_perms
teardown

test_15_help_flag
teardown

test_16_verbose_flag
teardown

test_17_branch_fully_pushed
teardown

test_18_remote_with_auth
teardown

# ── 汇总 ────────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "  测试汇总: ${TEST_COUNT} 个测试"
echo "  通过: ${PASS} | 失败: ${FAIL}"
echo "=============================================="

cd "$ORIG_DIR"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ❌ ${FAIL} 个测试失败"
  cleanup
  exit 1
else
  echo ""
  echo "  ✅ 全部通过"
  cleanup
  exit 0
fi
