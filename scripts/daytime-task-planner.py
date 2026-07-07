#!/usr/bin/env python3

import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Asia/Shanghai")


def run_git(args: list[str]) -> list[str]:
    result = subprocess.run(["git", *args], cwd=REPO_ROOT, capture_output=True, text=True)
    if result.returncode != 0 or not result.stdout.strip():
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    target_date = sys.argv[1] if len(sys.argv) > 1 else datetime.now(TZ).strftime("%Y-%m-%d")
    changed_files = run_git(["diff", "--name-only", "HEAD~3..HEAD"])

    print()
    print("## 白天任务计划")
    print(f"- 日期: {target_date}")
    print("- 主线 1: 基础开发11 当前真实闭环继续推进")
    print("- 主线 2: 先看 health report，再决定是否允许后台脚本继续自动运行")
    print("- 主线 3: 前端页面优先接真实 API，失败时才回退 fallback/mock")
    print()
    print("## 昨夜影响范围")
    if changed_files:
        for path in changed_files[:12]:
            print(f"- {path}")
    else:
        print("- 最近 3 个提交未提取到改动文件")
    print()
    print("## 今日建议")
    print("- 上午优先修阻塞，不新开专题")
    print("- 下午优先补回归与读面，不做大规模重构")
    print("- 收尾前必须检查 git status 与 handoff 是否完整")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
