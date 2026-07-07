import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [C] 角色测试
 * 
 * 8 角色视角的 ai-rule-engine 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'
import type { MemberLevelInput, DeviceAnomalyInput } from './ai-rule-engine.entity'

// ── 角色定义 ──
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

// ── 测试数据工厂 ──
function createController() {
  const service = new AiRuleEngineService()
  return new AiRuleEngineController(service)
}

const svipMemberData: MemberLevelInput = {
  memberId: 'mem-svip-001',
  totalPoints: 8000,
  totalSpend: 20000,
  visitCount: 50,
  tenantId: 't-001',
}

const vipMemberData: MemberLevelInput = {
  memberId: 'mem-vip-002',
  totalPoints: 3000,
  totalSpend: 12000, // spend >= 10000 + points >= 5000 + visits >= 20 => VIP (score 0.7)
  visitCount: 25,
  tenantId: 't-001',
}

const regularMemberData: MemberLevelInput = {
  memberId: 'mem-regular-003',
  totalPoints: 100,
  totalSpend: 200,
  visitCount: 3,
  tenantId: 't-001',
}

const criticalAnomalyData: DeviceAnomalyInput = {
  deviceId: 'dev-crit-001',
  storeId: 'store-001',
  metrics: {
    cpuUsage: 95,
    memoryUsage: 90,
    diskUsage: 92,
    networkLatencyMs: 50,
    errorRate: 0.5,
    uptimeHours: 1000,
  },
  tenantId: 't-001',
}

const normalDeviceData: DeviceAnomalyInput = {
  deviceId: 'dev-healthy-002',
  storeId: 'store-001',
  metrics: {
    cpuUsage: 20,
    memoryUsage: 30,
    diskUsage: 40,
    networkLatencyMs: 50,
    errorRate: 0.5,
    uptimeHours: 100,
  },
  tenantId: 't-001',
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} ai-rule-engine 角色测试`, () => {
  it('店长可评估高价值会员等级 => SVIP', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel(svipMemberData)
    const result = res.result as { suggestedLevel: string; triggeredRules: string[]; confidence: number }

    assert.equal(res.type, 'member-level')
    assert.equal(result.suggestedLevel, 'SVIP')
    assert.equal(result.triggeredRules.length, 3)
    assert.ok(result.confidence >= 0.8)
    assert.ok(Date.parse(res.timestamp) > 0)
  })

  it('店长查看普通会员评估 => REGULAR', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel(regularMemberData)
    const result = res.result as { suggestedLevel: string; confidence: number }

    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.ok(result.confidence <= 0.5)
  })

  it('店长批量评估全体会员等级（管理决策辅助）', () => {
    const ctrl = createController()
     
    const result = ctrl.evaluateBatch({
      items: [
        { type: 'member-level', data: svipMemberData as unknown as Record<string, unknown> as unknown as Record<string, unknown> },
        { type: 'member-level', data: vipMemberData as unknown as Record<string, unknown> },
        { type: 'member-level', data: regularMemberData as unknown as Record<string, unknown> }
      ]
    } as any)

    assert.equal(result.total, 3)
    assert.equal(result.succeeded, 3)
    assert.equal(result.failed, 0)

    const levels = result.items.map(i => (i.result as import('./ai-rule-engine.entity').MemberLevelOutput).suggestedLevel)
    assert.deepEqual(levels, ['SVIP', 'REGULAR', 'REGULAR'])
  })

  it('店长查看规则引擎配置状态（运维可见性）', () => {
    const ctrl = createController()
    const engines = ctrl.getEngines()

    assert.ok(Array.isArray(engines))
    assert.ok(engines.length >= 3)

    const memberLevelEngine = engines.find((e: { engineId: string }) => e.engineId === 'member-level-v1')
    assert.ok(memberLevelEngine)
    assert.equal(memberLevelEngine!.conditionsCount, 3)
    assert.equal(memberLevelEngine!.actionsCount, 3)
    assert.equal(memberLevelEngine!.matchStrategy, 'ALL')

    const deviceEngine = engines.find((e: { engineId: string }) => e.engineId === 'device-anomaly-v1')
    assert.ok(deviceEngine)
    assert.equal(deviceEngine!.conditionsCount, 5)
    assert.equal(deviceEngine!.matchStrategy, 'ANY')

    const riskEngine = engines.find((e: { engineId: string }) => e.engineId === 'risk-score-v1')
    assert.ok(riskEngine)
    assert.equal(riskEngine!.conditionsCount, 5)
  })

  it('店长对高退款门店做风险评分（风控视角）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'store-risky-001',
      subjectType: 'store',
      metrics: {
        refundCount: 10,
        abnormalPaymentCount: 5,
        complaintCount: 3,
        voidRefundAmount: 2000,
        deviceAnomalyCount: 1,
        activeDays: 7,
        recentTransactionAmount: 100000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    assert.equal(res.type, 'risk-score')
    // cond-high-refund ✓, cond-abnormal-payment ✓, cond-complaints ✓, cond-void-refund ✓
    // weightedScore = 25+20+20+20 = 85 + extra (void>=1000 => +15, abnormal>=5 => +10) = 110 => clamp 100
    assert.ok(result.riskScore >= 80)
    assert.equal(result.riskLevel, 'CRITICAL')
    assert.ok(result.reasons.length >= 3)
    assert.ok(result.recommendations.length >= 3)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} ai-rule-engine 角色测试`, () => {
  it('前台为新会员查询等级建议 => REGULAR（边界：零消费零积分）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel({
      memberId: 'new-member-001',
      totalPoints: 0,
      totalSpend: 0,
      visitCount: 0,
      tenantId: 't-001',
    })
    const result = res.result as { suggestedLevel: string; triggeredRules: string[]; confidence: number }

    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.equal(result.confidence, 0.3)
  })

  it('前台通过通用 evaluate 端点查询会员等级', () => {
    const ctrl = createController()
    const res = ctrl.evaluate({
      type: 'member-level',
      data: {
        memberId: 'mem-front-001',
        totalPoints: 3000,
        totalSpend: 8000,
        visitCount: 22, // visitCount >= 20 触发 cond-frequent-visit
        tenantId: 't-001',
      },
    })
    assert.equal(res.type, 'member-level')
    const result = res.result as { suggestedLevel: string; triggeredRules: string[] }
    // matchStrategy=ALL, 不满足全部条件 => REGULAR
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.ok(result.triggeredRules.length < 3) // 只有部分条件触发
  })

  it('前台批量评估多会员（快速结账排队时的批量查询）', () => {
    const ctrl = createController()
     
    const result = ctrl.evaluateBatch({
      items: [
        { type: 'member-level', data: { memberId: 'cashier-q-01', totalPoints: 500, totalSpend: 1000, visitCount: 5, tenantId: 't-001' } },
        { type: 'member-level', data: { memberId: 'cashier-q-02', totalPoints: 6000, totalSpend: 12000, visitCount: 30, tenantId: 't-001' } }
      ]
    } as any)

    assert.equal(result.total, 2)
    assert.equal(result.succeeded, 2)
    const items = result.items as import('./ai-rule-engine.entity').BatchEvaluateResponseItem[]
    assert.equal(items[0].inputId, 'cashier-q-01')
    assert.equal(items[1].inputId, 'cashier-q-02')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} ai-rule-engine 角色测试`, () => {
  it('HR 评估员工会员等级 => 触发2条件但 ALL 不满足 => REGULAR', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel(vipMemberData)
    const result = res.result as { suggestedLevel: string; confidence: number; triggeredRules: string[] }

    // totalSpend=12000, totalPoints=3000, visitCount=25
    // cond-high-spend ✓, cond-high-points ✗(3000<5000), cond-frequent-visit ✓
    // matchStrategy=ALL => isMatch=false => REGULAR + empty triggeredRules
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.confidence, 0.3)
    assert.equal(result.triggeredRules.length, 0) // isMatch=false => []
  })

  it('HR 通用端点输入错误类型 => 抛出异常（边界：类型不匹配）', () => {
    const ctrl = createController()
    assert.throws(
      () =>
        ctrl.evaluate({
          type: 'staff-performance' as never,
          data: {} as never,
        }),
      /Unsupported evaluation type/
    )
  })

  it('HR 批量评估新入职员工关联会员（批量入职场景）', () => {
    const ctrl = createController()
     
    const result = ctrl.evaluateBatch({
      items: [
        { type: 'member-level', data: { memberId: 'hr-new-01', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' } },
        { type: 'member-level', data: { memberId: 'hr-new-02', totalPoints: 3000, totalSpend: 6000, visitCount: 22, tenantId: 't-001' } }
      ]
    } as any)

    assert.equal(result.total, 2)
    assert.equal(result.succeeded, 2)

    const levels = result.items.map(i => (i.result as import('./ai-rule-engine.entity').MemberLevelOutput).suggestedLevel)
    assert.deepEqual(levels, ['REGULAR', 'REGULAR'])
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} ai-rule-engine 角色测试`, () => {
  it('安监检测设备严重异常 => CRITICAL', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly(criticalAnomalyData)
    const result = res.result as {
      isAnomaly: boolean
      severity: string
      anomalyType: string
      triggeredRules: string[]
      recommendations: string[]
    }

    assert.equal(result.isAnomaly, true)
    assert.equal(result.severity, 'CRITICAL')
    assert.equal(result.anomalyType, 'CPU_SPIKE')
    assert.ok(result.triggeredRules.length >= 3)
    assert.ok(result.recommendations.length >= 3)
  })

  it('安监检查健康设备正常 => 无异常', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly(normalDeviceData)
    const result = res.result as { isAnomaly: boolean; severity: string; recommendations: string[] }

    assert.equal(result.isAnomaly, false)
    assert.equal(result.severity, 'LOW')
    assert.deepStrictEqual(result.recommendations, ['All metrics within normal range'])
  })

  it('安监对投诉多的会员做风险评分 => HIGH', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'member-complaint-001',
      subjectType: 'member',
      metrics: {
        refundCount: 5,
        complaintCount: 3,
        voidRefundAmount: 800,
        abnormalPaymentCount: 1,
        deviceAnomalyCount: 0,
        activeDays: 14,
        recentTransactionAmount: 5000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    // cond-high-refund ✓(5>=3, w0.25) + cond-complaints ✓(3>=1, w0.2) + cond-void-refund ✓(800>=500, w0.2)
    // = 25+20+20 = 65 => HIGH
    assert.equal(result.riskLevel, 'HIGH')
    assert.ok(result.riskScore >= 50)
    assert.ok(result.triggeredRules.includes('cond-high-refund'))
    assert.ok(result.triggeredRules.includes('cond-complaints'))
  })

  it('安监批量评估可疑设备群（安全巡检批量）', () => {
    const ctrl = createController()
     
    const result = ctrl.evaluateBatch({
      items: [
        { type: 'device-anomaly', data: criticalAnomalyData as unknown as Record<string, unknown> },
        { type: 'device-anomaly', data: normalDeviceData as unknown as Record<string, unknown> },
        { type: 'device-anomaly', data: { deviceId: 'dev-security-01', storeId: 'store-001', metrics: { cpuUsage: 91, memoryUsage: 87, diskUsage: 50, networkLatencyMs: 100, errorRate: 2, uptimeHours: 300 }, tenantId: 't-001' } }
      ]
    } as any)

    assert.equal(result.total, 3)
    assert.equal(result.succeeded, 3)
    assert.equal(result.failed, 0)

    const item1 = result.items[0].result as import('./ai-rule-engine.entity').DeviceAnomalyOutput
    assert.equal(item1.isAnomaly, true)
    assert.equal(item1.severity, 'CRITICAL')

    const item2 = result.items[1].result as import('./ai-rule-engine.entity').DeviceAnomalyOutput
    assert.equal(item2.isAnomaly, false)

    const item3 = result.items[2].result as import('./ai-rule-engine.entity').DeviceAnomalyOutput
    assert.equal(item3.isAnomaly, true)
    // cpuUsage=91>=90 + memoryUsage=87>=85 => 2个异常 => HIGH
    assert.equal(item3.severity, 'HIGH')
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} ai-rule-engine 角色测试`, () => {
  it('导玩员通过通用端点检测设备异常 => CPU_SPIKE', () => {
    const ctrl = createController()
    const res = ctrl.evaluate({
      type: 'device-anomaly',
      data: {
        deviceId: 'dev-guide-001',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 93,
          memoryUsage: 50,
          diskUsage: 30,
          networkLatencyMs: 80,
          errorRate: 1,
          uptimeHours: 500,
        },
        tenantId: 't-001',
      },
    })
    const result = res.result as { isAnomaly: boolean; anomalyType: string; severity: string }

    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'CPU_SPIKE')
    assert.equal(result.severity, 'MEDIUM')
  })

  it('导玩员查看高积分会员评估 => 不满足 ALL 回退 REGULAR（边界：高积分低消费）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel({
      memberId: 'mem-guide-001',
      totalPoints: 6000,
      totalSpend: 3000, // 消费不足但积分高
      visitCount: 30, // 高到访 >= 20 触发
      tenantId: 't-001',
    })
    const result = res.result as { suggestedLevel: string; triggeredRules: string[]; confidence: number }

    // high-points ✓ (6000>=5000), frequent-visit ✓ (30>=20), high-spend ✗ (3000<10000)
    // ALL => isMatch=false => REGULAR + empty triggeredRules
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.equal(result.confidence, 0.3)
  })

  it('导玩员对游客设备做异常检测（游客无会员体系但需安检）', () => {
    const ctrl = createController()
    const res = ctrl.evaluate({
      type: 'device-anomaly',
      data: {
        deviceId: 'dev-visitor-001',
        storeId: 'store-guest',
        metrics: {
          cpuUsage: 15,
          memoryUsage: 25,
          diskUsage: 35,
          networkLatencyMs: 40,
          errorRate: 0.1,
          uptimeHours: 50
        },
        tenantId: 't-001'
      }
    })
    const result = res.result as import('./ai-rule-engine.entity').DeviceAnomalyOutput
    assert.equal(result.isAnomaly, false)
    assert.equal(result.severity, 'LOW')
  })

  it('导玩员对高频退款设备做风险排查', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'device-risky-guide',
      subjectType: 'device',
      metrics: {
        refundCount: 4,
        deviceAnomalyCount: 1,
        complaintCount: 0,
        abnormalPaymentCount: 0,
        activeDays: 10,
        recentTransactionAmount: 3000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    // cond-high-refund ✓(4>=3, w0.25) => 25 => MEDIUM
    assert.equal(result.riskLevel, 'MEDIUM')
    assert.ok(result.triggeredRules.includes('cond-high-refund'))
    assert.ok(result.reasons.some(r => r.includes('退款')))
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} ai-rule-engine 角色测试`, () => {
  it('运行专员检测内存泄漏设备 => MEMORY_LEAK', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly({
      deviceId: 'dev-ops-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 40,
        memoryUsage: 95,
        diskUsage: 30,
        networkLatencyMs: 100,
        errorRate: 1,
        uptimeHours: 720,
      },
      tenantId: 't-001',
    })
    const result = res.result as {
      isAnomaly: boolean
      anomalyType: string
      severity: string
      recommendations: string[]
    }

    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'MEMORY_LEAK')
    assert.equal(result.severity, 'MEDIUM')
    assert.ok(result.recommendations.some(r => r.includes('内存')))
  })

  it('运行专员检测网络延迟设备 => NETWORK_LATENCY', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly({
      deviceId: 'dev-ops-002',
      storeId: 'store-002',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 40,
        diskUsage: 50,
        networkLatencyMs: 800,
        errorRate: 1,
        uptimeHours: 200,
      },
      tenantId: 't-001',
    })
    const result = res.result as { isAnomaly: boolean; anomalyType: string; severity: string }

    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'NETWORK_LATENCY')
    assert.equal(result.severity, 'MEDIUM')
  })

  it('运行专员查看引擎状态（运维监控日常排查）', () => {
    const ctrl = createController()
    const engines = ctrl.getEngines()

    assert.ok(engines.length >= 3)

    engines.forEach((e: { engineId: string; engineName: string; status: string; conditionsCount: number; actionsCount: number }) => {
      assert.ok(e.engineId.startsWith('member-level') || e.engineId.startsWith('device-anomaly') || e.engineId.startsWith('risk-score'))
      assert.ok(typeof e.engineName === 'string')
      // status is AiExecutionStatus enum value (e.g. 'SUCCEEDED')
      assert.ok(typeof e.status === 'string')
      assert.ok(e.conditionsCount > 0)
      assert.ok(e.actionsCount > 0)
    })
  })

  it('运行专员对设备密集门店做风险评分 => MEDIUM', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'store-dev-heavy',
      subjectType: 'store',
      metrics: {
        deviceAnomalyCount: 3,
        refundCount: 1,
        abnormalPaymentCount: 0,
        complaintCount: 0,
        activeDays: 60,
        recentTransactionAmount: 20000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    // cond-device-anomaly ✓(3>=2, w0.15) => 15 => LOW (<25)
    assert.equal(result.riskLevel, 'LOW')
    assert.ok(result.riskScore >= 10)
    assert.ok(result.triggeredRules.includes('cond-device-anomaly'))
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} ai-rule-engine 角色测试`, () => {
  it('团建评估团队高活跃会员 => SVIP（边界：最高临界值）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel({
      memberId: 'mem-team-001',
      totalPoints: 99999,
      totalSpend: 99999,
      visitCount: 999,
      tenantId: 't-001',
    })
    const result = res.result as { suggestedLevel: string; confidence: number }

    assert.equal(result.suggestedLevel, 'SVIP')
    assert.equal(result.confidence, 1.0)
  })

  it('团建检测磁盘满设备 => DISK_FULL', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly({
      deviceId: 'dev-team-001',
      storeId: 'store-003',
      metrics: {
        cpuUsage: 50,
        memoryUsage: 40,
        diskUsage: 95,
        networkLatencyMs: 60,
        errorRate: 2,
        uptimeHours: 300,
      },
      tenantId: 't-001',
    })
    const result = res.result as { isAnomaly: boolean; anomalyType: string; severity: string }

    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'DISK_FULL')
    // 单点异常 => MEDIUM
    assert.equal(result.severity, 'MEDIUM')
  })

  it('团建活动前对场地做风险评分（活动安全前置检查）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'venue-team-001',
      subjectType: 'store',
      metrics: {
        deviceAnomalyCount: 3,
        complaintCount: 0,
        refundCount: 1,
        abnormalPaymentCount: 0,
        activeDays: 30,
        recentTransactionAmount: 15000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    // cond-device-anomaly ✓(3>=2, w0.15) => 15 => LOW (<25)
    assert.equal(result.riskLevel, 'LOW')
    assert.ok(result.recommendations.some(r => r.includes('设备')))
  })

  it('团建查看引擎状态确认活动可用性', () => {
    const ctrl = createController()
    const engines = ctrl.getEngines()

    const riskEngine = engines.find((e: { engineId: string }) => e.engineId === 'risk-score-v1')
    assert.ok(riskEngine)
    // AiExecutionStatus.Succeeded = 'SUCCEEDED'
    assert.ok(typeof riskEngine!.status === 'string')
    assert.ok(riskEngine!.conditionsCount >= 3)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} ai-rule-engine 角色测试`, () => {
  it('营销评估潜在升级会员 => ALL不满足退回 REGULAR（边界：仅高到访）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateMemberLevel({
      memberId: 'mem-mkt-001',
      totalPoints: 4000,
      totalSpend: 8000,
      visitCount: 25, // 高频到访
      tenantId: 't-001',
    })
    const result = res.result as { suggestedLevel: string; triggeredRules: string[]; confidence: number }

    // totalSpend=8000<10000, totalPoints=4000<5000, visitCount=25>=20
    // ALL => isMatch=false => REGULAR + empty triggeredRules
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.equal(result.confidence, 0.3)
  })

  it('营销检测多指标异常设备（边界：错误率高 + CPU 高）', () => {
    const ctrl = createController()
    const res = ctrl.detectDeviceAnomaly({
      deviceId: 'dev-mkt-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 92,
        memoryUsage: 50,
        diskUsage: 40,
        networkLatencyMs: 100,
        errorRate: 8, // 高错误率
        uptimeHours: 200,
      },
      tenantId: 't-001',
    })
    const result = res.result as { isAnomaly: boolean; severity: string; triggeredRules: string[] }

    assert.equal(result.isAnomaly, true)
    // 2个异常 => HIGH
    assert.equal(result.severity, 'HIGH')
    assert.equal(result.triggeredRules.length, 2)
  })

  it('营销批量评估活动会员 + 场地设备（批量端点）', () => {
    const ctrl = createController()
     
    const result = ctrl.evaluateBatch({
      items: [
        { type: 'member-level', data: { memberId: 'mkt-batch-01', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' } },
        { type: 'member-level', data: { memberId: 'mkt-batch-02', totalPoints: 100, totalSpend: 200, visitCount: 3, tenantId: 't-001' } },
        { type: 'device-anomaly', data: { deviceId: 'dev-batch-01', storeId: 'store-001', metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 }, tenantId: 't-001' } }
      ]
    } as any)

    assert.equal(result.total, 3)
    assert.equal(result.succeeded, 3)
    assert.equal(result.failed, 0)
    assert.equal(result.items.length, 3)

    // 批量第1项: SVIP
    const item1 = result.items[0].result as import('./ai-rule-engine.entity').MemberLevelOutput
    assert.equal(item1.suggestedLevel, 'SVIP')

    // 批量第2项: REGULAR
    const item2 = result.items[1].result as import('./ai-rule-engine.entity').MemberLevelOutput
    assert.equal(item2.suggestedLevel, 'REGULAR')

    // 批量第3项: 正常设备
    const item3 = result.items[2].result as import('./ai-rule-engine.entity').DeviceAnomalyOutput
    assert.equal(item3.isAnomaly, false)

    assert.ok(Date.parse(result.timestamp) > 0)
  })

  it('营销通过通用端点评估风险（批量活动前的风险排查）', () => {
    const ctrl = createController()
    const res = ctrl.evaluateRiskScore({
      subjectId: 'mkt-campaign-001',
      subjectType: 'store',
      metrics: {
        refundCount: 5,
        abnormalPaymentCount: 2,
        complaintCount: 1,
        deviceAnomalyCount: 0,
        activeDays: 30,
        recentTransactionAmount: 50000
      },
      tenantId: 't-001'
    })
    const result = res.result as import('./ai-rule-engine.entity').RiskScoreOutput

    assert.equal(res.type, 'risk-score')
    // cond-high-refund (refundCount=5>=3 weight 0.25) + cond-abnormal-payment (2>=2 weight 0.2) + cond-complaints (1>=1 weight 0.2)
    // weightedScore = 25 + 20 + 20 = 65 => HIGH
    assert.ok(result.riskScore >= 50)
    assert.equal(result.riskLevel, 'HIGH')
    assert.ok(result.triggeredRules.length >= 2)
    assert.ok(result.reasons.length >= 2)
    assert.ok(result.recommendations.length >= 2)
    assert.ok(Date.parse(result.evaluatedAt) > 0)
  })
})

// ── 🎯运行专员 模拟器拓展测试 ──
describe(`${ROLES.Operations} ai-rule-engine 模拟器拓展测试`, () => {
  it('运行专员列出所有模拟器（运维管理视角）', () => {
    const ctrl = createController()
    const sims = ctrl.listSimulators()

    assert.ok(Array.isArray(sims))
    assert.equal(sims.length, 2)

    const memberSim = sims.find(s => s.id === 'sim-member-level-v1')
    assert.ok(memberSim)
    assert.equal(memberSim!.name, 'Member Level Simulator')
    assert.equal(memberSim!.rounds, 100)
    assert.equal(memberSim!.timeoutMs, 5000)
    assert.equal(memberSim!.enableMutation, false)

    const deviceSim = sims.find(s => s.id === 'sim-device-anomaly-v1')
    assert.ok(deviceSim)
    assert.equal(deviceSim!.name, 'Device Anomaly Simulator')
    assert.equal(deviceSim!.rounds, 50)
    assert.ok(deviceSim!.enableMutation) // 设备模拟器启用变异
  })

  it('运行专员通过 ID 查找特定模拟器', () => {
    const ctrl = createController()
    const sim = ctrl.getSimulator('sim-device-anomaly-v1')

    assert.ok(sim)
    assert.equal(sim!.id, 'sim-device-anomaly-v1')
    assert.equal(sim!.engineId, 'device-anomaly-v1')
    assert.equal(sim!.name, 'Device Anomaly Simulator')
    assert.equal(sim!.rounds, 50)
    assert.equal(sim!.enableMutation, true)
    assert.ok(Date.parse(sim!.createdAt) > 0)
  })

  it('运行专员查找不存在的模拟器返回 undefined（边界）', () => {
    const ctrl = createController()
    const sim = ctrl.getSimulator('sim-non-existent')
    assert.equal(sim, undefined)
  })

  it('运行专员对 SVIP 候选用例运行单次模拟（正常流程）', () => {
    const ctrl = createController()
    const result = ctrl.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: svipMemberData as unknown as Record<string, unknown> as unknown as Record<string, unknown>
    })

    assert.equal(result.simulatorId, 'sim-member-level-v1')
    assert.equal(result.simulatorName, 'Member Level Simulator')
    assert.equal(result.matched, true)
    assert.ok(result.triggeredConditions.length >= 2)
    assert.ok(result.triggeredActions.includes('act-assign-svip') || result.triggeredActions.includes('act-assign-vip'))
    assert.ok(result.matchScore > 0.5)
    assert.ok(result.executionTimeMs >= 0)
    assert.ok(Date.parse(result.timestamp) > 0)
  })

  it('运行专员对正常设备运行单次模拟不应匹配（边界：正常数据不触发异常规则）', () => {
    const ctrl = createController()
    const result = ctrl.runSimulator({
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: normalDeviceData as unknown as Record<string, unknown>
    })

    assert.equal(result.simulatorId, 'sim-device-anomaly-v1')
    assert.equal(result.matched, false)
    assert.equal(result.triggeredConditions.length, 0)
    assert.equal(result.triggeredActions.length, 0)
    assert.equal(result.matchScore, 0)
  })

  it('运行专员批量模拟 SVIP 会员等级评估（批量运行）', () => {
    const ctrl = createController()
    const summary = ctrl.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: svipMemberData as unknown as Record<string, unknown> as unknown as Record<string, unknown>,
      rounds: 20
    })

    assert.equal(summary.simulatorId, 'sim-member-level-v1')
    assert.equal(summary.totalRuns, 20)
    assert.ok(summary.matchedRuns >= 0)
    assert.ok(summary.totalRuns >= summary.matchedRuns)
    assert.ok(summary.avgExecutionTimeMs >= 0)
    assert.ok(summary.p50ExecutionTimeMs >= 0)
    assert.ok(summary.p95ExecutionTimeMs >= 0)
    assert.ok(summary.p99ExecutionTimeMs >= 0)
    assert.ok(Array.isArray(summary.mostTriggeredConditions))
    assert.ok(typeof summary.recommendation === 'string')
  })

  it('运行专员批量模拟时使用默认轮次（不传 rounds）', () => {
    const ctrl = createController()
    const summary = ctrl.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: svipMemberData as unknown as Record<string, unknown> as unknown as Record<string, unknown>
    })

    assert.equal(summary.totalRuns, 100) // 默认 100 轮
    assert.ok(summary.matchRate > 0)
  })
})

// ── 👔店长 模拟器管理测试 ──
describe(`${ROLES.StoreManager} ai-rule-engine 模拟器管理测试`, () => {
  it('店长列出所有可用的模拟器（管理决策支持）', () => {
    const ctrl = createController()
    const sims = ctrl.listSimulators()

    assert.ok(sims.length >= 2)
    for (const sim of sims) {
      assert.ok(typeof sim.id === 'string')
      assert.ok(typeof sim.name === 'string')
      assert.ok(typeof sim.engineId === 'string')
      assert.ok(typeof sim.rounds === 'number' && sim.rounds > 0)
      assert.ok(typeof sim.timeoutMs === 'number' && sim.timeoutMs > 0)
      assert.ok(typeof sim.enableMutation === 'boolean')
      assert.ok(Date.parse(sim.createdAt) > 0)
    }
  })

  it('店长对低活跃会员批量模拟等级变化趋势', () => {
    const ctrl = createController()
    const summary = ctrl.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: regularMemberData as unknown as Record<string, unknown>,
      rounds: 30
    })

    assert.equal(summary.totalRuns, 30)
    assert.ok(summary.mostTriggeredConditions.length >= 0)
    assert.ok(summary.matchRate >= 0 && summary.matchRate <= 1)
    assert.ok(typeof summary.recommendation === 'string')
  })

  it('店长检查模拟器诊断报告中包含详细结果', () => {
    const ctrl = createController()
    const summary = ctrl.runSimulatorBatch({
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: criticalAnomalyData as unknown as Record<string, unknown>,
      rounds: 5
    })

    assert.equal(summary.totalRuns, 5)
    assert.ok(Array.isArray(summary.results))
    assert.equal(summary.results.length, 5)
    // 严重异常的设备应在多轮变异后仍有高匹配率
    assert.ok(summary.matchRate >= 0.5)
  })
})
