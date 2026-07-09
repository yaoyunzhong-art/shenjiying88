/**
 * chaos-engineering.workflow-scenario.test.ts - [D] 全生命周期场景测试
 *
 * 覆盖完整的业务流程场景:
 * 1. 创建实验 → 运行 → 注入故障 → 健康监控 → 回滚 → 验证恢复
 * 2. 多实验并行执行与故障隔离
 * 3. 边缘情况：实验重复创建/重复运行/故障叠加
 *
 * 每个场景 2 个测试用例（正常流程 + 边界情况）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
  type SystemMetrics,
} from './chaos-engineering.service'

// ── 辅助函数 ──

/** 创建不健康指标（持续超标） */
function unhealthyMetrics(overrides?: Partial<SystemMetrics>): SystemMetrics {
  return {
    cpuUsage: 95,
    memoryUsage: 92,
    errorRate: 0.5,
    latencyAvg: 3000,
    healthy: false,
    ...overrides,
  }
}

/** 创建健康指标 */
function healthyMetrics(overrides?: Partial<SystemMetrics>): SystemMetrics {
  return {
    cpuUsage: 35,
    memoryUsage: 45,
    errorRate: 0.01,
    latencyAvg: 80,
    healthy: true,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════
// 场景1: 完整生命周期 — 创建 → 运行 → 故障 → 回滚 → 验证
// ═══════════════════════════════════════════════════════
describe('场景1: 混沌实验全生命周期', () => {
  let experimentService: ChaosExperimentService
  let faultService: FaultInjectionService
  let rollbackService: ChaosAutoRollbackService

  beforeEach(() => {
    experimentService = new ChaosExperimentService()
    faultService = new FaultInjectionService()
    rollbackService = new ChaosAutoRollbackService()
  })

  /** ✅ 正常流程: 创建 → 运行 → 注入延迟 → 不健康 → 触发回滚 → 恢复健康 */
  it('✅ 正例: 完整生命周期（延迟故障导致回滚）', async () => {
    // 1. 创建实验
    const experiment = experimentService.createExperiment(
      'api-latency-test',
      'api-gateway',
      { type: 'LATENCY', target: 'api-gateway', params: { delayMs: 500 } },
    )
    assert.equal(experiment.status, 'PENDING')
    assert.ok(experiment.id)

    // 2. 运行实验
    const running = await experimentService.runExperiment(experiment.id)
    assert.equal(running!.status, 'RUNNING')
    assert.ok(running!.startedAt)
    assert.ok(running!.faultInjections[0].active)

    // 3. 注入延迟故障
    const fault = faultService.injectLatency('api-gateway', 500)
    assert.equal(fault.type, 'LATENCY')
    assert.equal(faultService.getNetworkLatency('api-gateway'), 500)

    // 4. 连续监控到不健康指标 (3次触发阈值)
    const bad = unhealthyMetrics()
    const r1 = rollbackService.monitorExperiment(experiment.id, bad)
    assert.equal(r1.failureCount, 1)
    assert.equal(r1.shouldRollback, false)

    const r2 = rollbackService.monitorExperiment(experiment.id, bad)
    assert.equal(r2.failureCount, 2)

    // 第4次: 超过阈值，shouldRollback = true
    const r3 = rollbackService.monitorExperiment(experiment.id, bad)
    assert.equal(r3.failureCount, 3)
    assert.equal(r3.shouldRollback, true)

    // 5. 触发回滚
    const rollback = await rollbackService.triggerRollbackIfNeeded(
      experiment.id,
      'API latency exceeded threshold after fault injection',
    )
    assert.ok(rollback)
    assert.equal(rollback!.trigger, 'AUTO')
    assert.equal(rollback!.success, true)

    // 6. 验证回滚历史记录
    const history = rollbackService.getRollbackHistoryForExperiment(experiment.id)
    assert.equal(history.length, 1)
    assert.ok(history[0].triggeredAt)
    assert.ok(history[0].completedAt)

    // 7. 停止故障注入
    const stopped = faultService.stopInjection('api-gateway')
    assert.equal(stopped, true)
    assert.equal(faultService.getNetworkLatency('api-gateway'), 0)

    // 8. 模拟健康恢复后完成实验
    const recovered = healthyMetrics()
    const healthCheck = rollbackService.monitorExperiment(experiment.id, recovered)
    assert.equal(healthCheck.healthy, true)
    assert.equal(healthCheck.failureCount, 0)
  })

  /** 🔲 边界情况: 实验运行中健康恢复，故障计数器归零，不触发回滚 */
  it('🔲 边界: 健康恢复后不应触发回滚', async () => {
    const experiment = experimentService.createExperiment(
      'recovery-test',
      'payment-service',
      { type: 'ERROR', target: 'payment-service', params: { errorRate: 30 } },
    )
    const running = await experimentService.runExperiment(experiment.id)

    // 2次不健康
    rollbackService.monitorExperiment(experiment.id, unhealthyMetrics())
    rollbackService.monitorExperiment(experiment.id, unhealthyMetrics())

    // 恢复健康
    const recovery = rollbackService.monitorExperiment(experiment.id, healthyMetrics())
    assert.equal(recovery.failureCount, 0)
    assert.equal(recovery.shouldRollback, false)

    // 再次不健康 - 应重新计数
    const afterRecovery = rollbackService.monitorExperiment(experiment.id, unhealthyMetrics())
    assert.equal(afterRecovery.failureCount, 1)

    // 不应该有回滚记录
    const rollback = await rollbackService.triggerRollbackIfNeeded(experiment.id, 'should not trigger')
    assert.equal(rollback, undefined)
  })

  /** ❌ 反例: 实验ID不存在 */
  it('❌ 反例: 不存在的实验ID操作应失败', async () => {
    const missingId = 'non-existent-experiment-id'

    const runResult = await experimentService.runExperiment(missingId)
    assert.equal(runResult, undefined)

    const pauseResult = await experimentService.pauseExperiment(missingId)
    assert.equal(pauseResult, undefined)

    const expResult = experimentService.getExperiment(missingId)
    assert.equal(expResult, undefined)

    const resultResult = experimentService.getExperimentResult(missingId)
    assert.equal(resultResult, undefined)
  })
})

// ═══════════════════════════════════════════════════════
// 场景2: 多实验并行运行与故障隔离
// ═══════════════════════════════════════════════════════
describe('场景2: 多实验并行运行与故障隔离', () => {
  let experimentService: ChaosExperimentService
  let faultService: FaultInjectionService
  let rollbackService: ChaosAutoRollbackService

  beforeEach(() => {
    experimentService = new ChaosExperimentService()
    faultService = new FaultInjectionService()
    rollbackService = new ChaosAutoRollbackService()
  })

  /** ✅ 正常流程: 两个实验同时运行，互不干扰 */
  it('✅ 正例: 两个并行实验独立运行', async () => {
    // 实验A: 延迟故障
    const expA = experimentService.createExperiment(
      'parallel-latency-a',
      'service-a',
      { type: 'LATENCY', target: 'service-a', params: { delayMs: 200 } },
    )
    // 实验B: CPU燃烧故障
    const expB = experimentService.createExperiment(
      'parallel-cpu-burn-b',
      'service-b',
      { type: 'CPU_BURN', target: 'service-b', params: { percentage: 80 } },
    )

    // 实验A仅影响 service-a
    await experimentService.runExperiment(expA.id)
    faultService.injectLatency('service-a', 200)

    // 实验B仅影响 service-b
    await experimentService.runExperiment(expB.id)
    faultService.injectCPUBurn('service-b', 80)

    // 验证: service-a 有延迟，无CPU燃烧
    assert.equal(faultService.getNetworkLatency('service-a'), 200)
    assert.equal(faultService.getCPUBurnPercentage('service-a'), 0)

    // 验证: service-b 有CPU燃烧，无延迟
    assert.equal(faultService.getCPUBurnPercentage('service-b'), 80)
    assert.equal(faultService.getNetworkLatency('service-b'), 0)

    // 两个实验列表独立
    const list = experimentService.listExperiments()
    assert.equal(list.length, 2)

    // 验证实验A详情
    const detailA = experimentService.getExperiment(expA.id)
    assert.equal(detailA!.target, 'service-a')

    // 验证实验B详情
    const detailB = experimentService.getExperiment(expB.id)
    assert.equal(detailB!.target, 'service-b')
  })

  /** ✅ 正常流程: 并行实验中一个触发回滚，不影响另一个 */
  it('✅ 正例: 一个实验回滚不影响并行实验', async () => {
    const expA = experimentService.createExperiment(
      'rollback-a',
      'service-a',
      { type: 'LATENCY', target: 'service-a', params: { delayMs: 100 } },
    )
    const expB = experimentService.createExperiment(
      'stable-b',
      'service-b',
      { type: 'ERROR', target: 'service-b', params: { errorRate: 10 } },
    )

    // 实验A: 运行并持续不健康
    await experimentService.runExperiment(expA.id)
    const bad = unhealthyMetrics()
    rollbackService.monitorExperiment(expA.id, bad)
    rollbackService.monitorExperiment(expA.id, bad)
    rollbackService.monitorExperiment(expA.id, bad)
    const rollbackA = await rollbackService.triggerRollbackIfNeeded(expA.id, 'A failed')

    // 实验B: 保持健康
    const good = healthyMetrics()
    rollbackService.monitorExperiment(expB.id, good)
    rollbackService.monitorExperiment(expB.id, good)
    const rollbackB = await rollbackService.triggerRollbackIfNeeded(expB.id, 'B should not trigger')

    // 验证: A 已回滚, B 未触发
    assert.ok(rollbackA)
    assert.equal(rollbackA!.experimentId, expA.id)
    assert.equal(rollbackB, undefined)

    // 回滚历史应只包含A
    const allHistory = rollbackService.getRollbackHistory()
    assert.equal(allHistory.length, 1)
    assert.equal(allHistory[0].experimentId, expA.id)
  })

  /** 🔲 边界: 同一目标被注入多种故障 */
  it('🔲 边界: 同一目标叠加多种故障', () => {
    // 对 service-x 同时注入延迟和错误
    faultService.injectLatency('service-x', 300)
    faultService.injectError('service-x', 50)

    // 延迟注入覆盖了错误注入的记录（同一target, 后者覆盖前者类型）
    // 但两个类型功能独立
    assert.equal(faultService.getNetworkLatency('service-x'), 300)
    assert.equal(faultService.isFaultActive('service-x'), true)

    // 停止延迟故障
    faultService.stopInjection('service-x')
    assert.equal(faultService.getNetworkLatency('service-x'), 0)

    // 停止后错误注入也停止（因为同一个 target key 被 stop 清除）
    // 这是 Service 的设计行为：stopInjection 从 map 删除整个 entry
    assert.equal(faultService.isFaultActive('service-x'), false)
  })
})

// ═══════════════════════════════════════════════════════
// 场景3: 故障注入类型覆盖与边界值
// ═══════════════════════════════════════════════════════
describe('场景3: 故障注入覆盖与边界值', () => {
  let faultService: FaultInjectionService

  beforeEach(() => {
    faultService = new FaultInjectionService()
  })

  /** ✅ 正常流程: 四种故障类型全覆盖 */
  it('✅ 正例: 四种故障类型正确注入与查询', () => {
    // 延迟
    faultService.injectLatency('svc-latency', 1000)
    assert.equal(faultService.getNetworkLatency('svc-latency'), 1000)

    // 错误
    faultService.injectError('svc-error', 30)
    const errFault = faultService.getActiveFault('svc-error')
    assert.equal(errFault!.type, 'ERROR')
    assert.equal(errFault!.params['errorRate'], 30)

    // 超时
    faultService.injectTimeout('svc-timeout', 5000)
    const timeoutInfo = faultService.isTimeoutEnabled('svc-timeout')
    assert.equal(timeoutInfo.enabled, true)
    assert.equal(timeoutInfo.timeoutMs, 5000)

    // CPU
    faultService.injectCPUBurn('svc-cpu', 90)
    assert.equal(faultService.getCPUBurnPercentage('svc-cpu'), 90)
  })

  /** 🔲 边界: 故障参数边界值 */
  it('🔲 边界: 故障参数边界值处理', () => {
    // 延迟为0
    faultService.injectLatency('svc-zero', 0)
    assert.equal(faultService.getNetworkLatency('svc-zero'), 0)

    // 错误率 clamp
    faultService.injectError('svc-over', 200)
    assert.equal(faultService.getActiveFault('svc-over')!.params['errorRate'], 100)

    faultService.injectError('svc-under', -50)
    assert.equal(faultService.getActiveFault('svc-under')!.params['errorRate'], 0)

    // CPU clamp
    faultService.injectCPUBurn('svc-cpu-over', 150)
    assert.equal(faultService.getCPUBurnPercentage('svc-cpu-over'), 100)

    // 未注入的查询默认值
    assert.equal(faultService.getNetworkLatency('never-injected'), 0)
    assert.equal(faultService.getCPUBurnPercentage('never-injected'), 0)
    assert.equal(faultService.isTimeoutEnabled('never-injected').enabled, false)
    assert.equal(faultService.isFaultActive('never-injected'), false)
  })

  /** ❌ 反例: 停止不存在的故障注入 */
  it('❌ 反例: 停止不存在的故障返回 false', () => {
    const result = faultService.stopInjection('never-created-target')
    assert.equal(result, false)
  })
})

// ═══════════════════════════════════════════════════════
// 场景4: 实验结果记录与完整回滚链路
// ═══════════════════════════════════════════════════════
describe('场景4: 实验结果记录与回滚链路', () => {
  let experimentService: ChaosExperimentService
  let rollbackService: ChaosAutoRollbackService

  beforeEach(() => {
    experimentService = new ChaosExperimentService()
    rollbackService = new ChaosAutoRollbackService()

    rollbackService.resetForTests()
  })

  afterEach(() => {
    rollbackService.resetForTests()
  })

  /** ✅ 正常流程: 记录实验结果并提供结果查询 */
  it('✅ 正例: 实验结果可记录和查询', () => {
    const experiment = experimentService.createExperiment(
      'result-check',
      'data-service',
      { type: 'LATENCY', target: 'data-service', params: { delayMs: 100 } },
    )

    const result = {
      success: true,
      durationMs: 3500,
      metrics: {
        requestsTotal: 5000,
        requestsFailed: 23,
        latencyAvg: 120,
        latencyP99: 350,
        errorRate: 0.0046,
      },
      faultsTriggered: 1,
      rollbackTriggered: false,
      summary: 'All assertions passed within tolerance',
    }

    experimentService.completeExperiment(experiment.id, result)
    const retrieved = experimentService.getExperimentResult(experiment.id)
    assert.ok(retrieved)
    assert.equal(retrieved!.success, true)
    assert.equal(retrieved!.durationMs, 3500)
    assert.equal(retrieved!.metrics.requestsTotal, 5000)
    assert.equal(retrieved!.summary, 'All assertions passed within tolerance')
  })

  /** ✅ 正常流程: 失败实验结果记录 */
  it('✅ 正例: 失败实验结果正确记录', () => {
    const experiment = experimentService.createExperiment(
      'fail-result',
      'critical-service',
      { type: 'TIMEOUT', target: 'critical-service', params: { timeoutMs: 2000 } },
    )

    const failResult = {
      success: false,
      durationMs: 12000,
      metrics: {
        requestsTotal: 100,
        requestsFailed: 95,
        latencyAvg: 3000,
        latencyP99: 8000,
        errorRate: 0.95,
      },
      faultsTriggered: 2,
      rollbackTriggered: true,
      summary: 'Experiment failed: error rate exceeded threshold',
    }

    experimentService.completeExperiment(experiment.id, failResult)
    const retrieved = experimentService.getExperimentResult(experiment.id)
    assert.ok(retrieved)
    assert.equal(retrieved!.success, false)
    assert.equal(retrieved!.rollbackTriggered, true)
    assert.equal(retrieved!.metrics.errorRate, 0.95)
  })

  /** ✅ 正例: 多次回滚记录上下文隔离 */
  it('✅ 正例: 不同实验的回滚历史互不干扰', async () => {
    const bad = unhealthyMetrics()

    // 实验X 触发1次回滚
    const expX = experimentService.createExperiment('exp-x', 'svc-x', { type: 'ERROR', target: 'svc-x', params: { errorRate: 50 } })
    rollbackService.monitorExperiment(expX.id, bad)
    rollbackService.monitorExperiment(expX.id, bad)
    rollbackService.monitorExperiment(expX.id, bad)
    await rollbackService.triggerRollbackIfNeeded(expX.id, 'X rollback')

    // 实验Y 触发2次回滚
    const expY = experimentService.createExperiment('exp-y', 'svc-y', { type: 'LATENCY', target: 'svc-y', params: { delayMs: 300 } })
    rollbackService.monitorExperiment(expY.id, bad)
    rollbackService.monitorExperiment(expY.id, bad)
    rollbackService.monitorExperiment(expY.id, bad)
    await rollbackService.triggerRollbackIfNeeded(expY.id, 'Y rollback 1')

    // Y 再触发一次
    rollbackService.resetHealthChecks(expY.id)
    rollbackService.monitorExperiment(expY.id, bad)
    rollbackService.monitorExperiment(expY.id, bad)
    rollbackService.monitorExperiment(expY.id, bad)
    await rollbackService.triggerRollbackIfNeeded(expY.id, 'Y rollback 2')

    // 验证: X有1条, Y有2条
    const xHistory = rollbackService.getRollbackHistoryForExperiment(expX.id)
    const yHistory = rollbackService.getRollbackHistoryForExperiment(expY.id)
    assert.equal(xHistory.length, 1)
    assert.equal(yHistory.length, 2)
    assert.equal(yHistory[0].reason, 'Y rollback 2')
    assert.equal(yHistory[1].reason, 'Y rollback 1')
  })

  /** 🔲 边界: 无结果的实验抛出 undefined */
  it('🔲 边界: 未完成的实验无结果', () => {
    const experiment = experimentService.createExperiment(
      'no-result',
      'svc-z',
      { type: 'LATENCY', target: 'svc-z', params: { delayMs: 100 } },
    )
    const result = experimentService.getExperimentResult(experiment.id)
    assert.equal(result, undefined)
  })
})
