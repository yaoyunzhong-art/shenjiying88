# Chain 结算链路

> 结算链路管理服务，支持结算创建、审批、执行与取消

## 功能
- 结算单管理
- 审批流转
- 结算执行与取消

## 依赖
- AgentModule

## API
- POST /chain/settlements — 创建结算
- POST /chain/settlements/:id/approve — 审批结算
- POST /chain/settlements/:id/execute — 执行结算
- POST /chain/settlements/:id/cancel — 取消结算
- GET /chain/settlements/:id — 结算详情
