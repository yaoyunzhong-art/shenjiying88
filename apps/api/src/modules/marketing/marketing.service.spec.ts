/* ===== marketing — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

type TenantId = string
type RFMRecency = 'RECENT_30D' | 'RECENT_60D' | 'RECENT_90D' | 'OVER_90D'
type RFMFrequency = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
type RFMMonetary = 'HIGH' | 'MEDIUM' | 'LOW'
type RFMSegmentType =
  | 'CHAMPIONS' | 'LOYAL' | 'POTENTIAL_LOYALIST'
  | 'RECENT' | 'PROMISING' | 'NEED_ATTENTION'
  | 'AT_RISK' | 'HIBERNATING'
type CouponSegment =
  | 'VIP_DISCOUNT' | 'LOYAL_REWARD' | 'WELCOME_OFFER'
  | 'REACTIVATION' | 'GENERIC'
type MarketingChannel = 'IN_APP' | 'WECHAT' | 'SMS' | 'PUSH'

interface RFMProfile {
  id: string
  tenantId: TenantId
  memberId: string
  recency: RFMRecency
  frequency: RFMFrequency
  monetary: RFMMonetary
  segment: RFMSegmentType
  daysSinceLastOrder: number
  orderCount90d: number
  totalSpendCents: number
  computedAt: string
  updatedAt: string
}

interface RFMStats {
  totalMembers: number
  segmentDistribution: Record<RFMSegmentType, number>
  avgRecencyDays: number
  avgFrequency: number
  avgMonetaryCents: number
}

interface FrequencyCapStatus {
  memberId: string
  windowDays: number
  issuedInWindow: number
  maxPerWindow: number
  allowed: boolean
  nextAvailableAt?: string
}

interface CouponIssueRecord {
  id: string
  tenantId: TenantId
  memberId: string
  campaignId: string
  couponSegment: CouponSegment
  issuedAt: string
  expiresAt: string
  redeemed: boolean
  redeemedAt?: string
  frequencyWindowDays: number
}

interface CampaignROI {
  campaignId: string
  campaignName: string
  sent: number
  clicked: number
  converted: number
  revenueCents: number
  costCents: number
  roi: number
  conversionRate: number
  ctr: number
  cpaCents: number
  periodDays: number
}

interface TouchPoint {
  id: string
  memberId: string
  campaignId?: string
  channel: 'IN_APP' | 'WECHAT' | 'SMS' | 'DIRECT' | 'ORGANIC'
  event: 'IMPRESSION' | 'CLICK' | 'CONVERSION'
  timestamp: string
  revenueCents?: number
}

interface UserChannelPreference {
  memberId: string
  enabled: MarketingChannel[]
  optedOut: MarketingChannel[]
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

function makeRFMProfile(overrides?: Partial<RFMProfile>): RFMProfile {
  return {
    id: 'rfm-1',
    tenantId: 't1',
    memberId: 'm1',
    recency: 'RECENT_30D',
    frequency: 'HIGH',
    monetary: 'HIGH',
    segment: 'CHAMPIONS',
    daysSinceLastOrder: 5,
    orderCount90d: 10,
    totalSpendCents: 100000,
    computedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeCouponRecord(overrides?: Partial<CouponIssueRecord>): CouponIssueRecord {
  return {
    id: 'rec-1',
    tenantId: 't1',
    memberId: 'm1',
    campaignId: 'c1',
    couponSegment: 'GENERIC',
    issuedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    redeemed: false,
    frequencyWindowDays: 7,
    ...overrides,
  }
}

function makeStats(overrides?: Partial<RFMStats>): RFMStats {
  return {
    totalMembers: 100,
    segmentDistribution: {
      CHAMPIONS: 10,
      LOYAL: 10,
      POTENTIAL_LOYALIST: 10,
      RECENT: 10,
      PROMISING: 10,
      NEED_ATTENTION: 10,
      AT_RISK: 20,
      HIBERNATING: 20,
    },
    avgRecencyDays: 30,
    avgFrequency: 3,
    avgMonetaryCents: 50000,
    ...overrides,
  }
}

function makeTouchPoint(overrides?: Partial<TouchPoint>): TouchPoint {
  return {
    id: 'tp-1',
    memberId: 'm1',
    campaignId: 'c1',
    channel: 'IN_APP',
    event: 'IMPRESSION',
    timestamp: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

/** 8个分群列表（模拟 listSegments） */
function getSegmentList(): Array<{ type: RFMSegmentType; name: string; description: string }> {
  return [
    { type: 'CHAMPIONS', name: '冠军客户', description: '高 R + 高 F + 高 M' },
    { type: 'LOYAL', name: '忠诚客户', description: '高 F + 高 M' },
    { type: 'POTENTIAL_LOYALIST', name: '潜力忠诚', description: '高 R + 中 F + 中 M' },
    { type: 'RECENT', name: '新客户', description: '高 R + 低 F + 低 M' },
    { type: 'PROMISING', name: '有潜力', description: '中 R + 低 F + 低 M' },
    { type: 'NEED_ATTENTION', name: '需关注', description: '中 R + 中 F + 中 M' },
    { type: 'AT_RISK', name: '流失风险', description: '低 R + 高 F + 高 M' },
    { type: 'HIBERNATING', name: '休眠客户', description: '低 R + 低 F + 低 M' },
  ]
}

/** 按分群过滤成员 */
function getMembersInSegment(profiles: RFMProfile[], segment: RFMSegmentType): RFMProfile[] {
  return profiles.filter((p) => p.segment === segment)
}

/** 分群健康检查：每个分群占比不低于5%且不超过50% */
function isDistributionHealthy(stats: RFMStats): boolean {
  const values = Object.values(stats.segmentDistribution)
  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0) return true
  return values.every((v) => {
    const ratio = v / total
    // Skip empty segments (0 members)
    if (ratio === 0) return true
    return ratio >= 0.05 && ratio <= 0.5
  })
}

/** 频控检查 */
function checkFrequencyCap(
  records: CouponIssueRecord[],
  memberId: string,
  windowDays: number,
  maxPerWindow: number,
  now: number = Date.now(),
): FrequencyCapStatus {
  const windowMs = windowDays * 24 * 60 * 60 * 1000
  const issuedInWindow = records.filter((r) => {
    const issuedTime = new Date(r.issuedAt).getTime()
    return r.memberId === memberId && (now - issuedTime) <= windowMs
  }).length
  const allowed = issuedInWindow < maxPerWindow
  return {
    memberId,
    windowDays,
    issuedInWindow,
    maxPerWindow,
    allowed,
    nextAvailableAt: allowed ? undefined : new Date(now + windowMs).toISOString(),
  }
}

/** ROI 计算 */
function computeROI(input: {
  campaignId: string
  campaignName: string
  sent: number
  clicked: number
  converted: number
  revenueCents: number
  costCents: number
  periodDays: number
}): CampaignROI {
  const ctr = input.sent > 0 ? input.clicked / input.sent : 0
  const conversionRate = input.clicked > 0 ? input.converted / input.clicked : 0
  const roi = input.costCents > 0
    ? (input.revenueCents - input.costCents) / input.costCents
    : 0
  const cpaCents = input.converted > 0
    ? Math.round(input.costCents / input.converted)
    : 0
  return {
    campaignId: input.campaignId,
    campaignName: input.campaignName,
    sent: input.sent,
    clicked: input.clicked,
    converted: input.converted,
    revenueCents: input.revenueCents,
    costCents: input.costCents,
    roi: Number(roi.toFixed(4)),
    conversionRate: Number(conversionRate.toFixed(4)),
    ctr: Number(ctr.toFixed(4)),
    cpaCents,
    periodDays: input.periodDays,
  }
}

/** 从 TouchPoint 汇总 ROI */
function computeROIFromTouchPoints(
  touchPoints: TouchPoint[],
  campaignId: string,
  campaignName: string,
  costCents: number,
  periodDays: number,
): CampaignROI {
  let sent = 0
  let clicked = 0
  let converted = 0
  let revenueCents = 0
  for (const tp of touchPoints) {
    if (tp.event === 'IMPRESSION') sent++
    else if (tp.event === 'CLICK') clicked++
    else if (tp.event === 'CONVERSION') {
      converted++
      revenueCents += tp.revenueCents ?? 0
    }
  }
  return computeROI({
    campaignId,
    campaignName,
    sent,
    clicked,
    converted,
    revenueCents,
    costCents,
    periodDays,
  })
}

/** 渠道路由：按优先级 + 偏好选择渠道 */
const CHANNEL_PRIORITY: MarketingChannel[] = ['IN_APP', 'WECHAT', 'SMS', 'PUSH']
const CHANNEL_COST: Record<MarketingChannel, number> = {
  IN_APP: 0,
  PUSH: 100,
  WECHAT: 500,
  SMS: 1500,
}

function routeChannel(preferences: Map<string, UserChannelPreference>, memberId: string): MarketingChannel {
  const pref = preferences.get(memberId) ?? {
    memberId,
    enabled: ['IN_APP', 'WECHAT'],
    optedOut: ['SMS'],
  }
  for (const ch of CHANNEL_PRIORITY) {
    if (pref.enabled.includes(ch) && !pref.optedOut.includes(ch)) {
      return ch
    }
  }
  return 'IN_APP'
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('MarketingService (inline)', () => {
  // ── 分群列表 ──
  describe('listSegments', () => {
    it('should return exactly 8 segments', () => {
      const segs = getSegmentList()
      expect(segs).toHaveLength(8)
    })

    it('should include all 8 RFM segment types', () => {
      const segs = getSegmentList()
      const types = segs.map((s) => s.type)
      expect(types).toContain('CHAMPIONS')
      expect(types).toContain('LOYAL')
      expect(types).toContain('POTENTIAL_LOYALIST')
      expect(types).toContain('RECENT')
      expect(types).toContain('PROMISING')
      expect(types).toContain('NEED_ATTENTION')
      expect(types).toContain('AT_RISK')
      expect(types).toContain('HIBERNATING')
    })

    it('should have Chinese names for all segments', () => {
      const segs = getSegmentList()
      segs.forEach((s) => {
        expect(typeof s.name).toBe('string')
        expect(s.name.length).toBeGreaterThan(0)
        expect(typeof s.description).toBe('string')
        expect(s.description.length).toBeGreaterThan(0)
      })
    })

    it('should have CHAMPIONS as the first segment', () => {
      const segs = getSegmentList()
      expect(segs[0].type).toBe('CHAMPIONS')
      expect(segs[0].name).toBe('冠军客户')
    })
  })

  // ── 分群过滤 ──
  describe('getMembersInSegment', () => {
    it('should return members matching the segment type', () => {
      const profiles = [
        makeRFMProfile({ id: '1', segment: 'CHAMPIONS', memberId: 'm1' }),
        makeRFMProfile({ id: '2', segment: 'CHAMPIONS', memberId: 'm2' }),
        makeRFMProfile({ id: '3', segment: 'LOYAL', memberId: 'm3' }),
      ]
      const champions = getMembersInSegment(profiles, 'CHAMPIONS')
      expect(champions).toHaveLength(2)
      expect(champions.map((p) => p.memberId)).toEqual(['m1', 'm2'])
    })

    it('should return empty array when no members match', () => {
      const profiles = [
        makeRFMProfile({ id: '1', segment: 'CHAMPIONS' }),
      ]
      expect(getMembersInSegment(profiles, 'HIBERNATING')).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      expect(getMembersInSegment([], 'CHAMPIONS')).toHaveLength(0)
    })
  })

  // ── 分群健康检查 ──
  describe('isDistributionHealthy', () => {
    it('should return true for balanced distribution', () => {
      expect(isDistributionHealthy(makeStats())).toBe(true)
    })

    it('should return false when a segment is below 5%', () => {
      const stats = makeStats({
        segmentDistribution: {
          CHAMPIONS: 1,
          LOYAL: 99,
          POTENTIAL_LOYALIST: 0,
          RECENT: 0,
          PROMISING: 0,
          NEED_ATTENTION: 0,
          AT_RISK: 0,
          HIBERNATING: 0,
        },
      })
      expect(isDistributionHealthy(stats)).toBe(false)
    })

    it('should return false when a segment exceeds 50%', () => {
      const stats = makeStats({
        segmentDistribution: {
          CHAMPIONS: 60,
          LOYAL: 5,
          POTENTIAL_LOYALIST: 5,
          RECENT: 5,
          PROMISING: 5,
          NEED_ATTENTION: 5,
          AT_RISK: 10,
          HIBERNATING: 5,
        },
      })
      expect(isDistributionHealthy(stats)).toBe(false)
    })

    it('边界: segmentDistribution 为空时返回 false', () => {
      const stats = makeStats({ totalMembers: 0, segmentDistribution: {} as any })
      expect(isDistributionHealthy(stats)).toBe(false)
    })
  })

  // ── 频控检查 ──
  describe('checkFrequencyCap', () => {
    it('should allow when no records exist', () => {
      const status = checkFrequencyCap([], 'm1', 7, 1)
      expect(status.allowed).toBe(true)
      expect(status.issuedInWindow).toBe(0)
    })

    it('should allow when within window limit', () => {
      const records = [makeCouponRecord({ memberId: 'm1' })]
      const status = checkFrequencyCap(records, 'm1', 7, 2)
      expect(status.allowed).toBe(true)
      expect(status.issuedInWindow).toBe(1)
    })

    it('should deny when at limit', () => {
      const records = [makeCouponRecord({ memberId: 'm1' })]
      const status = checkFrequencyCap(records, 'm1', 7, 1)
      expect(status.allowed).toBe(false)
      expect(status.issuedInWindow).toBe(1)
      expect(status.nextAvailableAt).toBeDefined()
    })

    it('should only count records for the same member', () => {
      const records = [
        makeCouponRecord({ id: '1', memberId: 'm1' }),
        makeCouponRecord({ id: '2', memberId: 'm2' }),
      ]
      const status = checkFrequencyCap(records, 'm1', 7, 1)
      expect(status.allowed).toBe(false)
      expect(status.issuedInWindow).toBe(1)
    })

    it('should use custom window days', () => {
      const oldRecord = makeCouponRecord({
        memberId: 'm1',
        issuedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      })
      // 30天窗口允许2个
      const status = checkFrequencyCap([oldRecord], 'm1', 30, 2)
      expect(status.allowed).toBe(true)
      expect(status.windowDays).toBe(30)
    })
  })

  // ── ROI 计算 ──
  describe('computeROI', () => {
    it('should compute positive ROI correctly', () => {
      const roi = computeROI({
        campaignId: 'c1',
        campaignName: 'Spring Sale',
        sent: 1000,
        clicked: 200,
        converted: 50,
        revenueCents: 500000,
        costCents: 100000,
        periodDays: 7,
      })
      expect(roi.roi).toBe(4) // (500000-100000)/100000
      expect(roi.conversionRate).toBe(0.25)
      expect(roi.ctr).toBe(0.2)
      expect(roi.cpaCents).toBe(2000)
    })

    it('should return 0 ROI when cost is zero', () => {
      const roi = computeROI({
        campaignId: 'c1',
        campaignName: 'Zero Cost',
        sent: 100,
        clicked: 10,
        converted: 1,
        revenueCents: 10000,
        costCents: 0,
        periodDays: 7,
      })
      expect(roi.roi).toBe(0)
    })

    it('should compute negative ROI for loss-making campaigns', () => {
      const roi = computeROI({
        campaignId: 'c1',
        campaignName: 'Loss Leader',
        sent: 1000,
        clicked: 50,
        converted: 5,
        revenueCents: 10000,
        costCents: 50000,
        periodDays: 7,
      })
      expect(roi.roi).toBeLessThan(0)
    })

    it('should handle zero sent gracefully', () => {
      const roi = computeROI({
        campaignId: 'c1',
        campaignName: 'No Send',
        sent: 0,
        clicked: 0,
        converted: 0,
        revenueCents: 0,
        costCents: 100,
        periodDays: 7,
      })
      expect(roi.ctr).toBe(0)
      expect(roi.conversionRate).toBe(0)
      expect(roi.cpaCents).toBe(0)
    })

    it('should round cpa correctly', () => {
      const roi = computeROI({
        campaignId: 'c1',
        campaignName: 'CPA Test',
        sent: 100,
        clicked: 10,
        converted: 3,
        revenueCents: 3000,
        costCents: 1000,
        periodDays: 7,
      })
      expect(roi.cpaCents).toBe(333) // Math.round(1000/3)
    })
  })

  // ── TouchPoint ROI ──
  describe('computeROIFromTouchPoints', () => {
    it('should aggregate touchpoints correctly', () => {
      const tps = [
        makeTouchPoint({ id: '1', memberId: 'm1', event: 'IMPRESSION' }),
        makeTouchPoint({ id: '2', memberId: 'm2', event: 'IMPRESSION' }),
        makeTouchPoint({ id: '3', memberId: 'm1', event: 'CLICK' }),
        makeTouchPoint({
          id: '4', memberId: 'm1', event: 'CONVERSION', revenueCents: 50000,
        }),
      ]
      const roi = computeROIFromTouchPoints(tps, 'c1', 'Test', 10000, 7)
      expect(roi.sent).toBe(2)
      expect(roi.clicked).toBe(1)
      expect(roi.converted).toBe(1)
      expect(roi.revenueCents).toBe(50000)
    })

    it('should handle empty touchpoints', () => {
      const roi = computeROIFromTouchPoints([], 'c1', 'Empty', 0, 7)
      expect(roi.sent).toBe(0)
      expect(roi.clicked).toBe(0)
      expect(roi.converted).toBe(0)
      expect(roi.revenueCents).toBe(0)
    })

    it('should ignore impressions without other events', () => {
      const tps = [
        makeTouchPoint({ id: '1', event: 'IMPRESSION', revenueCents: 100 }),
        makeTouchPoint({ id: '2', event: 'IMPRESSION' }),
      ]
      const roi = computeROIFromTouchPoints(tps, 'c1', 'Impressions Only', 0, 7)
      expect(roi.sent).toBe(2)
      expect(roi.clicked).toBe(0)
      expect(roi.converted).toBe(0)
      expect(roi.revenueCents).toBe(0)
    })
  })

  // ── 渠道路由 ──
  describe('routeChannel', () => {
    it('should default to IN_APP when no preference exists', () => {
      const prefs = new Map<string, UserChannelPreference>()
      expect(routeChannel(prefs, 'new-user')).toBe('IN_APP')
    })

    it('should select the highest priority enabled channel', () => {
      const prefs = new Map<string, UserChannelPreference>()
      prefs.set('m1', {
        memberId: 'm1',
        enabled: ['SMS', 'WECHAT'],
        optedOut: [],
      })
      expect(routeChannel(prefs, 'm1')).toBe('WECHAT')
    })

    it('should skip opted out channels', () => {
      const prefs = new Map<string, UserChannelPreference>()
      prefs.set('m1', {
        memberId: 'm1',
        enabled: ['IN_APP', 'WECHAT', 'SMS'],
        optedOut: ['WECHAT'],
      })
      expect(routeChannel(prefs, 'm1')).toBe('IN_APP')
    })

    it('should fallback to IN_APP when no channel is available', () => {
      const prefs = new Map<string, UserChannelPreference>()
      prefs.set('m1', {
        memberId: 'm1',
        enabled: [],
        optedOut: [],
      })
      expect(routeChannel(prefs, 'm1')).toBe('IN_APP')
    })
  })

  // ── 集成场景 ──
  describe('integration scenarios', () => {
    it('should chain segment filtering + health check', () => {
      const profiles = [
        makeRFMProfile({ id: '1', segment: 'CHAMPIONS', memberId: 'm1' }),
        makeRFMProfile({ id: '2', segment: 'CHAMPIONS', memberId: 'm2' }),
        makeRFMProfile({ id: '3', segment: 'AT_RISK', memberId: 'm3' }),
        makeRFMProfile({ id: '4', segment: 'HIBERNATING', memberId: 'm4' }),
      ]
      const champions = getMembersInSegment(profiles, 'CHAMPIONS')
      expect(champions).toHaveLength(2)
      const stats = makeStats({
        totalMembers: 4,
        segmentDistribution: {
          CHAMPIONS: 2,
          LOYAL: 0,
          POTENTIAL_LOYALIST: 0,
          RECENT: 0,
          PROMISING: 0,
          NEED_ATTENTION: 0,
          AT_RISK: 1,
          HIBERNATING: 1,
        },
      })
      // 2/4 = 50%, AT_RISK 1/4 = 25%, OK
      expect(isDistributionHealthy(stats)).toBe(true)
    })

    it('should model full coupon flow: check → deny → wait', () => {
      const records = [
        makeCouponRecord({ id: 'r1', memberId: 'm1', frequencyWindowDays: 7 }),
      ]
      const status1 = checkFrequencyCap(records, 'm1', 7, 1)
      expect(status1.allowed).toBe(false)

      const recordsAfterWindow = [
        makeCouponRecord({
          id: 'r1', memberId: 'm1', frequencyWindowDays: 7,
          issuedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        }),
      ]
      const status2 = checkFrequencyCap(recordsAfterWindow, 'm1', 7, 1)
      expect(status2.allowed).toBe(true)
    })
  })
})
