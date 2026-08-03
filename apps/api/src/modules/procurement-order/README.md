# Procurement Order 采购订单

> 采购订单管理服务，支持订单的创建、审批与生命周期管理

## 功能
- 采购订单 CRUD
- 订单审批

## 依赖
- AgentModule, TenantModule

## API
- POST /procurement-order — 创建订单
- GET /procurement-order — 订单列表
- GET /procurement-order/:orderId — 详情
- PATCH /procurement-order/:orderId — 更新
- DELETE /procurement-order/:orderId — 删除
