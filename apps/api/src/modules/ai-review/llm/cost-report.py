#!/usr/bin/env python3

from pathlib import Path

LLM_DIR = Path(__file__).resolve().parent


def main() -> int:
    tracked_files = sorted(path.name for path in LLM_DIR.glob("*.ts"))

    print("# LLM 成本报告")
    print()
    print("## 当前状态")
    print("- 当前仓库未发现独立的夜间成本快照持久化文件")
    print("- 该报告用于夜间巡检阶段提供显式占位，避免 cost report 脚本缺失导致整段空转")
    print()
    print("## 已发现的 LLM 相关文件")
    for filename in tracked_files:
        print(f"- {filename}")
    print()
    print("## 下一步")
    print("- 若后续接入真实 token/cost telemetry，再把本脚本升级为聚合最近 24h 成本明细")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
