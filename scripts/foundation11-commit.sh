#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
foundation11-commit.sh · 基础开发11标准提交命令

用法:
  bash scripts/foundation11-commit.sh "type(scope): summary" [paths...]
  bash scripts/foundation11-commit.sh "type(scope): summary" --all

示例:
  bash scripts/foundation11-commit.sh "fix(loyalty): map plan errors to business exceptions" apps/api/src/modules/loyalty/loyalty.service.ts
  bash scripts/foundation11-commit.sh "docs(ops): add foundation11 git workflow" --all
EOF
}

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ "${1:-}" == "" ]] || [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

COMMIT_MESSAGE="$1"
shift || true

cd "$REPO_ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "❌ 当前目录不是 Git 仓库: $REPO_ROOT" >&2
  exit 1
fi

bash "$SCRIPT_DIR/install-hooks.sh" --install >/dev/null
printf '%s\n' "$COMMIT_MESSAGE" | bash "$SCRIPT_DIR/commit-lint.sh" >/dev/null

if [[ "${1:-}" == "--all" ]]; then
  git add -A
elif [[ "$#" -gt 0 ]]; then
  git add "$@"
fi

if [[ -z "$(git diff --cached --name-only)" ]]; then
  echo "❌ 没有已暂存的改动。请传入文件路径或使用 --all。" >&2
  exit 1
fi

git commit -m "$COMMIT_MESSAGE"
echo "✅ 基础开发11提交完成: $(git log -1 --oneline)"
