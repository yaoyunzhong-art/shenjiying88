# 支付收银台 压测报告 (P2-3.2)

## 1. 压测目标

验证 `apps/api` 在支付收银核心场景下的性能与稳定性, 达到 SLA 基线后进入 P3 (第二底座接入 + 灰度 + SLA) 阶段.

## 2. SLA 基线 (Phase-45 必备)

| 指标 | 目标 | 监控方式 |
|------|------|----------|
| 接口 p95 延迟 | < 500ms | k6 `http_req_duration` p(95) |
| 接口 p99 延迟 | < 1500ms | k6 `http_req_duration` p(99) |
| 错误率 | < 0.5% | k6 `http_req_failed` rate |
| 吞吐量 | >= 500 RPS | k6 `http_reqs` count / duration |
| 收银台最大并发 | >= 200 VU | k6 stages |

## 3. 压测场景

| 场景 | 流量占比 | 路径 | 备注 |
|------|----------|------|------|
| 创建订单 | 100% | POST `/cashier/orders` | 包含 1-3 个商品 |
| 创建支付 | 100% | POST `/cashier/payments` | 50% WECHAT / 50% ALIPAY |
| 查询订单 | 10% | GET `/cashier/orders/:id` | 缓存命中 |
| 退款 | 5% | POST `/cashier/refunds` | 仅 paid 订单 |
| T+1 对账 (cron) | 1% | 内部定时 | 凌晨 2am |

## 4. 阶段化压测 (k6 stages)

| 阶段 | 时长 | VU | 目标 |
|------|------|----|------|
| 1. 预热 | 10s | 50 | 触发 JIT / cache warmup |
| 2. 升压 | 30s | 200 | 验证线性扩展 |
| 3. 稳压 | 60s | 200 | 验证稳定性 |
| 4. 峰值 | 20s | 500 | 验证 SLA 基线 |
| 5. 退场 | 10s | 0 | 验证清理 |

## 5. 报告字段

每份报告包含:

```json
{
  "timestamp": "ISO 8601",
  "config": {
    "BASE_URL": "https://api-staging.example.com",
    "TENANT_ID": "t-loadtest",
    "DURATION": 60,
    "CONNECTIONS": 100,
    "PIPELINING": 1
  },
  "result": {
    "requests": { "total": 30000, "average": 500 },
    "latency": { "p50": 80, "p90": 200, "p99": 450, "max": 1200, "mean": 95.5 },
    "throughput": { "average": 1.2 },
    "errors": 0,
    "timeouts": 0,
    "non2xx": 12
  },
  "sla": {
    "pass": true,
    "checks": {
      "latency_p99_lt_500ms": true,
      "error_rate_lt_0_5pct": true,
      "rps_gte_500": true
    }
  }
}
```

## 6. 不通过时的诊断流程

```
SLA FAIL
  |
  v
错误率 >= 0.5% ? --YES--> 看 logs + trace, 找 5xx 根因
  | NO
  v
p99 >= 1500ms ? --YES--> 慢查询 (DB? 外部 API?)
  | NO                  - 检查 N+1
  |                     - 检查同步阻塞
  |                     - 检查缓存命中率
  v
RPS < 500 ? --YES--> 看 CPU / GC / 连接池
  | NO
  v
单接口 P99 高? --YES--> 单接口专项 profile
```

## 7. 文件清单

- `loadtest/cashier-load.k6.js` — k6 压测脚本 (推荐)
- `loadtest/cashier-load.autocannon.js` — autocannon 快速摸底
- `loadtest-results/` — 压测结果 JSON 落盘目录

## 8. 使用

```bash
# 1. k6 完整压测
k6 run --duration 60s --vus 100 loadtest/cashier-load.k6.js

# 2. autocannon 快速摸底 (无 k6 环境)
node loadtest/cashier-load.autocannon.js

# 3. CI 集成 (SLA 失败退出码非 0)
node loadtest/cashier-load.autocannon.js || exit 1
```

## 9. 后续 (P3 SLA 监控)

- 接入 Prometheus + Grafana 持续 SLA 看板
- 告警: p99 > 1s 持续 5min, 错误率 > 1% 持续 2min
- 周末 / 大促日 1 分钟 1 个拨测
- 第二底座灰度: 5% → 25% → 50% → 100% 三日观察窗
