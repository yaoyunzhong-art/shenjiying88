#!/usr/bin/env python3

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Asia/Shanghai")


def main() -> int:
    date_str = datetime.now(TZ).strftime("%Y-%m-%d %H:%M CST")
    health_reports = sorted((REPO_ROOT / "docs" / "monitoring").glob("automation-health-*.md"))

    print(f"# Champion 决策建议 · {date_str}")
    print()
    print("## 建议优先级")
    print("- P0: 自动化健康报告若存在阻塞项，先修自动化，不再默认后台有效工作")
    print("- P1: 基础开发11 优先沿当前真实闭环推进，不切新专题")
    print("- P2: 前端页面一律优先接真实 API，再决定是否保留 mock fallback")
    print()
    print("## 当前决策")
    print("- 决策 1: 以 health report + handoff + git log 作为后台静默工作的验收证据")
    print("- 决策 2: 若 morning/afternoon 脚本仍命中过期任务标记，禁止自动提交")
    if health_reports:
        print(f"- 决策 3: 最近健康报告 {health_reports[-1].name} 可作为值班证据")
    else:
        print("- 决策 3: 当前尚无健康报告落盘，需先跑基础开发11健康检查")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
