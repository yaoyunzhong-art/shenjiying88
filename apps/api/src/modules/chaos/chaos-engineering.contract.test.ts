import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
// types are imported implicitly via entity interfaces
import {
  toChaosExperimentContract,
  toFaultInjectionContract,
  toExperimentResultContract,
  toRollbackHistoryContract,
  toSystemMetricsContract,
  toChaosExperimentContractList,
  toRollbackHistoryContractList,
} from './chaos-engineering.contract'
import type {
  ChaosExperiment,
  FaultInjection,
  ExperimentResult,
  RollbackHistoryEntry,
  SystemMetrics,
} from './chaos-engineering.entity'

// ════════════════════════════════════════════════════════════════════════════════
// toChaosExperimentContract
// ════════════════════════════════════════════════════════════════════════════════

it('toChaosExperimentContract maps PENDING experiment without faults and no result', () => {
  const exp: ChaosExperiment = {
    id: 'exp-abc123',
    name: '网络延迟测试',
    target: 'payment-service',
    faultInjections: [],
    status: 'PENDING' as any,
    createdAt: '2026-07-10T02:00:00.000Z',
  }
  const contract = toChaosExperimentContract(exp)
  assert.equal(contract.experimentId, 'exp-abc123')
  assert.equal(contract.name, '网络延迟测试')
  assert.equal(contract.target, 'payment-service')
  assert.equal(contract.status, 'PENDING')
  assert.deepEqual(contract.faults, [])
  assert.equal(contract.createdAt, '2026-07-10T02:00:00.000Z')
  assert.equal(contract.startedAt, undefined)
  assert.equal(contract.completedAt, undefined)
  assert.equal(contract.success, null)
})

it('toChaosExperimentContract maps RUNNING experiment with faults', () => {
  const exp: ChaosExperiment = {
    id: 'exp-def456',
    name: '积分服务高负载',
    target: 'points-service',
    faultInjections: [
      { type: 'LATENCY', target: 'points-service', params: { delayMs: 300 }, active: true, startedAt: '2026-07-10T02:01:00.000Z' },
      { type: 'CPU_BURN', target: 'points-service', params: { percentage: 80 }, active: true, startedAt: '2026-07-10T02:01:01.000Z' },
    ],
    status: 'RUNNING' as any,
    createdAt: '2026-07-10T02:00:00.000Z',
    startedAt: '2026-07-10T02:01:00.000Z',
  }
  const contract = toChaosExperimentContract(exp)
  assert.equal(contract.experimentId, 'exp-def456')
  assert.equal(contract.status, 'RUNNING')
  assert.equal(contract.faults.length, 2)
  assert.equal(contract.faults[0].type, 'LATENCY')
  assert.equal(contract.faults[0].params.delayMs, 300)
  assert.equal(contract.faults[1].type, 'CPU_BURN')
  assert.equal(contract.faults[1].params.percentage, 80)
  assert.equal(contract.startedAt, '2026-07-10T02:01:00.000Z')
  assert.equal(contract.completedAt, undefined)
  assert.equal(contract.success, null)
})

it('toChaosExperimentContract maps COMPLETED experiment with result', () => {
  const exp: ChaosExperiment = {
    id: 'exp-ghi789',
    name: '支付网关容错',
    target: 'payment-gateway',
    faultInjections: [
      { type: 'ERROR', target: 'payment-gateway', params: { errorRate: 30 }, active: false, startedAt: '2026-07-10T02:05:00.000Z' },
    ],
    status: 'COMPLETED' as any,
    createdAt: '2026-07-10T02:00:00.000Z',
    startedAt: '2026-07-10T02:05:00.000Z',
    completedAt: '2026-07-10T02:10:00.000Z',
    results: {
      success: true,
      durationMs: 300000,
      metrics: { requestsTotal: 5000, requestsFailed: 10, latencyAvg: 150, latencyP99: 500, errorRate: 0.002 },
      faultsTriggered: 1,
      rollbackTriggered: false,
      summary: '支付网关在30%错误率下仍能正常处理99.8%请求',
    },
  }
  const contract = toChaosExperimentContract(exp)
  assert.equal(contract.experimentId, 'exp-ghi789')
  assert.equal(contract.status, 'COMPLETED')
  assert.equal(contract.completedAt, '2026-07-10T02:10:00.000Z')
  assert.equal(contract.success, true)
  assert.equal(contract.faults.length, 1)
})

it('toChaosExperimentContract maps FAILED experiment', () => {
  const exp: ChaosExperiment = {
    id: 'exp-fail-001',
    name: '数据库压力测试',
    target: 'order-db',
    faultInjections: [
      { type: 'TIMEOUT', target: 'order-db', params: { timeoutMs: 5000 }, active: false, startedAt: '2026-07-10T03:00:00.000Z' },
    ],
    status: 'FAILED' as any,
    createdAt: '2026-07-10T02:50:00.000Z',
    startedAt: '2026-07-10T03:00:00.000Z',
    completedAt: '2026-07-10T03:05:00.000Z',
    results: {
      success: false,
      durationMs: 300000,
      metrics: { requestsTotal: 200, requestsFailed: 180, latencyAvg: 4500, latencyP99: 8000, errorRate: 0.9 },
      faultsTriggered: 1,
      rollbackTriggered: true,
      summary: '数据库在5000ms超时下90%请求失败，自动回滚触发',
    },
  }
  const contract = toChaosExperimentContract(exp)
  assert.equal(contract.status, 'FAILED')
  assert.equal(contract.success, false)
  assert.equal(contract.faults.length, 1)
  assert.equal(contract.faults[0].type, 'TIMEOUT')
  assert.equal(contract.faults[0].params.timeoutMs, 5000)
})

// ════════════════════════════════════════════════════════════════════════════════
// toFaultInjectionContract
// ════════════════════════════════════════════════════════════════════════════════

it('toFaultInjectionContract maps latency fault', () => {
  const fault: FaultInjection = {
    type: 'LATENCY',
    target: 'payment-service',
    params: { delayMs: 500 },
    active: true,
    startedAt: '2026-07-10T02:01:00.000Z',
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.type, 'LATENCY')
  assert.equal(contract.target, 'payment-service')
  assert.equal(contract.params.delayMs, 500)
  assert.equal(contract.active, true)
  assert.equal(contract.startedAt, '2026-07-10T02:01:00.000Z')
})

it('toFaultInjectionContract maps inactive fault without startedAt', () => {
  const fault: FaultInjection = {
    type: 'ERROR',
    target: 'notification-service',
    params: { errorRate: 50 },
    active: false,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.type, 'ERROR')
  assert.equal(contract.params.errorRate, 50)
  assert.equal(contract.active, false)
  assert.equal(contract.startedAt, undefined)
})

it('toFaultInjectionContract maps CPU_BURN with percentage', () => {
  const fault: FaultInjection = {
    type: 'CPU_BURN',
    target: 'inference-node',
    params: { percentage: 95 },
    active: true,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.type, 'CPU_BURN')
  assert.equal(contract.params.percentage, 95)
  assert.equal(contract.active, true)
})

it('toFaultInjectionContract maps TIMEOUT fault', () => {
  const fault: FaultInjection = {
    type: 'TIMEOUT',
    target: 'external-api',
    params: { timeoutMs: 3000 },
    active: true,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.type, 'TIMEOUT')
  assert.equal(contract.params.timeoutMs, 3000)
  assert.equal(contract.active, true)
})

it('toFaultInjectionContract does NOT alias params (returns copy)', () => {
  const fault: FaultInjection = {
    type: 'LATENCY',
    target: 'svc',
    params: { delayMs: 100 },
    active: true,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.params.delayMs, 100)
  contract.params.delayMs = 999
  // original should be unchanged
  assert.equal(fault.params.delayMs, 100)
})

// ════════════════════════════════════════════════════════════════════════════════
// toExperimentResultContract
// ════════════════════════════════════════════════════════════════════════════════

it('toExperimentResultContract maps successful experiment result', () => {
  const result: ExperimentResult = {
    success: true,
    durationMs: 180000,
    metrics: { requestsTotal: 10000, requestsFailed: 5, latencyAvg: 120, latencyP99: 350, errorRate: 0.0005 },
    faultsTriggered: 2,
    rollbackTriggered: false,
    summary: 'services recovered within 3 min',
  }
  const contract = toExperimentResultContract(result)
  assert.equal(contract.success, true)
  assert.equal(contract.durationMs, 180000)
  assert.equal(contract.faultsTriggered, 2)
  assert.equal(contract.rollbackTriggered, false)
  assert.equal(contract.metrics.requestsTotal, 10000)
  assert.equal(contract.metrics.requestsFailed, 5)
  assert.equal(contract.metrics.latencyP99, 350)
  assert.equal(contract.summary, 'services recovered within 3 min')
})

it('toExperimentResultContract maps failed experiment result', () => {
  const result: ExperimentResult = {
    success: false,
    durationMs: 60000,
    metrics: { requestsTotal: 500, requestsFailed: 400, latencyAvg: 3000, latencyP99: 5000, errorRate: 0.8 },
    faultsTriggered: 1,
    rollbackTriggered: true,
    summary: '系统不可用，自动回滚',
  }
  const contract = toExperimentResultContract(result)
  assert.equal(contract.success, false)
  assert.equal(contract.rollbackTriggered, true)
  assert.equal(contract.metrics.errorRate, 0.8)
  assert.equal(contract.summary, '系统不可用，自动回滚')
})

// ════════════════════════════════════════════════════════════════════════════════
// toRollbackHistoryContract
// ════════════════════════════════════════════════════════════════════════════════

it('toRollbackHistoryContract maps auto-triggered rollback', () => {
  const entry: RollbackHistoryEntry = {
    id: 'rb-xyz789',
    experimentId: 'exp-def456',
    trigger: 'AUTO',
    reason: 'CPU > 90% for 3 consecutive checks',
    triggeredAt: '2026-07-10T02:05:30.000Z',
    completedAt: '2026-07-10T02:05:35.000Z',
    success: true,
    healthCheckPassed: true,
  }
  const contract = toRollbackHistoryContract(entry)
  assert.equal(contract.id, 'rb-xyz789')
  assert.equal(contract.experimentId, 'exp-def456')
  assert.equal(contract.trigger, 'AUTO')
  assert.equal(contract.reason, 'CPU > 90% for 3 consecutive checks')
  assert.equal(contract.triggeredAt, '2026-07-10T02:05:30.000Z')
  assert.equal(contract.completedAt, '2026-07-10T02:05:35.000Z')
  assert.equal(contract.success, true)
  assert.equal(contract.healthCheckPassed, true)
})

it('toRollbackHistoryContract maps manual rollback without completedAt', () => {
  const entry: RollbackHistoryEntry = {
    id: 'rb-manual-001',
    experimentId: 'exp-abc123',
    trigger: 'MANUAL',
    reason: '运维手动触发回滚',
    triggeredAt: '2026-07-10T04:00:00.000Z',
    success: false,
    healthCheckPassed: false,
  }
  const contract = toRollbackHistoryContract(entry)
  assert.equal(contract.trigger, 'MANUAL')
  assert.equal(contract.completedAt, undefined)
  assert.equal(contract.success, false)
  assert.equal(contract.healthCheckPassed, false)
})

it('toRollbackHistoryContract maps scheduled rollback', () => {
  const entry: RollbackHistoryEntry = {
    id: 'rb-sched-002',
    experimentId: 'exp-fail-001',
    trigger: 'SCHEDULED',
    reason: 'scheduled rollback after experiment timeout',
    triggeredAt: '2026-07-10T03:05:00.000Z',
    success: true,
    healthCheckPassed: true,
  }
  const contract = toRollbackHistoryContract(entry)
  assert.equal(contract.trigger, 'SCHEDULED')
  assert.equal(contract.success, true)
})

// ════════════════════════════════════════════════════════════════════════════════
// toSystemMetricsContract
// ════════════════════════════════════════════════════════════════════════════════

it('toSystemMetricsContract maps healthy metrics', () => {
  const metrics: SystemMetrics = {
    cpuUsage: 45,
    memoryUsage: 60,
    errorRate: 0.01,
    latencyAvg: 80,
    healthy: true,
  }
  const contract = toSystemMetricsContract(metrics)
  assert.equal(contract.cpuUsage, 45)
  assert.equal(contract.memoryUsage, 60)
  assert.equal(contract.errorRate, 0.01)
  assert.equal(contract.latencyAvg, 80)
  assert.equal(contract.healthy, true)
})

it('toSystemMetricsContract maps unhealthy metrics', () => {
  const metrics: SystemMetrics = {
    cpuUsage: 92,
    memoryUsage: 88,
    errorRate: 0.25,
    latencyAvg: 2000,
    healthy: false,
  }
  const contract = toSystemMetricsContract(metrics)
  assert.equal(contract.cpuUsage, 92)
  assert.equal(contract.healthy, false)
})

// ════════════════════════════════════════════════════════════════════════════════
// toChaosExperimentContractList
// ════════════════════════════════════════════════════════════════════════════════

it('toChaosExperimentContractList transforms empty list', () => {
  const contracts = toChaosExperimentContractList([])
  assert.deepEqual(contracts, [])
})

it('toChaosExperimentContractList transforms multiple experiments', () => {
  const exps: ChaosExperiment[] = [
    { id: 'exp-1', name: 'Test A', target: 'svc-a', faultInjections: [], status: 'PENDING' as any, createdAt: '2026-07-10T00:00:00.000Z' },
    { id: 'exp-2', name: 'Test B', target: 'svc-b', faultInjections: [], status: 'RUNNING' as any, createdAt: '2026-07-10T00:01:00.000Z', startedAt: '2026-07-10T00:01:00.000Z' },
  ]
  const contracts = toChaosExperimentContractList(exps)
  assert.equal(contracts.length, 2)
  assert.equal(contracts[0].experimentId, 'exp-1')
  assert.equal(contracts[1].experimentId, 'exp-2')
})

// ════════════════════════════════════════════════════════════════════════════════
// toRollbackHistoryContractList
// ════════════════════════════════════════════════════════════════════════════════

it('toRollbackHistoryContractList transforms empty list', () => {
  const contracts = toRollbackHistoryContractList([])
  assert.deepEqual(contracts, [])
})

it('toRollbackHistoryContractList transforms multiple entries', () => {
  const entries: RollbackHistoryEntry[] = [
    { id: 'rb-1', experimentId: 'exp-1', trigger: 'AUTO', reason: 'r1', triggeredAt: '2026-07-10T01:00:00.000Z', success: true, healthCheckPassed: true },
    { id: 'rb-2', experimentId: 'exp-2', trigger: 'MANUAL', reason: 'r2', triggeredAt: '2026-07-10T02:00:00.000Z', success: true, healthCheckPassed: true },
  ]
  const contracts = toRollbackHistoryContractList(entries)
  assert.equal(contracts.length, 2)
  assert.equal(contracts[0].id, 'rb-1')
  assert.equal(contracts[1].id, 'rb-2')
})

// ════════════════════════════════════════════════════════════════════════════════
// P39 边界：极端 / 空值 / 嵌套深层
// ════════════════════════════════════════════════════════════════════════════════

it('P39 边界: experiment with extremely long name should not be truncated', () => {
  const longName = 'A'.repeat(500)
  const exp: ChaosExperiment = {
    id: 'exp-long',
    name: longName,
    target: 'svc',
    faultInjections: [],
    status: 'PENDING' as any,
    createdAt: '2026-07-10T00:00:00.000Z',
  }
  const contract = toChaosExperimentContract(exp)
  assert.equal(contract.name.length, 500)
  assert.equal(contract.name, longName)
})

it('P39 边界: experiment with empty strings in required fields', () => {
  const exp: ChaosExperiment = {
    id: '',
    name: '',
    target: '',
    faultInjections: [],
    status: 'PENDING' as any,
    createdAt: '',
  }
  const contract = toChaosExperimentContract(exp)
  // should not throw; contract should pass through
  assert.equal(contract.experimentId, '')
  assert.equal(contract.name, '')
})

it('P39 边界: fault injection with zero numeric params', () => {
  const fault: FaultInjection = {
    type: 'LATENCY',
    target: 'svc',
    params: { delayMs: 0 },
    active: true,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.params.delayMs, 0)
  assert.equal(contract.active, true)
})

it('P39 边界: fault injection with very large numeric params', () => {
  const fault: FaultInjection = {
    type: 'TIMEOUT',
    target: 'svc',
    params: { timeoutMs: 999999 },
    active: true,
  }
  const contract = toFaultInjectionContract(fault)
  assert.equal(contract.params.timeoutMs, 999999)
})

it('P39 边界: experiment result with zero duration should be accepted', () => {
  const result: ExperimentResult = {
    success: true,
    durationMs: 0,
    metrics: { requestsTotal: 1, requestsFailed: 0, latencyAvg: 0, latencyP99: 0, errorRate: 0 },
    faultsTriggered: 0,
    rollbackTriggered: false,
    summary: 'instant',
  }
  const contract = toExperimentResultContract(result)
  assert.equal(contract.durationMs, 0)
  assert.equal(contract.faultsTriggered, 0)
})
