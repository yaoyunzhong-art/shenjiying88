# P-54 Phase 80 · Transactions 自动落财务流水需求卡
> 创建: 2026-07-20 · PRD-018: Auto Finance Ledger (v1.0)
> 状态: 🟡 已签发，开发中

## 业务概述
本卡只打一仗: 把 `transactions` 的支付成功与退款完成，正式挂到 `finance ledger`，让 `storefront checkout` 收入主链从“真收款”升级到“真记账”。

## 唯一主线

### 1️⃣ Payment Revenue Ledger
- **入口**: `TransactionsService.applyPaymentCallback()`
- **目标**: 支付成功后自动写 `REVENUE` ledger
- **护栏**: 同一 `paymentId` 不允许重复落账

### 2️⃣ Refund Ledger
- **入口**: `TransactionsService.approveRefund()`
- **目标**: 退款完成后自动写 `REFUND` ledger
- **护栏**: 同一 `refundId` 不允许重复落账

### 3️⃣ Module Wiring
- **模块**: `TransactionsModule`
- **目标**: 正式引入 `FinanceModule`
- **护栏**: `transactions.module.test.ts` 需验证依赖接线

### 4️⃣ API Regression
- **测试**: `transactions.service.test.ts`、`transactions.e2e.test.ts`
- **目标**: 服务层 + HTTP 层都能看见真实 ledger 落地结果

## 关键文件

```text
apps/api/src/modules/transactions/transactions.module.ts
apps/api/src/modules/transactions/transactions.service.ts
apps/api/src/modules/transactions/transactions.service.test.ts
apps/api/src/modules/transactions/transactions.e2e.test.ts
docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md
```

## 验证命令

```bash
pnpm --dir apps/api exec vitest run src/modules/transactions/transactions.module.test.ts src/modules/transactions/transactions.service.test.ts src/modules/transactions/transactions.e2e.test.ts
```

## 完成判定

- 自动 revenue ledger 已落
- 自动 refund ledger 已落
- 幂等防重已覆盖
- 模块接线测试通过
- 验收卡已回写
