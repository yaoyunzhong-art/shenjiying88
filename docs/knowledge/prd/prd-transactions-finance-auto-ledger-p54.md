# PRD-018: Transactions 自动落财务流水 — Auto Finance Ledger (P-54 Phase 80)

> 版本: v1.0 · 签发人: 树哥 · 对接主线: V5.1 / Top1 / P-54
> 发布日期: 2026-07-20 · 状态: 🟢 已签发
> 关联 PRD: `PRD-017 Checkout 收入主链闭环`

---

## 1. 业务背景

`storefront` 的 `checkout -> h5 payment -> result` 已基本切到真实交易接口，但核心收入主链还缺最后一段:

- 支付成功后，`transactions` 没有自动写入 `finance revenue ledger`
- 退款审核完成后，`transactions` 没有自动写入 `finance refund ledger`
- 财务页是否真数据化，必须建立在 ledger 已真实沉淀的前提上

如果这段不补齐，系统仍然只是“能收款”，不是“可核算、可对账、可追溯”的产品态。

## 2. 成功标准

- 支付成功时自动生成一条 revenue ledger
- 退款完成时自动生成一条 refund ledger
- 同一支付回调、同一退款审批重复触发时不重复落账
- API 层有回归测试覆盖自动落账行为
- 验收卡回写本轮命令、结果、风险与下一步

## 3. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-18-01 | 支付成功自动记收入 | P0 | `TransactionsService.applyPaymentCallback()` 在支付成功后自动写 `REVENUE` ledger |
| RQ-18-02 | 退款完成自动记退款 | P0 | `TransactionsService.approveRefund()` 在退款完成后自动写 `REFUND` ledger |
| RQ-18-03 | 自动落账幂等防重 | P0 | 同一 `paymentId` / `refundId` 重复触发不新增第二条 ledger |
| RQ-18-04 | 模块依赖正式接线 | P0 | `TransactionsModule` 正式引入 `FinanceModule`，Nest DI 可解析 |
| RQ-18-05 | API 回归固化 | P0 | `transactions.service.test.ts` 与 `transactions.e2e.test.ts` 覆盖收入/退款自动落账 |

## 4. 范围

### In Scope

- `apps/api/src/modules/transactions/transactions.module.ts`
- `apps/api/src/modules/transactions/transactions.service.ts`
- `apps/api/src/modules/transactions/transactions.service.test.ts`
- `apps/api/src/modules/transactions/transactions.e2e.test.ts`
- `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md`

### Out of Scope

- `finance ledger` 持久化模型大重构
- T+1 对账内部支付源接通
- storefront 财务页真数据化 UI 改造
- 发票、结算、税务的产品化延展

## 5. 技术方案

1. `TransactionsModule` 引入 `FinanceModule`
2. `TransactionsService` 注入 `FinanceService`
3. `applyPaymentCallback()` 成功后检查 `REVENUE + paymentId` 是否已存在
4. 如不存在，则调用 `recordTransactionRevenue()`
5. `approveRefund()` 完成后检查 `REFUND + refundId` 是否已存在
6. 如不存在，则调用 `recordTransactionRefund()`

## 6. 风险与回滚

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| 重复支付回调导致重复落账 | 高 | 以 `type + orderId + transactionId + category` 做最小幂等检查 |
| 引入 FinanceModule 影响 transactions DI | 中 | 补 module test，先验证 Nest 可解析 |
| 财务内存实现与后续持久化口径不一致 | 中 | 本轮只补自动接线，不扩散到 reconciliation / invoice |

### 回滚原则

- 若自动落账引发异常，优先回滚 `TransactionsService` 中的 finance 调用
- 不回滚已经打通的 storefront 真支付主链
- 验收卡保留失败证据与回滚点说明

## 7. 测试策略

- 单测:
  - `apps/api/src/modules/transactions/transactions.service.test.ts`
  - `apps/api/src/modules/transactions/transactions.module.test.ts`
- API / E2E:
  - `apps/api/src/modules/transactions/transactions.e2e.test.ts`
- 验收:
  - 回写 `2026-07-20-p54-checkout-revenue-acceptance.md`

## 8. 完成定义

满足以下条件才算本轮完成:

1. 已有 PRD、需求卡、kickoff
2. 支付成功自动落收入流水
3. 退款完成自动落退款流水
4. 同一事件不重复落账
5. 测试通过且无新增 diagnostics
