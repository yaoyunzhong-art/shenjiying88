# Phase-45 SaaS 订阅 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:12 CST (1h 冲刺)
> **Phase**: P3 商业化 (Phase-45~50, 6 phase, **20 天**已放宽)
> **预计**: 3 天

---

## 1. 业务目标

SaaS 订阅是平台基础商业模式:
- **多套餐**: 免费/基础/专业/企业
- **计费周期**: 月付/年付
- **升降级**: 套餐平滑切换
- **使用量计费**: API 调用次数/存储量
- **试用**: 14 天免费试用

---

## 2. 数据模型

### SubscriptionPlan (套餐)
```typescript
interface SubscriptionPlan {
  id: string
  tier: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  priceCents: number             // 月价
  yearlyPriceCents?: number      // 年价 (优惠)
  features: PlanFeature[]
  limits: PlanLimits
  trialDays: number
}

interface PlanLimits {
  maxUsers: number
  maxOrders: number              // 月
  maxStorageMB: number
  apiCallsPerMinute: number
}
```

### Subscription (订阅)
```typescript
interface Subscription {
  id: string
  tenantId: string
  planId: string
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
  startAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAt?: string
  trialEndsAt?: string
}
```

### Invoice (账单)
```typescript
interface Invoice {
  id: string
  tenantId: string
  subscriptionId: string
  amountCents: number
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID'
  dueAt: string
  paidAt?: string
  lineItems: InvoiceLineItem[]
}

interface InvoiceLineItem {
  description: string
  amountCents: number
  periodStart: string
  periodEnd: string
}
```

---

## 3. 任务卡 (T175 · P3)

| T-NN | 标题 | 估时 |
|------|------|------|
| T175-1 | 套餐管理 + 升降级 | 1d |
| T175-2 | 订阅周期 + 自动续费 | 1d |
| T175-3 | 账单 + 发票 | 1d |

**总计**: 3 天

---

## 4. Champion 督导
- E41 王集团董事长 (商业模式)
- E42 李事业部总经理 (营收 KPI)

---

## 5. 关键决策待定
1. **套餐层级**: 3 / 4 / 5 档?
2. **试用期**: 7 / 14 / 30 天?
3. **年付折扣**: 8 折 / 8.5 折 / 9 折?
4. **降级策略**: 立即降 vs 当前周期结束?
5. **欠费宽限**: 3 / 7 / 15 天?

---

> 🦞 **"Phase-45 SaaS 订阅 = P3 商业化第 1 步 = 现金流引擎"**---

## V3 Decision Lock · 2026-06-27 22:30 CST

### D1 Pricing Tiers: 3 plans (Free/Pro/Enterprise)
- Free: 100 orders/mo, 1 admin, basic features
- Pro: ¥999/mo, unlimited orders, 5 admins, AI CS, marketing
- Enterprise: ¥9999/mo, custom, white-label, dedicated CSM
- Custom: contact sales

### D2 Billing Model: Subscription + Usage hybrid
- Base: monthly subscription (per plan)
- Usage overage: per 1000 orders (Pro/Enterprise only)
- Annual discount: 17% off (2 months free)

### D3 Trial Period: 14 days, no credit card
- Auto-activate all Pro features
- Day 10 reminder, Day 13 final reminder
- Day 14 auto-downgrade to Free

### D4 Auto-renewal: ON by default, opt-out
- Default: auto-renew (industry standard)
- Notify 7 days before renewal
- Cancel anytime (prorated refund)

### D5 Payment: WeChat Pay + Alipay + Stripe
- CN: WeChat Pay + Alipay (¥)
- Overseas: Stripe (USD/EUR)
- Invoice: auto-generate monthly, downloadable PDF

### D6 MRR/ARR/Churn Tracking
- MRR: monthly recurring revenue
- ARR: MRR * 12
- Churn rate: (canceled / active) * 100
- LTV: avg lifetime value
- CAC: customer acquisition cost

---

## Current Status

Expected delta:
- New files: 8 (subscription-plan, lifecycle, billing-engine, payment-integration, invoice-generator, mrr-calculator, churn-detector, webhooks)
- Modified: 3 (Prisma +2 tables, app.module, frontend)
- Tests: 30+ assertions (lifecycle state machine, billing math, payment idempotency, MRR calculation)

> Phase-45 = SaaS Subscription = revenue engine foundation