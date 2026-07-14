#!/bin/bash
# scripts/nightly-full-run.sh · 🐜 [V17: p53-devops-cicd]
# ============================================================
# 每日凌晨全量运行: 安全→熔断→审计→哈希→force-run→commit
# 由 crontab / launchd 调度, 建议 02:00-04:00 运行
# Usage: bash scripts/nightly-full-run.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "  🌙 NIGHTLY FULL RUN"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

cd "$REPO_DIR"

# === 安全扫描（硬阻断）===
echo ""
echo "--- 🔒 安全扫描 ---"
bash "$SCRIPT_DIR/security-scan.sh"
echo "✅ 通过"

# === 熔断检查 ===
echo ""
echo "--- ⚡ 熔断检查 ---"
bash "$SCRIPT_DIR/fuse-check.sh" "nightly" "auto"
echo "✅ 通过"

# === 审计新鲜度 ===
echo ""
echo "--- 📋 审计新鲜度 ---"
bash "$SCRIPT_DIR/audit-freshness-check.sh"
echo "✅ 通过"

# === 哈希链 ===
echo ""
echo "--- 🔗 哈希链 ---"
bash "$SCRIPT_DIR/audit-hash-chain.sh"
echo "✅ 通过"

# === 强制测试 ===
echo ""
echo "--- 🚀 强制测试 ---"
npx turbo test --force 2>&1 | tail -10
echo "✅ 通过"

echo ""
echo "========================================"
echo "  ✅ NIGHTLY FULL RUN DONE"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
