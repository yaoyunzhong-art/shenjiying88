# Return Request 退货申请

> 退货申请管理服务，支持退货创建、审批与状态跟踪

## 功能
- 退货单 CRUD
- 退货审批

## 依赖
- AgentModule, TenantModule

## API
- POST /return-request — 创建退货
- GET /return-request — 退货列表
- GET /return-request/:returnId — 详情
- PATCH /return-request/:returnId — 更新
- DELETE /return-request/:returnId — 删除
