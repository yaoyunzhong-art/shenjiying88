#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

TARGET_DATE="${1:-$(TZ='Asia/Shanghai' date '+%Y-%m-%d')}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
SOURCE_DIR="$PROJECT_ROOT/tmp/phase49-seo-geo"
TARGET_DIR="$PROJECT_ROOT/docs/monitoring/nightly/$TARGET_DATE/seo-geo"

if [[ ! -f "$SOURCE_DIR/report.json" ]]; then
  echo "❌ 未找到 Phase-49 SEO/GEO 报告: $SOURCE_DIR/report.json"
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp "$SOURCE_DIR"/report.json "$TARGET_DIR"/
find "$SOURCE_DIR" -maxdepth 1 -type f -name '*.png' -exec cp {} "$TARGET_DIR"/ \;

python3 - "$TARGET_DIR/report.json" "$TARGET_DIR/summary.md" <<'PY'
import json
import os
import sys
from pathlib import Path

report_path = Path(sys.argv[1])
summary_path = Path(sys.argv[2])
report = json.loads(report_path.read_text(encoding="utf-8"))
routes = report.get("routes", [])

def esc(value: str) -> str:
    return value.replace("|", "\\|")

lines = [
    "# Phase-49 SEO/GEO 浏览器证据归档",
    "",
    f"> baseUrl: `{report.get('baseUrl', '')}`",
    f"> generatedAt: `{report.get('generatedAt', '')}`",
    "",
    "| 路径 | 标题 | lang | canonical | console | 截图 |",
    "|---|---|---|---|---:|---|",
]

for route in routes:
    screenshot_name = os.path.basename(route.get("screenshotPath", ""))
    screenshot_link = f"[{screenshot_name}](./{screenshot_name})" if screenshot_name else "-"
    lines.append(
        f"| `{esc(route.get('url', ''))}` | {esc(route.get('title', ''))} | `{esc(route.get('lang', ''))}` | "
        f"`{esc(route.get('canonical', ''))}` | {len(route.get('consoleMessages', []))} | {screenshot_link} |"
    )

summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

python3 - "$PROJECT_ROOT/docs/monitoring/nightly" "$RETENTION_DAYS" <<'PY'
import shutil
import sys
import time
from pathlib import Path

root = Path(sys.argv[1])
retention_days = int(sys.argv[2])
threshold = time.time() - retention_days * 24 * 60 * 60

if root.exists():
    for child in root.iterdir():
        if not child.is_dir() or not child.name.startswith("20"):
            continue
        if child.stat().st_mtime <= threshold:
            seo_geo_dir = child / "seo-geo"
            if seo_geo_dir.exists():
                shutil.rmtree(seo_geo_dir, ignore_errors=True)
PY

echo "✅ Phase-49 SEO/GEO 证据已归档到: $TARGET_DIR"
