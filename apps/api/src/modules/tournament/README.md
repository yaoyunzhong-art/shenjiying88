# Tournament 赛事

> 赛事管理服务，支持赛事的创建、状态管理与查询

## 功能
- 赛事 CRUD 管理
- 赛事状态更新

## 依赖
- AgentModule, TenantModule

## API
- POST /tournament — 创建赛事
- GET /tournament — 赛事列表
- GET /tournament/:tournamentId — 详情
- PATCH /tournament/:tournamentId — 更新
- PATCH /tournament/:tournamentId/status — 状态更新
