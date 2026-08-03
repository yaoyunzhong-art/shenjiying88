# Performance Review 绩效评审

> 绩效评审管理服务，支持评审创建、评分与状态管理

## 功能
- 评审 CRUD 管理
- 评分管理
- 状态流转

## 依赖
- AgentModule, TenantModule

## API
- POST /performance-review — 创建评审
- GET /performance-review — 评审列表
- GET /performance-review/:reviewId — 详情
- PATCH /performance-review/:reviewId/scores — 评分
- PATCH /performance-review/:reviewId/status — 状态更新
