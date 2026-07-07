#!/usr/bin/env bash
# rfc-remind.sh · RFC 截止提醒脚本 (Pulse-67 闭环)
#
# 功能:
#   - 接收 hours_before 参数 (默认 24)
#   - 扫描所有投票中 RFC
#   - 对剩余时间 < hours_before 的 RFC 输出提醒
#   - 列出 Approver 投票情况 (从 voting-record.md 提取)
#   - 支持 cron 调用: 0 */6 * * * /path/to/rfc-remind.sh 24
#
# 用法:
#   bash scripts/rfc-remind.sh                # 默认 24h 窗口
#   bash scripts/rfc-remind.sh 48             # 48h 窗口
#   bash scripts/rfc-remind.sh 24 --quiet     # 只在有提醒时输出
#
# 退出码:
#   0 - 无临近截止 RFC / 已输出提醒
#   1 - 错误 (rfc-monitor.py 不存在等)
#
# 关联: docs/process/voting-record.md · scripts/rfc-monitor.py

set -u

# ---------- 参数解析 ----------
HOURS_BEFORE="${1:-24}"
QUIET=0
if [ "${2:-}" = "--quiet" ] || [ "${1:-}" = "--quiet" ]; then
  QUIET=1
fi

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITOR="$SCRIPT_DIR/rfc-monitor.py"
RECORD="$REPO_ROOT/docs/process/voting-record.md"

# ---------- 检查依赖 ----------
if [ ! -f "$MONITOR" ]; then
  echo "❌ 未找到 $MONITOR, 请先创建 rfc-monitor.py" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ 未找到 python3" >&2
  exit 1
fi

# ---------- 1. 拉取所有 voting RFC 的 JSON ----------
# 用一个比 hours_before 略大的窗口确保捕获, 然后在 shell 里二次过滤 (避免 monitor 内置逻辑误差)
JSON=$(python3 "$MONITOR" --json 2>/dev/null || echo "[]")
if [ -z "$JSON" ] || [ "$JSON" = "[]" ]; then
  if [ "$QUIET" -eq 0 ]; then
    echo "ℹ️  当前无活跃 RFC"
  fi
  exit 0
fi

# ---------- 2. 提取即将到期的 voting RFC ----------
# 用 python 做 JSON 解析 (比 jq 通用); 通过临时文件避免 heredoc + $() 嵌套歧义
TMP_JSON=$(mktemp -t rfc-remind.XXXXXX)
TMP_FILTERED=$(mktemp -t rfc-remind.XXXXXX)
trap 'rm -f "$TMP_JSON" "$TMP_FILTERED"' EXIT

printf '%s' "$JSON" > "$TMP_JSON"

python3 - "$HOURS_BEFORE" "$TMP_JSON" > "$TMP_FILTERED" <<'PYEOF'
import json, sys
threshold = int(sys.argv[1]) * 3600  # 秒
json_path = sys.argv[2]
try:
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    sys.stderr.write(f"warn: parse json failed: {e}\n")
    sys.exit(0)
for r in data:
    if r.get("status") != "voting":
        continue
    rs = r.get("remaining_seconds")
    if rs is None or rs < 0 or rs > threshold:
        continue
    hours = rs / 3600.0
    fields = [
        r["id"],
        r["title"],
        r.get("deadline", ""),
        f"{hours:.1f}",
        str(r.get("vote_count", 0)),
        str(r.get("agree_weight", 0)),
        str(r.get("reject_weight", 0)),
        "True" if r.get("champion_veto") else "False",
    ]
    print("|".join(fields))
PYEOF

NEED_REMIND=0
NOW_CST=$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S %Z')
HEADER_SHOWN=0

while IFS='|' read -r rid title deadline hours vote_count agree_w reject_w veto; do
  [ -z "$rid" ] && continue
  # 二次过滤: hours < HOURS_BEFORE (用 python 浮点比较避免 bc)
  if ! python3 -c "import sys; sys.exit(0 if float('$hours') <= float('$HOURS_BEFORE') else 1)" 2>/dev/null; then
    continue
  fi
  NEED_REMIND=1
  if [ "$HEADER_SHOWN" -eq 0 ] && [ "$QUIET" -eq 0 ]; then
    echo "============================================================"
    echo "🚨 RFC 截止提醒 · 临近 $HOURS_BEFORE 小时窗口"
    echo "   当前时间 (Asia/Shanghai): $NOW_CST"
    echo "============================================================"
    echo ""
    HEADER_SHOWN=1
  fi

  echo "🚨 RFC $rid 即将截止 (剩余 ${hours}h)"
  echo "   标题:   $title"
  echo "   截止:   $deadline"
  echo "   票数:   ${vote_count} 票 (同意 ${agree_w} / 反对 ${reject_w} / Champion 否决 $([ "$veto" = "True" ] && echo 有 || echo 无))"
  echo ""

  # 提取投票明细 (从 voting-record.md §2.x)
  if [ -f "$RECORD" ]; then
    echo "   📋 Approver 投票情况 (from voting-record.md):"
    python3 - "$RECORD" "$rid" <<'PYEOF' 2>/dev/null | sed 's/^/     /'
import re, sys
path, rid = sys.argv[1], sys.argv[2]
try:
    text = open(path, encoding="utf-8").read()
except Exception:
    print("(无法读取 voting-record.md)")
    sys.exit(0)
# 找 §2.X 章节, 兼容 "### 2.2 R7 · ..." 和 "### 2.2 · R7 ..." 两种写法
pat = re.compile(rf"###\s+2\.\d+\s+(?:·\s*)?{re.escape(rid)}\b[^\n]*\n(.*?)(?=\n###\s+2\.|\n##\s|\Z)", re.DOTALL)
m = pat.search(text)
if not m:
    print(f"(voting-record.md 未登记 {rid} 投票明细)")
    sys.exit(0)
body = m.group(1)
# 找 "投票明细" 子表
sec = re.search(r"\|.*投票人.*\|.*级别.*\|[^\n]*\n\|[-\s|]+\n(.*?)(?=\n####|\n###|\n##\s|\Z)", body, re.DOTALL)
if not sec:
    print(f"({rid} 章节无投票明细表)")
    sys.exit(0)
rows = sec.group(1).strip().split("\n")
count = 0
for row in rows:
    cells = [c.strip() for c in row.strip().strip("|").split("|")]
    if len(cells) < 5:
        continue
    voter, role, vote, weight, reason = cells[:5]
    if "(待填)" in voter or not voter:
        continue
    count += 1
    # 截短理由
    if len(reason) > 50:
        reason = reason[:47] + "..."
    print(f"  - {voter} ({role}) {vote} 权重 {weight}: {reason}")
if count == 0:
    print(f"  (尚无 {rid} 投票)")
PYEOF
    echo ""
  fi
done < "$TMP_FILTERED"

if [ "$NEED_REMIND" -eq 0 ]; then
  if [ "$QUIET" -eq 0 ]; then
    echo "✅ 当前无 ${HOURS_BEFORE}h 内到期的 RFC (Asia/Shanghai: $NOW_CST)"
  fi
  exit 0
fi

echo "------------------------------------------------------------"
echo "📌 行动项:"
echo "   1. 催促 Approver 投票 (P0-005 / RFC R7 R8 同步)"
echo "   2. 提醒 Champion 准备归档"
echo "   3. 见 docs/process/voting-record.md §2.x"
echo "============================================================"
exit 0
