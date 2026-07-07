#!/usr/bin/env python3
"""
standup-prep.py · Standup 自动生成器 (Pulse-67 闭环)

功能:
  - 读取 git log (过去 24h 或指定周)
  - 读取 voting-record.md (活跃 RFC)
  - 读取 debt.md (P0/P1 状态)
  - 读取 knowledge/lessons-learned/ (最近 lessons)
  - 生成 standup 模板到 docs/standup/YYYY-MM-DD.md:
    · 昨日完成 / 今日计划 / 阻塞项 / 决策点 / RFC 投票状态
  - 支持 --date YYYY-MM-DD 指定日期
  - 支持 --week 周报模式 (汇总 7 天)

用法:
  python3 scripts/standup-prep.py                      # 今天
  python3 scripts/standup-prep.py --date 2026-06-26    # 指定日期
  python3 scripts/standup-prep.py --week               # 本周
  python3 scripts/standup-prep.py --date 2026-06-26 --force  # 覆盖已存在
  python3 scripts/standup-prep.py --stdout             # 打印到 stdout

关联: docs/process/standup-template.md · voting-record.md · debt.md
"""

import argparse
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
STANDUP_DIR = REPO_ROOT / "docs" / "standup"
VOTING_RECORD = REPO_ROOT / "docs" / "process" / "voting-record.md"
DEBT_FILE = REPO_ROOT / "debt.md"
LESSONS_DIR = REPO_ROOT / "knowledge" / "lessons-learned"
TZ = ZoneInfo("Asia/Shanghai")

PHASE_RE = re.compile(r"\b(phase|pulse)[\s-]*(\d{1,3})\b", re.IGNORECASE)


# ---------- 数据收集 ----------


def run_git_log(since: str, until: str = "now") -> list[dict]:
    """拉取 git log, 返回结构化 list。"""
    try:
        result = subprocess.run(
            ["git", "log", f"--since={since}", f"--until={until}",
             "--no-merges", "--pretty=format:%h|%an|%ad|%s",
             "--date=iso-strict"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=15,
        )
    except Exception as e:
        return [{"error": str(e)}]
    if not result.stdout.strip():
        return []
    commits = []
    for line in result.stdout.strip().split("\n"):
        if "|" not in line:
            continue
        parts = line.split("|", 3)
        if len(parts) != 4:
            continue
        sha, author, date, subject = parts
        commits.append({
            "sha": sha,
            "author": author,
            "date": date[:10] if len(date) >= 10 else date,
            "subject": subject.strip(),
        })
    return commits


def group_commits_by_phase(commits: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for c in commits:
        m = PHASE_RE.search(c["subject"])
        if not m:
            grouped.setdefault("其他", []).append(c)
            continue
        kind, num = m.group(1).lower(), m.group(2)
        key = f"{kind}-{num}"
        grouped.setdefault(key, []).append(c)
    return grouped


def parse_active_rfcs() -> list[dict]:
    """从 voting-record.md §1.1 当前活跃 RFC 表解析。"""
    if not VOTING_RECORD.exists():
        return []
    text = VOTING_RECORD.read_text(encoding="utf-8")
    sec = re.search(r"###\s+1\.1[^\n]*\n(.*?)(?=\n###|\n##\s|\Z)", text, re.DOTALL)
    if not sec:
        return []
    body = sec.group(1)
    lines = [ln for ln in body.splitlines() if ln.strip().startswith("|")]
    rfcs = []
    for line in lines[2:]:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6:
            continue
        rfcs.append({
            "id": cells[0],
            "title": cells[1],
            "submitter": cells[2],
            "submit_date": cells[3],
            "deadline": cells[4],
            "status_text": cells[5],
        })
    return rfcs


def parse_debt() -> dict[str, list[dict]]:
    """解析 debt.md, 按 P0/P1/P2 分组。"""
    if not DEBT_FILE.exists():
        return {"P0": [], "P1": [], "P2": []}
    text = DEBT_FILE.read_text(encoding="utf-8")
    out = {"P0": [], "P1": [], "P2": []}
    # 匹配 "### P0-001: 标题 ... ✅ ..." 或 "### P1-001: ..." 
    pattern = re.compile(
        r"###\s+(P\d)-(\d{3}):\s*([^\n]+)",
        re.MULTILINE,
    )
    for m in pattern.finditer(text):
        p_class, num, title = m.group(1), m.group(2), m.group(3).strip()
        # 检查是否已闭环 (有 "✅" 在标题附近)
        is_resolved = "✅" in title
        # 提取 emoji (可能 🆕/🟡/🔴)
        emoji_m = re.match(r"^([^\w\s]+)", title)
        emoji = emoji_m.group(1).strip() if emoji_m else ""
        clean_title = re.sub(r"[✅🆕🟡🔴🟢🟥🟣]", "", title).strip()
        out[p_class].append({
            "id": f"{p_class}-{num}",
            "emoji": emoji,
            "title": clean_title,
            "resolved": is_resolved,
        })
    return out


def list_recent_lessons(n: int = 3) -> list[dict]:
    """读取 lessons-learned/ 最近 n 个文件。"""
    if not LESSONS_DIR.exists():
        return []
    files = sorted(LESSONS_DIR.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    out = []
    for f in files[:n]:
        text = f.read_text(encoding="utf-8")
        # 抓标题
        title_m = re.search(r"^#\s+(.+?)$", text, re.MULTILINE)
        title = title_m.group(1).strip() if title_m else f.stem
        # 抓取第一个 Lesson
        lesson_m = re.search(r"###\s+Lesson\s+(\d+)[:：]\s*([^\n]+)", text)
        lesson = lesson_m.group(2).strip() if lesson_m else None
        out.append({
            "file": f.name,
            "title": title,
            "first_lesson": lesson,
        })
    return out


# ---------- 模板渲染 ----------


def render_standup(
    date_str: str,
    commits: list[dict],
    rfcs: list[dict],
    debt: dict[str, list[dict]],
    lessons: list[dict],
    is_week: bool = False,
    prev_date_str: str = "",
) -> str:
    """生成 standup markdown。"""
    grouped = group_commits_by_phase(commits)

    title = "周报" if is_week else "Standup"
    header_line = f"# {title} 模板 · {date_str}" + (f" (Week ending)" if is_week else "")

    lines = []
    lines.append(header_line)
    lines.append("")
    lines.append(f"> 自动生成: {datetime.now(TZ).strftime('%Y-%m-%d %H:%M %Z')}")
    lines.append(f"> 基于: docs/process/standup-template.md")
    lines.append(f"> 关联: voting-record.md · debt.md · knowledge/lessons-learned/")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- 会议信息 ----------
    lines.append("## 会议信息")
    lines.append(f"- **日期**: {date_str}")
    lines.append(f"- **时间**: 09:00-09:15 CST (15 分钟)")
    lines.append(f"- **主持人 (Champion)**: <待 R8 通过后由 E5 / E40 主持>")
    lines.append(f"- **记录人 (Recorder)**: main agent")
    lines.append(f"- **出席人数**: <待填>")
    lines.append(f"- **缺席**: <待填>")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Step 1 · Phase Owner 汇报 ----------
    lines.append("## Step 1 · Phase Owner 汇报 (来自 git log)")
    lines.append("")
    if not commits:
        lines.append(f"_(过去 {'7 天' if is_week else '24h'} 无 git commit)_")
    else:
        # 按 phase / pulse 分组
        for key in sorted(grouped.keys()):
            cs = grouped[key]
            lines.append(f"### {key}")
            lines.append(f"- **commit 数**: {len(cs)}")
            lines.append(f"- **代表提交**: `{cs[0]['sha']}` {cs[0]['subject']}")
            if len(cs) > 1:
                sample = ', '.join(f'`{c["sha"]}`' for c in cs[1:5])
                suffix = ' ...' if len(cs) > 5 else ''
                lines.append(f"- **其他 commit**: {sample}{suffix}")
            lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Step 2 · 阻塞项 (debt P0/P1) ----------
    lines.append("## Step 2 · 阻塞项 / 债务 (from debt.md)")
    lines.append("")
    open_p0 = [d for d in debt["P0"] if not d["resolved"]]
    open_p1 = [d for d in debt["P1"] if not d["resolved"]]
    if open_p0:
        lines.append("### 🔴 P0 · 阻塞级")
        for d in open_p0:
            lines.append(f"- **{d['id']}**: {d['title']}")
        lines.append("")
    if open_p1:
        lines.append("### 🟡 P1 · 阻塞级")
        for d in open_p1:
            lines.append(f"- **{d['id']}**: {d['title']}")
        lines.append("")
    if not open_p0 and not open_p1:
        lines.append("_(无 open P0/P1 阻塞)_")
        lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Step 3 · RFC 投票识别 ----------
    lines.append("## Step 3 · RFC 投票识别 (from voting-record.md)")
    lines.append("")
    if not rfcs:
        lines.append("_(voting-record.md 未发现活跃 RFC)_")
    else:
        lines.append("### 进行中")
        for r in rfcs:
            if "投票中" in r["status_text"]:
                lines.append(f"- **RFC {r['id']}** · {r['title']}")
                lines.append(f"  - 截止: {r['deadline']}")
                lines.append(f"  - 提交人: {r['submitter']}")
                lines.append(f"  - 状态: {r['status_text']}")
                lines.append("")
        passed = [r for r in rfcs if "通过" in r["status_text"]]
        if passed:
            lines.append("### 已通过 (本脉冲新增)")
            for r in passed:
                lines.append(f"- **RFC {r['id']}** · {r['title']} ({r['status_text']})")
            lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Step 4 · Lessons Learned ----------
    lines.append("## Step 4 · 最近 Lessons Learned")
    lines.append("")
    if lessons:
        for l in lessons:
            lines.append(f"- **{l['title']}** (`knowledge/lessons-learned/{l['file']}`)")
            if l["first_lesson"]:
                lines.append(f"  - {l['first_lesson']}")
    else:
        lines.append("_(无 lessons-learned 文件)_")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Step 5 · 决策点 ----------
    lines.append("## Step 5 · 决策点 (待 Champion / 用户审批)")
    lines.append("")
    lines.append("- [ ] RFC R7 (Approver 招募) 投票进度")
    lines.append("- [ ] RFC R8 (Champion 任命) 投票进度")
    lines.append("- [ ] <待补充>")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- Champion 备注 ----------
    lines.append("## Champion 备注")
    lines.append("")
    lines.append("- <待 Champion 填写>")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---------- 下次会议 ----------
    next_date = (datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    lines.append("## 下次会议")
    lines.append(f"- **下次日期**: {next_date}")
    lines.append(f"- **预备议题**: ")
    lines.append(f"  - RFC R7/R8 投票进度")
    lines.append(f"  - P0 阻塞项跟进")
    lines.append("")
    lines.append(f"> 由 standup-prep.py 自动生成 ({datetime.now(TZ).strftime('%Y-%m-%d %H:%M %Z')})")
    lines.append(f"> 模板: docs/process/standup-template.md")
    return "\n".join(lines)


# ---------- main ----------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Standup 自动生成器 (从 git log + voting + debt + lessons)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="示例:\n"
               "  python3 scripts/standup-prep.py                      # 今天\n"
               "  python3 scripts/standup-prep.py --date 2026-06-26    # 指定日期\n"
               "  python3 scripts/standup-prep.py --week               # 本周汇总\n",
    )
    parser.add_argument("--date", metavar="YYYY-MM-DD", help="指定日期 (默认今天)")
    parser.add_argument("--week", action="store_true", help="周报模式 (汇总 7 天)")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的 standup 文件")
    parser.add_argument("--stdout", action="store_true", help="打印到 stdout 而非写入文件")
    parser.add_argument("--no-git", action="store_true", help="跳过 git log (无 git 仓库时用)")
    args = parser.parse_args()

    # 日期
    if args.date:
        date_str = args.date
        try:
            target = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=TZ)
        except ValueError:
            print(f"❌ 日期格式错误: {args.date} (应为 YYYY-MM-DD)", file=sys.stderr)
            return 1
    else:
        target = datetime.now(TZ)
        date_str = target.strftime("%Y-%m-%d")

    # git log 时间窗
    if args.week:
        since = (target - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00+08:00")
        until = target.strftime("%Y-%m-%dT23:59:59+08:00")
        prev_date_str = (target - timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        since = (target - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+08:00")
        until = target.strftime("%Y-%m-%dT23:59:59+08:00")
        prev_date_str = (target - timedelta(days=1)).strftime("%Y-%m-%d")

    print("=== standup-prep.py · Standup 自动生成器 ===")
    print(f"日期: {date_str}")
    print(f"模式: {'周报 (7 天)' if args.week else '日 standup (24h)'}")
    print(f"时区: Asia/Shanghai")
    print()

    # 数据收集
    commits = [] if args.no_git else run_git_log(since, until)
    rfcs = parse_active_rfcs()
    debt = parse_debt()
    lessons = list_recent_lessons(3)
    print(f"  · git log: {len(commits)} commits")
    print(f"  · 活跃 RFC: {len(rfcs)} 个")
    print(f"  · debt: P0={len(debt['P0'])} P1={len(debt['P1'])} P2={len(debt['P2'])}")
    print(f"  · lessons: {len(lessons)} 个")
    print()

    # 渲染
    content = render_standup(date_str, commits, rfcs, debt, lessons,
                              is_week=args.week, prev_date_str=prev_date_str)

    if args.stdout:
        print(content)
        return 0

    # 写入文件
    STANDUP_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"standup-{date_str}.md" if not args.week else f"week-{date_str}.md"
    out_path = STANDUP_DIR / filename

    if out_path.exists() and not args.force:
        print(f"⏭️  {out_path.relative_to(REPO_ROOT)} 已存在 (用 --force 覆盖)")
        print()
        print("预览前 60 行:")
        print("\n".join(content.split("\n")[:60]))
        return 0

    out_path.write_text(content, encoding="utf-8")
    print(f"✅ 已生成: {out_path.relative_to(REPO_ROOT)} ({len(content)} 字符)")
    print(f"   模板: docs/process/standup-template.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
