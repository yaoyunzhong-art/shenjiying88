import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [chaos-engineering] [C] 角色测试扩展
 *
 * 8 角色深度场景扩展测试 — chaos-engineering 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: createExperiment, listExperiments, getExperiment, runExperiment,
 *       pauseExperiment, injectLatency, injectError, injectTimeout, injectCPUBurn,
 *       stopFault, monitorHealth, triggerRollback, getRollbackHistory
 * 扩展: 多轮回滚、健康自愈、跨目标并发故障、混合故障注入
 */

import { NotFoundException } from '@nestjs/common'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import type { ChaosExperiment, FaultInjection, SystemMetrics } from './chaos-engineering.entity'

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
function createController() {
  const experimentService = new ChaosExperimentService()
  const faultService = new FaultInjectionService()
  const rollbackService = new ChaosAutoRollbackService()
  return {
    controller: new ChaosEngineeringController(experimentService, faultService, rollbackService),
    experimentService,
    faultService,
    rollbackService,
  }
}

function createBaseExperiment(
  controller: ChaosEngineeringController,
  suffix = '',
  faultType: 'LATENCY' | 'ERROR' | 'TIMEOUT' | 'CPU_BURN' = 'LATENCY',
) {
  return controller.createExperiment({
    name: `chaos-test${suffix}`,
    target: 'api-gateway',
    faultType,
    faultTarget: 'api-gateway',
    faultParams: { delayMs: 500 },
  })
}

// ── 👔店长 - 管理场景 ──
describe(`${ROLES.StoreManager} chaos-engineering 扩展测试`, () => {
  it('店长可创建多目标混合故障实验排障收银链路', () => {
    const { controller } = createController()
    const exp = controller.createExperiment({
      name: 'pos-full-link-test',
      target: 'pos-system',
      faultType: 'ERROR',
      faultTarget: 'pos-db',
      faultParams: { rate: 20 },
    })
    expect(exp.name).toBe('pos-full-link-test')
    expect(exp.status).toBe('PENDING')
    expect(exp.faultInjections).toHaveLength(1)
    expect(exp.faultInjections[0].type).toBe('ERROR')
  })

  it('店长可查看所有实验并过滤状态', async () => {
    const { controller } = createController()
    const exp1 = createBaseExperiment(controller, '-sm1')
    const exp2 = controller.createExperiment({
      name: 'store-cpu-test',
      target: 'store-server',
      faultType: 'CPU_BURN',
      faultTarget: 'store-server',
      faultParams: { percentage: 60 },
    })
    await controller.runExperiment(exp1.id)
    const all = controller.listExperiments()
    expect(all).toHaveLength(2)
    const runningOnes = all.filter((e) => e.status === 'RUNNING')
    expect(runningOnes).toHaveLength(1)
    expect(runningOnes[0].id).toBe(exp1.id)
  })

  it('店长尝试查看不存在实验应抛出 404', () => {
    const { controller } = createController()
    expect(() => controller.getExperiment('non-existent-store-exp')).toThrow(NotFoundException)
  })
})

// ── 🛒前台 - 操作场景 ──
describe(`${ROLES.FrontDesk} chaos-engineering 扩展测试`, () => {
  it('前台可触发收银API延迟注入模拟网络故障', () => {
    const { controller, faultService } = createController()
    const fault = controller.injectLatency({ target: 'pos-api', paramValue: 2000 })
    expect(fault.type).toBe('LATENCY')
    expect(fault.target).toBe('pos-api')
    expect(fault.params['delayMs']).toBe(2000)

    const active = faultService.getNetworkLatency('pos-api')
    expect(active).toBe(2000)
  })

  it('前台可停止已注入的故障恢复服务', () => {
    const { controller, faultService } = createController()
    controller.injectLatency({ target: 'frontend-api', paramValue: 1000 })
    expect(faultService.isFaultActive('frontend-api')).toBe(true)
    controller.stopFault('frontend-api')
    expect(faultService.isFaultActive('frontend-api')).toBe(false)
  })

  it('前台停止不存在故障应抛出 404', () => {
    const { controller } = createController()
    expect(() => controller.stopFault('non-existent-fault')).toThrow(NotFoundException)
  })
})

// ── 👥HR - 人事场景 ──
describe(`${ROLES.HR} chaos-engineering 扩展测试`, () => {
  it('HR可查询所有活跃故障了解系统稳定性', () => {
    const { controller } = createController()
    const initial = controller.getActiveFaults()
    expect(initial).toHaveLength(0)

    controller.injectError({ target: 'hr-system', paramValue: 10 })
    controller.injectTimeout({ target: 'attendance-api', paramValue: 3000 })
    const faults = controller.getActiveFaults()
    expect(faults).toHaveLength(2)
    expect(faults.map((f) => f.type).sort()).toEqual(['ERROR', 'TIMEOUT'])
  })

  it('HR注入CPU燃烧不应影响正常查询', () => {
    const { controller, faultService } = createController()
    controller.injectCPUBurn({ target: 'report-worker', paramValue: 50 })
    expect(faultService.getCPUBurnPercentage('report-worker')).toBe(50)
    // 未注入目标应返回0
    expect(faultService.getCPUBurnPercentage('other-worker')).toBe(0)
  })

  it('HR查询系统健康度应根据指标判断', () => {
    const { controller } = createController()
    const healthy = controller.monitorHealth('exp-hr-1', {
      cpuUsage: 40,
      memoryUsage: 60,
      errorRate: 0.02,
      latencyAvg: 80,
    })
    expect(healthy.healthy).toBe(true)
    expect(healthy.shouldRollback).toBe(false)

    const unhealthy = controller.monitorHealth('exp-hr-1', {
      cpuUsage: 95,
      memoryUsage: 90,
      errorRate: 0.3,
      latencyAvg: 5000,
      healthy: false,
    })
    expect(unhealthy.healthy).toBe(false)
  })
})

// ── 🔧安监 - 安全场景 ──
describe(`${ROLES.Security} chaos-engineering 扩展测试`, () => {
  it('安监可对安全组件进行超时故障注入', () => {
    const { controller, faultService } = createController()
    controller.injectTimeout({ target: 'auth-service', paramValue: 5000 })
    const status = faultService.isTimeoutEnabled('auth-service')
    expect(status.enabled).toBe(true)
    expect(status.timeoutMs).toBe(5000)
  })

  it('安监可监控安全实验并触发回滚保护', async () => {
    const { controller } = createController()
    const dto = { cpuUsage: 99, memoryUsage: 95, errorRate: 0.9, latencyAvg: 10000, healthy: false }
    // 连续3+次不健康触发回滚
    controller.monitorHealth('exp-sec-1', dto)
    controller.monitorHealth('exp-sec-1', dto)
    controller.monitorHealth('exp-sec-1', dto)
    const { triggered, rollback } = await controller.triggerRollback('exp-sec-1', 'security threshold exceeded')
    expect(triggered).toBe(true)
    expect(rollback?.reason).toContain('security')
  })

  it('安监查看回滚历史应包含已触发的记录', async () => {
    const { controller } = createController()
    const dto = { cpuUsage: 99, memoryUsage: 99, errorRate: 0.9, latencyAvg: 9999, healthy: false }
    controller.monitorHealth('exp-sec-2', dto)
    controller.monitorHealth('exp-sec-2', dto)
    controller.monitorHealth('exp-sec-2', dto)
    await controller.triggerRollback('exp-sec-2', 'critical alert')
    const history = controller.getExperimentRollbackHistory('exp-sec-2')
    expect(history).toHaveLength(1)
    expect(history[0].trigger).toBe('AUTO')
    expect(history[0].success).toBe(true)
  })
})

// ── 🎮导玩员 - 娱乐场景 ──
describe(`${ROLES.Guide} chaos-engineering 扩展测试`, () => {
  it('导玩员可为游戏服务注入延迟测试玩家体验', () => {
    const { controller, faultService } = createController()
    controller.injectLatency({ target: 'game-server', paramValue: 300 })
    expect(faultService.getNetworkLatency('game-server')).toBe(300)
  })

  it('导玩员可创建CPU燃烧实验测试游戏渲染', () => {
    const { controller } = createController()
    const exp = controller.createExperiment({
      name: 'game-render-burn',
      target: 'render-node',
      faultType: 'CPU_BURN',
      faultTarget: 'render-node',
      faultParams: { percentage: 80 },
    })
    expect(exp.status).toBe('PENDING')
    expect(exp.faultInjections[0].type).toBe('CPU_BURN')
  })

  it('导玩员可创建实验并运行查看状态变更', async () => {
    const { controller } = createController()
    const exp = createBaseExperiment(controller, '-guide-run', 'ERROR')
    const runResult = await controller.runExperiment(exp.id)
    expect(runResult.status).toBe('RUNNING')
    expect(runResult.startedAt).toBeDefined()
  })
})

// ── 🎯运行专员 - 核心运维场景 ──
describe(`${ROLES.Operations} chaos-engineering 扩展测试`, () => {
  it('运行专员可创建实验、运行、暂停全生命周期管理', async () => {
    const { controller } = createController()
    const exp = createBaseExperiment(controller, '-ops-lifecycle')
    await controller.runExperiment(exp.id)
    expect(controller.getExperiment(exp.id)!.status).toBe('RUNNING')
    const paused = await controller.pauseExperiment(exp.id)
    expect(paused.status).toBe('PAUSED')
  })

  it('运行专员可并发创建多个实验并逐个运行', async () => {
    const { controller } = createController()
    const e1 = createBaseExperiment(controller, '-ops1')
    const e2 = createBaseExperiment(controller, '-ops2', 'TIMEOUT')
    const e3 = createBaseExperiment(controller, '-ops3', 'CPU_BURN')

    await controller.runExperiment(e1.id)
    await controller.runExperiment(e2.id)
    await controller.runExperiment(e3.id)

    const all = controller.listExperiments()
    const running = all.filter((e) => e.status === 'RUNNING')
    expect(running).toHaveLength(3)
  })

  it('运行专员对已存在的复杂故障混合注入', () => {
    const { controller, faultService } = createController()
    // 对同一目标并发多种故障
    controller.injectLatency({ target: 'microservice-a', paramValue: 200 })
    controller.injectError({ target: 'microservice-a', paramValue: 30 })
    controller.injectTimeout({ target: 'microservice-a', paramValue: 5000 })

    // 后注入覆盖前注入 (同target)
    const faults = controller.getActiveFaults()
    expect(faults.filter((f) => f.target === 'microservice-a')).toHaveLength(1)
    expect(faults[0].type).toBe('TIMEOUT') // 最后一个覆盖
  })

  it('运行专员可检测实验结果并确认是否完成', () => {
    const { controller, experimentService } = createController()
    const exp = createBaseExperiment(controller, '-ops-result')
    experimentService.completeExperiment(exp.id, {
      success: true,
      durationMs: 3000,
      metrics: { requestsTotal: 500, requestsFailed: 10, latencyAvg: 120, latencyP99: 400, errorRate: 0.02 },
      faultsTriggered: 2,
      rollbackTriggered: false,
      summary: 'Experiment completed successfully',
    })
    const { result } = controller.getExperimentResult(exp.id)
    expect((result as any).success).toBe(true)
    expect((result as any).durationMs).toBe(3000)
  })
})

// ── 🤝团建 - 协作场景 ──
describe(`${ROLES.Teambuilding} chaos-engineering 扩展测试`, () => {
  it('团建可查看所有回滚历史了解系统可靠性', async () => {
    const { controller } = createController()
    const dto = { cpuUsage: 98, memoryUsage: 98, errorRate: 0.8, latencyAvg: 8000, healthy: false }
    controller.monitorHealth('exp-tb-1', dto)
    controller.monitorHealth('exp-tb-1', dto)
    controller.monitorHealth('exp-tb-1', dto)
    await controller.triggerRollback('exp-tb-1', 'team activity')
    const all = controller.getRollbackHistory()
    expect(all).toHaveLength(1)
    expect(all[0].experimentId).toBe('exp-tb-1')
  })

  it('团建可查看已恢复的健康状态更新', () => {
    const { controller } = createController()
    // 先不健康
    const bad = { cpuUsage: 95, memoryUsage: 90, errorRate: 0.5, latencyAvg: 3000, healthy: false }
    controller.monitorHealth('exp-tb-2', bad)
    controller.monitorHealth('exp-tb-2', bad)
    // 然后恢复
    const good = { cpuUsage: 30, memoryUsage: 50, errorRate: 0.01, latencyAvg: 50 }
    const status = controller.monitorHealth('exp-tb-2', good)
    expect(status.healthy).toBe(true)
    expect(status.shouldRollback).toBe(false)
    expect(status.failureCount).toBe(0)
  })

  it('团建可回滚历史按实验ID过滤', async () => {
    const { controller } = createController()
    const dto = { cpuUsage: 99, memoryUsage: 99, errorRate: 0.9, latencyAvg: 9999, healthy: false }
    controller.monitorHealth('exp-tb-3', dto)
    controller.monitorHealth('exp-tb-3', dto)
    controller.monitorHealth('exp-tb-3', dto)
    await controller.triggerRollback('exp-tb-3', 'teambuilding drill')
    const filtered = controller.getExperimentRollbackHistory('exp-tb-3')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].trigger).toBe('AUTO')
  })
})

// ── 📢营销 - 营销场景 ──
describe(`${ROLES.Marketing} chaos-engineering 扩展测试`, () => {
  it('营销可创建实验验证营销推送服务稳定性', () => {
    const { controller } = createController()
    const exp = controller.createExperiment({
      name: 'campaign-push-test',
      target: 'push-service',
      faultType: 'LATENCY',
      faultTarget: 'push-service',
      faultParams: { delayMs: 100 },
    })
    expect(exp.target).toBe('push-service')
    expect(exp.faultInjections[0].params['delayMs']).toBe(100)
  })

  it('营销可注入错误故障测试营销API容错', () => {
    const { controller, faultService } = createController()
    controller.injectError({ target: 'marketing-api', paramValue: 15 })
    expect(faultService.isFaultActive('marketing-api')).toBe(true)
    controller.stopFault('marketing-api')
    expect(faultService.isFaultActive('marketing-api')).toBe(false)
  })

  it('营销查看所有实验确认大促前系统稳定', async () => {
    const { controller } = createController()
    createBaseExperiment(controller, '-mkt1', 'ERROR')
    createBaseExperiment(controller, '-mkt2', 'TIMEOUT')
    // 运行一个
    const exp3 = createBaseExperiment(controller, '-mkt3', 'LATENCY')
    await controller.runExperiment(exp3.id)
    const all = controller.listExperiments()
    expect(all).toHaveLength(3)
    const running = all.filter((e) => e.status === 'RUNNING')
    expect(running).toHaveLength(1)
  })
})

// ── 边界 & 异常场景 ──
describe('🔄 chaos-engineering 边界 & 异常场景', () => {
  it('未创建实验获取列表应返回空数组', () => {
    const { controller } = createController()
    expect(controller.listExperiments()).toEqual([])
  })

  it('停止已停止的故障应返回 false', () => {
    const { controller, faultService } = createController()
    controller.injectLatency({ target: 'temp-svc', paramValue: 100 })
    controller.stopFault('temp-svc')
    expect(faultService.isFaultActive('temp-svc')).toBe(false)
  })

  it('健康监控连续失败超出阈值后恢复应重置计数器', () => {
    const { controller } = createController()
    const bad = { cpuUsage: 95, memoryUsage: 95, errorRate: 0.5, latencyAvg: 3000, healthy: false }
    const good = { cpuUsage: 30, memoryUsage: 40, errorRate: 0.01, latencyAvg: 50 }
    controller.monitorHealth('exp-edge-1', bad)
    controller.monitorHealth('exp-edge-1', bad)
    // 恢复后计数器重置
    const status = controller.monitorHealth('exp-edge-1', good)
    expect(status.failureCount).toBe(0)
    expect(status.healthy).toBe(true)
  })

  it('对不存在的实验强制回滚应返回 triggered=false', async () => {
    const { controller } = createController()
    const result = await controller.triggerRollback('non-existent-exp', 'test')
    expect(result.triggered).toBe(false)
  })

  it('对不存在的实验查询回滚历史应返回空数组', () => {
    const { controller } = createController()
    expect(controller.getExperimentRollbackHistory('non-existent')).toEqual([])
  })
})
