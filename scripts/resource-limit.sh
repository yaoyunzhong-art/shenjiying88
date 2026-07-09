#!/bin/bash
# Resource limit script - runs once to cap node CPU
# DO NOT KILL any processes

echo "=== System ==="
echo "CPU: $(sysctl -n hw.ncpu) cores"
echo "RAM: $(sysctl -n hw.memsize | awk '{print $0/1073741824 " GB"}')"

echo "=== Top CPU consumers ==="
ps axo pid,%cpu,comm | sort -rnk2 | head -8

echo "=== Action ==="
# Find node processes using >20% CPU
ps axo pid,%cpu,comm | grep node | while read pid cpu comm; do
  if [ "${cpu%.*}" -gt 20 ] 2>/dev/null; then
    # Renice to lowest priority instead of killing
    renice -n 20 -p "$pid" 2>/dev/null
    echo "Reniced PID=$pid ($comm) cpu=$cpu% -> nice=20"
  fi
done

echo "=== Done ==="
