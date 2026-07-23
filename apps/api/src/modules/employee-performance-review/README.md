# Employee Performance Review 员工绩效评估

> 员工绩效评估报告服务

## 功能
- 绩效评估报告管理
- 评估统计概览
- 报告 CRUD

## 依赖
- AgentModule, TenantModule

## API
- GET /employee-performance-review — 报告列表
- GET /employee-performance-review/summary — 统计概览
- GET /employee-performance-review/:id — 报告详情
- POST /employee-performance-review — 创建报告
- DELETE /employee-performance-review/:id — 删除报告
