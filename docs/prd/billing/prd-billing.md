# PRD-008-R2: 计费结算 — Billing (P-00)

> 版本: v1.0-R2 · 签发人: 🦞 龙虾哥 · 对接专家: E20 运营
> 发布日期: 2026-07-28 · 状态: 🟢 已签发
> 关联Phase: P-00 · 基于: billing.service.ts / billing.controller.ts
> 圈梁标记: 🏗️ 圈梁五道箍

---

## 1. 目标

### 1.1 业务目标
搭建多租户计费结算引擎，支持按用量(API调用/存储/带宽/坐席)自动计费、阶梯折扣、发票生成与支付跟踪，为 SaaS 租户提供透明的账单服务。

### 1.2 产品目标
- 支持 4 级套餐定价(free/basic/pro/enterprise)自动计费
- 账单计算≤2秒(含折扣计算)
- 支持优惠码校验和应用
- 发票生成后30天内支付
- 自动阶梯折扣(批量/大客户/企业)

### 1.3 成功指标
| 指标 | 目标值 | 测量方式 |
|:----|:------|:---------|
| 账单计算响应 | ≤2秒 | APM P99 |
| 折扣计算准确率 | 100%(金额匹配) | 单元测试 |
| 发票生成成功率 | 100% | 任务监控 |
| 计费统计一致性 | 统计金额= SUM(发票) 零误差 | 核对测试 |
| 优惠码校验 | 全部校验项覆盖(过期/次数/层级/最低额) | 测试覆盖 |

---

## 2. 用户故事

### 2.1 租户/客户
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-08-01 | 作为租户，我想查看当前计费周期的预估费用，以便预算控制 | P0 |
| US-08-02 | 作为租户，我想输入优惠码享受折扣，以便降低支出 | P0 |
| US-08-03 | 作为租户，我想在线支付发票，以便及时结算 | P0 |
| US-08-04 | 作为租户，我想查看历史发票和支付记录，以便对账 | P1 |

### 2.2 运营人员
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-08-05 | 作为运营人员，我想查看所有租户的计费统计(总收入/待收/已收)，以便汇总 | P0 |
| US-08-06 | 作为运营人员，我想管理折扣策略(创建/启停)，以便灵活运营 | P1 |
| US-08-07 | 作为运营人员，我想查看逾期未支付的发票列表，以便催缴 | P1 |

### 2.3 财务
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-08-08 | 作为财务，我需确保计费金额正确(含税/折扣)，以便做账 | P0 |

---

## 3. 功能列表

| 功能ID | 功能名称 | 描述 | 优先级 | 关联模块 |
|:-------|:---------|:-----|:------:|:--------|
| F-08-01 | 账单计算 | 按套餐定价+用量计算费用(API/存储/带宽/坐席) | P0 | calculate |
| F-08-02 | 自动阶梯折扣 | 按总金额自动应用批量折扣(5%/10%/15%) | P0 | discount |
| F-08-03 | 优惠码折扣 | 支持输入优惠码，校验后应用(百分比/固定金额) | P0 | discount |
| F-08-04 | 优惠码校验 | 检查优惠码是否有效、是否过期、达使用上限、适用层级、最低金额 | P0 | discount |
| F-08-05 | 发票生成 | 根据账单生成标准Invoice(含费用明细/税率/到期日) | P0 | invoice |
| F-08-06 | 发票列表查询 | 按租户ID列出发票列表 | P0 | invoice |
| F-08-07 | 发票支付 | 在线支付发票，标记已支付+记录支付流水 | P0 | payment |
| F-08-08 | 支付状态查询 | 查询发票支付状态 | P0 | payment |
| F-08-09 | 折扣策略列表 | 列出所有可用的折扣策略 | P1 | discount |
| F-08-10 | 计费统计 | 汇总总发票金额/已收金额/待收金额 | P0 | stats |
| F-08-11 | 税率计算 | 自动应用13% VAT，计入总金额 | P0 | tax |

---

## 4. 非功能需求

| 需求ID | 类别 | 标准 | 测量方式 |
|:-------|:-----|:-----|:---------|
| NFR-08-01 | 计算精度 | 金额保留2位小数，四舍五入 | 单元测试 |
| NFR-08-02 | 折扣精确 | 百分比折扣保证金额正确，封顶不超 | 核对测试 |
| NFR-08-03 | 发票唯一 | 发票号唯一不可重复 | 代码审查 |
| NFR-08-04 | 支付不可逆 | 支付成功后不可撤回(需退款流程) | 审计检查 |
| NFR-08-05 | 可用性 | 99.9% (月掉线<43min) | 监控告警 |
| NFR-08-06 | 并发计费 | 支持同时10租户计费不出错 | 并发测试 |
| NFR-08-07 | 优惠码防刷 | 临时保存 use 次数，防止并发超用 | 代码审查 |

---

## 5. 数据约束

### 5.1 数据库约束

| 约束 | 说明 | 理由 |
|:-----|:-----|:-----|
| 金额精度 | 所有金额保留2位小数 | 防浮点精度问题 |
| 发票号唯一 | invoiceNo 全局唯一 | 发票管理规范 |
| 状态流转 | draft → issued → paid / cancelled | 生命周期单向 |
| 折扣不可叠加 | 仅应用一个优惠码，不叠加逐级折扣 | 业务规则 |
| 支付记录只追加 | 支付流水行只INSERT不UPDATE | 审计追溯 |
| 税收比例固定 | 13% VAT 为系统配置值 | 财务规范 |

### 5.2 关键数据实体

```typescript
interface BillRequest {
  tenantId: string;
  tier: PricingTier;                     // free | basic | pro | enterprise
  usage: {
    apiCalls: number;
    storageGB: number;
    bandwidthGB: number;
    seats: number;
  };
  billingPeriod: { start: string; end: string };
  currency: Currency;                    // CNY | USD | EUR
  couponCode?: string;
}

interface BillResult {
  tenantId: string;
  tier: PricingTier;
  period: { start: string; end: string };
  lineItems: LineItem[];                 // 5个子项(月费/API/存储/带宽/坐席)
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  taxAmount: number;                     // 13% VAT
  total: number;
  currency: Currency;
  calculatedAt: string;
}

interface DiscountPolicy {
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  applicableTiers?: PricingTier[];
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
}

interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;                     // INV-YYYY-NNNNNN
  status: InvoiceStatus;                 // draft | issued | paid | cancelled
  billingPeriod: { start: string; end: string };
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: Currency;
  issuedAt: string;
  paidAt?: string;
  dueAt: string;                         // 30天后
}

interface PaymentInfo {
  tenantId: string;
  invoiceId: string;
  paymentId: string;
  status: PaymentStatus;                 // unpaid | paid | overdue | cancelled | refunded
  amount: number;
  currency: Currency;
  method: string;
  paidAt?: string;
  createdAt: string;
  notes?: string;
}
```

---

## 6. 阶梯定价表

| 套餐 | 基础月费 | API(次) | 存储(GB) | 带宽(GB) | 坐席(个) |
|:----:|:--------:|:--------:|:--------:|:--------:|:--------:|
| free | ¥0 | ¥0 | ¥0 | ¥0 | ¥0 |
| basic | ¥99 | ¥0.001 | ¥0.10 | ¥0.05 | ¥10 |
| pro | ¥499 | ¥0.0005 | ¥0.08 | ¥0.03 | ¥8 |
| enterprise | ¥2,999 | ¥0.0002 | ¥0.05 | ¥0.02 | ¥5 |

## 7. 折扣策略

| 策略码 | 名称 | 类型 | 值 | 条件 |
|:------|:-----|:----:|:--:|:-----|
| —— | 阶梯折扣(≥¥1,000) | 百分比 | 5% | 自动 |
| —— | 阶梯折扣(≥¥5,000) | 百分比 | 10% | 自动 |
| —— | 阶梯折扣(≥¥10,000) | 百分比 | 15% | 自动 |
| NEWUSER20 | 新用户20% | 百分比 | 20% | basic/pro, 上限¥500 |
| ANNUAL30 | 年付优惠30% | 百分比 | 30% | 终端额≥¥100, 上限¥5,000 |
| VIP100 | VIP固定减免 | 固定金额 | ¥100 | pro/enterprise, ≥¥200 |

---

## 8. 不在此PRD范围

- 自动扣款(信用卡/Direct Debit) → v2
- 账单分期 — 归 Finance 模块
- 用量预警 — 归 Monitoring 模块
- 租户自助降级/升级套餐 → 归 Tenant 模块

---

## 9. 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|:----|:-----|:---------|:------|
| v1.0 | 2026-07-28 | 初版签发，基于billing.service.ts/controller.ts分析 | 树哥A |
| v1.0-R2 | 2026-07-28 | 补充阶梯定价表、折扣策略表、优惠码校验逻辑 | 树哥A |
