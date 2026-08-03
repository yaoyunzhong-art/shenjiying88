# 审计日志模块 (Audit)

## 用途
全量审计追踪：审计日志记录（单条/批量）、多维查询与分页、异常行为检测、风险评分计算、结算事件追踪、报告导出、GDPR Article 30 合规报告生成。支持多租户隔离与角色 API 授权。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /api/audit` | 创建审计日志 |
| `POST /api/audit/batch` | 批量创建 |
| `GET /api/audit` | 分页查询（多维过滤） |
| `GET /api/audit/:id` | 日志详情 |
| `GET /api/audit/user/:userId` | 用户活动轨迹 |
| `GET /api/audit/anomalies/detect` | 异常行为检测 |
| `GET /api/audit/risk-score/:actorId` | 风险评分计算 |
| `POST /api/audit/export` | 导出审计报告 |
| `GET /api/audit/compliance-report/:tenantId` | 合规报告 |

## 测试位置
`apps/api/src/modules/audit/` — **11** 个测试文件：控制器/DTO/Entity/Service 单测、E2E、圈梁测试、角色权限测试（3 个版本 + API 级别）。
