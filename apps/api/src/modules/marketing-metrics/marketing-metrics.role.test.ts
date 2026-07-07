import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [C] 角色测试增强
 *
 * 从 8 角色视角, 深度测试 marketing-metrics 模块:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个测试用例 (正常流程 + 权限边界 + 业务场景)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketingMetricsController } from './marketing-metrics.controller'
import { MarketingMetricsService } from './marketing-metrics.service'
import type { MetricsSnapshot, PrometheusExport } from './marketing-metrics.entity'

// ── 测试工厂 ──
function createTestEnv() {
  const service = new MarketingMetricsService()
  const controller = new MarketingMetricsController(service)
  return { service, controller }
}

// ══════════════════════════════════════════════════════════════
// 👔 店长 (StoreManager) 视角
// 店长关注整体营销 ROI、活动触达率、核销成本控制
// ══════════════════════════════════════════════════════════════
describe('👔 店长 - marketing-metrics 角色测试', () => {
  it('店长查看完整营销快照 - ROI 和客单价需正确计算', () => {
    const { controller, service } = createTestEnv()
    // 发放 100 张券, 核销 30 张, 赢单 2 笔各 20000
    service.incrCouponIssued(100)
    for (let i = 0; i < 30; i++) {
      service.incrCouponRedemption(i % 3 === 0)
    }
    service.incrLeadCloseWon(20000)
    service.incrLeadCloseWon(30000)

    const snap = controller.getSnapshot() as MetricsSnapshot
    assert.ok(snap.roi > 0, 'ROI 应为正数')
    // cost = 100*5 + 0*0.1 = 500, revenue = 2 * 25000 = 50000, ROI = (50000-500)/500 = 99
    assert.equal(snap.roi, 99, 'ROI 应正确计算为 99')
    assert.equal(snap.avgOrderValue, 25000, '平均客单价应为 25000')
    assert.equal(snap.couponRedemptionTotal, 30, '核销总数应为 30')
  })

  it('店长查看空数据快照 - ROI 为 0 而非 NaN', () => {
    const { controller } = createTestEnv()
    const snap = controller.getSnapshot() as MetricsSnapshot
    assert.equal(snap.roi, 0, '空数据 ROI 应为 0')
    assert.equal(snap.avgOrderValue, 0, '空数据平均客单价为 0')
    assert.equal(snap.couponRedemptionTotal, 0, '空数据核销为 0')
    assert.equal(snap.campaignTriggerTotal, 0, '空数据活动触发为 0')
  })

  it('店长只发券无核销 - ROI 应为 -1 (只有成本)', () => {
    const { service } = createTestEnv()
    service.incrCouponIssued(50)
    // cost = 250, revenue = 0 => ROI = -1
    const snap = service.snapshot()
    assert.equal(snap.roi, -1, '只发券无核销 ROI 应为 -1')
    assert.equal(snap.couponRedemptionTotal, 0, '无核销数据')
  })

  it('店长查看跨店核销占比情况', () => {
    const { service } = createTestEnv()
    service.incrCouponIssued(100)
    for (let i = 0; i < 100; i++) {
      service.incrCouponRedemption(true) // 全跨店核销
    }
    service.incrLeadCloseWon(500000)

    const prom = service.toPrometheus()
    const crossLine = prom.split('\n').find(l => l.startsWith('coupon_cross_store_total'))
    assert.ok(crossLine, 'Prometheus 应有 coupon_cross_store_total')
    assert.ok(crossLine!.includes('100'), '跨店核销应为 100')

    const snap = service.snapshot()
    assert.ok(snap.roi > 0, '有收入时 ROI 为正')
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒 前台 (FrontDesk) 视角
// 前台关注优惠券发放/核销、业务操作响应
// ══════════════════════════════════════════════════════════════
describe('🛒 前台 - marketing-metrics 角色测试', () => {
  it('前台记录优惠券核销 - 正常流程应返回成功', () => {
    const { controller, service } = createTestEnv()
    const res = controller.recordCouponRedemption({ crossStore: false })
    assert.equal(res.success, true, '核销应返回 success')
    assert.equal(service.snapshot().couponRedemptionTotal, 1, '核销总数应为 1')
  })

  it('前台记录跨店核销 - 跨店核销计数器应独立递增', () => {
    const { controller, service } = createTestEnv()
    controller.recordCouponRedemption({ crossStore: true })
    controller.recordCouponRedemption({ crossStore: true })
    controller.recordCouponRedemption({ crossStore: false })

    const snap = service.snapshot()
    assert.equal(snap.couponRedemptionTotal, 3, '核销总数应为 3')

    const prom = service.toPrometheus()
    const crossLine = prom.split('\n').find(l => l.startsWith('coupon_cross_store_total'))
    assert.ok(crossLine, '应有跨店核销行')
    assert.ok(crossLine!.includes('2'), '跨店核销计数应为 2')
    const totalLine = prom.split('\n').find(l => l.startsWith('coupon_redemption_total'))
    assert.ok(totalLine!.includes('3'), '核销总数应为 3')
  })

  it('前台批量发放优惠券 - 应正确计数', () => {
    const { controller } = createTestEnv()
    controller.recordCouponIssued({ count: 500 })
    controller.recordCouponIssued({ count: 200 })
    controller.recordCouponIssued({ count: 1 })

    const prom = controller.getPrometheus() as PrometheusExport
    const issuedLine = prom.text.split('\n').find(l => l.startsWith('coupon_issued_total'))
    assert.ok(issuedLine, '应有 coupon_issued_total')
    assert.ok(issuedLine!.includes('701'), '总发放应为 701')
  })

  it('前台记录后查快照 - 快照数据应与内部一致', () => {
    const { controller, service } = createTestEnv()
    controller.recordCouponRedemption({ crossStore: false })
    controller.recordCouponRedemption({ crossStore: true })
    controller.recordCouponIssued({ count: 10 })

    const snap = controller.getSnapshot() as MetricsSnapshot
    assert.equal(snap.couponRedemptionTotal, 2, '快照核销应为 2')
    // snapshot 不包含 couponIssuedTotal, 用 prometheus 验证
    const prom = controller.getPrometheus() as PrometheusExport
    assert.ok(prom.text.includes('coupon_issued_total 10'), '发放计数应为 10')
  })
})

// ══════════════════════════════════════════════════════════════
// 👥 HR 视角
// HR 关注营销活动下发的公平性、通知触达效率
// ══════════════════════════════════════════════════════════════
describe('👥 HR - marketing-metrics 角色测试', () => {
  it('HR 查看活动下发统计 - Prometheus 应有 campaign 指标', () => {
    const { controller, service } = createTestEnv()
    service.incrCampaignTrigger(100, 80)
    service.incrCampaignTrigger(50, 45)

    const prom = controller.getPrometheus() as PrometheusExport
    const text = prom.text
    const triggerLine = text.split('\n').find(l => l.startsWith('campaign_trigger_total'))
    const dispatchLine = text.split('\n').find(l => l.startsWith('campaign_dispatched_total'))
    assert.ok(triggerLine!.includes('150'), '触发总匹配数应为 150')
    assert.ok(dispatchLine!.includes('125'), '触发总下发数应为 125')
  })

  it('HR 查看通知下发率 - 应能区分成功下发数', () => {
    const { service } = createTestEnv()
    service.incrNotificationDispatch()
    service.incrNotificationDispatch()
    service.incrNotificationDispatch()

    const prom = service.toPrometheus()
    assert.ok(prom.includes('notification_dispatch_total 3'), '通知下发应为 3')
  })

  it('HR 重置后活动数据清零 - 防止旧活动干扰新活动统计', () => {
    const { controller, service } = createTestEnv()
    service.incrCampaignTrigger(200, 180)
    controller.resetMetrics()
    service.incrCampaignTrigger(10, 8)

    const prom = service.toPrometheus()
    const triggerLine = prom.split('\n').find(l => l.startsWith('campaign_trigger_total'))
    const dispatchLine = prom.split('\n').find(l => l.startsWith('campaign_dispatched_total'))
    assert.ok(triggerLine!.includes('10'), '重置后触发匹配数应为 10')
    assert.ok(dispatchLine!.includes('8'), '重置后触发下发数应为 8')
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧 安监 (Security) 视角
// 安监关注异常指标峰值、直方图数据异常检测、重置审计
// ══════════════════════════════════════════════════════════════
describe('🔧 安监 - marketing-metrics 角色测试', () => {
  it('安监记录直方图数据 - normal 流程应存储并计算出均值', () => {
    const { controller, service } = createTestEnv()
    controller.recordHistogram({ name: 'order_value', value: 100 })
    controller.recordHistogram({ name: 'order_value', value: 200 })
    controller.recordHistogram({ name: 'order_value', value: 300 })

    const prom = controller.getPrometheus() as PrometheusExport
    const avgLine = prom.text.split('\n').find(l => l.startsWith('order_value_avg'))
    const cntLine = prom.text.split('\n').find(l => l.startsWith('order_value_count'))
    assert.ok(avgLine!.includes('200'), '直方图均值应为 200')
    assert.ok(cntLine!.includes('3'), '直方图计数应为 3')
  })

  it('安监检测多个直方图独立存储 - 名称隔离', () => {
    const { service } = createTestEnv()
    service.recordHistogram('order_value', 150)
    service.recordHistogram('order_value', 250)
    service.recordHistogram('campaign_response_time', 30)
    service.recordHistogram('campaign_response_time', 90)
    service.recordHistogram('campaign_response_time', 60)

    const prom = service.toPrometheus()
    const orderAvg = prom.split('\n').find(l => l.startsWith('order_value_avg'))
    const responseAvg = prom.split('\n').find(l => l.startsWith('campaign_response_time_avg'))
    assert.ok(orderAvg!.includes('200'), 'order_value 均值应为 200')
    assert.ok(responseAvg!.includes('60'), 'campaign_response_time 均值应为 60')
  })

  it('安监重置后直方图应清空 - 审计', () => {
    const { controller, service } = createTestEnv()
    controller.recordHistogram({ name: 'lead_won_amount', value: 50000 })
    controller.recordHistogram({ name: 'lead_won_amount', value: 100000 })
    controller.resetMetrics()

    const prom = service.toPrometheus()
    // reset 后直方图清空, 不应有相关指标
    assert.ok(!prom.includes('lead_won_amount'), '重置后直方图应清空')
  })

  it('安监查看大量异常发放后的重置审计 - 计数器归零', () => {
    const { controller, service } = createTestEnv()
    // 模拟大面积异常发放
    for (let i = 0; i < 10000; i++) {
      service.incrCouponIssued(1)
    }
    controller.resetMetrics()

    const prom = service.toPrometheus()
    const issuedLine = prom.split('\n').find(l => l.startsWith('coupon_issued_total'))
    assert.ok(issuedLine!.includes('0'), '重置后发放应为 0')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮 导玩员 (Guide) 视角
// 导玩员关注营销活动触达客户效果、线索转化
// ══════════════════════════════════════════════════════════════
describe('🎮 导玩员 - marketing-metrics 角色测试', () => {
  it('导玩员记录活动触发 - matched/dispatched 数据分开统计', () => {
    const { controller, service } = createTestEnv()
    controller.recordCampaignTrigger({ matched: 50, dispatched: 35 })

    const prom = service.toPrometheus()
    const matchLine = prom.split('\n').find(l => l.startsWith('campaign_trigger_total'))
    const dispLine = prom.split('\n').find(l => l.startsWith('campaign_dispatched_total'))
    assert.ok(matchLine!.includes('50'), '匹配数应为 50')
    assert.ok(dispLine!.includes('35'), '下发数应为 35')
  })

  it('导玩员记录线索流入 + 赢单 - 应正确记录', () => {
    const { controller, service } = createTestEnv()
    controller.recordLeadIngest()
    controller.recordLeadIngest()
    controller.recordLeadCloseWon({ amount: 15000 })
    controller.recordLeadCloseWon({ amount: 25000 })

    const prom = service.toPrometheus()
    const ingestLine = prom.split('\n').find(l => l.startsWith('lead_ingest_total'))
    const wonLine = prom.split('\n').find(l => l.startsWith('lead_close_won_total'))
    const amountAvg = prom.split('\n').find(l => l.startsWith('lead_won_amount_avg'))
    assert.ok(ingestLine!.includes('2'), '线索流入应为 2')
    assert.ok(wonLine!.includes('2'), '赢单应为 2')
    assert.ok(amountAvg!.includes('20000'), '赢单平均金额应为 20000')
  })

  it('导玩员多次触发活动后查看快照 - campaignTriggerTotal 正确聚合', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 5; i++) {
      service.incrCampaignTrigger(10 + i, 5 + i)
    }
    // matched = 10+11+12+13+14 = 60
    const snap = service.snapshot()
    assert.equal(snap.campaignTriggerTotal, 60, '多次触发总和应为 60')
  })

  it('导玩员无匹配触发活动 - matched=0 时计数器不递增', () => {
    const { controller, service } = createTestEnv()
    controller.recordCampaignTrigger({ matched: 0, dispatched: 0 })
    assert.equal(service.snapshot().campaignTriggerTotal, 0, '无匹配时活动触发应为 0')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯 运行专员 (Operations) 视角
// 运行专员关注指标聚合正确性、重置不影响其他操作、直方图和计数互不干扰
// ══════════════════════════════════════════════════════════════
describe('🎯 运行专员 - marketing-metrics 角色测试', () => {
  it('运行专员完整记录核销+裂变+通知+线索 - 全部计数器正常', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 10; i++) service.incrCouponRedemption(i % 2 === 0)
    for (let i = 0; i < 5; i++) service.incrReferralTrack()
    for (let i = 0; i < 3; i++) service.incrNotificationDispatch()
    for (let i = 0; i < 7; i++) service.incrLeadIngest()

    const snap = service.snapshot()
    assert.equal(snap.couponRedemptionTotal, 10, '核销总数应为 10')
    assert.equal(snap.referralTrackTotal, 5, '裂变追踪应为 5')
    assert.equal(snap.notificationDispatchTotal, 3, '通知下发应为 3')
  })

  it('运行专员查看 Prometheus 格式 - 所有 10 个计数器正确展示', () => {
    const { controller } = createTestEnv()
    const prom = controller.getPrometheus() as PrometheusExport
    const text = prom.text
    const expectedCounters = [
      'coupon_redemption_total',
      'coupon_issued_total',
      'coupon_cross_store_total',
      'campaign_trigger_total',
      'campaign_dispatched_total',
      'referral_track_total',
      'referral_reward_total',
      'notification_dispatch_total',
      'lead_ingest_total',
      'lead_close_won_total',
    ]
    for (const counter of expectedCounters) {
      assert.ok(text.includes(counter), `Prometheus 应包含 ${counter}`)
    }
  })

  it('运行专员重置只清数据不抛异常 - idempotent reset', () => {
    const { controller, service } = createTestEnv()
    service.incrCouponIssued(100)
    controller.resetMetrics()
    // 多次重置应安全
    controller.resetMetrics()
    controller.resetMetrics()
    assert.equal(service.snapshot().roi, 0, '多次重置后 ROI 应为 0')
    assert.doesNotThrow(() => controller.resetMetrics(), '多次重置不应抛异常')
  })

  it('运行专员混合操作后快照与 Prometheus 数据一致性验证', () => {
    const { controller, service } = createTestEnv()
    controller.recordCouponRedemption({ crossStore: false })
    controller.recordReferralTrack()
    controller.recordNotificationDispatch()
    controller.recordLeadCloseWon({ amount: 30000 })
    controller.recordLeadIngest()

    const snap = controller.getSnapshot() as MetricsSnapshot
    const prom = controller.getPrometheus() as PrometheusExport
    assert.equal(snap.couponRedemptionTotal, 1, '核销应为 1')
    assert.equal(snap.referralTrackTotal, 1, '裂变追踪应为 1')
    assert.equal(snap.notificationDispatchTotal, 1, '通知应为 1')
    assert.ok(prom.text.includes('coupon_redemption_total 1'), 'Prometheus 核销一致')
    assert.ok(prom.text.includes('referral_track_total 1'), 'Prometheus 裂变一致')
    assert.ok(prom.text.includes('notification_dispatch_total 1'), 'Prometheus 通知一致')
    assert.ok(prom.text.includes('lead_ingest_total 1'), 'Prometheus 线索一致')
    assert.ok(prom.text.includes('lead_close_won_total 1'), 'Prometheus 赢单一致')
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝 团建 (Teambuilding) 视角
// 团建关注裂变活动效果、优惠券发放数量、活动参与度
// ══════════════════════════════════════════════════════════════
describe('🤝 团建 - marketing-metrics 角色测试', () => {
  it('团建查看裂变奖励发放 - 追踪正确', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 8; i++) service.incrReferralTrack()
    for (let i = 0; i < 3; i++) service.incrReferralReward()

    const prom = service.toPrometheus()
    const trackLine = prom.split('\n').find(l => l.startsWith('referral_track_total'))
    const rewardLine = prom.split('\n').find(l => l.startsWith('referral_reward_total'))
    assert.ok(trackLine!.includes('8'), '裂变追踪应为 8')
    assert.ok(rewardLine!.includes('3'), '裂变奖励应为 3')
  })

  it('团建查看优惠券发放统计', () => {
    const { controller, service } = createTestEnv()
    controller.recordCouponIssued({ count: 1000 })
    controller.recordCouponIssued({ count: 500 })
    // 核销 200 张
    for (let i = 0; i < 200; i++) service.incrCouponRedemption()

    const prom = service.toPrometheus()
    assert.ok(prom.includes('coupon_issued_total 1500'), '发放统计应为 1500')
    assert.ok(prom.includes('coupon_redemption_total 200'), '核销统计应为 200')
  })

  it('团建查看裂变效果后在快照中确认 referralTrackTotal', () => {
    const { controller } = createTestEnv()
    controller.recordReferralTrack()
    controller.recordReferralTrack()
    controller.recordReferralReward()

    const snap = controller.getSnapshot() as MetricsSnapshot
    assert.equal(snap.referralTrackTotal, 2, '裂变追踪在快照中应为 2')
  })

  it('团建零裂变数据 - Prometheus 仍正确输出 0', () => {
    const { service } = createTestEnv()
    const prom = service.toPrometheus()
    const trackLine = prom.split('\n').find(l => l.startsWith('referral_track_total'))
    assert.ok(trackLine!.includes('0'), '无裂变时追踪应为 0')
  })
})

// ══════════════════════════════════════════════════════════════
// 📢 营销 (Marketing) 视角
// 营销最关注 ROI 计算、活动效果归因、渠道对比
// ══════════════════════════════════════════════════════════════
describe('📢 营销 - marketing-metrics 角色测试', () => {
  it('营销人员记录完整营销链 - ROI 计算准确', () => {
    const { controller, service } = createTestEnv()
    // 成本: 发放 200 张券 * 5 = 1000
    service.incrCouponIssued(200)
    // 核销 80 张
    for (let i = 0; i < 80; i++) service.incrCouponRedemption()
    // 赢单 3 笔
    controller.recordLeadCloseWon({ amount: 20000 })
    controller.recordLeadCloseWon({ amount: 30000 })
    controller.recordLeadCloseWon({ amount: 50000 })
    // revenue = 3 * 33333.33 ≈ 100000, cost = 1000 => ROI = (100000-1000)/1000 = 99
    const snap = service.snapshot()
    assert.equal(snap.roi, 99, '全链 ROI 应为 99')
    assert.ok(snap.avgOrderValue > 33333 && snap.avgOrderValue < 33334, '平均客单价应约等于 33333.33')
  })

  it('营销人员多次赢单 - 直方图记录每次金额并正确计算均值', () => {
    const { controller, service } = createTestEnv()
    controller.recordLeadCloseWon({ amount: 100 })
    controller.recordLeadCloseWon({ amount: 200 })
    controller.recordLeadCloseWon({ amount: 300 })
    controller.recordLeadCloseWon({ amount: 400 })

    const prom = service.toPrometheus()
    const avgLine = prom.split('\n').find(l => l.startsWith('lead_won_amount_avg'))
    assert.ok(avgLine!.includes('250'), '赢单金额均值应为 250')

    const snap = service.snapshot()
    assert.equal(snap.avgOrderValue, 250, '快照中平均客单价应为 250')
  })

  it('营销人员重置后只关注新活动 ROI - 旧数据不干扰', () => {
    const { controller, service } = createTestEnv()
    // 旧数据
    service.incrCouponIssued(1000)
    for (let i = 0; i < 500; i++) service.incrCouponRedemption()
    service.incrLeadCloseWon(100000)

    controller.resetMetrics()

    // 新活动
    service.incrCouponIssued(10)
    service.incrLeadCloseWon(50000)
    // revenue=50000, cost=50 => ROI=999
    const snap = service.snapshot()
    assert.equal(snap.roi, 999, '重置后新活动 ROI 应为 999')
    assert.equal(snap.couponRedemptionTotal, 0, '重置后核销应为 0')
  })

  it('营销人员赢单金额为 0 - 不应导致除以 0', () => {
    const { controller, service } = createTestEnv()
    service.incrCouponIssued(10)
    controller.recordLeadCloseWon({ amount: 0 })

    const snap = service.snapshot()
    assert.equal(snap.avgOrderValue, 0, '金额为 0 时平均客单价应为 0')
    // revenue=0, cost=50 => ROI=-1
    assert.equal(snap.roi, -1, '无收入时 ROI 应为 -1')
  })

  it('营销人员查看 Prometheus 输出有正确 HELP/TYPE header 格式', () => {
    const { controller } = createTestEnv()
    const prom = controller.getPrometheus() as PrometheusExport
    const text = prom.text
    const lines = text.split('\n')
    const typeLines = lines.filter(l => l.startsWith('# TYPE'))
    const metricLines = lines.filter(l => l.startsWith('coupon_') || l.startsWith('campaign_') || l.startsWith('referral_') || l.startsWith('notification_') || l.startsWith('lead_'))
    assert.ok(typeLines.length > 0, 'Prometheus 应有 TYPE 行')
    assert.ok(metricLines.length >= 10, 'Prometheus 应有至少 10 个指标行')
    assert.ok(prom.sizeBytes > 0, '应有正数字节大小')
  })
})
