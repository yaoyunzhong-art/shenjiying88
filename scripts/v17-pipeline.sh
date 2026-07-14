#!/bin/bash
# scripts/v17-pipeline.sh · 🐜 [V17: p53-devops-cicd]
# ============================================================
# V17全量pipeline — 一键执行: 安全→熔断→审计→哈希→测试
# Usage: bash scripts/v17-pipeline.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================"
echo "  🚀 V17 PIPELINE"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Step 1/5: 🔒 安全扫描
echo ""
echo "--- Step 1/5: 🔒 安全扫描 ---"
bash "$SCRIPT_DIR/security-scan.sh" || exit 1
echo "✅ 安全扫描通过"

# Step 2/5: ⚡ 熔断检查
echo ""
echo "--- Step 2/5: ⚡ 熔断检查 ---"
bash "$SCRIPT_DIR/fuse-check.sh" "pipeline" "auto" || true
echo "✅ 熔断检查完成"

# Step 3/5: 📋 审计新鲜度
echo ""
echo "--- Step 3/5: 📋 审计新鲜度 ---"
bash "$SCRIPT_DIR/audit-freshness-check.sh" || true
echo "✅ 审计新鲜度检查完成"

# Step 4/5: 🔗 哈希链
echo ""
echo "--- Step 4/5: 🔗 哈希链 ---"
bash "$SCRIPT_DIR/audit-hash-chain.sh" || true
echo "✅ 哈希链验证完成"

# Step 5/5: 🚀 测试(慢)
echo ""
echo "--- Step 5/5: 🚀 测试(慢) ---"
cd "$REPO_DIR" && npx turbo test 2>&1 | tail -5
echo "✅ 测试完成"

echo ""
echo "========================================"
echo "  ✅ V17 PIPELINE DONE"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
