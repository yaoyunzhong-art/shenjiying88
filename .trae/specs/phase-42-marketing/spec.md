# Phase-42 智能营销 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:06 CST (1h 冲刺)
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **Phase**: P2 智能化 (Phase-41~44, 4 phase)
> **预计**: 1 天

---

## 1. 业务目标

智能营销是 SaaS 平台增长引擎:
- **精准营销**: 基于会员画像推送优惠券
- **营销自动化**: 触发器 + 流程编排
- **A/B 测试**: 营销活动效果对比
- **ROI 分析**: 营销活动转化率与回报
- **多渠道**: 短信/微信/站内信/App Push

依赖 Phase-36 会员 + Phase-40 推荐。

---

## 2. 数据模型

### MarketingCampaign (营销活动)
```typescript
interface MarketingCampaign {
  id: string
  tenantId: string
  name: string
  type: 'COUPON' | 'POINTS' | 'PRICE_OFF' | 'BUNDLE'
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'ENDED'
  targetSegment: SegmentRule         // 目标人群
  reward: CampaignReward              // 奖励
  schedule: CampaignSchedule          // 触发时间
  channels: Channel[]                 // 推送渠道
  startAt: string
  endAt: string
}

interface SegmentRule {
  matchAll?: boolean
  conditions: Array<{
    field: string                    // level, totalSpent, lastVisit, etc.
    op: 'EQ' | 'GT' | 'LT' | 'IN' | 'BETWEEN'
    value: unknown
  }>
}

interface CampaignReward {
  type: 'COUPON' | 'POINTS' | 'DISCOUNT'
  amount?: number
  couponId?: string
  points?: number
  discountPercent?: number
}

interface Channel {
  type: 'SMS' | 'WX' | 'PUSH' | 'INBOX'
  enabled: boolean
  templateId?: string
}
```

### ABTest (A/B 测试)
```typescript
interface ABTest {
  id: string
  campaignId: string
  variantA: ABVariant
  variantB: ABVariant
  trafficSplit: number              // 0.5 = 50/50
  startAt: string
  endAt: string
  metrics: {
    sentA: number; sentB: number
    clickedA: number; clickedB: number
    convertedA: number; convertedB: number
    winner?: 'A' | 'B' | 'INCONCLUSIVE'
  }
}

interface ABVariant {
  content: string
  reward: CampaignReward
}
```

### MarketingTrigger (触发器)
```typescript
type TriggerEvent =
  | 'MEMBER_REGISTERED'
  | 'MEMBER_BIRTHDAY'
  | 'ORDER_COMPLETED'
  | 'INACTIVE_30_DAYS'
  | 'LEVEL_UP'

interface MarketingTrigger {
  id: string
  event: TriggerEvent
  campaignId: string
  delayMinutes: number
  enabled: boolean
}
```

---

## 3. 任务卡 (T172)

| T-NN | 标题 | 估时 |
|------|------|------|
| T172-1 | 人群分群 + 触发器引擎 | 0.5d |
| T172-2 | A/B 测试框架 | 0.25d |
| T172-3 | ROI 仪表盘 | 0.25d |

**总计**: 1 天

---

## 4. Champion 督导
- E19 王运营总监 (营销 KPI)
- E41 王董事长 (跨业务线 ROI)

---

## 5. 关键决策待定
1. **触发器**: 实时 vs 批量?
2. **A/B 流量**: 默认 50/50?
3. **ROI 周期**: 7 天 / 30 天?
4. **频控**: 同用户每天最多 1 次营销触达?
5. **退订**: 是否支持?

---

> 🦞 **"Phase-42 智能营销 = P2 智能化第 2 步 = 增长引擎"**
---

## V3 Decision Lock · 2026-06-27 22:25 CST

### D1 RFM Model: Self-built + 3 dimensions
- Recency: last 30d / 60d / 90d
- Frequency: order count last 90d
- Monetary: total spend last 180d
- 8 segments: Champions / Loyal / At-Risk / Hibernating etc.

### D2 AB Testing: Feature Flag + 50/50 split
- Use existing FF infrastructure
- 50/50 split based on hash(userId) % 2
- Min sample size: 1000 conversions per variant
- Statistical significance: p < 0.05

### D3 Coupon Precision: RFM-driven + frequency cap
- Coupon type matched to segment (Champions → VIP discount)
- Frequency cap: max 1 coupon per user per 7 days
- Total budget cap: monthly per tenant

### D4 Channel: Multi-channel (in-app + wechat + SMS)
- Priority: in-app (cheapest) > wechat (mid) > SMS (expensive)
- User preference: respect channel settings

### D5 Attribution: Last non-direct touch (V1) → Multi-touch (V2)
- V1: last non-direct click
- V2: position-based (40% first + 40% last + 20% middle)
- Time decay: 7-day half-life

---

## 现状盘点

- 新增文件: 6 个 (campaign-engine / ab-test / coupon-issuer / rfm-calculator / attribution / segment)
- 修改文件: 2 个 (Prisma Campaign/Experiment 2 表 + app.module)
- 测试: 20+ 断言 (RFM 分类 / AB 流量 / 优惠券去重 / 归因计算)

> Phase-42 = Intelligent Marketing = RFM + AB + 优惠券精准 = SaaS 营销护城河
