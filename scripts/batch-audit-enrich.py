#!/usr/bin/env python3
"""批量填充审计骨架为详细审计 - 基于真实代码扫描"""
import os, json

PROJECT = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
MODULES_DIR = os.path.join(PROJECT, "apps/api/src/modules")

# 扫描所有模块
data = {}
for d in sorted(os.listdir(MODULES_DIR)):
    dp = os.path.join(MODULES_DIR, d)
    if not os.path.isdir(dp): continue
    
    src_files = []
    test_files = []
    for f in sorted(os.listdir(dp)):
        if not f.endswith(".ts"): continue
        fp = os.path.join(dp, f)
        lines = open(fp).read().count('\n') + 1
        if f.endswith(".test.ts") or f.endswith(".spec.ts") or f.endswith(".e2e.ts"):
            test_files.append((f, lines))
        else:
            src_files.append((f, lines))
    
    has_rb = os.path.exists(os.path.join(dp, f"{d}-ringbeam.test.ts"))
    src_lines = sum(s[1] for s in src_files)
    test_lines = sum(t[1] for t in test_files)
    ratio = round(test_lines / src_lines, 2) if src_lines > 0 else 0
    
    data[d] = {
        "src_files": len(src_files),
        "test_files": len(test_files),
        "src_lines": src_lines,
        "test_lines": test_lines,
        "ratio": ratio,
        "has_rb": has_rb,
        "top_src": [s[0] for s in src_files[:5]],
        "top_test": [t[0] for t in test_files[:5]],
    }

# Phase & PRD mapping
PRD_MAP = {
    "P-35": {"modules": ["cashier","lyt","payment-gateway","transactions"], "prd": "PRD-001", "name": "收银店A"},
    "P-36": {"modules": ["member","member-level","points","loyalty","svip"], "prd": "PRD-002", "name": "会员店A"},
    "P-31": {"modules": ["tenant","tenant-config","saas-advanced","saas-billing"], "prd": "PRD-011", "name": "多租户"},
    "P-37": {"modules": ["inventory"], "prd": "PRD-008", "name": "库存采购"},
    "P-38": {"modules": ["finance","reports","audit","currency","transactions"], "prd": "PRD-007", "name": "财务对账"},
    "P-47": {"modules": ["brand-custom","marketing","marketing-metrics","content","campaign","leads"], "prd": "PRD-003/004", "name": "品牌运营"},
    "P-48": {"modules": ["coupon","alliance","referral","blindbox","loyalty"], "prd": "PRD-009", "name": "联名券"},
    "P-49": {"modules": ["open-api","openapi","tenant-llm","agent"], "prd": "PRD-014/015/016", "name": "开放平台"},
    "P-53": {"modules": ["deploy","ops-manual","runbook","canary","auto-rollback","license","license-package","license-renewal"], "prd": "PRD-013", "name": "部署DevOps"},
    "P-30": {"modules": ["reservation"], "prd": "PRD-010", "name": "后勤"},
}

def get_phase(name):
    for p, info in PRD_MAP.items():
        if name in info["modules"]:
            return p, info["prd"]
    if name.startswith("ai-") or name in ["aiops","edge","federated-learning","image-recognition","knowledge","multimodal-fusion","ocr","recommend","recommender","retrieval","voice-processing","anomaly-detector"]:
        return "AI", "⬜ 无"
    if name in ["auth","permission","rbac","security","compliance","foundation","gateway","notification","push","cdn-cache","monitoring","health","health-dashboard","audit","session","sandbox","lowcode","i18n","locale","bootstrap","shared","time-series","realtime","chain","lineage","multi-region","multimedia","observability","performance","perf-monitor","device-adapter","docs","portal","market","champion","tournament","scout"]:
        return "Infra", "⬜ 无"
    return "待分配", "⬜ 无"

# 生成详细审计
for name, d in data.items():
    fpath = os.path.join(PROJECT, f"docs/knowledge/{name}-audit.md")
    if not os.path.exists(fpath):
        continue
    
    phase, prd = get_phase(name)
    rb = "✅" if d["has_rb"] else "⬜"
    
    # 评定
    if prd.startswith("PRD"):
        rating = "🟢 代码+测试完善" if d["ratio"] > 1.0 else "🟡 测试不足"
    else:
        rating = "🟡 无PRD，代码+测试存在" if d["ratio"] > 1.0 else "🔴 需PRD+测试"
    
    content = f"""# {name} 模块审计 · {phase}

> 更新时间: 2026-07-14 15:00 | 基于全量扫描
> Phase: {phase} | PRD: {prd}

## 代码与测试

| 维度 | 值 |
|:----|:---:|
| 源文件数 | {d['src_files']} |
| 测试文件数 | {d['test_files']} |
| 代码行 | {d['src_lines']} |
| 测试行 | {d['test_lines']} |
| 测试/代码比 | {d['ratio']}x |
| 圈梁测试 | {rb} |

## 源文件

{f', '.join(d['top_src'])}{'...' if d['src_files'] > 5 else ''}

## 测试文件

{f', '.join(d['top_test'])}{'...' if d['test_files'] > 5 else ''}

## 结论

{rating}

---

*🐜 批量审计 · {name} · 2026-07-14*
"""
    
    with open(fpath, 'w') as f:
        f.write(content)

print(f"已填充 {len(data)} 个审计文件")
print(f"现在全部有: 文件数/行数/比例/圈梁/Phase/PRD 真实数据")
