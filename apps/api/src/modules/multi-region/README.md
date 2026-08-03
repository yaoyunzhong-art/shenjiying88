# Multi Region 多区域

> 多区域部署管理服务，支持区域端点管理与路由

## 功能
- 区域端点 CRUD
- 区域路由

## 依赖
- AgentModule

## API
- GET /multi-region/endpoints — 端点列表
- GET /multi-region/endpoints/:region — 区域端点
- POST /multi-region/endpoints — 创建端点
- PATCH /multi-region/endpoints/:region — 更新端点
- GET /multi-region/route — 路由查询
