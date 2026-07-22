# 神机营 SaaS 主状态表

> 最后更新: 2026-07-23 02:50
> 口径: 以当前代码现状为准，代码已回写，不再保留历史琐碎记录
> 当前聚焦: P3 收口（状态板/验收模板）

## 2026-07-22 批量去 Mock 成果

### storefront-web 交易主链（P0 全部完成）

| 模块 | 改造内容 | 状态 |
|------|----------|------|
| cashier 收银页 | 删除 paymentCodeUrl mock、二维码占位 | 🟢 已打通 |
| checkout 结算页 | 删除 defaultCart、VALID_COUPONS，商品/优惠券走后端 | 🟢 已打通 |
| orders 列表/详情 | 已真实 API，scope 改造完成 | 🟢 已打通 |
| h5/payment 支付页 | Image → QRCodeDisplay 组件 | 🟢 已打通 |

### 前端 scope 治理

| 文件 | 改造内容 | 状态 |
|------|----------|------|
| StorefrontScopePersistor | 新增 scope localStorage 持久化组件 | 🟢 已打通 |
| orders/page.tsx | resolveStorefrontScope + loadStorefrontOrders(scope) | 🟢 已打通 |
| orders/[id]/page.tsx | resolveStorefrontScope 传参 | 🟢 已打通 |
| h5/orders/page.tsx | resolveStorefrontScope 传参 | 🟢 已打通 |
| h5/payment/[orderId]/page.tsx | resolveStorefrontScope 传参 | 🟢 已打通 |
| h5/payment/result/page.tsx | resolveStorefrontScope 传参 | 🟢 已打通 |
| finance/page.tsx | resolveStorefrontScope 传参 | 🟢 已打通 |
| storefront-finance.ts | 去掉 DEFAULT_STOREFRONT_SCOPE 默认参数 | 🟢 已打通 |
| storefront-transactions.ts | buildStorefrontScopeHeaders + 导出 STOREFRONT_SCOPE_STORAGE_KEYS | 🟢 已打通 |

### API 支付网关改造

| 模块 | 改造内容 | 状态 |
|------|----------|------|
| PaymentGatewayService | simulateMode 门禁（生产禁止 mock 网关） | 🟢 已打通 |
| PaymentService | 无 channel 时抛 payment_channel_not_configured | 🟢 已打通 |

### P1 交易链扩展

| 模块 | 改造内容 | 状态 |
|------|----------|------|
| SDK 交易状态类型 | 新增 TransactionOrderStatus + TransactionPaymentStatus 字面量联合 | 🟢 已打通 |
| BusinessTransactionOrder.status | string → TransactionOrderStatus | 🟢 已打通 |
| BusinessTransactionPayment.status | string → TransactionPaymentStatus | 🟢 已打通 |
| orders 详情页退款 | 新增退款弹窗 + requestStorefrontRefund API | 🟢 已打通 |

### P2 会员权益

| 模块 | 改造内容 | 状态 |
|------|----------|------|
| 后端 GET /members/:id/balance | 新增余额/积分/优惠券数查询端点 | 🟢 已打通 |
| checkout 页会员权益 | 会员权益版块展示余额/积分/优惠券 | 🟢 已打通 |
| 测试回归 171+26 用例 | 全绿 | 🟢 通过 |

## 五项主线状态

| 主线 | 状态 | 进度 | 代码现状 | 下一步 |
|------|------|------|----------|--------|
| storefront-web 交易主链去 Mock | 🟢 已打通 | 100% | P0 全部完成，scope 治理全覆盖，测试全绿 | 配合真实支付网关 browser smoke |
| finance 持久化主链 | 🟢 已打通 | 99% | Prisma write-through + resolved 读写链，6 张表落库，HTTP E2E 全过 | `_prisma_migrations` 基线收口 |
| SDK contract 唯一真源 | 🟢 已打通 | 95% | 交易状态类型约束加固，finance contract 收口为 SDK 别名 | App 侧消费端迁移 |
| 退款闭环（P1） | 🟢 已打通 | 100% | 后端完整链 + SDK createRefund + 前端退款弹窗 + ledger 联动 | 无 |
| 会员权益接入收银（P2） | 🟢 已打通 | 100% | checkout 页会员权益展示 + 余额/积分查询端点 | 无 |
| 状态板/验收口（P3） | 🟢 已打通 | 100% | 本文件已更新为单主线视图；验收模板已沉淀 | 无 |

## P3 遗留项

- P3-01: ✅ 当前文件已更新为单主线视图，指定 `master-status-board.md` 为状态真源
- P3-02: ✅ 验收模板已沉淀：
  - `docs/knowledge/acceptance/_template-transaction-smoke.md` — 交易链 smoke 模板（6 大模块 25+ 用例）
  - `docs/knowledge/acceptance/_template-pre-release-check.md` — 发布前检查模板（5 维度 20+ 项）
