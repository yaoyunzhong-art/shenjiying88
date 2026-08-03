# Quality Inspection 质检单

> 质检单管理服务，支持质检单的独立 CRUD 操作

## 功能
- 质检单 CRUD 管理
- 质检单状态跟踪

## 依赖
- AgentModule, TenantModule

## API
- POST /quality-inspection — 创建质检单
- GET /quality-inspection — 列表
- GET /quality-inspection/:inspectId — 详情
- PATCH /quality-inspection/:inspectId — 更新
- DELETE /quality-inspection/:inspectId — 删除
