# Phase-22 · Tasks (T65-T80)

| T# | 任务 | Pulse | 状态 |
|---|---|---|---|
| T65 | OpenTelemetry SDK 集成 | 89 | done |
| T66 | Trace context 透传 | 90 | done |
| T67 | Span 数据模型 | 90 | done |
| T68 | Trace storage + 采样 | 90 | done |
| T69 | Sentry 后端集成 | 91 | done |
| T70 | Sentry 前端集成 | 91 | done |
| T71 | Release 健康度 | 91 | done |
| T72 | Error fingerprint | 91 | done |
| T73 | Prometheus 指标 | 92 | done |
| T74 | Grafana dashboard | 92 | done |
| T75 | Alertmanager 告警 | 92 | done |
| T76 | Oncall 轮值 + runbook | 92 | done |
| T77 | SLO 计算引擎 | 93 | done |
| T78 | Error Budget 跟踪 | 93 | done |
| T79 | 故障演练 chaos | 93 | done |
| T80 | Phase-22 Retro + Phase-23 | 94 | done |

---

## T65 · OpenTelemetry SDK (Pulse-89)
- @opentelemetry/sdk-node + auto instrumentation
- 验收: 任意 HTTP 请求产生完整 trace span

## T66 · Trace context 透传 (Pulse-90)
- W3C `traceparent` header 注入 + 提取
- 跨服务/跨 DB/跨 MQ 透传

## T67 · Span 数据模型 (Pulse-90)
- rpc/db/http/cache 四类 Span
- 属性标准化 (db.system / http.status_code / rpc.service)

## T68 · Trace storage (Pulse-90)
- Jaeger / Tempo 选型
- 采样策略: production 10%, staging 100%

## T69 · Sentry 后端集成 (Pulse-91)
- @sentry/node + NestJS interceptor
- Source map 上传 + release 关联

## T70 · Sentry 前端集成 (Pulse-91)
- Web (React) + RN (移动)
- Performance API + Replay

## T71 · Release 健康度 (Pulse-91)
- crash-free session/用户
- regression detection (新 release 错误率突增)

## T72 · Error fingerprint (Pulse-91)
- 自动 fingerprint (异常类型 + stack frame hash)
- 手动 grouping 规则

## T73 · Prometheus 指标 (Pulse-92)
- @willsoto/nestjs-prometheus
- default + custom (订单/合规/AI 推理)

## T74 · Grafana dashboard (Pulse-92)
- 4 套: 业务 / 性能 / 合规 / 移动端
- 模板 JSON 入库,版本管理

## T75 · Alertmanager 告警 (Pulse-92)
- P0/P1/P2 阈值规则
- 抑制规则 (维护窗口屏蔽)

## T76 · Oncall 轮值 (Pulse-92)
- 飞书 / PagerDuty 集成
- runbook 自动执行 (webhook → service restart)

## T77 · SLO 计算引擎 (Pulse-93)
- 可用性 (SLI = 成功请求/总请求)
- 延迟 (P50/P95/P99)
- 错误率 (5xx / 总请求)

## T78 · Error Budget (Pulse-93)
- 月度 budget = 1 - SLO target
- burn rate 告警 (1h/6h/24h/72h)

## T79 · 故障演练 chaos (Pulse-93)
- CPU 飙高 / 网络分区 / DB 慢查询 / 服务宕机
- 验证告警 + runbook 有效性

## T80 · Phase-22 Retro + Phase-23 (Pulse-94)
- lessons-learned/phase-22.md
- 3 DR (OTel/Sentry/SLO)
- Phase-23 spec/tasks
