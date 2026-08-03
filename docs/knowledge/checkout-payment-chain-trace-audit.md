# 收银支付主链穿透审计表

## 1. 目的

本表用于把收银支付主链按“收银 -> 结算 -> H5 支付 -> 交易回调 -> 财务落账 -> 财务控制面”逐节点拆开，识别当前真实闭环与主断点位置。

本表对应跨端断点 `GAP-LINK-0002`，用于支撑收入闭环、财务可信度和后续 `M2 / M3` 的排期判断。

## 2. 目标闭环

目标链：

1. TOC 收银台
2. TOC 结算页
3. H5 支付页 / 结果页
4. API 交易主链
5. API 财务落账
6. Admin 财务控制面
7. TOB 经营财务视图

当前总判定：

- `部分通`

原因：

- TOC 收银、结算、H5 支付和 API 交易 / 财务落账主链已基本打通。
- 当前主断点不在执行面，而在 Admin 财务控制面仍混有 `mock / fallback`。

## 3. 逐节点穿透表

| 节点 | 路径 / 模块 | 当前状态 | 说明 | 证据等级 |
| --- | --- | --- | --- | --- |
| `PAY-01` | 收入闭环 PRD / 需求卡 | 已冻结 | 需求已冻结为 `checkout -> h5 payment -> callback -> ledger -> finance page` | `B` |
| `PAY-02` | `apps/storefront-web/app/cashier/page.tsx` | 已通 | 收银页会创建真实交易并跳 H5 支付页 | `A` |
| `PAY-03` | `apps/storefront-web/app/checkout/page.tsx` | 已通 | 结算页真实调用 checkout helper，成功后跳 `/h5/payment/{orderId}` | `A` |
| `PAY-04` | `apps/storefront-web/lib/storefront-transactions.ts` | 已通 | helper 实际打到 `POST /transactions/checkout`，并可读取订单聚合 | `A` |
| `PAY-05` | `apps/storefront-web/app/h5/payment/[orderId]/page.tsx` | 已通 | H5 支付页按真实订单聚合渲染，并轮询刷新支付状态 | `A` |
| `PAY-06` | `apps/storefront-web/app/h5/payment/[orderId]/result/page.tsx` | 已通 | 支付结果页基于真实聚合渲染，不依赖 query string 假状态 | `A` |
| `PAY-07` | `apps/api/src/modules/transactions/transactions.controller.ts` | 已通 | 已具 checkout、订单读取、标准化支付回调、退款申请 / 审批链 | `A` |
| `PAY-08` | `apps/api/src/modules/transactions/transactions.service.ts` | 已通 | 支付成功与退款审批完成都可触发财务流水写入 | `A` |
| `PAY-09` | `apps/api/src/modules/cashier/cashier.controller.ts` | 部分通 | 仍保留 POS / cashier 补链能力，与 `transactions` 并存 | `A` |
| `PAY-10` | `apps/api/src/modules/finance/finance.controller.ts` | 已通 | 后端已开放 ledger、summary、settlement 等真实接口 | `A` |
| `PAY-11` | `apps/api/src/modules/finance/finance.service.ts` | 已通 | 财务服务已以 ledger 为真源汇总营收，并支持收入 / 退款自动落账 | `A` |
| `PAY-12` | `apps/storefront-web/app/finance/page.tsx` | 已通 | TOC 财务回看页已接真实 summary 与 ledgers | `A` |
| `PAY-13` | `apps/admin-web/app/finance/page.tsx` | 断点 | 虽有门禁，但数据仍是 mock fetch + 本地数组 | `A` |
| `PAY-14` | `apps/admin-web/app/finance/[id]/page.tsx` | 断点 | 详情页以 `MOCK_PAYMENT / MOCK_REFUNDS` 初始化 | `A` |
| `PAY-15` | `apps/admin-web/app/finance/payouts/page.tsx` | 断点 | 页面里明确写 `Mock fetch` 与 `Mock API` | `A` |
| `PAY-16` | `apps/admin-web/app/finance/rules/page.tsx` | 断点 | 请求失败回退 `DEFAULT_RULES` | `A` |
| `PAY-17` | `apps/tob-web` 财务经营视图 | 部分通 | 更偏经营分析面，不是财务控制面 | `A` |

## 4. 关键断点

| gapId | 断点 | 当前表现 | 影响 |
| --- | --- | --- | --- |
| `GAP-PAY-0001` | 主断点在 Admin 财务控制面 | 首页、详情、payouts、rules 仍存在 mock / fallback | 无法证明“交易结果已进入可信控制面” |
| `GAP-PAY-0002` | `transactions` 与 `cashier` 双轨并存 | 两套控制器都覆盖交易相关语义 | 口径与职责边界存在分裂风险 |
| `GAP-PAY-0003` | TOB 财务页不是主控制面 | TOB 更偏经营视图，而不是财务操作真面 | 容易误把经营看板当财务闭环证据 |
| `GAP-PAY-0004` | Admin 财务二级子域可信度不一致 | payouts/rules 等页和后端真源没有完全拉齐 | 财务复签结论不稳 |

## 5. 当前冻结结论

1. 当前最可信的收入真链是：
   - `TOC cashier / checkout`
   - `H5 payment`
   - `API transactions`
   - `API finance ledger`
2. 当前不能宣称“收银支付主链已完全闭环”，因为 Admin 财务控制面仍未完全接真。
3. 当前 TOB 财务视图只能作为经营补充视角，不能替代 Admin 财务控制面。

## 6. 修复优先级

### 6.1 P0

- 把 `apps/admin-web/app/finance/page.tsx` 改为真实 `finance` 接口消费
- 把 `apps/admin-web/app/finance/[id]/page.tsx` 改为真实 payment/refund 详情消费
- 把 `finance/payouts`、`finance/rules` 去掉 mock / fallback，改成真实接口

### 6.2 P1

- 收束 `transactions` 与 `cashier` 在收银支付链中的正式分工
- 补一张“交易执行面 / 财务控制面 / 经营视图”三层边界说明

## 7. 下一步执行建议

1. 以 `transactions -> finance ledger` 作为正式收银支付主链。
2. 优先把 Admin 财务控制面接到真实财务真源。
3. 对 payouts、rules、detail 等页追加 `real / fallback / mock` 状态标记。
4. 完成后再回扫 TOB 财务视图，避免反过来用经营看板当控制面验收。

## 8. 关联文档

- `docs/knowledge/triple-end-requirement-current-state-alignment.md`
- `docs/knowledge/cross-end-link-breakpoints.md`
