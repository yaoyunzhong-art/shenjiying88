# Bootstrap 引导模块

> 系统启动引导模块，提供健康检查、元数据与模块注册能力

## 功能
- 系统健康检查
- 元数据获取
- 模块列表与注册

## 依赖
- AgentModule, TenantModule

## API
- GET /bootstrap/health — 健康检查
- GET /bootstrap/metadata — 元数据
- GET /bootstrap/modules — 模块列表
- GET /bootstrap/modules/:module — 模块详情
- POST /bootstrap/modules/register — 注册模块
