# 神机营 SaaS 主状态表

> 最后更新: 2026-07-21 23:28
> 口径: 以当前代码现状为准，PRD / 任务 / 验收文档为辅助对照
> 当前聚焦: 下一批最该补的 5 项

## 今日 V23 审计条件关闭（2026-07-21 21:22）

| 条件 | 类型 | 验证结果 |
|------|------|----------|
| ✅ Gate5-C1: deviceToken持久化 | code+DB | PushRecordEntity (TypeORM @Entity) + push_records 表 — 已验证 |
| ✅ Gate6-C1: 恶化熔断机制 | 脚本 | scripts/fail-safe-meltdown.sh — 存在+语法通过 |
| ✅ G11#5: 知识退化机制 | 脚本+数据 | scripts/knowledge-decay.sh + decay-report-2026-07-21.md (297卡片, 6引用) — 已验证 |

## 状态口径

| 状态 | 含义 |
|------|------|
| 🟢 已打通 | 功能已落地，主链已接真，剩余主要为体验或扩展 |
| 🟡 推进中 | 已有代码与局部真接线，但仍存在 Mock / 内存态 / 双口径 |
| 🔴 未完成 | 仍以 Mock、兼容壳或规划为主，离主链可用较远 |

## 五项主线状态

| 主线 | 当前状态 | 进度 | PRD / 任务口径 | 代码现状 | 验收口径 | 下一步 |
|------|----------|------|----------------|----------|----------|--------|
| storefront-web / orders 去 Mock | 🟡 推进中 | 70% | 缺独立 storefront orders 收口任务 | 2026-07-21 已切到真实订单列表 + 真实聚合详情，且旧版 `page.test.tsx` Mock 断言已改为真实接口口径；本轮继续把 `app/h5/orders/page.tsx` 从 legacy `order-service` 改为直接复用 `storefront-orders.ts` 的真实列表 helper，页面不再依赖 `MOCK_ORDERS` / 假商品明细字段；同时 `lib/order-service.ts` 已移除网络异常 mock 回退，改为明确 `NETWORK_ERROR / INVALID_RESPONSE` 失败语义，并同步更新 `order-service.test.ts` 与 `h5/orders/page.test.tsx`；随后又把 `app/h5/payment/[orderId]/page.tsx` 与 `storefront-transactions.ts` 的前端伪二维码 / 前端直推支付成功链路移除，页面改为只消费真实订单支付状态、自动轮询刷新，并仅在后端返回二维码字段时透传展示，`h5/payment/[orderId]/page.test.tsx` 也已同步改成“默认无伪二维码、仅透传后端二维码”护栏；最新继续把真实二维码字段从 `CashierService.createPayment()` 主链接通：`CashierPayment` 已新增 `qrCodeUrl/paymentUrl/expiresAt`，创建支付时会按渠道归一化生成 prepay 元数据并持久化，`transactions` 聚合与 `@m5/sdk` 的 `BusinessTransactionPayment` 也已同步透传；随后 storefront `mapAggregateToPaymentView()` 已改为优先消费后端 `qrCodeUrl/paymentUrl/expiresAt`，仅在缺失时才兼容本地过期时间推导，`cashier.service.test.ts`、`transactions.service.test.ts`、`transactions.contract.test.ts`、`cashier.contract.test.ts` 与 `h5/payment/[orderId]/page.test.tsx` 已补齐字段护栏 | 缺独立页面验收卡，且真实支付网关二维码字段浏览器 smoke / runtime 证据仍未补齐 | 补浏览器 smoke 与真实分页/空态/失败态验证，并继续推进 H5 payment runtime 验收及真实网关回归证据 |
| storefront-web / cashier 商品会员去 Mock | 🟡 推进中 | 68% | P-35 主链已签发，Web 端数据层开始独立收口 | 已完成真实 checkout、真实会员 lookup、真实商品目录接口；页面内 `MOCK_PRODUCTS` 已移除 | 仅主链 PRD 验收，不足以覆盖 Web 端商品目录加载态/失败态 | 补浏览器验证与商品目录空态/失败态验收证据 |
| finance 持久化主链 | 🟡 推进中 | 90% | PRD-007 已签发，任务表 `T168-finance` 状态失真 | 2026-07-21 已把 `FinanceService` 的 `ledger/account/settlement` 补成 Prisma write-through / resolved read-through，`FinanceController` 对账户/结算也开始优先走持久化链；随后给 `FinanceReportService` 补了 `createReportResolved / regenerateReportResolved` 与报表聚合 resolved 读链，`FinanceReportController` 也开始优先走 resolved 主链；`finance-report.service.test.ts`、`finance-report-data-aggregation.test.ts` 已补 resolved 护栏，`finance.e2e.test.ts` 的 `/finance/reports` 也已改为复用真实 `FinanceReportController` 主链；本轮继续把 `invoice` 改成 Prisma 优先写透 + resolved 读写链，并补齐 report/export 的 Prisma schema、正式 migration SQL 与 `list/get/delete/export/getExportResult` resolved 持久化接缝，同时补了 fake Prisma delegate 级持久化护栏；随后又补了 delegate-backed HTTP e2e，直接覆盖 `/finance/reports` 的 create/list/get/export/delete 真路由，并修复了内存 fallback 下导出结果缺失租户隔离的问题，补齐 service + e2e 护栏；最新继续收紧导出正确性，显式拒绝尚未实现的 `EXCEL/PDF`，避免假成功空内容，并补上“删除报表后导出结果失效”的 service / controller / e2e 护栏；随后又把 report/export 的 controller 裸 `Error` 映射成明确的 `404/409/501` HTTP 语义，并继续把 `FinanceReportService` 的核心业务错误原地收口为 `NotFoundException / ConflictException / NotImplementedException`，同步补强 service 异常类型护栏；本轮再补删除链半失败一致性修复：当 `deleteMany` 已成功但 `report delete` 落库失败时，立即清理本地 export 缓存，避免 controller fallback 读到已失效导出，并新增 service 护栏锁住该场景 | P-54 验收只覆盖 checkout revenue 可见性，不等于 finance 全域持久化完成；当前已补静态诊断、schema、migration 文件、service delegate 护栏、导出结果租户隔离、导出格式正确性、service/controller 双层 HTTP 异常语义、删除链半失败缓存一致性与 HTTP 主链 delegate-backed e2e，但 Prisma migrate/generate 和真实 DB runtime 证据仍缺 | 继续执行 Prisma migration / generate，并补真实 DB 级回归证据与剩余 finance runtime 验收 |
| transactions / finance / sdk contract 唯一真源 | 🟡 推进中 | 90% | P-54 与共享收口零散分布 | SDK 已新增 `BusinessFinanceLedgerRecord`、`BusinessRevenueSummary`、`BusinessFinanceAccountRecord`、`BusinessFinanceSettlementRecord`、`BusinessFinanceInvoiceRecord`、`BusinessDailyRevenueSummary`，且 `finance.contract.ts` 已把 ledger/account/settlement/invoice/revenue/daily contract 收口为 SDK 类型别名，`createBusinessClient().finance` 也补齐了账户/结算/发票/日营收入口 | 缺单独 contract 收口验收，Web / App 侧尚未全面改吃新 finance client | 继续让 finance Web / App 消费端改吃 SDK 真源，并补 `invoice / daily` 的消费端回归与验收证据 |
| PRD / 任务 / 验收 主状态表 | 🟡 推进中 | 58% | `prd-index`、`phase-progress`、`TASKS_STATUS` 多套并存 | 当前文件已开始按代码现实回写五项主线，并明确标出文档失真点与下一步 | 验收卡分散，状态不统一 | 指定本文件为单主线视图，后续每轮开发都回写 |

## 证据文件

### storefront-web / orders
- 列表页: `apps/storefront-web/app/orders/page.tsx`
- 详情页: `apps/storefront-web/app/orders/[id]/page.tsx`
- 共享视图层: `apps/storefront-web/lib/storefront-orders.ts`

### storefront-web / cashier
- 页面: `apps/storefront-web/app/cashier/page.tsx`
- 交易 helper: `apps/storefront-web/lib/storefront-transactions.ts`
- cashier API: `apps/api/src/modules/cashier/cashier.controller.ts`

### finance / transactions / contract
- finance 服务: `apps/api/src/modules/finance/finance.service.ts`
- finance 报表服务: `apps/api/src/modules/finance/finance-report.service.ts`
- finance 报表控制器: `apps/api/src/modules/finance/finance-report.controller.ts`
- finance e2e: `apps/api/src/modules/finance/finance.e2e.test.ts`
- finance report migration: `apps/api/prisma/migrations/20260721113000_add_finance_report_persistence/migration.sql`
- finance contract: `apps/api/src/modules/finance/finance.contract.ts`
- transactions 服务: `apps/api/src/modules/transactions/transactions.service.ts`
- SDK contract: `packages/sdk/src/index.ts`
- storefront finance helper: `apps/storefront-web/lib/storefront-finance.ts`
- Prisma schema: `apps/api/prisma/schema.prisma`

### 文档状态
- PRD 索引: `docs/knowledge/prd/prd-index.md`
- Phase 进度: `docs/knowledge/phase-progress.md`
- 任务汇总: `.trae/tasks/TASKS_STATUS.md`
- P-54 验收卡: `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md`

## 当前单主线判断

1. 优先把 `storefront-web/orders` 和 `storefront-web/cashier` 两个 Web 交易入口彻底去 Mock。
2. 并行推进 `finance` 持久化最小闭环，防止 Web 真接线后仍落到内存态。
3. 继续把 `transactions / finance / sdk` 的 contract 收到一套真源，减少 App / Web / SDK 三套字段漂移。
4. 后续每轮开发结束，都必须同步更新本文件，不再只更新 `phase-progress` 或零散验收卡。
