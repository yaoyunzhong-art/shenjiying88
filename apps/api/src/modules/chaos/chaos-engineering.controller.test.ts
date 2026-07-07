import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import {
  CreateExperimentDto,
  InjectFaultDto,
  HealthMetricDto,
} from './chaos-engineering.dto'
import type { ChaosExperiment, FaultInjection, SystemMetrics } from './chaos-engineering.entity'

describe('ChaosEngineeringController', () => {
  let controller: ChaosEngineeringController
  let experimentService: ChaosExperimentService
  let faultService: FaultInjectionService
  let rollbackService: ChaosAutoRollbackService

  beforeEach(() => {
    experimentService = new ChaosExperimentService()
    faultService = new FaultInjectionService()
    rollbackService = new ChaosAutoRollbackService()
    controller = new ChaosEngineeringController(
      experimentService,
      faultService,
      rollbackService,
    )
  })

  // ─── 实验创建 ───────────────────────────────────────────────────

  describe('createExperiment', () => {
    it('CTRL-1 should create experiment with valid input', () => {
      const dto: CreateExperimentDto = {
        name: 'latency-test',
        target: 'api-service',
        faultType: 'LATENCY',
        faultTarget: 'api-service',
        faultParams: { delayMs: 500 },
      }
      const result = controller.createExperiment(dto)
      expect(result.name).toBe('latency-test')
      expect(result.status).toBe('PENDING')
      expect(result.id).toBeDefined()
      expect(result.target).toBe('api-service')
    })

    it('CTRL-2 should create experiment with each fault type', () => {
      const types: Array<CreateExperimentDto['faultType']> = ['LATENCY', 'ERROR', 'TIMEOUT', 'CPU_BURN']
      for (const faultType of types) {
        const dto: CreateExperimentDto = {
          name: `${faultType}-test`,
          target: 'test-svc',
          faultType,
          faultTarget: 'test-svc',
          faultParams: { value: 100 },
        }
        const result = controller.createExperiment(dto)
        expect(result.faultInjections[0].type).toBe(faultType)
      }
    })
  })

  // ─── 实验列表 & 获取 ────────────────────────────────────────────

  describe('listExperiments', () => {
    it('CTRL-3 should return empty list when no experiments', () => {
      const result = controller.listExperiments()
      expect(result).toEqual([])
    })

    it('CTRL-4 should return all created experiments', () => {
      controller.createExperiment({
        name: 'exp-1', target: 'svc-a', faultType: 'LATENCY',
        faultTarget: 'svc-a', faultParams: { delayMs: 200 },
      })
      controller.createExperiment({
        name: 'exp-2', target: 'svc-b', faultType: 'ERROR',
        faultTarget: 'svc-b', faultParams: { rate: 30 },
      })
      const result = controller.listExperiments()
      expect(result).toHaveLength(2)
    })
  })

  describe('getExperiment', () => {
    it('CTRL-5 should get experiment by id', () => {
      const created = controller.createExperiment({
        name: 'get-test', target: 'svc', faultType: 'TIMEOUT',
        faultTarget: 'svc', faultParams: { ms: 1000 },
      })
      const result = controller.getExperiment(created.id)
      expect(result.id).toBe(created.id)
    })

    it('CTRL-6 should throw NotFoundException for non-existent experiment', () => {
      expect(() => controller.getExperiment('non-existent')).toThrow(NotFoundException)
    })
  })

  // ─── 实验控制 ───────────────────────────────────────────────────

  describe('runExperiment', () => {
    it('CTRL-7 should run experiment and change status to RUNNING', async () => {
      const created = controller.createExperiment({
        name: 'run-test', target: 'svc', faultType: 'LATENCY',
        faultTarget: 'svc', faultParams: { delayMs: 500 },
      })
      const result = await controller.runExperiment(created.id)
      expect(result.status).toBe('RUNNING')
      expect(result.startedAt).toBeDefined()
    })

    it('CTRL-8 should throw NotFoundException when running non-existent experiment', async () => {
      await expect(controller.runExperiment('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('pauseExperiment', () => {
    it('CTRL-9 should pause a running experiment', async () => {
      const created = controller.createExperiment({
        name: 'pause-test', target: 'svc', faultType: 'LATENCY',
        faultTarget: 'svc', faultParams: { delayMs: 500 },
      })
      await controller.runExperiment(created.id)
      const result = await controller.pauseExperiment(created.id)
      expect(result.status).toBe('PAUSED')
    })

    it('CTRL-10 should throw NotFoundException for non-existent experiment', async () => {
      await expect(controller.pauseExperiment('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  // ─── 实验结果 ───────────────────────────────────────────────────

  describe('getExperimentResult', () => {
    it('CTRL-11 should throw NotFoundException when experiment has no results', () => {
      const created = controller.createExperiment({
        name: 'no-result', target: 'svc', faultType: 'LATENCY',
        faultTarget: 'svc', faultParams: { delayMs: 500 },
      })
      expect(() => controller.getExperimentResult(created.id)).toThrow(NotFoundException)
    })

    it('CTRL-12 should return result after experiment completes', () => {
      const created = controller.createExperiment({
        name: 'result-test', target: 'svc', faultType: 'ERROR',
        faultTarget: 'svc', faultParams: { rate: 50 },
      })
      experimentService.completeExperiment(created.id, {
        success: true,
        durationMs: 5000,
        metrics: { requestsTotal: 1000, requestsFailed: 50, latencyAvg: 150, latencyP99: 500, errorRate: 0.05 },
        faultsTriggered: 3,
        rollbackTriggered: false,
        summary: 'All good',
      })
      const { result } = controller.getExperimentResult(created.id)
      expect((result as any).success).toBe(true)
    })
  })

  // ─── 故障注入 ───────────────────────────────────────────────────

  describe('injectLatency', () => {
    it('CTRL-13 should inject latency fault', () => {
      const dto: InjectFaultDto = { target: 'api-gateway', paramValue: 500 }
      const result = controller.injectLatency(dto)
      expect(result.type).toBe('LATENCY')
      expect(result.params['delayMs']).toBe(500)
    })
  })

  describe('injectError', () => {
    it('CTRL-14 should inject error fault', () => {
      const dto: InjectFaultDto = { target: 'payment-api', paramValue: 30 }
      const result = controller.injectError(dto)
      expect(result.type).toBe('ERROR')
      expect(result.params['errorRate']).toBe(30)
    })
  })

  describe('injectTimeout', () => {
    it('CTRL-15 should inject timeout fault', () => {
      const dto: InjectFaultDto = { target: 'auth-svc', paramValue: 2000 }
      const result = controller.injectTimeout(dto)
      expect(result.type).toBe('TIMEOUT')
      expect(result.params['timeoutMs']).toBe(2000)
    })
  })

  describe('injectCPUBurn', () => {
    it('CTRL-16 should inject CPU burn fault', () => {
      const dto: InjectFaultDto = { target: 'worker-node', paramValue: 80 }
      const result = controller.injectCPUBurn(dto)
      expect(result.type).toBe('CPU_BURN')
      expect(result.params['percentage']).toBe(80)
    })
  })

  // ─── 停止故障 ───────────────────────────────────────────────────

  describe('stopFault', () => {
    it('CTRL-17 should stop an active fault', () => {
      faultService.injectLatency('api-gateway', 500)
      const result = controller.stopFault('api-gateway')
      expect(result.stopped).toBe(true)
    })

    it('CTRL-18 should throw NotFoundException when stopping non-existent fault', () => {
      expect(() => controller.stopFault('non-existent')).toThrow(NotFoundException)
    })
  })

  describe('getActiveFaults', () => {
    it('CTRL-19 should return empty when no active faults', () => {
      const result = controller.getActiveFaults()
      expect(result).toEqual([])
    })

    it('CTRL-20 should return all active faults', () => {
      faultService.injectLatency('svc-a', 500)
      faultService.injectError('svc-b', 30)
      const result = controller.getActiveFaults()
      expect(result).toHaveLength(2)
    })
  })

  // ─── 健康监控 ───────────────────────────────────────────────────

  describe('monitorHealth', () => {
    it('CTRL-21 should mark healthy when metrics are good', () => {
      const dto: HealthMetricDto = {
        cpuUsage: 30,
        memoryUsage: 50,
        errorRate: 0.01,
        latencyAvg: 100,
      }
      const result = controller.monitorHealth('exp-001', dto)
      expect(result.healthy).toBe(true)
      expect(result.shouldRollback).toBe(false)
    })

    it('CTRL-22 should detect unhealthy metrics', () => {
      const dto: HealthMetricDto = {
        cpuUsage: 95,
        memoryUsage: 95,
        errorRate: 0.5,
        latencyAvg: 2000,
        healthy: false,
      }
      const r1 = controller.monitorHealth('exp-002', dto)
      expect(r1.healthy).toBe(false)
      // repeat to trigger rollback threshold
      controller.monitorHealth('exp-002', dto)
      controller.monitorHealth('exp-002', dto)
      const r3 = controller.monitorHealth('exp-002', dto)
      expect(r3.shouldRollback).toBe(true)
      expect(r3.failureCount).toBe(4)
    })
  })

  // ─── 回滚 ───────────────────────────────────────────────────────

  describe('triggerRollback', () => {
    it('CTRL-23 should not trigger rollback when below threshold', async () => {
      const dto: HealthMetricDto = {
        cpuUsage: 95, memoryUsage: 95, errorRate: 0.5, latencyAvg: 2000,
      }
      controller.monitorHealth('exp-003', dto)
      const result = await controller.triggerRollback('exp-003', 'test')
      expect(result.triggered).toBe(false)
    })

    it('CTRL-24 should trigger rollback when threshold exceeded', async () => {
      const dto: HealthMetricDto = {
        cpuUsage: 98, memoryUsage: 98, errorRate: 0.8, latencyAvg: 5000,
      }
      controller.monitorHealth('exp-004', dto)
      controller.monitorHealth('exp-004', dto)
      controller.monitorHealth('exp-004', dto)
      const result = await controller.triggerRollback('exp-004', 'threshold exceeded')
      expect(result.triggered).toBe(true)
      expect(result.rollback?.trigger).toBe('AUTO')
    })
  })

  // ─── 回滚历史 ───────────────────────────────────────────────────

  describe('getRollbackHistory', () => {
    it('CTRL-25 should return empty rollback history initially', () => {
      const result = controller.getRollbackHistory()
      expect(result).toEqual([])
    })

    it('CTRL-26 should return rollback history after rollbacks', async () => {
      const dto: HealthMetricDto = {
        cpuUsage: 98, memoryUsage: 98, errorRate: 0.8, latencyAvg: 5000,
      }
      controller.monitorHealth('exp-005', dto)
      controller.monitorHealth('exp-005', dto)
      controller.monitorHealth('exp-005', dto)
      await controller.triggerRollback('exp-005', 'critical')
      const history = controller.getRollbackHistory()
      expect(history).toHaveLength(1)
      expect(history[0].experimentId).toBe('exp-005')
    })
  })

  describe('getExperimentRollbackHistory', () => {
    it('CTRL-27 should return empty for experiment with no rollbacks', () => {
      const result = controller.getExperimentRollbackHistory('exp-none')
      expect(result).toEqual([])
    })

    it('CTRL-28 should return rollbacks for specific experiment', async () => {
      const dto: HealthMetricDto = {
        cpuUsage: 98, memoryUsage: 98, errorRate: 0.8, latencyAvg: 5000,
      }
      controller.monitorHealth('exp-006', dto)
      controller.monitorHealth('exp-006', dto)
      controller.monitorHealth('exp-006', dto)
      await controller.triggerRollback('exp-006', 'critical')
      const result = controller.getExperimentRollbackHistory('exp-006')
      expect(result).toHaveLength(1)
    })
  })
})
