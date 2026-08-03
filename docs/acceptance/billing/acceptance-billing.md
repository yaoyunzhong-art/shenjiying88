# ACC-004: 计费结算 — Billing 验收文档

> 版本: v1.0 · 验收人: 树哥A · 验收日期: 2026-07-28
> 关联PRD: [PRD-008 计费结算](../prd/billing/prd-billing.md)
> 关联Phase: P-00
> 圈梁标记: 🏗️ 圈梁五道箍

---

## 1. 模块概述

计费结算模块为多租户SaaS平台提供按用量计费能力，支持4级套餐定价(free/basic/pro/enterprise)、自动阶梯折扣、优惠码应用、发票生成与支付跟踪。本验收档覆盖全部计费功能需求及异常场景。

**验收范围:**
- 各套餐账单计算(用量计费)
- 自动阶梯折扣(5%/10%/15%)
- 优惠码折扣(百分比/固定金额)
- 发票生成与查询
- 发票支付与支付状态查询
- 计费统计
- 异常场景(无效优惠码/不适用层级/未达最低额/已过期)

---

## 2. 验收标准

### 2.1 账单计算

#### AC-BILLING-08-01: basic套餐账单计算
- **Given** 租户 tenant-001, tier=basic, 用量: API 1000次/存储10GB/带宽50GB/坐席5个, 币种CNY
- **When** 调用 POST /api/billing/calculate
- **Then** subtotal=153.50 (99+1+1+2.5+50), lineItems=5项, currency=CNY

#### AC-BILLING-08-02: 企业套餐基础月费
- **Given** tier=enterprise
- **When** 计算账单
- **Then** 基础月费 item subtotal = 2999

#### AC-BILLING-08-03: free套餐零费用
- **Given** tier=free
- **When** 计算账单
- **Then** subtotal=0, total=0, 全部lineItem金额=0

#### AC-BILLING-08-04: 账单含13%税
- **Given** subtotal=¥100
- **When** 计算账单
- **Then** taxAmount=¥13 (100×0.13), total=¥113

### 2.2 自动阶梯折扣

#### AC-BILLING-08-05: 批量折扣5%(≥¥1,000)
- **Given** 账单 subtotal=¥1,000
- **When** 计算(无优惠码)
- **Then** discountAmount=¥50(5%), discountLabel=批量折扣(5%)

#### AC-BILLING-08-06: 大客户折扣10%(≥¥5,000)
- **Given** 账单 subtotal=¥5,000
- **When** 计算(无优惠码)
- **Then** discountAmount=¥500(10%), discountLabel=大客户折扣(10%)

#### AC-BILLING-08-07: 企业折扣15%(≥¥10,000)
- **Given** 账单 subtotal=¥10,000
- **When** 计算(无优惠码)
- **Then** discountAmount=¥1,500(15%), discountLabel=企业批量折扣(15%)

#### AC-BILLING-08-08: 小额无折扣
- **Given** 账单 subtotal=¥500
- **When** 计算(无优惠码)
- **Then** discountAmount=0, discountLabel=无折扣

### 2.3 优惠码折扣

#### AC-BILLING-08-09: 优惠码百分比折扣成功
- **Given** 账单 subtotal=¥200, couponCode=NEWUSER20, tier=basic
- **When** 计算账单
- **Then** discountAmount=¥40(20%), discountLabel=新用户20%

#### AC-BILLING-08-10: 优惠码固定金额折扣
- **Given** 账单 subtotal=¥500, couponCode=VIP100, tier=pro
- **When** 计算账单
- **Then** discountAmount=¥100

#### AC-BILLING-08-11: 优惠码封顶
- **Given** 账单 subtotal=¥5,000, couponCode=NEWUSER20(上限¥500)
- **When** 计算账单
- **Then** discountAmount=¥500(封顶而非¥1,000)

#### AC-BILLING-08-12: 无效优惠码
- **Given** couponCode=INVALID123
- **When** 计算账单
- **Then** discountAmount=0, discountLabel=无效优惠码

#### AC-BILLING-08-13: 优惠码不适用当前套餐
- **Given** tier=free, couponCode=NEWUSER20(仅basic/pro)
- **When** 计算账单
- **Then** discountAmount=0, discountLabel=不适用当前套餐

#### AC-BILLING-08-14: 优惠码未达最低金额
- **Given** subtotal=¥99, couponCode=VIP100(最低¥200)
- **When** 计算账单
- **Then** discountAmount=0, discountLabel=未达最低消费 200

### 2.4 发票管理

#### AC-BILLING-08-15: 发票生成
- **Given** 账单计算结果(含费用明细)
- **When** 调用 POST /api/billing/invoices
- **Then** 返回Invoice: status=draft, invoiceNo格式=INV-YYYY-NNNNNN, dueAt=30天后

#### AC-BILLING-08-16: 发票列表查询
- **Given** 某租户有3张发票
- **When** GET /api/billing/invoices?tenantId=xxx
- **Then** 返回3条发票记录, total=3

#### AC-BILLING-08-17: 不存在的发票查询
- **Given** 发票ID不存在
- **When** GET /api/billing/invoices/:id
- **Then** 返回 success=false, message包含"未找到"

### 2.5 支付管理

#### AC-BILLING-08-18: 发票支付成功
- **Given** 发票已生成(status=draft)
- **When** POST /api/billing/invoices/:id/pay, method=wechat
- **Then** 支付成功: status=paid, paidAt有值, 生成PaymentInfo

#### AC-BILLING-08-19: 支付状态查询
- **Given** 发票已支付
- **When** GET /api/billing/payments/:invId
- **Then** 返回PaymentInfo: status=paid, method, amount, paidAt

### 2.6 计费统计 & 折扣列表

#### AC-BILLING-08-20: 计费统计
- **Given** 有2张发票(总额¥500)已收¥300
- **When** GET /api/billing/stats
- **Then** totalInvoiced=500, totalCollected=300, pendingAmount=200

#### AC-BILLING-08-21: 折扣策略列表
- **Given** 系统有3个默认折扣策略
- **When** GET /api/billing/discounts
- **Then** 返回3条discount记录, total=3

---

## 3. 测试场景清单

| 场景ID | 场景标题 | 模块 | 自动化 | 优先级 | 关联验收标准 |
|:-------|:---------|:-----|:------:|:------:|:------------|
| TC-08-01 | basic套餐账单计算 | calculate | ✅ | P0 | AC-BILLING-08-01 |
| TC-08-02 | 企业套餐基础月费 | calculate | ✅ | P0 | AC-BILLING-08-02 |
| TC-08-03 | free套餐零费用 | calculate | ✅ | P0 | AC-BILLING-08-03 |
| TC-08-04 | 账单含税计算 | calculate | ✅ | P0 | AC-BILLING-08-04 |
| TC-08-05 | 自动阶梯折扣5% | discount | ✅ | P0 | AC-BILLING-08-05 |
| TC-08-06 | 自动阶梯折扣10% | discount | ✅ | P0 | AC-BILLING-08-06 |
| TC-08-07 | 自动阶梯折扣15% | discount | ✅ | P0 | AC-BILLING-08-07 |
| TC-08-08 | 小额无折扣 | discount | ✅ | P1 | AC-BILLING-08-08 |
| TC-08-09 | 优惠码百分比折扣 | discount | ✅ | P0 | AC-BILLING-08-09 |
| TC-08-10 | 优惠码固定金额折扣 | discount | ✅ | P0 | AC-BILLING-08-10 |
| TC-08-11 | 优惠码封顶 | discount | ✅ | P1 | AC-BILLING-08-11 |
| TC-08-12 | 无效优惠码 | discount | ✅ | P0 | AC-BILLING-08-12 |
| TC-08-13 | 优惠码不适用层级 | discount | ✅ | P0 | AC-BILLING-08-13 |
| TC-08-14 | 优惠码未达最低金额 | discount | ✅ | P1 | AC-BILLING-08-14 |
| TC-08-15 | 发票生成 | invoice | ✅ | P0 | AC-BILLING-08-15 |
| TC-08-16 | 发票列表查询 | invoice | ✅ | P0 | AC-BILLING-08-16 |
| TC-08-17 | 不存在的发票查询 | invoice | ✅ | P1 | AC-BILLING-08-17 |
| TC-08-18 | 发票支付成功 | payment | ✅ | P0 | AC-BILLING-08-18 |
| TC-08-19 | 支付状态查询 | payment | ✅ | P0 | AC-BILLING-08-19 |
| TC-08-20 | 计费统计汇总 | stats | ✅ | P0 | AC-BILLING-08-20 |
| TC-08-21 | 折扣策略列表 | discount | ✅ | P1 | AC-BILLING-08-21 |

**测试场景汇总:** 21场景 | P0=15 | P1=6 | 自动化覆盖=100%

---

## 4. 验收结论

| 验收项 | 结果 | 说明 |
|:-------|:----:|:-----|
| 功能完整度 | ⬜ 待测 | 等待开发完成后执行 |
| 自动化测试 | 21/21 | 全量测试用例已定义 |
| 异常覆盖 | 6/6 | 无效优惠码/不适用层级/未达最低额/已过期/封顶/不存在的发票 |
| 边界覆盖 | 有 | 零费用free套餐、阶梯折扣边界、优惠码封顶 |
