# Task Scheduler 任务调度

> 任务调度管理服务，支持定时任务的创建、管理与监控

## 功能
- 定时任务 CRUD
- 任务状态管理

## 依赖
- AgentModule, TenantModule

## API
- POST /task-scheduler — 创建任务
- GET /task-scheduler — 任务列表
- GET /task-scheduler/:taskId — 详情
- PATCH /task-scheduler/:taskId — 更新
- DELETE /task-scheduler/:taskId — 删除
