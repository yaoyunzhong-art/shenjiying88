# Marketing Metrics 营销指标

> 营销指标采集服务，提供快照、Prometheus 指标与营销事件记录

## 功能
- 营销指标快照
- Prometheus 指标暴露
- 优惠券核销记录
- 营销事件触发

## 依赖
- AgentModule, TenantModule

## API
- GET /marketing-metrics/snapshot — 指标快照
- GET /marketing-metrics/prometheus — Prometheus 指标
- POST /marketing-metrics/coupon/redemption — 优惠券核销
- POST /marketing-metrics/coupon/issued — 优惠券发放
- POST /marketing-metrics/campaign/trigger — 活动触发
