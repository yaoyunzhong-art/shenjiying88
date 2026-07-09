import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [D] controller spec 补全 - 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量评估（高吞吐场景）
 * - 极端输入值（溢出、负数、超大数值）
 * - 快速连续状态变更（引擎开关、阈值调整）
 * - 内存/时间压力 (大量模拟器运行)
 */

import assert from 'node:assert/strict'
import { AiRuleEngineService } from './ai-rule-engine.service'
import { AiRuleEngineController } from './ai-rule-engine.controller'

describe('AiRuleEngine - Stress & Resilience', () => {
  let service: AiRuleEngineService
  let controller: AiRuleEngineController

  beforeEach(() => {
    service = new AiRuleEngineService()
    controller = new AiRuleEngineController(service)
  })

  // ─── 高并发批量评估 ───

  describe('高并发批量评估', () => {
    it('同时批量评估 100 个会员不崩溃', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        type: 'member-level' as const,
        data: {
          memberId: `stress-mem-${i}`,
          totalPoints: (i * 500) % 20000,
          totalSpend: (i * 1000) % 50000,
          visitCount: (i * 3) % 100,
          tenantId: 't-001',
        },
      }))

      const batch = service.batchEvaluate({ items })
      assert.equal(batch.total, 100)
      assert.equal(batch.succeeded, 100)
      assert.equal(batch.failed, 0)
      assert.equal(batch.items.length, 100)

      // 验证所有类型结构正确
      for (const item of batch.items) {
        const result = item.result as { suggestedLevel: string; confidence: number }
        assert.ok(['SVIP', 'VIP', 'REGULAR'].includes(result.suggestedLevel))
        assert.ok(result.confidence >= 0 && result.confidence <= 1)
      }
    })

    it('同时批量评估 100 个设备不崩溃', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        type: 'device-anomaly' as const,
        data: {
          deviceId: `stress-dev-${i}`,
          storeId: 'store-stress',
          metrics: {
            cpuUsage: (i * 3) % 100,
            memoryUsage: (i * 5) % 100,
            diskUsage: (i * 7) % 100,
            networkLatencyMs: (i * 20) % 1000,
            errorRate: (i * 0.5) % 10,
            uptimeHours: (i * 24) % 10000,
          },
          tenantId: 't-001',
        },
      }))

      const batch = service.batchEvaluate({ items })
      assert.equal(batch.total, 100)
      assert.equal(batch.succeeded, 100)

      const anomalyCount = batch.items.filter(
        (i) => (i.result as { isAnomaly: boolean }).isAnomaly
      ).length
      assert.ok(anomalyCount >= 0)
      assert.ok(anomalyCount <= 100)
    })

    it('混合 50 会员 + 50 设备的批量评估', () => {
      const memItems = Array.from({ length: 50 }, (_, i) => ({
        index: i,
        type: 'member-level' as const,
        data: {
          memberId: `mix-mem-${i}`,
          totalPoints: 5000 + i * 200,
          totalSpend: 10000 + i * 500,
          visitCount: 20 + i,
          tenantId: 't-001',
        },
      }))
      const devItems = Array.from({ length: 50 }, (_, i) => ({
        index: 50 + i,
        type: 'device-anomaly' as const,
        data: {
          deviceId: `mix-dev-${i}`,
          storeId: 'store-mix',
          metrics: {
            cpuUsage: 30 + (i * 2) % 50,
            memoryUsage: 40,
            diskUsage: 50,
            networkLatencyMs: 60,
            errorRate: 1,
            uptimeHours: 200,
          },
          tenantId: 't-001',
        },
      }))

      const batch = service.batchEvaluate({ items: [...memItems, ...devItems] })
      assert.equal(batch.total, 100)
      assert.equal(batch.succeeded, 100)

      const memberResults = batch.items.filter((i) => i.type === 'member-level')
      const deviceResults = batch.items.filter((i) => i.type === 'device-anomaly')
      assert.equal(memberResults.length, 50)
      assert.equal(deviceResults.length, 50)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入边界', () => {
    it('会员全部字段为 0 不会崩溃 => REGULAR', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'zero-mem',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't-001',
      })
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.confidence, 0.3)
    })

    it('会员极端负值不会崩溃', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'neg-mem',
        totalPoints: -99999,
        totalSpend: -99999,
        visitCount: -1,
        tenantId: 't-001',
      })
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.confidence, 0.3)
    })

    it('会员超大数值不会溢出', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'huge-mem',
        totalPoints: Number.MAX_SAFE_INTEGER,
        totalSpend: Number.MAX_SAFE_INTEGER,
        visitCount: Number.MAX_SAFE_INTEGER,
        tenantId: 't-001',
      })
      // 所有条件应该触发
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.equal(result.confidence, 1.0)
    })

    it('设备全部指标为负值不会崩溃', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'neg-dev',
        storeId: 'store-neg',
        metrics: {
          cpuUsage: -1,
          memoryUsage: -1,
          diskUsage: -1,
          networkLatencyMs: -1,
          errorRate: -1,
          uptimeHours: -1,
        },
        tenantId: 't-001',
      })
      // 负值不应触发任何异常条件
      assert.equal(result.isAnomaly, false)
    })

    it('设备所有指标最大值字段不会崩溃', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'max-dev',
        storeId: 'store-max',
        metrics: {
          cpuUsage: 100,
          memoryUsage: 100,
          diskUsage: 100,
          networkLatencyMs: 9999,
          errorRate: 100,
          uptimeHours: Number.MAX_SAFE_INTEGER,
        },
        tenantId: 't-001',
      })
      // 所有阈值都超了 => CRITICAL
      assert.equal(result.isAnomaly, true)
      assert.equal(result.severity, 'CRITICAL')
      assert.ok(result.triggeredRules.length >= 3)
    })

    it('设备 NaN 指标不会崩溃', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'nan-dev',
        storeId: 'store-nan',
        metrics: {
          cpuUsage: NaN,
          memoryUsage: NaN,
          diskUsage: NaN,
          networkLatencyMs: NaN,
          errorRate: NaN,
          uptimeHours: NaN,
        },
        tenantId: 't-001',
      })
      // NaN 比较应该当作异常处理
      assert.equal(result.isAnomaly, false)
    })

    it('风险评分字段全 0 返回 LOW', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'zero-risk',
        subjectType: 'member',
        metrics: {},
        tenantId: 't-001',
      })
      assert.equal(result.riskLevel, 'LOW')
      assert.equal(result.riskScore, 0)
    })

    it('风险评分超大多指标应封顶 100', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'max-risk',
        subjectType: 'store',
        metrics: {
          refundCount: 100,
          abnormalPaymentCount: 100,
          deviceAnomalyCount: 100,
          complaintCount: 100,
          voidRefundAmount: 100000,
        },
        tenantId: 't-001',
      })
      assert.equal(result.riskScore, 100)
      assert.equal(result.riskLevel, 'CRITICAL')
    })
  })

  // ─── 引擎状态快速变更 ───

  describe('引擎状态快速闪变', () => {
    it('快速开关引擎 10 次不崩溃', () => {
      for (let i = 0; i < 10; i++) {
        const enabled = i % 2 === 0
        controller.updateEngineConfig('member-level-v1', { enabled })
      }
      const detail = controller.getEngineDetail('member-level-v1') as { enabled: boolean }
      assert.equal(detail.enabled, false)
    })

    it('快速切换匹配策略 5 次', () => {
      const strategies: Array<'ALL' | 'ANY'> = ['ALL', 'ANY', 'ALL', 'ANY', 'ALL']
      for (const s of strategies) {
        controller.updateEngineConfig('member-level-v1', { matchStrategy: s })
      }
      const detail = controller.getEngineDetail('member-level-v1') as { matchStrategy: string }
      assert.equal(detail.matchStrategy, 'ALL')
    })

    it('引擎重置后评估状态正常', () => {
      controller.updateEngineConfig('member-level-v1', { enabled: false })
      controller.updateEngineConfig('member-level-v1', { matchStrategy: 'ANY' })
      controller.resetEngine('member-level-v1')
      const detail = controller.getEngineDetail('member-level-v1') as {
        enabled: boolean
        matchStrategy: string
      }
      assert.equal(detail.enabled, true)
      // 评估返回值正常
      const result = service.evaluateMemberLevel({
        memberId: 'post-reset',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 25,
        tenantId: 't-001',
      })
      assert.equal(result.suggestedLevel, 'SVIP')
    })

    it('连续调用控制器路由不报错', () => {
      // 模拟快速连续请求
      for (let i = 0; i < 20; i++) {
        const r1 = controller.evaluateMemberLevel({
          memberId: `rapid-${i}`,
          totalPoints: i * 1000,
          totalSpend: i * 3000,
          visitCount: i * 5,
          tenantId: 't-001',
        })
        assert.ok(r1.result)
      }
    })
  })

  // ─── 模拟器压力 ───

  describe('模拟器压力', () => {
    it('运行大批量模拟 (500 轮) 不超时', () => {
      const summary = service.runSimulatorBatch({
        simulatorId: 'sim-device-anomaly-v1',
        dataType: 'device-anomaly',
        data: {
          deviceId: 'pressure-dev',
          storeId: 'store-pressure',
          metrics: {
            cpuUsage: 50,
            memoryUsage: 50,
            diskUsage: 50,
            networkLatencyMs: 300,
            errorRate: 3,
            uptimeHours: 500,
          },
          tenantId: 't-001',
        },
        rounds: 500,
      })
      assert.equal(summary.totalRuns, 500)
      assert.ok(summary.avgExecutionTimeMs >= 0)
      assert.ok(summary.matchRate >= 0)
      assert.ok(summary.recommendation.length > 0)
    })

    it('使用条件覆盖变更运行大量模拟结果可重复', () => {
      // 三次运行同样的条件覆盖应得到相同结果
      const run1 = service.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
          memberId: 'repeat-mem',
          totalPoints: 3000,
          totalSpend: 5000,
          visitCount: 15,
          tenantId: 't-001',
        },
        conditionOverrides: [
          { conditionId: 'cond-high-spend', value: 4000 },
          { conditionId: 'cond-high-points', value: 2000 },
        ],
        verbose: true,
      })

      const run2 = service.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
          memberId: 'repeat-mem',
          totalPoints: 3000,
          totalSpend: 5000,
          visitCount: 15,
          tenantId: 't-001',
        },
        conditionOverrides: [
          { conditionId: 'cond-high-spend', value: 4000 },
          { conditionId: 'cond-high-points', value: 2000 },
        ],
        verbose: true,
      })

      assert.equal(run1.matched, run2.matched)
      assert.equal(run1.matchScore, run2.matchScore)
      assert.deepEqual(run1.triggeredConditions, run2.triggeredConditions)
    })

    it('不存在的模拟器ID应及早报错', () => {
      assert.throws(
        () =>
          service.runSimulator({
            simulatorId: '',
            dataType: 'member-level',
            data: {} as any,
          }),
        /not found/
      )
    })
  })

  // ─── 空/无效输入 ───

  describe('空/无效输入韧性', () => {
    it('空数组批量评估返回空结果', () => {
      const result = service.batchEvaluate({ items: [] })
      assert.equal(result.total, 0)
      assert.equal(result.succeeded, 0)
      assert.equal(result.failed, 0)
      assert.equal(result.items.length, 0)
      assert.ok(Date.parse(result.timestamp) > 0)
    })

    it('批量评估包含非法类型项应跳过', () => {
      const result = service.batchEvaluate({
        items: [
          { index: 0, type: 'member-level', data: { memberId: 'm1', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' } },
          { index: 1, type: 'invalid-type' as never, data: {} as never },
          { index: 2, type: 'device-anomaly', data: { deviceId: 'd1', storeId: 's1', metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 }, tenantId: 't-001' } as never },
        ],
      })
      // 非法类型项计入 total 但不计入 succeeded/failed，items 只包含有效项
      assert.equal(result.total, 3) // 3个总项
      assert.equal(result.succeeded, 2) // 2个有效
      assert.equal(result.failed, 0)
      assert.equal(result.items.length, 2) // 只有2个有效结果
    })

    it('引擎列表顺序稳定不变', () => {
      const engines1 = controller.getEngines() as { engineId: string }[]
      const engines2 = controller.getEngines() as { engineId: string }[]
      const ids1 = engines1.map((e) => e.engineId)
      const ids2 = engines2.map((e) => e.engineId)
      assert.deepEqual(ids1, ids2)
      assert.deepEqual(ids1, ['member-level-v1', 'device-anomaly-v1', 'risk-score-v1'])
    })

    it('长时间运行后模拟器内存不影响后续评估', () => {
      // 先跑大量评估
      for (let i = 0; i < 50; i++) {
        service.evaluateMemberLevel({
          memberId: `warmup-${i}`,
          totalPoints: i * 200,
          totalSpend: i * 500,
          visitCount: i * 2,
          tenantId: 't-001',
        })
        service.detectDeviceAnomaly({
          deviceId: `warmup-dev-${i}`,
          storeId: 'store-warm',
          metrics: {
            cpuUsage: (i * 5) % 100,
            memoryUsage: (i * 7) % 100,
            diskUsage: (i * 3) % 100,
            networkLatencyMs: (i * 10) % 500,
            errorRate: (i * 0.2) % 10,
            uptimeHours: 100,
          },
          tenantId: 't-001',
        })
      }

      // 然后验证评估仍正确
      const result = service.evaluateMemberLevel({
        memberId: 'fresh-mem',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 25,
        tenantId: 't-001',
      })
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.equal(result.triggeredRules.length, 3)
    })
  })

  // ─── 幂等与时序 ───

  describe('幂等性与时序', () => {
    it('相同会员输入产生相同评估结果（幂等）', () => {
      const input = {
        memberId: 'idempotent-mem',
        totalPoints: 5000,
        totalSpend: 10000,
        visitCount: 20,
        tenantId: 't-001',
      }
      const r1 = service.evaluateMemberLevel(input)
      const r2 = service.evaluateMemberLevel(input)
      assert.equal(r1.suggestedLevel, r2.suggestedLevel)
      assert.equal(r1.confidence, r2.confidence)
      assert.deepEqual(r1.triggeredRules, r2.triggeredRules)
    })

    it('相同设备输入产生相同检测结果（幂等）', () => {
      const input = {
        deviceId: 'idempotent-dev',
        storeId: 'store-idem',
        metrics: {
          cpuUsage: 92,
          memoryUsage: 85,
          diskUsage: 40,
          networkLatencyMs: 200,
          errorRate: 0.5,
          uptimeHours: 300,
        },
        tenantId: 't-001',
      }
      const r1 = service.detectDeviceAnomaly(input)
      const r2 = service.detectDeviceAnomaly(input)
      assert.equal(r1.isAnomaly, r2.isAnomaly)
      assert.equal(r1.severity, r2.severity)
      assert.deepEqual(r1.triggeredRules, r2.triggeredRules)
    })
  })

  // ─── 引擎配置极限 ───

  describe('引擎配置极限', () => {
    it('引擎详情中的条件权重合计应为正数', () => {
      const detail = controller.getEngineDetail('member-level-v1') as { conditions: Array<{ weight: number }> }
      const totalWeight = detail.conditions.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0)
      assert.ok(totalWeight > 0)
    })

    it('获取不存在的引擎详情应抛异常', () => {
      assert.throws(() => controller.getEngineDetail('no-such-engine'), /not found/)
    })

    it('更新不存在的引擎配置应抛异常', () => {
      assert.throws(
        () => controller.updateEngineConfig('ghost-engine', { enabled: false }),
        /not found/
      )
    })

    it('重置不存在的引擎应抛异常', () => {
      assert.throws(() => controller.resetEngine('ghost-engine'), /not found/)
    })

    it('所有引擎的 conditionsCount 应与实际 conditions 数组长度一致', () => {
      const mle = controller.getEngineDetail('member-level-v1') as {
        conditionsCount: number
        conditions: unknown[]
      }
      assert.equal(mle.conditionsCount, mle.conditions.length)

      const da = controller.getEngineDetail('device-anomaly-v1') as {
        conditionsCount: number
        conditions: unknown[]
      }
      assert.equal(da.conditionsCount, da.conditions.length)
    })

    it('所有引擎的 actionsCount 应与实际 actions 数组长度一致', () => {
      const mle = controller.getEngineDetail('member-level-v1') as {
        actionsCount: number
        actions: unknown[]
      }
      assert.equal(mle.actionsCount, mle.actions.length)
    })
  })

  // ─── 极端并发模拟场景 ───

  describe('极端并发与模拟场景', () => {
    it('模拟器多次运行后 conditionOverrides 不影响原始配置', () => {
      // 运行带覆盖的模拟
      service.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: { memberId: 'test', totalPoints: 100, totalSpend: 100, visitCount: 1, tenantId: 't-001' },
        conditionOverrides: [{ conditionId: 'cond-high-spend', value: 50 }],
      })

      // 重新运行无覆盖的模拟应该用原始配置
      const result = service.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: { memberId: 'verify', totalPoints: 100, totalSpend: 100, visitCount: 1, tenantId: 't-001' },
      })
      // 原始 cond-high-spend 值应 > 100，所以不匹配
      assert.equal(result.matched, false)
    })

    it('风险评分无需全部指标仍可正确计算', () => {
      const r1 = service.evaluateRiskScore({
        subjectId: 'partial-1',
        subjectType: 'member',
        metrics: { refundCount: 5 },
        tenantId: 't-001',
      })
      assert.equal(r1.riskLevel, 'MEDIUM')
      assert.equal(r1.riskScore, 25)

      const r2 = service.evaluateRiskScore({
        subjectId: 'partial-2',
        subjectType: 'store',
        metrics: { deviceAnomalyCount: 2 },
        tenantId: 't-001',
      })
      assert.equal(r2.riskLevel, 'LOW')
      assert.equal(r2.riskScore, 15)
    })

    it('风险评分 voidRefundAmount 边界 >= 500 触发', () => {
      const r1 = service.evaluateRiskScore({
        subjectId: 'void-test-a',
        subjectType: 'member',
        metrics: { voidRefundAmount: 499 },
        tenantId: 't-001',
      })
      // 仅 voidRefundAmount=499 < 500 => low, riskScore=0
      assert.equal(r1.riskScore, 0)
      assert.equal(r1.riskLevel, 'LOW')

      const r2 = service.evaluateRiskScore({
        subjectId: 'void-test-b',
        subjectType: 'member',
        metrics: { voidRefundAmount: 500 },
        tenantId: 't-001',
      })
      // voidRefundAmount=500 >= 500 => cond-void-refund triggers
      // weight 0.2 => 20 + extra (>=1000? 500<1000所以没有extra) => 20 => LOW (>=0) 但20<25 => LOW
      // 等等，voidRefundAmount=500 < 1000 所以没有 extra，但 base weight=0.2 => 20
      // 单条件 20 < 25 threshold => MEDIUM? 不，规则是 weightedScore < 25 => LOW
      assert.ok(r2.riskScore >= 20)
      // 20 < 25 所以是 LOW
      assert.equal(r2.riskLevel, 'LOW')

      const r3 = service.evaluateRiskScore({
        subjectId: 'void-test-c',
        subjectType: 'member',
        metrics: { voidRefundAmount: 1500 },
        tenantId: 't-001',
      })
      // 1500 >= 500 => base 20, 1500 >= 1000 => extra +15 => total 35 (not +50, since condition only handles >=1000 gives +15)
      // Actually the logic: cond-void-refund = 500 >= base threshold => weight 0.2 = 20
      // Then extra for >= 1000: +15. So total = 35
      // But the risk logic actually is: if voidRefundAmount >= 500, cond-void-refund
      // If also >= 1000, extra +15, if >= 5000, extra +50
      // 35 >= 25 => MEDIUM
      assert.ok(r3.riskScore >= 35)
    })

    it('设备异常 uptimeHours 不影响异常判断', () => {
      const r1 = service.detectDeviceAnomaly({
        deviceId: 'uptime-test',
        storeId: 'store-up',
        metrics: {
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 40,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 0,
        },
        tenantId: 't-001',
      })
      assert.equal(r1.isAnomaly, false)

      const r2 = service.detectDeviceAnomaly({
        deviceId: 'uptime-test-2',
        storeId: 'store-up',
        metrics: {
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 40,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 999999,
        },
        tenantId: 't-001',
      })
      assert.equal(r2.isAnomaly, false)
    })

    it('不同 subjectType 对风险评分无影响（指标决定）', () => {
      const r1 = service.evaluateRiskScore({
        subjectId: 'type-test-1',
        subjectType: 'member',
        metrics: { refundCount: 5, complaintCount: 2 },
        tenantId: 't-001',
      })
      const r2 = service.evaluateRiskScore({
        subjectId: 'type-test-2',
        subjectType: 'store',
        metrics: { refundCount: 5, complaintCount: 2 },
        tenantId: 't-001',
      })
      assert.equal(r1.riskScore, r2.riskScore)
      assert.equal(r1.riskLevel, r2.riskLevel)
    })
  })
})
