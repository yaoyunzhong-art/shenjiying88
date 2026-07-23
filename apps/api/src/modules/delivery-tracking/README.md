# Delivery Tracking 配送追踪

> 配送物流追踪服务，管理配送订单创建、状态更新与查询

## 功能
- 配送订单创建
- 配送状态更新
- 配送详情查询

## 依赖
- AgentModule, TenantModule

## API
- POST /delivery-tracking — 创建配送
- GET /delivery-tracking — 配送列表
- GET /delivery-tracking/:deliveryId — 配送详情
- PATCH /delivery-tracking/:deliveryId — 更新配送
- PATCH /delivery-tracking/:deliveryId/status — 更新状态
