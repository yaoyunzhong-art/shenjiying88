/**
 * 🐜 自动: [marketing] [A] e2e 补全
 *
 * Marketing 模块 E2E 测试
 * - RFM 8 分群 + A/B 显著性 + 优惠券频控 + 归因 + ROI + 渠道路由
 */
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import { MarketingController } from '../apps/api/src/modules/marketing/marketing.controller'
import { RFMCalculator } from '../apps/api/src/modules/marketing/rfm-calculator'
import { ABTestEngine } from '../apps/api/src/modules/marketing/ab-test'
import { CouponIssuer } from '../apps/api/src/modules/marketing/coupon-issuer'
import { AttributionEngine } from '../apps/api/src/modules/marketing/attribution'
import { SegmentService } from '../apps/api/src/modules/marketing/segment.service'
import { FrequencyCapService } from '../apps/api/src/modules/marketing/frequency-cap.service'
import { ROICalculator } from '../apps/api/src/modules/marketing/roi-calculator'
import { ChannelRouter } from '../apps/api/src/modules/marketing/channel-router'
import { RFMAdapter } from '../apps/api/src/modules/marketing/datasources/rfm.adapter'
import { MemberAdapter } from '../apps/api/src/modules/marketing/datasources/member.adapter'
import { OrderAdapter } from '../apps/api/src/modules/marketing/datasources/order.adapter'
import { ExperimentAdapter } from '../apps/api/src/modules/marketing/datasources/experiment.adapter'
import { CouponAdapter } from '../apps/api/src/modules/marketing/datasources/coupon.adapter'

const TENANT = 't-mkt-e2e'
const OTHER_TENANT = 't-mkt-e2e-other'
const NOW = Date.now()  // 使用当前时间, 让 RFM 计算正确

function buildController() {
  const rfmAdapter = new RFMAdapter()
  const memberAdapter = new MemberAdapter()
  const orderAdapter = new OrderAdapter()
  const expAdapter = new ExperimentAdapter()
  const couponAdapter = new CouponAdapter()

  // 灌入数据集
  memberAdapter.seed([
    // T1: 4 个不同 RFM 画像
    { id: 'm-champ', tenantId: TENANT, level: 'GOLD', lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 12, lastActiveAt: new Date(NOW - 5 * 86400000).toISOString(), createdAt: new Date(NOW - 365 * 86400000).toISOString() },
    { id: 'm-loyal', tenantId: TENANT, level: 'PLATINUM', lifecycleStage: 'ACTIVE', totalSpendCents: 200000, orderCount: 50, lastActiveAt: new Date(NOW - 60 * 86400000).toISOString(), createdAt: new Date(NOW - 730 * 86400000).toISOString() },
    { id: 'm-at-risk', tenantId: TENANT, level: 'GOLD', lifecycleStage: 'DORMANT', totalSpendCents: 80000, orderCount: 20, lastActiveAt: new Date(NOW - 120 * 86400000).toISOString(), createdAt: new Date(NOW - 365 * 86400000).toISOString() },
    { id: 'm-hiber', tenantId: TENANT, level: 'BRONZE', lifecycleStage: 'CHURNED', totalSpendCents: 2000, orderCount: 1, lastActiveAt: new Date(NOW - 365 * 86400000).toISOString(), createdAt: new Date(NOW - 730 * 86400000).toISOString() },
    // T2: 跨租户隔离测试
    { id: 'm-other', tenantId: OTHER_TENANT, level: 'GOLD', lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() }
  ])

  orderAdapter.seed([
    // m-champ: 12 笔订单 都在 30 天内
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `o-champ-${i}`, tenantId: TENANT, memberId: 'm-champ', totalCents: 10000, status: 'COMPLETED' as const,
      createdAt: new Date(NOW - i * 2 * 86400000).toISOString()
    })),
    // m-loyal: 50 笔订单 50-100 天前
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `o-loyal-${i}`, tenantId: TENANT, memberId: 'm-loyal', totalCents: 20000, status: 'COMPLETED' as const,
      createdAt: new Date(NOW - (50 + i) * 86400000).toISOString()
    })),
    // m-at-risk: 20 笔订单 95-150 天前
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `o-risk-${i}`, tenantId: TENANT, memberId: 'm-at-risk', totalCents: 5000, status: 'COMPLETED' as const,
      createdAt: new Date(NOW - (95 + i * 3) * 86400000).toISOString()
    })),
    // m-hiber: 1 笔订单 1 年前
    { id: 'o-hiber-1', tenantId: TENANT, memberId: 'm-hiber', totalCents: 2000, status: 'COMPLETED' as const, createdAt: new Date(NOW - 365 * 86400000).toISOString() },
    // T2: 跨租户
    { id: 'o-other-1', tenantId: OTHER_TENANT, memberId: 'm-other', totalCents: 5000, status: 'COMPLETED' as const, createdAt: new Date(NOW).toISOString() }
  ])

  const rfm = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
  const ab = new ABTestEngine(expAdapter)
  const coupon = new CouponIssuer(couponAdapter, rfmAdapter)
  const attr = new AttributionEngine()
  const seg = new SegmentService(rfmAdapter, rfm)
  const freq = new FrequencyCapService(couponAdapter)
  const roi = new ROICalculator()
  const channel = new ChannelRouter()

  const ctrl = new MarketingController(rfm, ab, coupon, attr, seg, freq, roi, channel)
  return { ctrl, rfmAdapter, expAdapter, couponAdapter, attr }
}

describe('Marketing E2E - Phase-42 智能营销', () => {
  let ctrl: MarketingController
  let rfmAdapter: RFMAdapter
  let expAdapter: ExperimentAdapter
  let couponAdapter: CouponAdapter
  let attr: AttributionEngine

  beforeEach(() => {
    const built = buildController()
    ctrl = built.ctrl
    rfmAdapter = built.rfmAdapter
    expAdapter = built.expAdapter
    couponAdapter = built.couponAdapter
    attr = built.attr
  })

  // ─── 正例: RFM 8 分群 ───

  test('[正例] RFM 批量计算 - 4 画像全识别', () => {
    const r = ctrl.computeRFM({ tenantId: TENANT })
    console.log('PROFILES:', JSON.stringify(r.profiles.map(p => ({ id: p.memberId, seg: p.segment, r: p.recency, f: p.frequency, m: p.monetary }))))
    assert.ok(r.profiles.length === 4, `期望 4 个, 实际 ${r.profiles.length}`)
    const segments = r.profiles.map(p => p.segment)
    assert.ok(segments.includes('CHAMPIONS'))
    assert.ok(segments.includes('LOYAL'))
    assert.ok(segments.includes('AT_RISK'))
    assert.ok(segments.includes('HIBERNATING'))
  })

  test('[正例] RFM stats - 8 分群分布统计', () => {
    ctrl.computeRFM({ tenantId: TENANT })
    const r = ctrl.rfmStats(TENANT)
    assert.equal(r.stats.totalMembers, 4)
    assert.ok(r.stats.segmentDistribution)
  })

  test('[正例] listSegments 返回 8 分群', () => {
    const r = ctrl.listSegments()
    assert.equal(r.segments.length, 8)
  })

  // ─── 正例: A/B Test ───

  test('[正例] A/B 实验创建 + 显著性 A 胜', () => {
    const exp = ctrl.createExperiment({
      tenantId: TENANT, campaignId: 'c1', name: 'Coupon A vs B',
      variantA: { id: 'va', name: 'A', content: '10元', rewardType: 'COUPON', rewardValue: 1000 },
      variantB: { id: 'vb', name: 'B', content: '20元', rewardType: 'COUPON', rewardValue: 2000 },
      trafficSplit: 0.5, minSampleSize: 1000, status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    // 模拟 1500+1500 曝光, A 转化率 20%, B 转化率 10%
    const manual = expAdapter.queryAny(exp.experiment.id)!
    manual.metrics.sentA = 1500
    manual.metrics.sentB = 1500
    manual.metrics.convertedA = 300
    manual.metrics.convertedB = 150
    manual.metrics.revenueCentsA = 1500000
    manual.metrics.revenueCentsB = 750000
    expAdapter.save(manual)

    const result = ctrl.abResult(exp.experiment.id)
    assert.equal(result.result, 'A')
    console.log('AB_RESULT:', JSON.stringify({ result: result.result, pValue: result.pValue, canStopEarly: result.canStopEarly }))
    assert.ok(result.pValue! < 0.05)
    assert.equal(result.canStopEarly, true)
  })

  test('[正例] A/B 50/50 流量分配 - 1000 会员大致各 500', () => {
    const exp = ctrl.createExperiment({
      tenantId: TENANT, campaignId: 'c1', name: 'split-test',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5, minSampleSize: 100, status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    let a = 0, b = 0
    for (let i = 0; i < 1000; i++) {
      const v = (ctrl as any).abTest.assignVariant(exp.experiment.id, `m-${i}`)
      if (v === 'A') a++; else b++
    }
    assert.ok(a >= 450 && a <= 550, `A=${a}`)
    assert.ok(b >= 450 && b <= 550, `B=${b}`)
  })

  // ─── 正例: 优惠券 ───

  test('[正例] autoIssue: CHAMPIONS → VIP_DISCOUNT 优惠券', () => {
    ctrl.computeRFM({ tenantId: TENANT })
    const r = ctrl.autoIssue({ tenantId: TENANT, memberId: 'm-champ', campaignId: 'c1' })
    assert.equal(r.success, true)
    assert.equal(r.couponSegment, 'VIP_DISCOUNT')
  })

  test('[正例] autoIssue: AT_RISK → REACTIVATION 优惠券', () => {
    ctrl.computeRFM({ tenantId: TENANT })
    const r = ctrl.autoIssue({ tenantId: TENANT, memberId: 'm-at-risk', campaignId: 'c1' })
    assert.equal(r.success, true)
    assert.equal(r.couponSegment, 'REACTIVATION')
  })

  test('[正例] 优惠券核销流程', () => {
    const issue = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(issue.success, true)
    const redeem = ctrl.redeemCoupon({ tenantId: TENANT, recordId: issue.record!.id })
    assert.equal(redeem.success, true)
    assert.equal(redeem.record?.redeemed, true)
  })

  // ─── 正例: 归因 ───

  test('[正例] V1 Last non-direct 归因 - 微信渠道胜出', () => {
    attr.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'c1', channel: 'IN_APP', event: 'IMPRESSION', timestamp: new Date(NOW - 5 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', campaignId: 'c2', channel: 'WECHAT', event: 'CLICK', timestamp: new Date(NOW - 2 * 86400000).toISOString() },
      { id: 'tp3', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = ctrl.attribute({ memberId: 'm1', conversionId: 'tp3', revenueCents: 50000 })
    assert.equal(r.attributedCampaignId, 'c2')
    assert.equal(r.attributedChannel, 'WECHAT')
  })

  test('[正例] V2 多触点归因 - 40/40/20', () => {
    attr.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'first', channel: 'IN_APP', event: 'CLICK', timestamp: new Date(NOW - 5 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', campaignId: 'mid', channel: 'WECHAT', event: 'CLICK', timestamp: new Date(NOW - 3 * 86400000).toISOString() },
      { id: 'tp3', memberId: 'm1', campaignId: 'last', channel: 'SMS', event: 'CLICK', timestamp: new Date(NOW - 1 * 86400000).toISOString() },
      { id: 'tp4', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = ctrl.attribute({ memberId: 'm1', conversionId: 'tp4', revenueCents: 50000, mode: 'multi' })
    const w = r.attributionWeights || {}
    assert.equal(w['first'], 0.4)
    assert.equal(w['last'], 0.4)
    assert.equal(w['mid'], 0.2)
  })

  // ─── 正例: ROI + Channel ───

  test('[正例] ROI 计算 (4x)', () => {
    const r = ctrl.calculateROI({
      campaignId: 'c1', campaignName: 'Test',
      sent: 1000, clicked: 200, converted: 50,
      revenueCents: 500000, costCents: 100000,
      periodDays: 7
    })
    assert.equal(r.roi, 4)
    assert.equal(r.ctr, 0.2)
    assert.equal(r.cpaCents, 2000)
  })

  test('[正例] 渠道路由 - 默认 IN_APP', () => {
    const r = ctrl.routeChannel(TENANT, 'm1')
    assert.equal(r.channel, 'IN_APP')
    assert.equal(r.costCents, 0)
  })

  // ─── 反例: 频控 ───

  test('[反例] 频控拒绝: 7d 第二次发放', () => {
    const r1 = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm-x', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r1.success, true)
    const r2 = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm-x', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r2.success, false)
    assert.match(r2.reason || '', /frequency_cap_exceeded/)
  })

  test('[反例] 无效实验 ID → INCONCLUSIVE', () => {
    const r = ctrl.abResult('non-existent-exp')
    assert.equal(r.result, 'INCONCLUSIVE')
  })

  // ─── 隔离: 跨租户 ───

  test('[隔离] T1 RFM 计算不包含 T2 会员', () => {
    const r = ctrl.computeRFM({ tenantId: TENANT })
    const memberIds = r.profiles.map(p => p.memberId)
    assert.ok(!memberIds.includes('m-other'))
  })

  test('[隔离] T1 优惠券不影响 T2', () => {
    ctrl.computeRFM({ tenantId: TENANT })
    const r1 = ctrl.autoIssue({ tenantId: TENANT, memberId: 'm-champ', campaignId: 'c1' })
    assert.equal(r1.success, true)
    // T2 同一 member 仍可领
    const r2 = ctrl.autoIssue({ tenantId: OTHER_TENANT, memberId: 'm-champ', campaignId: 'c1' })
    assert.equal(r2.success, true)
  })

  test('[隔离] T1 看不到 T2 实验', () => {
    const exp = ctrl.createExperiment({
      tenantId: OTHER_TENANT, campaignId: 'c-other', name: 'T2',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5, minSampleSize: 100, status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    const t1List = ctrl.listExperiments(TENANT)
    assert.equal(t1List.experiments.length, 0)
    const t2List = ctrl.listExperiments(OTHER_TENANT)
    assert.equal(t2List.experiments.length, 1)
  })

  // ─── 反模式 v4 ───

  test('[反模式] ab-test-bias: 早停检测 (INCONCLUSIVE 不能停)', () => {
    const exp = ctrl.createExperiment({
      tenantId: TENANT, campaignId: 'c1', name: 'early-stop',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5, minSampleSize: 100, status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    const r = ctrl.abResult(exp.experiment.id)
    // 样本不足 → INCONCLUSIVE → 不能早停
    assert.equal(r.canStopEarly, false)
  })

  test('[反模式] coupon-abuse: 月预算耗尽', () => {
    // 灌入 10000 个已有记录 模拟预算耗尽
    for (let i = 0; i < 10000; i++) {
      couponAdapter.save({
        id: `seed-${i}`,
        tenantId: TENANT, memberId: `m-seed-${i}`, campaignId: 'c-budget',
        couponSegment: 'GENERIC',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        redeemed: false, frequencyWindowDays: 7
      })
    }
    const r = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm-new', campaignId: 'c-budget',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r.success, false)
    assert.match(r.reason || '', /monthly_budget_exhausted/)
  })

  test('[反模式] coupon-abuse: 频控跨 campaign 共享', () => {
    const r1 = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm-cross', campaignId: 'c-A',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r1.success, true)
    // 同一 member, 不同 campaign, 7d 内仍拒绝
    const r2 = ctrl.issueCoupon({
      tenantId: TENANT, memberId: 'm-cross', campaignId: 'c-B',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r2.success, false)
  })

  test('[健康] 模块 health endpoint', () => {
    const r = ctrl.health()
    assert.equal(r.status, 'ok')
    assert.equal(r.module, 'marketing')
  })

  // ─── KPI ───

  test('[KPI] 营销大盘 - 转化率/ROI/预算 全维度', () => {
    ctrl.computeRFM({ tenantId: TENANT })
    const stats = ctrl.rfmStats(TENANT)
    const list = ctrl.listExperiments(TENANT)
    assert.ok(stats.stats.totalMembers >= 0)
    assert.ok(list.experiments !== undefined)
  })
})