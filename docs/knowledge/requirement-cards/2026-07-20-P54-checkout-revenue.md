# P-54 Checkout 收入主链 · PRD 摘要卡
> 创建: 2026-07-20 · PRD-017: Checkout Revenue Chain (v1.0)
> 状态: 🟡 Phase 已签发，待开发

## 业务概述
P-54 目标是把 `storefront-web` 的 `checkout -> h5 payment -> finance` 三段断链收成一条真实收入主线，让神机营在 C 端与 H5 入口也具备“真订单、真支付、真记账、真回查”的闭环能力。

## 唯一主线

### 1️⃣ Checkout 真订单创建
- **页面**: `apps/storefront-web/app/checkout/page.tsx`
- **目标**: 提交时调用 `POST /transactions/checkout`
- **输出**: 真实 `orderId`、真实订单创建结果、失败重试提示

### 2️⃣ H5 Payment 真聚合支付
- **页面**: `apps/storefront-web/app/h5/payment/[orderId]/page.tsx`
- **目标**: 先查 `GET /transactions/orders/:orderId` 再展示金额、订单号、支付信息
- **输出**: 真实金额展示、真实状态驱动、取消写死 `9999`

### 3️⃣ Result 真状态回查
- **页面**: `apps/storefront-web/app/h5/payment/[orderId]/result/page.tsx`
- **目标**: 按真实订单/支付状态渲染结果页
- **输出**: 防 query string 伪成功、防前端自报成功

### 4️⃣ Finance 自动落账
- **模块**: `apps/api/src/modules/transactions` + `apps/api/src/modules/finance`
- **目标**: 支付成功自动记 revenue ledger，退款完成自动记 refund ledger
- **输出**: 交易与财务口径一致、可对账、可追踪

### 5️⃣ Storefront 财务最小真页面
- **页面**: `apps/storefront-web/app/finance/page.tsx`
- **目标**: 至少接入真实营收摘要和按订单查询流水
- **输出**: 不再全页 mock，能看到真实收退款结果

## 当前结论
- 当前问题不是“完全没有 checkout/payment/finance 能力”
- 当前真实现状是:
  - `transactions` 主链已存在，可复用
  - `finance` 有记账入口，但没自动挂进交易主链
  - `storefront-web` 端仍存在本地表单提交、写死金额、假状态跳转、mock 财务页
- 所以这不是从零开发，而是**把已经存在的三段能力真正接成一条真链**

## 关键文件
```text
apps/storefront-web/app/checkout/page.tsx
apps/storefront-web/app/h5/payment/[orderId]/page.tsx
apps/storefront-web/app/h5/payment/[orderId]/result/page.tsx
apps/storefront-web/app/finance/page.tsx
apps/storefront-web/lib/payment-service.ts
apps/api/src/modules/transactions/transactions.controller.ts
apps/api/src/modules/transactions/transactions.service.ts
apps/api/src/modules/finance/finance.controller.ts
apps/api/src/modules/finance/finance.service.ts
```

## 开发拆解

### Phase 40%
- Checkout 页面提交真实订单
- H5 支付页读取真实订单聚合
- 去掉支付页写死金额

### Phase 60%
- 支付成功统一走 standardized callback
- Result 页改为真状态查询
- storefront 相关单测补齐

### Phase 80%
- Transactions 支付/退款路径自动落账
- Finance 摘要/流水接口接入 storefront 财务页
- 补 API/跨模块回归

### Phase 100%
- 验收卡落地
- 生成验收证据
- 纳入上线前 release bundle

## 测试覆盖目标
- storefront 单测:
  - `checkout/page.test.tsx`
  - `h5/payment/[orderId]/page.test.tsx`
- api 回归:
  - `transactions.controller.test.ts`
  - `transactions.e2e.test.ts`
  - `finance.service.test.ts`
- 跨模块验收:
  - `cross-module-journey-37-storefront-checkout-api.test.ts`
  - `cross-module-journey-38-api-checkout-payment-refund.test.ts`

## 验证命令
```bash
pnpm --dir apps/storefront-web test
pnpm --dir apps/api test
```
