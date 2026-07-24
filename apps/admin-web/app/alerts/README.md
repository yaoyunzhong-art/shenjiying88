# alerts — 告警中心

> M5 平台统一治理告警中心，整合审批、审计、安全、运行时与恢复演练相关告警，支持确认/认领与下钻操作。

## 核心职责

- **治理告警聚合**: 统一展示审批、审计、安全、运行时与恢复演练等各类治理告警事件
- **告警确认/认领**: 支持一键确认 (ACK) 操作，提交至 Foundation 告警面板服务
- **多来源筛选**: 按告警来源 (approval/audit/security/runtime/drill) 和严重程度筛选
- **告警详情下钻**: 单条告警详情页 (`[id]`)，含告警上下文、关联事件和操作记录
- **离线兜底**: API 不可用时展示兜底数据 (fallback)，始终保障页面可渲染

## 外部依赖

| 模块 | 用途 |
|------|------|
| `@m5/types` | `FoundationAlertCatalogItem` 告警目录类型 |
| `@m5/sdk` | `createWebFoundationAlertPanelClientAccess` — 告警面板 API 访问 |
| `@m5/ui` | `FoundationAlertListPageSection`, `FoundationAlertAcknowledgeActionButton`, `DetailActionBar`, `EmptyState`, `LoadingSkeleton`, `ErrorBoundary` 等告警 UI 组件 |
| `apps/admin-web/app/bootstrap` | `loadAdminGovernanceReadModel` — 治理读模型加载 |
| `apps/admin-web/app/components/use-detail-actions` | 工作台收口动作 hooks (复制/导出/分享) |
| `apps/admin-web/app/analytics` | 异常指标联动分析 |
| `apps/admin-web/app/finance` | 异常交易联动告警 |

## 页面路由

| 路由 | 说明 |
|------|------|
| `/alerts` | 告警中心主页面 — 告警列表、统计摘要、确认操作 |
| `/alerts/[id]` | 单条告警详情页 — 告警上下文、关联事件、操作记录 |

## TODO

- [ ] 告警静默 (mute) — 支持按来源/规则临时静不告警
- [ ] 告警升级 (escalation) — 超时未确认自动升级通知层级
- [ ] 告警历史趋势 — 时序上告警频次变化可视
- [ ] 告警订阅 — 按告警来源/严重程度配置通知渠道 (邮件/Slack/钉钉)
- [ ] 恢复演练告警关联 — 演练计划与告警联动
- [ ] 告警影响面评估 — 自动计算受影响租户/品牌/门店范围
- [ ] 自定义告警规则 — 基于治理模型自定义触发条件
