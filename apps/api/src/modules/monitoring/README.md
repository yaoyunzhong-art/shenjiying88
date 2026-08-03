# 监控告警模块 (Monitoring)

## 用途
系统监控与告警引擎。支持自定义指标采集、聚合查询、告警规则配置与触发，以及告警分级静默管理。对接 TenantGuard 实现多租户隔离指标数据。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /monitoring/metrics` | 指标定义列表 |
| `POST /monitoring/metrics/record` | 单点指标记录 |
| `POST /monitoring/metrics/record-batch` | 批量指标记录 |
| `GET /monitoring/metrics/:name` | 指标详情 + 时序点 + 平均值 |
| `POST /monitoring/rules/create` | 创建告警规则 |
| `GET /monitoring/alerts` | 告警列表（按状态筛选） |
| `POST /monitoring/alerts/:id/silence` | 告警静默 |
| `GET /monitoring/alerts/:id/audit` | 告警操作审计 |

## 测试位置
`apps/api/src/modules/monitoring/` — **18** 个测试文件（controller/spec、service/spec、DTO、entity、module、contract、ringbeam、e2e、stress、simulator、role、phase-p42）。
