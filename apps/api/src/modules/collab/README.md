# Collab 协作

> 项目协作管理服务，支持项目创建、状态统计与成员管理

## 功能
- 项目 CRUD 管理
- 项目状态统计
- 项目成员协作

## 依赖
- AgentModule, TenantModule

## API
- POST /collab — 创建项目
- GET /collab — 项目列表
- GET /collab/count-by-status — 按状态统计
- GET /collab/:projectId — 项目详情
- PATCH /collab/:projectId — 更新项目
