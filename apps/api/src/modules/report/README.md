# Report 自定义报表

> 自定义报表服务，支持报表创建、查询与数据导入

## 功能
- 报表管理 (CRUD)
- 报表查询
- 数据导入

## 依赖
- AgentModule

## API
- GET /report/list — 报表列表
- GET /report/:id — 报表详情
- POST /report/create — 创建报表
- POST /report/query — 查询数据
- POST /report/ingest — 数据导入
