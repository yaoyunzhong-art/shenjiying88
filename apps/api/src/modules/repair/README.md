# Repair 报修

> 报修管理服务，支持报修申请、派工与状态跟踪

## 功能
- 报修单 CRUD
- 派工管理

## 依赖
- AgentModule, TenantModule

## API
- POST /repair — 创建报修
- GET /repair — 报修列表
- GET /repair/:requestId — 详情
- PATCH /repair/:requestId — 更新
- PATCH /repair/:requestId/dispatch — 派工
