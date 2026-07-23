# Maintenance Plan 维护计划

> 设备维护计划管理服务，支持计划的创建、排期与状态管理

## 功能
- 维护计划 CRUD
- 计划状态更新

## 依赖
- AgentModule, TenantModule

## API
- POST /maintenance-plan — 创建计划
- GET /maintenance-plan — 计划列表
- GET /maintenance-plan/:planId — 详情
- PATCH /maintenance-plan/:planId — 更新
- PATCH /maintenance-plan/:planId/status — 更新状态
