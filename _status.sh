#!/bin/bash
echo "=== TIME ==="
date '+%H:%M %Z'
echo "=== HEAD ==="
git log --oneline -1
echo "=== TODAY COMMITS ==="
git log --since="2026-07-10T00:00:00+08:00" --oneline | wc -l
echo "=== WORKDIR ==="
git status --short | wc -l
echo "=== NODE PROCS ==="
ps aux | grep -c '[n]ode'
echo "=== VITEST PROCS ==="
ps aux | grep -c '[v]itest'
echo "=== DONE ==="
