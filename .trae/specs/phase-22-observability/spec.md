# Phase-22 · Observability & SRE (Spec)

> 启动: Pulse-89 (2026-06-27)
> 闭环: Pulse-94 (2026-07-02)
> Owner: E15 周运维 + E17 林 SRE

## 0. 概述
从"功能闭环"到"生产可运维":全链路 Tracing + 错误监控 + 告警 + SLO。

## 1. 目标
1. **APM 端到端**: 一次请求跨 web/api/db/external 全链路 trace
2. **错误聚合**: Sentry 自动收集前端 + 后端异常,按 release/fingerprint 去重
3. **业务指标**: Prometheus 暴露业务 KPI (订单/转化/合规事件)
4. **告警闭环**: 阈值告警 → oncall → 自动 runbook
5. **SLO 体系**: 可用性 99.9% + 延迟 P99 < 500ms,季度 review

## 2. 范围 (T65-T80, 16 tasks)

### Phase 1 · Tracing Foundation (Pulse-89-90, T65-T68)
- T65 OpenTelemetry SDK 集成 (NestJS interceptor + 前端 fetch hook)
- T66 Trace context 透传 (W3C traceparent header)
- T67 Span 数据模型 (rpc/db/http/cache 四类)
- T68 Trace storage (Jaeger/Tempo + 采样策略)

### Phase 2 · Error Monitoring (Pulse-91, T69-T72)
- T69 Sentry 后端集成 (NestJS + source map)
- T70 Sentry 前端集成 (Web + RN)
- T71 Release 健康度 (crash-free session/用户)
- T72 Error fingerprint 聚合 + 告警去重

### Phase 3 · Metrics & Alerting (Pulse-92, T73-T76)
- T73 Prometheus 指标采集 (默认 + 自定义)
- T74 Grafana dashboard 模板 (4 套:业务/性能/合规/移动端)
- T75 Alertmanager 告警规则 (P0/P1/P2 三级)
- T76 Oncall 轮值 + runbook 自动执行

### Phase 4 · SLO & Retro (Pulse-93-94, T77-T80)
- T77 SLO 计算引擎 (可用性 + 延迟 + 错误率)
- T78 Error Budget 跟踪 + 月度 burn rate
- T79 故障演练 (chaos engineering)
- T80 Phase-22 Retro + Phase-23

## 3. 技术栈
- **OpenTelemetry** SDK (auto + manual instrumentation)
- **Jaeger / Tempo** trace storage (V1 选 Jaeger,V2 评估 Grafana Tempo)
- **Sentry** 错误监控 (self-hosted 或 SaaS)
- **Prometheus** 指标采集
- **Grafana** dashboard
- **Alertmanager** 告警路由 + 抑制
- **PagerDuty / 飞书** oncall 集成

## 4. 验收
- ✅ 单请求 trace 100% 覆盖 (web/api/db/external)
- ✅ Sentry 错误捕获率 ≥95%
- ✅ Prometheus 自定义业务指标 ≥20 个
- ✅ P0 告警 < 5min 响应,P1 < 30min
- ✅ 月度 SLO 报告自动生成

## 5. 不在范围
- 全链路压测 (Phase-23)
- AIOps 异常检测 (Phase-23)
- 用户行为分析 (V2,可接入 PostHog)

## 6. 度量目标
| 指标 | 目标 |
|---|---|
| 代码行数 | +2000 行 (OTel SDK + Sentry + Prometheus) |
| 测试 | 35+ 单测 + 5 故障演练场景 |
| Trace 采样率 | 生产 10%,压测 100% |
| SLO | 可用性 99.9%, P99 延迟 < 500ms |
| 告警噪声率 | < 5% (false positive) |
