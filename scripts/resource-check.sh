#!/bin/bash
LOAD=$(sysctl -n vm.loadavg | awk '{print $2}' | tr -d '{},')
CORES=$(sysctl -n hw.ncpu)
LOAD_PCT=$(echo "$LOAD $CORES" | awk '{printf "%d", ($1/$2)*100}')
echo "[$(date)] load=$LOAD cores=$CORES pct=${LOAD_PCT}%"
if [ "$LOAD_PCT" -gt 90 ] 2>/dev/null; then
  ps axo pid,pcpu,comm | grep node | while read pid cpu comm; do
    cpu_int=${cpu%.*}
    [ -z "$cpu_int" ] && cpu_int=0
    [ "$cpu_int" -gt 10 ] 2>/dev/null && renice -n 20 -p "$pid" 2>/dev/null
  done
  echo "reniced >90%"
fi
