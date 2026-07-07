#!/usr/bin/env python3
"""
extract-knowledge.py · 知识自动提取脚本 (Pulse-65 增强版)

目标: 从 phase retro + git log + debt.md + diff 自动提炼:
  1. lessons-learned → knowledge/lessons-learned/phase-XX.md / pulse-XX.md
  2. anti-patterns   → knowledge/anti-patterns/anti-pattern-name.md
  3. decision-records → knowledge/decision-records/DR-NNN-title.md
  4. expert-insights  → knowledge/expert-insights/insight-YYYY-MM-DD.md

使用:
  python3 scripts/extract-knowledge.py --pulse 65
  python3 scripts/extract-knowledge.py --phase 16
  python3 scripts/extract-knowledge.py --auto            # 自动从 debt.md + git log 推断
  python3 scripts/extract-knowledge.py --diff HEAD~1     # 从 diff 提取 anti-pattern 候选
  python3 scripts/extract-knowledge.py --lint             # 触发 lint-knowledge 子命令
  python3 scripts/extract-knowledge.py --dry-run --auto   # 只看不写

特性 (Pulse-65 增强):
  - 自动从 git log 提取 phase commit 信息 (基于 commit message prefix)
  - 自动从 retro 文档提取 lessons (解析 markdown ## 章节)
  - 自动从 diff 提取 anti-pattern 候选 (识别 TODO/FIXME/console.log/exit hack)
  - dry-run 模式 (只打印, 不写文件)
  - 集成 lint-knowledge 子命令
  - 幂等: 已存在的文件不覆盖
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = REPO_ROOT / "knowledge"
DEBT_FILE = REPO_ROOT / "debt.md"
ROADMAP = REPO_ROOT / "dev-roadmap.md"

# 7 个子库
SUBDIRS = [
    "lessons-learned",
    "patterns",
    "anti-patterns",
    "expert-insights",
    "decision-records",
    "best-practices",
    "automations",
]

# ---------- 工具函数 ----------

def section(title: str) -> str:
    return f"\n## {title}\n\n"


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def write_file(path: Path, content: str, force: bool = False, dry_run: bool = False) -> bool:
    """写入文件, 幂等 + dry-run 支持。返回是否实际写入。"""
    rel = path.relative_to(REPO_ROOT)
    if path.exists() and not force:
        print(f"  - skip (exists): {rel}")
        return False
    if dry_run:
        print(f"  · would create: {rel} ({len(content)} bytes)")
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  + created: {rel}")
    return True


def run_git(args: list[str], cwd: Path = REPO_ROOT) -> str:
    """运行 git 命令, 返回 stdout。"""
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=15,
        )
        return result.stdout.strip()
    except Exception as e:
        return f"(git {args[0]} failed: {e})"


# ---------- Git 解析 ----------

def git_log(since: str = "2026-06-01", until: str = None, no_merges: bool = True) -> list[dict]:
    """拉取 git log, 返回结构化 list。"""
    args = ["log", f"--since={since}"]
    if until:
        args.append(f"--until={until}")
    if no_merges:
        args.append("--no-merges")
    args.append("--pretty=format:%H|%h|%an|%ae|%ad|%s")
    raw = run_git(args)
    if not raw or raw.startswith("(git"):
        return []
    commits = []
    for line in raw.split("\n"):
        if "|" not in line:
            continue
        parts = line.split("|", 5)
        if len(parts) != 6:
            continue
        sha, short_sha, author, email, date, subject = parts
        commits.append({
            "sha": sha,
            "short_sha": short_sha,
            "author": author,
            "email": email,
            "date": date,
            "subject": subject.strip(),
        })
    return commits


PHASE_RE = re.compile(r"\b(phase|pulse)[\s-]*(\d{1,3})\b", re.IGNORECASE)
DR_RE = re.compile(r"\bDR[\s-]*(\d{3})\b", re.IGNORECASE)
P_RE = re.compile(r"\bP\d-\d{3}\b")


def extract_phase_commits(commits: list[dict]) -> dict[str, list[dict]]:
    """根据 commit message 中的 phase/pulse 标识分组。"""
    grouped: dict[str, list[dict]] = {}
    for c in commits:
        # 优先 phase, 其次 pulse
        m = PHASE_RE.search(c["subject"])
        if not m:
            continue
        kind, num = m.group(1).lower(), m.group(2)
        key = f"{kind}-{num}"
        grouped.setdefault(key, []).append(c)
    return grouped


def parse_diff_for_antipatterns(diff: str) -> list[dict]:
    """从 diff 中识别常见 anti-pattern 候选。"""
    candidates = []
    patterns = [
        {
            "name": "console-log-leak",
            "regex": re.compile(r"^\+\s*console\.(log|debug|info)\(", re.MULTILINE),
            "desc": "提交中含 console.log/debug/info, 生产代码应移除",
            "fix": "使用 NestJS Logger (this.logger.debug) 或完全移除",
        },
        {
            "name": "todo-unresolved",
            "regex": re.compile(r"^\+.*\b(TODO|FIXME|XXX|HACK)\b", re.MULTILINE),
            "desc": "代码含未解决的 TODO/FIXME 标记",
            "fix": "创建 issue 跟踪并立即修复, 或在 PR 描述中明确延期理由",
        },
        {
            "name": "process-exit-hack",
            "regex": re.compile(r"^\+.*process\.exit\(", re.MULTILINE),
            "desc": "提交含 process.exit 调用, 易掩盖 test timeout / 资源泄漏",
            "fix": "诊断 root cause (active handle leak / assertion fail), 不用 exit hack",
        },
        {
            "name": "any-type-abuse",
            "regex": re.compile(r"^\+.*:\s*any\b", re.MULTILINE),
            "desc": "新增 any 类型, 破坏 TypeScript 类型安全",
            "fix": "用 unknown + 类型守卫, 或导入正确的 DTO / Interface",
        },
        {
            "name": "sensitive-log",
            "regex": re.compile(r"^\+.*(?:password|token|secret|api[_-]?key).*(?:console|logger)\.", re.IGNORECASE | re.MULTILINE),
            "desc": "日志中可能泄露敏感字段 (password / token / apiKey)",
            "fix": "用脱敏工具 (mask) 或不输出敏感字段",
        },
        {
            "name": "mock-fetch-leak",
            "regex": re.compile(r"^\+.*(?:jest\.fn|vi\.fn).*global\.fetch", re.MULTILINE),
            "desc": "测试中直接 mock global.fetch, 易污染其他测试",
            "fix": "用 undici MockAgent 或局部 fetch mock, 加 afterEach 清理",
        },
    ]
    for p in patterns:
        matches = p["regex"].findall(diff)
        if matches:
            candidates.append({
                "name": p["name"],
                "count": len(matches),
                "description": p["desc"],
                "fix": p["fix"],
            })
    return candidates


# ---------- Retro 解析 ----------

def parse_lessons_from_retro(retro_path: Path) -> list[dict]:
    """从 retro markdown 提取 Lesson N 条目。"""
    if not retro_path.exists():
        return []
    text = retro_path.read_text(encoding="utf-8")
    lessons = []
    # 匹配 ## Lesson N: 标题 或 ## N. 标题
    pattern = re.compile(r"^##\s+Lesson\s+(\d+)[:：]\s*(.+?)$", re.MULTILINE)
    for m in pattern.finditer(text):
        num = m.group(1)
        title = m.group(2).strip()
        # 抓取 4 个字段
        body = text[m.end():]
        next_lesson = re.search(r"^##\s+Lesson\s+\d+", body, re.MULTILINE)
        block = body[:next_lesson.start()] if next_lesson else body
        def grab(field: str) -> str:
            m2 = re.search(rf"-\s*\*\*{field}\*\*[:：]\s*(.+?)(?:\n|$)", block)
            return m2.group(1).strip() if m2 else "(待补充)"
        lessons.append({
            "num": num,
            "title": title,
            "background": grab("背景"),
            "impact": grab("影响"),
            "improvement": grab("改进"),
        })
    return lessons


# ---------- 模板 ----------

def extract_phase_lessons(phase: str, commits: list[dict] = None, lessons: list[dict] = None) -> str:
    """生成 phase lessons markdown。"""
    git_log_text = "(无 git log)"
    if commits:
        git_log_text = "\n".join(
            f"- {c['short_sha']} {c['date'][:10]} {c['subject']}"
            for c in commits[:30]
        )

    lessons_text = ""
    if lessons:
        lessons_text = "\n\n".join(
            f"### Lesson {l['num']}: {l['title']}\n"
            f"- **背景**: {l['background']}\n"
            f"- **影响**: {l['impact']}\n"
            f"- **改进**: {l['improvement']}\n"
            for l in lessons
        )
    else:
        lessons_text = """
### Lesson 1: (待补充)
- **背景**:
- **影响**:
- **改进**:
"""

    return f"""# Phase-{phase} · Lessons Learned

> 创建: {now_str()} · Pulse-65 自动提取 (增强版)
> 来源: git log + phase retro + debt.md

---

## 关键教训

{lessons_text}

---

## 相关经验库

- `knowledge/patterns/` — 设计模式
- `knowledge/anti-patterns/` — 反模式
- `knowledge/decision-records/` — 决策记录

## Git 提交

```
{git_log_text}
```
"""


def extract_anti_pattern(name: str, desc: str, fix: str, evidence: str = "") -> str:
    return f"""# Anti-Pattern: {name}

> 创建: {now_str()} · Pulse-65 自动提取 (增强版)
> 来源: diff 扫描 / 人工补充

## 错误表现
{desc}

## 证据
{evidence or "(待补充: 提供具体代码片段或 PR 链接)"}

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


def extract_decision_record(num: str, title: str, context: str = "") -> str:
    return f"""# Decision Record · DR-{num} {title}

> 创建: {now_str()} · Pulse-65 自动提取
> 决策者: (待补充)
> 状态: proposed

## 背景
{context or "(待补充: 为什么需要这个决策?)"}

## 决策
(待补充: 最终决策)

## 理由
1. (待补充)

## 后果
- (待补充: 短期)
- (待补充: 长期)

## 风险与缓解
| 风险 | 缓解 |
|---|---|
| (待补充) | (待补充) |

## 关联文档
- [dev-roadmap.md](../../dev-roadmap.md)
- [intelligence-engine.md](../../intelligence-engine.md)

---

> 由 extract-knowledge.py 自动生成, 需要人工 review 后合并
"""


def extract_expert_insight(date_str: str, summary: str = "") -> str:
    return f"""# Expert Insight · {date_str}

> 创建: {now_str()} · Pulse-65 自动提取
> 来源: standup / Weekly Memo

## 核心洞察
{summary or "(待补充)"}

## 业务关切
- (待补充)

## 技术影响
- (待补充)

## 处理方案
1. (待补充)

## 关联专家
- (待补充)

## 关联 Phase
- (待补充)
"""


# ---------- 子命令 ----------

def cmd_phase(args) -> int:
    """--phase N: 提取指定 phase 的 lessons。"""
    phase = str(args.phase)
    retro_path = REPO_ROOT / "docs" / f"phase-{phase}-retro.md"
    lessons = parse_lessons_from_retro(retro_path) if retro_path.exists() else []
    if not lessons:
        # 尝试其它位置
        for alt in [REPO_ROOT / f"phase-{phase}-retro.md",
                    REPO_ROOT / "docs" / "process" / f"phase-{phase}-retro.md"]:
            if alt.exists():
                lessons = parse_lessons_from_retro(alt)
                break

    # 拉取该 phase 相关的 commits
    commits = git_log()
    grouped = extract_phase_commits(commits)
    phase_commits = grouped.get(f"phase-{phase}", [])

    path = KNOWLEDGE / "lessons-learned" / f"phase-{phase}.md"
    content = extract_phase_lessons(phase, phase_commits, lessons)
    write_file(path, content, force=args.force, dry_run=args.dry_run)
    return 0


def cmd_pulse(args) -> int:
    """--pulse N: 提取指定 pulse 的 lessons。"""
    pulse = str(args.pulse)
    commits = git_log()
    grouped = extract_phase_commits(commits)
    pulse_commits = grouped.get(f"pulse-{pulse}", [])
    path = KNOWLEDGE / "lessons-learned" / f"pulse-{pulse}.md"
    content = extract_phase_lessons(f"Pulse-{pulse}", pulse_commits)
    write_file(path, content, force=args.force, dry_run=args.dry_run)
    return 0


def cmd_auto(args) -> int:
    """--auto: 自动从 debt.md + git log 推断。"""
    print("自动模式: 扫描 debt.md 中的 P0/P1, 提炼 anti-pattern")

    findings = []

    # 1. debt.md 扫描
    if DEBT_FILE.exists():
        text = DEBT_FILE.read_text(encoding="utf-8")
        for m in re.finditer(r"### (P\d-\d{3}): (.+)", text):
            pid, title = m.group(1), m.group(2).strip()
            print(f"  - 发现: {pid} {title}")
            findings.append({"id": pid, "title": title, "source": "debt.md"})

    # 2. git log 聚合
    commits = git_log()
    grouped = extract_phase_commits(commits)
    print(f"\n  - git log: {len(commits)} commits, {len(grouped)} phases/pulses")
    for key in sorted(grouped.keys()):
        n = len(grouped[key])
        if n >= 5:
            print(f"    · {key}: {n} commits")

    # 3. 写入 anti-pattern 候选 (仅 dry-run 模式以外)
    if findings and not args.dry_run:
        for f in findings:
            slug = re.sub(r"[^a-z0-9-]", "-", f["title"].lower()).strip("-")[:40]
            path = KNOWLEDGE / "anti-patterns" / f"{f['id'].lower()}-{slug}.md"
            content = extract_anti_pattern(
                name=f["title"],
                desc=f"来源 debt.md ({f['id']})",
                fix="(待补充, 关联 debt.md 中的缓解措施)",
            )
            write_file(path, content, force=args.force, dry_run=args.dry_run)

    return 0


def cmd_diff(args) -> int:
    """--diff REF: 从 diff 提取 anti-pattern 候选。"""
    diff_ref = args.diff
    print(f"diff 模式: 从 `{diff_ref}` 提取 anti-pattern")

    raw = run_git(["diff", diff_ref])
    if not raw or raw.startswith("(git"):
        print(f"  ✗ 无法获取 diff ({raw})")
        return 1

    candidates = parse_diff_for_antipatterns(raw)
    if not candidates:
        print("  ✓ 未发现 anti-pattern 候选")
        return 0

    print(f"  发现 {len(candidates)} 类候选:")
    for c in candidates:
        print(f"    · {c['name']} ({c['count']} 处)")
        evidence = f"在 diff {diff_ref} 中出现 {c['count']} 次"
        path = KNOWLEDGE / "anti-patterns" / f"{c['name']}.md"
        content = extract_anti_pattern(c["name"], c["description"], c["fix"], evidence)
        write_file(path, content, force=args.force, dry_run=args.dry_run)

    return 0


def cmd_lint(args) -> int:
    """--lint: 触发 lint-knowledge 子命令 (兼容 extract-knowledge 子命令风格)。"""
    print("=== lint-knowledge (via extract-knowledge.py --lint) ===\n")
    # 委托给 scripts/lint-knowledge.py
    lint_script = REPO_ROOT / "scripts" / "lint-knowledge.py"
    if not lint_script.exists():
        print(f"  ✗ 未找到 {lint_script}, 请确保 scripts/lint-knowledge.py 已创建")
        return 1
    cmd = [sys.executable, str(lint_script)]
    if args.fix:
        cmd.append("--fix")
    return subprocess.call(cmd)


# ---------- main ----------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="知识自动提取 (Pulse-65 增强版)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--pulse", type=int, help="提取指定 pulse 的教训")
    parser.add_argument("--phase", type=int, help="提取指定 phase 的教训")
    parser.add_argument("--auto", action="store_true", help="自动从 debt.md + git log 推断")
    parser.add_argument("--diff", type=str, metavar="REF", help="从 git diff 提取 anti-pattern (例: HEAD~1)")
    parser.add_argument("--lint", action="store_true", help="运行 lint-knowledge (知识库格式检查)")
    parser.add_argument("--dry-run", action="store_true", help="只打印, 不写文件")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的文件")
    parser.add_argument("--fix", action="store_true", help="(与 --lint 配合) 自动修复")
    args = parser.parse_args()

    print("=== extract-knowledge.py (Pulse-65 增强版) ===\n")

    if args.lint:
        return cmd_lint(args)
    elif args.diff:
        return cmd_diff(args)
    elif args.phase:
        return cmd_phase(args)
    elif args.pulse:
        return cmd_pulse(args)
    elif args.auto:
        return cmd_auto(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())