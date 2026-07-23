# License Renewal 许可证续期

> 许可证续期管理服务，支持续期记录管理与通知

## 功能
- 续期记录管理 (CRUD)
- 续期状态更新
- 续期通知

## 依赖
- AgentModule

## API
- POST /license-renewal/records — 创建续期记录
- GET /license-renewal/records — 记录列表
- GET /license-renewal/records/:id — 记录详情
- PATCH /license-renewal/records/:id/status — 更新状态
- POST /license-renewal/notifications — 发送通知
