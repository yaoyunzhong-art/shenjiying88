#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# M5 — 自签名 SSL 证书初始化脚本
#
# 用法:
#   bash scripts/init-selfsigned-cert.sh
#
# 输出:
#   nginx/ssl/m5.local.crt  — 自签名证书 (PEM)
#   nginx/ssl/m5.local.key  — 私钥
#
# 无额外依赖 (仅 openssl，macOS/Linux 自带)
# ════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SSL_DIR="${SCRIPT_DIR}/nginx/ssl"

mkdir -p "$SSL_DIR"

CERT_FILE="${SSL_DIR}/m5.local.crt"
KEY_FILE="${SSL_DIR}/m5.local.key"

# 如果证书已存在且有效，跳过
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  # 检查证书是否在 30 天内过期
  if openssl x509 -checkend $((30 * 86400)) -noout -in "$CERT_FILE" 2>/dev/null; then
    echo "✔  证书已存在且在有效期内，跳过生成"
    exit 0
  fi
  echo "⚠  证书即将过期或已过期，重新生成"
fi

# ── 生成自签名证书 ──────────────────────────────────────────
# SAN 包含所有 m5 子域名
echo "🔐  正在生成自签名证书 (有效期 365 天)..."

openssl req -x509 \
  -newkey rsa:4096 \
  -sha256 \
  -days 365 \
  -nodes \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -subj "/CN=m5.local/O=M5 Development/C=CN" \
  -addext "subjectAltName="\
"DNS:localhost,"\
"DNS:m5.local,"\
"DNS:api.m5.local,"\
"DNS:admin.m5.local,"\
"DNS:store.m5.local,"\
"DNS:tob.m5.local,"\
"DNS:*.shenjiying.localhost" \
  -addext "extendedKeyUsage=serverAuth"

chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"

echo ""
echo "✔  证书已生成:"
echo "    CRT: ${CERT_FILE}"
echo "    KEY: ${KEY_FILE}"
echo ""
echo "📋  在系统信任存储中安装证书 (可选):"
echo "    macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${CERT_FILE}"
echo "    Linux: sudo cp ${CERT_FILE} /usr/local/share/ca-certificates/m5-local.crt && sudo update-ca-certificates"
echo ""
echo "📋  /etc/hosts 添加 (本地测试用):"
echo "    127.0.0.1  api.m5.local admin.m5.local store.m5.local tob.m5.local"
