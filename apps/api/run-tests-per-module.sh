#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")" && pwd)
echo "Per-module runner starting at $(date)"
echo "Testing first 5 modules:"
for mod in "$ROOT"/src/modules/*/; do
  mod_name=$(basename "$mod")
  [ "$mod_name" = "modules" ] && continue
  found=$(find "$mod" -maxdepth 2 -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | head -1)
  [ -z "$found" ] && echo "  ⏭️  $mod_name (no tests)" && continue
  echo -n "  🏃 $mod_name ... "
  cd "$ROOT" && perl -e 'alarm 60; exec @ARGV' npx vitest run --reporter=verbose "$mod/" 2>&1 | tail -3
  echo "  Done: $?"
done
echo "Finished at $(date)"
