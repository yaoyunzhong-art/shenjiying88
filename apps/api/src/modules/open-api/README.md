# Open API 开放 API

> 外部开放 API 网关，提供认证、同步、命令下发与客户端管理

## 功能
- API 认证
- 数据同步
- 命令下发
- 客户端管理

## 依赖
- AgentModule

## API
- POST /open-api/auth — 认证
- POST /open-api/verify — 验证
- POST /open-api/sync — 同步
- POST /open-api/command — 命令下发
- GET /open-api/clients — 客户端列表
