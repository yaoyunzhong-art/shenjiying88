# Shift Scheduler 排班

> 排班管理服务，支持排班创建、调整与查询

## 功能
- 排班 CRUD 管理
- 排班调整

## 依赖
- AgentModule, TenantModule

## API
- POST /shift-scheduler — 创建排班
- GET /shift-scheduler — 排班列表
- GET /shift-scheduler/:shiftId — 详情
- PATCH /shift-scheduler/:shiftId — 更新
- DELETE /shift-scheduler/:shiftId — 删除
