# SVIP 超级会员

> 超级会员管理服务，支持 SVIP 方案、订阅与取消

## 功能
- SVIP 方案管理
- 用户订阅管理
- 订阅取消

## 依赖
- AgentModule

## API
- POST /svip/plans — 创建方案
- GET /svip/plans — 方案列表
- POST /svip/subscribe — 订阅
- GET /svip/subscription/:userId — 查询订阅
- POST /svip/:subscriptionId/cancel — 取消
