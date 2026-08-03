# Stock 库存

> 库存管理服务，支持库存查询、入库与调整

## 功能
- 库存列表与详情
- 库存入库
- 库存调整

## 依赖
- AgentModule

## API
- GET /stock — 库存列表
- GET /stock/:id — 详情
- POST /stock — 入库
- PUT /stock/:id — 更新
- POST /stock/:id/adjust — 调整
