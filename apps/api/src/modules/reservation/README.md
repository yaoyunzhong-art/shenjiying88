# Reservation 预约

> 预约管理服务，支持预约创建、资源查询与按用户/资源检索

## 功能
- 预约 CRUD 管理
- 按用户查询
- 按资源查询

## 依赖
- AgentModule, TenantModule

## API
- POST /reservation — 创建预约
- GET /reservation — 预约列表
- GET /reservation/:id — 详情
- GET /reservation/by-user/:userId — 按用户
- GET /reservation/by-resource/:resourceId — 按资源
