# LYT 飞天数据

> 飞天运营数据管理服务，支持 Fixtures 查询、对比与导入预览

## 功能
- Fixtures 数据查询
- 数据对比分析
- 导入预览

## 依赖
- AgentModule, TenantModule

## API
- GET /lyt/fixtures — Fixtures 列表
- GET /lyt/fixtures/summary — 摘要
- GET /lyt/fixtures/:key — 详情
- POST /lyt/fixtures/:key/compare — 对比
- POST /lyt/fixtures/:key/import-preview — 导入预览
