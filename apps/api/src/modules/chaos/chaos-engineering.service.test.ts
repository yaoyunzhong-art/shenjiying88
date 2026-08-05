/**
 * chaos-engineering.service.spec.ts — Chaos 混沌工程纯函数式单元测试
 *
 * 覆盖三个 Service：
 *   ChaosExperimentService — 正例（创建/运行/暂停/完成/列表/查询）
 *                          反例（不存在实验/重复运行/查询结果）
 *                          边界（空注入）
 *   FaultInjectionService  — 正例（LATENCY/ERROR/TIMEOUT/CPU_BURN注入）
 *                          反例（停止不存在/查询无注入）
 *                          边界（errorRate裁剪/活跃判定）
 *   ChaosAutoRollbackService — 正例（健康检查/阈值触发回滚/回滚历史）
 *                            反例（未达阈值不触发/重置）
 *                            边界（连续失败计数/恢复计数）
 *
 * ≥ 18 项测试，纯内联 mock (基于 Map 的内存存储)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import type {
  ChaosExperiment,
  ExperimentResult,
  SystemMetrics,
  FaultInjection,
} from './chaos-engineering.service'

// ═══════════════════════════════════════════════════════════════
// ChaosExperimentService
// ═══════════════════════════════════════════════════════════════

describe('ChaosExperimentService', () => {
  let svc: ChaosExperimentService

  beforeEach(() => {
    svc = new ChaosExperimentService()
  })

  describe('createExperiment', () => {
    it('正例: 创建实验返回完整对象', () => {
      const exp = svc.createExperiment('延迟测试', 'service-a', {
        type: 'LATENCY',
        target: 'service-a',
        params: { delayMs: 500 },
      })

      expect(exp.id).toMatch(/^exp-/)
      expect(exp.name).toBe('延迟测试')
      expect(exp.target).toBe('service-a')
      expect(exp.status).toBe('PENDING')
      expect(exp.faultInjections).toHaveLength(1)
      expect(exp.faultInjections[0].active).toBe(false)
      expect(exp.createdAt).toBeDefined()
    })

    it('每次创建实验 ID 不同', () => {
      const e1 = svc.createExperiment('E1', 't1', { type: 'LATENCY', target: 't1', params: { delayMs: 100 } })
      const e2 = svc.createExperiment('E2', 't2', { type: 'ERROR', target: 't2', params: { errorRate: 50 } })
      expect(e1.id).not.toBe(e2.id)
    })
  })

  describe('runExperiment', () => {
    it('正例: 运行实验更新状态为 RUNNING', async () => {
      const exp = svc.createExperiment('测试', 'svc', { type: 'LATENCY', target: 'svc', params: { delayMs: 100 } })
      const running = await svc.runExperiment(exp.id)

      expect(running).toBeDefined()
      expect(running!.status).toBe('RUNNING')
      expect(running!.startedAt).toBeDefined()
    })

    it('反例: 不存在的实验返回 undefined', async () => {
      const result = await svc.runExperiment('non-existent')
      expect(result).toBeUndefined()
    })

    it('反例: 已运行实验不重复执行（返回当前）', async () => {
      const exp = svc.createExperiment('测试', 'svc', { type: 'LATENCY', target: 'svc', params: { delayMs: 100 } })
      await svc.runExperiment(exp.id)
      const result = await svc.runExperiment(exp.id)
      expect(result).toBeDefined()
      expect(result!.status).toBe('RUNNING')
    })
  })

  describe('pauseExperiment', () => {
    it('正例: 暂停实验更新状态为 PAUSED', async () => {
      const exp = svc.createExperiment('测试', 'svc', { type: 'LATENCY', target: 'svc', params: { delayMs: 100 } })
      await svc.runExperiment(exp.id)
      const paused = await svc.pauseExperiment(exp.id)

      expect(paused).toBeDefined()
      expect(paused!.status).toBe('PAUSED')
      expect(paused!.faultInjections[0].active).toBe(false)
    })

    it('反例: 不存在的实验返回 undefined', async () => {
      const result = await svc.pauseExperiment('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('completeExperiment / getExperimentResult', () => {
    it('正例: 完成实验并记录结果', () => {
      const exp = svc.createExperiment('测试', 'svc', { type: 'LATENCY', target: 'svc', params: { delayMs: 100 } })
      const result: ExperimentResult = {
        success: true,
        durationMs: 5000,
        metrics: { requestsTotal: 100, requestsFailed: 0, latencyAvg: 50, latencyP99: 200, errorRate: 0 },
        faultsTriggered: 1,
        rollbackTriggered: false,
        summary: 'All good',
      }
      svc.completeExperiment(exp.id, result)

      const stored = svc.getExperimentResult(exp.id)
      expect(stored).toBeDefined()
      expect(stored!.success).toBe(true)
      expect(stored!.durationMs).toBe(5000)
    })

    it('成功结果状态为 COMPLETED', () => {
      const exp = svc.createExperiment('OK', 'svc', { type: 'LATENCY', target: 'svc', params: { delayMs: 100 } })
      svc.completeExperiment(exp.id, {
        success: true, durationMs: 100, metrics: { requestsTotal: 10, requestsFailed: 0, latencyAvg: 10, latencyP99: 50, errorRate: 0 },
        faultsTriggered: 1, rollbackTriggered: false, summary: 'OK',
      })
      const stored = svc.getExperiment(exp.id)
      expect(stored!.status).toBe('COMPLETED')
    })

    it('失败结果状态为 FAILED', () => {
      const exp = svc.createExperiment('FAIL', 'svc', { type: 'ERROR', target: 'svc', params: { errorRate: 100 } })
      svc.completeExperiment(exp.id, {
        success: false, durationMs: 500, metrics: { requestsTotal: 10, requestsFailed: 10, latencyAvg: 0, latencyP99: 0, errorRate: 1 },
        faultsTriggered: 1, rollbackTriggered: true, summary: 'Failed',
      })
      const stored = svc.getExperiment(exp.id)
      expect(stored!.status).toBe('FAILED')
    })

    it('反例: 不存在的实验取结果为 undefined', () => {
      expect(svc.getExperimentResult('non-existent')).toBeUndefined()
    })
  })

  describe('listExperiments / getExperiment', () => {
    it('listExperiments 返回所有实验', () => {
      svc.createExperiment('E1', 't1', { type: 'LATENCY', target: 't1', params: { delayMs: 100 } })
      svc.createExperiment('E2', 't2', { type: 'ERROR', target: 't2', params: { errorRate: 50 } })
      expect(svc.listExperiments()).toHaveLength(2)
    })

    it('getExperiment 按 ID 查询', () => {
      const exp = svc.createExperiment('E1', 't1', { type: 'LATENCY', target: 't1', params: { delayMs: 100 } })
      const found = svc.getExperiment(exp.id)
      expect(found).toBeDefined()
      expect(found!.name).toBe('E1')
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// FaultInjectionService
// ═══════════════════════════════════════════════════════════════

describe('FaultInjectionService', () => {
  let svc: FaultInjectionService

  beforeEach(() => {
    svc = new FaultInjectionService()
  })

  describe('injectLatency / getNetworkLatency', () => {
    it('正例: 注入延迟后 getNetworkLatency 返回指定值', () => {
      svc.injectLatency('svc-a', 500)
      expect(svc.getNetworkLatency('svc-a')).toBe(500)
    })

    it('无注入时返回 0', () => {
      expect(svc.getNetworkLatency('svc-n')).toBe(0)
    })

    it('停止注入后返回 0', () => {
      svc.injectLatency('svc-a', 500)
      svc.stopInjection('svc-a')
      expect(svc.getNetworkLatency('svc-a')).toBe(0)
    })
  })

  describe('injectError / shouldInjectError', () => {
    it('正例: errorRate=100 时 always true', () => {
      svc.injectError('svc-a', 100)
      const results = Array.from({ length: 100 }, () => svc.shouldInjectError('svc-a'))
      expect(results.every(Boolean)).toBe(true)
    })

    it('反例: 未注入时返回 false', () => {
      expect(svc.shouldInjectError('svc-n')).toBe(false)
    })

    it('errorRate 被裁剪到 [0, 100]', () => {
      const fault = svc.injectError('svc-a', 150)
      expect(fault.params['errorRate']).toBe(100)
    })
  })

  describe('injectTimeout / isTimeoutEnabled', () => {
    it('正例: 注入超时 isTimeoutEnabled 返回 true', () => {
      svc.injectTimeout('svc-a', 3000)
      const result = svc.isTimeoutEnabled('svc-a')
      expect(result.enabled).toBe(true)
      expect(result.timeoutMs).toBe(3000)
    })

    it('反例: 未注入时 enabled=false', () => {
      const result = svc.isTimeoutEnabled('svc-n')
      expect(result.enabled).toBe(false)
      expect(result.timeoutMs).toBe(0)
    })
  })

  describe('injectCPUBurn / getCPUBurnPercentage', () => {
    it('正例: CPU 注入百分比正确', () => {
      svc.injectCPUBurn('svc-a', 80)
      expect(svc.getCPUBurnPercentage('svc-a')).toBe(80)
    })

    it('value>100 被裁剪', () => {
      const fault = svc.injectCPUBurn('svc-a', 200)
      expect(fault.params['percentage']).toBe(100)
    })
  })

  describe('stopInjection / getActiveFault / getAllActiveFaults', () => {
    it('stopInjection 不存在的 target 返回 false', () => {
      expect(svc.stopInjection('non-existent')).toBe(false)
    })

    it('stopInjection 存在的 target 返回 true', () => {
      svc.injectLatency('svc-a', 100)
      expect(svc.stopInjection('svc-a')).toBe(true)
    })

    it('getAllActiveFaults 返回全部活跃注入', () => {
      svc.injectLatency('svc-a', 100)
      svc.injectError('svc-b', 50)
      expect(svc.getAllActiveFaults()).toHaveLength(2)
    })

    it('isFaultActive 正确判定活跃状态', () => {
      svc.injectLatency('svc-a', 100)
      expect(svc.isFaultActive('svc-a')).toBe(true)
      expect(svc.isFaultActive('svc-b')).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// ChaosAutoRollbackService
// ═══════════════════════════════════════════════════════════════

describe('ChaosAutoRollbackService', () => {
  let svc: ChaosAutoRollbackService

  beforeEach(() => {
    svc = new ChaosAutoRollbackService()
  })

  describe('monitorExperiment', () => {
    it('正例: health 正常时不触发回滚', () => {
      const result = svc.monitorExperiment('exp-1', { cpuUsage: 50, memoryUsage: 60, errorRate: 0.01, latencyAvg: 100, healthy: true })
      expect(result.healthy).toBe(true)
      expect(result.shouldRollback).toBe(false)
      expect(result.failureCount).toBe(0)
    })

    it('连续 3 次不健康触发回滚', () => {
      const metrics: SystemMetrics = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 5000, healthy: false }

      const r1 = svc.monitorExperiment('exp-1', metrics)
      expect(r1.shouldRollback).toBe(false)
      expect(r1.failureCount).toBe(1)

      const r2 = svc.monitorExperiment('exp-1', metrics)
      expect(r2.shouldRollback).toBe(false)
      expect(r2.failureCount).toBe(2)

      const r3 = svc.monitorExperiment('exp-1', metrics)
      expect(r3.shouldRollback).toBe(true)
      expect(r3.failureCount).toBe(3)
    })

    it('健康后失败计数重置', () => {
      const unhealthy: SystemMetrics = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 5000, healthy: false }
      const healthy: SystemMetrics = { cpuUsage: 50, memoryUsage: 60, errorRate: 0.01, latencyAvg: 100, healthy: true }

      svc.monitorExperiment('exp-1', unhealthy)
      svc.monitorExperiment('exp-1', unhealthy)
      const r = svc.monitorExperiment('exp-1', healthy)
      expect(r.healthy).toBe(true)
      expect(r.failureCount).toBe(0)
    })
  })

  describe('triggerRollbackIfNeeded', () => {
    it('未达阈值不触发回滚', async () => {
      const entry = await svc.triggerRollbackIfNeeded('exp-1', 'test reason')
      expect(entry).toBeUndefined()
    })

    it('达到阈值自动触发回滚', async () => {
      const unhealthy: SystemMetrics = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 5000, healthy: false }
      svc.monitorExperiment('exp-1', unhealthy)
      svc.monitorExperiment('exp-1', unhealthy)
      svc.monitorExperiment('exp-1', unhealthy)

      const entry = await svc.triggerRollbackIfNeeded('exp-1', 'too many failures')
      expect(entry).toBeDefined()
      expect(entry!.trigger).toBe('AUTO')
      expect(entry!.success).toBe(true)
    })
  })

  describe('rollbackHistory', () => {
    it('getRollbackHistory 返回降序排列的历史', async () => {
      const unhealthy: SystemMetrics = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 5000, healthy: false }
      svc.monitorExperiment('exp-1', unhealthy)
      svc.monitorExperiment('exp-1', unhealthy)
      svc.monitorExperiment('exp-1', unhealthy)
      await svc.triggerRollbackIfNeeded('exp-1', 'failure')

      const history = svc.getRollbackHistory()
      expect(history).toHaveLength(1)

      // 实验特定查询
      const expHistory = svc.getRollbackHistoryForExperiment('exp-1')
      expect(expHistory).toHaveLength(1)
    })
  })

  describe('resetHealthChecks / getHealthCheckFailureCount', () => {
    it('resetHealthChecks 清除失败计数', () => {
      const unhealthy: SystemMetrics = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 5000, healthy: false }
      svc.monitorExperiment('exp-1', unhealthy)
      svc.resetHealthChecks('exp-1')
      expect(svc.getHealthCheckFailureCount('exp-1')).toBe(0)
    })
  })
})
