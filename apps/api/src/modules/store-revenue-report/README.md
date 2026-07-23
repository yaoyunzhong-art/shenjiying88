# Store Revenue Report 门店营收报告

> 门店营收统计报告服务

## 功能
- 营收报告管理
- 按门店汇总

## 依赖
- AgentModule, TenantModule

## API
- POST /store-revenue-report — 创建报告
- GET /store-revenue-report — 报告列表
- GET /store-revenue-report/:id — 详情
- DELETE /store-revenue-report/:id — 删除
- GET /store-revenue-report/views/store/:storeId/summary — 门店汇总
