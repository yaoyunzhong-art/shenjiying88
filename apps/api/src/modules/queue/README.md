# Queue 排队

> 排队管理服务，支持排队加入、离开、叫号与服务管理

## 功能
- 排队加入
- 离开排队
- 叫号
- 服务开始/完成

## 依赖
- AgentModule, TenantModule

## API
- POST /queue/join — 加入排队
- POST /queue/:entryId/leave — 离开
- POST /queue/call-next — 叫号
- POST /queue/:entryId/start-service — 开始服务
- POST /queue/:entryId/complete — 完成服务
