#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/build-g8-short-escalation-messages.sh \
    [--window-id <formal-window-id>] \
    [--log-root infra/k8s/cutover-logs] \
    [--output-file <path>]

Behavior:
  1. Auto-detect the latest formal-window if --window-id is omitted
  2. Read READINESS-BLOCKERS.md from the selected window
  3. Generate short escalation messages for DNS, TLS, and host-decision owners
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_ROOT="$ROOT_DIR/infra/k8s/cutover-logs"
WINDOW_ID=""
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --window-id)
      WINDOW_ID="${2:-}"
      shift 2
      ;;
    --log-root)
      LOG_ROOT="${2:-}"
      shift 2
      ;;
    --output-file)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$LOG_ROOT" ]]; then
  echo "log root does not exist: $LOG_ROOT" >&2
  exit 1
fi

if [[ -z "$WINDOW_ID" ]]; then
  latest_dir="$(find "$LOG_ROOT" -maxdepth 1 -type d -name 'formal-window-*' | sort | tail -n 1)"
  if [[ -z "$latest_dir" ]]; then
    echo "No formal-window directories found under $LOG_ROOT" >&2
    exit 1
  fi
  WINDOW_ID="$(basename "$latest_dir")"
fi

WINDOW_DIR="$LOG_ROOT/$WINDOW_ID"
BLOCKER_REPORT="$WINDOW_DIR/READINESS-BLOCKERS.md"
DNS_FILE="$WINDOW_DIR/DNS-SHORT-MESSAGE.txt"
TLS_FILE="$WINDOW_DIR/TLS-SHORT-MESSAGE.txt"
HOST_FILE="$WINDOW_DIR/HOST-DECISION-SHORT-MESSAGE.txt"
SHORT_MD_DEFAULT="$WINDOW_DIR/ESCALATION-SHORT-MESSAGES.md"
SHORT_MD="${OUTPUT_FILE:-$SHORT_MD_DEFAULT}"

if [[ ! -f "$BLOCKER_REPORT" ]]; then
  echo "Missing blocker report: $BLOCKER_REPORT" >&2
  exit 1
fi

mapfile -t blocker_lines < <(
  awk '
    /^## Blockers$/ { in_blockers=1; next }
    /^## / && in_blockers { in_blockers=0 }
    in_blockers && /^- / { print }
  ' "$BLOCKER_REPORT"
)

if [[ "${#blocker_lines[@]}" -eq 0 ]]; then
  echo "No blocker lines found in $BLOCKER_REPORT" >&2
  exit 1
fi

declare -a dns_blockers=()
declare -a tls_blockers=()
declare -a other_blockers=()

for line in "${blocker_lines[@]}"; do
  case "$line" in
    *"A record"*|*"NLB IPs"*)
      dns_blockers+=("${line#- }")
      ;;
    *"TLS"*|*"m5-tls"*|*"secret"*|*"manifest"*)
      tls_blockers+=("${line#- }")
      ;;
    *)
      other_blockers+=("${line#- }")
      ;;
  esac
done

join_lines() {
  local -n ref="$1"
  if [[ "${#ref[@]}" -eq 0 ]]; then
    echo "- 无"
    return
  fi
  for item in "${ref[@]}"; do
    echo "- $item"
  done
}

cat > "$DNS_FILE" <<EOF
【G8阻塞催办｜DNS】
最新正式窗口 readiness 已在 $WINDOW_ID 失败。
DNS 实测阻塞如下：
$(join_lines dns_blockers)
请在 24h 内确认 m5-platform.com 托管位置，并为 api/admin/store/tob 四个 host 创建 A 记录。
目标 IP：121.41.69.154 / 120.26.66.40
完成标准：四个 host 的 dig +short A 均返回生产 NLB IP，之后重跑 G8 readiness。
EOF

cat > "$TLS_FILE" <<EOF
【G8阻塞催办｜TLS / m5-tls】
最新正式窗口 readiness 已在 $WINDOW_ID 失败。
TLS 实测阻塞如下：
$(join_lines tls_blockers)
请在 24h 内二选一完成：
1. 提供正式证书 fullchain.pem + privkey.pem
2. 直接在 m5 namespace 下发 live m5-tls secret
完成标准：kubectl -n m5 get secret m5-tls 成功，之后重跑 G8 readiness。
EOF

cat > "$HOST_FILE" <<EOF
【G8阻塞催办｜正式域名拍板】
当前 G8 进入正式窗口前，业务侧仍需拍板 storefront / tob 正式 host。
最新正式窗口号：$WINDOW_ID
请在 12h 内确认 storefront 与 tob 的最终正式域名。
确认后请立即回写 infra/k8s/templates/m5-public-endpoints.env.example
完成标准：正式 host 不再使用占位口径，DNS 与证书 SAN 可按最终口径一次性落地。
EOF

cat > "$SHORT_MD" <<EOF
# G8 Short Escalation Messages

- window_id: \`$WINDOW_ID\`
- blocker_report: \`$BLOCKER_REPORT\`
- generated_at: \`$(date '+%Y-%m-%d %H:%M:%S')\`

## DNS

\`\`\`text
$(cat "$DNS_FILE")
\`\`\`

## TLS

\`\`\`text
$(cat "$TLS_FILE")
\`\`\`

## Host Decision

\`\`\`text
$(cat "$HOST_FILE")
\`\`\`
EOF

echo "window_id=$WINDOW_ID"
echo "dns_message=$DNS_FILE"
echo "tls_message=$TLS_FILE"
echo "host_message=$HOST_FILE"
echo "short_messages=$SHORT_MD"
