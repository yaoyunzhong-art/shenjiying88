# Deploy 部署管理

> 应用部署管理服务，支持部署计划、预检与资源管理

## 功能
- 部署计划管理
- 部署预检
- 资源编排与部署

## 依赖
- AgentModule

## API
- POST /deploy/plan — 创建计划
- GET /deploy/plan/:planId — 计划详情
- POST /deploy/preflight — 部署预检
- POST /deploy/resources — 资源管理
- POST /deploy/plan/:planId/deploy — 执行部署
