# Observability 可观测性

> 系统可观测性服务，提供指标、健康检查与告警管理

## 功能
- 指标查询
- 健康检查
- 告警管理

## 依赖
- AgentModule

## API
- GET /observability/metrics — 指标
- GET /observability/healthz — 健康检查
- GET /observability/api/observability/metrics — API 指标
- POST /observability/api/observability/alerts — 创建告警
- GET /observability/api/observability/alerts — 告警列表
