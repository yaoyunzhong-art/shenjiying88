# Terminal 终端

> 终端设备管理服务，支持终端注册、心跳、状态查询与绑定

## 功能
- 终端注册
- 心跳上报
- 终端状态查询
- 终端绑定/解绑

## 依赖
- AgentModule, TenantModule

## API
- POST /terminal/register — 注册终端
- POST /terminal/:id/heartbeat — 心跳
- GET /terminal/:id/status — 状态
- POST /terminal/bind — 绑定
- POST /terminal/unbind — 解绑
