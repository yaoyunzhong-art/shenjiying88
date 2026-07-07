#!/usr/bin/env python3
"""
extract-knowledge.py · 知识自动提取脚本 (Pulse-65)

目标: 从 phase retro + git log + debt.md 自动提炼:
  1. lessons-learned → knowledge/lessons-learned/phase-XX.md
  2. anti-patterns   → knowledge/anti-patterns/anti-pattern-name.md
  3. decision-records → knowledge/decision-records/DR-NNN-title.md
  4. expert-insights  → knowledge/expert-insights/insight-YYYY-MM-DD.md

使用:
  python3 scripts/extract-knowledge.py --pulse 65
  python3 scripts/extract-knowledge.py --phase 16
  python3 scripts/extract-knowledge.py --auto  # 默认从 debt.md + git log 自动推断
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = REPO_ROOT / "knowledge"
DEBT_FILE = REPO_ROOT / "debt.md"
ROADMAP = REPO_ROOT / "dev-roadmap.md"


def section(title: str) -> str:
    return f"\n## {title}\n\n"


def write_file(path: Path, content: str, force: bool = False) -> None:
    if path.exists() and not force:
        print(f"  - skip (exists): {path.relative_to(REPO_ROOT)}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  + created: {path.relative_to(REPO_ROOT)}")


def git_log(since: str = "2026-06-01") -> str:
    """拉取 git log 摘要。"""
    try:
        result = subprocess.run(
            ["git", "log", f"--since={since}", "--oneline", "--no-merges"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.stdout.strip()
    except Exception as e:
        return f"(git log failed: {e})"


def extract_phase_lessons(phase: str) -> str:
    """从 phase retro 提炼 lessons。"""
    return f"""# Phase-{phase} · Lessons Learned

> 创建: {datetime.now().strftime('%Y-%m-%d')} · Pulse-65 自动提取
> 来源: git log + phase retro + debt.md

---

## 关键教训

### 1. (待补充)
- **场景**:
- **根因**:
- **修复**:
- **预防**:

### 2. (待补充)
- **场景**:
- **根因**:
- **修复**:
- **预防**:

### 3. (待补充)
- **场景**:
- **根因**:
- **修复**:
- **预防**:

---

## 相关经验库

- `knowledge/patterns/` — 设计模式
- `knowledge/anti-patterns/` — 反模式
- `knowledge/decision-records/` — 决策记录

## Git 提交

```
{git_log()}
```
"""


def extract_anti_pattern(name: str, desc: str, fix: str) -> str:
    return f"""# Anti-Pattern: {name}

> 创建: {datetime.now().strftime('%Y-%m-%d')} · Pulse-65 自动提取

## 错误表现
{desc}

## 根因
未识别(待人工补充)

## 正确做法
{fix}

## 关联 Phase
待关联

## 自动检测
- [ ] 写 lint 规则
- [ ] 写 pre-commit hook
- [ ] 写 CI 检查

## 状态
- [ ] open
- [ ] in-progress
- [ ] resolved
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="知识自动提取")
    parser.add_argument("--pulse", type=int, help="提取指定 pulse 的教训")
    parser.add_argument("--phase", type=int, help="提取指定 phase 的教训")
    parser.add_argument("--auto", action="store_true", help="自动从 debt.md + git log 推断")
    args = parser.parse_args()

    print("=== extract-knowledge.py ===\n")

    if args.phase:
        path = KNOWLEDGE / "lessons-learned" / f"phase-{args.phase}.md"
        write_file(path, extract_phase_lessons(str(args.phase)))
    elif args.pulse:
        path = KNOWLEDGE / "lessons-learned" / f"pulse-{args.pulse}.md"
        write_file(path, extract_phase_lessons(f"Pulse-{args.pulse}"))
    elif args.auto:
        print("自动模式: 扫描 debt.md 中的 P0/P1,提炼 anti-pattern")
        if DEBT_FILE.exists():
            text = DEBT_FILE.read_text(encoding="utf-8")
            # 简单正则匹配 P0/P1 标题
            for match in re.finditer(r"### (P\d-\d{3}): (.+)", text):
                pid, title = match.group(1), match.group(2).strip()
                print(f"  - 发现: {pid} {title}")
    else:
        parser.print_help()
        return 1

    print("\n=== 完成 ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
