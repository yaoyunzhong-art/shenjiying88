# 计费模块 - 验收文档

> 模块负责人: 树哥C | 最后更新: 2026-07-24

---

## 业务场景与目标

计费模块（Billing）是 ShenJiYing 平台的核心商业化引擎，负责根据租户用量和套餐层级计算费用、生成发票、管理支付状态。

**核心业务目标：**
1. 多层级定价：免费版 / 基础版(¥99/月) / 专业版(¥499/月) / 企业版(¥2999/月)
2. 用量计费：按 API 调用次数、存储空间、带宽、坐席数阶梯计价
3. 折扣策略：优惠码折扣（百分比/固定减免）+ 自动阶梯折扣
4. 发票全生命周期：草稿 → 已开具 → 已支付 → 已取消
5. 支付跟踪：记录支付状态、方法、时间
6. 计费统计：汇总已开票金额、已收款金额、待收金额

**使用方：** 系统后台计费结算界面、租户管理后台、财务对账系统

---

## 验收条件（Given-When-Then 格式）

### AC-1: 账单计算

```
Given  租户属于 basic 套餐，当月 API 调用 10000 次、存储 50GB、带宽 100GB、坐席 5 个
  When 请求 POST /api/billing/calculate 传入 { tier: "basic", usage: { apiCalls: 10000, ... } }
  Then 返回 BillResult，包含行项目明细、subtotal 值、taxAmount(13%)、total 值
```

```
Given  租户属于 free 套餐任意用量
  When 请求 POST /api/billing/calculate
  Then 返回 BillResult，total = 0（免费层免费）
```

### AC-2: 折扣策略应用

```
Given  basic 套餐用户使用优惠码 NEWUSER20（20% 折扣，封顶 ¥500），subtotal 为 ¥200
  When 发送账单计算请求，couponCode = "NEWUSER20"
  Then discountAmount = ¥40，discountLabel = "新用户20%"
```

```
Given  subtotal >= ¥10000（无优惠码）
  When 发送账单计算请求
  Then 自动应用企业批量折扣 15%，discountAmount = subtotal * 0.15
```

```
Given  用户使用不存在/已过期的优惠码
  When 发送账单计算请求
  Then discountAmount = 0，discountLabel = "无效优惠码" 或 "优惠码已过期"
```

```
Given  basic 套餐用户使用 VIP100 固定减免（仅限 pro/enterprise）
  When 发送账单计算请求
  Then discountAmount = 0，discountLabel = "不适用当前套餐"
```

### AC-3: 发票生成

```
Given  用户计算完账单后
  When 请求 POST /api/billing/invoices 传入相同计费参数
  Then 返回 Invoice，status = "draft"、invoiceNo 格式为 INV-YYYY-XXXXXX、dueAt 为 30 天后
```

### AC-4: 发票支付

```
Given  租户已生成发票（status = "draft"），余额充足
  When 请求 POST /api/billing/invoices/:id/pay 传入 { method: "alipay" }
  Then 返回 PaymentInfo，status = "paid"，paidAt 为当前时间，发票状态更新为 "paid"
```

```
Given  用户支付不存在的发票 ID
  When 请求 POST /api/billing/invoices/:id/pay
  Then 抛出错误 "发票不存在: {id}"
```

### AC-5: 支付状态查询

```
Given  租户支付了发票 inv_000001
  When 请求 GET /api/billing/payments/inv_000001
  Then 返回 PaymentInfo，包含金额、支付方法、支付时间
```

```
Given  查询从未支付过的发票 ID
  When 请求 GET /api/billing/payments/:invId
  Then 返回 { success: false, data: null }
```

### AC-6: 折扣策略列表

```
Given  系统已配置默认折扣策略（NEWUSER20 / ANNUAL30 / VIP100）
  When 请求 GET /api/billing/discounts
  Then 返回折扣策略数组，包含 code、name、type、value、使用次数
```

### AC-7: 计费统计

```
Given  系统有若干已开票和已付款记录
  When 请求 GET /api/billing/stats
  Then 返回 totalInvoiced、totalCollected、pendingAmount、invoiceCount
```

---

## 核心流程

### 流程 1: 计费计算 → 发票生成 → 支付闭环

```
┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                  │    │                  │    │                 │
│  POST /api/billing/  │  POST /api/billing/  │  POST /api/billing/│
│  calculate         │  invoices           │  invoices/:id/pay │
│                    │                    │                   │
└────────┬──────────┘  └───────┬──────────┘  └───────┬─────────┘
         │                     │                     │
         ▼                     ▼                     ▼
  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐
  │ BillingService │    │ BillingService │    │BillingService│
  │ calculateBill()│    │ generateInvoice│    │ payInvoice() │
  └───────┬────────┘    └───────┬────────┘    └──────┬───────┘
          │                     │                    │
          ▼                     ▼                    ▼
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ 1. 查找定价表  │     │ 1. 累加invoice│     │ 1. 查找发票   │
   │   TIER_PRICING│     │    Counter    │     │ 2. 创建支付   │
   │ 2. 计算行项目  │     │ 2. 生成invId  │     │    记录      │
   │   5项明细     │     │ 3. 设置状态   │     │ 3. 更新发票   │
   │ 3. 应用折扣   │     │    draft      │     │    status    │
   │ 4. 计算税费   │     │ 4. dueAt=30d  │     │    =paid     │
   │ 5. 汇总total  │     │ 5. 存入内存   │     │ 4. 返回支付   │
   └───────┬──────┘     │    列表       │     │    信息      │
           │            └──────────────┘     └──────────────┘
           ▼
   ┌──────────────┐
   │ 返回         │
   │ BillResult   │
   └──────────────┘
```

### 流程 2: 折扣应用决策树

```
 ┌──────────────┐
 │ 传入couponCode│
 └──────┬───────┘
        │
    ┌───┴───┐
    │       │
   有     无/空
    │       │
    ▼       ▼
  查找   自动阶梯折扣
  policy   │
    │      ├─ amount >= ¥10000 → 15%
    ├─ 不存在 → "无效优惠码"    ├─ amount >= ¥5000  → 10%
    ├─ 不适用套餐 → "不适用"    └─ amount >= ¥1000  → 5%
    ├─ 未达最低 → "未达最低"
    ├─ 已用完 → "已达上限"
    ├─ 已过期 → "已过期"
    └─ 可用 → 计算折扣(percentage/fixed)
```

### 流程 3: 发票生命周期

```
 ┌───────┐     ┌────────┐     ┌──────┐     ┌─────────┐
 │ draft │ ──► │ issued │ ──► │ paid │ ──► │cancelled│
 └───────┘     └────────┘     └──────┘     └─────────┘
       │                          │
       └──► cancelled (直接取消)    │
                                   │
                              (refunded)
                            (未来扩展)
```

---

## 测试场景矩阵

| 场景ID | 场景名称 | 前置条件 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|---------|
| TS-001 | free 套餐计费 | 租户 free 套餐 | POST /api/billing/calculate (free) | total=0 |
| TS-002 | basic 套餐计费 | basic, API 10000次+存储50GB | POST /api/billing/calculate | subtotal 正确+tax 13% |
| TS-003 | pro 套餐计费 | pro 套餐, 任意用量 | POST /api/billing/calculate | 单价低于 basic |
| TS-004 | enterprise 套餐计费 | enterprise, 大用量 | POST /api/billing/calculate | 最低单价 |
| TS-005 | 新用户折扣 NEWUSER20 | subtotal ¥200, couponCode=NEWUSER20 | POST /api/billing/calculate | discount=¥40 |
| TS-006 | 年付优惠 ANNUAL30 | subtotal ¥1000, couponCode=ANNUAL30 | POST /api/billing/calculate | discount=¥300(封顶¥5000) |
| TS-007 | VIP减免 VIP100 | subtotal ¥500, tier=pro | POST /api/billing/calculate | discount=¥100 |
| TS-008 | 不适用套餐折扣 | tier=basic, couponCode=VIP100 | POST /api/billing/calculate | discount=0, label="不适用当前套餐" |
| TS-009 | 无效优惠码 | 不存在的 couponCode | POST /api/billing/calculate | discount=0, label="无效优惠码" |
| TS-010 | 自动阶梯折扣 15% | subtotal >= ¥10000, 无 coupon | POST /api/billing/calculate | discount=subtotal*15% |
| TS-011 | 自动阶梯折扣 10% | subtotal >= ¥5000 | POST /api/billing/calculate | discount=subtotal*10% |
| TS-012 | 自动阶梯折扣 5% | subtotal >= ¥1000 | POST /api/billing/calculate | discount=subtotal*5% |
| TS-013 | 无折扣 | subtotal < ¥1000, 无 coupon | POST /api/billing/calculate | discount=0 |
| TS-014 | 生成标准发票 | 计算 bill 后 | POST /api/billing/invoices | invoice 含正确格式+30天 due |
| TS-015 | 支付发票 | 已生成发票 | POST /api/billing/invoices/:id/pay | status=paid |
| TS-016 | 支付不存在的发票 | 不存在的 invId | POST /api/billing/invoices/:id/pay | 抛错 "发票不存在" |
| TS-017 | 查询已支付发票 | 已支付 | GET /api/billing/payments/:invId | 返回 PaymentInfo |
| TS-018 | 查询未支付发票 | 未支付 | GET /api/billing/payments/:invId | success=false, data=null |
| TS-019 | 列表展示折扣 | 系统已配置 | GET /api/billing/discounts | 3+条折扣 |
| TS-020 | 计费统计 | 有若干发票/支付 | GET /api/billing/stats | 统计值正确 |
| TS-021 | 优惠码已用完 | maxUses 已耗尽 | POST /api/billing/calculate (带优惠码) | discount=0 |
| TS-022 | 过期的优惠码 | expiresAt < now | POST /api/billing/calculate (带优惠码) | discount=0 |
| TS-023 | 发票列表按 tenant 过滤 | 多租户数据 | GET /api/billing/invoices?tenantId=X | 仅返回 tenant X 的发票 |
| TS-024 | 重复支付同一张发票 | 已支付发票再次支付 | POST /api/billing/invoices/:id/pay | 新增一条支付记录 |

---

## 边界情况

| 编号 | 边界条件 | 预期行为 |
|------|---------|---------|
| B-001 | usage 用量字段为 0 | 计算正常，对应项 subtotal=0 |
| B-002 | 不存在的 tier | JS 回退到 basic 定价 |
| B-003 | subtotal 为负值（不可能） | 不应出现，discount 不会导致 subtotal < 0 |
| B-004 | 优惠码封顶：percentage 折扣超过 maxAmount | 取 maxAmount 值 |
| B-005 | 税率计算精度 | 四舍五入保留两位小数 |
| B-006 | 发票 ID 计数溢出 | invCounter 理论上约 21 亿，溢出前应切换 UUID |
| B-007 | 批量创建大量发票 | 内存存储注意 OOM，生产需数据库分页 |
| B-008 | 同一优惠码并发使用 | currentUses++ 不是原子操作，生产需加锁 |
| B-009 | 优惠码不满足 minAmount | discount=0, label 提示未达最低 |
| B-010 | 货币对换（CNY/USD/EUR） | 全部使用相同货币，暂不支持汇率换算 |

---

## 性能要求

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 账单计算 P99 | < 50ms | 纯内存计算，无外部依赖 |
| 发票生成 P99 | < 100ms | 含账单计算 + 发票对象创建 |
| 发票支付 P99 | < 100ms | 查找 + 状态更新 |
| 统计查询 P99 | < 50ms | 遍历数组求和 |
| 并发计算支撑 | > 3000 QPS | 单节点无 IO 瓶颈 |
| 折扣查找 P99 | < 10ms | 数组 find 操作 |
| 发票列表查询 P99 | < 50ms | 数组 filter |
| 数据一致性 | 强一致 | 单进程内存操作，无并发冲突 |
| 可用性 SLA | 99.95% | 计费允许短暂中断 |

> **说明：** 当前版本使用进程内内存存储（invoices[]、payments[] 数组）。
> 生产环境必须迁移至 PostgreSQL + Redis 以支持持久化和多实例水平扩展。
> 建议在 Phase-47 迁移后重新 benchmark 性能目标值。
