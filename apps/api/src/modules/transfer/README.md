# Transfer 调拨

> 库存调拨管理服务，支持调拨创建、审批与统计

## 功能
- 调拨单 CRUD
- 调拨审批
- 调拨统计

## 依赖
- AgentModule, TenantModule

## API
- POST /transfer — 创建调拨
- GET /transfer — 调拨列表
- GET /transfer/:transferId — 详情
- PATCH /transfer/:transferId/approve — 审批
- GET /transfer/stats — 统计
