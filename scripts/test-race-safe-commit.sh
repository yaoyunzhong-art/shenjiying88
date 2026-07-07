#!/usr/bin/env bash
# 测试 race-safe-commit.sh
# 1. 模拟 dirty working tree
# 2. 运行 race-safe-commit.sh
# 3. 验证 commit 被创建

set -e
cd "$(git rev-parse --show-toplevel)"

# 创建临时 dirty 文件
TEST_FILE="scripts/.race-safe-test-$$"
echo "test content $(date)" > "$TEST_FILE"

# 运行 race-safe-commit.sh
./scripts/race-safe-commit.sh "race-safe-commit.sh E2E test"

# 验证文件已被 commit
if git log -1 --pretty=format:"%s" | grep -q "race-safe-commit.sh E2E test"; then
  echo "✓ race-safe-commit.sh E2E PASS"
  # 清理
  rm -f "$TEST_FILE"
  git reset HEAD "$TEST_FILE" 2>/dev/null || true
  exit 0
else
  echo "✗ race-safe-commit.sh E2E FAIL: commit not found"
  rm -f "$TEST_FILE"
  exit 1
fi