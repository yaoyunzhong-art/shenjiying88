#!/usr/bin/env bash
# monitoring-daily.sh · 监控日报生成器 (Pulse-67 闭环)
#
# 功能:
#   - 综合执行 rfc-monitor.py / rfc-remind.sh / rfc-finalize.py / standup-prep.py
#   - 输出每日监控报告到 docs/monitoring/YYYY-MM-DD.md
#   - 包含: RFC 状态 / 投票截止倒计时 / Standup 准备 / 最近 commit / 阻塞项
#   - 幂等: 重复运行不修改现有 .md, 仅生成新的 monitoring 报告
#   - 默认 force 覆盖 (日报只需保留最新一份)
#
# 用法:
#   bash scripts/monitoring-daily.sh                 # 今天
#   bash scripts/monitoring-daily.sh 2026-06-26     # 指定日期
#
# Cron 示例:
#   0 0 * * * /path/to/shenjiying88/scripts/monitoring-daily.sh >> /var/log/rfc-monitor.log 2>&1
#
# 关联: scripts/rfc-monitor.py · scripts/rfc-remind.sh · scripts/rfc-finalize.py · scripts/standup-prep.py

set -u

# ---------- 参数 ----------
DATE_STR="${1:-}"
if [ -z "$DATE_STR" ]; then
  DATE_STR=$(TZ='Asia/Shanghai' date '+%Y-%m-%d')
fi

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITOR_DIR="$REPO_ROOT/docs/monitoring"
OUT_FILE="$MONITOR_DIR/${DATE_STR}.md"

RFC_MONITOR="$SCRIPT_DIR/rfc-monitor.py"
RFC_REMIND="$SCRIPT_DIR/rfc-remind.sh"
RFC_FINALIZE="$SCRIPT_DIR/rfc-finalize.py"
STANDUP_PREP="$SCRIPT_DIR/standup-prep.py"

# ---------- 临时文件 ----------
TMPDIR_DAILY=$(mktemp -d -t monitoring-daily.XXXXXX)
TMP_MONITOR="$TMPDIR_DAILY/monitor.txt"
TMP_MONITOR_JSON="$TMPDIR_DAILY/monitor.json"
TMP_REMIND="$TMPDIR_DAILY/remind.txt"
TMP_FINALIZE="$TMPDIR_DAILY/finalize.txt"
TMP_STANDUP="$TMPDIR_DAILY/standup.txt"
TMP_RECENT="$TMPDIR_DAILY/recent.txt"
trap 'rm -rf "$TMPDIR_DAILY"' EXIT

# ---------- 标题 ----------
log() {
  printf '[%s] %s\n' "$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S')" "$*"
}

log "=== monitoring-daily.sh · $DATE_STR ==="
log "REPO: $REPO_ROOT"

# ---------- 1. RFC 监控 ----------
log "[1/4] rfc-monitor.py (表格 + JSON)"
if python3 "$RFC_MONITOR" > "$TMP_MONITOR" 2>&1; then
  python3 "$RFC_MONITOR" --json > "$TMP_MONITOR_JSON" 2>/dev/null || echo "[]" > "$TMP_MONITOR_JSON"
  log "  ✓ 表格 + JSON 已保存"
else
  log "  ✗ rfc-monitor.py 失败 (使用占位)"
  echo "(rfc-monitor.py 失败)" > "$TMP_MONITOR"
  echo "[]" > "$TMP_MONITOR_JSON"
fi

# ---------- 2. RFC 提醒 (72h 窗口) ----------
log "[2/4] rfc-remind.sh 72 (临近提醒)"
# 加 + 抑制 job control 警告 (cron / 非交互环境下会产生 "bash: no job control")
bash "$RFC_REMIND" 72 --quiet > "$TMP_REMIND" 2>&1 || true
# 清理 "bash: no job control in this shell" 这种误报
sed -i.bak '/^bash: no job control/d' "$TMP_REMIND" 2>/dev/null || true
rm -f "$TMP_REMIND.bak"
# remind 在无提醒时退出 0 不输出, 但 quiet 模式下也会输出空
if [ ! -s "$TMP_REMIND" ]; then
  echo "(72h 内无即将到期的 RFC)" > "$TMP_REMIND"
fi
log "  ✓ 提醒已保存 ($(wc -l < "$TMP_REMIND") 行)"

# ---------- 3. RFC 归档检查 ----------
log "[3/4] rfc-finalize.py --dry-run"
python3 "$RFC_FINALIZE" > "$TMP_FINALIZE" 2>&1 || true
log "  ✓ 归档检查已保存 ($(wc -l < "$TMP_FINALIZE") 行)"

# ---------- 4. Standup 准备 ----------
log "[4/4] standup-prep.py --date $DATE_STR --stdout"
python3 "$STANDUP_PREP" --date "$DATE_STR" --stdout --no-git > "$TMP_STANDUP" 2>&1 || true
log "  ✓ Standup 模板已保存 ($(wc -l < "$TMP_STANDUP") 行)"

# ---------- 5. 最近 7 天 commit (日报视图) ----------
log "[+] git log (过去 7 天)"
TZ='Asia/Shanghai' git -C "$REPO_ROOT" log \
  --since="$(TZ='Asia/Shanghai' date -v-7d '+%Y-%m-%dT00:00:00+08:00' 2>/dev/null || date -d '7 days ago' '+%Y-%m-%dT00:00:00+08:00')" \
  --no-merges --pretty=format:'- `%h` %ad %s' --date=short \
  > "$TMP_RECENT" 2>&1 || true
log "  ✓ $(wc -l < "$TMP_RECENT") commits"

# ---------- 汇总指标 (从 JSON 提取) ----------
NOW_CST=$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S %Z')
TOTAL=$(python3 -c "import json; print(len(json.load(open('$TMP_MONITOR_JSON'))))")
VOTING=$(python3 -c "import json; print(sum(1 for r in json.load(open('$TMP_MONITOR_JSON')) if r.get('status')=='voting'))")
PASSED=$(python3 -c "import json; print(sum(1 for r in json.load(open('$TMP_MONITOR_JSON')) if r.get('status')=='passed'))")
BLOCKED=$(python3 -c "import json; print(sum(1 for r in json.load(open('$TMP_MONITOR_JSON')) if r.get('status')=='blocked'))")
EXPIRE_SOON=$(python3 -c "import json; print(sum(1 for r in json.load(open('$TMP_MONITOR_JSON')) if r.get('status')=='voting' and (r.get('remaining_seconds') or 0) <= 72*3600))")

# ---------- 6. 生成日报 ----------
log "[+] 汇总输出到 $OUT_FILE"

mkdir -p "$MONITOR_DIR"

{
  echo "# 监控日报 · $DATE_STR"
  echo ""
  echo "> 自动生成: $NOW_CST"
  echo "> 生成器: scripts/monitoring-daily.sh (Pulse-67 闭环)"
  echo "> 数据源: rfc-monitor.py + rfc-remind.sh + rfc-finalize.py + standup-prep.py + git log"
  echo ""
  echo "---"
  echo ""
  echo "## 📊 关键指标"
  echo ""
  echo "| 指标 | 值 |"
  echo "|---|---|"
  echo "| 总 RFC 数 | $TOTAL |"
  echo "| 🟡 投票中 | $VOTING |"
  echo "| ✅ 已通过 | $PASSED |"
  echo "| 🛑 阻塞 | $BLOCKED |"
  echo "| 🚨 72h 内即将到期 | $EXPIRE_SOON |"
  echo "| 最近 7 天 commit | $(wc -l < "$TMP_RECENT" | tr -d ' ') |"
  echo "| 时区 | Asia/Shanghai |"
  echo ""
  echo "---"
  echo ""
  echo "## 🗳️ RFC 状态总览 (rfc-monitor.py)"
  echo ""
  echo '```'
  cat "$TMP_MONITOR"
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "## 🚨 截止提醒 (rfc-remind.sh 72h 窗口)"
  echo ""
  cat "$TMP_REMIND"
  echo ""
  echo "---"
  echo ""
  echo "## ✅ 归档检查 (rfc-finalize.py dry-run)"
  echo ""
  echo '```'
  cat "$TMP_FINALIZE"
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "## 📋 Standup 准备 (standup-prep.py)"
  echo ""
  echo "<details><summary>点击展开 Standup 模板 (复制到 docs/standup/)</summary>"
  echo ""
  cat "$TMP_STANDUP"
  echo ""
  echo "</details>"
  echo ""
  echo "---"
  echo ""
  echo "## 📝 最近 7 天 commit"
  echo ""
  if [ -s "$TMP_RECENT" ]; then
    cat "$TMP_RECENT"
  else
    echo "_(无 commit)_"
  fi
  echo ""
  echo "---"
  echo ""
  echo "## 🔗 关联"
  echo ""
  echo "- [voting-record.md](../../process/voting-record.md) · 投票历史"
  echo "- [debt.md](../../../debt.md) · 债务追踪"
  echo "- [docs/process/standup-template.md](../../process/standup-template.md) · Standup 模板"
  echo "- [scripts/rfc-monitor.py](../../../scripts/rfc-monitor.py) · RFC 监控"
  echo "- [scripts/rfc-remind.sh](../../../scripts/rfc-remind.sh) · 截止提醒"
  echo "- [scripts/rfc-finalize.py](../../../scripts/rfc-finalize.py) · 自动归档"
  echo "- [scripts/standup-prep.py](../../../scripts/standup-prep.py) · Standup 准备"
  echo ""
  echo "---"
  echo ""
  echo "> 由 monitoring-daily.sh 在 $NOW_CST 自动生成"
  echo "> 重复运行幂等 (覆盖本次日报)"
} > "$OUT_FILE"

log "✅ 日报已生成: docs/monitoring/${DATE_STR}.md ($(wc -c < "$OUT_FILE") 字节)"

# ---------- 7. 输出摘要到 stdout ----------
echo ""
echo "============================================================"
echo "📊 监控日报摘要 · $DATE_STR"
echo "============================================================"
echo ""
echo "🗳️  RFC 状态:"
python3 "$RFC_MONITOR" 2>/dev/null | tail -10
echo ""
echo "🚨 截止提醒 (72h):"
if [ -s "$TMP_REMIND" ]; then
  head -20 "$TMP_REMIND"
else
  echo "  (无)"
fi
echo ""
echo "📄 完整日报: $OUT_FILE"
echo "============================================================"

exit 0
