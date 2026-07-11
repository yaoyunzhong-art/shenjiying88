import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [C] 角色测试 v6 — 引擎配置管理、条件覆盖与跨角色协作场景
 *
 * 8 角色视角:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖场景:
 *  - 各角色视角下引擎配置管理 (enable/disable, matchStrategy切换)
 *  - 条件覆盖与阈值动态调整 (conditionOverrides)
 *  - 跨引擎协作评估 (member-level + device + risk 联动)
 *  - 引擎详情查询与不存在引擎的 404
 *  - 重置引擎到默认状态
 *  - 模拟器零数据输入、超大轮次
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 边界/配置场景)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'
import type {
  MemberLevelInput,
  DeviceAnomalyInput,
  RiskScoreInput,
  MemberLevelOutput,
  DeviceAnomalyOutput,
  RiskScoreOutput,
  EngineDetail,
} from './ai-rule-engine.entity'
import { AiExecutionStatus } from '@m5/domain'

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

function makeController() {
  const service = new AiRuleEngineService()
  const controller = new AiRuleEngineController(service)
  return { service, controller }
}

const svipData: MemberLevelInput = {
  memberId: 'mem-v6-svip',
  totalPoints: 8000,
  totalSpend: 25000,
  visitCount: 45,
  tenantId: 't-v6-001',
}

const regularData: MemberLevelInput = {
  memberId: 'mem-v6-regular',
  totalPoints: 100,
  totalSpend: 300,
  visitCount: 2,
  tenantId: 't-v6-001',
}

const criticalDevice: DeviceAnomalyInput = {
  deviceId: 'dev-v6-crit',
  storeId: 'store-v6',
  metrics: { cpuUsage: 96, memoryUsage: 92, diskUsage: 91, networkLatencyMs: 600, errorRate: 6, uptimeHours: 800 },
  tenantId: 't-v6-001',
}

const healthyDevice: DeviceAnomalyInput = {
  deviceId: 'dev-v6-healthy',
  storeId: 'store-v6',
  metrics: { cpuUsage: 25, memoryUsage: 35, diskUsage: 45, networkLatencyMs: 40, errorRate: 0.3, uptimeHours: 100 },
  tenantId: 't-v6-001',
}

// ═══════════════════════════════════════════════════════════════════
// 👔店长 — 引擎配置管理与决策支持
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 引擎配置管理`, () => {
  it('店长查看引擎群组详情 — 获取完整规则条件与动作', () => {
    const { controller } = makeController()
    const detail = controller.getEngineDetail('member-level-v1')
    assert.equal(detail.engineId, 'member-level-v1')
    assert.ok(detail.conditions.length >= 3)
    assert.ok(detail.actions.length >= 3)
    assert.ok(detail.conditions.every(c => c.field && c.operator && typeof c.weight === 'number'))
  })

  it('店长切换引擎匹配策略 — ALL→ANY 后判定规则改变', () => {
    const { service, controller } = makeController()

    // ALL 策略下 3 个条件必须全匹配 ⇒ 用 SVIP 级别数据确保匹配
    const svipRes = controller.evaluateMemberLevel(svipData)
    assert.equal((svipRes.result as MemberLevelOutput).suggestedLevel, 'SVIP')

    // 现在的策略是 ALL: 用只满足 2 个条件的数据 → REGULAR
    const borderlineData: MemberLevelInput = {
      memberId: 'mem-alloc',
      totalPoints: 6000,
      totalSpend: 12000,   // >= 10000 ✓
      visitCount: 18,       // < 20 ✗
      tenantId: 't-v6',
    }
    const resBefore = controller.evaluateMemberLevel(borderlineData)
    const levelBefore = (resBefore.result as MemberLevelOutput).suggestedLevel
    // ALL: spend✓ + points✓ + visits✗ = 2/3 → 不匹配 → REGULAR
    assert.equal(levelBefore, 'REGULAR')

    // 切换为 ANY 策略
    controller.updateEngineConfig('member-level-v1', { matchStrategy: 'ANY' } as any)

    // ANY 策略下 2 个条件满足即可匹配 → 应升级
    const resAfter = controller.evaluateMemberLevel(borderlineData)
    const levelAfter = (resAfter.result as MemberLevelOutput).suggestedLevel
    // spend✓ + points✓ + visits✗ = 2/3 → ANY 匹配 → matchScore 0.4+0.3=0.7 ≥ 0.5 → VIP
    assert.equal(levelAfter, 'VIP',
      '切换 matchStrategy=ANY 后部分条件应晋升至 VIP'
    )

    // 恢复为 ALL
    controller.updateEngineConfig('member-level-v1', { matchStrategy: 'ALL' } as any)
  })

  it('店长禁用 device 引擎后再评估 — 查看引擎状态变更为 Failed', () => {
    const { controller } = makeController()
    const before = controller.getEngineDetail('device-anomaly-v1')
    assert.equal(before.enabled, true)

    controller.updateEngineConfig('device-anomaly-v1', { enabled: false } as any)
    const after = controller.getEngineDetail('device-anomaly-v1')
    assert.equal(after.enabled, false)
    assert.equal(after.status, AiExecutionStatus.Failed)

    // 恢复
    controller.updateEngineConfig('device-anomaly-v1', { enabled: true } as any)
  })

  it('店长查询不存在引擎 — 应抛出 404 错误', () => {
    const { controller } = makeController()
    assert.throws(
      () => controller.getEngineDetail('non-existent-engine'),
      /Engine non-existent-engine not found/
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒前台 — 条件覆盖与阈值调整场景
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 条件覆盖与阈值调整`, () => {
  it('前台通过条件覆盖降低 SVIP 门槛 — 原 regular 客户变为 VIP 候选', () => {
    const { controller } = makeController()
    // 先将 cond-high-points 阈值从 5000 降到 2000
    controller.updateEngineConfig('member-level-v1', {
      conditionOverrides: [
        { conditionId: 'cond-high-points', value: 2000 }
      ]
    } as any)

    const data: MemberLevelInput = {
      memberId: 'mem-override',
      totalPoints: 3000,
      totalSpend: 12000,
      visitCount: 25,
      tenantId: 't-v6',
    }
    // ALL 策略下: spend(12000>=10000✓) + points(3000>=2000✓) + visits(25>=20✓) => 全匹配 => SVIP
    const res = controller.evaluateMemberLevel(data)
    const result = res.result as MemberLevelOutput
    assert.equal(result.suggestedLevel, 'SVIP', '覆盖阈值后 points 3000 应满足新的 2000 条件')
    assert.equal(result.triggeredRules.length, 3)

    // 恢复
    controller.updateEngineConfig('member-level-v1', {
      conditionOverrides: [{ conditionId: 'cond-high-points', value: 5000 }]
    } as any)
  })

  it('前台评估零访问客户（visitCount=0）— 应稳定返回 REGULAR', () => {
    const { controller } = makeController()
    const res = controller.evaluateMemberLevel({
      memberId: 'mem-no-visit',
      totalPoints: 0,
      totalSpend: 0,
      visitCount: 0,
      tenantId: 't-v6',
    })
    const result = res.result as MemberLevelOutput
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.confidence, 0.3)
  })

  it('前台检查引擎重置后恢复默认配置', () => {
    const { controller, service } = makeController()
    // 修改配置
    controller.updateEngineConfig('member-level-v1', { matchStrategy: 'ANY' } as any)

    // 重置
    const detail = controller.resetEngine('member-level-v1')
    assert.equal(detail.engineId, 'member-level-v1')
    assert.equal(detail.status, AiExecutionStatus.Succeeded)

    const svipRes = controller.evaluateMemberLevel(svipData)
    assert.equal((svipRes.result as MemberLevelOutput).suggestedLevel, 'SVIP')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥HR — 批量成员等级评估 + 跨引擎关联分析
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 批量成员评估与交叉分析`, () => {
  it('HR 评估多员工会员等级变动趋势', () => {
    const { controller } = makeController()
    const employees = [
      { memberId: 'hr-emp-01', totalPoints: 10000, totalSpend: 30000, visitCount: 60, tenantId: 't-v6' },
      { memberId: 'hr-emp-02', totalPoints: 4000, totalSpend: 9000, visitCount: 15, tenantId: 't-v6' },
      { memberId: 'hr-emp-03', totalPoints: 500, totalSpend: 1000, visitCount: 8, tenantId: 't-v6' },
    ]
    const res = controller.evaluateBatch({
      items: employees.map(e => ({ type: 'member-level' as const, data: e as any }))
    } as any)

    assert.equal(res.succeeded, 3)
    assert.equal(res.total, 3)
    const levels = res.items.map(i => (i.result as MemberLevelOutput).suggestedLevel)
    assert.equal(levels[0], 'SVIP')
    assert.equal(levels[1], 'REGULAR') // ALL 策略下 spend 9000<10000 => 不 match
    assert.equal(levels[2], 'REGULAR')
  })

  it('HR 跨引擎评估：新员工关联设备 + 风险评分矩阵', () => {
    const { controller } = makeController()
    // 先看设备异常
    const deviceRes = controller.evaluate({
      type: 'device-anomaly',
      data: { deviceId: 'hr-dev-01', storeId: 'store-v6', metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 }, tenantId: 't-v6' },
    })
    assert.equal((deviceRes.result as DeviceAnomalyOutput).isAnomaly, false)

    // 看风险评分
    const riskRes = controller.evaluateRiskScore({
      subjectId: 'hr-new-emp-01',
      subjectType: 'member',
      metrics: { refundCount: 0, abnormalPaymentCount: 0, complaintCount: 0 },
      tenantId: 't-v6',
    })
    assert.equal(riskRes.result.riskLevel, 'LOW')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧安监 — 设备异常深度检测与规则交叉验证
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 设备异常深度检测`, () => {
  it('安监查看设备异常引擎规则详情 — 确认条件覆盖完整', () => {
    const { controller } = makeController()
    const detail = controller.getEngineDetail('device-anomaly-v1')
    assert.equal(detail.engineId, 'device-anomaly-v1')
    assert.equal(detail.matchStrategy, 'ANY')
    assert.ok(detail.provider)
    assert.equal(detail.conditionsCount, 5)
  })

  it('安监修改 CPU 阈值从 90 到 70 — 使中等 CPU 设备触发异常', () => {
    const { controller } = makeController()
    controller.updateEngineConfig('device-anomaly-v1', {
      conditionOverrides: [{ conditionId: 'cond-cpu-high', value: 70 }]
    } as any)

    const moderateDevice: DeviceAnomalyInput = {
      deviceId: 'dev-moderate',
      storeId: 'store-v6',
      metrics: { cpuUsage: 75, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 300 },
      tenantId: 't-v6',
    }
    const res = controller.detectDeviceAnomaly(moderateDevice)
    const result = res.result as DeviceAnomalyOutput
    assert.equal(result.isAnomaly, true, 'CPU 75 >= 70(覆盖后) 应触发 anomaly')
    assert.equal(result.anomalyType, 'CPU_SPIKE')

    // 恢复
    controller.updateEngineConfig('device-anomaly-v1', {
      conditionOverrides: [{ conditionId: 'cond-cpu-high', value: 90 }]
    } as any)
  })

  it('安监查看引擎列表 — 确认设备异常引擎存在且信息完整', () => {
    const { controller } = makeController()
    const engines = controller.getEngines()
    const deviceEngine = engines.find(e => e.engineId === 'device-anomaly-v1')
    assert.ok(deviceEngine)
    assert.equal(deviceEngine.conditionsCount, 5)
    assert.equal(deviceEngine.actionsCount, 2)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮导玩员 — 游乐设备异常检测场景
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 游乐设备异常检测`, () => {
  it('导玩员检测高 CPU 游乐设备 — 触发紧急异常', () => {
    const { controller } = makeController()
    const res = controller.detectDeviceAnomaly({
      deviceId: 'game-machine-arcade-01',
      storeId: 'store-v6',
      metrics: { cpuUsage: 93, memoryUsage: 88, diskUsage: 50, networkLatencyMs: 300, errorRate: 0.8, uptimeHours: 500 },
      tenantId: 't-v6',
    })
    const result = res.result as DeviceAnomalyOutput
    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'CPU_SPIKE')
    assert.ok(result.recommendations.length >= 1)
    assert.ok(result.recommendations[0].includes('检查'))
  })

  it('导玩员检测正常游乐设备 — 返回无异常状态', () => {
    const { controller } = makeController()
    const res = controller.detectDeviceAnomaly({
      deviceId: 'game-machine-arcade-02',
      storeId: 'store-v6',
      metrics: { cpuUsage: 30, memoryUsage: 40, diskUsage: 35, networkLatencyMs: 20, errorRate: 0.1, uptimeHours: 50 },
      tenantId: 't-v6',
    })
    assert.equal((res.result as DeviceAnomalyOutput).isAnomaly, false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯运行专员 — 模拟器深度运行与引擎容错
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 模拟器深度运行`, () => {
  it('运行专员执行单次模拟 — 验证 verbose 日志输出', () => {
    const { service, controller } = makeController()

    const result = controller.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: { memberId: 'sim-test', totalPoints: 8000, totalSpend: 20000, visitCount: 40, tenantId: 't-v6' },
      verbose: true,
    } as any)

    assert.equal(result.simulatorId, 'sim-member-level-v1')
    assert.equal(result.matched, true)
    assert.ok(result.logs && result.logs.length >= 3, 'verbose 模式应输出日志')
    assert.ok(result.matchScore >= 0.8)
  })

  it('运行专员执行批量模拟 — 验证大轮次下的匹配率报告', () => {
    const { controller } = makeController()

    const result = controller.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: { memberId: 'sim-batch', totalPoints: 8000, totalSpend: 20000, visitCount: 40, tenantId: 't-v6' },
      rounds: 10,
    } as any)

    assert.ok(result.totalRuns >= 10)
    assert.ok(result.matchedRuns > 0)
    assert.ok(result.matchRate > 0)
    assert.ok(result.avgExecutionTimeMs >= 0)
    assert.ok(result.mostTriggeredConditions.length >= 1)
    assert.ok(typeof result.recommendation === 'string')
  })

  it('运行专员查询所有模拟器列表', () => {
    const { controller } = makeController()
    const simulators = controller.listSimulators()
    assert.ok(simulators.length >= 2)
    assert.ok(simulators.some(s => s.id === 'sim-member-level-v1'))
    assert.ok(simulators.some(s => s.id === 'sim-device-anomaly-v1'))
  })

  it('运行专员查询不存在的模拟器 — 应返回 undefined', () => {
    const { controller, service } = makeController()
    const sim = service.getSimulator('non-existent-sim')
    assert.equal(sim, undefined)
  })

  it('运行专员禁用引擎并重置 — 验证引擎正常恢复', () => {
    const { controller } = makeController()
    // 先禁用
    controller.updateEngineConfig('risk-score-v1', { enabled: false } as any)
    let detail = controller.getEngineDetail('risk-score-v1')
    assert.equal(detail.enabled, false)

    // 重置
    controller.resetEngine('risk-score-v1')
    detail = controller.getEngineDetail('risk-score-v1')
    assert.equal(detail.status, AiExecutionStatus.Succeeded)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝团建 — 场景协作评估
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 场景协作评估`, () => {
  it('团建评估活动小组会员等级分布', () => {
    const { controller } = makeController()
    const members = [
      { memberId: 'team-01', totalPoints: 9000, totalSpend: 18000, visitCount: 40, tenantId: 't-v6' },
      { memberId: 'team-02', totalPoints: 2000, totalSpend: 6000, visitCount: 12, tenantId: 't-v6' },
    ]
    const res = controller.evaluateBatch({
      items: members.map(m => ({ type: 'member-level', data: m as any }))
    } as any)
    assert.equal(res.succeeded, 2)
    assert.equal(res.failed, 0)
    const levels = res.items.map(i => (i.result as MemberLevelOutput).suggestedLevel)
    assert.equal(levels[0], 'SVIP')
    assert.equal(levels[1], 'REGULAR')
  })

  it('团建查看活动场地的设备健康状况', () => {
    const { controller } = makeController()
    const devices = [
      {
        type: 'device-anomaly' as const,
        data: { deviceId: 'venue-dev-01', storeId: 'team-store', metrics: { cpuUsage: 95, memoryUsage: 90, diskUsage: 50, networkLatencyMs: 100, errorRate: 2, uptimeHours: 300 }, tenantId: 't-v6' },
      },
      {
        type: 'device-anomaly' as const,
        data: { deviceId: 'venue-dev-02', storeId: 'team-store', metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 }, tenantId: 't-v6' },
      },
    ]
    const res = controller.evaluateBatch({
      items: devices as any
    } as any)
    assert.equal(res.succeeded, 2)
    assert.equal((res.items[0].result as DeviceAnomalyOutput).isAnomaly, true)
    assert.equal((res.items[1].result as DeviceAnomalyOutput).isAnomaly, false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢营销 — 风险评分与营销场景联动
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 风险评分与营销联动`, () => {
  it('营销评估活动方案的风险等级 — 退款激增应标记 CRITICAL', () => {
    const { controller } = makeController()
    const res = controller.evaluateRiskScore({
      subjectId: 'promo-campaign-01',
      subjectType: 'store',
      metrics: { refundCount: 15, abnormalPaymentCount: 6, complaintCount: 5, voidRefundAmount: 3000, activeDays: 7, recentTransactionAmount: 50000 },
      tenantId: 't-v6',
    })
    assert.equal(res.type, 'risk-score')
    assert.equal(res.result.riskLevel, 'CRITICAL')
    assert.ok(res.result.riskScore >= 80)
    assert.ok(res.result.reasons.length >= 3)
    assert.ok(res.result.recommendations.length >= 3)
    assert.ok(Date.parse(res.result.evaluatedAt) > 0)
  })

  it('营销评估零风险活动 — 应返回 LOW 风险等级', () => {
    const { controller } = makeController()
    const res = controller.evaluateRiskScore({
      subjectId: 'safe-promo',
      subjectType: 'store',
      metrics: { refundCount: 0, abnormalPaymentCount: 0, complaintCount: 0, voidRefundAmount: 0 },
      tenantId: 't-v6',
    })
    assert.equal(res.result.riskLevel, 'LOW')
    assert.equal(res.result.riskScore, 0)
  })

  it('营销通过通用 evaluate 端点传入非支持类型 — 应抛出异常', () => {
    const { controller } = makeController()
    assert.throws(
      () => controller.evaluate({ type: 'marketing-analytics' as any, data: {} }),
      /Unsupported evaluation type/
    )
  })

  it('营销查看风险评分引擎配置 — 确认风控规则存在', () => {
    const { controller } = makeController()
    const detail = controller.getEngineDetail('risk-score-v1')
    assert.equal(detail.conditionsCount, 5)
    assert.equal(detail.actionsCount, 3)
    assert.equal(detail.matchStrategy, 'ANY')
    assert.ok(detail.conditions.some(c => c.field === 'refundCount'))
    assert.ok(detail.conditions.some(c => c.field === 'complaintCount'))
  })
})
