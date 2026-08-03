# PRD-017: Checkout 收入主链闭环 — Checkout Revenue Chain (P-54)

> 版本: v1.0 · 签发人: 树哥 · 对接主线: V5.1 / Top1
> 发布日期: 2026-07-20 · 状态: 🟢 已签发
> 关联 Phase: P-54

---

## 1. 业务背景

### 1.1 为什么要做

当前 `storefront-web` 的 `checkout -> h5 payment -> finance` 仍然是三段分离状态:

- `checkout` 页面主要停留在本地表单提交与本地金额计算
- `h5 payment` 页面金额存在前端写死与 query string 回传风险
- `finance` 后端有记账能力，但支付成功/退款成功后未自动落账

这会导致神机营在“能收钱、能回单、能记账、能对账”这条最核心收入主链上出现断裂。`POS/Pad` 主链已经接近产品态，`storefront` 必须补齐同等级真闭环，才能支撑 V5.1 的统一经营主线。

### 1.2 成功标准

- `checkout` 提交后创建真实订单，拿到真实 `orderId`
- `h5 payment` 页面金额来自真实订单聚合，不允许前端伪造
- 支付成功统一走 `transactions standardized callback`
- 退款完成后自动记录财务退款流水
- 财务页至少能看见真实营收摘要与订单流水
- 前端、后端、跨模块测试均有回归护栏

---

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-54-01 | Checkout 创建真实订单 | P0 | `storefront-web/checkout` 提交调用 `POST /transactions/checkout`，成功返回真实 `orderId` |
| RQ-54-02 | H5 支付页读取真实订单 | P0 | `h5/payment/[orderId]` 首屏查询 `GET /transactions/orders/:orderId`，金额、订单号、状态来自真实聚合 |
| RQ-54-03 | 支付成功写回交易主链 | P0 | 前端不再用 `status=success` 伪造结果，支付成功统一调用 `POST /transactions/payments/standardized-callback` |
| RQ-54-04 | 交易成功自动落财务收入流水 | P0 | `TransactionsService` 在支付成功路径调用财务记账能力，至少形成 revenue ledger |
| RQ-54-05 | 退款成功自动落财务退款流水 | P0 | 退款完成路径自动形成 refund ledger，且金额口径与 `transactions` 一致 |
| RQ-54-06 | 财务页展示真实摘要与流水 | P1 | `storefront-web/finance` 至少接入真实营收摘要和按订单查询流水，不再全页 mock |
| RQ-54-07 | Checkout 结果页真状态查询 | P1 | 支付结果页根据真实订单/支付状态渲染，不依赖 query string 假状态 |
| RQ-54-08 | 主链回归与验收固化 | P0 | 补齐 storefront/API/跨模块回归测试，并生成验收卡与命令证据 |

---

## 3. 验收卡

| 卡ID | 场景 | 前置 | 预期 |
|:----|:-----|:-----|:-----|
| AC-54-01 | Checkout 创建订单 | 购物车内有有效商品 | 成功返回真实 `orderId`，前端跳转到真实支付页 |
| AC-54-02 | 支付页金额取真实订单 | 已创建订单 | 页面展示金额等于后端聚合金额，不出现前端写死金额 |
| AC-54-03 | 支付成功回调 | 模拟支付成功回调 | 订单状态变为已支付，列表/详情可查询 |
| AC-54-04 | 财务收入落账 | 支付成功 | `finance` 中存在对应 revenue ledger |
| AC-54-05 | 退款成功落账 | 已支付订单发起退款并完成审核 | `finance` 中存在 refund ledger，金额与交易口径一致 |
| AC-54-06 | 财务页查看真实摘要 | 已存在收入与退款流水 | 页面展示真实汇总，不再仅显示本地 mock |
| AC-54-07 | 支付结果页防伪造 | 手工拼接 `status=success` | 页面仍以真实订单状态为准，不误报成功 |
| AC-54-08 | 网络失败降级 | API 故障或超时 | 页面展示明确失败/重试提示，不静默伪成功 |

---

## 4. 范围

### 4.1 In Scope

- `apps/storefront-web/app/checkout/page.tsx`
- `apps/storefront-web/app/h5/payment/[orderId]/page.tsx`
- `apps/storefront-web/app/h5/payment/[orderId]/result/page.tsx`
- `apps/storefront-web/app/finance/page.tsx`
- `apps/storefront-web/lib/payment-service.ts`
- `apps/api/src/modules/transactions/*`
- `apps/api/src/modules/finance/*`

### 4.2 Out of Scope

- 第三方支付网关正式商业化接入
- 税务规则全面升级与多司法辖区税码
- 财务大屏与完整老板驾驶舱重构
- 订阅计费、SaaS billing、平台发票体系

---

## 5. 数据与契约原则

- 订单真源: `transactions`
- 支付状态真源: `transactions standardized callback`
- 财务真源: `finance ledger`
- 退款金额口径: 仅 `COMPLETED` 计入已退款金额
- 支付渠道展示: 前端统一走 `normalizePaymentChannel()`
- 订单号、支付金额、退款时间: 一律取真实聚合，不吃本地假值

---

## 6. 技术方案

### 6.1 最小闭环

1. `checkout` 创建真实订单
2. 跳转真实 `orderId` 支付页
3. 支付页先查真实订单再展示金额
4. 支付成功走标准化回调
5. `transactions` 更新订单支付态
6. `transactions` 调用 `finance` 记收入流水
7. 退款完成时调用 `finance` 记退款流水
8. `finance` 页面读取真实摘要与流水

### 6.2 实施约束

- 不允许继续新增“前端成功页假跳转”
- 不允许支付页金额继续保留写死常量
- 不允许财务页继续扩 mock，而不先接真实摘要
- 优先复用现有 `transactions` 主链，不另造一套 checkout/pay 状态机

---

## 7. 风险与回滚

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| storefront 接线后打破现有页面回归 | 高 | 先补测试，再改主提交流程；分步接 `checkout -> payment -> finance` |
| finance 自动落账与现有内存实现冲突 | 高 | 先接最小 revenue/refund 入口，不扩大 invoice/reconciliation 改动面 |
| 支付结果页真查询导致旧测试失效 | 中 | 同步改测试，移除对 query string 假成功的依赖 |
| 跨模块依赖引入新类型错误 | 中 | 每步后跑 `storefront/api` 相关回归并做诊断检查 |

### 回滚原则

- 允许按页面粒度回滚 storefront 页面接线
- 不回滚已验证通过的 `transactions` 真实口径
- 若财务自动落账引发连锁问题，优先临时关闭自动落账调用，保留交易主链

---

## 8. 测试与验收策略

- 前端单测:
  - `apps/storefront-web/app/checkout/page.test.tsx`
  - `apps/storefront-web/app/h5/payment/[orderId]/page.test.tsx`
- 后端回归:
  - `apps/api/src/modules/transactions/transactions.controller.test.ts`
  - `apps/api/src/modules/transactions/transactions.e2e.test.ts`
  - `apps/api/src/modules/finance/finance.service.test.ts`
- 跨模块链:
  - `apps/admin-web/app/__e2e__/cross-module-journey-37-storefront-checkout-api.test.ts`
  - `apps/admin-web/app/__e2e__/cross-module-journey-38-api-checkout-payment-refund.test.ts`

---

## 9. 完成定义

满足以下条件才算 `P-54` 完成:

1. 已有 PRD、需求卡、kickoff、验收卡
2. storefront checkout/h5 payment/result/finance 接真实链
3. 支付成功和退款成功均自动落财务流水
4. 回归测试通过，且无新增 diagnostics
5. 产出验收证据文档，能直接纳入上线包
