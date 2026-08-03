# DB Knowledge 数据库知识库

> 数据库知识检索服务，支持专家知识、文档与脉冲信号查询

## 功能
- 数据库状态监控
- 知识语义搜索
- 文档与专家查询
- 信号脉冲监控

## 依赖
- AgentModule

## API
- GET /db-knowledge/status — 服务状态
- GET /db-knowledge/search — 知识搜索
- GET /db-knowledge/documents/:kind — 文档查询
- GET /db-knowledge/experts — 专家列表
- GET /db-knowledge/pulses — 脉冲信号
