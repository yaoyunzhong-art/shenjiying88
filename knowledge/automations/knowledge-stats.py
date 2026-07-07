#!/usr/bin/env python3
"""
knowledge-stats.py · 知识库统计脚本 (Pulse-65)

目标: 统计 knowledge/ 7 个子库的文件数 / 主题分布 / 增长趋势
      输出到 stdout + (可选) 写入 docs/knowledge-stats.md

使用:
  python3 scripts/knowledge-stats.py
  python3 scripts/knowledge-stats.py --write docs/knowledge-stats.md
  python3 scripts/knowledge-stats.py --json
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = REPO_ROOT / "knowledge"

# 7 个子库 (按 INDEX.md 顺序)
SUBDIRS = [
    "lessons-learned",
    "patterns",
    "anti-patterns",
    "expert-insights",
    "decision-records",
    "best-practices",
    "automations",
]


def count_files(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for f in path.iterdir() if f.is_file() and not f.name.startswith("."))


def total_lines(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for f in path.iterdir():
        if f.is_file() and f.suffix in (".md", ".py", ".sh", ".ts"):
            try:
                total += sum(1 for _ in f.open(encoding="utf-8", errors="ignore"))
            except Exception:
                pass
    return total


def main() -> int:
    parser = argparse.ArgumentParser(description="知识库统计")
    parser.add_argument("--write", type=str, help="写入指定 markdown 文件")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    args = parser.parse_args()

    if not KNOWLEDGE.exists():
        print(f"错误: 知识库目录不存在: {KNOWLEDGE}", file=sys.stderr)
        return 1

    stats = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "subdirs": {},
        "total_files": 0,
        "total_lines": 0,
    }

    rows = []
    for sub in SUBDIRS:
        path = KNOWLEDGE / sub
        files = count_files(path)
        lines = total_lines(path)
        stats["subdirs"][sub] = {"files": files, "lines": lines}
        stats["total_files"] += files
        stats["total_lines"] += lines
        rows.append((sub, files, lines))

    if args.json:
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        return 0

    # Markdown 输出
    md = f"""# 知识库统计 (knowledge-stats.md)

> 生成: {stats['generated_at']}
> 路径: `knowledge/`

---

## 📊 总览

| 指标 | 值 |
|---|---|
| 子库数 | {len(SUBDIRS)} |
| 文件总数 | **{stats['total_files']}** |
| 代码行总数 | {stats['total_lines']} |

## 📁 子库分布

| 子库 | 文件数 | 行数 |
|---|---|---|
"""
    for sub, files, lines in rows:
        md += f"| `{sub}/` | {files} | {lines} |\n"

    md += f"""
## 📈 趋势

(待后续 pulse 累积数据后生成)

## 🎯 KPI

- 每周新增 lessons: ≥3 条
- 每月新增 decision-records: ≥1 个
- 每月新增 patterns: ≥1 个
- 每月新增 anti-patterns: ≥1 个
- 每月新增 automations: ≥1 个

---

> 自动生成 by `scripts/knowledge-stats.py`
> 下次运行: 每个 pulse 结束时
"""

    if args.write:
        out = Path(args.write)
        if not out.is_absolute():
            out = REPO_ROOT / out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(md, encoding="utf-8")
        print(f"  + 写入: {out.relative_to(REPO_ROOT)}")
    else:
        print(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
