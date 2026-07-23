# 支付网关模块 (Payment Gateway)

## 模块概述

支付网关模块（T117-3 本地化支付）负责对接第三方支付渠道，提供统一的支付接入层。支持多地区、多币种、多支付方式的智能路由，以及完整的支付生命周期管理（发起 → 查询 → 退款 → 对账）。

## 核心功能

| 功能 | 描述 |
|------|------|
| **支付发起** | 对接 6 种支付提供商，统一接口发起支付 |
| **支付结果查询** | 按交易 ID 实时查询支付状态 |
| **退款处理** | 支持全额退款和部分退款，自动化退款生命周期 |
| **Webhook 验证** | 每个支付渠道的回调签名验证，确保安全性 |
| **支付路由** | 按用户所在地区智能推荐支持的支付方式 |
| **钱包余额** | 内置本地钱包服务，支持余额支付与充值 |
| **多租户隔离** | 所有交易通过 RLS 多租户（tenantId）隔离 |

### 支持的支付提供商

| 提供商 | 支持地区 | 支持币种 | Webhook 验证 |
|--------|---------|---------|-------------|
| PayPal | 全球（欧美日等） | USD, JPY, HKD, SGD 等 | PayPal-Transmission-Sig 验签 |
| Stripe | 全球 | CNY, USD, JPY, HKD, THB 等 | Stripe-Signature HMAC 验签 |
| PayPay | 日本 | JPY | x-paypay-result-code 验签 |
| 支付宝 | 中国大陆、香港 | CNY, HKD | x-signature 验签 |
| 微信支付 | 中国大陆、香港 | CNY, HKD | x-signature 验签 |
| 本地钱包 | 所有地区 | 所有支持币种 | 无需 Webhook |

### 支付状态机

```
pending → processing → completed
                       → failed
                       → cancelled
pending → refunded
completed → refunded
refunded → (终止态)
```

## 接口说明

### REST API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/payment-gateway/pay` | 发起支付 |
| GET | `/payment-gateway/pay/:id` | 查询支付结果 |
| POST | `/payment-gateway/refund` | 发起退款 |
| GET | `/payment-gateway/refund/:id` | 查询退款状态 |

所有接口受 `TenantGuard` 保护，需在 Header 中传递 `x-tenant-id`。

### 跨模块合约 (Contract)

模块通过 `payment-gateway.contract.ts` 暴露以下合约类型供其他模块消费：

- `PaymentTransactionContract` — 交易合约
- `RefundRecordContract` — 退款记录合约
- `WalletEntryContract` — 钱包余额合约
- `PaymentRequestContract` — 支付请求合约
- `PaymentResultContract` — 支付结果合约
- `RefundRequestContract` — 退款请求合约
- `SupportedProvidersContract` — 支持的支付方式合约
- `PaymentStatsContract` — 支付统计合约

## 依赖模块

| 模块 | 关系 | 说明 |
|------|------|------|
| agent | 强依赖 | `TenantGuard` 多租户鉴权守卫 |

## 配置项

| 环境变量 | 类型 | 默认值 | 说明 |
|----------|------|--------|------|
| `ENABLE_MOCK_PAYMENT_GATEWAY` | boolean | `true`（非生产环境） | 启用模拟支付网关，开发/测试使用 |
| `NODE_ENV` | string | `development` | 非 production 时自动启用模拟模式 |

### 模拟模式

非生产环境下模块自动运行在模拟模式，使用内存存储替代第三方支付接口。可通过 `setWalletBalance()` 设置本地钱包余额进行测试。
