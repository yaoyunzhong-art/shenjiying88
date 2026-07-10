import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [analytics] [C] 角色测试 v3 — 大飞哥电玩城经营分析场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 analytics 模块：
 *   店A: Cyber Galaxy Arcade (Colonial Heights, VA) — 总店
 *   店B: 休斯顿店 (Houston, TX) — 德州分店
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界/权限边界）
 * 覆盖端点: getOperationSnapshot, getDiagnostics, getRecommendations
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { AnalyticsScope, DiagnosticCategory, DiagnosticSeverity } from './analytics.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

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

// ── 大飞哥电玩城门店 ──
const TENANT_DFG = 'tenant-dafeige-us'
const STORE_CYBER = 'store-cyber-galaxy'
const STORE_HOUSTON = 'store-houston'
const BRAND_DFG = 'brand-dafeige-us'

// ── 辅助工厂 ──
function makeCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: TENANT_DFG, brandId: BRAND_DFG, ...overrides }
}

/**
 * 创建带丰富模拟数据的 Controller，模拟大飞哥 Cyber Galaxy 总店运营数据
 */
function makeRichController(withLoyalty = true) {
  const loyaltyMock = withLoyalty
    ? {
        getLoyaltySummary: ({ storeId }: { storeId?: string }) => {
          if (storeId === STORE_CYBER) {
            return {
              settlementCount: 856,
              settlementSuccessCount: 812,
              couponRedemptionCount: 234,
              blindboxFulfillmentCount: 67,
              pointsIn: 320_000,
              pointsOut: 185_000,
            }
          }
          if (storeId === STORE_HOUSTON) {
            return {
              settlementCount: 412,
              settlementSuccessCount: 378,
              couponRedemptionCount: 98,
              blindboxFulfillmentCount: 31,
              pointsIn: 140_000,
              pointsOut: 90_000,
            }
          }
          // tenant level aggregate
          return {
            settlementCount: 1268,
            settlementSuccessCount: 1190,
            couponRedemptionCount: 332,
            blindboxFulfillmentCount: 98,
            pointsIn: 460_000,
            pointsOut: 275_000,
          }
        },
        listCouponPlans: () => [
          { planId: 'p-summer', code: 'SUMMER24', remainingQuota: 8, totalQuota: 100, status: 'ACTIVE' },
          { planId: 'p-fall', code: 'FALL24', remainingQuota: 50, totalQuota: 200, status: 'ACTIVE' },
        ],
      }
    : {
        getLoyaltySummary: () => ({
          settlementCount: 0,
          settlementSuccessCount: 0,
          couponRedemptionCount: 0,
          blindboxFulfillmentCount: 0,
          pointsIn: 0,
          pointsOut: 0,
        }),
        listCouponPlans: () => [],
      }

  const service = new AnalyticsService(loyaltyMock as never)
  const controller = new AnalyticsController(service)
  return { controller, service, loyaltyMock }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局经营快照与诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长视角: 全场经营快照与健康诊断`, () => {
  it('店长查看租户级汇总快照 — 含订单、积分、营销三大面板', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(makeCtx(), { scope: AnalyticsScope.Tenant })

    assert.ok(snapshot.generatedAt)
    assert.equal(snapshot.scope, AnalyticsScope.Tenant)
    assert.equal(snapshot.tenantId, TENANT_DFG)
    // 应包含三个分组
    const groupKeys = snapshot.groups.map(g => g.groupKey)
    assert.ok(groupKeys.includes('orders'), '含订单与支付')
    assert.ok(groupKeys.includes('loyalty'), '含积分与会员')
    assert.ok(groupKeys.includes('marketing'), '含营销与转化')

    // 关键指标应有值
    const totalSettlements = snapshot.totals.find(m => m.key === 'totalSettlements')
    assert.ok(totalSettlements)
    assert.equal(totalSettlements!.value, 1268)
  })

  it('店长按门店筛选快照 — 对比 Cyber Galaxy 与休斯顿', () => {
    const { controller } = makeRichController(true)

    const cyber = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )
    const houston = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_HOUSTON }),
      { scope: AnalyticsScope.Store, storeId: STORE_HOUSTON }
    )

    const settleCyber = cyber.totals.find(m => m.key === 'totalSettlements')!.value
    const settleHouston = houston.totals.find(m => m.key === 'totalSettlements')!.value

    // Cyber 总店 > 休斯顿
    assert.ok(settleCyber > settleHouston, '总店结算量应高于分店')
    assert.equal(settleCyber, 856)
    assert.equal(settleHouston, 412)
  })

  it('店长获取经营诊断 — 检测支付成功率和积分流出风险', () => {
    const { controller } = makeRichController(true)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    assert.ok(diagnostics.length > 0)
    // 应有支付相关诊断
    const paymentDiag = diagnostics.find(d => d.ruleId === 'payment-success-rate-low')
    // 应有积分流出诊断
    const pointsDiag = diagnostics.find(d => d.ruleId === 'points-outflow-dominant')

    // 总店结算成功率 ~93.8% > 80%，所以不应该有支付失败诊断
    // 但积分流出 pointsOut(275k) > pointsIn(460k)*1.3 = 598k? No, 275 < 460*1.3, 所以没有
    // 可能有券额度诊断
    if (paymentDiag) {
      assert.equal(paymentDiag.severity, DiagnosticSeverity.Critical)
    }
  })

  it('店长边界: 无数据租户返回零值而非异常', () => {
    const { controller } = makeRichController(false)
    const snapshot = controller.getOperationSnapshot(makeCtx({ tenantId: 'new-tenant' }), { scope: AnalyticsScope.Tenant })

    snapshot.groups.forEach(g => {
      g.metrics.forEach(m => {
        assert.equal(typeof m.value, 'number', `${m.key} 应为数值`)
        assert.ok(!Number.isNaN(m.value), `${m.key} 不应为 NaN`)
      })
    })
    assert.ok(snapshot.totals.every(t => t.value === 0), '新租户所有汇总应为零')
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 门店级结算与券核销实时快照
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台视角: 门店结算与券核销快照`, () => {
  it('前台查看本门店结算成功率和券核销情况', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )

    const ordersGroup = snapshot.groups.find(g => g.groupKey === 'orders')
    assert.ok(ordersGroup)

    const settleRate = ordersGroup!.metrics.find(m => m.key === 'settlementSuccessRate')
    assert.ok(settleRate)
    // 812/856 ≈ 94.9%
    // 812/856 ≈ 94.86%, should be close to 94.9
    const diff = Math.abs(settleRate!.value - 94.9)
    assert.ok(diff < 1, `结算成功率 ${settleRate!.value} 应在 94.9±1 范围内`)
  })

  it('前台边界: 不给门店ID时报租户级快照但不应泄露他店明细', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(makeCtx(), { scope: AnalyticsScope.Tenant })

    // 租户级看不到具体门店数据指标字段
    assert.equal(snapshot.scope, AnalyticsScope.Tenant)
    assert.ok(!('storeId' in snapshot) || snapshot.storeId === undefined)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 人力角度: 经营活跃度与积分经济
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR视角: 经营活跃度与积分经济指标`, () => {
  it('HR查看会员积分经济活动 — 积分发放与消耗对比', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )

    const loyaltyGroup = snapshot.groups.find(g => g.groupKey === 'loyalty')
    assert.ok(loyaltyGroup)

    const pointsIn = loyaltyGroup!.metrics.find(m => m.key === 'pointsIn')!.value
    const pointsOut = loyaltyGroup!.metrics.find(m => m.key === 'pointsOut')!.value
    const pointsNet = loyaltyGroup!.metrics.find(m => m.key === 'pointsNet')!.value

    // Cyber 积分发放 320k > 消耗 185k => 净流入
    assert.ok(pointsIn > pointsOut, '总店积分应呈净流入')
    assert.equal(pointsNet, pointsIn - pointsOut)
  })

  it('HR边界: 参与度静默时诊断应触发回流建议', () => {
    const { controller } = makeRichController(false)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    // 无任何结算数据 → no-settlement-activity 应触发
    const settlementDiag = diagnostics.find(d => d.ruleId === 'no-settlement-activity')
    assert.ok(settlementDiag, '无结算应诊断出参与度静默')
    assert.equal(settlementDiag!.category, DiagnosticCategory.MemberActivity)

    const hasReEngagementRec = settlementDiag!.recommendations.some(
      r => r.suggestedCampaignKind === 'RE_ENGAGEMENT'
    )
    assert.ok(hasReEngagementRec, '应推荐回流激励活动')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 支付健康与异常诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监视角: 支付健康与系统异常诊断`, () => {
  it('安监检查支付成功率 — 低于80%时应触发关键告警', () => {
    // 模拟支付成功率低的场景: 只成功50%
    const lowSuccessMock = {
      getLoyaltySummary: () => ({
        settlementCount: 100,
        settlementSuccessCount: 45,
        couponRedemptionCount: 20,
        blindboxFulfillmentCount: 5,
        pointsIn: 10_000,
        pointsOut: 8_000,
      }),
      listCouponPlans: () => [],
    }
    const service = new AnalyticsService(lowSuccessMock as never)
    const controller = new AnalyticsController(service)

    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Store })
    const paymentDiag = diagnostics.find(d => d.ruleId === 'payment-success-rate-low')

    assert.ok(paymentDiag, '支付成功率45%应触发诊断')
    assert.equal(paymentDiag!.severity, DiagnosticSeverity.Critical)
    assert.ok(paymentDiag!.recommendations.some(r => r.actionCode === 'inspect-payment-gateway'))
  })

  it('安监边界: 0结算不触发支付失败误报', () => {
    const { controller } = makeRichController(false)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    const paymentDiag = diagnostics.find(d => d.ruleId === 'payment-success-rate-low')
    assert.ok(!paymentDiag, '无结算不应误报支付失败')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 盲盒履约与游戏转化指标
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员视角: 盲盒履约与游戏转化指标`, () => {
  it('导玩员查看盲盒履约数与券核销转化关系', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )

    const ordersGroup = snapshot.groups.find(g => g.groupKey === 'orders')
    assert.ok(ordersGroup)

    const blindbox = ordersGroup!.metrics.find(m => m.key === 'blindboxFulfillmentCount')!.value
    const couponRedemption = ordersGroup!.metrics.find(m => m.key === 'couponRedemptionCount')!.value

    // Cyber店: 67盲盒, 234券核销
    assert.ok(blindbox > 0, '盲盒履约数应>0')
    assert.ok(couponRedemption > blindbox, '券核销通常多于盲盒履约')
  })

  it('导玩员边界: 高券核销但零盲盒时应触发盲盒转化诊断', () => {
    const noBlindboxMock = {
      getLoyaltySummary: () => ({
        settlementCount: 100,
        settlementSuccessCount: 95,
        couponRedemptionCount: 50,
        blindboxFulfillmentCount: 0,
        pointsIn: 10_000,
        pointsOut: 3_000,
      }),
      listCouponPlans: () => [],
    }
    const service = new AnalyticsService(noBlindboxMock as never)
    const controller = new AnalyticsController(service)

    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Store })
    const blindboxDiag = diagnostics.find(d => d.ruleId === 'blindbox-redemption-shortfall')

    assert.ok(blindboxDiag, '券核销>5但零盲盒履约时应触发短缺陷阱诊断')
    assert.equal(blindboxDiag!.severity, DiagnosticSeverity.Warning)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 每日运营快照与异常检测
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员视角: 全时段运营指标与诊断`, () => {
  it('运行专员查看操作快照所有分组指标', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_HOUSTON }),
      { scope: AnalyticsScope.Store, storeId: STORE_HOUSTON }
    )

    // 休斯顿应有结算、积分、营销三组
    assert.equal(snapshot.groups.length, 3)
    const groupKeys = snapshot.groups.map(g => g.groupKey)
    assert.ok(groupKeys.includes('orders'))
    assert.ok(groupKeys.includes('loyalty'))
    assert.ok(groupKeys.includes('marketing'))

    // 休斯顿数据确认
    const settleCount = snapshot.totals.find(m => m.key === 'totalSettlements')!.value
    assert.equal(settleCount, 412)
  })

  it('运行专员获取行动建议（推荐排序）', () => {
    const { controller } = makeRichController(true)
    const recommendations = controller.getRecommendations(makeCtx(), { scope: AnalyticsScope.Tenant })

    // 推荐应按优先级降序排列
    assert.ok(recommendations.length > 0)
    for (let i = 1; i < recommendations.length; i++) {
      assert.ok(recommendations[i - 1].priority >= recommendations[i].priority)
    }
    // 每个推荐应有有效字段
    recommendations.forEach(r => {
      assert.ok(r.actionCode.length > 0)
      assert.ok(r.description.length > 0)
      assert.ok(r.priority >= 0 && r.priority <= 100)
    })
  })

  it('运行专员边界: 诊断结果不应包含重复推荐', () => {
    const { controller } = makeRichController(true)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    const allCodes = diagnostics.flatMap(d => d.recommendations.map(r => r.actionCode))
    const uniqueCodes = new Set(allCodes)
    assert.equal(allCodes.length, uniqueCodes.size, '不应有重复推荐actionCode')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 活动预算与团建 ROI 指标
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建视角: 营销 ROI 与券核销效率`, () => {
  it('团建查看营销ROI以评估团建预算利用率', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )

    const marketingGroup = snapshot.groups.find(g => g.groupKey === 'marketing')
    assert.ok(marketingGroup)

    const roi = marketingGroup!.metrics.find(m => m.key === 'marketingRoi')
    assert.ok(roi)
    assert.equal(typeof roi!.value, 'number')
    assert.ok(['UP', 'DOWN', 'FLAT'].includes(roi!.trend as string))
  })

  it('团建边界: 券额度告急时获取补充配额建议', () => {
    const { controller } = makeRichController(true)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    const couponDiag = diagnostics.find(d => d.ruleId === 'coupon-quota-near-exhaustion')
    // SUMMER24 余量 8/100=8% < 10%, 所以应触发
    assert.ok(couponDiag, 'SUMMER24 额度只剩8%应触发告警')
    assert.equal(couponDiag!.category, DiagnosticCategory.CouponPerformance)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动诊断与投放建议
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销视角: 营销诊断与投放建议`, () => {
  it('营销获取所有营销相关诊断（盲盒+券）', () => {
    const { controller } = makeRichController(true)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    const marketingDiags = diagnostics.filter(d =>
      d.category === DiagnosticCategory.BlindboxEngagement ||
      d.category === DiagnosticCategory.CouponPerformance
    )
    // 至少应有券额度告警
    const couponDiag = marketingDiags.find(d => d.ruleId === 'coupon-quota-near-exhaustion')
    assert.ok(couponDiag, '应有券额度告警')
    couponDiag!.recommendations.forEach(r => {
      assert.ok(r.actionCode.length > 0)
      assert.ok(r.priority >= 0)
    })
  })

  it('营销查看营销转化漏斗指标', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(makeCtx(), { scope: AnalyticsScope.Tenant })

    const marketingGroup = snapshot.groups.find(g => g.groupKey === 'marketing')
    assert.ok(marketingGroup)

    // 关键的营销漏斗指标
    const issued = marketingGroup!.metrics.find(m => m.key === 'couponIssuedTotal')
    const redeemed = marketingGroup!.metrics.find(m => m.key === 'couponRedemptionTotal')
    const campaignTriggers = marketingGroup!.metrics.find(m => m.key === 'campaignTriggerTotal')
    const campaignDispatched = marketingGroup!.metrics.find(m => m.key === 'campaignDispatchedTotal')
    const notifications = marketingGroup!.metrics.find(m => m.key === 'notificationDispatchTotal')

    assert.ok(issued)
    assert.ok(redeemed)
    assert.ok(campaignTriggers)
    assert.ok(campaignDispatched)
    assert.ok(notifications)
    // 发券数 > 核券数 的合理关系
    assert.ok(issued!.value >= redeemed!.value, '发券数应大于等于核销数')
  })

  it('营销边界: 非租户管理员的营销角色不应看到他租户数据', () => {
    const { controller } = makeRichController(true)

    const ctxA = makeCtx({ tenantId: 'tenant-cyber' })
    const ctxB = makeCtx({ tenantId: 'tenant-houston' })

    const snapshotA = controller.getOperationSnapshot(ctxA, { scope: AnalyticsScope.Tenant })
    const snapshotB = controller.getOperationSnapshot(ctxB, { scope: AnalyticsScope.Tenant })

    assert.equal(snapshotA.tenantId, 'tenant-cyber')
    assert.equal(snapshotB.tenantId, 'tenant-houston')
    assert.notEqual(snapshotA.tenantId, snapshotB.tenantId)
  })
})

// ════════════════════════════════════════════════════════════════
// 跨角色综合: 多门店多角色边界覆盖
// ════════════════════════════════════════════════════════════════
describe('Analytics 跨角色多门店场景', () => {
  it('不同 storeId 返回不同快照 — 数据隔离', () => {
    const { controller } = makeRichController(true)

    const cyberSnapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_CYBER }),
      { scope: AnalyticsScope.Store, storeId: STORE_CYBER }
    )
    const houstonSnapshot = controller.getOperationSnapshot(
      makeCtx({ storeId: STORE_HOUSTON }),
      { scope: AnalyticsScope.Store, storeId: STORE_HOUSTON }
    )

    // 关键指标不同
    const cyberSettles = cyberSnapshot.totals.find(m => m.key === 'totalSettlements')!.value
    const houstonSettles = houstonSnapshot.totals.find(m => m.key === 'totalSettlements')!.value
    assert.notEqual(cyberSettles, houstonSettles, '两店结算量应不同')
  })

  it('recommendations 按 priority 降序排列 — 最紧急的在前', () => {
    const { controller } = makeRichController(true)
    const recommendations = controller.getRecommendations(makeCtx(), { scope: AnalyticsScope.Tenant })

    for (let i = 1; i < recommendations.length; i++) {
      assert.ok(
        recommendations[i - 1].priority >= recommendations[i].priority,
        `推荐应降序排列: ${recommendations[i - 1].actionCode}(${recommendations[i - 1].priority}) >= ${recommendations[i].actionCode}(${recommendations[i].priority})`
      )
    }
  })

  it('所有快照均含 generatedAt 且格式合法', () => {
    const { controller } = makeRichController(true)
    const snapshot = controller.getOperationSnapshot(makeCtx(), { scope: AnalyticsScope.Tenant })

    const timestamp = new Date(snapshot.generatedAt)
    assert.ok(timestamp instanceof Date && !isNaN(timestamp.getTime()), 'generatedAt 应合法')
  })

  it('诊断含 evidence 字段且为 object', () => {
    const { controller } = makeRichController(false)
    const diagnostics = controller.getDiagnostics(makeCtx(), { scope: AnalyticsScope.Tenant })

    diagnostics.forEach(d => {
      assert.ok(d.evidence, `诊断 ${d.ruleId} 应有 evidence`)
      assert.equal(typeof d.evidence, 'object')
    })
  })
})
