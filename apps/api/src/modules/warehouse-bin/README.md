# Warehouse Bin 库位

> 仓库库位管理服务，支持库位的创建、管理与维护

## 功能
- 库位 CRUD 管理
- 库位状态跟踪

## 依赖
- AgentModule, TenantModule

## API
- POST /warehouse-bin — 创建库位
- GET /warehouse-bin — 库位列表
- GET /warehouse-bin/:binId — 详情
- PATCH /warehouse-bin/:binId — 更新
- DELETE /warehouse-bin/:binId — 删除
