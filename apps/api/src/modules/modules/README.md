# Modules 模块管理

> 系统模块注册与发现服务，支持模块拓扑关系查询

## 功能
- 模块注册
- 模块列表与拓扑
- 模块健康检查

## 依赖
- AgentModule

## API
- POST /modules/register — 注册模块
- GET /modules — 模块列表
- GET /modules/topology — 拓扑关系
- GET /modules/:id — 模块详情
- GET /modules/:id/check — 健康检查
