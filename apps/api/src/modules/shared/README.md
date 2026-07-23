# Shared 共享服务

> 跨租户共享服务，提供健康检查、审计日志与租户验证

## 功能
- 健康检查
- 审计日志查询
- 租户合法性校验

## 依赖
- AgentModule

## API
- GET /shared/health — 健康检查
- GET /shared/audit — 审计日志
- GET /shared/audit/all — 全部审计
- GET /shared/audit/:id — 审计详情
- POST /shared/validate-tenant — 租户验证
