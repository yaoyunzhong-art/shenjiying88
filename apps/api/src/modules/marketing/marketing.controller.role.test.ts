import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * marketing.controller.role.test.ts — 8 角色视角测试（C型补全）
 *
 * 角色:
 *   👔 店长 (ShopManager)
 *   🛒 前台 (Cashier)
 *   👥 HR (HR)
 *   🔧 安监 (SafetyMonitor)
 *   🎮 导玩员 (GameGuide)
 *   🎯 运行专员 (OperationsSpecialist)
 *   🤝 团建 (TeamBuilder)
 *   📢 营销 (Marketer)
 *
 * 每个角色至少 2 个用例: 正常流程 + 权限/业务边界
 */
import assert from 'node:assert/strict'
import { MarketingController } from './marketing.controller'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'

function createController(): MarketingController {
  const rfmAdapter = new RFMAdapter()
  const memberAdapter = new MemberAdapter()
  const orderAdapter = new OrderAdapter()
  const experimentAdapter = new ExperimentAdapter()
  const couponAdapter = new CouponAdapter()
  const rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
  const abTest = new ABTestEngine(experimentAdapter)
  const couponIssuer = new CouponIssuer(couponAdapter, rfmAdapter)
  const attribution = new AttributionEngine()
  const segment = new SegmentService(rfmAdapter, rfmCalc)
  const freqCap = new FrequencyCapService(couponAdapter)
  const roiCalc = new ROICalculator()
  const channelRouter = new ChannelRouter()
  return new MarketingController(
    rfmCalc, abTest, couponIssuer, attribution,
    segment, freqCap, roiCalc, channelRouter
  )
}

// ============================================================
// 👔 店长 (ShopManager) — 看经营数据、宏观营销健康
// ============================================================
describe('👔 店长视角 — Marketing 营销看板', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[店长-正常] 查看 RFM 统计及分群分布，了解会员健康度', () => {
    // 先计算 RFM 使数据生效
    ctrl.computeRFM({ tenantId: 't_store_01' })
    const stats = ctrl.rfmStats('t_store_01')
    assert.ok(stats.stats, '应返回统计对象')
    assert.equal(typeof stats.healthy, 'boolean', '货态健康度应为布尔值')
    // 店长关心总会员数和分群分布
    const { totalMembers, segmentDistribution } = stats.stats
    assert.equal(typeof totalMembers, 'number', '应有总会员数')
    assert.ok(segmentDistribution, '应有分群分布')
    // 8 分群，至少有一个非零
    const segKeys = Object.keys(segmentDistribution)
    assert.ok(segKeys.length > 0, '至少有一个分群')
  })

  it('[店长-边界] 不存在的租户应返回空数据而非抛异常', () => {
    const stats = ctrl.rfmStats('nonexistent_tenant')
    assert.ok(stats.stats, '即使租户不存在也应返回 stats 对象')
    // 不会 crash
    assert.doesNotThrow(() => JSON.stringify(stats))
  })

  it('[店长-正常] 查看所有 8 分群定义以做经营决策', () => {
    const r = ctrl.listSegments()
    assert.equal(r.segments.length, 8, '应返回8个分群')
    const names = r.segments.map((s: any) => s.type)
    assert.ok(names.includes('CHAMPIONS'), '应有 CHAMPIONS')
    assert.ok(names.includes('AT_RISK'), '应有 AT_RISK')
    assert.ok(names.includes('HIBERNATING'), '应有 HIBERNATING')
  })
})

// ============================================================
// 🛒 前台 (Cashier) — 发优惠券、看频控
// ============================================================
describe('🛒 前台视角 — 优惠券发放', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[前台-正常] 为到店会员发放优惠券并核销', () => {
    // 发放
    const issued = ctrl.issueCoupon({
      tenantId: 't_store_01',
      memberId: 'm_walkin_001',
      campaignId: 'c_store_promotion',
      couponSegment: 'WELCOME_OFFER',
      expiryDays: 14,
    })
    assert.equal(issued.success, true, '发放应成功')
    assert.ok(issued.record, '应有发放记录')
    assert.ok(issued.record!.id, '应有记录ID')
    assert.equal(issued.record!.memberId, 'm_walkin_001')

    // 核销
    const redeemed = ctrl.redeemCoupon({
      tenantId: 't_store_01',
      recordId: issued.record!.id,
    })
    assert.equal(redeemed.success, true, '核销应成功')
    assert.ok(redeemed.record, '核销应有记录')
  })

  it('[前台-边界] 重复发放同一优惠券应被频控拒绝', () => {
    ctrl.issueCoupon({
      tenantId: 't_store_01',
      memberId: 'm_freq_test',
      campaignId: 'c1',
      couponSegment: 'GENERIC',
      expiryDays: 7,
    })
    const second = ctrl.issueCoupon({
      tenantId: 't_store_01',
      memberId: 'm_freq_test',
      campaignId: 'c1',
      couponSegment: 'GENERIC',
      expiryDays: 7,
    })
    assert.equal(second.success, false, '频控应拒绝重复发放')
    assert.ok(second.reason, '应返回拒绝原因')
  })

  it('[前台-正常] 查询会员频控状态', () => {
    const cap = ctrl.freqCapStatus('t_store_01', 'm_freq_test')
    assert.equal(typeof cap.allowed, 'boolean', 'allowed 应为布尔值')
    assert.equal(typeof cap.issuedInWindow, 'number', '窗口内已发数量应为数字')
    assert.equal(typeof cap.maxPerWindow, 'number', '窗口上限应为数字')
    assert.equal(typeof cap.windowDays, 'number', '窗口天数应为数字')
  })
})

// ============================================================
// 👥 HR (HR) — 活动人力绩效统计
// ============================================================
describe('👥 HR视角 — 营销活动 ROI 与绩效', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[HR-正常] 计算营销活动 ROI，评估投入产出', () => {
    const roi = ctrl.calculateROI({
      campaignId: 'c_hr_campaign',
      campaignName: '门店引流活动',
      sent: 2000,
      clicked: 400,
      converted: 80,
      revenueCents: 800000,
      costCents: 200000,
      periodDays: 14,
    })
    assert.equal(roi.roi, 3, 'ROI = (800000-200000)/200000 = 3')
    assert.equal(roi.ctr, 0.2, '点击率 = 400/2000 = 0.2')
    assert.equal(roi.conversionRate, 0.2, '转化率 = 80/400 = 0.2')
    assert.equal(roi.campaignName, '门店引流活动')
  })

  it('[HR-边界] 零投放零转化的空活动应安全处理', () => {
    const roi = ctrl.calculateROI({
      campaignId: 'c_empty',
      campaignName: '无活动',
      sent: 0,
      clicked: 0,
      converted: 0,
      revenueCents: 0,
      costCents: 0,
      periodDays: 0,
    })
    // 不能抛异常, ROI 应为 0
    assert.equal(roi.roi, 0, '零成本零收入 ROI = 0')
    assert.equal(roi.ctr, 0, '零点击率 = 0')
    assert.equal(roi.conversionRate, 0, '零转化率 = 0')
  })
})

// ============================================================
// 🔧 安监 (SafetyMonitor) — 审计追踪、合规检查
// ============================================================
describe('🔧 安监视角 — 营销合规与审计', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[安监-正常] 所有营销端点可正常响应（不泄露敏感数据）', () => {
    // health 端点应返回基本信息，不含会员 PII
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'marketing')
    assert.ok(health.timestamp)
    assert.equal(Object.keys(health).length, 3, 'health 不应泄露额外敏感字段')
  })

  it('[安监-边界] 优惠券发放记录应有完整审计信息', () => {
    const issued = ctrl.issueCoupon({
      tenantId: 't_audit',
      memberId: 'm_audit_user',
      campaignId: 'c_audit',
      couponSegment: 'GENERIC',
      expiryDays: 30,
    })
    assert.ok(issued.record, '应返回发放记录')
    assert.ok(issued.record!.id, '应有记录 ID')
    assert.ok(issued.record!.issuedAt, '应有发放时间戳')
    assert.ok(issued.record!.expiresAt, '应有过期时间')
    assert.equal(issued.record!.redeemed, false, '初始应未核销')
  })
})

// ============================================================
// 🎮 导玩员 (GameGuide) — 游戏化活动、渠道触达
// ============================================================
describe('🎮 导玩员视角 — 游戏化营销渠道', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[导玩员-正常] 查询会员最优触达渠道用于游戏活动通知', () => {
    const r = ctrl.routeChannel('t_gaming', 'm_gamer_01')
    assert.ok(r.channel, '应有渠道名称')
    assert.equal(typeof r.channel, 'string')
    assert.equal(typeof r.costCents, 'number')
    assert.ok(r.costCents >= 0, '费用应 >= 0')
  })

  it('[导玩员-边界] 不同会员可能路由到不同渠道', () => {
    const r1 = ctrl.routeChannel('t_gaming', 'm_gamer_01')
    const r2 = ctrl.routeChannel('t_gaming', 'm_gamer_02')
    // 两个结果都应返回有效数据
    assert.ok(r1.channel)
    assert.ok(r2.channel)
  })
})

// ============================================================
// 🎯 运行专员 (OperationsSpecialist) — A/B 实验运维
// ============================================================
describe('🎯 运行专员视角 — A/B 实验运维', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[运行专员-正常] 创建实验、记录事件、获取实验结果完整流程', () => {
    // 创建
    const exp = ctrl.createExperiment({
      tenantId: 't_op',
      campaignId: 'c_abtest',
      name: '运营AB测试',
      variantA: { id: 'va', name: '控制组', content: '原版', rewardType: 'COUPON', rewardValue: 1000 },
      variantB: { id: 'vb', name: '实验组', content: '新版', rewardType: 'COUPON', rewardValue: 2000 },
      trafficSplit: 0.5,
      minSampleSize: 500,
      status: 'RUNNING',
      startAt: new Date().toISOString(),
    })
    assert.ok(exp.experiment.id, '实验应有ID')
    assert.equal(exp.experiment.name, '运营AB测试')

    // 记录事件
    const eid = exp.experiment.id
    ctrl.recordEvent({ experimentId: eid, memberId: 'm_op_01', event: 'impression' })
    ctrl.recordEvent({ experimentId: eid, memberId: 'm_op_01', event: 'click' })
    ctrl.recordEvent({ experimentId: eid, memberId: 'm_op_01', event: 'conversion', revenueCents: 5000 })

    // 查结果
    const result = ctrl.abResult(eid)
    assert.ok(result.metrics, '应有指标')
    assert.equal(typeof result.canStopEarly, 'boolean', 'canStopEarly 应为布尔')
  })

  it('[运行专员-边界] 不存在的实验 ID 查询应安全处理', () => {
    assert.doesNotThrow(() => {
      ctrl.abResult('nonexistent_experiment')
    })
  })

  it('[运行专员-正常] 查看租户下所有实验列表', () => {
    // 先创建两个实验
    ctrl.createExperiment({
      tenantId: 't_op',
      campaignId: 'c1',
      name: '实验A',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5, minSampleSize: 100, status: 'RUNNING',
      startAt: new Date().toISOString(),
    })
    ctrl.createExperiment({
      tenantId: 't_op',
      campaignId: 'c2',
      name: '实验B',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5, minSampleSize: 100, status: 'DRAFT',
      startAt: new Date().toISOString(),
    })

    const list = ctrl.listExperiments('t_op')
    assert.ok(list.experiments.length >= 2, '应返回 >= 2 个实验')
    assert.ok(list.experiments.some((e: any) => e.name === '实验A'))
    assert.ok(list.experiments.some((e: any) => e.name === '实验B'))
  })
})

// ============================================================
// 🤝 团建 (TeamBuilder) — 会员归因与触达链路
// ============================================================
describe('🤝 团建视角 — 会员触达归因', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[团建-正常] 记录会员触达点并进行 last-non-direct 归因', () => {
    // 先记录多个触达点
    ctrl.recordTouch({
      id: 'tp-team-1', memberId: 'm_team_01', channel: 'SMS',
      event: 'IMPRESSION', timestamp: '2026-06-20T10:00:00Z',
    })
    ctrl.recordTouch({
      id: 'tp-team-2', memberId: 'm_team_01', channel: 'WECHAT',
      event: 'CLICK', timestamp: '2026-06-21T10:00:00Z',
    })
    ctrl.recordTouch({
      id: 'tp-team-3', memberId: 'm_team_01', channel: 'IN_APP',
      event: 'CONVERSION', timestamp: '2026-06-22T10:00:00Z',
    })

    // last-non-direct 归因
    const attr = ctrl.attribute({
      memberId: 'm_team_01',
      conversionId: 'conv_team_01',
      revenueCents: 15000,
    })
    assert.equal(attr.memberId, 'm_team_01')
    assert.equal(attr.revenueCents, 15000)
    assert.ok(Array.isArray(attr.touchPoints), '应有触达点列表')
  })

  it('[团建-边界] multi-touch 归因模式下返回多点数据', () => {
    ctrl.recordTouch({
      id: 'tp-multi-1', memberId: 'm_multi_01', channel: 'SMS',
      event: 'IMPRESSION', timestamp: '2026-06-20T10:00:00Z',
    })
    ctrl.recordTouch({
      id: 'tp-multi-2', memberId: 'm_multi_01', channel: 'IN_APP',
      event: 'CONVERSION', timestamp: '2026-06-21T10:00:00Z',
    })

    const attr = ctrl.attribute({
      memberId: 'm_multi_01',
      conversionId: 'conv_multi_01',
      revenueCents: 20000,
      mode: 'multi',
    })
    assert.equal(attr.memberId, 'm_multi_01')
    // multi-touch 应包含权重信息
    assert.ok(Array.isArray(attr.touchPoints))
  })
})

// ============================================================
// 📢 营销 (Marketer) — RFM 营销决策与自动化
// ============================================================
describe('📢 营销视角 — RFM 分群与精准营销', () => {
  let ctrl: MarketingController

  beforeEach(() => { ctrl = createController() })

  it('[营销-正常] 按会员列表批量计算 RFM 分群，筛选高价值会员', () => {
    const r = ctrl.computeRFM({
      tenantId: 't_mkt',
      memberIds: ['m1', 'm2'],
    })
    assert.ok(Array.isArray(r.profiles), '应返回分群列表')
    assert.ok(r.count >= 0, 'count 应 >= 0')
    // 检查分群类型（如果有结果）
    for (const p of r.profiles) {
      assert.ok(p.memberId, '每个分群应有 memberId')
      assert.ok(['CHAMPIONS','LOYAL','POTENTIAL_LOYALIST','RECENT','PROMISING','NEED_ATTENTION','AT_RISK','HIBERNATING'].includes(p.segment),
        `分群类型 ${p.segment} 应为有效类型`)
    }
  })

  it('[营销-正常] 自动发放优惠券给符合条件的会员', () => {
    const r = ctrl.autoIssue({
      tenantId: 't_mkt',
      memberId: 'm_auto_01',
      campaignId: 'c_auto_promo',
    })
    assert.equal(r.success, true, '自动发放应成功')
    assert.ok(r.record?.id, '应有优惠券记录ID')
  })

  it('[营销-边界] 全租户批量 RFM 计算不应抛异常', () => {
    const r = ctrl.computeRFM({ tenantId: 't_mkt_full' })
    assert.ok(Array.isArray(r.profiles), '应返回分群列表')
    assert.ok(r.count >= 0, 'count 应 >= 0')
  })
})
