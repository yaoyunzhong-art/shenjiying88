# V22 金额链一致性检查

> 日期: 2026-07-20
> 检查范围: Phase-35 Cashier 模块（OrderService / PaymentService / RefundService）+ Transactions 模块 + PaymentGateway 模块 + Prisma LYT 快照 + Storefront 前端收银台

## 金额口径总表

### 核心类型定义（packages/types/src/index.ts）

| 环节 | 类型字段 | TS 类型 | 精度 | 单位 | 验证规则 |
|:-----|:---------|:-------:|:----:|:----:|:--------|
| **订单-小计** | `Order.subtotalCents` | `number` | 整数分 | 分 | `∑(unitPriceCents × quantity)` |
| **订单-折扣** | `Order.discountCents` | `number` | 整数分 | 分 | 从 DTO 透传 |
| **订单-税** | `Order.taxCents` | `number` | 整数分 | 分 | 从 DTO 透传 |
| **订单-应付** | `Order.totalCents` | `number` | 整数分 | 分 | `subtotalCents - discountCents + taxCents` |
| **订单-已付** | `Order.paidCents` | `number` | 整数分 | 分 | 在 `markPaid()` 由 payment.amountCents 赋值 |
| **订单-已退** | `Order.refundedCents` | `number` | 整数分 | 分 | 在 `applyRefund()` 累加 |
| **支付-金额** | `Payment.amountCents` | `number` | 整数分 | 分 | 必须等于 order.totalCents（校验） |
| **退款-金额** | `Refund.amountCents` | `number` | 整数分 | 分 | `≤ paidCents - refundedCents`（校验） |
| **订单行-单价** | `OrderItem.unitPriceCents` | `number` | 整数分 | 分 | 从 DTO 透传 |
| **订单行-小计** | `OrderItem.subtotalCents` | `number` | 整数分 | 分 | `unitPriceCents × quantity` |
| **订单行-折扣** | `OrderItem.discountCents` | `number` | 整数分 | 分 | 从 DTO 透传 |

### LYT 快照（Prisma schema + Transactions entity）

| 环节 | 字段 | Prisma 类型 | Entity 类型 | 精度风险 |
|:-----|:-----|:-----------:|:-----------:|:--------|
| 订单快照-金额 | `LytOrderSnapshot.amount` | `Float` | `number` | ⚠️ **Float 浮点 → 精度风险** |
| 订单快照-折扣 | `LytOrderSnapshot.discountAmount` | `Float` | `number` | ⚠️ **Float 浮点 → 精度风险** |
| 订单快照-应付 | `LytOrderSnapshot.payableAmount` | `Float` | `number` | ⚠️ **Float 浮点 → 精度风险** |
| 支付快照-金额 | `LytPaymentSnapshot.amount` | `Float` | `number` | ⚠️ **Float 浮点 → 精度风险** |
| 订单快照-币种 | `currency` | `String` | `string` | ✅ |

### PaymentGateway 模块

| 环节 | 字段 | 类型 | 单位 |
|:-----|:-----|:----:|:----|
| 交易记录 | `amount` | `number` | `float` 元（如 99.99） |
| 退款请求 | `amount` | `number` | `float` 元，可选，不填则全退 |

### CashierService（Legacy in-memory）

| 环节 | 字段 | 类型 | 单位 |
|:-----|:-----|:----:|:----|
| 订单商品 | `CashierOrderItem.price` | `number` | `float` 元 |
| 订单总额 | `CashierOrder.totalAmount` | `number` | `float` 元 |
| 支付金额 | `CashierPayment.amount` | `number` | `float` 元 |

### Storefront 前端收银台（cashier/page.tsx）

| 环节 | 字段 | 来源 | 说明 |
|:-----|:-----|:----:|:-----|
| 商品单价 | `price` | `MOCK_PRODUCTS` 内联 | ⚠️ 全部内联 Mock，未调后端接口 |
| 小计 | `rawTotal` | `price × quantity` | Float 加法 |
| 会员折扣率 | `TIER_DISCOUNT` | 内联常量 | 金卡 0.9 / 银卡 0.95 / 普卡 1.0 |
| 折扣金额 | `discountAmount` | `rawTotal - round(rawTotal × rate)` | `Math.round` 取整 |
| 应付金额 | `finalTotal` | `rawTotal - discountAmount` | Float |
| 支付结果展示 | `messageText` | 模拟 | `fm(finalTotal)` 格式化 |

### Member Center 前端（member-center/page.tsx）

| 环节 | 字段 | 来源 | 说明 |
|:-----|:-----|:----:|:-----|
| 订单金额 | `order.amount` | 内联 Mock 数据 | ⚠️ 未调后端接口，硬编码 `128.0/56.5/399.0` |

---

## 金额计算链验证

### 新链路（Phase-35 Cashier — OrderService + PaymentService + RefundService）

```
CreateOrderInput.items[].unitPriceCents (分, int)
    → OrderItem.subtotalCents = unitPriceCents × quantity (分, int)
    → Order.subtotalCents = ∑ OrderItem.subtotalCents (分, int)
    → Order.discountCents = 透传 (分, int)
    → Order.taxCents = 透传 (分, int)
    → Order.totalCents = subtotalCents - discountCents + taxCents (分, int, 负值校验)
    → Payment.amountCents 必须 === order.totalCents (校验: amount_mismatch)
    → Order.paidCents = Payment.amountCents (分, int)
    → Refund.amountCents ≤ paidCents - refundedCents (校验: refund_exceeds_available)
    → Order.refundedCents += refundAmountCents (累加)
    → 全退: refundedCents ≥ paidCents → status = REFUNDED
    → 部分退: refundedCents < paidCents → status = PARTIALLY_REFUNDED
```

**✅ 满分一致。所有金额在 `Order` / `Payment` / `Refund` 类型中统一使用整数分（`*Cents: number`），无浮点运算。**

### 旧链路（CashierService — in-memory，已退役但仍存在）

```
CashierOrderItem.price (元, float)
    → computeCashierOrderTotal(): sum(price × quantity) (元, float)
    → CashierOrder.totalAmount (元, float)
    → CashierPayment.amount (元, float)
    → 无 discount、无 freight、无 payableAmount
    → source: 'memory' 仅存 Map
    → 无持久化
```

**⚠️ 旧 CashierService 使用 float 元，不参与新链。CashierController 中的 member/product/stats API 有 Mock 回落。**

### 支付网关链路（PaymentGateway — payment-gateway module）

```
PayRequest.amount (元, float)  →  生成 TransactionRecord
Refund 调 gateway.refund → REFUND_NOT_ALLOWED 校验 → refundAmount ≤ original.amount
```

**⚠️ PaymentGateway 的 amount 是 float 元（如 99.99），与 Cashier 新链的整数分分属两套体系，仅在 transactions module 的 callback/checkout 处桥接。**

### LYT 快照链路（Prisma persist）

```
LYT 同步 → LytOrderSnapshot（Prisma: Float / Entity: number）
  amount: Float     ← 订单原金额（元）
  discountAmount: Float  ← 折扣金额
  payableAmount: Float   ← 应付金额
→ TransactionsService.syncLytOrderSnapshot()
  → normalizeSnapshotNumber() 兜底处理
```

**⚠️ LYT 快照用 Prisma `Float` 存储金额，与 `Order` 的整数分体系不一致，存在浮点精度风险。`normalizeSnapshotNumber()` 提供基本保护但无精度校验。**

---

## 发现的问题

### 1. 两套金额体系并行（严重度: ⚠️ HIGH）

| 体系 | 模块 | 单位 | 类型 |
|:-----|:-----|:----:|:----|
| **新链（整数分）** | OrderService / PaymentService / RefundService | 分 | `number` (int) |
| **旧链（float 元）** | CashierService / PaymentGateway / LYT 快照 (Prisma) | 元 | `Float` / `number` (float) |

- CashierService（旧）使用 `price: number`、`totalAmount: number`（元）
- OrderService（新）使用 `unitPriceCents: number`、`totalCents: number`（分）
- PaymentGateway 的 amount 是 float 元（对接微信/支付宝传统单位）
- LYT 快照 Prisma 用 `Float` 类型存储金额

**影响:** CashierService.createPayment() 中 `input.amount ?? order.totalAmount` 传递的是 float 元，但 OrderService 接收的 `CreatePaymentInput.amountCents` 期望整数分，两者混用会导致金额不对。

### 2. 前端收银台全部内联 Mock（严重度: ⚠️ HIGH）

`apps/storefront-web/app/cashier/page.tsx`:
- 10 个商品、5 个会员的记录全部硬编码在组件内
- 金额计算完全在浏览器端（`quantity × price`），不受后端约束
- 支付成功后的回调模拟 `setTimeout(1500ms)`，不调后端 API
- Member Center 的订单金额同样硬编码 Mock

**影响:** AC-35-03（多件商品金额计算）、AC-35-05（会员折扣应用）均在前端完成，未经后端校验。无法保证后端收到的金额与前端展示一致。

### 3. LYT 快照 Float 精度风险（严重度: ⚠️ MEDIUM）

- Prisma `LytOrderSnapshot.amount` / `discountAmount` / `payableAmount` 使用 `Float`
- TypeScript Entity 对应 `number`
- `normalizeSnapshotNumber()` 处理入参但未做 Decimal → Number 的精度保护

**场景:** 金额 0.1 在 Float 中可能是 0.10000000149011612，多次累加后误差放大。

### 4. PaymentGateway 金额叠加无订单总金额校验（严重度: ⚠️ MEDIUM）

- `payment-gateway.service.ts` 的 `pay()` 仅校验 `amount > 0`，不校验与订单金额的一致性
- `refund()` 仅校验 `refundAmount ≤ original.amount`，不校验订单累计退款上限
- 真实的退款上限校验仅在 `RefundService.create()` 中通过 `availableCents` 检查实现

### 5. freight（运费）不存在（严重度: ⚠️ LOW）

- 整条金额链（Order / Payment / Refund / CashierService / PaymentGateway / 前端）均无 `freight` 或 `shipping` 字段
- freight 仅出现在 `ai-forecast` 模块的库存调拨场景中，与收银/支付链路无关
- 当前业务场景（街机/游艺厅 POS 收银）确实无运费需求，但若未来新增线上商城需注意补齐

---

## 每个字段的范围约束

| 路径 | 字段 | 最小值 | 最大值 | 校验位置 |
|:-----|:-----|:------:|:------:|:---------|
| Order.totalCents | `totalCents` | 0 | `Number.MAX_SAFE_INTEGER` | `create()`: `< 0 → BadRequest` |
| Payment.amountCents | `amountCents` | > 0 | `Number.MAX_SAFE_INTEGER` | `create()`: `≤ 0 → BadRequest`；`amountCents !== order.totalCents → BadRequest` |
| Refund.amountCents | `amountCents` | > 0 | `order.paidCents - order.refundedCents` | `create()`: `≤ 0 → BadRequest`；`> availableCents → BadRequest` |
| LytOrderSnapshot.amount | `Float` | `Math.max(0, input.amount)` | 无 | `syncLytOrderSnapshot()`: `normalizeSnapshotNumber` |
| CashierOrderItem.price | `number` | 无校验 | 无 | 无（旧链） |

---

## 建议修复项

### P1 立即修复（Blocking）
1. **前端接后端**: `cashier/page.tsx` 接入 `POST /cashier/orders` / `POST /cashier/orders/:id/payments`，下掉全部 Mock
2. **金额单位对齐**: 确认前端传入后端的单位是分还是元，统一使用整数分（Cents）

### P2 本周修复
3. **LYT Snapshot Decimal 化**: Prisma `LytOrderSnapshot.amount` / `discountAmount` / `payableAmount` 从 `Float` 改为 `Decimal(10,2)`，确保精度
4. **PaymentGateway 订单总金额校验**: 支付网关 `pay()` 增加 order lookup 校验 `amount === order.totalCents`

### P3 后续迭代
5. **CashierService 旧链清理**: 确认是否还有上游依赖后清理 `CashierService` / `CashierOrder` / `CashierPayment` 的 float 体系
6. **运费字段预留**: 若需增加运费，在 `Order` 中增加 `freightCents: number`，更新 `totalCents` 计算公式

---

## 结论

### ✅ 新链一致性：满分
`OrderService → PaymentService → RefundService` 的全链路金额全部使用整数分（`*Cents`），计算链完整、校验到位、状态机正确。

### ⚠️ 两套体系并行
旧 `CashierService`（float 元）+ `PaymentGateway`（float 元）+ LYT 快照（`Prisma Float`）与新 `OrderService`（整数分）并行运行，需要在桥接处（transactions.callback / syncSnapshot）做转换。

### ⚠️ 前端完全脱节
Storefront Cashier 和 Member Center 的金额逻辑全部在前端硬编码 Mock，未与后端形成金额链路闭环。
