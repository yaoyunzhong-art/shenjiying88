# DevOps DevOps 工具

> DevOps 集成服务，管理 CI/CD 流水线与运维状态

## 功能
- 系统状态监控
- 流水线管理 (CRUD)
- 部署流水线触发

## API
- GET /devops/status — 系统状态
- GET /devops/pipelines — 流水线列表
- POST /devops/pipelines — 创建流水线
- GET /devops/pipelines/:id — 流水线详情
- PUT /devops/pipelines/:id — 更新流水线
