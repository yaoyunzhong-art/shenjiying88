#!/usr/bin/env python3

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = REPO_ROOT / "knowledge" / "lessons-learned"


def main() -> int:
    lessons = sorted(LESSONS_DIR.glob("*.md"), key=lambda path: path.stat().st_mtime, reverse=True)[:5]

    print("# Foundation11 Lessons 应用建议")
    print()
    if not lessons:
        print("- 当前无 lessons-learned 文件，跳过自动应用")
        return 0

    print("## 最近 lessons")
    for lesson in lessons:
        print(f"- {lesson.name}")
    print()
    print("## 自动应用策略")
    print("- 将最近 lessons 作为次日 standup 与 daytime task planner 的输入")
    print("- 若 lessons 与当前基础开发11主线无关，仅记录不自动改代码")
    print("- 若 lessons 指向测试缺口，优先补最小专项回归")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
