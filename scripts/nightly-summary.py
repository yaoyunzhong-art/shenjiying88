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
    log_dir = REPO_ROOT / "docs" / "monitoring" / "nightly" / target_date
    health_report = log_dir / "00-foundation11-health.md"
    commits = run_git(["log", "--since=midnight", "--no-merges", "--pretty=format:%h %ad %s", "--date=iso"])

    print(f"# Foundation11 夜间交接 · {target_date}")
    print()
    print(f"> 生成时间: {datetime.now(TZ).strftime('%Y-%m-%d %H:%M CST')}")
    print("> 状态: completed")
    print()
    print("## 自动化健康")
    if health_report.exists():
        print(f"- 健康报告: {health_report.relative_to(REPO_ROOT)}")
    else:
        print("- 健康报告缺失")
    print()
    print("## 夜间提交")
    if commits:
        for line in commits[:10]:
            print(f"- {line}")
    else:
        print("- 今日凌晨至今无新增提交")
    print()
    print("## 夜间日志")
    if log_dir.exists():
        for log_file in sorted(log_dir.iterdir())[:20]:
            print(f"- {log_file.name}")
    else:
        print("- 日志目录缺失")
    print()
    print("## 结论")
    print("- 以 handoff、health report、git log 为静默后台工作的三件套证据")
    print("- 若三件套缺任一项，则次日上午先修自动化再谈有效后台推进")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
