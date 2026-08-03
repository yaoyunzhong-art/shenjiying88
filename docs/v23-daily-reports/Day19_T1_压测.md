# V23 Day19 T1: 上线性能压测准备

> **日期:** 2026-07-26  
> **执行者:** 树哥 Trae  
> **项目:** shenjiying88 / apps/api  
> **Phase:** V23 Day19 上线前压测评估

---

## 1. 压测前自查矩阵

### 1.1 并发限制 (Concurrency Limits)

| 模块 | 机制 | 限制值 | 文件 |
|------|------|--------|------|
| 请求治理 | `TrafficGovernanceGuard` + `RequireRateLimit` 装饰器 | 按 scope 动态配置（trust governance 持久化策略） | `common/guards/traffic-governance.guard.ts` |
| 会话并发 | `SESSION_CONFIG.maxConcurrentSessions` | **5 会话/用户** | `modules/session/session.service.ts` |
| 混沌实验 | `MAX_CONCURRENT_EXPERIMENTS` | **5 实验** | `modules/chaos/chaos.service.ts` |
| 自动回滚 | `maxConcurrent` 配置 | **默认 3** | `modules/auto-rollback/auto-rollback.service.ts` |
| Gateway 限流 | `RateLimiterService` 令牌桶 | **默认 100 tokens, 10/s 补充** | `modules/gateway/gateway.service.ts` |
| Open API 限流 | `RateLimiter` 滑动窗口 | **按 tenant 配置 QPS** | `modules/openapi/rate-limiter.ts` |
| Open API (内嵌) | `checkRateLimit` QPS 桶 | **按 client 配置 (100/50/10)** | `modules/open-api/open-api.service.ts` |
| AI 模型限流 | `RateLimitConfig` 按 tier 分级 | premium > standard > basic | `modules/ai-model-config/` |
| WAF 限流 | `rateLimitTracker` IP 级别 | 内存追踪 | `modules/security/waf.service.ts` |

**结论:** ✅ 多层限流已部署（Guard 级 + 令牌桶 + 滑动窗口 + IP WAF），但**无全局并发连接数上限**。

---

### 1.2 连接池 (Connection Pool)

| 组件 | 配置项 | 当前值 | 文件 |
|------|--------|--------|------|
| PostgreSQL | `pool.max` | **10** | `database/pg-pool.ts` |
| PostgreSQL | `idleTimeoutMillis` | **30,000ms (30s)** | `database/pg-pool.ts` |
| PostgreSQL | `connectionTimeoutMillis` | **5,000ms (5s)** | `database/pg-pool.ts` |

**结论:** ✅ 连接池已配置，但 `max: 10` 对生产偏低。建议压测时监控连接等待时间，按需调整到 20-30。

---

### 1.3 超时配置 (Timeout Configuration)

| 组件 | 配置项 | 当前值 | 文件 |
|------|--------|--------|------|
| LYT Sandbox | `LYT_SANDBOX_TIMEOUT_MS` | **4000ms** | `config/configuration.ts` |
| LYT Real | `LYT_REAL_TIMEOUT_MS` | **5000ms** | `config/configuration.ts` |
| AI CS Fallback | `TIMEOUT_MS` | **5,000ms** | `modules/ai-cs/fallback.service.ts` |
| AI Review LLM | `AbortSignal.timeout` | **30,000ms** | `modules/ai-review/llm/llm.provider.ts` |
| AI Review Embedding | `AbortSignal.timeout` | **5,000ms** | `modules/ai-review/llm/llm.provider.ts` |
| LLM Claude | `LLM_CLAUDE_TIMEOUT_MS` | **60,000ms** | `modules/ai-review/llm/llm.config.ts` |
| LLM OpenAI | `LLM_OPENAI_TIMEOUT_MS` | **30,000ms** | `modules/ai-review/llm/llm.config.ts` |
| LLM DeepSeek | `LLM_DEEPSEEK_TIMEOUT_MS` | **60,000ms** | `modules/ai-review/llm/llm.config.ts` |
| 会话 | `sessionTimeoutMinutes` | **30 分钟** | `modules/session/session.service.ts` |

**结论:** ✅ 各层超时均已配置，合理分层。无全局 HTTP 请求超时（NestJS 默认无超时）。

---

### 1.4 启动配置 (main.ts Bootstrap Hardening)

| 安全/性能项 | 状态 |
|-------------|------|
| Helmet (安全头) | ✅ 启用 |
| Compression (gzip) | ✅ 启用 |
| CORS 白名单 | ✅ 启用 |
| ValidationPipe (whitelist+transform) | ✅ 启用 |
| OpenTelemetry Tracing | ✅ 启用 |
| 结构化日志 (pino) | ✅ 启用 |
| x-request-id 中间件 | ✅ 启用 |
| 全局 API 前缀 `/api/v1` | ✅ 设置 |
| 默认端口 `3001` | ✅ 设置 |

---

## 2. 限流架构总览

```
入站请求
  │
  ├── Helmet + CORS + Compression
  ├── x-request-id 中间件
  │
  ├── TrafficGovernanceGuard (全局 Guard)
  │   ├── RequireRateLimit 装饰器 → trust governance 策略
  │   ├── X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Scope 响应头
  │   └── 超限 → HTTP 429
  │
  ├── Controller 层
  │   ├── Gateway RateLimiterService (令牌桶: 100 tokens, 10/s 补充)
  │   ├── Open API RateLimiter (滑动窗口, 按 tenant 配置)
  │   ├── Session 并发限制 (5/用户)
  │   └── WAF IP 限流追踪
  │
  ├── Service 层
  │   ├── Foundation Trust Governance (DB 持久化 rateLimitPolicy)
  │   ├── TokenBucket 限流器 (可阻塞 acquire + timeout)
  │   ├── Chaos MAX_CONCURRENT_EXPERIMENTS=5
  │   └── Auto-rollback maxConcurrent=3
  │
  └── 数据层
      └── PostgreSQL Pool (max=10, idle=30s, connect=5s)
```

---

## 3. 压测关注点 & 建议

### 🔴 高风险项

| 风险 | 说明 | 建议 |
|------|------|------|
| **PG 连接池 max=10** | 高并发下可能成为瓶颈 | 压测时监控等待时间，考虑调整为 20-30 |
| **会话数据内存存储** | `userSessions` 用 `Map`，无 Redis | 多实例部署时不同步；单实例可接受 |
| **WAF rateLimitTracker 内存** | 高频攻击时 Map 可能膨胀 | 压测时监控内存，考虑加 LRU 淘汰 |
| **无全局 HTTP 超时** | NestJS 默认无限等待 | 生产建议在反向代理层（nginx）设置 `proxy_read_timeout` |

### 🟡 中风险项

| 风险 | 说明 | 建议 |
|------|------|------|
| Gateway 令牌桶默认 100/10s | 单 client 限制较宽松 | 按业务调整 |
| AI 调用超时分散配置 | 多个超时值不一致 | 统一审计，确保合理 |
| CORS origins 本地硬编码 | defaultOrigins 仅 localhost | 生产通过 `CORS_ORIGIN` 环境变量覆盖 |

### 🟢 已就绪

- ✅ 多层限流：Guard → Gateway → 业务层 → 数据层
- ✅ 令牌桶 + 滑动窗口 + IP 追踪三种算法
- ✅ 所有外部调用有超时
- ✅ Helmet + CORS + Compression 安全硬化
- ✅ 结构化日志 + OpenTelemetry

---

## 4. 压测脚本建议

### 4.1 压测目标

| 场景 | 并发数 | 持续时间 | 目标 |
|------|--------|----------|------|
| 基础吞吐 | 50 → 100 → 200 | 各 60s | 找到 QPS 上限 |
| 限流验证 | 200 | 30s | 确认 429 正确触发 |
| 长连接 | 50 | 300s | 检测连接池泄漏 |
| AI 调用 | 20 | 120s | AI 接口超时/重试 |
| 混合负载 | 100 | 300s | 多接口混合稳定性 |

### 4.2 关键接口列表

```
GET  /api/v1/foundation/bootstrap
POST /api/v1/foundation/trust-governance/rate-limit/check
POST /api/v1/gateway/rate-limit
POST /api/v1/open-api/* (按 tenant)
POST /api/v1/session/*
POST /api/v1/cashier/*
AI-*  /api/v1/ai-cs/*
AI-*  /api/v1/ai-review/*
```

### 4.3 监控指标

```bash
# 连接池状态
SELECT count(*) FROM pg_stat_activity WHERE datname = 'm5';

# 应用内存
# 关注 rateLimitTracker Map 和 userSessions Map 大小

# 限流命中
# 统计 429 响应数量 = X-RateLimit-Remaining: 0 次数

# 响应时间 P50/P95/P99
# 通过 OpenTelemetry traces 导出
```

---

## 5. Git 提交

```
commit: perf: Day19-T1 压测准备
files:  22 files changed, 89 insertions(+), 79 deletions(-)
```

---

## 6. 总结

**压测准备就绪。** 项目已有完整的多层限流体系（Guard → Gateway → 业务 → 数据）和分层超时配置。

**压测前必调参数:**
1. PG 连接池 `max` 从 10 → 20（或根据压测结果动态调整）
2. 确认生产 `CORS_ORIGIN` 环境变量已设置
3. 在 nginx/反向代理层设置 `proxy_read_timeout` 作为全局兜底

**压测工具建议:** k6 / autocannon / wrk2
