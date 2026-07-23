# Notice 公告管理

> 运营公告管理服务，支持公告创建、发布与查询

## 功能
- 公告 CRUD 管理
- 公告发布
- 已发布公告查询

## 依赖
- AgentModule, TenantModule

## API
- POST /notice — 创建公告
- GET /notice — 公告列表
- GET /notice/published — 已发布
- GET /notice/:id — 详情
- PATCH /notice/:id — 更新
