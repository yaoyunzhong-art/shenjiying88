#!/usr/bin/env python3

import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
TZ = ZoneInfo("Asia/Shanghai")


def main() -> int:
    target_date = datetime.now(TZ).strftime("%Y-%m-%d")
    cmd = [
        sys.executable,
        str(REPO_ROOT / "scripts" / "standup-prep.py"),
        "--date",
        target_date,
        "--force",
    ]
    result = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
    if result.stdout:
      print(result.stdout.strip())
    if result.stderr:
      print(result.stderr.strip(), file=sys.stderr)
    if result.returncode == 0:
        print(f"standup_target=docs/standup/standup-{target_date}.md")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
