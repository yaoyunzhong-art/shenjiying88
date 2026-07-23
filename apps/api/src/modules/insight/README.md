# Insight 洞察分析

> 洞察分析服务，支持报表生成、模板管理与缓存管理

## 功能
- 洞察报告生成
- 报表模板管理
- 缓存管理

## 依赖
- AiModelConfigModule, AgentModule

## API
- POST /insight/generate — 生成洞察
- GET /insight/list — 洞察列表
- GET /insight/templates — 模板列表
- GET /insight/:id — 洞察详情
- POST /insight/cache/prune — 缓存清理
