# P0 任务预检分析报告 (2026-07-22)

## TASK-P0-01: storefront 收银页彻底去 Mock ✅ 已完成

### 改动
- cashier/page.tsx — 删除 paymentCodeUrl state、mock URL、二维码占位区块

### 结论
已清理完毕。当前 cashier 页无任何 mock 残留。

---

## TASK-P0-02: checkout 金额与优惠主链收口 🚧 树哥执行中

### 现状诊断
- `defaultCart` 硬编码 5 个商品 — 全量 mock
- `VALID_COUPONS` 本地优惠券映射 — 全量 mock
- 金额计算完全本地做，不走后端

### 改造要点
1. 商品从 `listStorefrontCashierProducts()` 后端获取
2. 优惠券验证改走 `POST /coupons/redeem` 后端接口
3. 提交时后端 `POST /transactions/checkout` 计算最终金额
4. 前端保留金额展示 UI，但提交以后端为准

---

## TASK-P0-03: orders 列表/详情页彻底真实化 ✅ 现状已达标

### 列表页 (`orders/page.tsx`)
- ✅ 调 `loadStorefrontOrders()` → SDK `orders.listPage` → `GET /transactions/orders`
- ✅ 搜索、筛选、排序、分页、状态标签全部到位
- ✅ TriState loading/error/empty
- ⚠️ **数据来自内存 CashierService.orderStore**，重启后清空
  - 非代码问题，属于后端存储策略。前端不需要改动。

### 详情页 (`orders/[id]/page.tsx`)
- ✅ 调 `getStorefrontOrderTransaction(id)` → SDK `orders.get` → `GET /transactions/orders/:id`
- ✅ 用 `mapAggregateToOrderDetailView` 转换，显示基本信息、商品清单、退款记录
- ✅ 无任何 mock 残留

### 需要做的
- 确认"没有订单时的导购引导"（已有 EmptyState "暂无订单"）
- H5 端 (`h5/orders/page.tsx`) 同样使用 `loadStorefrontOrders()` 真 API，也无 mock
- **结论：P0-03 代码层面无需改动。** 如有验收需求，只需运行确认。

---

## TASK-P0-04: H5 支付页真实浏览器验收 ✅ 现状已达标

### 支付页 (`h5/payment/[orderId]/page.tsx`)
- ✅ 调 `getStorefrontOrderTransaction(orderId)` 真 API
- ✅ `mapAggregateToPaymentView` 从 aggregate 提取支付数据
- ✅ 二维码用 `payment.qrCode` 取自 `CashierPayment.qrCodeUrl`
- ✅ 5s 轮询刷新状态 + 倒计时 + 过期检测
- ✅ 失败态、加载态、空态全覆盖
- ✅ **前端代码无任何 mock** — 明确写了"当前页面不再前端伪造二维码"

### 唯一剩余问题：后端 QR fallback
- 后端的 `buildFallbackPrepay` 返回 `mock://qr/${orderId}`，这是一个非标准 URL，不是真实二维码
- 前端 `Image` 组件渲染会 404
- **这不是前端 mock，是后端 mock prepay 问题**

### 解决方案（P0-04 验收用）
1. 使用 `@m5/ui` 中已有的 **`QRCodeDisplay`** 组件（带 SVG 占位 QR 图案 — 基于 payload hash 生成 visual pattern）
2. H5 支付页中，当 `payment.qrCode` 存在时用 `QRCodeDisplay` 替换 `Image`
3. `QRCodeDisplay` 的 `src` prop 传入 `payment.qrCode`，fallback 到内置 SVG 占位

### 具体改动 (给树哥的指令)
```
在 h5/payment/[orderId]/page.tsx 中：
1. import { QRCodeDisplay } from '@m5/ui'
2. 替换二维码渲染区块：
   
   {payment.qrCode && payment.status === 'pending' && (
     <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
       <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
         请使用{getPaymentMethodLabel(selectedMethod)}扫码支付
       </div>
       <QRCodeDisplay
         value={payment.qrCode}
         type="payment"
         label={`${getPaymentMethodLabel(selectedMethod)}扫码支付`}
         size={180}
       />
       <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
         打开{getPaymentMethodLabel(selectedMethod)}扫一扫完成支付
       </div>
     </H5Card>
   )}

3. 删除 import { Image } from 'next/image'（不再需要）
```

---

## P0 各任务改造量评级

| 任务 | 实际需改动文件 | 预估改动行 | 评级 |
|------|---------------|-----------|------|
| P0-01 | 1 个前端文件 | ~20 行 | 🟢 极轻 |
| P0-02 | 1~2 个前端文件 | ~100 行 | 🟡 中等 |
| P0-03 | 0 个文件（已达标） | 0 行 | 🟢 无需改 |
| P0-04 | 1 个前端文件 | ~15 行 | 🟢 极轻 |

**P0-03 无需改动，P0-01 已落地，P0-04 极轻。** 最大头的就是 P0-02。

## H5 端额外发现的注意事项

### `h5/orders/page.tsx`
- ✅ 使用 `loadStorefrontOrders()` 真实 API
- ✅ 筛选、状态展示、金额格式化
- ✅ 无 mock，可真实验收

### `h5/payment/[orderId]/result/page.tsx`（支付结果页）
- 未检查，如果是展示支付成功/失败结果，大概率也干净

---

## P1 预览

### P1-01: 支付状态语义统一
- 主要在后端：统一 `CashierPaymentStatus` / `BusinessTransactionAggregate.payment.status` 与前端 `RuntimePaymentStatus`
- 后端 `getRuntimePaymentStatus` 函数已存在且封装在 `storefront-transactions.ts`
- 改造量中等

### P1-02: 退款闭环
- 后端 `CashierController` 已有 `POST /orders/:id/refunds`
- `TransactionsController` 已有完整退款审批链
- 前端 orders 详情页已展示退款记录
- 核心要补的是：退款发起 UI + 退款完成后的状态回写证据
