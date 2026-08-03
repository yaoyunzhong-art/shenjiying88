# OpenAPI 接口文档

> OpenAPI 文档生成与密钥管理服务

## 功能
- API 文档获取
- API 密钥管理 (CRUD)
- 用量统计

## 依赖
- AgentModule

## API
- GET /openapi/docs — 文档
- POST /openapi/keys — 创建密钥
- GET /openapi/keys — 密钥列表
- DELETE /openapi/keys/:id — 删除密钥
- GET /openapi/usage — 用量统计
