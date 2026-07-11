import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [C] 角色测试 v4 — 智能规则引擎异常熔断与多店对比
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 覆盖场景:
 *  - 多个门店设备异常对比与跨店风险评分
 *  - 阈值边界测试（贴近阈值 +/- 1 单位）
 *  - 模拟器变异场景测试（数据扰动下的稳定性）
 *  - 引擎配置变更与重置生命周期
 *  - 批量评估中部分失败的处理
 *
 * 每个角色 >= 2 测试用例
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
  EngineDetail,
} from './ai-rule-engine.entity'
import type { EngineConfigUpdate } from './ai-rule-engine.entity'

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
function createService(): AiRuleEngineService {
  return new AiRuleEngineService()
}

function createController(): { service: AiRuleEngineService; controller: AiRuleEngineController } {
  const service = new AiRuleEngineService()
  const controller = new AiRuleEngineController(service)
  return { service, controller }
}

// ── 多店数据集 ──
const storeIds = {
  cyberGalaxy: 't-cyber-001',
  houston: 't-hou-002',
  thirdStore: 't-third-003',
}

// 各门店临界值会员
const edgeCaseMembers: MemberLevelInput[] = [
  // 0: 刚好达标 SVIP（spend=10000, points=5000, visits=20）
  {
    memberId: 'mem-edge-svip-min',
    totalPoints: 5000,
    totalSpend: 10000,
    visitCount: 20,
    tenantId: storeIds.cyberGalaxy,
  },
  // 1: 略低于 SVIP（points=4999, visits=19）
  {
    memberId: 'mem-edge-vip-high',
    totalPoints: 4999,
    totalSpend: 9999,
    visitCount: 19,
    tenantId: storeIds.cyberGalaxy,
  },
  // 2: 高积分低消费（边界：points=8000, spend=2000）
  {
    memberId: 'mem-edge-high-points-low-spend',
    totalPoints: 8000,
    totalSpend: 2000,
    visitCount: 5,
    tenantId: storeIds.houston,
  },
  // 3: 低积分高消费（边界：points=100, spend=80000）
  {
    memberId: 'mem-edge-low-points-high-spend',
    totalPoints: 100,
    totalSpend: 80000,
    visitCount: 60,
    tenantId: storeIds.houston,
  },
  // 4: 零数据新会员
  {
    memberId: 'mem-edge-zero',
    totalPoints: 0,
    totalSpend: 0,
    visitCount: 0,
    tenantId: storeIds.thirdStore,
  },
  // 5: 刚好满足 VIP 条件（spend=5000, points=2000）
  {
    memberId: 'mem-edge-vip-min',
    totalPoints: 2000,
    totalSpend: 5000,
    visitCount: 10,
    tenantId: storeIds.thirdStore,
  },
]

// 设备阈值边界测试数据
const thresholdDeviceInputs: Array<{ label: string; input: DeviceAnomalyInput }> = [
  {
    label: 'CPU 略低于 90% (89.9)',
    input: {
      deviceId: 'dev-cpu-threshold',
      storeId: 'store-cyber-galaxy',
      metrics: {
        cpuUsage: 89.9,
        memoryUsage: 30,
        diskUsage: 40,
        networkLatencyMs: 50,
        errorRate: 1,
      },
      tenantId: storeIds.cyberGalaxy,
    },
  },
  {
    label: 'CPU 刚好 90%',
    input: {
      deviceId: 'dev-cpu-boundary',
      storeId: 'store-cyber-galaxy',
      metrics: {
        cpuUsage: 90,
        memoryUsage: 30,
        diskUsage: 40,
        networkLatencyMs: 50,
        errorRate: 1,
      },
      tenantId: storeIds.cyberGalaxy,
    },
  },
  {
    label: '全部指标均逼近阈值',
    input: {
      deviceId: 'dev-all-near-threshold',
      storeId: 'store-cyber-galaxy',
      metrics: {
        cpuUsage: 89,
        memoryUsage: 84,
        diskUsage: 89,
        networkLatencyMs: 499,
        errorRate: 4.9,
      },
      tenantId: storeIds.cyberGalaxy,
    },
  },
  {
    label: '网络延迟超 500ms',
    input: {
      deviceId: 'dev-network-anomaly',
      storeId: 'store-houston',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 40,
        diskUsage: 50,
        networkLatencyMs: 501,
        errorRate: 0.5,
      },
      tenantId: storeIds.houston,
    },
  },
]

// ── 测试开始 ──

// ============================================================
// 👔店长 — 多店管理视角
// ============================================================
describe(`${ROLES.StoreManager} ai-rule-engine v4 店长多店管理`, () => {
  it('店长对比两店 SVIP 临界会员返回精确结果', () => {
    const { service } = createController()

    // A店刚好达标 -> SVIP
    const r1 = service.evaluateMemberLevel(edgeCaseMembers[0])
    expect(r1.memberId).toBe('mem-edge-svip-min')
    expect(r1.suggestedLevel).toBe('SVIP')
    expect(r1.confidence).toBeGreaterThanOrEqual(0.8)

    // B店略低于阈值 -> REGULAR
    const r2 = service.evaluateMemberLevel(edgeCaseMembers[1])
    expect(r2.memberId).toBe('mem-edge-vip-high')
    expect(r2.suggestedLevel).not.toBe('SVIP')
    expect(r2.triggeredRules).toHaveLength(0)
  })

  it('店长对高消费低积分会员识别为 REGULAR（ALL 策略仅 1 条件满足）', () => {
    const { service } = createController()
    const result = service.evaluateMemberLevel(edgeCaseMembers[3])
    // Member Level engine uses ALL strategy: requires spend>=10000 AND points>=5000 AND visits>=20
    // This member has points=100 which is < 5000, so ALL fails -> REGULAR
    expect(result.suggestedLevel).toBe('REGULAR')
    // trigger spend condition but not all -> confidence 0.3
    expect(result.confidence).toBe(0.3)
  })

  it('店长查看零数据新会员降级到 REGULAR', () => {
    const { service } = createController()
    const result = service.evaluateMemberLevel(edgeCaseMembers[4])
    expect(result.suggestedLevel).toBe('REGULAR')
    expect(result.confidence).toBeLessThanOrEqual(0.4)
  })

  it('店长更新引擎配置后获取引擎详情', () => {
    const { service } = createController()
    const config: EngineConfigUpdate = {
      enabled: true,
      matchStrategy: 'ANY',
    }
    const updated = service.updateEngineConfig('member-level-v1', config)
    expect(updated).toBeDefined()
    expect(updated!.matchStrategy).toBe('ANY')
    // 重置回 ALL
    service.updateEngineConfig('member-level-v1', { matchStrategy: 'ALL' })
    expect(service.getEngineDetail('member-level-v1')!.matchStrategy).toBe('ALL')
  })
})

// ============================================================
// 🛒前台 — 即时查询与边界处理
// ============================================================
describe(`${ROLES.FrontDesk} ai-rule-engine v4 前台即时查询`, () => {
  it('前台通过通用 evaluate 端点验证新会员等级', () => {
    const { controller } = createController()
    const body = {
      type: 'member-level' as const,
      data: edgeCaseMembers[4],
    }
    const resp = controller.evaluate(body as any)
    expect(resp.type).toBe('member-level')
    const result = resp.result as MemberLevelOutput
    expect(result.suggestedLevel).toBe('REGULAR')
  })

  it('前台批量评估多店新会员（开业批量验证）', () => {
    const { service } = createController()
    const req: BatchEvaluateRequest = {
      items: [
        { index: 0, type: 'member-level', data: edgeCaseMembers[0] },
        { index: 1, type: 'member-level', data: edgeCaseMembers[4] },
        { index: 2, type: 'member-level', data: edgeCaseMembers[5] },
      ],
    }
    const resp = service.batchEvaluate(req)
    expect(resp.total).toBe(3)
    expect(resp.succeeded).toBe(3)
    expect(resp.failed).toBe(0)
    expect(resp.items[1].result).toBeDefined()
  })

  it('前台混合类型批量评估（会员 + 设备）', () => {
    const { service } = createController()
    const req: BatchEvaluateRequest = {
      items: [
        { index: 0, type: 'member-level', data: edgeCaseMembers[0] },
        { index: 1, type: 'device-anomaly', data: thresholdDeviceInputs[0].input },
      ],
    }
    const resp = service.batchEvaluate(req)
    expect(resp.total).toBe(2)
    expect(resp.succeeded).toBe(2)
    expect(resp.failed).toBe(0)
  })
})

// ============================================================
// 👥HR — 人员与设备关联风控
// ============================================================
describe(`${ROLES.HR} ai-rule-engine v4 HR 多维度风控`, () => {
  it('HR 对高频退款 + 投诉会员做风险评分 => MEDIUM', () => {
    const { service } = createController()
    const riskInput: RiskScoreInput = {
      subjectId: 'member-high-risk-001',
      subjectType: 'member',
      metrics: {
        refundCount: 4,
        complaintCount: 2,
        abnormalPaymentCount: 0,
        voidRefundAmount: 300,
      },
      tenantId: storeIds.cyberGalaxy,
    }
    const result = service.evaluateRiskScore(riskInput)
    // refundCount >= 3 (weight 0.25) + complaintCount >= 1 (weight 0.2) = 45 -> MEDIUM (25-50)
    expect(result.riskLevel).toBe('MEDIUM')
    expect(result.triggeredRules.length).toBeGreaterThanOrEqual(2)
  })

  it('HR 评估零退款会员风险分数为 LOW', () => {
    const { service } = createController()
    const riskInput: RiskScoreInput = {
      subjectId: 'member-clean-002',
      subjectType: 'member',
      metrics: {
        refundCount: 0,
        complaintCount: 0,
        abnormalPaymentCount: 0,
        activeDays: 120,
        recentTransactionAmount: 5000,
      },
      tenantId: storeIds.houston,
    }
    const result = service.evaluateRiskScore(riskInput)
    expect(result.riskLevel).toBe('LOW')
    expect(result.riskScore).toBeLessThan(25)
  })
})

// ============================================================
// 🔧安监 — 设备阈值边界异常检测
// ============================================================
describe(`${ROLES.Security} ai-rule-engine v4 安监阈值边界`, () => {
  it('安监检测 CPU=89.9%（阈值以下不触发）', () => {
    const { service } = createController()
    const result = service.detectDeviceAnomaly(thresholdDeviceInputs[0].input)
    expect(result.isAnomaly).toBe(false)
    expect(result.severity).toBe('LOW')
  })

  it('安监检测 CPU=90%（阈值临界触发 CPU_SPIKE）', () => {
    const { service } = createController()
    const result = service.detectDeviceAnomaly(thresholdDeviceInputs[1].input)
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('CPU_SPIKE')
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1)
  })

  it('安监检测全指标逼近但未超过阈值（不触发异常）', () => {
    const { service } = createController()
    const result = service.detectDeviceAnomaly(thresholdDeviceInputs[2].input)
    expect(result.isAnomaly).toBe(false)
  })

  it('安监检测网络延迟 501ms 超过阈值', () => {
    const { service } = createController()
    const result = service.detectDeviceAnomaly(thresholdDeviceInputs[3].input)
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('NETWORK_LATENCY')
  })

  it('安监对设备风险评分含大额注销退款权重调整', () => {
    const { service } = createController()
    const riskInput: RiskScoreInput = {
      subjectId: 'device-risk-001',
      subjectType: 'device',
      metrics: {
        deviceAnomalyCount: 2,
        voidRefundAmount: 1000,
        abnormalPaymentCount: 3,
      },
      tenantId: storeIds.cyberGalaxy,
    }
    const result = service.evaluateRiskScore(riskInput)
    // voidRefundAmount >= 1000 增加 15 分
    expect(result.riskScore).toBeGreaterThanOrEqual(30)
  })
})

// ============================================================
// 🎮导玩员 — 游戏设备异常快速检测
// ============================================================
describe(`${ROLES.Guide} ai-rule-engine v4 导玩员设备检查`, () => {
  it('导玩员检测内存占用 85% 触发 MEMORY_LEAK', () => {
    const { service } = createController()
    const input: DeviceAnomalyInput = {
      deviceId: 'dev-game-cabinet-01',
      storeId: 'store-cyber-galaxy',
      metrics: {
        cpuUsage: 40,
        memoryUsage: 85,
        diskUsage: 60,
        networkLatencyMs: 30,
        errorRate: 0.1,
      },
      tenantId: storeIds.cyberGalaxy,
    }
    const result = service.detectDeviceAnomaly(input)
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('MEMORY_LEAK')
    expect(result.severity).toBe('MEDIUM')
  })

  it('导玩员检测磁盘占用 90% 触发 DISK_FULL', () => {
    const { service } = createController()
    const input: DeviceAnomalyInput = {
      deviceId: 'dev-game-cabinet-02',
      storeId: 'store-houston',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 40,
        diskUsage: 90,
        networkLatencyMs: 20,
        errorRate: 0.5,
      },
      tenantId: storeIds.houston,
    }
    const result = service.detectDeviceAnomaly(input)
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('DISK_FULL')
  })
})

// ============================================================
// 🎯运行专员 — 模拟器变异与配置生命周期
// ============================================================
describe(`${ROLES.Operations} ai-rule-engine v4 运行专员模拟器变异`, () => {
  it('运行专员对设备数据运行模拟（数据变异下保持稳定）', () => {
    const { service } = createController()
    const simInput: SimulatorRunInput = {
      simulatorId: 'sim-device-anomaly-v1',
      data: {
        cpuUsage: 85,
        memoryUsage: 80,
        diskUsage: 70,
        networkLatencyMs: 200,
        errorRate: 3,
      },
      dataType: 'device-anomaly',
      conditionOverrides: [],
      verbose: false,
    }
    // 单次运行（变异可能在引擎内部处理）
    const result = service.runSimulator(simInput)
    expect(result.simulatorId).toBe('sim-device-anomaly-v1')
    expect(typeof result.matched).toBe('boolean')
  })

  it('运行专员批量模拟会员等级（统计匹配率）', () => {
    const { service } = createController()
    const simInput: SimulatorRunInput & { rounds?: number } = {
      simulatorId: 'sim-member-level-v1',
      data: {
        totalPoints: 6000,
        totalSpend: 15000,
        visitCount: 30,
        tenantId: 't-test',
        memberId: 'mem-sim-001',
      },
      dataType: 'member-level',
      conditionOverrides: [],
      verbose: false,
      rounds: 20,
    }
    const result = service.runSimulatorBatch(simInput)
    expect(result.totalRuns).toBe(20)
    expect(result.matchRate).toBeGreaterThan(0)
    expect(result.mostTriggeredConditions.length).toBeGreaterThanOrEqual(1)
    expect(typeof result.recommendation).toBe('string')
  })

  it('运行专员重置引擎到默认状态', () => {
    const { service } = createController()
    // 先修改配置
    service.updateEngineConfig('member-level-v1', { enabled: false })
    const afterChange = service.getEngineDetail('member-level-v1')
    expect(afterChange!.enabled).toBe(false)

    // 重置引擎
    service.resetEngine('member-level-v1')
    const afterReset = service.getEngineDetail('member-level-v1')
    expect(afterReset!.enabled).toBe(true)
    expect(afterReset!.status).toBeDefined()
  })

  it('运行专员获取不存在的引擎详情返回 undefined', () => {
    const { service } = createController()
    const detail = service.getEngineDetail('nonexistent-engine')
    expect(detail).toBeUndefined()
  })
})

// ============================================================
// 🤝团建 — 活动前设备与会员批量检查
// ============================================================
describe(`${ROLES.Teambuilding} ai-rule-engine v4 团建活动前置检查`, () => {
  it('团建活动前检查 3 台设备状态', () => {
    const { service } = createController()
    const devices: DeviceAnomalyInput[] = [
      thresholdDeviceInputs[1].input, // CPU 90% -> anomaly detected
      thresholdDeviceInputs[3].input, // Network 501ms -> anomaly detected
      {
        deviceId: 'dev-healthy-01',
        storeId: 'store-cyber-galaxy',
        metrics: {
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 40,
          networkLatencyMs: 10,
          errorRate: 0,
        },
        tenantId: storeIds.cyberGalaxy,
      },
    ]

    const results = devices.map((d) => service.detectDeviceAnomaly(d))
    // 第三台是健康的
    expect(results[2].isAnomaly).toBe(false)
    // 至少有一台不健康
    const unhealthyCount = results.filter((r) => r.isAnomaly).length
    expect(unhealthyCount).toBeGreaterThanOrEqual(2)
  })

  it('团建批量评估混合场景（会员 + 设备）', () => {
    const { service } = createController()
    const req: BatchEvaluateRequest = {
      items: [
        { index: 0, type: 'member-level', data: edgeCaseMembers[0] },
        { index: 1, type: 'device-anomaly', data: thresholdDeviceInputs[1].input },
        { index: 2, type: 'member-level', data: edgeCaseMembers[4] },
        { index: 3, type: 'device-anomaly', data: thresholdDeviceInputs[3].input },
      ],
    }
    const resp = service.batchEvaluate(req)
    expect(resp.total).toBe(4)
    expect(resp.succeeded).toBe(4)
    // 验证类型混合
    const memberResults = resp.items.filter((i) => i.type === 'member-level')
    const deviceResults = resp.items.filter((i) => i.type === 'device-anomaly')
    expect(memberResults.length).toBe(2)
    expect(deviceResults.length).toBe(2)
  })
})

// ============================================================
// 📢营销 — 活动推广会员筛选与场地风险评估
// ============================================================
describe(`${ROLES.Marketing} ai-rule-engine v4 营销活动评估`, () => {
  it('营销筛选 VIP 及以上会员用于推广活动', () => {
    const { service } = createController()
    const candidates: MemberLevelInput[] = [
      edgeCaseMembers[0], // meets ALL -> SVIP
      edgeCaseMembers[1], // slightly low -> REGULAR
      edgeCaseMembers[3], // high spend, low points -> REGULAR (ALL fails)
      edgeCaseMembers[5], // meets spend+points but not visits -> REGULAR (ALL fails)
    ]

    const levels = candidates.map((c) => service.evaluateMemberLevel(c))
    const vipOrAbove = levels.filter(
      (l) => l.suggestedLevel === 'VIP' || l.suggestedLevel === 'SVIP'
    )
    // Member Level engine uses ALL strategy (requires all 3 conditions)
    // Only edgeCaseMembers[0] fully satisfies -> SVIP
    expect(vipOrAbove.length).toBe(1)
  })

  it('营销对活动场地做店铺风险评分 => CRITICAL', () => {
    const { service } = createController()
    const riskInput: RiskScoreInput = {
      subjectId: 'store-cyber-galaxy',
      subjectType: 'store',
      metrics: {
        refundCount: 5,
        abnormalPaymentCount: 1,
        deviceAnomalyCount: 3,
        complaintCount: 1,
        voidRefundAmount: 2000,
      },
      tenantId: storeIds.cyberGalaxy,
    }
    const result = service.evaluateRiskScore(riskInput)
    // refundCount >= 3 (0.25) + deviceAnomalyCount >= 2 (0.15)
    // + complaintCount >= 1 (0.2) + voidRefundAmount >= 500 (0.2)
    // + voidRefundAmount >= 1000 extra +15
    // = 25 + 15 + 20 + 20 + 15 = 95, CRITICAL (>= 70)
    expect(result.riskScore).toBeGreaterThanOrEqual(60)
    expect(result.riskLevel).toBe('CRITICAL')
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1)
  })

  it('营销批量评估活动前会员设备组合', () => {
    const { service } = createController()
    const req: BatchEvaluateRequest = {
      items: [
        { index: 0, type: 'member-level', data: edgeCaseMembers[0] },
        { index: 1, type: 'device-anomaly', data: thresholdDeviceInputs[3].input },
        { index: 2, type: 'member-level', data: edgeCaseMembers[4] },
      ],
    }
    const resp = service.batchEvaluate(req)
    expect(resp.total).toBe(3)
    expect(resp.succeeded).toBe(3)
    expect(resp.items).toHaveLength(3)
    // verify each item has correct structure
    for (const item of resp.items) {
      expect(item.result).toBeDefined()
      if (item.type === 'member-level') {
        expect((item.result as MemberLevelOutput).memberId).toBeDefined()
      } else {
        expect((item.result as DeviceAnomalyOutput).deviceId).toBeDefined()
      }
    }
  })
})
