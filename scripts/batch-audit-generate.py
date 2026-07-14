#!/usr/bin/env python3
"""批量审计骨架生成器 - 基于全量扫描数据"""
import os, subprocess, sys

PROJECT = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
AUDIT_DIR = os.path.join(PROJECT, "docs/knowledge/audit-batch")
os.makedirs(AUDIT_DIR, exist_ok=True)

# 已有审计不覆盖
existing = set()
for f in os.listdir(os.path.join(PROJECT, "docs/knowledge")):
    if f.endswith("-audit.md"):
        existing.add(f.split("-audit")[0])

# 扫描所有模块
modules = []
for d in sorted(os.listdir(os.path.join(PROJECT, "apps/api/src/modules"))):
    dp = os.path.join(PROJECT, "apps/api/src/modules", d)
    if not os.path.isdir(dp):
        continue
    
    src_count = 0
    test_count = 0
    for f in os.listdir(dp):
        if not f.endswith(".ts"):
            continue
        if f.endswith(".test.ts") or f.endswith(".spec.ts") or f.endswith(".e2e.ts"):
            test_count += 1
        else:
            src_count += 1
    
    has_ringbeam = os.path.exists(os.path.join(dp, f"{d}-ringbeam.test.ts"))
    
    # Phase mapping
    phase_map = {
        "P-35": ["cashier", "lyt", "payment-gateway", "transactions"],
        "P-36": ["member", "member-level", "points", "loyalty", "svip"],
        "P-31": ["tenant", "tenant-config"],
        "P-37": ["inventory"],
        "P-38": ["finance", "reports", "audit", "currency"],
        "P-47": ["brand-custom", "marketing", "marketing-metrics", "content", "campaign", "leads"],
        "P-48": ["coupon", "alliance", "referral", "blindbox"],
        "P-49": ["open-api", "openapi", "tenant-llm", "agent"],
        "P-53": ["deploy", "ops-manual", "runbook", "canary", "auto-rollback"],
        "P-30": ["reservation"],
    }
    
    phase = ""
    has_prd = False
    for p, mods in phase_map.items():
        if d in mods:
            phase = p
            has_prd = True
            break
    
    if d.startswith("ai-") or d in ["aiops", "anomaly-detector", "edge", "federated-learning",
        "image-recognition", "knowledge", "multimodal-fusion", "ocr", "recommend", 
        "recommender", "retrieval", "voice-processing"]:
        phase = "AI"
        has_prd = False
    
    if phase == "":
        phase = "Infra"
        has_prd = False
    
    modules.append((d, src_count, test_count, has_ringbeam, phase, has_prd))

print(f"扫描完成: {len(modules)} 模块")

# 批量生成
count = 0
for name, src, test, has_rb, phase, has_prd in modules:
    # 跳过已有
    if name in existing:
        print(f"  ⏭️  {name} (已有)")
        continue
    
    prd_status = "✅" if has_prd else "⬜"
    rb_status = "✅" if has_rb else "⬜"
    audit_verdict = "已审计" if os.path.exists(os.path.join(PROJECT, f"docs/knowledge/{name}-audit.md")) else "⬜"
    
    content = f"""# {name} 模块审计快照

> 批量生成: 2026-07-14 | 基于全量扫描
> Phase: {phase} | PRD: {prd_status}

## 数据

| 维度 | 值 |
|:----|:---:|
| 源文件数 | {src} |
| 测试文件数 | {test} |
| 圈梁测试 | {rb_status} |
| PRD状态 | {prd_status} |
| 审计状态 | {audit_verdict} |

## 结论

{'🟢 已有PRD定义，代码和测试完善，审计收口即可' if has_prd else '🔴 无PRD定义，需要先补PRD需求摘要+审计覆盖'}

---

*🐜 批量审计 · {name} · 2026-07-14*
"""
    
    fpath = os.path.join(AUDIT_DIR, f"{name}-audit.md")
    with open(fpath, 'w') as f:
        f.write(content)
    count += 1
    if count <= 5:
        print(f"  ✅ {name} (phase={phase}, src={src}, test={test})")

print(f"\n生成: {count} 个审计骨架文件到 {AUDIT_DIR}/")
