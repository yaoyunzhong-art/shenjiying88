#!/usr/bin/env python3

import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Asia/Shanghai")


def git_lines(args: list[str]) -> list[str]:
    result = subprocess.run(["git", *args], cwd=REPO_ROOT, capture_output=True, text=True)
    if result.returncode != 0 or not result.stdout.strip():
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    today = datetime.now(TZ)
    since = (today - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+08:00")
    commits = git_lines(["log", f"--since={since}", "--no-merges", "--pretty=format:%h %ad %s", "--date=iso"])
    changed = git_lines(["diff", "--name-only", "HEAD~5..HEAD"])

    print(f"# Foundation11 阶段进度报告 · {today.strftime('%Y-%m-%d')}")
    print()
    print("## 最近提交")
    if commits:
        for line in commits[:12]:
            print(f"- {line}")
    else:
        print("- 过去 24h 无提交")
    print()
    print("## 最近改动文件")
    if changed:
        for path in changed[:20]:
            print(f"- {path}")
    else:
        print("- 最近 5 个提交无可见文件列表")
    print()
    print("## 当前建议")
    print("- 优先续接基础开发11当前主线，不并行开启新专题")
    print("- 对前台代理、活动执行、交易结算链保持最小真实闭环策略")
    print("- 若夜间自动任务无 commit，次日必须优先检查 health report 与 handoff")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
