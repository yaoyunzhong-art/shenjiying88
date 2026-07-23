# 支付网关模块 - 验收文档

> 模块负责人: 树哥C | 最后更新: 2026-07-24

---

## 业务场景与目标

支付网关模块（Payment Gateway）提供统一的本地化支付能力，支持多地区、多支付渠道的支付接入，
是 ShenJiYing 平台交易闭环的核心环节。

**核心业务目标：**
1. 多支付提供商：PayPal / Stripe / PayPay / 支付宝 / 微信支付 / 本地钱包（模拟）
2. 地理适配：根据用户所在国家/地区自动推荐可用支付方式
3. 多币种支持：CNY / USD / JPY / HKD / THB / VND / MYR / SGD
4. 支付全生命周期：发起支付 → 支付处理 → 完成/失败 → 退款
5. Webhook 验证：各支付平台异步回调签名验证
6. 退款能力：支持全额退款和部分退款

**使用方：** 计费模块（Billing）、购物车模块、充值模块、管理后台

---

## 验收条件（Given-When-Then 格式）

### AC-1: 发起支付

```
Given  用户选择支付宝支付 ¥100，订单 ID 为 "order-001"
  When 请求 POST /payment-gateway/pay 传入 { orderId: "order-001", amount: 100, currency: "CNY", provider: "alipay" }
  Then 返回 PaymentResult，transactionId 以 "TXN-" 开头，status = "completed" 或 "processing"
```

```
Given  用户请求金额 <= 0
  When 请求 POST /payment-gateway/pay 传入 { amount: 0 }
  Then 返回 400 Bad Request，error.code = "INVALID_AMOUNT"
```

```
Given  用户请求当前地区不支持的支付方式（如在中国地区请求 PayPay）
  When 请求 POST /payment-gateway/pay
  Then 返回 400 Bad Request，error.code = "CURRENCY_NOT_SUPPORTED"
```

### AC-2: 支付结果查询

```
Given  交易 "TXN-xxx" 已完成支付
  When 请求 GET /payment-gateway/pay/TXN-xxx
  Then 返回 PaymentResult，status = "completed"，包含 paidAt、provider 信息
```

```
Given  查询不存在的交易 ID
  When 请求 GET /payment-gateway/pay/nonexistent
  Then 返回 404 Not Found，error.code = "TRANSACTION_NOT_FOUND"
```

### AC-3: 退款

```
Given  交易 "TXN-xxx" 状态为 "completed"，用户申请全额退款
  When 请求 POST /payment-gateway/refund 传入 { transactionId: "TXN-xxx" }
  Then 返回退款 PaymentResult，refund 记录创建成功，返回退款 transactionId
```

```
Given  交易 "TXN-xxx" 状态为 "pending" 或 "failed"
  When 请求 POST /payment-gateway/refund
  Then 返回 400 Bad Request，error.code = "REFUND_NOT_ALLOWED"
```

```
Given  用户申请部分退款 ¥50，但原交易金额为 ¥30
  When 请求 POST /payment-gateway/refund 传入 { transactionId: "...", amount: 50 }
  Then 返回 400 Bad Request，error.code = "REFUND_AMOUNT_EXCEEDED"
```

### AC-4: 退款状态查询

```
Given  用户已发起退款，获得 refundId
  When 请求 GET /payment-gateway/refund/:refundId
  Then 返回退款对应的 PaymentResult
```

```
Given  查询不存在的退款 ID
  When 请求 GET /payment-gateway/refund/nonexistent
  Then 返回 404 Not Found，error.code = "REFUND_NOT_FOUND"
```

### AC-5: Webhook 验证

```
Given  PayPal 回传 webhook payload + headers
  When 调用 verifyWebhook("paypal", payload, headers)
  Then 返回 true（模拟模式下始终返回 true）
```

### AC-6: 支持支付方式查询

```
Given  用户在中国大陆（countryCode="CN"）
  When 调用 getSupportedProviders("CN")
  Then 返回 ["alipay", "wechat_pay", "stripe", "local_wallet"]
```

```
Given  用户在日本（countryCode="JP"）
  When 调用 getSupportedProviders("JP")
  Then 返回 ["paypay", "stripe", "paypal", "local_wallet"]
```

### AC-7: 本地钱包支付

```
Given  用户本地钱包余额足够支付 ¥100
  When 请求 POST /payment-gateway/pay 传入 { provider: "local_wallet", amount: 100, currency: "CNY" }
  Then 支付成功，用户钱包扣除 ¥100
```

```
Given  用户本地钱包余额不足
  When 请求 POST /payment-gateway/pay 传入 { provider: "local_wallet", amount: 999999, currency: "CNY" }
  Then 返回 400，error.code = "INSUFFICIENT_FUNDS"
```

---

## 核心流程

### 流程 1: 全链路支付流程

```
┌──────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│  客户端   │ ──► │ PaymentGateway       │ ──► │ PaymentGatewayService │
└──────────┘     │ Controller           │     └───────────┬───────────┘
POST /payment-   └─────────────────────┘                 │
gateway/pay                                              │
{ orderId, amount,                                        ▼
  currency, provider }                           ┌────────────────────┐
                                                 │ 1. 校验 amount>0   │
                                                 │ 2. 校验货币支持     │
                                                 │ 3. 路由到对应provider│
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
                                      ┌─────────────────────────────────────┐
                                      │      Provider 路由                   │
                                      ├────────────┬──────────┬────────────┤
                                      │ PayPal     │ Stripe   │ 支付宝     │
                                      │ Stripe SDK  │ 国际卡   │ 扫码支付   │
                                      │ PayPay     │ 本地钱包  │ 微信支付   │
                                      └────────────┴──────────┴────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────────┐
                                                 │ 4. 创建交易记录      │
                                                 │    transactionId     │
                                                 │    存入 Map         │
                                                 │ 5. 模拟/调用SDK支付  │
                                                 │ 6. 更新 status       │
                                                 │    (completed/failed)│
                                                 └─────────┬───────────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │ 返回 PaymentResult  │
                                                 └─────────────────────┘
```

### 流程 2: 退款流程

```
POST /payment-gateway/refund
{ transactionId, amount?, reason? }
          │
          ▼
 ┌──────────────────────────────┐
 │ 1. 查找原交易                │
 │    (transactions Map)        │
 └──────────┬───────────────────┘
            │
      ┌─────┴──────┐
      │ 交易存在?    │──── 否 ──→ 404 TRANSACTION_NOT_FOUND
      └─────┬──────┘
            │ 是
            ▼
 ┌──────────────────────────────┐
 │ 2. 检查原交易状态            │
 │    status === "completed"?   │── 否 ──→ 400 REFUND_NOT_ALLOWED
 └──────────┬───────────────────┘
            │ 是
            ▼
 ┌──────────────────────────────┐
 │ 3. 校验退款金额              │
 │    amount <= original.amount?│── 否 ──→ 400 REFUND_AMOUNT_EXCEEDED
 └──────────┬───────────────────┘
            │ 是
            ▼
 ┌──────────────────────────────┐
 │ 4. 执行退款                  │
 │    ├─ local_wallet → 返还余额 │
 │    └─ 其他 → 模拟第三方退款   │
 └──────────┬───────────────────┘
            │
            ▼
 ┌──────────────────────────────┐
 │ 5. 创建退款交易记录           │
 │    存入 refundRecords Map     │
 │ 6. 返回退款 PaymentResult     │
 └──────────────────────────────┘
```

### 流程 3: 支付提供商按地区路由

```
                        ┌────────────┐
                        │ 用户国家代码 │
                        └──────┬─────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────┴────┐          ┌────┴────┐          ┌─────┴─────┐
    │ CN/HK   │          │ JP      │          │ TH/VN/MY  │
    │ TW/MO   │          │         │          │ SG/ID/PH  │
    └────┬────┘          └────┬────┘          └─────┬─────┘
         │                    │                     │
    ┌────┴────────┐    ┌─────┴────────┐    ┌───────┴────────┐
    │ alipay      │    │ paypay       │    │ stripe         │
    │ wechat_pay  │    │ stripe       │    │ paypal         │
    │ stripe      │    │ paypal       │    │ local_wallet   │
    │ local_wallet│    │ local_wallet │    │                │
    └─────────────┘    └──────────────┘    └────────────────┘
                               │
                          ┌────┴────┐
                          │ 默认     │
                          │ (欧美)   │
                          └────┬────┘
                          ┌────┴────────┐
                          │ paypal      │
                          │ stripe      │
                          │ local_wallet│
                          └─────────────┘
```

---

## 测试场景矩阵

| 场景ID | 场景名称 | 前置条件 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|---------|
| TS-001 | 支付宝支付 CNY | 系统模拟模式 | POST /payment-gateway/pay (alipay, ¥100) | 200, status=completed |
| TS-002 | 微信支付 CNY | 模拟模式 | POST /payment-gateway/pay (wechat_pay, ¥50) | 200, status=completed |
| TS-003 | PayPal 支付 USD | 模拟模式 | POST /payment-gateway/pay (paypal, $10) | 200, status=completed |
| TS-004 | Stripe 支付 HKD | 模拟模式 | POST /payment-gateway/pay (stripe, HK$200) | 200, status=completed |
| TS-005 | PayPay 支付 JPY | 模拟模式 | POST /payment-gateway/pay (paypay, ¥3000 JPY) | 200, status=completed |
| TS-006 | 本地钱包支付 | 余额充足 | POST /payment-gateway/pay (local_wallet, ¥50) | 200, 余额扣除 |
| TS-007 | 金额 <= 0 | — | POST /payment-gateway/pay (amount: 0) | 400 INVALID_AMOUNT |
| TS-008 | 货币不支持 | JPY 请求 alipay | POST /payment-gateway/pay (alipay, JPY) | 400 CURRENCY_NOT_SUPPORTED |
| TS-009 | 未配置 provider | 生产模式禁用模拟 | POST /payment-gateway/pay | 400 PAYMENT_GATEWAY_NOT_CONFIGURED |
| TS-010 | 查询已支付交易 | TXN-xxx 存在 | GET /payment-gateway/pay/TXN-xxx | 200, status=completed |
| TS-011 | 查询不存在的交易 | — | GET /payment-gateway/pay/FAKE | 404 TRANSACTION_NOT_FOUND |
| TS-012 | 全额退款 | 交易已 completed | POST /payment-gateway/refund (不传 amount) | 200, 全额退款 |
| TS-013 | 部分退款 | 交易已 completed | POST /payment-gateway/refund (amount=30) | 200, 部分退款 |
| TS-014 | 退款金额超限 | amount > 原交易金额 | POST /payment-gateway/refund (amount=999) | 400 REFUND_AMOUNT_EXCEEDED |
| TS-015 | 退款未完成的交易 | status=pending | POST /payment-gateway/refund | 400 REFUND_NOT_ALLOWED |
| TS-016 | 查询退款状态 | refundId 存在 | GET /payment-gateway/refund/:id | 200, 退款信息 |
| TS-017 | 查询不存在的退款 | — | GET /payment-gateway/refund/FAKE | 404 REFUND_NOT_FOUND |
| TS-018 | 中国地区支付方式 | countryCode="CN" | getSupportedProviders("CN") | [alipay, wechat_pay, stripe, local_wallet] |
| TS-019 | 日本地区支付方式 | countryCode="JP" | getSupportedProviders("JP") | [paypay, stripe, paypal, local_wallet] |
| TS-020 | 默认地区支付方式 | countryCode="US" | getSupportedProviders("US") | [paypal, stripe, local_wallet] |
| TS-021 | Webhook PayPal | 模拟 payload | verifyWebhook("paypal", ...) | true (模拟模式) |
| TS-022 | 本地钱包余额不足 | 余额 < 请求金额 | POST /payment-gateway/pay (local_wallet) | 400 INSUFFICIENT_FUNDS |
| TS-023 | 本地钱包退款返还 | 原交易为钱包支付 | POST /payment-gateway/refund | 退款金额回到余额 |
| TS-024 | 货币支持查询 | — | isCurrencySupported("JPY") | true |

---

## 边界情况

| 编号 | 边界条件 | 预期行为 |
|------|---------|---------|
| B-001 | 大额支付（¥1,000,000+） | 正常处理，无金额上限 |
| B-002 | 极小金额（¥0.01） | 正常支付，应支持 |
| B-003 | 金额精度（¥100.999） | 交易使用原始金额，不做四舍五入 |
| B-004 | 同一 orderId 多次支付 | 每次生成不同 transactionId，支付独立 |
| B-005 | 多次退款同一交易 | 目前不做退款累加限制，每笔退款独立 |
| B-006 | 退款金额精确为 0 | 应视为全额退款（等同于不传 amount） |
| B-007 | 并发退款请求 | 内存 Map 非线程安全，生产需加锁 |
| B-008 | 不存在的 provider | 抛 UNKNOWN_PROVIDER 异常 |
| B-009 | webhook 回调并发 | 模拟模式下多次调用均返回 true |
| B-010 | 交易记录中 metadata 为超大 JSON | 无大小限制，建议生产加限制 |

---

## 性能要求

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 发起支付 P99 | < 100ms | 含校验 + 路由 + 交易记录 + 模拟返回 |
| 支付查询 P99 | < 30ms | Map.get 操作 |
| 退款 P99 | < 80ms | 校验 + 原交易更新 + 退款记录 |
| 退款查询 P99 | < 30ms | Map.get 操作 |
| 并发支付支撑 | > 2000 QPS | 单节点 |
| 多币种校验 | < 10ms | 数组 includes 操作 |
| 提供商路由 | < 5ms | switch-case + 数组返回 |
| 数据一致性 | 强一致 | 单进程内存操作 |
| 可用性 SLA | 99.95% | 支付是业务流程关键路径 |
| 本地钱包查询余额 | < 10ms | 双层 Map.get |

> **说明：** 当前版本使用进程内内存存储（transactions Map、walletBalances Map），
> 启用 ENABLE_MOCK_PAYMENT_GATEWAY=true 来模拟支付。
> 生产环境下需接入真实支付 SDK（PayPal REST API、Stripe SDK、Alipay SDK 等），
> 并迁移至 Redis + 数据库实现持久化交易记录和分布式一致性。
