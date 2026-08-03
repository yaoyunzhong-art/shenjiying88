# Salary 薪酬

> 薪酬计算与管理服务，支持工资计算、提交与查询

## 功能
- 薪酬计算
- 薪酬提交
- 薪酬列表与查询

## 依赖
- AgentModule

## API
- POST /salary/calculate — 计算薪酬
- POST /salary/submit/:id — 提交薪酬
- GET /salary/:id — 详情
- GET /salary/list — 列表
- DELETE /salary/:id — 删除
