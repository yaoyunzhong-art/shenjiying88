# DR-016 · OpenTelemetry 全链路标准化

## 状态
已接受 (2026-06-26, Pulse-89-90)

## 背景
SaaS 需要跨服务 trace 排查问题,但每个服务各自实现 trace 字段会碎片化。

## 决策
1. **OpenTelemetry** 作为统一 trace 协议 (W3C traceparent)
2. **4 类 span** 标准化: rpc / db / http / cache (基于 semantic-conventions)
3. **业务上下文** 跨 span 透传: tenant.id / brand.id / store.id / user.id
4. **双采样策略**: head-based ProbabilitySampler 10% + tail-based 错误/慢请求保留
5. **优雅降级**: 无 OTLP endpoint → Console exporter / 无 exporter → 内存 mode

## 后果
- ✅ 跨服务 trace 自动串联 (web → api → db → external)
- ✅ 业务 context 自动丰富 (dashboard 可按 tenant 切片)
- ✅ 生产 10% 采样率,节省 90% 存储
- ⚠️ Tail-based 需要 OTel Collector 支持,V1 暂用 head-based
- ⚠️ Span attributes 标准化需团队培训,新业务容易遗漏

## 替代方案
- Jaeger native SDK: 缺标准化 semantic-conventions
- Datadog APM: 商业方案,SaaS 依赖
- 选择: OpenTelemetry (vendor-neutral)
