# Tenant Config 租户配置

> 租户个性化配置服务，支持配置查询、工作台配置与批量操作

## 功能
- 租户配置查询
- Workbench 配置
- 批量配置操作

## 依赖
- PrismaModule, AgentModule

## API
- GET /tenant-config — 配置列表
- GET /tenant-config/effective — 生效配置
- GET /tenant-config/workbench/:code — Workbench 配置
- GET /tenant-config/:key — 配置详情
- POST /tenant-config/batch — 批量操作
