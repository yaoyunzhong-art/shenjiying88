#!/usr/bin/env python3
"""
lint-knowledge.py · 知识库格式 / 链接检查脚本 (Phase-19 智能化准备)

目标: 检查 knowledge/ 下所有 .md 文件的:
  1. 文件名格式
     - 顶层: kebab-case.md (例: lessons-learned.md)
     - decision-records/DR-NNN-title.md
     - lessons-learned/phase-XX.md / pulse-XX.md
     - expert-insights/insight-YYYY-MM-DD.md
  2. 必需 frontmatter (创建日期 / 来源 / 状态)
  3. 内部链接有效性 (相对路径引用存在)
  4. 章节顺序一致性 (## TL;DR → ## 内容 → ## 关联)
  5. (可选) --fix 自动修复 frontmatter 缺失

使用:
  python3 scripts/lint-knowledge.py                       # 默认检查所有
  python3 scripts/lint-knowledge.py knowledge/anti-patterns  # 检查指定子目录
  python3 scripts/lint-knowledge.py --fix                  # 自动修复 frontmatter
  python3 scripts/lint-knowledge.py --json                 # 输出 JSON 报告
  python3 scripts/lint-knowledge.py --strict               # 严格模式 (任何 warning 都 fail)

退出码:
  0 - 通过
  1 - 发现 error (默认非严格模式)
  2 - 发现 error (--strict)

关联: TD-003 智能化引擎债务
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = REPO_ROOT / "knowledge"

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

# 文件名格式规则
FILENAME_RULES = {
    "lessons-learned": re.compile(r"^(phase-\d+|pulse-\d+)\.md$"),
    "patterns": re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*\.md$"),
    "anti-patterns": re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*\.md$"),
    "expert-insights": re.compile(r"^insight-\d{4}-\d{2}-\d{2}\.md$"),
    "decision-records": re.compile(r"^DR-\d{3}-[a-z0-9]+(-[a-z0-9]+)*\.md$"),
    "best-practices": re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*\.md$"),
    "automations": re.compile(r"^[A-Za-z0-9_-]+\.(py|sh|ts|md)$"),  # 含脚本
}

# 必需 frontmatter 字段 (knowledge 文档)
REQUIRED_FRONTMATTER = ["创建日期", "来源"]

# 期望的章节顺序 (宽松匹配, 允许中间穿插其它 ## 章节)
# 但 ## 关联 必须在最后
EXPECTED_LAST_SECTIONS = ["关联", "相关", "参考", "关联文档"]

# 内部链接正则: [text](path.md) 或 [text](../foo/bar.md)
LINK_RE = re.compile(r"\[([^\]]+)\]\((?!https?://|#)([^)]+)\)")


def check_filename(subdir: str, name: str) -> tuple[bool, str]:
    """检查文件名格式。返回 (ok, reason)。"""
    rule = FILENAME_RULES.get(subdir)
    if not rule:
        return True, ""
    if rule.match(name):
        return True, ""
    # 给出友好建议
    suggestion = ""
    if subdir == "decision-records":
        suggestion = "应为 DR-NNN-title.md"
    elif subdir == "lessons-learned":
        suggestion = "应为 phase-XX.md 或 pulse-XX.md"
    elif subdir == "expert-insights":
        suggestion = "应为 insight-YYYY-MM-DD.md"
    elif subdir in ("patterns", "anti-patterns", "best-practices"):
        suggestion = "应为 kebab-case.md (例: my-topic.md)"
    elif subdir == "automations":
        suggestion = "应为 script-name.{py,sh,ts} 或 README.md"
    return False, f"文件名 `{name}` 不符合 {subdir}/ 命名规范 ({suggestion})"


def check_frontmatter(text: str) -> list[str]:
    """检查 frontmatter 必需字段。返回缺失字段列表。"""
    missing = []
    # 简单 frontmatter 检测: 必须包含 > 创建: ... 形式 (本仓库约定)
    # 不强制 YAML frontmatter, 而用引用块约定
    for field in REQUIRED_FRONTMATTER:
        pattern = re.compile(rf">\s*{re.escape(field)}\s*[:：]\s*\S", re.MULTILINE)
        if not pattern.search(text):
            missing.append(field)
    return missing


def check_section_order(text: str) -> tuple[bool, str]:
    """检查章节顺序 (## 关联 是否在最后)。"""
    # 提取所有 ## 标题
    headings = re.findall(r"^##\s+(.+?)$", text, re.MULTILINE)
    if not headings:
        return True, ""
    # 找到 ## 关联 (或类似) 的位置
    last_assoc_idx = -1
    for i, h in enumerate(headings):
        for kw in EXPECTED_LAST_SECTIONS:
            if h.strip().startswith(kw):
                last_assoc_idx = i
                break
    if last_assoc_idx == -1:
        return True, ""  # 没有关联章节, 不强制
    if last_assoc_idx != len(headings) - 1:
        return False, f"`## {headings[last_assoc_idx]}` 应在最后 (实际在第 {last_assoc_idx + 1}/{len(headings)} 位)"
    return True, ""


def check_internal_links(text: str, source_path: Path) -> list[str]:
    """检查内部 markdown 链接是否存在。返回损坏的链接列表。"""
    broken = []
    for m in LINK_RE.finditer(text):
        text_label, link = m.group(1), m.group(2).strip()
        # 去掉锚点
        link_path = link.split("#")[0]
        if not link_path:
            continue
        # 解析相对路径
        if link_path.startswith("/"):
            target = REPO_ROOT / link_path.lstrip("/")
        else:
            target = (source_path.parent / link_path).resolve()
        if not target.exists():
            broken.append(f"`[{text_label}]({link})` -> {target.relative_to(REPO_ROOT) if target.is_relative_to(REPO_ROOT) else target}")
    return broken


def auto_fix_frontmatter(path: Path, missing: list[str]) -> bool:
    """自动添加缺失的 frontmatter 字段。返回是否修改。"""
    text = path.read_text(encoding="utf-8")
    # 在第一个 ## 之前插入
    lines = text.split("\n")
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("## ") or line.startswith("# "):
            insert_idx = i
            break
        # 已存在引用块, 找最后一个 > 开头的行后插入
        if line.startswith("> "):
            insert_idx = i + 1

    additions = []
    for field in missing:
        if field == "创建日期":
            additions.append(f"> 创建日期: {datetime.now().strftime('%Y-%m-%d')}")
        elif field == "来源":
            additions.append("> 来源: extract-knowledge.py 自动补全")

    if not additions:
        return False

    new_lines = lines[:insert_idx] + [""] + additions + [""] + lines[insert_idx:]
    path.write_text("\n".join(new_lines), encoding="utf-8")
    return True


def lint_file(path: Path, subdir: str, fix: bool = False) -> dict:
    """对单个文件执行所有 lint 检查。"""
    rel = path.relative_to(REPO_ROOT)
    name = path.name
    issues = []  # (level, message)

    # 1. 文件名
    ok, reason = check_filename(subdir, name)
    if not ok:
        issues.append(("error", f"[filename] {reason}"))

    # 2. frontmatter (markdown 文件才检查)
    if path.suffix == ".md":
        try:
            text = path.read_text(encoding="utf-8")
        except Exception as e:
            issues.append(("error", f"[read] 无法读取: {e}"))
            return {"file": str(rel), "issues": issues, "fixed": False}

        missing = check_frontmatter(text)
        if missing:
            if fix and auto_fix_frontmatter(path, missing):
                issues.append(("warning", f"[frontmatter] 自动补全缺失字段: {', '.join(missing)}"))
                fix_applied = True
            else:
                issues.append(("error", f"[frontmatter] 缺失字段: {', '.join(missing)}"))
                fix_applied = False
        else:
            fix_applied = False

        # 3. 章节顺序
        ok, reason = check_section_order(text)
        if not ok:
            issues.append(("warning", f"[section-order] {reason}"))

        # 4. 内部链接
        broken = check_internal_links(text, path)
        for b in broken:
            issues.append(("error", f"[link] 损坏的内部链接: {b}"))
    else:
        fix_applied = False

    return {
        "file": str(rel),
        "issues": issues,
        "fixed": fix_applied,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="知识库格式与链接检查",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "targets",
        nargs="*",
        help="指定子目录或文件 (默认: knowledge/ 全部)",
    )
    parser.add_argument("--fix", action="store_true", help="自动修复 frontmatter 缺失")
    parser.add_argument("--json", action="store_true", help="输出 JSON 报告")
    parser.add_argument("--strict", action="store_true", help="严格模式 (warning 也算 fail)")
    args = parser.parse_args()

    if not KNOWLEDGE.exists():
        print(f"✗ 知识库目录不存在: {KNOWLEDGE}", file=sys.stderr)
        return 1

    # 决定要 lint 的文件
    if args.targets:
        files: list[tuple[Path, str]] = []
        for t in args.targets:
            p = Path(t)
            if not p.is_absolute():
                p = REPO_ROOT / p
            if p.is_file():
                subdir = p.parent.relative_to(KNOWLEDGE).parts[0] if p.parent != KNOWLEDGE else ""
                files.append((p, subdir))
            elif p.is_dir():
                for sub in SUBDIRS:
                    sub_path = p / sub
                    if sub_path.exists() and sub_path.is_dir():
                        for f in sub_path.glob("*"):
                            if f.is_file():
                                files.append((f, sub))
    else:
        files = []
        for sub in SUBDIRS:
            sub_path = KNOWLEDGE / sub
            if not sub_path.exists():
                continue
            for f in sub_path.iterdir():
                if f.is_file() and not f.name.startswith("."):
                    files.append((f, sub))
        # INDEX.md / intelligence-engine.md 等顶层文件
        for f in KNOWLEDGE.iterdir():
            if f.is_file() and f.suffix == ".md" and not f.name.startswith("."):
                files.append((f, ""))

    if not files:
        print("⚠ 没有找到需要检查的文件", file=sys.stderr)
        return 0

    print(f"=== lint-knowledge.py ===")
    print(f"目标: {len(files)} 个文件\n")

    report = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_files": len(files),
        "errors": 0,
        "warnings": 0,
        "fixed": 0,
        "results": [],
    }

    # 顶层文件 (INDEX / intelligence-engine) 跳过文件名格式检查
    for path, subdir in sorted(files):
        if not subdir:
            # 顶层文件, 只检查链接
            if path.suffix == ".md":
                text = path.read_text(encoding="utf-8")
                broken = check_internal_links(text, path)
                if broken:
                    issues = [("error", f"[link] 损坏的内部链接: {b}") for b in broken]
                else:
                    issues = []
                result = {"file": str(path.relative_to(REPO_ROOT)), "issues": issues, "fixed": False}
            else:
                continue
        else:
            result = lint_file(path, subdir, fix=args.fix)

        for level, _msg in result["issues"]:
            if level == "error":
                report["errors"] += 1
            else:
                report["warnings"] += 1
        if result["fixed"]:
            report["fixed"] += 1

        # 打印
        if result["issues"]:
            print(f"  ✗ {result['file']}")
            for level, msg in result["issues"]:
                icon = "⚠" if level == "warning" else "✗"
                print(f"      {icon} {msg}")
        else:
            print(f"  ✓ {result['file']}")

        report["results"].append(result)

    # 总结
    print(f"\n=== 总结 ===")
    print(f"文件总数: {report['total_files']}")
    print(f"错误数:   {report['errors']}")
    print(f"警告数:   {report['warnings']}")
    if args.fix:
        print(f"已修复:   {report['fixed']}")

    # JSON 输出
    if args.json:
        print("\n--- JSON 报告 ---")
        print(json.dumps(report, ensure_ascii=False, indent=2))

    # 退出码
    if report["errors"] > 0:
        return 1
    if args.strict and report["warnings"] > 0:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())