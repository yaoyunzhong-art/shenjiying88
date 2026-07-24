# finance — 财务管理

> 多租户零售平台财务管理模块，Payment 与 Refund 全生命周期管理，支持幂等键、乐观锁与状态机安全模式。

## 核心职责

- **Payment 管理**: 多支付渠道 (WECHAT/ALIPAY/CARD/CASH/BALANCE) 的 Payment 创建、状态流转 (PENDING → SUCCESS/FAILED → REFUNDED) 与筛选
- **Refund 管理**: 退款申请 (REQUESTED → APPROVED → COMPLETED/REJECTED) 的全流程管控
- **幂等键安全**: 前端自动生成 UUID 作为 idempotency-key，防止重复提交
- **乐观锁并发控制**: 所有 Payment/Refund 记录携带 version 字段，写入时校验乐观锁
- **财务子模块聚合**: 提供 Dashboard 概览、预算 (budget)、发票 (invoices)、对账 (reconciliation)、对账规则 (rules)、支出 (payouts)、损益 (profit-loss) 和明细详情 (`[id]`) 子路由

## 外部依赖

| 模块 | 用途 |
|------|------|
| `@m5/ui` | `Card`, `StatusBadge`, `Tabs` 等 UI 组件 |
| `@m5/sdk` | API 请求客户端 & 幂等键注入 |
| `@m5/types` | `Payment`, `Refund` 等业务类型 |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文初始化 |
| `apps/admin-web/app/components` | 通用组件 (DetailActionBar 等) |
| `apps/admin-web/app/analytics` | 财务数据分析联动 |
| `apps/admin-web/app/alerts` | 异常交易告警联动 |

## 页面路由

| 路由 | 说明 |
|------|------|
| `/finance` | 主页面：Payment & Refund 列表，支持状态/支付方式筛选和创建操作 |
| `/finance/dashboard` | 财务概览仪表盘：营收、支出、对账完成率等关键指标 |
| `/finance/budget` | 预算管理：预算编制、执行跟踪、偏差分析 |
| `/finance/invoices` | 发票管理：发票开具、查询、作废 |
| `/finance/reconciliation` | 对账管理：交易对账、差异定位、批量处理 |
| `/finance/reconciliation/discrepancies/[id]` | 对账差异详情：单笔差异深度分析 |
| `/finance/reconciliation/rules` | 对账规则：自动化对账规则配置 |
| `/finance/rules` | 财务规则：凭证规则、费用规则 |
| `/finance/payouts` | 支出管理：供应商付款、批量打款 |
| `/finance/profit-loss` | 损益分析：收入/成本/费用分维度展示 |
| `/finance/[id]` | 单笔交易详情：Payment/Refund 完整记录 |

## TODO

- [ ] 接入真实 API (当前为 Mock 数据)
- [ ] 管理员退款审批工作流 — 待接入治理流程
- [ ] Payment 超时自动清理 — Cron 超时清理任务
- [ ] 多币种汇率转换 (CNY/USD/HKD)
- [ ] 对账异常自动告警推送
- [ ] 财务节假日处理 + 到账延迟补偿
- [ ] 批量导出 (Excel/CSV) 支持
- [ ] 财务审计日志串联 (audit-trail 联动)
