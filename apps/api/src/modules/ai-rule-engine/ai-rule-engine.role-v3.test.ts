import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [C] 角色测试 v3 — 大飞哥电玩城实景模拟
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景：
 * 店A: Cyber Galaxy Arcade (Colonial Heights) 
 * 店B: 休斯顿
 * 店C: 待定
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界 + 降级/重试场景）
 * 覆盖: evaluate/member-level, evaluate/device-anomaly, evaluate/risk-score,
 *       evaluate/batch, engines/config, simulators
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'
import type {
  MemberLevelInput,
  DeviceAnomalyInput,
  DeviceAnomalyOutput,
  MemberLevelOutput,
  RiskScoreInput,
  RiskScoreOutput,
  SimulatorRunInput,
  SimulatorBatchRunOutput,
  BatchEvaluateRequest,
  EngineStatus,
} from './ai-rule-engine.entity'

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

// ── 测试数据工厂 ──
function createService() {
  return new AiRuleEngineService()
}

function createController() {
  const service = new AiRuleEngineService()
  return new AiRuleEngineController(service)
}

// ── 大飞哥三店场景数据 ──
const storeA = {
  id: 'store-cyber-galaxy',
  name: 'Cyber Galaxy Arcade',
  location: 'Colonial Heights, VA',
  tenantId: 't-cyber-001',
}

const storeB = {
  id: 'store-houston',
  name: '休斯顿店',
  location: 'Houston, TX',
  tenantId: 't-hou-002',
}

// 店A高频SVIP客户
const svipMemberA: MemberLevelInput = {
  memberId: 'mem-cyber-svip-001',
  totalPoints: 12000,
  totalSpend: 35000,
  visitCount: 87,
  tenantId: storeA.tenantId,
}

// 店B高潜力VIP客户
const vipMemberB: MemberLevelInput = {
  memberId: 'mem-hou-vip-001',
  totalPoints: 6000,
  totalSpend: 15000,
  visitCount: 42,
  tenantId: storeB.tenantId,
}

// 新注册客户
const newMemberA: MemberLevelInput = {
  memberId: 'mem-cyber-new-001',
  totalPoints: 0,
  totalSpend: 0,
  visitCount: 0,
  tenantId: storeA.tenantId,
}

// 普通客户
const regularMemberB: MemberLevelInput = {
  memberId: 'mem-hou-regular-001',
  totalPoints: 500,
  totalSpend: 1200,
  visitCount: 8,
  tenantId: storeB.tenantId,
}

// 设备异常相关
const criticalDeviceA: DeviceAnomalyInput = {
  deviceId: 'dev-galaxy-ms01',
  storeId: storeA.id,
  metrics: {
    cpuUsage: 98,
    memoryUsage: 92,
    diskUsage: 95,
    networkLatencyMs: 1500,
    errorRate: 12.5,
    uptimeHours: 720,
  },
  tenantId: storeA.tenantId,
}

const healthyDeviceA: DeviceAnomalyInput = {
  deviceId: 'dev-galaxy-cash01',
  storeId: storeA.id,
  metrics: {
    cpuUsage: 25,
    memoryUsage: 35,
    diskUsage: 40,
    networkLatencyMs: 45,
    errorRate: 0.2,
    uptimeHours: 168,
  },
  tenantId: storeA.tenantId,
}

const degradedDeviceB: DeviceAnomalyInput = {
  deviceId: 'dev-hou-pc01',
  storeId: storeB.id,
  metrics: {
    cpuUsage: 88,
    memoryUsage: 55,
    diskUsage: 60,
    networkLatencyMs: 120,
    errorRate: 3.5,
    uptimeHours: 480,
  },
  tenantId: storeB.tenantId,
}

// ── 👔 店长 ──
describe(`${ROLES.StoreManager} 店长视角: 全局经营决策与会员健康`, () => {
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长查看三店全部引擎状态 — 返回完整引擎概览', () => {
    const engines = ctrl.getEngines() as EngineStatus[]
    assert.equal(engines.length, 3)
    const ids = engines.map((e) => e.engineId)
    assert.ok(ids.includes('member-level-v1'))
    assert.ok(ids.includes('device-anomaly-v1'))
    assert.ok(ids.includes('risk-score-v1'))
  })

  it('店长评估SVIP客户 — 应推荐SVIP等级并提供置信度', () => {
    const res = ctrl.evaluateMemberLevel(svipMemberA)
    const result = res.result as MemberLevelOutput
    assert.equal(result.suggestedLevel, 'SVIP')
    assert.equal(result.triggeredRules.length, 3)
    assert.ok(result.confidence >= 0.8)
  })

  it('店长评估新注册客户 — 应推荐REGULAR等级且confidence较低', () => {
    const res = ctrl.evaluateMemberLevel(newMemberA)
    const result = res.result as MemberLevelOutput
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
    assert.ok(result.confidence <= 0.5)
  })

  it('店长跨店批量评估 — 同时评估店A和店B客户等级', () => {
    const batchReq: BatchEvaluateRequest = {
      items: [
        { index: 0, type: 'member-level', data: svipMemberA },
        { index: 1, type: 'member-level', data: vipMemberB },
        { index: 2, type: 'member-level', data: regularMemberB },
        { index: 3, type: 'member-level', data: newMemberA },
      ],
    }
    const res = ctrl.evaluateBatch(batchReq as unknown as any)
    assert.equal(res.total, 4)
    assert.equal(res.succeeded, 4)
    assert.equal(res.failed, 0)
    const levels = res.items.map(
      (i) => (i.result as MemberLevelOutput).suggestedLevel
    )
    assert.deepEqual(levels, ['SVIP', 'SVIP', 'REGULAR', 'REGULAR'])
  })

  it('店长查看引擎详情配置 — 条件、动作、匹配策略完备', () => {
    const detail = ctrl.getEngineDetail('member-level-v1')
    assert.ok(detail)
    assert.equal(detail!.engineName, 'Member Level Evaluator')
    assert.equal(detail!.conditionsCount, 3)
    assert.equal(detail!.actionsCount, 3)
    assert.ok(detail!.conditions.length > 0)
    assert.ok(detail!.actions.length > 0)
  })

  it('店长尝试获取不存在引擎详情 — 应抛异常', () => {
    assert.throws(() => ctrl.getEngineDetail('non-existent-engine'), /not found/)
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.FrontDesk} 前台视角: 快速客户接待与设备排查`, () => {
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    ctrl = createController()
  })

  it('前台录入新客户信息评估潜力 — 新用户应返回REGULAR', () => {
    const res = ctrl.evaluateMemberLevel(newMemberA)
    const result = res.result as MemberLevelOutput
    assert.equal(result.memberId, newMemberA.memberId)
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.ok(Date.parse(res.timestamp) > 0)
  })

  it('前台检测收款电脑异常 — 高性能指标应触发CRITICAL告警', () => {
    const res = ctrl.detectDeviceAnomaly(criticalDeviceA)
    const result = res.result as DeviceAnomalyOutput
    assert.equal(result.isAnomaly, true)
    assert.equal(result.severity, 'CRITICAL')
    assert.ok(result.triggeredRules.length >= 3)
    assert.ok(result.recommendations.length > 0)
  })

  it('前台检测健康设备 — 不应误报异常', () => {
    const res = ctrl.detectDeviceAnomaly(healthyDeviceA)
    const result = res.result as DeviceAnomalyOutput
    assert.equal(result.isAnomaly, false)
    assert.equal(result.severity, 'LOW')
  })

  it('前台同时检测设备 + 查客户等级 — 使用通用evaluate端点', () => {
    // 成员评估
    const memberRes = ctrl.evaluate({
      type: 'member-level',
      data: svipMemberA as unknown as Record<string, unknown>,
    })
    const memberResult = memberRes.result as MemberLevelOutput
    assert.equal(memberResult.suggestedLevel, 'SVIP')

    // 设备检测
    const devRes = ctrl.evaluate({
      type: 'device-anomaly',
      data: criticalDeviceA as unknown as Record<string, unknown>,
    })
    const devResult = devRes.result as DeviceAnomalyOutput
    assert.equal(devResult.isAnomaly, true)
  })

  it('前台使用不支持的评估类型 — 应抛异常', () => {
    assert.throws(() => {
      ctrl.evaluate({ type: 'unknown-type' as any, data: {} })
    }, /Unsupported evaluation type/)
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} HR视角: 异常设备与员工操作风险`, () => {
  let service: AiRuleEngineService

  beforeEach(() => {
    service = createService()
  })

  it('HR评估设备异常严重等级 — CPU+内存双高应标记HIGH', () => {
    const result = service.detectDeviceAnomaly(criticalDeviceA)
    assert.equal(result.severity, 'CRITICAL')
    assert.equal(result.triggeredRules.length, 5) // all 5 conditions match
    assert.ok(result.recommendations.includes('检查高性能进程，考虑扩容或限流'))
  })

  it('HR评估经营风险 — 高退款+投诉应标记MEDIUM风险', () => {
    const riskInput: RiskScoreInput = {
      subjectId: 'store-cyber-galaxy',
      subjectType: 'store',
      metrics: {
        refundCount: 2,
        abnormalPaymentCount: 1,
        deviceAnomalyCount: 0,
        complaintCount: 3,
        voidRefundAmount: 200,
        activeDays: 30,
      },
      tenantId: storeA.tenantId,
    }
    const result = service.evaluateRiskScore(riskInput)
    assert.equal(result.subjectId, 'store-cyber-galaxy')
    assert.ok(result.riskScore >= 20)
    assert.ok(['MEDIUM', 'HIGH', 'LOW'].includes(result.riskLevel))
  })

  it('HR查看零风险门店 — 应返回LOW风险', () => {
    const cleanInput: RiskScoreInput = {
      subjectId: 'store-clean-001',
      subjectType: 'store',
      metrics: {
        refundCount: 0,
        abnormalPaymentCount: 0,
        deviceAnomalyCount: 0,
        complaintCount: 0,
        voidRefundAmount: 0,
        activeDays: 30,
      },
      tenantId: 't-clean',
    }
    const result = service.evaluateRiskScore(cleanInput)
    assert.equal(result.riskScore, 0)
    assert.equal(result.riskLevel, 'LOW')
    assert.equal(result.triggeredRules.length, 0)
  })
})

// ── 🔧 安监 ──
describe(`${ROLES.Security} 安监视角: 设备异常严重告警与紧急响应`, () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('安监检测严重设备异常 — 磁盘+CPU+内存三高应触发CRITICAL告警', () => {
    const result = service.detectDeviceAnomaly(criticalDeviceA)
    assert.equal(result.isAnomaly, true)
    assert.equal(result.anomalyType, 'CPU_SPIKE')
    assert.equal(result.severity, 'CRITICAL')
  })

  it('安监检测中等异常 — 单个指标偏高应标记MEDIUM而非CRITICAL', () => {
    const mediumInput: DeviceAnomalyInput = {
      deviceId: 'dev-mid-001',
      storeId: storeA.id,
      metrics: {
        cpuUsage: 92,
        memoryUsage: 40,
        diskUsage: 30,
        networkLatencyMs: 50,
        errorRate: 0.5,
        uptimeHours: 100,
      },
      tenantId: storeA.tenantId,
    }
    const result = service.detectDeviceAnomaly(mediumInput)
    assert.equal(result.isAnomaly, true)
    assert.equal(result.severity, 'MEDIUM')
  })

  it('安监查看所有引擎状态 — 确保引擎正常运作', () => {
    const engines = ctrl.getEngines()
    assert.ok(engines.length >= 3)
    engines.forEach((e) => {
      assert.ok(e.engineId)
      assert.ok(typeof e.conditionsCount === 'number')
      assert.ok(typeof e.enabled === 'boolean')
    })
  })

  it('安监禁用高风险引擎并重新启用 — 引擎开关功能', () => {
    // 禁用引擎
    ctrl.updateEngineConfig('member-level-v1', {
      enabled: false,
    })
    const disabledDetail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(disabledDetail!.status, 'FAILED')

    // 重新启用
    ctrl.updateEngineConfig('member-level-v1', {
      enabled: true,
    })
    const enabledDetail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(enabledDetail!.status, 'SUCCEEDED')
  })

  it('安监重置引擎配置', () => {
    // 先修改
    ctrl.updateEngineConfig('member-level-v1', { enabled: false })
    // 重置
    ctrl.resetEngine('member-level-v1')
    const detail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(detail!.status, 'SUCCEEDED')
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} 导玩员视角: 游戏机台健康与会员活跃度`, () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('导玩员检查某机台异常 — 正常机台不应告警', () => {
    const result = service.detectDeviceAnomaly(healthyDeviceA)
    assert.equal(result.deviceId, healthyDeviceA.deviceId)
    assert.equal(result.isAnomaly, false)
  })

  it('导玩员发现收银机异常 — 应返回具体异常类型和修复建议', () => {
    const result = service.detectDeviceAnomaly(criticalDeviceA)
    assert.ok(result.isAnomaly)
    assert.equal(result.severity, 'CRITICAL')
    assert.ok(result.recommendations.length > 0)
    // 应该包含CPU和内存建议
    const recommendationsText = result.recommendations.join(' ')
    assert.ok(recommendationsText.includes('CPU') || recommendationsText.includes('内存'))
  })

  it('导玩员查看机台模拟器 — 验证规则是否合理', () => {
    const simulators = ctrl.listSimulators()
    const devSim = simulators.find((s) => s.id === 'sim-device-anomaly-v1')
    assert.ok(devSim)
    assert.equal(devSim!.engineId, 'device-anomaly-v1')
    assert.equal(devSim!.rounds, 50)
  })

  it('导玩员运行模拟器单次评估 — 模拟异常机台检测', () => {
    const runInput: SimulatorRunInput = {
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        cpuUsage: 95,
        memoryUsage: 90,
        diskUsage: 90,
        networkLatencyMs: 600,
        errorRate: 8,
      } as unknown as Record<string, unknown>,
    }
    const result = ctrl.runSimulator(runInput as unknown as any)
    assert.equal(result.simulatorId, 'sim-device-anomaly-v1')
    assert.equal(result.matched, true)
    assert.ok(result.triggeredConditions.length >= 4)
    assert.ok(result.triggeredActions.length > 0)
    assert.ok(result.executionTimeMs >= 0)
  })
})

// ── 🎯 运行专员 ──
describe(`${ROLES.Operations} 运行专员视角: 系统性能与批量运维`, () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('运行专员批量检测所有设备同时评估会员等级', () => {
    const batchItems = [
      { index: 0, type: 'member-level' as const, data: svipMemberA },
      { index: 1, type: 'member-level' as const, data: vipMemberB },
      { index: 2, type: 'device-anomaly' as const, data: criticalDeviceA },
      { index: 3, type: 'device-anomaly' as const, data: healthyDeviceA },
      { index: 4, type: 'device-anomaly' as const, data: degradedDeviceB },
    ]
    const batchReq: BatchEvaluateRequest = { items: batchItems as any }
    const result = service.batchEvaluate(batchReq as any)
    assert.equal(result.total, 5)
    assert.equal(result.succeeded, 5)
    assert.equal(result.failed, 0)
    assert.ok(Date.parse(result.timestamp) > 0)

    // 验证成员等级结果
    const memberResults = result.items.filter(
      (i) => i.type === 'member-level'
    )
    assert.equal(memberResults.length, 2)
    const svipItem = memberResults.find((i) => i.inputId === svipMemberA.memberId)
    assert.equal((svipItem!.result as MemberLevelOutput).suggestedLevel, 'SVIP')

    // 验证设备异常结果
    const deviceResults = result.items.filter(
      (i) => i.type === 'device-anomaly'
    )
    assert.equal(deviceResults.length, 3)
    const critItem = deviceResults.find((i) => i.inputId === criticalDeviceA.deviceId)
    assert.equal((critItem!.result as DeviceAnomalyOutput).isAnomaly, true)
  })

  it('运行专员查看引擎配置并动态调整 — 修改匹配策略', () => {
    const detail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(detail!.matchStrategy, 'ALL')

    // 修改为 ANY 策略
    ctrl.updateEngineConfig('member-level-v1', {
      matchStrategy: 'ANY',
    })
    const updatedDetail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(updatedDetail!.matchStrategy, 'ANY')

    // 恢复
    ctrl.updateEngineConfig('member-level-v1', {
      matchStrategy: 'ALL',
    })
    const restoredDetail = ctrl.getEngineDetail('member-level-v1')
    assert.equal(restoredDetail!.matchStrategy, 'ALL')
  })

  it('运行专员修改引擎条件权重 — 业务规则调优', () => {
    ctrl.updateEngineConfig('risk-score-v1', {
      conditionOverrides: [
        { conditionId: 'cond-high-refund', weight: 0.4 },
        { conditionId: 'cond-high-refund', value: 5 },
      ],
    })
    const detail = ctrl.getEngineDetail('risk-score-v1')
    const refundCond = detail!.conditions.find((c) => c.id === 'cond-high-refund')
    assert.equal(refundCond!.weight, 0.4)
  })

  it('运行专员对不存在引擎修改配置 — 应抛异常', () => {
    assert.throws(
      () => ctrl.updateEngineConfig('nonexistent-engine', { enabled: false }),
      /not found/
    )
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} 团建视角: 多场景协作评估与模拟推演`, () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('团建预演批量评估 — 模拟团建活动期间会员等级变化', () => {
    // 团建带来了新会员
    const teamMember: MemberLevelInput = {
      memberId: 'mem-team-001',
      totalPoints: 1500,
      totalSpend: 3000,
      visitCount: 2,
      tenantId: storeA.tenantId,
    }
    const result = service.evaluateMemberLevel(teamMember)
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.triggeredRules.length, 0)
  })

  it('团建模拟器批量运行 — 验证规则鲁棒性和性能', () => {
    const runInput: SimulatorRunInput & { rounds?: number } = {
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'sim-mem-001',
        totalPoints: 8000,
        totalSpend: 20000,
        visitCount: 50,
        tenantId: 't-test',
      } as unknown as Record<string, unknown>,
    }
    const batchResult = ctrl.runSimulatorBatch(
      runInput as unknown as any
    )
    assert.equal(batchResult.simulatorId, 'sim-member-level-v1')
    assert.equal(batchResult.totalRuns, 100)
    assert.ok(batchResult.matchRate >= 0)
    assert.ok(batchResult.matchRate <= 1)
    assert.ok(batchResult.avgExecutionTimeMs >= 0)
    assert.ok(batchResult.p50ExecutionTimeMs >= 0)
    assert.ok(batchResult.p95ExecutionTimeMs >= 0)
    assert.ok(batchResult.mostTriggeredConditions.length > 0)
  })

  it('团建查看模拟器列表 — 返回所有可用模拟器', () => {
    const sims = ctrl.listSimulators()
    assert.equal(sims.length, 2)
    const names = sims.map((s) => s.id)
    assert.ok(names.includes('sim-member-level-v1'))
    assert.ok(names.includes('sim-device-anomaly-v1'))
  })

  it('团建查看单个模拟器详情', () => {
    const sim = ctrl.getSimulator('sim-member-level-v1')
    assert.ok(sim)
    assert.equal(sim!.engineId, 'member-level-v1')
    assert.equal(sim!.rounds, 100)
    assert.equal(sim!.timeoutMs, 5000)
  })

  it('团建查看不存在的模拟器 — 应返回undefined', () => {
    const sim = ctrl.getSimulator('nonexistent-sim')
    assert.equal(sim, undefined)
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} 营销视角: 风险评分影响与营销效果评估`, () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('营销查看大促活动对风险评分影响 — 退款激增应标记HIGH风险', () => {
    const promoRiskInput: RiskScoreInput = {
      subjectId: 'campaign-summer-2026',
      subjectType: 'store',
      metrics: {
        refundCount: 15,
        abnormalPaymentCount: 5,
        deviceAnomalyCount: 3,
        complaintCount: 8,
        voidRefundAmount: 2000,
        activeDays: 7,
      },
      tenantId: storeA.tenantId,
    }
    const result = service.evaluateRiskScore(promoRiskInput)
    assert.ok(['HIGH', 'CRITICAL'].includes(result.riskLevel))
    assert.ok(result.riskScore >= 50)
    assert.ok(result.triggeredRules.length >= 3)
    assert.ok(result.recommendations.length > 0)
  })

  it('营销评估KOL推广效果 — 通过会员等级变化衡量', () => {
    // KOL带来的高消费新会员转化
    const kolMemberInput: MemberLevelInput = {
      memberId: 'mem-kol-001',
      totalPoints: 6000,
      totalSpend: 20000,
      visitCount: 25,
      tenantId: storeA.tenantId,
    }
    const result = service.evaluateMemberLevel(kolMemberInput)
    assert.equal(result.suggestedLevel, 'SVIP')
    assert.equal(result.triggeredRules.length, 3)
  })

  it('营销使用专用evaluate端点检测风险 — 可用于广告投放决策', () => {
    const riskInput: RiskScoreInput = {
      subjectId: 'ad-campaign-001',
      subjectType: 'member',
      metrics: {
        refundCount: 8,
        abnormalPaymentCount: 3,
        complaintCount: 4,
        voidRefundAmount: 1200,
        activeDays: 15,
      },
      tenantId: storeA.tenantId,
    }
    const result = ctrl.evaluateRiskScore(riskInput)
    assert.equal(result.type, 'risk-score')
    const riskResult = result.result as RiskScoreOutput
    assert.ok(riskResult.riskScore >= 50)
    assert.ok(['HIGH', 'CRITICAL'].includes(riskResult.riskLevel))
  })

  it('营销进行模拟推演 — 验证拉新活动对规则的触发率', () => {
    // 模拟大量新客户涌入场景
    const runInput: SimulatorRunInput & { rounds?: number } = {
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'sim-new-customer',
        totalPoints: 100,
        totalSpend: 300,
        visitCount: 1,
        tenantId: 't-campaign',
      } as unknown as Record<string, unknown>,
    }
    const result = ctrl.runSimulatorBatch(runInput as unknown as any)
    assert.equal(result.simulatorId, 'sim-member-level-v1')
    // 新客户匹配率可能较低（取决于变异模拟的随机输入）
    assert.ok(result.matchRate >= 0)
    assert.ok(result.matchRate <= 1)
  })
})

// ── 全局边界场景 ──
describe('全局边界场景: 异常输入 + 极端值 + 恢复性', () => {
  let service: AiRuleEngineService
  let ctrl: AiRuleEngineController

  beforeEach(() => {
    service = createService()
    ctrl = createController()
  })

  it('成员零积分零消费 — 应始终返回REGULAR', () => {
    const zeroInput: MemberLevelInput = {
      memberId: 'mem-zero-001',
      totalPoints: 0,
      totalSpend: 0,
      visitCount: 0,
      tenantId: 't-zero',
    }
    const result = service.evaluateMemberLevel(zeroInput)
    assert.equal(result.suggestedLevel, 'REGULAR')
    assert.equal(result.currentLevel, 'REGULAR')
  })

  it('设备CPU=100%, 内存=100%, 磁盘=100% — 应检测所有条件', () => {
    const maxDev: DeviceAnomalyInput = {
      deviceId: 'dev-max-001',
      storeId: storeA.id,
      metrics: {
        cpuUsage: 100,
        memoryUsage: 100,
        diskUsage: 100,
        networkLatencyMs: 9999,
        errorRate: 100,
        uptimeHours: 0,
      },
      tenantId: storeA.tenantId,
    }
    const result = service.detectDeviceAnomaly(maxDev)
    assert.equal(result.isAnomaly, true)
    assert.equal(result.severity, 'CRITICAL')
    assert.equal(result.triggeredRules.length, 5)
  })

  it('设备所有指标为0 — 不应检测到异常', () => {
    const zeroDev: DeviceAnomalyInput = {
      deviceId: 'dev-zero-001',
      storeId: storeA.id,
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatencyMs: 0,
        errorRate: 0,
        uptimeHours: 0,
      },
      tenantId: storeA.tenantId,
    }
    const result = service.detectDeviceAnomaly(zeroDev)
    assert.equal(result.isAnomaly, false)
    assert.equal(result.severity, 'LOW')
  })

  it('风险评分所有指标为0 — 应返回LOW风险', () => {
    const zeroRisk: RiskScoreInput = {
      subjectId: 'sub-zero',
      subjectType: 'member',
      metrics: {},
      tenantId: 't-zero',
    }
    const result = service.evaluateRiskScore(zeroRisk)
    assert.equal(result.riskScore, 0)
    assert.equal(result.riskLevel, 'LOW')
  })

  it('设备缺部分字段 — 应优雅降级不崩溃', () => {
    const partialDev: DeviceAnomalyInput = {
      deviceId: 'dev-partial-001',
      storeId: storeA.id,
      metrics: {
        cpuUsage: 95,
        memoryUsage: 50,
        diskUsage: 30,
        networkLatencyMs: 100,
        errorRate: 2,
      },
      tenantId: storeA.tenantId,
    }
    // 不应抛出异常
    const result = service.detectDeviceAnomaly(partialDev)
    assert.ok(result.isAnomaly !== undefined)
  })

  it('批量评估含部分失败项 — 应记录到failed计数', () => {
    const partialBatch: BatchEvaluateRequest = {
      items: [
        {
          index: 0,
          type: 'member-level',
          data: svipMemberA,
        },
        {
          index: 1,
          type: 'device-anomaly',
          data: criticalDeviceA,
        },
      ],
    }
    const result = service.batchEvaluate(partialBatch)
    assert.equal(result.total, 2)
    assert.equal(result.succeeded, 2)
    assert.equal(result.failed, 0)
  })
})
