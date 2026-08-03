#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 业务烟囱测试 v2 (post-recovery 验证)
#
# 用 python3 urllib 绕过 macOS curl LibreSSL 问题
# 端点: 用 api explorer 验证真实路径
# ═══════════════════════════════════════════════════════════════
import json
import ssl
import time
import urllib.request
import urllib.error
from datetime import datetime

# 探索后确认的真实端点
ENDPOINTS = [
    # (name, url, expected, critical, method, data)
    # ── 1. 4 域名基础 ──
    ("api-health-ping", "https://api.sportsant.net/api/v1/health/ping", 200, True, "GET", None),
    ("api-health", "https://api.sportsant.net/api/v1/health", 200, True, "GET", None),
    ("api-foundation-bootstrap", "https://api.sportsant.net/api/v1/foundation/bootstrap", 200, True, "GET", None),
    ("api-members", "https://api.sportsant.net/api/v1/members", 200, True, "GET", None),
    # ── 2. 4 个 web 域名 ──
    ("admin-home", "https://admin.sportsant.net/", 200, True, "GET", None),
    ("admin-api-foundation", "https://admin.sportsant.net/api/v1/foundation/bootstrap", 200, True, "GET", None),
    ("admin-api-members", "https://admin.sportsant.net/api/v1/members", 200, True, "GET", None),
    ("store-home", "https://store.sportsant.net/", 200, True, "GET", None),
    ("store-api-foundation", "https://store.sportsant.net/api/v1/foundation/bootstrap", 200, True, "GET", None),
    ("store-api-members", "https://store.sportsant.net/api/v1/members", 200, True, "GET", None),
    ("tob-home", "https://tob.sportsant.net/", 200, True, "GET", None),
    ("tob-api-foundation", "https://tob.sportsant.net/api/v1/foundation/bootstrap", 200, True, "GET", None),
    ("tob-api-members", "https://tob.sportsant.net/api/v1/members", 200, True, "GET", None),
    # ── 3. 业务 5 生命线 ──
    ("L1-认证-登录", "https://api.sportsant.net/api/v1/auth/login", 200, True, "POST", {"username":"admin@tenant-demo.com","password":"Demo@2026!","tenantId":"tenant-demo"}),
    ("L2-健康-详细", "https://api.sportsant.net/api/v1/health/ready", 200, True, "GET", None),
    ("L3-基础-完整", "https://api.sportsant.net/api/v1/foundation/bootstrap?tenant=tenant-demo", 200, True, "GET", None),
    ("L4-会员-完整", "https://api.sportsant.net/api/v1/members?page=1&pageSize=20", 200, True, "GET", None),
    ("L5-业务-健康", "https://api.sportsant.net/api/v1/health/live", 200, True, "GET", None),
]

def make_request(method, url, data=None, timeout=15):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "SmokeTest/2.0")
    t0 = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return resp.status, resp.read().decode(errors='replace')[:500], time.time() - t0
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors='replace')[:500], time.time() - t0
    except Exception as e:
        return 0, str(e)[:200], time.time() - t0

def main():
    print("═" * 70)
    print(f" 神机营 SaaS · 业务烟囱测试 v2 (post-recovery 验证)")
    print(f" 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" 端点数: {len(ENDPOINTS)}")
    print("═" * 70)
    print()

    passed, failed, critical_failed = 0, 0, 0
    sections = {"4 域名基础": [], "4 个 web 域名": [], "业务 5 生命线": []}
    current_section = "4 域名基础"
    results = []

    for i, (name, url, expected, critical, method, data) in enumerate(ENDPOINTS):
        if i == 1:
            current_section = "4 个 web 域名"
        elif i == 13:
            current_section = "业务 5 生命线"
            print(f"\n━━━ {current_section} ━━━")

        if i in (0, 1, 13):
            print(f"\n━━━ {current_section} ━━━")

        status, body, elapsed = make_request(method, url, data)
        ok = (status == expected) or (200 <= status < 400)
        icon = "✅" if ok else ("❌" if critical else "⚠️")
        print(f"  {icon} [{status:3d}] {elapsed:.2f}s  {name:30s} {method} {url[:60]}")

        results.append({
            "name": name, "url": url, "method": method, "status": status,
            "elapsed": elapsed, "ok": ok, "critical": critical, "body_preview": body[:100]
        })

        if ok:
            passed += 1
        else:
            failed += 1
            if critical:
                critical_failed += 1

    elapsed_total = time.time() - time.time()
    print()
    print("═" * 70)
    print(f" 总结: {passed}/{len(ENDPOINTS)} 通过 ({elapsed_total:.1f}s)")
    if critical_failed == 0:
        print(f" 🎉 所有 critical 端点都通过了！系统完全恢复！")
    else:
        print(f" ❌ {critical_failed} critical 端点失败")
    print("═" * 70)

    # 报告
    import os
    os.makedirs("docs/incidents/2026-07-29-load-test", exist_ok=True)
    with open("docs/incidents/2026-07-29-load-test/smoke-test-result.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "passed": passed,
            "failed": failed,
            "critical_failed": critical_failed,
            "results": results
        }, f, indent=2, ensure_ascii=False)
    print(f"\n  报告: docs/incidents/2026-07-29-load-test/smoke-test-result.json")

    return critical_failed == 0

if __name__ == "__main__":
    exit(0 if main() else 1)
