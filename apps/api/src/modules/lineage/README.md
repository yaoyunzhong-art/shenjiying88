# Lineage 数据血缘

> 数据血缘追踪服务，支持字段注册、血缘关系管理与影响分析

## 功能
- 字段注册
- 血缘关系定义
- 上游/下游追踪
- 变更影响分析

## 依赖
- AgentModule

## API
- POST /lineage/fields/register — 注册字段
- POST /lineage/edges — 创建血缘关系
- GET /lineage/lineage/:tableName/:fieldName — 血缘查询
- GET /lineage/downstream/:tableName/:fieldName — 下游追踪
- POST /lineage/impact — 影响分析
