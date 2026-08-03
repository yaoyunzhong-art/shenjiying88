# 计费对账模块 — 圈梁五道箍 验收文档

> 模块: Billing
> 版本: v1.0
> 验收日期: 2026-07-23
> 审核人: 树哥A — 圈梁五道箍
> 关联PRD: [PRD-007 财务对账](/docs/knowledge/prd/prd-finance-p38.md)
> 关联Phase: P-38 财务对账

---

## 一、模块概述

计费对账模块提供 SaaS 多租户计费引擎能力，包括用量计费、阶梯优惠、发票管理、支付处理与计费统计。

### 1.1 核心能力

| 能力 | 说明 | 优先级 |
|:----|:-----|:------:|
| 账单计算 | 根据套餐订阅 + 用量 (API/存储/带宽/坐席) 计算费用 | P0 |
| 折扣应用 | 阶梯折扣 + 优惠码策略 (percentage/fixed) | P0 |
| 发票生成 | 账单 → 发票 (含模板和30天账期) | P0 |
| 发票支付 | 模拟支付 + 状态更新 | P0 |
| 支付状态查询 | 跟踪发票支付流水 | P1 |
| 折扣策略管理 | 内置3种预设折扣码 (NEWUSER20/ANNUAL30/VIP100) | P1 |
| 计费统计 | 汇总: 总应收/实收/待收/发票数 | P1 |

### 1.2 模块文件清单

| 文件 | 类型 | 说明 |
|:-----|:-----|:------|
| billing.service.ts | Service | 核心计费引擎 (calculateBill/applyDiscount/generateInvoice/payInvoice) |
| billing.controller.ts | Controller | 8个REST端点 |
| billing.module.ts | Module | NestJS Module 定义 |
| billing.service.spec.ts | Test | Service 单元测试 |
| billing.service.test.ts | Test | 集成测试 |
| billing.service.edge.test.ts | Test | 边界条件测试 |
| billing.service-extra.spec.ts | Test | 扩展测试 |
| billing.service.full.test.ts | Test | 全量测试 |

### 1.3 定价体系

| 套餐 | 月费 | API调用(/次) | 存储(/GB) | 带宽(/GB) | 坐席(/个) |
|:----|:----:|:-----------:|:---------:|:---------:|:---------:|
| free | ¥0 | ¥0 | ¥0 | ¥0 | ¥0 |
| basic | ¥99 | ¥0.001 | ¥0.10 | ¥0.05 | ¥10 |
| pro | ¥499 | ¥0.0005 | ¥0.08 | ¥0.03 | ¥8 |
| enterprise | ¥2,999 | ¥0.0002 | ¥0.05 | ¥0.02 | ¥5 |

---

## 二、核心实体

### 2.1 BillRequest / BillResult

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| tenantId | string | 租户标识 |
| tier | free/basic/pro/enterprise | 订阅套餐 |
| usage | { apiCalls, storageGB, bandwidthGB, seats } | 用量数据 |
| billingPeriod | { start, end } | 计费周期 |
| currency | CNY/USD/EUR | 币种 |
| couponCode | string? | 可选优惠码 |
| result.lineItems | LineItem[] | 5项计费明细 |
| result.subtotal/discount/tax/total | number | 金额汇总 |

### 2.2 DiscountPolicy

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| code | string | 优惠码 |
| type | percentage/fixed | 折扣类型 |
| value | number | 折扣值 |
| minAmount | number? | 最低消费门槛 |
| maxAmount | number? | 折扣金额封顶 |
| applicableTiers | PricingTier[]? | 适用套餐层级 |
| expiresAt | string? | 过期时间 |
| maxUses | number? | 最大使用次数 |

### 2.3 Invoice / PaymentInfo

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| invoiceNo | string | INV-YYYY-NNNNNN |
| status | draft/issued/paid/cancelled | 发票状态机 |
| dueAt | string | 30天账期 |
| payment.status | unpaid/paid/overdue/cancelled/refunded | 支付状态 |
| payment.method | string | 支付方式 |

---

## 三、接口清单

| 方法 | 端点 | 说明 | 鉴权 |
|:----|:-----|:-----|:----:|
| POST | /api/billing/calculate | 计算账单 | TenantGuard |
| POST | /api/billing/invoices | 计算并生成发票 | TenantGuard |
| GET | /api/billing/invoices | 列出发票 | TenantGuard |
| GET | /api/billing/invoices/:id | 查询发票支付状态 | TenantGuard |
| POST | /api/billing/invoices/:id/pay | 支付发票 | TenantGuard |
| GET | /api/billing/payments/:invId | 查询支付状态 | TenantGuard |
| GET | /api/billing/discounts | 列出折扣策略 | TenantGuard |
| GET | /api/billing/stats | 计费统计 | TenantGuard |

---

## 四、验收 Case（圈梁五道箍 × 15条）

### 维度 A: 功能完整性 (AC-01 ~ AC-04)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-01 | basic套餐计费 | tenant-A, tier=basic, usage: 1000次API + 10GB存储 + 50GB带宽 + 5坐席 | POST /api/billing/calculate | subtotal=99+1+1+2.5+50=¥153.5, 5项lineItems齐全 | 功能完整性 |
| AC-02 | 应用优惠码折扣 | total=153.5, couponCode=NEWUSER20 | 同上 + couponCode | 20%折扣=¥30.7, discountLabel='新用户20%', tax=(153.5-30.7)*0.13=¥15.96, total=¥138.76 | 功能完整性 |
| AC-03 | 发票生成与支付 | 先 calculateBill → generateInvoice | POST /api/billing/invoices → POST /api/billing/invoices/:id/pay | 发票 invoiceNo 格式正确, status=paid, PaymentInfo 返回 | 功能完整性 |
| AC-04 | 计费统计总览 | 已有3张发票(2已付1未付) | GET /api/billing/stats | totalInvoiced=Σ, totalCollected=已付和, pendingAmount=totalInvoiced - totalCollected, invoiceCount=3 | 功能完整性 |

### 维度 B: 边界条件 (AC-05 ~ AC-07)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-05 | free套餐零费用计费 | tier=free, usage 任意 | calculateBill | baseMonthly=0, 所有 unitPrice=0, subtotal=0, discount=0, tax=0, total=0 | 边界条件 |
| AC-06 | 超大用量计费溢出不丢精度 | apiCalls=9,999,999, storageGB=9,999 | calculateBill | 四舍五入到分精度, 不产生浮点溢出或 NaN | 边界条件 |
| AC-07 | 折扣刚好踩 minAmount | policy.minAmount=100, subtotal=100 (恰等于) | applyDiscount(100, 'NEWUSER20', 'basic') | 优惠码生效 (边界值通过) | 边界条件 |

### 维度 C: 异常路径 (AC-08 ~ AC-11)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-08 | 优惠码不存在 | couponCode='FAKE123' | calculateBill with couponCode | discountAmount=0, discountLabel='无效优惠码', warn log 输出 | 异常路径 |
| AC-09 | 优惠码不适用当前套餐 | NEWUSER20 只适用于 basic/pro, 传入 tier=enterprise | calculateBill tier=enterprise | discountAmount=0, discountLabel='不适用当前套餐' | 异常路径 |
| AC-10 | 优惠码已达使用上限 | NEWUSER20.maxUses=1000, currentUses=1000 | applyDiscount | 0折扣, label='优惠码已达使用上限' | 异常路径 |
| AC-11 | 发票不存在查询 | 传入不存在的 invoiceId | GET /api/billing/invoices/nonexistent | 返回 null, warn log '[getPaymentStatus] 发票不存在' | 异常路径 |

### 维度 D: 权限控制 (AC-12 ~ AC-13)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-12 | 跨租户发票隔离 | tenant-A 有 invoice, tenant-B 查询发票列表 | tenant-B GET /api/billing/invoices?tenantId=B | 只返回 tenant-B 的发票, 不泄漏 tenant-A 数据 | 权限控制 |
| AC-13 | 未授权访问计费端点 | 无有效 tenant 上下文请求 | POST /api/billing/calculate (无 tenant token) | 401 Unauthorized 或 403 Forbidden (依赖 TenantGuard 配置) | 权限控制 |

### 维度 E: 可观测性 (AC-14 ~ AC-15)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-14 | 计费操作审计日志 | 执行 calculateBill 和 payInvoice | 检查日志输出 | calculateBill 日志含 tenant / tier / subtotal / total; payInvoice 含 invoiceId / method / amount | 可观测性 |
| AC-15 | 无效优惠码告警 | 传入不存在的 couponCode | applyDiscount | warn 级别日志: `[applyDiscount] 优惠码不存在: FAKE123` | 可观测性 |

---

## 五、风险点

| 风险 | 影响 | 严重度 | 缓解措施 |
|:-----|:-----|:------:|:---------|
| 定价硬编码内存 | TIER_PRICING / DEFAULT_DISCOUNTS 写死在 service.ts | **高** | 需迁移到数据库/配置中心, 支持运营实时调价 |
| 发票/支付用内存存储 | invoices[]/payments[] 数组, 服务重启即丢失 | **高** | 需对接真实数据库 (PostgreSQL/TypeORM) |
| 缺乏 VAT 税率配置 | taxRate=13% 硬编码, 不支持多地区税率 | **中** | 需引入 taxRate 配置, 按 tenant 地区动态 |
| 无退款/作废能力 | 仅有 payInvoice, 无 refundInvoice/cancelInvoice | **中** | P-38 后续阶段补充退款流程 |
| 计费精度问题 | Math.round 到分, 但浮点运算可能累积误差 | **中** | 建议使用 decimal.js 或 BigInt 替代 JS number |
| 缺少对账功能 | 无渠道对账 (微信支付 vs 系统记录) | **低** | PRD-007 需求卡 RQ-38-05 标记为 P1 |

---

## 六、审核结论

| 审核维度 | 覆盖度 | 备注 |
|:---------|:------:|:-----|
| 功能完整性 | ✅ 基本完整 | 计费/折扣/发票/支付/统计核心链路完整, 缺退款对账 |
| 边界条件 | ⚠️ 需完善 | free 套餐零计费通过; 需补充负用量、异常币种等边界 |
| 异常路径 | ✅ 良好 | 无效优惠码/不适用/超限/发票不存在均已覆盖 |
| 权限控制 | ⚠️ 依赖 TenantGuard | Controller 层已装饰 TenantGuard, 需验证不暴露跨租户数据 |
| 可观测性 | ✅ 良好 | Logger 全覆盖, warn/error 分级, 关键操作均有日志 |
