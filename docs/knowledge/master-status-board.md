# 神机营 SaaS 主状态表

> 最后更新: 2026-07-21
> 口径: 以当前代码现状为准，PRD / 任务 / 验收文档为辅助对照
> 当前聚焦: 下一批最该补的 5 项

## 状态口径

| 状态 | 含义 |
|------|------|
| 🟢 已打通 | 功能已落地，主链已接真，剩余主要为体验或扩展 |
| 🟡 推进中 | 已有代码与局部真接线，但仍存在 Mock / 内存态 / 双口径 |
| 🔴 未完成 | 仍以 Mock、兼容壳或规划为主，离主链可用较远 |

## 五项主线状态

| 主线 | 当前状态 | 进度 | PRD / 任务口径 | 代码现状 | 验收口径 | 下一步 |
|------|----------|------|----------------|----------|----------|--------|
| storefront-web / orders 去 Mock | 🟡 推进中 | 62% | 缺独立 storefront orders 收口任务 | 2026-07-21 已切到真实订单列表 + 真实聚合详情，且旧版 `page.test.tsx` Mock 断言已改为真实接口口径 | 缺独立页面验收卡 | 补浏览器 smoke 与真实分页/空态/失败态验证 |
| storefront-web / cashier 商品会员去 Mock | 🟡 推进中 | 68% | P-35 主链已签发，Web 端数据层开始独立收口 | 已完成真实 checkout、真实会员 lookup、真实商品目录接口；页面内 `MOCK_PRODUCTS` 已移除 | 仅主链 PRD 验收，不足以覆盖 Web 端商品目录加载态/失败态 | 补浏览器验证与商品目录空态/失败态验收证据 |
| finance 持久化主链 | 🟡 推进中 | 55% | PRD-007 已签发，任务表 `T168-finance` 状态失真 | 2026-07-21 已把 `FinanceService.recordLedger` 与 `list/getRevenueSummary/getDailyRevenue` 主读链补成 Prisma write-through / read-through，`transactions.service` 的自动落账幂等判断也开始走持久化读链；`account / settlement` 仍未整体切完 | P-54 验收只覆盖 checkout revenue 可见性，不等于 finance 全域持久化完成 | 继续把 account / settlement 也接入 Prisma，并补真实 DB 级回归证据 |
| transactions / finance / sdk contract 唯一真源 | 🟡 推进中 | 76% | P-54 与共享收口零散分布 | SDK 已新增 `BusinessFinanceLedgerRecord`、`BusinessRevenueSummary`，`storefront-finance` 已改为复用 SDK finance contract + `createBusinessClient().finance.*` | 缺单独 contract 收口验收 | 继续补 finance/account/settlement contract 入 SDK，并清理剩余 Web/App 内联 finance 类型 |
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
