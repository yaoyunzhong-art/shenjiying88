# Health 健康检查

> 系统健康检查服务，提供多层级健康状态探测

## 功能
- 综合健康检查
- Ping 探测
- 就绪状态检查

## 依赖
- LytModule, PrismaModule, AgentModule, FoundationModule, TenantModule

## API
- GET /health — 综合健康
- GET /health/ping — Ping 探测
- GET /health/readiness — 就绪状态
