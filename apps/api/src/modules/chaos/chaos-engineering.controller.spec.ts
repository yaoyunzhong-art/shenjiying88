import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * chaos-engineering.controller.spec.ts
 *
 * ChaosEngineeringController 全路由 spec — 覆盖全部端点 (正例+反例+边界)
 * 路由: POST/GET /chaos/experiments, GET /chaos/experiments/:id,
 *       POST /chaos/experiments/:id/run, POST /chaos/experiments/:id/pause,
 *       GET /chaos/experiments/:id/result, POST /chaos/faults/latency,
 *       POST /chaos/faults/error, POST /chaos/faults/timeout, POST /chaos/faults/cpu-burn,
 *       POST /chaos/faults/:target/stop, GET /chaos/faults,
 *       POST /chaos/health/monitor, POST /chaos/health/rollback,
 *       GET /chaos/rollbacks, GET /chaos/rollbacks/:experimentId
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { NotFoundException } from '@nestjs/common'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'

// ── Mock Service 工厂 ──
function createMockServices() {
  const experimentService = new ChaosExperimentService()
  const faultService = new FaultInjectionService()
  const rollbackService = new ChaosAutoRollbackService()
  return { experimentService, faultService, rollbackService }
}

function createController() {
  const svcs = createMockServices()
  const controller = new ChaosEngineeringController(
    svcs.experimentService,
    svcs.faultService,
    svcs.rollbackService,
  )
  return { controller, ...svcs }
}

function createTestExperiment(
  controller: ChaosEngineeringController,
  suffix = '',
  faultType: 'LATENCY' | 'ERROR' | 'TIMEOUT' | 'CPU_BURN' = 'LATENCY',
) {
  return controller.createExperiment({
    name: `spec-test${suffix}`,
    target: 'test-target',
    faultType,
    faultTarget: 'test-target',
    faultParams: faultType === 'CPU_BURN' ? { percentage: 80 } : { delayMs: 500 },
  })
}

// ── 路由元数据 ──
describe('路由注册与模块元数据', () => {
  it('Controller 有正确的路由前缀', () => {
    const path = Reflect.getMetadata('path', ChaosEngineeringController)
    assert.equal(path, 'chaos')
  })
})

// ── POST /chaos/experiments — 创建实验 ──
describe('POST /chaos/experiments — createExperiment', () => {
  it('正常创建: 返回新实验对象', () => {
    const { controller } = createController()
    const result = createTestExperiment(controller)
    assert.equal(result.name, 'spec-test')
    assert.equal(result.status, 'PENDING')
    assert.ok(result.id)
    assert.ok(result.id.startsWith('exp-'))
    assert.equal(result.faultInjections[0].type, 'LATENCY')
  })

  it('创建各种故障类型的实验', () => {
    const { controller } = createController()
    const latency = createTestExperiment(controller, '-latency', 'LATENCY')
    const error = createTestExperiment(controller, '-error', 'ERROR')
    const timeout = createTestExperiment(controller, '-timeout', 'TIMEOUT')
    const cpu = createTestExperiment(controller, '-cpu', 'CPU_BURN')

    assert.equal(latency.faultInjections[0].type, 'LATENCY')
    assert.equal(error.faultInjections[0].type, 'ERROR')
    assert.equal(timeout.faultInjections[0].type, 'TIMEOUT')
    assert.equal(cpu.faultInjections[0].type, 'CPU_BURN')
  })
})

// ── GET /chaos/experiments — 列表 ──
describe('GET /chaos/experiments — listExperiments', () => {
  it('空列表时返回空数组', () => {
    const { controller } = createController()
    assert.deepEqual(controller.listExperiments(), [])
  })

  it('返回所有已创建实验', () => {
    const { controller } = createController()
    createTestExperiment(controller, '-a')
    createTestExperiment(controller, '-b', 'ERROR')
    const list = controller.listExperiments()
    assert.equal(list.length, 2)
  })
})

// ── GET /chaos/experiments/:id — 获取实验 ──
describe('GET /chaos/experiments/:id — getExperiment', () => {
  it('正常获取已存在的实验', () => {
    const { controller } = createController()
    const exp = createTestExperiment(controller)
    const result = controller.getExperiment(exp.id)
    assert.equal(result.id, exp.id)
    assert.equal(result.name, 'spec-test')
  })

  it('获取不存在的实验抛出 NotFoundException', () => {
    const { controller } = createController()
    assert.throws(() => controller.getExperiment('non-existent'), NotFoundException)
  })
})

// ── POST /chaos/experiments/:id/run — 运行实验 ──
describe('POST /chaos/experiments/:id/run — runExperiment', () => {
  it('正常运行实验状态变 RUNNING', async () => {
    const { controller } = createController()
    const exp = createTestExperiment(controller)
    const result = await controller.runExperiment(exp.id)
    assert.equal(result.status, 'RUNNING')
    assert.ok(result.startedAt)
  })

  it('重复运行已运行的实验不报错', async () => {
    const { controller } = createController()
    const exp = createTestExperiment(controller)
    await controller.runExperiment(exp.id)
    const result = await controller.runExperiment(exp.id)
    assert.equal(result.status, 'RUNNING')
  })

  it('运行不存在的实验抛出 NotFoundException', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => controller.runExperiment('non-existent'),
      NotFoundException,
    )
  })
})

// ── POST /chaos/experiments/:id/pause — 暂停实验 ──
describe('POST /chaos/experiments/:id/pause — pauseExperiment', () => {
  it('暂停运行中的实验', async () => {
    const { controller } = createController()
    const exp = createTestExperiment(controller)
    await controller.runExperiment(exp.id)
    const result = await controller.pauseExperiment(exp.id)
    assert.equal(result.status, 'PAUSED')
  })

  it('暂停不存在的实验抛出 NotFoundException', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => controller.pauseExperiment('non-existent'),
      NotFoundException,
    )
  })
})

// ── GET /chaos/experiments/:id/result — 实验结果 ──
describe('GET /chaos/experiments/:id/result — getExperimentResult', () => {
  it('无结果的实验抛出 NotFoundException', () => {
    const { controller } = createController()
    const exp = createTestExperiment(controller)
    assert.throws(() => controller.getExperimentResult(exp.id), NotFoundException)
  })

  it('实验完成后可获取结果', () => {
    const { controller, experimentService } = createController()
    const exp = createTestExperiment(controller)
    experimentService.completeExperiment(exp.id, {
      success: true,
      durationMs: 2000,
      metrics: { requestsTotal: 100, requestsFailed: 2, latencyAvg: 80, latencyP99: 200, errorRate: 0.02 },
      faultsTriggered: 1,
      rollbackTriggered: false,
      summary: 'All good',
    })
    const { result } = controller.getExperimentResult(exp.id)
    assert.equal((result as any).success, true)
    assert.equal((result as any).durationMs, 2000)
  })
})

// ── POST /chaos/faults/latency — 延迟故障 ──
describe('POST /chaos/faults/latency — injectLatency', () => {
  it('注入延迟故障', () => {
    const { controller } = createController()
    const result = controller.injectLatency({ target: 'svc-a', paramValue: 500 })
    assert.equal(result.type, 'LATENCY')
    assert.equal(result.params['delayMs'], 500)
    assert.ok(result.active)
  })
})

// ── POST /chaos/faults/error — 错误故障 ──
describe('POST /chaos/faults/error — injectError', () => {
  it('注入错误故障', () => {
    const { controller } = createController()
    const result = controller.injectError({ target: 'svc-b', paramValue: 30 })
    assert.equal(result.type, 'ERROR')
    assert.equal(result.params['errorRate'], 30)
  })
})

// ── POST /chaos/faults/timeout — 超时故障 ──
describe('POST /chaos/faults/timeout — injectTimeout', () => {
  it('注入超时故障', () => {
    const { controller } = createController()
    const result = controller.injectTimeout({ target: 'svc-c', paramValue: 2000 })
    assert.equal(result.type, 'TIMEOUT')
    assert.equal(result.params['timeoutMs'], 2000)
  })
})

// ── POST /chaos/faults/cpu-burn — CPU 燃烧 ──
describe('POST /chaos/faults/cpu-burn — injectCPUBurn', () => {
  it('注入 CPU 燃烧故障', () => {
    const { controller } = createController()
    const result = controller.injectCPUBurn({ target: 'svc-d', paramValue: 80 })
    assert.equal(result.type, 'CPU_BURN')
    assert.equal(result.params['percentage'], 80)
  })
})

// ── POST /chaos/faults/:target/stop — 停止故障 ──
describe('POST /chaos/faults/:target/stop — stopFault', () => {
  it('停止已注入的故障', () => {
    const { controller, faultService } = createController()
    controller.injectLatency({ target: 'svc-stop', paramValue: 100 })
    assert.ok(faultService.isFaultActive('svc-stop'))
    const result = controller.stopFault('svc-stop')
    assert.equal(result.stopped, true)
    assert.ok(!faultService.isFaultActive('svc-stop'))
  })

  it('停止不存在的故障抛出 NotFoundException', () => {
    const { controller } = createController()
    assert.throws(() => controller.stopFault('non-existent'), NotFoundException)
  })
})

// ── GET /chaos/faults — 活跃故障列表 ──
describe('GET /chaos/faults — getActiveFaults', () => {
  it('无活跃故障返回空数组', () => {
    const { controller } = createController()
    assert.deepEqual(controller.getActiveFaults(), [])
  })

  it('返回所有活跃故障', () => {
    const { controller } = createController()
    controller.injectLatency({ target: 'svc-1', paramValue: 100 })
    controller.injectError({ target: 'svc-2', paramValue: 50 })
    const faults = controller.getActiveFaults()
    assert.equal(faults.length, 2)
  })
})

// ── POST /chaos/health/monitor — 健康监控 ──
describe('POST /chaos/health/monitor — monitorHealth', () => {
  it('健康指标良好时应返回 healthy=true', () => {
    const { controller } = createController()
    const result = controller.monitorHealth('exp-health-1', {
      cpuUsage: 30, memoryUsage: 50, errorRate: 0.01, latencyAvg: 100,
    })
    assert.equal(result.healthy, true)
    assert.equal(result.shouldRollback, false)
    assert.equal(result.cpuUsage, 30)
    assert.equal(result.errorRate, 0.01)
  })

  it('不健康指标超过阈值触发 shouldRollback', () => {
    const { controller } = createController()
    const bad = { cpuUsage: 95, memoryUsage: 95, errorRate: 0.5, latencyAvg: 5000, healthy: false }
    controller.monitorHealth('exp-health-2', bad)
    controller.monitorHealth('exp-health-2', bad)
    controller.monitorHealth('exp-health-2', bad)
    const result = controller.monitorHealth('exp-health-2', bad)
    assert.equal(result.healthy, false)
    assert.equal(result.shouldRollback, true)
    assert.equal(result.failureCount, 4)
  })

  it('健康恢复后故障计数器应重置', () => {
    const { controller } = createController()
    const bad = { cpuUsage: 95, memoryUsage: 95, errorRate: 0.5, latencyAvg: 5000, healthy: false }
    const good = { cpuUsage: 30, memoryUsage: 40, errorRate: 0.01, latencyAvg: 50 }
    controller.monitorHealth('exp-health-3', bad)
    controller.monitorHealth('exp-health-3', bad)
    const result = controller.monitorHealth('exp-health-3', good)
    assert.equal(result.healthy, true)
    assert.equal(result.failureCount, 0)
  })
})

// ── POST /chaos/health/rollback — 触发回滚 ──
describe('POST /chaos/health/rollback — triggerRollback', () => {
  it('低于阈值不触发回滚', async () => {
    const { controller } = createController()
    const result = await controller.triggerRollback('exp-rb-1', 'test')
    assert.equal(result.triggered, false)
  })

  it('超过阈值触发回滚', async () => {
    const { controller } = createController()
    const bad = { cpuUsage: 99, memoryUsage: 99, errorRate: 0.9, latencyAvg: 10000, healthy: false }
    controller.monitorHealth('exp-rb-2', bad)
    controller.monitorHealth('exp-rb-2', bad)
    controller.monitorHealth('exp-rb-2', bad)
    const result = await controller.triggerRollback('exp-rb-2', 'threshold exceeded')
    assert.equal(result.triggered, true)
    assert.ok(result.rollback)
    assert.equal(result.rollback!.experimentId, 'exp-rb-2')
    assert.equal(result.rollback!.trigger, 'AUTO')
  })
})

// ── GET /chaos/rollbacks — 回滚历史 ──
describe('GET /chaos/rollbacks — getRollbackHistory', () => {
  it('初始返回空数组', () => {
    const { controller } = createController()
    assert.deepEqual(controller.getRollbackHistory(), [])
  })

  it('回滚后可见历史记录', async () => {
    const { controller } = createController()
    const bad = { cpuUsage: 99, memoryUsage: 99, errorRate: 0.9, latencyAvg: 10000, healthy: false }
    controller.monitorHealth('exp-hist-1', bad)
    controller.monitorHealth('exp-hist-1', bad)
    controller.monitorHealth('exp-hist-1', bad)
    await controller.triggerRollback('exp-hist-1', 'history test')
    const history = controller.getRollbackHistory()
    assert.equal(history.length, 1)
    assert.equal(history[0].experimentId, 'exp-hist-1')
  })
})

// ── GET /chaos/rollbacks/:experimentId — 实验回滚历史 ──
describe('GET /chaos/rollbacks/:experimentId — getExperimentRollbackHistory', () => {
  it('无回滚记录返回空数组', () => {
    const { controller } = createController()
    assert.deepEqual(controller.getExperimentRollbackHistory('exp-none'), [])
  })

  it('返回指定实验的回滚历史', async () => {
    const { controller } = createController()
    const bad = { cpuUsage: 99, memoryUsage: 99, errorRate: 0.9, latencyAvg: 10000, healthy: false }
    controller.monitorHealth('exp-filter-1', bad)
    controller.monitorHealth('exp-filter-1', bad)
    controller.monitorHealth('exp-filter-1', bad)
    await controller.triggerRollback('exp-filter-1', 'filter test')
    const filtered = controller.getExperimentRollbackHistory('exp-filter-1')
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].experimentId, 'exp-filter-1')

    // 其他实验不应出现在此历史中
    const other = controller.getExperimentRollbackHistory('exp-other')
    assert.equal(other.length, 0)
  })
})
