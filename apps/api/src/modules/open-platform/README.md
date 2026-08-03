# Open Platform 开放平台与 ISV

> WP-07 开放平台，管理第三方开发者、ISV 应用、API 密钥与计量计费

## 功能
- 开发者注册与管理
- ISV 应用上架与审核
- API 密钥生成/轮换/吊销
- 用量统计与计费结算
- SLA 协议管理

## 依赖
- AuditModule

## API
- POST /open-platform/developers — 注册开发者
- GET /open-platform/developers — 开发者列表
- GET /open-platform/developers/:id — 开发者详情
- POST /open-platform/apps — 创建应用
- GET /open-platform/apps — 应用列表
- GET /open-platform/apps/:id — 应用详情
- PATCH /open-platform/apps/:id/status — 应用状态变更
- POST /open-platform/keys/generate — 生成密钥
- POST /open-platform/keys/rotate — 轮换密钥
- POST /open-platform/keys/revoke — 吊销密钥
- GET /open-platform/usage — 用量统计
- POST /open-platform/usage/record — 记录用量
- POST /open-platform/billing — 计费查询
- POST /open-platform/sla — 创建 SLA
- GET /open-platform/sla — SLA 列表
- POST /open-platform/versions — 版本管理
