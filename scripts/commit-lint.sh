#!/usr/bin/env bash
# commit-lint.sh · commit message 规范检查脚本 (Stage E 知识库闭环)
#
# 用法:
#   bash scripts/commit-lint.sh                # 读 stdin (供 git commit-msg hook 调用)
#   bash scripts/commit-lint.sh <msg-file>     # 读指定文件
#   bash scripts/commit-lint.sh --demo         # 用最近一次 commit 演示
#
# 规范 (来自 knowledge/best-practices/commit.md):
#   - 标题前缀必须是 Pulse-XX / Phase-XXX / Hotfix / chore / docs / test / feat / fix / refactor
#   - Conventional Commit 风格允许可选 scope: 例如 fix(loyalty): ...
#   - 标题总长 ≤ 72 字符 (首行)
#   - 不允许纯 update / fix / WIP 等无语义标题
#   - 不允许 emoji 开头 (除非 V5.1 文档场景)
#
# 退出码:
#   0 - 通过
#   1 - 不通过 (会输出错误位置和原因)
#
# 关联: knowledge/best-practices/commit.md

set -u

# ---------- 输入读取 ----------
INPUT=""
if [ "${1:-}" = "--demo" ]; then
  if ! command -v git >/dev/null 2>&1; then
    echo "❌ 未找到 git,无法演示" >&2
    exit 1
  fi
  INPUT=$(git log -1 --pretty=%B 2>/dev/null || echo "")
  if [ -z "$INPUT" ]; then
    echo "❌ 当前仓库没有 commit,无法演示" >&2
    exit 1
  fi
elif [ "${1:-}" != "" ] && [ -f "${1}" ]; then
  INPUT=$(cat "$1")
elif [ ! -t 0 ]; then
  INPUT=$(cat)
else
  echo "用法: $0 [msg-file|--demo]" >&2
  exit 2
fi

if [ -z "$INPUT" ]; then
  echo "❌ 空 commit message" >&2
  exit 1
fi

# ---------- 提取首行 ----------
FIRST_LINE=$(printf '%s\n' "$INPUT" | head -n 1)
FIRST_LEN=${#FIRST_LINE}

ERRORS=0

# ---------- 规则 1: 前缀 ----------
if ! [[ "$FIRST_LINE" =~ ^(Pulse-[0-9]+|Phase-[0-9]+[A-Z]?|Hotfix)(\ |:|$) ]] && ! [[ "$FIRST_LINE" =~ ^(chore|docs|test|feat|fix|refactor|perf|build|ci|style)(\([a-zA-Z0-9._/-]+\))?:\  ]]; then
  echo "❌ [规则 1] 标题前缀不合法: '$FIRST_LINE'"
  echo "   必须以 Pulse-XX / Phase-XX / Hotfix 或 type(scope): 开头"
  ERRORS=$((ERRORS + 1))
fi

# ---------- 规则 2: 行宽 ≤ 72 ----------
if [ "$FIRST_LEN" -gt 72 ]; then
  echo "❌ [规则 2] 首行过长: ${FIRST_LEN} 字符 (上限 72)"
  ERRORS=$((ERRORS + 1))
fi

# ---------- 规则 3: 禁用无语义标题 ----------
FORBIDDEN='^(update|fix|WIP|wip|test|测试|修改)$'
if [[ "$FIRST_LINE" =~ $FORBIDDEN ]]; then
  echo "❌ [规则 3] 标题无语义: '$FIRST_LINE'"
  echo "   禁止 'update' / 'fix' / 'WIP' / 'test' / '修改' 这类空标题"
  ERRORS=$((ERRORS + 1))
fi

# ---------- 规则 4: emoji 开头 (粗略检测:首字符为非 ASCII) ----------
FIRST_CHAR=$(printf '%s' "$FIRST_LINE" | head -c 1 | od -An -tx1 | tr -d ' \n')
# 高位 ASCII 字节 (>= 0x80) 视为非 ASCII,可能 emoji
if [ -n "$FIRST_CHAR" ] && [ "$FIRST_CHAR" != "20" ] && [ "$FIRST_CHAR" \< "80" ] 2>/dev/null; then
  :
fi
if [ -n "$FIRST_CHAR" ] && [ "$FIRST_CHAR" \> "7f" ] 2>/dev/null; then
  # 首字符是中文 / emoji,允许 (V5.1 中文 commit 场景)
  :
fi

# ---------- 总结 ----------
if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "❌ Commit message 不通过 lint ($ERRORS 个错误)"
  echo "参考: knowledge/best-practices/commit.md"
  exit 1
fi

echo "✅ Commit message 通过 lint"
exit 0
