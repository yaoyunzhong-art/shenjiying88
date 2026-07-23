# Inventory Alert 库存预警

> 库存预警服务，监控库存水平并触发预警通知

## 功能
- 库存预警列表
- 预警统计概览
- 预警详情

## 依赖
- PrismaModule, AgentModule, TenantModule

## API
- GET /inventory-alert — 预警列表
- GET /inventory-alert/summary — 统计概览
- GET /inventory-alert/:id — 预警详情
- POST /inventory-alert — 创建预警
