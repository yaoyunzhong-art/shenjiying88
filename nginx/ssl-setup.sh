#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# shenjiying88 — 自签名 SSL 证书生成脚本
#
# 生成开发环境自签名证书（有效期 365 天）
# 输出目录: nginx/certs/
# 生产环境请替换为真实 CA 签发证书！
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/certs"
DAYS=365
KEY_FILE="${CERT_DIR}/m5.local.key"
CRT_FILE="${CERT_DIR}/m5.local.crt"

# ─── 颜色 ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ─── 检查 openssl ────────────────────────────────────────
if ! command -v openssl &>/dev/null; then
    error "openssl 未安装，请先安装 openssl。"
    echo "  macOS: brew install openssl"
    echo "  Ubuntu: apt install openssl"
    exit 1
fi
info "openssl 已安装: $(openssl version 2>&1 | head -1)"

# ─── 创建输出目录 ────────────────────────────────────────
mkdir -p "${CERT_DIR}"
info "证书目录: ${CERT_DIR}"

# ─── 生成自签名证书 ───────────────────────────────────────
# 使用 subjectAltName 支持多域名（api.m5.local, admin.m5.local 等）
info "生成自签名证书（${DAYS} 天有效期）..."

openssl req -x509 \
    -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CRT_FILE}" \
    -days "${DAYS}" \
    -nodes \
    -subj "/CN=m5.local/O=shenjiying88/OU=Dev" \
    -addext "subjectAltName=DNS:localhost,DNS:m5.local,DNS:api.m5.local,DNS:admin.m5.local,DNS:store.m5.local,DNS:tob.m5.local" \
    2>/dev/null

if [ ! -f "${KEY_FILE}" ] || [ ! -f "${CRT_FILE}" ]; then
    error "证书生成失败！"
    exit 1
fi

info "私钥: ${KEY_FILE}"
info "证书: ${CRT_FILE}"

# ─── 权限 ────────────────────────────────────────────────
chmod 600 "${KEY_FILE}"
chmod 644 "${CRT_FILE}"

# ─── 验证 ────────────────────────────────────────────────
echo ""
info "证书信息:"
openssl x509 -in "${CRT_FILE}" -noout -subject -dates -ext subjectAltName 2>/dev/null || true

echo ""
info "=== SSL 证书就绪 ==="
warn "⚠  生产环境请替换为真实 CA 签发的证书！"
echo ""
echo "  使用方式:"
echo "    1. 将 ${CERT_DIR}/* 挂载到容器 /etc/nginx/ssl/"
echo "    2. 或复制到 nginx/ssl/ 目录构建到 Docker 镜像中"
echo "    3. nginx 配置:"
echo "       ssl_certificate     /etc/nginx/ssl/m5.local.crt;"
echo "       ssl_certificate_key /etc/nginx/ssl/m5.local.key;"
echo ""
