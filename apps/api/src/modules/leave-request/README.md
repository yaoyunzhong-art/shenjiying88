# Leave Request 请假申请

> 员工请假管理服务，支持请假申请、审批与取消

## 功能
- 请假申请提交
- 申请列表与详情
- 审批与取消

## 依赖
- AgentModule, TenantModule

## API
- POST /leave-request — 提交申请
- GET /leave-request — 申请列表
- GET /leave-request/:leaveId — 申请详情
- PATCH /leave-request/:leaveId/approve — 审批
- PATCH /leave-request/:leaveId/cancel — 取消
