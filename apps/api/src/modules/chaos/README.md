# Chaos 混沌工程

> 混沌工程实验平台，支持故障注入实验的创建、运行与暂停

## 功能
- 混沌实验管理 (CRUD)
- 实验运行与暂停
- 实验状态查询

## API
- POST /chaos/experiments — 创建实验
- GET /chaos/experiments — 实验列表
- GET /chaos/experiments/:id — 实验详情
- POST /chaos/experiments/:id/run — 运行实验
- POST /chaos/experiments/:id/pause — 暂停实验
