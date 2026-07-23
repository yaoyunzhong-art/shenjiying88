# Content 内容管理

> 通用内容管理服务，支持内容的创建、发布、版本管理与 Slug 路由

## 功能
- 内容 CRUD 管理
- Slug 路径解析
- 内容版本支持

## 依赖
- AgentModule

## API
- POST /content — 创建内容
- GET /content — 内容列表
- GET /content/:id — 内容详情
- GET /content/slug/:slug — 按 Slug 查询
- PUT /content/:id — 更新内容
