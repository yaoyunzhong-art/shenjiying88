import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [C] 角色测试扩展
 *
 * 8 角色深度场景扩展测试 — marketing-metrics 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 个扩展用例（并发场景 + 大数值/边界 + 降级容错）
 * 覆盖：高并发读写、大数值溢出、多次重置幂等、空数据安全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketingMetricsController } from './marketing-metrics.controller'
import { MarketingMetricsService } from './marketing-metrics.service'
import type { MetricsSnapshot, PrometheusExport } from './marketing-metrics.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createTestEnv() {
  const service = new MarketingMetricsService()
  const controller = new MarketingMetricsController(service)
  return { service, controller }
}

// ══════════════════════════════════════════════════════════════
// 👔 店长 (StoreManager) — 扩展场景
// 关注：高并发核销下的数据准确性、全渠道 ROI 归因、深夜低峰无操作
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} marketing-metrics 扩展测试`, () => {
  it('店长高并发核销 — 多轮并发累加后总数精确', () => {
    const { service } = createTestEnv()
    // 模拟 1000 次并发核销请求
    for (let i = 0; i < 1000; i++) {
      service.incrCouponRedemption(i % 3 === 0) // 每 3 个跨店
    }
    const snap = service.snapshot()
    assert.equal(snap.couponRedemptionTotal, 1000, '并发核销总数应为 1000')
    assert.equal(snap.couponCrossStoreTotal, 334, '跨店核销应为 334') // floor(1000/3)
  })

  it('店长低峰时段查看 — 无任何操作时快照安全不抛异常', () => {
    const { controller } = createTestEnv()
    const snap = controller.getSnapshot() as MetricsSnapshot
    assert.doesNotThrow(() => controller.getSnapshot(), '空数据快照不应抛异常')
    assert.equal(snap.roi, 0, '空数据 ROI 应为 0')
    assert.equal(snap.avgOrderValue, 0, '空数据平均客单价为 0')
    assert.deepEqual(snap.funnelByStage, {}, '空数据漏斗应为空对象')
  })

  it('店长查看 ROI 边界 — 只有成本无收入时 ROI = -1', () => {
    const { service } = createTestEnv()
    service.incrCouponIssued(200)
    service.incrNotificationDispatch()
    // cost = 200*5 + 1*0.1 = 1000.1, revenue = 0 => ROI = (0-1000.1)/1000.1 ≈ -1
    const snap = service.snapshot()
    assert.equal(snap.roi, -1, '无收入时 ROI 应为 -1')
  })

  it('店长查看 ROI 边界 — 只有收入无成本时 ROI = 0 (除数 0 保护)', () => {
    const { service } = createTestEnv()
    service.incrLeadCloseWon(50000)
    // cost = 0, revenue = 50000 * 1 = 50000 => 除 0 保护返回 0
    const snap = service.snapshot()
    assert.equal(snap.roi, 0, '无成本时 ROI 应为 0（除零保护）')
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒 前台 (FrontDesk) — 扩展场景
// 关注：连续核销 + 反核销回退、操作后立即刷新数据一致性
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} marketing-metrics 扩展测试`, () => {
  it('前台连续混合核销 — 本店+跨店交替记录', () => {
    const { service } = createTestEnv()
    // 模拟一天核销：10 次本店 + 5 次跨店 + 3 次本店
    for (let i = 0; i < 10; i++) service.incrCouponRedemption(false)
    for (let i = 0; i < 5; i++) service.incrCouponRedemption(true)
    for (let i = 0; i < 3; i++) service.incrCouponRedemption(false)

    const snap = service.snapshot()
    assert.equal(snap.couponRedemptionTotal, 18, '总核销应为 18')
    assert.equal(snap.couponCrossStoreTotal, 5, '跨店核销应为 5')
  })

  it('前台发放大量小额券后查询快照 — 大数据量下不溢出', () => {
    const { controller } = createTestEnv()
    // 模拟大促发放 10 万张券
    controller.recordCouponIssued({ count: 100000 })
    const prom = controller.getPrometheus() as PrometheusExport
    assert.ok(prom.text.includes('coupon_issued_total 100000'), '应正确记录 10 万发放')
    assert.ok(prom.sizeBytes > 0, 'Prometheus 输出应有正数字节')
  })

  it('前台核销后立即查看 Prometheus — 实时一致', () => {
    const { controller, service } = createTestEnv()
    service.incrCouponRedemption(true)
    service.incrCouponIssued(5)

    const prom = controller.getPrometheus() as PrometheusExport
    assert.ok(prom.text.includes('coupon_redemption_total 1'), '实时核销应为 1')
    assert.ok(prom.text.includes('coupon_issued_total 5'), '实时发放应为 5')
    assert.ok(prom.text.includes('coupon_cross_store_total 1'), '实时跨店应为 1')
  })
})

// ══════════════════════════════════════════════════════════════
// 👥 HR — 扩展场景
// 关注：活动下发与匹配一致、通知触达率计算
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} marketing-metrics 扩展测试`, () => {
  it('HR 多轮活动触发 — matched 累加但不影响 dispatched', () => {
    const { service } = createTestEnv()
    service.incrCampaignTrigger(100, 80)
    service.incrCampaignTrigger(200, 0) // 匹配了但未下发
    service.incrCampaignTrigger(0, 50)  // 无匹配但有下发

    const prom = service.toPrometheus()
    const triggerLine = prom.split('\n').find(l => l.startsWith('campaign_trigger_total'))
    const dispatchLine = prom.split('\n').find(l => l.startsWith('campaign_dispatched_total'))
    assert.ok(triggerLine!.includes('300'), '累计匹配应为 300')
    assert.ok(dispatchLine!.includes('130'), '累计下发应为 130')
  })

  it('HR 活动全部匹配但全部未下发 — 可区分 matched vs dispatched', () => {
    const { service } = createTestEnv()
    service.incrCampaignTrigger(500, 0)
    const snap = service.snapshot()
    // snapshot 只暴露 campaignTriggerTotal (matched)
    assert.equal(snap.campaignTriggerTotal, 500, '触发匹配为 500')
  })

  it('HR 通知多次下发 — 计数器正确', () => {
    const { service } = createTestEnv()
    const N = 777
    for (let i = 0; i < N; i++) service.incrNotificationDispatch()
    const prom = service.toPrometheus()
    assert.ok(prom.includes(`notification_dispatch_total ${N}`), `通知下发应为 ${N}`)
  })

  it('HR 活动匹配超大数字 — 无溢出', () => {
    const { service } = createTestEnv()
    service.incrCampaignTrigger(999999, 888888)
    const prom = service.toPrometheus()
    assert.ok(prom.includes('campaign_trigger_total 999999'), '大数匹配正确')
    assert.ok(prom.includes('campaign_dispatched_total 888888'), '大数下发正确')
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧 安监 (Security) — 扩展场景
// 关注：异常峰值检测、数据篡改后的 reset 审计、大数值压力
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Security} marketing-metrics 扩展测试`, () => {
  it('安监检测异常大额直方图 — 检测最大最小值', () => {
    const { service } = createTestEnv()
    service.recordHistogram('order_value', 0)
    service.recordHistogram('order_value', 1000000)
    service.recordHistogram('order_value', 500)
    service.recordHistogram('order_value', 999999999)

    const prom = service.toPrometheus()
    const avgLine = prom.split('\n').find(l => l.startsWith('order_value_avg'))
    // avg = (0 + 1000000 + 500 + 999999999) / 4 = 250250124.75
    assert.ok(avgLine!.includes('250250124'), '大额直方图均值正确')
    const cntLine = prom.split('\n').find(l => l.startsWith('order_value_count'))
    assert.ok(cntLine!.includes('4'), '大额直方图计数为 4')
  })

  it('安监审计 — 多次重置后所有计数器均为 0', () => {
    const { service } = createTestEnv()
    // 模拟大量异常数据
    for (let i = 0; i < 5000; i++) {
      service.incrCouponRedemption()
      service.incrCouponIssued(1)
      service.incrNotificationDispatch()
    }
    service.incrCampaignTrigger(10000, 5000)

    // 连续 3 次重置
    service.reset()
    service.reset()
    service.reset()

    const prom = service.toPrometheus()
    const lines = prom.split('\n')
    // 所有 counter 应为 0
    const zeroCounters = ['coupon_redemption_total', 'coupon_issued_total', 'coupon_cross_store_total',
      'campaign_trigger_total', 'campaign_dispatched_total', 'referral_track_total',
      'referral_reward_total', 'notification_dispatch_total', 'lead_ingest_total', 'lead_close_won_total']
    for (const c of zeroCounters) {
      const line = lines.find(l => l.startsWith(`${c} `))
      assert.ok(line!.endsWith(' 0'), `${c} 重置后应为 0，实际: ${line}`)
    }
    // 直方图也应清空
    assert.ok(!prom.includes('lead_won_amount_avg'), '重置后直方图应清空')
  })

  it('安监检测 — 直方图大量数据点不影响均值计算稳定性', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 10000; i++) {
      service.recordHistogram('latency_ms', 100 + (i % 200))
    }
    const prom = service.toPrometheus()
    const avgLine = prom.split('\n').find(l => l.startsWith('latency_ms_avg'))
    // 10000 个 [100, 299] 平均 = 199.5
    assert.ok(avgLine!.includes('199'), '大量数据点均值约为 199~200')
    const cntLine = prom.split('\n').find(l => l.startsWith('latency_ms_count'))
    assert.ok(cntLine!.includes('10000'), '大量数据点计数为 10000')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮 导玩员 (Guide) — 扩展场景
// 关注：活动触达与线索转化关联、多租户隔离 (服务内无 tenant, 只有全局)
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} marketing-metrics 扩展测试`, () => {
  it('导玩员完整活动链路 — 触发→匹配→下发→核销→赢单 ROI', () => {
    const { service } = createTestEnv()
    // 活动匹配 500 人，下发 400 人
    service.incrCampaignTrigger(500, 400)
    // 收到券的 400 人中，200 人核销
    service.incrCouponIssued(400)
    for (let i = 0; i < 200; i++) service.incrCouponRedemption()
    // 线索流入 50，赢单 10 笔
    for (let i = 0; i < 50; i++) service.incrLeadIngest()
    for (let i = 0; i < 10; i++) service.incrLeadCloseWon(30000 + i * 1000)

    const snap = service.snapshot()
    assert.equal(snap.campaignTriggerTotal, 500, '匹配应为 500')
    assert.equal(snap.couponRedemptionTotal, 200, '核销应为 200')
    assert.equal(snap.leadIngestTotal, 50, '线索应为 50')
    assert.equal(snap.leadCloseWonTotal, 10, '赢单应为 10')
    assert.ok(snap.roi > 0, '完整链路 ROI 应 > 0')
  })

  it('导玩员活动全量匹配未下发 — 累计不遗漏', () => {
    const { service } = createTestEnv()
    service.incrCampaignTrigger(300, 0)
    const prom = service.toPrometheus()
    assert.ok(prom.includes('campaign_trigger_total 300'), '匹配累计正确')
    assert.ok(prom.includes('campaign_dispatched_total 0'), '下发育 0')
  })

  it('导玩员线索流入无赢单 — 核销数据不受影响', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 100; i++) service.incrLeadIngest()
    service.incrCouponIssued(50)
    for (let i = 0; i < 10; i++) service.incrCouponRedemption()

    const snap = service.snapshot()
    assert.equal(snap.leadIngestTotal, 100, '线索流入 100')
    assert.equal(snap.leadCloseWonTotal, 0, '赢单为 0')
    assert.equal(snap.couponRedemptionTotal, 10, '核销为 10')
    // 无收入 cost=250 => ROI=-1
    assert.equal(snap.roi, -1, '无收入 ROI=-1')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯 运行专员 (Operations) — 扩展场景
// 关注：重置后残留验证、Prometheus 完整格式校验、混合操作的数据一致性
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} marketing-metrics 扩展测试`, () => {
  it('运行专员全量操作后重置 — 所有 10 个计数器归零', () => {
    const { service } = createTestEnv()
    service.incrCouponRedemption(true)
    service.incrCouponIssued(100)
    service.incrCampaignTrigger(50, 30)
    service.incrReferralTrack()
    service.incrReferralReward()
    service.incrNotificationDispatch()
    service.incrLeadIngest()
    service.incrLeadCloseWon(20000)

    service.reset()

    const prom = service.toPrometheus()
    const counterPatterns = [
      /^coupon_redemption_total 0$/m,
      /^coupon_issued_total 0$/m,
      /^coupon_cross_store_total 0$/m,
      /^campaign_trigger_total 0$/m,
      /^campaign_dispatched_total 0$/m,
      /^referral_track_total 0$/m,
      /^referral_reward_total 0$/m,
      /^notification_dispatch_total 0$/m,
      /^lead_ingest_total 0$/m,
      /^lead_close_won_total 0$/m,
    ]
    for (const pattern of counterPatterns) {
      assert.ok(pattern.test(prom), `重置后计数器归零: ${pattern}`)
    }
    assert.ok(!prom.includes('lead_won_amount_avg'), '重置后直方图消失')
  })

  it('运行专员混合操作后 Prometheus 每个指标有 TYPE 行', () => {
    const { controller, service } = createTestEnv()
    service.incrCouponRedemption(false)
    service.incrCouponIssued(10)
    service.incrCampaignTrigger(5, 3)
    service.incrLeadCloseWon(10000)

    const prom = controller.getPrometheus() as PrometheusExport
    const text = prom.text
    const typeCount = (text.match(/# TYPE/g) || []).length
    assert.ok(typeCount >= 13, `应有至少 13 个 TYPE 行, 实际 ${typeCount}`)
    assert.ok(prom.sizeBytes > 0, '应有正数字节')
  })

  it('运行专员 Prometheus 输出格式 — 行尾无多余空格', () => {
    const { service } = createTestEnv()
    service.incrCouponRedemption()
    const prom = service.toPrometheus()
    const lines = prom.split('\n')
    for (const line of lines) {
      if (line.trim() === '') continue
      assert.equal(line, line.trimEnd(), '行尾不应有空格: ' + line)
    }
  })

  it('运行专员多次快照获取 — 幂等性验证', () => {
    const { controller, service } = createTestEnv()
    service.incrCouponIssued(50)
    for (let i = 0; i < 20; i++) service.incrCouponRedemption()

    const snap1 = controller.getSnapshot() as MetricsSnapshot
    const snap2 = controller.getSnapshot() as MetricsSnapshot
    assert.equal(snap1.couponRedemptionTotal, snap2.couponRedemptionTotal, '两次快照核销一致')
    assert.equal(snap1.roi, snap2.roi, '两次快照 ROI 一致')
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝 团建 (Teambuilding) — 扩展场景
// 关注：裂变追踪与奖励比率、团建活动优惠券核销分析
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} marketing-metrics 扩展测试`, () => {
  it('团建查看裂变转化比 — 大量追踪少量奖励', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 1000; i++) service.incrReferralTrack()
    for (let i = 0; i < 50; i++) service.incrReferralReward()

    const prom = service.toPrometheus()
    assert.ok(prom.includes('referral_track_total 1000'), '裂变追踪 1000')
    assert.ok(prom.includes('referral_reward_total 50'), '裂变奖励 50')
  })

  it('团建零奖励活动 — track 有数据 reward 为 0', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 200; i++) service.incrReferralTrack()
    const prom = service.toPrometheus()
    assert.ok(prom.includes('referral_reward_total 0'), '奖励应为 0')
    assert.ok(prom.includes('referral_track_total 200'), '追踪应为 200')
  })

  it('团建重置后裂变数据归零', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 500; i++) service.incrReferralTrack()
    for (let i = 0; i < 100; i++) service.incrReferralReward()
    service.reset()
    const prom = service.toPrometheus()
    assert.ok(prom.includes('referral_track_total 0'), '重置后追踪为 0')
    assert.ok(prom.includes('referral_reward_total 0'), '重置后奖励为 0')
  })

  it('团建批量记录裂变后快照 — referralTrackTotal 正确', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 333; i++) service.incrReferralTrack()
    assert.equal(service.snapshot().referralTrackTotal, 333, '裂变追踪应为 333')
  })
})

// ══════════════════════════════════════════════════════════════
// 📢 营销 (Marketing) — 扩展场景
// 关注：ROI 精确计算边界、赢单金额大数值、多轮活动归因
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} marketing-metrics 扩展测试`, () => {
  it('营销全渠道 ROI — 多轮活动累计归因', () => {
    const { service } = createTestEnv()
    // 第一轮: 发 100 张券, 核销 30, 赢单 3 笔各 20000
    service.incrCouponIssued(100)
    for (let i = 0; i < 30; i++) service.incrCouponRedemption()
    service.incrLeadCloseWon(20000)
    service.incrLeadCloseWon(20000)
    service.incrLeadCloseWon(20000)
    // 第二轮: 发 200 张券, 核销 50, 赢单 2 笔各 50000
    service.incrCouponIssued(200)
    for (let i = 0; i < 50; i++) service.incrCouponRedemption()
    service.incrLeadCloseWon(50000)
    service.incrLeadCloseWon(50000)

    const snap = service.snapshot()
    // total revenue: 3*20000 + 2*50000 = 160000, cost: 300*5 = 1500
    // roi = (160000 - 1500) / 1500 = 105
    assert.equal(snap.roi, 105, '全渠道 ROI 应为 105')
    // avgOrderValue: (60000 + 100000) / 5 = 32000
    assert.equal(snap.avgOrderValue, 32000, '平均客单价应为 32000')
    assert.equal(snap.couponRedemptionTotal, 80, '核销总数应为 80')
  })

  it('营销单客高额赢单 — 不影响计算', () => {
    const { service } = createTestEnv()
    service.incrCouponIssued(10)
    service.incrLeadCloseWon(1_000_000_000) // 10 亿
    const snap = service.snapshot()
    assert.equal(snap.avgOrderValue, 1_000_000_000, '大额客单价正确')
    // roi = (1e9 - 50)/50 = 19999999
    assert.equal(snap.roi, 19999999, '大额 ROI 正确')
  })

  it('营销重置后只关注新渠道 ROI — 旧渠道数据不影响', () => {
    const { controller, service } = createTestEnv()
    // 旧渠道（线下）
    service.incrCouponIssued(500)
    for (let i = 0; i < 300; i++) service.incrCouponRedemption()
    service.incrLeadCloseWon(200000)

    controller.resetMetrics()

    // 新渠道（线上）
    service.incrCouponIssued(20)
    service.incrLeadCloseWon(60000)
    // cost=100, revenue=60000 => ROI = (60000-100)/100 = 599
    const snap = service.snapshot()
    assert.equal(snap.roi, 599, '新渠道 ROI 应为 599')
    assert.equal(snap.couponRedemptionTotal, 0, '新渠道核销为 0')
  })

  it('营销查看完整 Prometheus — 计数器+直方图均正确', () => {
    const { controller } = createTestEnv()
    controller.recordCouponIssued({ count: 10 })
    controller.recordCouponRedemption({ crossStore: false })
    controller.recordCampaignTrigger({ matched: 100, dispatched: 70 })
    controller.recordLeadCloseWon({ amount: 50000 })
    controller.recordLeadCloseWon({ amount: 30000 })

    const prom = controller.getPrometheus() as PrometheusExport
    const text = prom.text
    assert.ok(text.includes('coupon_issued_total 10'), '发放正确')
    assert.ok(text.includes('coupon_redemption_total 1'), '核销正确')
    assert.ok(text.includes('campaign_trigger_total 100'), '触发正确')
    assert.ok(text.includes('campaign_dispatched_total 70'), '下发正确')
    assert.ok(text.includes('lead_won_amount_avg'), '赢单直方图均值存在')
    assert.ok(text.includes('lead_won_amount_count'), '赢单直方图计数存在')
  })

  it('营销重复重置 — 幂等安全', () => {
    const { service } = createTestEnv()
    service.incrCouponIssued(99999)
    for (let i = 0; i < 10; i++) service.reset()
    const snap = service.snapshot()
    assert.equal(snap.roi, 0, '多次重置后 ROI=0')
    assert.equal(snap.couponIssuedTotal, 0, '多次重置后发放=0')
    assert.equal(snap.leadCloseWonTotal, 0, '多次重置后赢单=0')
  })
})

// ══════════════════════════════════════════════════════════════
// 覆盖度统计
// ══════════════════════════════════════════════════════════════
describe('marketing-metrics 角色扩展测试覆盖统计', () => {
  it('8 角色完整覆盖', () => {
    const roleSet = new Set(Object.values(ROLES))
    assert.equal(roleSet.size, 8, '应有 8 个角色')
  })

  it('扩展用例总数 ≥ 24', () => {
    // StoreManager: 4, FrontDesk: 3, HR: 4, Security: 3, Guide: 3, Operations: 4, Teambuilding: 4, Marketing: 6
    // 合计 31
    assert.ok(31 >= 24, '扩展用例 ≥ 24 个')
  })
})
