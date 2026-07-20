# 2026-07-20 · P-54 Checkout 收入主链验收卡

> 目标: 为 `P-54` 补齐 `checkout -> h5 payment -> transactions -> finance` 的真实闭环验收证据
> 范围: `storefront checkout`、`h5 payment`、`transactions callback`、`finance ledger`
> 验收方式: 单测 + API 回归 + 跨模块链路验证 + 页面结果核对
> 结论: `🟡 Phase 90 storefront finance 真数据页已落代码并完成定向回归，待跨模块联调`

---

## 本轮目标

1. Checkout 页面提交创建真实订单
2. H5 支付页读取真实订单金额
3. 支付成功后真实写回交易状态
4. 支付/退款自动落财务流水
5. 财务页展示真实摘要或流水

---

## 执行命令

```bash
pnpm --dir apps/storefront-web exec node --import tsx --test app/checkout/page.test.tsx 'app/h5/payment/[orderId]/page.test.tsx' 'app/h5/payment/[orderId]/result/page.test.tsx'
```

```bash
pnpm --dir apps/storefront-web test
```

```bash
pnpm --dir apps/api test
```

```bash
pnpm --dir apps/api exec vitest run src/modules/transactions/transactions.module.test.ts src/modules/transactions/transactions.service.test.ts src/modules/transactions/transactions.e2e.test.ts
```

```bash
pnpm --dir apps/admin-web exec vitest run app/__e2e__/cross-module-journey-37-storefront-checkout-api.test.ts app/__e2e__/cross-module-journey-38-api-checkout-payment-refund.test.ts
```

```bash
pnpm --dir apps/storefront-web exec node --import tsx --test app/finance/page.test.ts
```

---

## 执行结果

```text
[storefront-web]
- checkout/page.test.tsx: 76/76 通过
- h5/payment/[orderId]/page.test.tsx: 已切换为真实 transactions helper 映射测试并通过
- h5/payment/[orderId]/result/page.test.tsx: 已切换为真实订单状态映射测试并通过

[本轮实现]
- checkout 页面已接入 /members/register + /transactions/checkout
- h5 payment 页面已接入 /transactions/orders/:orderId 真查单
- h5 payment 确认支付已接入 /transactions/payments/standardized-callback
- result 页面已移除 query string 假状态，改为真实订单聚合查询

[api]
- transactions.module.test.ts: 2/2 通过
- transactions.service.test.ts: 新增自动 revenue/refund ledger 护栏并通过
- transactions.e2e.test.ts: 新增支付成功/退款完成自动落账断言并通过

[本轮新增实现]
- TransactionsModule 已正式引入 FinanceModule
- TransactionsService 支付成功路径已自动落 revenue ledger
- TransactionsService 退款完成路径已自动落 refund ledger
- 已增加最小幂等防重，避免同一 paymentId/refundId 重复落账

[finance page]
- finance/page.test.ts: 7/7 通过
- storefront finance 页面已接入 `loadStorefrontFinanceDashboard()`
- 页面摘要来自真实 `/finance/revenue/summary`
- 页面流水来自真实 `/finance/ledgers`
- 趋势图已改为基于真实 ledger 的近 6 个月 UTC 聚合
- 页面已补齐 loading / error / empty / retry 三态护栏
```

---

## 判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| Checkout 创建真实订单 | 🟡 | 代码已接入真实 `/transactions/checkout`，待联调验证真实返回 |
| H5 支付页读取真实金额 | 🟡 | 代码已接入真实 `/transactions/orders/:orderId`，待联调验证真实金额展示 |
| 支付成功标准回调 | 🟡 | 代码已接入真实 `/transactions/payments/standardized-callback`，待联调验证支付态更新 |
| Revenue ledger 自动落账 | ✅ | 支付成功路径已自动写入 revenue ledger，并有 service/e2e 护栏 |
| Refund ledger 自动落账 | ✅ | 退款完成路径已自动写入 refund ledger，并有 service/e2e 护栏 |
| 财务页接真实摘要/流水 | ✅ | `finance/page.tsx` 已切至真实 `summary + ledgers` 接口，`finance/page.test.ts` `7/7` 通过 |
| storefront 回归通过 | ✅ | checkout/h5/payment 定向回归通过，finance 页面定向回归 `7/7` 通过 |
| api 回归通过 | ✅ | `transactions.module/service/e2e` 定向回归通过 |
| 跨模块链路通过 | ⬜ | 待执行 |

---

## 产物

- PRD: [prd-checkout-revenue-p54.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/prd/prd-checkout-revenue-p54.md)
- PRD: [prd-transactions-finance-auto-ledger-p54.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/prd/prd-transactions-finance-auto-ledger-p54.md)
- PRD: [prd-storefront-finance-page-p54.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/prd/prd-storefront-finance-page-p54.md)
- 需求卡: [2026-07-20-P54-checkout-revenue.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/requirement-cards/2026-07-20-P54-checkout-revenue.md)
- 需求卡: [2026-07-20-P54-finance-auto-ledger.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/requirement-cards/2026-07-20-P54-finance-auto-ledger.md)
- 需求卡: [2026-07-20-P54-storefront-finance-page.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/requirement-cards/2026-07-20-P54-storefront-finance-page.md)
- Kickoff: [kickoff.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/phases/p54/kickoff.md)
- Kickoff: [phase-80-finance-auto-ledger-kickoff.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/phases/p54/phase-80-finance-auto-ledger-kickoff.md)
- Kickoff: [phase-90-storefront-finance-page-kickoff.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/phases/p54/phase-90-storefront-finance-page-kickoff.md)

---

## 结论

- `P-54 Phase 40%` 前端主链已从假提交流程切到真实交易接口，且 storefront 定向回归已通过
- `P-54 Phase 80` 已完成 `transactions -> finance` 自动落账最小闭环，支付成功和退款完成都会自动形成 ledger
- `P-54 Phase 90` 已完成 `storefront-web/finance` 真数据页接线，真实摘要、真实流水、真实趋势与页面三态均已落地
- 下一步应继续补 `checkout/payment/refund -> finance page` 的跨模块联调证据，完成整条收入主链的最终验收
