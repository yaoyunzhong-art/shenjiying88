#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 10 VU / 30s 加量压测 (post-recovery Day 5)
#
# 参数: 10 VU (生产上限, 不能再加), 30s (短时加量, 不能再长)
# 端点: 4 端点轮流 (health / foundation / members / health-ping)
# 用 python3 urllib 绕过 macOS curl LibreSSL
# ═══════════════════════════════════════════════════════════════
import json
import ssl
import threading
import time
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://api.sportsant.net"
ENDPOINTS = [
    "/api/v1/health/ping",
    "/api/v1/health",
    "/api/v1/foundation/bootstrap",
    "/api/v1/members",
]

VU = 10
DURATION = 30  # seconds

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

results = {"success": 0, "error": 0, "total": 0, "status_codes": {}}
latencies = []
errors = []
lock = threading.Lock()

def hit_endpoint(idx=0):
    ep = ENDPOINTS[idx % len(ENDPOINTS)]
    url = BASE_URL + ep
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", f"LoadTest-{VU}VU/1.0")
    t0 = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        elapsed = time.time() - t0
        status = resp.status
    except urllib.error.HTTPError as e:
        elapsed = time.time() - t0
        status = e.code
    except Exception as e:
        elapsed = time.time() - t0
        status = 0

    with lock:
        results["total"] += 1
        results["status_codes"][status] = results["status_codes"].get(status, 0) + 1
        if 200 <= status < 400:
            results["success"] += 1
            latencies.append(elapsed)
        else:
            results["error"] += 1
            errors.append((status, ep))
    return status, elapsed

def vuser(idx):
    end_time = time.time() + DURATION
    while time.time() < end_time:
        hit_endpoint(idx)
        time.sleep(0.05)  # 20 RPS/VU, 200 RPS 总

def main():
    print("═" * 70)
    print(f" 神机营 SaaS · 10 VU / 30s 加量压测 (post-recovery Day 5)")
    print(f" 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" 端点: {ENDPOINTS}")
    print(f" VU: {VU}  |  DURATION: {DURATION}s  |  目标 RPS: {VU * 20}")
    print("═" * 70)

    threads = []
    for i in range(VU):
        t = threading.Thread(target=vuser, args=(i,), name=f"VU-{i+1}")
        t.start()
        threads.append(t)

    t0 = time.time()
    for t in threads:
        t.join()
    total_elapsed = time.time() - t0

    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.5)] if latencies else 0
    p90 = latencies[int(len(latencies) * 0.9)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0

    print()
    print(f"  总请求: {results['total']}  |  成功: {results['success']}  |  失败: {results['error']}")
    print(f"  实际 RPS: {results['total']/total_elapsed:.1f}")
    print(f"  延迟 P50: {p50*1000:.0f}ms  P90: {p90*1000:.0f}ms  P95: {p95*1000:.0f}ms  P99: {p99*1000:.0f}ms")
    print(f"  状态码分布: {dict(sorted(results['status_codes'].items()))}")
    if errors[:5]:
        print(f"  错误样本: {errors[:5]}")
    print()

    success_rate = (results["success"] / results["total"]) * 100 if results["total"] > 0 else 0
    if success_rate >= 99.9:
        verdict = "🎉 完美！10 VU 加量全过！"
    elif success_rate >= 99:
        verdict = "✅ 99%+ 成功率，加量成功"
    elif success_rate >= 95:
        verdict = "⚠️ 95%+ 成功率，需关注"
    else:
        verdict = "❌ 成功率 < 95%, 不能加量"

    print(f"  {verdict} (成功率 {success_rate:.2f}%)")
    print("═" * 70)

    import os
    os.makedirs("docs/incidents/2026-07-29-load-test", exist_ok=True)
    with open("docs/incidents/2026-07-29-load-test/load-test-10vu.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "vu": VU, "duration": DURATION,
            "total_requests": results["total"],
            "success": results["success"],
            "error": results["error"],
            "success_rate": success_rate,
            "rps": results["total"]/total_elapsed,
            "p50_ms": p50*1000, "p90_ms": p90*1000, "p95_ms": p95*1000, "p99_ms": p99*1000,
            "status_codes": dict(sorted(results["status_codes"].items())),
            "error_samples": errors[:10]
        }, f, indent=2, ensure_ascii=False)
    print(f"\n  报告: docs/incidents/2026-07-29-load-test/load-test-10vu.json")

    return success_rate >= 99.0

if __name__ == "__main__":
    exit(0 if main() else 1)
