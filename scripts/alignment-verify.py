#!/usr/bin/env python3
"""圈梁对齐验证器 - 自动检查118模块的四道箍状态"""
import os, subprocess

PROJECT = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"

ok = total = 0
issues = []

for d in sorted(os.listdir(os.path.join(PROJECT, "apps/api/src/modules"))):
    dp = os.path.join(PROJECT, "apps/api/src/modules", d)
    if not os.path.isdir(dp): continue
    total += 1
    
    has_audit = os.path.exists(os.path.join(PROJECT, f"docs/knowledge/{d}-audit.md"))
    has_prd_summary = os.path.exists(os.path.join(PROJECT, f"docs/knowledge/prd-summary/{d}-audit.md")) or os.path.exists(os.path.join(PROJECT, "docs/knowledge/prd"))
    has_rb = os.path.exists(os.path.join(dp, f"{d}-ringbeam.test.ts"))
    has_test = len([f for f in os.listdir(dp) if f.endswith(('.test.ts','.spec.ts'))]) > 0
    
    if has_audit and has_rb: ok += 1
    else: issues.append(f"{d}: audit={has_audit} rb={has_rb}")

print(f"Total modules: {total}")
print(f"Fully aligned: {ok}/{total} ({ok*100//total}%)")
print(f"Issues: {len(issues)}")
for i in issues[:10]: print(f"  ! {i}")
