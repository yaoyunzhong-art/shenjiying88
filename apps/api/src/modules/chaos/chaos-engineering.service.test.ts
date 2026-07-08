/**
 * chaos-engineering.service.test.ts · 混沌工程服务 单元测试
 * 🐜 自动: [chaos] [D] service test 补全
 *
 * 覆盖 3 个 service：
 * - ChaosExperimentService（创建/运行/暂停/完成/查询）
 * - FaultInjectionService（4种故障注入/停止/查询/条件检测）
 * - ChaosAutoRollbackService（健康监控/自动回滚/历史）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import type { SystemMetrics } from './chaos-engineering.service'

describe('ChaosExperimentService', () => {
  let service: ChaosExperimentService

  beforeEach(() => {
    service = new ChaosExperimentService()
  })

  describe('createExperiment', () => {
    it('正例: 创建实验返回完整对象', () => {
      const exp = service.createExperiment('延迟测试', 'svc-order', {
        type: 'LATENCY',
        target: 'svc-order',
        params: { delayMs: 200 },
      })

      expect(exp.id).toMatch(/^exp-/)
      expect(exp.name).toBe('延迟测试')
      expect(exp.target).toBe('svc-order')
      expect(exp.status).toBe('PENDING')
      expect(exp.faultInjections).toHaveLength(1)
      expect(exp.faultInjections[0].type).toBe('LATENCY')
      expect(exp.faultInjections[0].active).toBe(false)
    })

    it('正例: 多次创建生成不同 id', () => {
      const a = service.createExperiment('A', 't1', { type: 'ERROR', target: 't1', params: { errorRate: 10 } })
      const b = service.createExperiment('B', 't2', { type: 'TIMEOUT', target: 't2', params: { timeoutMs: 3000 } })
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('runExperiment', () => {
    it('正例: 启动实验返回 RUNNING 状态', async () => {
      const exp = service.createExperiment('运行测试', 'svc-pay', { type: 'ERROR', target: 'svc-pay', params: { errorRate: 5 } })
      const running = await service.runExperiment(exp.id)

      expect(running).toBeDefined()
      expect(running!.status).toBe('RUNNING')
      expect(running!.startedAt).toBeDefined()
      expect(running!.faultInjections[0].active).toBe(true)
    })

    it('反例: 启动不存在的实验返回 undefined', async () => {
      const result = await service.runExperiment('exp-ghost')
      expect(result).toBeUndefined()
    })

    it('反例: 重复启动不报错但保留状态', async () => {
      const exp = service.createExperiment('重复', 'svc-x', { type: 'CPU_BURN', target: 'svc-x', params: { percentage: 80 } })
      await service.runExperiment(exp.id)
      const again = await service.runExperiment(exp.id)

      expect(again).toBeDefined()
      expect(again!.status).toBe('RUNNING')
    })
  })

  describe('pauseExperiment', () => {
    it('正例: 暂停实验返回 PAUSED', async () => {
      const exp = service.createExperiment('暂停测试', 'svc-db', { type: 'LATENCY', target: 'svc-db', params: { delayMs: 500 } })
      await service.runExperiment(exp.id)
      const paused = await service.pauseExperiment(exp.id)

      expect(paused).toBeDefined()
      expect(paused!.status).toBe('PAUSED')
      expect(paused!.faultInjections[0].active).toBe(false)
    })

    it('反例: 暂停不存在的实验返回 undefined', async () => {
      const result = await service.pauseExperiment('exp-missing')
      expect(result).toBeUndefined()
    })
  })

  describe('completeExperiment & getExperimentResult', () => {
    it('正例: 完成实验并记录结果', () => {
      const exp = service.createExperiment('完成测试', 'svc-log', { type: 'ERROR', target: 'svc-log', params: { errorRate: 1 } })

      service.completeExperiment(exp.id, {
        success: true,
        durationMs: 15000,
        metrics: {
          requestsTotal: 1000,
          requestsFailed: 5,
          latencyAvg: 120,
          latencyP99: 450,
          errorRate: 0.5,
        },
        faultsTriggered: 1,
        rollbackTriggered: false,
        summary: '测试通过，错误率0.5%',
      })

      const completed = service.getExperiment(exp.id)
      expect(completed!.status).toBe('COMPLETED')
      expect(completed!.completedAt).toBeDefined()
      expect(completed!.results).toBeDefined()
      expect(completed!.results!.success).toBe(true)

      const result = service.getExperimentResult(exp.id)
      expect(result).toBeDefined()
      expect(result!.metrics.errorRate).toBe(0.5)
    })
  })

  describe('listExperiments', () => {
    it('正例: 返回所有实验', () => {
      service.createExperiment('A', 't1', { type: 'ERROR', target: 't1', params: { errorRate: 10 } })
      service.createExperiment('B', 't2', { type: 'LATENCY', target: 't2', params: { delayMs: 100 } })
      expect(service.listExperiments()).toHaveLength(2)
    })

    it('边界: 空列表返回空数组', () => {
      expect(service.listExperiments()).toEqual([])
    })
  })
})

// ── FaultInjectionService ─────────────────────────────────────────────────────

describe('FaultInjectionService', () => {
  let service: FaultInjectionService

  beforeEach(() => {
    service = new FaultInjectionService()
  })

  describe('injectLatency', () => {
    it('正例: 注入延迟故障', () => {
      const fault = service.injectLatency('svc-order', 300)
      expect(fault.type).toBe('LATENCY')
      expect(fault.params.delayMs).toBe(300)
      expect(fault.active).toBe(true)
    })
  })

  describe('injectError', () => {
    it('正例: 注入错误率故障（clamp 边界）', () => {
      const fault = service.injectError('svc-pay', 150)
      expect(fault.params.errorRate).toBe(100)
    })

    it('反例: 负数 errorRate 被 clamp 到 0', () => {
      const fault = service.injectError('svc-pay', -10)
      expect(fault.params.errorRate).toBe(0)
    })
  })

  describe('injectTimeout', () => {
    it('正例: 注入超时故障', () => {
      const fault = service.injectTimeout('svc-db', 5000)
      expect(fault.type).toBe('TIMEOUT')
      expect(fault.params.timeoutMs).toBe(5000)
    })
  })

  describe('injectCPUBurn', () => {
    it('正例: 注入 CPU 烧毁故障', () => {
      const fault = service.injectCPUBurn('svc-ai', 85)
      expect(fault.type).toBe('CPU_BURN')
      expect(fault.params.percentage).toBe(85)
    })

    it('边界: 百分比 clamp 到 0-100', () => {
      const over = service.injectCPUBurn('svc-ai', 200)
      expect(over.params.percentage).toBe(100)

      const under = service.injectCPUBurn('svc-ai', -5)
      expect(under.params.percentage).toBe(0)
    })
  })

  describe('stopInjection', () => {
    it('正例: 停止故障注入', () => {
      service.injectLatency('svc-order', 100)
      const result = service.stopInjection('svc-order')
      expect(result).toBe(true)
      expect(service.isFaultActive('svc-order')).toBe(false)
    })

    it('反例: 停止不存在的故障返回 false', () => {
      expect(service.stopInjection('nobody')).toBe(false)
    })
  })

  describe('query methods', () => {
    beforeEach(() => {
      service.injectLatency('svc-order', 200)
      service.injectError('svc-pay', 30)
      service.injectTimeout('svc-db', 3000)
    })

    it('getActiveFault 返回指定故障', () => {
      const fault = service.getActiveFault('svc-order')
      expect(fault).toBeDefined()
      expect(fault!.type).toBe('LATENCY')
    })

    it('getAllActiveFaults 返回所有活动故障', () => {
      expect(service.getAllActiveFaults()).toHaveLength(3)
    })

    it('isFaultActive 正确判断', () => {
      expect(service.isFaultActive('svc-order')).toBe(true)
      expect(service.isFaultActive('nonexistent')).toBe(false)
    })

    it('getNetworkLatency 返回延迟值', () => {
      expect(service.getNetworkLatency('svc-order')).toBe(200)
      expect(service.getNetworkLatency('svc-pay')).toBe(0)
    })

    it('shouldInjectError 基于错误率判断', () => {
      // mock Math.random 来测试确定性
      const origRandom = Math.random
      Math.random = () => 0.1 // 10% < 30% → true
      expect(service.shouldInjectError('svc-pay')).toBe(true)

      Math.random = () => 0.5 // 50% > 30% → false
      expect(service.shouldInjectError('svc-pay')).toBe(false)

      Math.random = origRandom
    })

    it('shouldInjectError 对非ERROR类型返回 false', () => {
      expect(service.shouldInjectError('svc-order')).toBe(false)
    })

    it('isTimeoutEnabled 返回超时状态', () => {
      const result = service.isTimeoutEnabled('svc-db')
      expect(result.enabled).toBe(true)
      expect(result.timeoutMs).toBe(3000)
    })

    it('getCPUBurnPercentage 返回 CPU 烧毁百分比', () => {
      service.injectCPUBurn('svc-ai', 75)
      expect(service.getCPUBurnPercentage('svc-ai')).toBe(75)
    })

    it('getCPUBurnPercentage 对非CPU类型返回 0', () => {
      expect(service.getCPUBurnPercentage('svc-order')).toBe(0)
    })
  })
})

// ── ChaosAutoRollbackService ─────────────────────────────────────────────────

describe('ChaosAutoRollbackService', () => {
  let service: ChaosAutoRollbackService

  beforeEach(() => {
    service = new ChaosAutoRollbackService()
    service.resetForTests()
  })

  describe('monitorExperiment', () => {
    const healthyMetrics: SystemMetrics = {
      cpuUsage: 30,
      memoryUsage: 50,
      errorRate: 0.1,
      latencyAvg: 100,
      healthy: true,
    }

    const unhealthyMetrics: SystemMetrics = {
      cpuUsage: 98,
      memoryUsage: 95,
      errorRate: 15,
      latencyAvg: 5000,
      healthy: false,
    }

    it('正例: 健康指标返回 healthy', () => {
      const result = service.monitorExperiment('exp-001', healthyMetrics)
      expect(result.healthy).toBe(true)
      expect(result.shouldRollback).toBe(false)
      expect(result.failureCount).toBe(0)
    })

    it('正例: 健康恢复后重置失败计数', () => {
      service.monitorExperiment('exp-002', unhealthyMetrics)
      service.monitorExperiment('exp-002', unhealthyMetrics)
      const beforeRestore = service.getHealthCheckFailureCount('exp-002')
      expect(beforeRestore).toBe(2)

      // 恢复健康
      const restored = service.monitorExperiment('exp-002', healthyMetrics)
      expect(restored.healthy).toBe(true)
      expect(restored.failureCount).toBe(0)
      expect(service.getHealthCheckFailureCount('exp-002')).toBe(0)
    })

    it('边界: 连续3次不健康触发回滚', () => {
      for (let i = 0; i < 3; i++) {
        service.monitorExperiment('exp-003', unhealthyMetrics)
      }
      const result = service.monitorExperiment('exp-003', unhealthyMetrics)
      expect(result.healthy).toBe(false)
      expect(result.shouldRollback).toBe(true)
      expect(result.failureCount).toBe(4) // 第4次失败
    })
  })

  describe('triggerRollbackIfNeeded', () => {
    it('正例: 达到阈值触发自动回滚', async () => {
      const unhealthy: SystemMetrics = { cpuUsage: 99, memoryUsage: 99, errorRate: 30, latencyAvg: 10000, healthy: false }

      for (let i = 0; i < 3; i++) {
        service.monitorExperiment('exp-rb', unhealthy)
      }

      const entry = await service.triggerRollbackIfNeeded('exp-rb', 'CPU 使用率异常')

      expect(entry).toBeDefined()
      expect(entry!.trigger).toBe('AUTO')
      expect(entry!.experimentId).toBe('exp-rb')
      expect(entry!.reason).toBe('CPU 使用率异常')
      expect(entry!.success).toBe(true)
      expect(entry!.completedAt).toBeDefined()
    })

    it('反例: 未达到阈值不触发回滚', async () => {
      const unhealthy: SystemMetrics = { cpuUsage: 99, memoryUsage: 99, errorRate: 30, latencyAvg: 10000, healthy: false }

      // 只有 2 次失败（阈值 3）
      service.monitorExperiment('exp-no-rb', unhealthy)
      service.monitorExperiment('exp-no-rb', unhealthy)

      const entry = await service.triggerRollbackIfNeeded('exp-no-rb', '测试中')
      expect(entry).toBeUndefined()
    })

    it('正例: 记录回滚历史', async () => {
      const unhealthy: SystemMetrics = { cpuUsage: 90, memoryUsage: 90, errorRate: 20, latencyAvg: 5000, healthy: false }

      for (let i = 0; i < 3; i++) {
        service.monitorExperiment('exp-hist', unhealthy)
      }
      await service.triggerRollbackIfNeeded('exp-hist', '内存溢出')

      const history = service.getRollbackHistoryForExperiment('exp-hist')
      expect(history).toHaveLength(1)
      expect(history[0].reason).toBe('内存溢出')

      const all = service.getRollbackHistory()
      expect(all.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('resetHealthChecks', () => {
    it('正例: 重置后失败计数归零', () => {
      const unhealthy: SystemMetrics = { cpuUsage: 98, memoryUsage: 98, errorRate: 10, latencyAvg: 3000, healthy: false }
      service.monitorExperiment('exp-reset', unhealthy)
      service.monitorExperiment('exp-reset', unhealthy)

      service.resetHealthChecks('exp-reset')
      expect(service.getHealthCheckFailureCount('exp-reset')).toBe(0)
    })
  })
})
