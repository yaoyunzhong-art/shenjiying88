# Quality 质检

> 质量检验管理服务，支持检验计划的创建、执行与跟踪

## 功能
- 检验计划 CRUD
- 检验执行与状态跟踪

## 依赖
- QualityInspectionModule, AgentModule, TenantModule

## API
- POST /quality/inspections — 创建检验
- GET /quality/inspections — 列表
- GET /quality/inspections/:inspectId — 详情
- PATCH /quality/inspections/:inspectId — 更新
- DELETE /quality/inspections/:inspectId — 删除
