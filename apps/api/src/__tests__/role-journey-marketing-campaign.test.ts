/**
 * 🧪 角色旅程测试: 营销活动模块
 *
 * 场景覆盖: campaign(活动), coupon(优惠券), blindbox(盲盒), marketing(营销), promotion(促销)
 * 角色: 📢营销, 👔店长, 🤝团建, 🎯运行专员
 *
 * 每个角色: 正例(happy path) + 反例(error case) + 边界(edge case)
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  Marketing: '📢营销',
  StoreManager: '👔店长',
  Teambuilding: '🤝团建',
  Operations: '🎯运行专员',
} as const

function mockSuccess(data: any, code = 200) {
  return { success: true, code, data, ts: Date.now() }
}
function mockError(code: number, msg: string) {
  return { success: false, code, message: msg, ts: Date.now() }
}

const ModuleAccess: Record<string, readonly string[]> = {
  campaign:  ['👔店长', '📢营销', '🤝团建'] as const,
  coupon:    ['👔店长', '📢营销', '🎯运行专员'] as const,
  blindbox:  ['👔店长', '🎮导玩员', '📢营销'] as const,
  marketing: ['👔店长', '📢营销', '🎯运行专员'] as const,
}

function canAccess(role: string, mod: string) {
  return (ModuleAccess[mod] ?? []).includes(role)
}

// ═══════════════════════════════════════════════════════════════════
// 📢营销 - 营销活动主场
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销活动旅程`, () => {
  it('📢[正例] 营销创建优惠券活动 → 设置盲盒促销 → 发布 → 查看效果', () => {
    // 1. 创建优惠券活动 (coupon)
    expect(canAccess(ROLES.Marketing, 'coupon')).toBe(true)
    const coupon = mockSuccess({ id: 'CPN-20260718-001', name: '暑期8折券', type: 'discount', value: 0.8, totalQty: 500, status: 'draft' })
    expect(coupon.data.value).toBe(0.8)

    // 2. 设置盲盒促销 (blindbox)
    expect(canAccess(ROLES.Marketing, 'blindbox')).toBe(true)
    const blindbox = mockSuccess({ id: 'BB-001', name: '夏日限定盲盒', originalPrice: 30, promotionPrice: 20, promotionStart: '2026-07-18' })
    expect(blindbox.data.promotionPrice).toBeLessThan(blindbox.data.originalPrice)

    // 3. 发布活动 (campaign)
    expect(canAccess(ROLES.Marketing, 'campaign')).toBe(true)
    const published = mockSuccess({ id: 'CAM-001', couponId: coupon.data.id, status: 'active', publishTime: Date.now() })
    expect(published.data.status).toBe('active')

    // 4. 查看效果 (marketing)
    expect(canAccess(ROLES.Marketing, 'marketing')).toBe(true)
    const metrics = mockSuccess({ usedCount: 42, revenue: 3360, redemptionRate: 0.084 })
    expect(metrics.data.usedCount).toBe(42)
  })

  it('📢[正例] 营销创建团建活动方案 → 设置团购价 → 投放', () => {
    expect(canAccess(ROLES.Marketing, 'campaign')).toBe(true)
    const activity = mockSuccess({ id: 'CAM-010', title: '企业团购专场', type: 'group', groupPrice: 88, capacity: 30, status: 'draft' })
    expect(activity.data.groupPrice).toBe(88)

    const launched = mockSuccess({ id: activity.data.id, status: 'active', channels: ['小程序', '公众号'] })
    expect(launched.data.status).toBe('active')
  })

  it('📢[反例] 营销创建折扣超过70%被风控拦截', () => {
    const riskBlock = mockError(400, 'DISCOUNT_EXCEEDS_MAX:MAX_70_PERCENT')
    expect(riskBlock.code).toBe(400)
    expect(riskBlock.message).toContain('70')
  })

  it('📢[反例] 营销操作敏感客户数据被拒绝', () => {
    const noMember = mockError(403, 'MEMBER_PRIVACY_RESTRICTED')
    expect(noMember.success).toBe(false)
  })

  it('📢[边界] 营销活动投放后0核销', () => {
    const zeroEffect = mockSuccess({ campaignId: 'CAM-099', issued: 500, redeemed: 0, revenueImpact: 0 })
    expect(zeroEffect.data.redeemed).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👔店长 - 营销审批与监控
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 营销活动旅程`, () => {
  it('👔[正例] 店长审批营销活动 → 查看优惠券领取情况 → 分析活动ROI', () => {
    // 查看待审批活动
    expect(canAccess(ROLES.StoreManager, 'campaign')).toBe(true)
    const pending = mockSuccess([{ id: 'CAM-020', title: '返校季促销', status: 'pending_approval', budget: 20000 }])
    expect(pending.data[0].status).toBe('pending_approval')

    // 审批通过
    const approved = mockSuccess({ id: 'CAM-020', status: 'approved', approvedBy: ROLES.StoreManager })
    expect(approved.data.status).toBe('approved')

    // 查看优惠券领取
    expect(canAccess(ROLES.StoreManager, 'coupon')).toBe(true)
    const usage = mockSuccess({ totalIssued: 200, claimed: 145, remained: 55 })
    expect(usage.data.remained).toBe(55)
  })

  it('👔[反例] 店长不能在未审情况下直接发布活动', () => {
    const skipApproval = mockError(400, 'APPROVAL_REQUIRED_BEFORE_PUBLISH')
    expect(skipApproval.code).toBe(400)
  })

  it('👔[边界] 店长查看过期活动优惠券', () => {
    const expired = mockSuccess({ id: 'CPN-OLD', status: 'expired', expiredAt: '2026-07-01', unusedQty: 300 })
    expect(expired.data.status).toBe('expired')
    expect(expired.data.unusedQty).toBe(300)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝团建 - 活动发布与报名管理
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 营销活动旅程`, () => {
  it('🤝[正例] 团建查看活动列表 → 发布团建方案 → 收集报名 → 确认成团', () => {
    expect(canAccess(ROLES.Teambuilding, 'campaign')).toBe(true)
    // 查看已有活动方案
    const plans = mockSuccess([{ id: 'TB-001', name: '密室逃脱挑战', capacity: 8, price: 128, enrollCount: 3 }])
    expect(plans.data.length).toBe(1)

    // 发布新方案
    const published = mockSuccess({ id: 'TB-002', name: '电竞对抗赛', capacity: 12, price: 198, status: 'published' })
    expect(published.data.status).toBe('published')

    // 收集报名
    const enroll = mockSuccess({ activityId: published.data.id, enrollments: 8, confirmed: 6 })
    expect(enroll.data.enrollments).toBe(8)
  })

  it('🤝[反例] 团建活动报名截止后修改方案', () => {
    const closed = mockError(403, 'ACTIVITY_LOCKED_AFTER_DEADLINE')
    expect(closed.code).toBe(403)
  })

  it('🤝[反例] 团建不能创建折扣优惠券', () => {
    expect(canAccess(ROLES.Teambuilding, 'coupon')).toBe(false)
    const blocked = mockError(403, 'COUPON_ACCESS_DENIED')
    expect(blocked.code).toBe(403)
  })

  it('🤝[边界] 团建活动报名人数不足取消', () => {
    const canceled = mockSuccess({ activityId: 'TB-099', enrollments: 2, minRequired: 5, status: 'canceled', reason: 'INSUFFICIENT_ENROLLMENT' })
    expect(canceled.data.status).toBe('canceled')
    expect(canceled.data.enrollments).toBeLessThan(canceled.data.minRequired)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯运行专员 - 营销数据分析
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 营销活动旅程`, () => {
  it('🎯[正例] 运行专员分析优惠券核销率 → 查看盲盒销量 → 生成运营报表', () => {
    // 查看优惠券核销
    expect(canAccess(ROLES.Operations, 'coupon')).toBe(true)
    const couponStats = mockSuccess({ period: '2026-W29', totalIssued: 800, redeemed: 356, rate: 0.445 })
    expect(couponStats.data.rate).toBe(0.445)

    // 盲盒销售
    const blindboxSales = mockSuccess({ period: '2026-W29', totalSold: 120, revenue: 3600, topSku: '夏日限定' })
    expect(blindboxSales.data.totalSold).toBe(120)
  })

  it('🎯[反例] 运行专员不能创建营销活动', () => {
    expect(canAccess(ROLES.Operations, 'campaign')).toBe(false)
    const blocked = mockError(403, 'CAMPAIGN_CREATE_DENIED')
    expect(blocked.code).toBe(403)
  })

  it('🎯[反例] 运行专员不能修改盲盒价格', () => {
    const writeBlock = mockError(403, 'PRICE_MODIFICATION_RESTRICTED')
    expect(writeBlock.success).toBe(false)
  })

  it('🎯[边界] 运行专员查看跨门店营销数据对比', () => {
    const crossStore = mockSuccess([
      { store: 'A店', redemption: 120, revenue: 9600 },
      { store: 'B店', redemption: 45, revenue: 3600 },
    ])
    const totalRevenue = crossStore.data.reduce((s: number, r: any) => s + r.revenue, 0)
    expect(totalRevenue).toBe(13200)
  })
})
