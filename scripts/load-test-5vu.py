#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════
# 神机营 SaaS — 5 VU / 10s 业务压测 (post-recovery)
#
# 安全参数: 5 VU (绝不能加量), 10s (绝不能加时)
# 端点: 只测已验证的 health + foundation + members
# ═══════════════════════════════════════════════════════════════
import json
import ssl
import threading
import time
import urllib.request
import urllib.error
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://api.sportsant.net"
ENDPOINTS = [
    "/api/v1/health/ping",
    "/api/v1/health",
    "/api/v1/foundation/bootstrap",
    "/api/v1/members",
]

VU = 5
DURATION = 10  # seconds

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

results = {"success": 0, "error": 0, "total": 0}
latencies = []
errors = []
lock = threading.Lock()

def hit_endpoint(idx=0):
    ep = ENDPOINTS[idx % len(ENDPOINTS)]
    url = BASE_URL + ep
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", f"LoadTest-5VU/1.0")
    t0 = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        elapsed = time.time() - t0
        with lock:
            results["success"] += 1
            results["total"] += 1
            latencies.append(elapsed)
        return resp.status, elapsed
    except urllib.error.HTTPError as e:
        elapsed = time.time() - t0
        with lock:
            results["error"] += 1
            results["total"] += 1
            errors.append((e.code, ep))
        return e.code, elapsed
    except Exception as e:
        elapsed = time.time() - t0
        with lock:
            results["error"] += 1
            results["total"] += 1
            errors.append((str(e)[:30], ep))
        return 0, elapsed

def vuser(idx):
    end_time = time.time() + DURATION
    while time.time() < end_time:
        hit_endpoint(idx)
        time.sleep(0.1)

def main():
    print("═" * 70)
    print(f" 神机营 SaaS · 5 VU / 10s 业务压测 (post-recovery)")
    print(f" 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" 端点: {ENDPOINTS}")
    print(f" VU: {VU}  |  DURATION: {DURATION}s")
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
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0

    print()
    print(f"  总请求: {results['total']}  |  成功: {results['success']}  |  失败: {results['error']}")
    print(f"  RPS: {results['total']/total_elapsed:.1f}")
    print(f"  延迟 P50: {p50*1000:.0f}ms  P95: {p95*1000:.0f}ms  P99: {p99*1000:.0f}ms")
    if errors[:3]:
        print(f"  错误样本: {errors[:3]}")
    print()
    if results["error"] == 0:
        print(" 🎉 5 VU 压测全成功！生产稳定！")
    else:
        print(f" ⚠️ {results['error']} 个错误，需关注")
    print("═" * 70)

    # 报告
    import os
    os.makedirs("docs/incidents/2026-07-29-load-test", exist_ok=True)
    with open("docs/incidents/2026-07-29-load-test/load-test-5vu.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "vu": VU, "duration": DURATION,
            "total_requests": results["total"],
            "success": results["success"],
            "error": results["error"],
            "rps": results["total"]/total_elapsed,
            "p50_ms": p50*1000, "p95_ms": p95*1000, "p99_ms": p99*1000,
            "error_samples": errors[:10]
        }, f, indent=2, ensure_ascii=False)
    print(f"\n  报告: docs/incidents/2026-07-29-load-test/load-test-5vu.json")

if __name__ == "__main__":
    main()
