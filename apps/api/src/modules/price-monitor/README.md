# Price Monitor 价格监控

> 价格监控服务，支持价格列表、异常检测与竞品对比

## 功能
- 价格列表
- 异常价格检测
- 竞品价格对比
- 价格概览

## 依赖
- AgentModule, TenantModule

## API
- GET /price-monitor — 监控列表
- GET /price-monitor/:id — 详情
- GET /price-monitor/summary — 概览
- GET /price-monitor/anomalies — 异常
- GET /price-monitor/comparison — 对比
