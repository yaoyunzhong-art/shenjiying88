#!/usr/bin/env python3
"""
rate-experts.py - 统计专家评级分布

基于 experts/E*.md 档案中的"反馈日志"和"投票记录"段统计过去 30 天的活动。

Usage: python3 scripts/rate-experts.py
"""
import re
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).parent.parent
EXPERTS_DIR = ROOT / "experts"

# 30 天窗口
WINDOW_DAYS = 30
NOW = datetime(2026, 6, 25)
CUTOFF = NOW - timedelta(days=WINDOW_DAYS)


def parse_expert_file(path: Path) -> dict:
    """解析单个专家档案"""
    content = path.read_text(encoding="utf-8")

    # 提取编号
    eid_match = re.search(r"\*\*编号\*\*:\s*(\w+)", content)
    eid = eid_match.group(1) if eid_match else "?"

    # 提取姓名
    name_match = re.search(r"\*\*姓名\*\*:\s*(\S+)", content)
    name = name_match.group(1) if name_match else "?"

    # 提取当前级别 (默认 Observer)
    level_match = re.search(r"级别.*?:\s*(\w+)", content)
    level = level_match.group(1) if level_match else "Observer"

    # 统计反馈日志条目
    feedback_lines = re.findall(r"\| (2026-\d{2}-\d{2}) \|", content)
    feedback_count = sum(1 for d in feedback_lines if datetime.fromisoformat(d) >= CUTOFF)

    # 统计投票记录
    vote_lines = re.findall(r"\| R\d+ \|", content)
    vote_count = len(vote_lines)

    return {
        "eid": eid,
        "name": name,
        "level": level,
        "feedback_count": feedback_count,
        "vote_count": vote_count,
        "filename": path.name,
    }


def main():
    if not EXPERTS_DIR.exists():
        print(f"✗ {EXPERTS_DIR} 不存在")
        return

    expert_files = sorted(EXPERTS_DIR.glob("E*.md"))
    if not expert_files:
        print(f"✗ {EXPERTS_DIR} 中没有 E*.md 文件")
        return

    print(f"=== 40 人专家团评级分布 (V5.1) ===")
    print(f"统计窗口: {WINDOW_DAYS} 天 ({CUTOFF.date()} ~ {NOW.date()})\n")

    stats = []
    for path in expert_files:
        stats.append(parse_expert_file(path))

    # 按级别分组
    by_level = {}
    for s in stats:
        by_level.setdefault(s["level"], []).append(s)

    # 5 级顺序输出
    level_order = ["Champion", "Owner", "Approver", "Reviewer", "Observer"]
    for level in level_order:
        members = by_level.get(level, [])
        print(f"  {level} ({len(members)} 人)")
        for m in members:
            print(f"    - {m['eid']} {m['name']:6s} | 反馈 {m['feedback_count']:2d} 条 | 投票 {m['vote_count']:2d} 次")

    # 升级建议
    print("\n=== 升级建议 ===")
    upgrade_candidates = []
    for s in stats:
        if s["level"] == "Observer" and s["feedback_count"] >= 7:
            upgrade_candidates.append(f"{s['eid']} {s['name']} → Reviewer (反馈 {s['feedback_count']} 条 ≥7)")
        elif s["level"] == "Reviewer" and s["vote_count"] >= 10:
            upgrade_candidates.append(f"{s['eid']} {s['name']} → Approver (投票 {s['vote_count']} 次 ≥10)")

    if upgrade_candidates:
        for c in upgrade_candidates:
            print(f"  ⬆ {c}")
    else:
        print("  (暂无符合升级条件的专家)")

    # 总结
    print(f"\n=== 总结 ===")
    print(f"总人数: {len(stats)}")
    for level in level_order:
        print(f"  {level}: {len(by_level.get(level, []))}")


if __name__ == "__main__":
    main()