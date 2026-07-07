#!/usr/bin/env python3
"""
rfc-monitor.py · RFC 状态监控脚本 (Pulse-67 闭环)

功能:
  - 扫描 rfcs/voting/R*.md 文件
  - 提取每个 RFC 的状态(投票中/通过/否决/阻塞)
  - 提取截止日期 + 剩余时间(Asia/Shanghai 时区)
  - 输出表格到 stdout (默认)
  - 支持 --json 输出
  - 支持 --rfc R7 查看单个 RFC 详情
  - 支持 --expire-soon 24 筛选 24h 内即将到期的 RFC

用法:
  python3 scripts/rfc-monitor.py
  python3 scripts/rfc-monitor.py --json
  python3 scripts/rfc-monitor.py --rfc R7
  python3 scripts/rfc-monitor.py --expire-soon 24
  python3 scripts/rfc-monitor.py --json --expire-soon 48

依赖: 仅标准库 (zoneinfo 需 Python 3.9+)
关联: docs/process/voting-record.md
"""

import argparse
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
VOTING_DIR = REPO_ROOT / "rfcs" / "voting"
VOTING_RECORD = REPO_ROOT / "docs" / "process" / "voting-record.md"
TZ = ZoneInfo("Asia/Shanghai")

# 状态徽标 (与 voting-record.md 保持一致)
STATUS_ICON = {
    "voting": "🟡 投票中",
    "passed": "✅ 通过",
    "rejected": "❌ 否决",
    "blocked": "🛑 阻塞",
    "withdrawn": "↩️ 撤回",
    "draft": "📝 草稿",
    "unknown": "❓ 未知",
}

# ---------- 解析工具 ----------


def parse_rfc_file(path: Path) -> dict:
    """解析单个 R{N}-*.md, 返回结构化字段。"""
    text = path.read_text(encoding="utf-8")
    rfc_id = path.stem.split("-", 1)[0].upper()  # R6, R7, R8

    info: dict = {
        "id": rfc_id,
        "file": str(path.relative_to(REPO_ROOT)),
        "title": "",
        "submitter": "",
        "submit_date": "",
        "deadline": "",
        "status": "unknown",
        "agree_weight": 0.0,
        "reject_weight": 0.0,
        "veto": False,
        "vote_count": 0,
        "votes": [],
        "raw_status_line": "",
    }

    # 标题: 第一行 # 开头
    title_match = re.search(r"^#\s+(.+?)$", text, re.MULTILINE)
    if title_match:
        info["title"] = title_match.group(1).strip()

    # RFC 信息字段 (基于 template.md 的固定格式)
    for field, key in [
        ("RFC 标题", "title"),
        ("提交人", "submitter"),
        ("提交日期", "submit_date"),
        ("投票截止", "deadline"),
    ]:
        m = re.search(rf"-\s*\*\*{field}\*\*[:：]\s*(.+?)$", text, re.MULTILINE)
        if m and not info.get(key):
            info[key] = m.group(1).strip()

    # 截止日期 (兼容多种写法)
    deadline_str = info["deadline"]
    deadline_dt = parse_deadline(deadline_str)
    info["deadline_dt"] = deadline_dt
    info["deadline_iso"] = deadline_dt.isoformat() if deadline_dt else None

    # 当前统计 / 决议
    for line in text.splitlines():
        s = line.strip()
        # 同意 / 反对权重
        m = re.match(r"-\s*\*\*同意总权重\*\*[:：]\s*([\d.]+)", s)
        if m:
            info["agree_weight"] = float(m.group(1))
        m = re.match(r"-\s*\*\*反对总权重\*\*[:：]\s*([\d.]+)", s)
        if m:
            info["reject_weight"] = float(m.group(1))
        # Champion 否决
        if re.search(r"\*\*Champion\s*否决\*\*[:：]", s):
            info["veto"] = "有" in s
        # 决议
        m = re.match(r"-\s*\*\*决议\*\*[:：]\s*(.+?)$", s)
        if m:
            info["resolution"] = m.group(1).strip()
        m = re.match(r"-\s*\*\*决议日期\*\*[:：]\s*(.+?)$", s)
        if m:
            info["resolution_date"] = m.group(1).strip()

    # 投票明细表格 (按时间倒序) — 解析 "投票人 | 级别 | 投票 | 投票权重" 行
    info["votes"] = parse_votes_table(text)
    info["vote_count"] = len(info["votes"])

    # 兜底: 从 voting-record.md §1.1 提取当前活跃 RFC 表 (用于 R7/R8 等自定义格式)
    # 必须在 infer_status 之前调用, 因为它可能补充 deadline_dt 和权威状态
    enrich_from_voting_record(info)
    deadline_dt = info["deadline_dt"]

    # 状态推断 (优先级: voting-record.md 权威状态 > 本文件决议 > Champion 否决 > 投票窗口 > 默认)
    info["status"] = infer_status(info, deadline_dt)
    info["status_icon"] = STATUS_ICON.get(info["status"], STATUS_ICON["unknown"])

    # 剩余时间
    if deadline_dt:
        now = datetime.now(TZ)
        delta = deadline_dt - now
        info["remaining_seconds"] = int(delta.total_seconds())
        info["remaining_human"] = humanize_delta(delta)
    else:
        info["remaining_seconds"] = None
        info["remaining_human"] = "(无法解析截止时间)"

    return info


def parse_deadline(s: str):
    """解析多种日期格式, 返回带 Asia/Shanghai 时区的 datetime; 失败返回 None。"""
    if not s:
        return None
    s = s.strip()
    # 去掉括号说明, 例如 "(提交后 72 小时)"
    s = re.sub(r"\s*\(.*?\)\s*$", "", s).strip()
    # 去掉尾部时区缩写 (CST/UTC/UTC+8 等), 强制使用 Asia/Shanghai
    s = re.sub(r"\s+(CST|UTC|UTC[+\-]\d{1,2}|GMT|GMT[+\-]\d{1,2})\s*$", "", s).strip()
    # 常见格式
    patterns = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]
    for pat in patterns:
        try:
            dt = datetime.strptime(s, pat)
            return dt.replace(tzinfo=TZ)
        except ValueError:
            continue
    # ISO 格式 (含 T)
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=TZ)
        return dt
    except ValueError:
        return None


def parse_votes_table(text: str) -> list[dict]:
    """解析 '## 投票' 章节下的 markdown 表格。"""
    votes = []
    # 找到投票表区段
    section = re.search(r"##\s+投票[^\n]*\n(.*?)(?=\n##\s|\Z)", text, re.DOTALL)
    if not section:
        return votes
    body = section.group(1)
    lines = [ln for ln in body.splitlines() if ln.strip().startswith("|")]
    if len(lines) < 3:
        return votes
    # 跳过表头 + 分隔行
    for line in lines[2:]:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5:
            continue
        voter, role, vote, weight, reason = cells[:5]
        # 跳过占位行
        if "(待填)" in voter or not voter:
            continue
        # 解析权重
        try:
            w = float(re.findall(r"[\d.]+", weight)[0])
        except (ValueError, IndexError):
            w = 0.0
        # 归一化投票类型
        if "✅" in vote or "同意" in vote:
            kind = "agree"
        elif "❌" in vote or "反对" in vote:
            kind = "reject"
        elif "🛑" in vote or "否决" in vote:
            kind = "veto"
        else:
            kind = "abstain"
        votes.append({
            "voter": voter,
            "role": role,
            "vote": kind,
            "weight": w,
            "reason": reason,
        })
    return votes


def infer_status(info: dict, deadline_dt) -> str:
    """根据决议 / 否决 / 截止时间推断当前状态。

    优先级: voting-record.md 权威状态 > 本文件决议 > Champion 否决 > 投票窗口 > 默认
    """
    record_status = info.get("_record_status")
    if record_status:
        return record_status
    resolution = info.get("resolution", "")
    if "通过" in resolution:
        return "passed"
    if "撤回" in resolution:
        return "withdrawn"
    if "阻塞" in resolution or info.get("veto"):
        return "blocked"
    # 投票中 = 截止时间未到 + 无最终决议
    if deadline_dt and datetime.now(TZ) < deadline_dt:
        return "voting"
    # 截止时间已过但无决议 -> 阻塞 (待 Champion 归档)
    if deadline_dt and datetime.now(TZ) >= deadline_dt:
        return "blocked"
    return "draft"


def enrich_from_voting_record(info: dict) -> None:
    """从 voting-record.md §1.1 当前活跃 RFC 表补充缺失字段。"""
    if not VOTING_RECORD.exists():
        return
    # 只在缺失时兜底
    need_fill = not info.get("submitter") or not info.get("deadline")
    if not need_fill:
        return
    text = VOTING_RECORD.read_text(encoding="utf-8")
    # 找 §1.1 当前活跃 RFC 表
    sec = re.search(r"###\s+1\.1[^\n]*\n(.*?)(?=\n###|\n##\s|\Z)", text, re.DOTALL)
    if not sec:
        return
    body = sec.group(1)
    lines = [ln for ln in body.splitlines() if ln.strip().startswith("|")]
    if len(lines) < 3:
        return
    # 跳过表头 + 分隔
    for line in lines[2:]:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6:
            continue
        rid, title, submitter, submit_date, deadline, status_cell = cells[:6]
        if rid.strip() != info["id"]:
            continue
        # 字段缺失时填充
        if not info.get("submitter") or info["submitter"] in ("", "-"):
            info["submitter"] = submitter
        if not info.get("submit_date") or info["submit_date"] in ("", "-"):
            info["submit_date"] = submit_date
        if not info.get("deadline") or info["deadline"] in ("", "-"):
            info["deadline"] = deadline
            dt = parse_deadline(deadline)
            if dt:
                info["deadline_dt"] = dt
                info["deadline_iso"] = dt.isoformat()
        # 标题缺失时也补
        if not info.get("title") or info["title"].startswith("#"):
            info["title"] = title
        # 状态行: 🟡 投票中 / ✅ 通过 / ❌ 否决 / 🛑 阻塞
        if "投票中" in status_cell:
            info["_record_status"] = "voting"
        elif "通过" in status_cell:
            info["_record_status"] = "passed"
        elif "否决" in status_cell:
            info["_record_status"] = "rejected"
        elif "阻塞" in status_cell:
            info["_record_status"] = "blocked"
        elif "撤回" in status_cell:
            info["_record_status"] = "withdrawn"
        return


def humanize_delta(delta: timedelta) -> str:
    """将 timedelta 转为 "2天 5小时" / "已过期 3小时" 这种中文。"""
    total = int(delta.total_seconds())
    sign = "已过期" if total < 0 else "剩余"
    total = abs(total)
    days, rem = divmod(total, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, _ = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}天")
    if hours:
        parts.append(f"{hours}小时")
    if minutes and not days:
        parts.append(f"{minutes}分钟")
    if not parts:
        return f"{sign} <1分钟"
    return f"{sign} " + " ".join(parts)


# ---------- 输出 ----------


def render_table(monitors: list[dict]) -> str:
    """生成可读的 ASCII 表格。"""
    headers = ["RFC", "状态", "标题", "提交人", "截止", "剩余", "同意/反对/否决", "票数"]
    rows = []
    for m in monitors:
        rows.append([
            m["id"],
            m["status_icon"],
            truncate(m["title"] or "(无标题)", 36),
            m["submitter"] or "-",
            m["deadline"] or "-",
            m["remaining_human"],
            f"{m['agree_weight']:.1f} / {m['reject_weight']:.1f} / {'有' if m['veto'] else '无'}",
            str(m["vote_count"]),
        ])
    return format_table(headers, rows)


def truncate(s: str, n: int) -> str:
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def format_table(headers: list[str], rows: list[list[str]]) -> str:
    widths = [len(h) for h in headers]
    for r in rows:
        for i, c in enumerate(r):
            # 去掉 emoji 宽度对中文对齐的影响 (简单按字符数)
            widths[i] = max(widths[i], len(c))
    sep = "+".join("-" * (w + 2) for w in widths)
    sep = f"+{sep}+"
    out = [sep]
    out.append("| " + " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers)) + " |")
    out.append(sep)
    for r in rows:
        out.append("| " + " | ".join(c.ljust(widths[i]) for i, c in enumerate(r)) + " |")
    out.append(sep)
    return "\n".join(out)


def render_detail(m: dict) -> str:
    """单个 RFC 详情视图。"""
    lines = []
    lines.append(f"## {m['id']} · {m['title']}")
    lines.append("")
    lines.append(f"- 状态: {m['status_icon']}")
    lines.append(f"- 提交人: {m['submitter'] or '(未知)'}")
    lines.append(f"- 提交日期: {m['submit_date'] or '(未知)'}")
    lines.append(f"- 投票截止: {m['deadline'] or '(未知)'} ({m['remaining_human']})")
    lines.append(f"- 同意总权重: {m['agree_weight']:.1f}")
    lines.append(f"- 反对总权重: {m['reject_weight']:.1f}")
    lines.append(f"- Champion 否决: {'有 🛑' if m['veto'] else '无 ✅'}")
    if m.get("resolution"):
        lines.append(f"- 决议: {m['resolution']}")
    if m.get("resolution_date"):
        lines.append(f"- 决议日期: {m['resolution_date']}")
    lines.append(f"- 投票明细条数: {m['vote_count']}")
    lines.append(f"- 源文件: `{m['file']}`")
    lines.append("")
    if m["votes"]:
        lines.append("### 投票明细")
        lines.append("")
        lines.append("| 投票人 | 级别 | 投票 | 权重 | 理由 |")
        lines.append("|---|---|---|---|---|")
        for v in m["votes"]:
            sym = {"agree": "✅ 同意", "reject": "❌ 反对", "veto": "🛑 否决"}.get(v["vote"], v["vote"])
            lines.append(f"| {v['voter']} | {v['role']} | {sym} | {v['weight']:.1f} | {v['reason']} |")
    else:
        lines.append("### 投票明细")
        lines.append("")
        lines.append("(暂无投票)")
    return "\n".join(lines)


# ---------- main ----------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="RFC 状态监控 (rfcs/voting/R*.md)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="示例:\n"
               "  python3 scripts/rfc-monitor.py                # 表格\n"
               "  python3 scripts/rfc-monitor.py --json         # JSON\n"
               "  python3 scripts/rfc-monitor.py --rfc R7       # 单个详情\n"
               "  python3 scripts/rfc-monitor.py --expire-soon 24  # 24h 内到期\n",
    )
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    parser.add_argument("--rfc", metavar="RXX", help="查看单个 RFC (例: R7)")
    parser.add_argument("--expire-soon", type=int, metavar="HOURS",
                        help="筛选 N 小时内即将到期的 RFC (仅 voting 状态)")
    parser.add_argument("--voting-dir", default=str(VOTING_DIR),
                        help=f"RFC 目录 (默认: {VOTING_DIR})")
    args = parser.parse_args()

    voting_dir = Path(args.voting_dir)
    if not voting_dir.is_dir():
        print(f"❌ 未找到 RFC 目录: {voting_dir}", file=sys.stderr)
        return 1

    rfc_files = sorted(voting_dir.glob("R*.md"))
    # 排除 template
    rfc_files = [p for p in rfc_files if not p.name.startswith("R") or not p.stem.lower().endswith("template")]

    if not rfc_files:
        print(f"❌ {voting_dir} 下无 RFC 文件", file=sys.stderr)
        return 1

    monitors = [parse_rfc_file(p) for p in rfc_files]
    # 按 id 排序 (R6, R7, R8)
    monitors.sort(key=lambda m: int(re.findall(r"\d+", m["id"])[0]))

    # 单个 RFC
    if args.rfc:
        target = args.rfc.upper()
        match = next((m for m in monitors if m["id"] == target), None)
        if not match:
            print(f"❌ 未找到 RFC {target}", file=sys.stderr)
            return 2
        if args.json:
            # JSON 模式下 detail 也要含完整结构
            out = {k: v for k, v in match.items()}
            out["votes"] = match["votes"]
            print(json.dumps(out, ensure_ascii=False, indent=2))
        else:
            print(render_detail(match))
        return 0

    # 24h 即将到期
    if args.expire_soon is not None:
        threshold = args.expire_soon * 3600
        monitors = [
            m for m in monitors
            if m["status"] == "voting"
            and m["remaining_seconds"] is not None
            and 0 < m["remaining_seconds"] <= threshold
        ]
        if not monitors:
            msg = f"(无 {args.expire_soon}h 内到期的 RFC)"
            if args.json:
                print(json.dumps({"threshold_hours": args.expire_soon, "rfcs": []}, ensure_ascii=False, indent=2))
            else:
                print(msg)
            return 0

    if args.json:
        payload = []
        for m in monitors:
            payload.append({
                "id": m["id"],
                "title": m["title"],
                "submitter": m["submitter"],
                "submit_date": m["submit_date"],
                "deadline": m["deadline"],
                "deadline_iso": m["deadline_iso"],
                "status": m["status"],
                "status_icon": m["status_icon"],
                "remaining_seconds": m["remaining_seconds"],
                "remaining_human": m["remaining_human"],
                "agree_weight": m["agree_weight"],
                "reject_weight": m["reject_weight"],
                "champion_veto": m["veto"],
                "vote_count": m["vote_count"],
                "votes": m["votes"],
                "file": m["file"],
            })
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(render_table(monitors))
        print()
        print(f"扫描目录: {voting_dir.relative_to(REPO_ROOT)}")
        print(f"时区: Asia/Shanghai (now={datetime.now(TZ).strftime('%Y-%m-%d %H:%M:%S %Z')})")
        print(f"共 {len(monitors)} 个 RFC")
    return 0


if __name__ == "__main__":
    sys.exit(main())
