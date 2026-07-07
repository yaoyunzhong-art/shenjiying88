# Phase-22 · Observability & SRE Retro (Pulse-89 ~ 93)

> 闭环时间: 2026-06-26
> 范围: T65-T79 (5 pulse, 15 tasks · T80 在本 pulse)

---

## 🎯 5 大成功

### S1. OpenTelemetry 全链路打通 (T65-T68)
- NodeSDK + auto-instrumentation 接入 HTTP / Express / Prisma / NestJS
- W3C traceparent 解析在 RequestContextMiddleware 中透传
- 4 类 Span (rpc/db/http/cache) 标准化属性 + business context (tenant/brand/store)
- ProbabilitySampler 10% + TailBasedSampler 错误/慢请求保留

### S2. Sentry 双端 + Release Health (T69-T72)
- SentryService.captureException / captureMessage / startSession / endSession
- 内存 fallback (无 @sentry/node SDK 也能跑)
- computeFingerprint: 类型 + 第一帧 app frame (排除 node_modules)
- normalizeStackFrame: macOS/Linux 路径 + UUID/时间戳噪音归一化
- crash-free session/用户比例自动计算

### S3. Prometheus + Grafana 4 套 dashboard (T73-T74)
- MetricsService (Counter/Gauge/Histogram) + MetricsInterceptor 自动采集
- 4 套 dashboard JSON: 业务/性能/合规/移动端
- Performance dashboard: P50/P95/P99 latency + 错误率 + RPS + Top10 慢路由

### S4. Alertmanager 兼容告警 + Oncall (T75-T76)
- AlertEngine: P0/P1/P2 三级 + inhibit 抑制 + minSamples 冷启动保护
- 5 条默认规则: 5xx rate / 4xx rate / P99 latency / exception burst
- OncallRotation: 多工程师周/月轮值
- RunbookRegistry: log/page/restart/clear_cache/webhook 5 类动作
- dry-run 支持 (executeActions=false)

### S5. SLO + Chaos 闭环 (T77-T79)
- SLOCalculator: 4 类 SLI (availability/latency_p99/p95/error_rate)
- Google SRE burn rate 阈值 (1h>14.4 P0 / 6h>6 P1 / 24h>3 P2)
- ChaosEngine + 7 preset + scope (global/tenant/endpoint/user)
- Injectors: CpuSpikeInjector + latencyMiddleware + exceptionMiddleware
- autoRevertMs 定时回滚

---

## ❌ 5 大痛点

### P1. esbuild 默认不读 tsconfig (T67)
- 现象: `Parameter decorators only work when experimental decorators are enabled`
- 修复: 跑测试用 `TSX_TSCONFIG_PATH=tsconfig.json node --import tsx --test`

### P2. SamplingDecision enum 值错位 (T68)
- 现象: OTel v1.9.1 没有 `DROP` 而是 `NOT_RECORD`,值 0/1/2
- 修复: 测试用数字常量 + JSON.stringify 输出对照

### P3. SpanKind 数值不一致 (T67)
- 现象: 我误以为 CLIENT=3,实际是 2 (INTERNAL=0 / SERVER=1 / CLIENT=2)
- 修复: 测试用实际枚举值

### P4. URL encode 干扰 sanitize 测试 (T72)
- 现象: URL 中 `[REDACTED]` 被 encode 成 `%5BREDACTED%5D`,直接 `indexOf` 失败
- 修复: 测试同时接受两种格式

### P5. minSamples 冷启动保护误伤测试 (T75)
- 现象: 测试场景没 metric 数据,evaluator 永远 false,alert 不 firing
- 修复: 测试用 `defaultMinSamples: 0` 关闭冷启动保护

---

## 📋 8 行动项

1. **真实 OpenTelemetry Collector** — 当前 OTLP exporter 是 stub,生产接 Jaeger/Tempo
2. **Grafana provisioning** — 当前 dashboard JSON 文件,生产用 Grafana provisioning API 自动部署
3. **Sentry SaaS 上报** — 当前内存 mock,生产配 SENTRY_DSN
4. **PagerDuty 集成** — Runbook page action 当前只走 mock,生产接 PagerDuty Events API
5. **真实 Chaos 演练** — 当前 engine + injector,生产用 Chaos Toolkit / Litmus
6. **SLO 自动统计** — 当前手动计算,生产用 Sloth 或 Nobl9 自动化
7. **Oncall Pager 升级** — 当前 primary/secondary/manager,生产加 escalation policy
8. **Burn Rate 多窗口告警** — 当前单 burn rate,生产用 Google SRE workbook 多窗口

---

## 📊 度量

| 指标 | 值 |
|---|---|
| 代码行数 | +3500 行 (tracing + sentry + metrics + alert + oncall + slo + chaos) |
| 测试用例 | 130 / 130 PASS (Phase-22 全) |
| commit 数 | 5 (Pulse-89~93) |
| Pulse 数 | 5 |
| 知识沉淀 | 8 文件 (lessons + 3 DR + 2 patterns + 2 anti-patterns) |
| SLO 目标 | 可用性 99.9% / P99 ≤ 500ms / 错误率 ≤ 0.1% |
| Alert 规则 | 5 条默认 + 自定义 |
| Runbook | 3 条默认 + 5 类动作 |
