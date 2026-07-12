#!/bin/bash
# V15 推进 - 逐模块验证P0-001 forceExit修复
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api
MODULES="foundation cross-module cashier member inventory finance agent observability tenant lyt"
for mod in $MODULES; do
  echo "[$(date +%H:%M:%S)] Running $mod..."
  start_ts=$(date +%s)
  npx vitest run "src/modules/$mod/" > "/tmp/vitest-$mod.log" 2>&1
  exit_code=$?
  duration=$(( $(date +%s) - start_ts ))
  
  # Parse result from log
  result=$(grep -E "Test Files|Tests " "/tmp/vitest-$mod.log" 2>/dev/null | tail -3)
  echo "  $mod: exit=$exit_code duration=${duration}s $result"
done
echo ""
echo "=== SUMMARY ==="
echo "All 10 modules completed at $(date)"
echo "Check logs in /tmp/vitest-*.log for details"
