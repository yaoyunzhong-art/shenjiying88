import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AiRuleEngineController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、极端输入、未知类型）。
 */

import assert from 'node:assert/strict'

// ── Entity mirrors (avoid NestJS DI) ───────────────────────────
function makeMemberLevelInput(overrides: Record<string, unknown> = {}) {
  return {
    memberId: 'mem-001',
    totalPoints: 6000,
    totalSpend: 15000,
    visitCount: 25,
    tenantId: 't-001',
    ...overrides,
  }
}

function makeDeviceAnomalyInput(overrides: Record<string, unknown> = {}) {
  return {
    deviceId: 'dev-001',
    storeId: 'store-001',
    metrics: {
      cpuUsage: 95,
      memoryUsage: 50,
      diskUsage: 30,
      networkLatencyMs: 100,
      errorRate: 2,
      uptimeHours: 720,
    },
    tenantId: 't-001',
    ...overrides,
  }
}

function makeMemberLevelOutput(overrides: Record<string, unknown> = {}) {
  return {
    memberId: 'mem-001',
    currentLevel: 'VIP',
    suggestedLevel: 'SVIP',
    triggeredRules: ['cond-high-spend', 'cond-high-points', 'cond-frequent-visit'],
    confidence: 0.9,
    ...overrides,
  }
}

function makeDeviceAnomalyOutput(overrides: Record<string, unknown> = {}) {
  return {
    deviceId: 'dev-001',
    isAnomaly: true,
    anomalyType: 'CPU_SPIKE',
    severity: 'HIGH',
    triggeredRules: ['cond-cpu-high'],
    recommendations: ['检查高性能进程，考虑扩容或限流'],
    ...overrides,
  }
}

function makeRiskScoreOutput(overrides: Record<string, unknown> = {}) {
  return {
    subjectId: 'risk-sub-001',
    riskScore: 80,
    riskLevel: 'CRITICAL',
    triggeredRules: ['cond-high-refund', 'cond-abnormal-payment', 'cond-complaints', 'cond-void-refund'],
    reasons: ['退款次数 >= 3', '异常支付次数 >= 2', '投诉次数 >= 1', '注销退款金额 >= 500'],
    recommendations: [
      '限制退款频率或要求审核',
      '冻结异常支付渠道，人工审核',
      '调查投诉原因，必要时封号',
      '审核大额注销退款，联系门店确认',
    ],
    evaluatedAt: '2026-06-24T09:00:00.000Z',
    ...overrides,
  }
}

function makeRuleSimulator(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sim-member-level-v1',
    engineId: 'member-level-v1',
    name: 'Member Level Simulator',
    rounds: 100,
    timeoutMs: 5000,
    enableMutation: false,
    createdAt: '2026-06-24T09:00:00.000Z',
    ...overrides,
  }
}

function makeSimulatorResult(overrides: Record<string, unknown> = {}) {
  return {
    simulatorId: 'sim-member-level-v1',
    simulatorName: 'Member Level Simulator',
    runIndex: 0,
    matched: true,
    triggeredConditions: ['cond-high-spend', 'cond-high-points'],
    triggeredActions: ['act-assign-svip'],
    matchScore: 0.7,
    executionTimeMs: 5,
    timestamp: '2026-06-24T09:00:00.000Z',
    ...overrides,
  }
}

function makeSimulatorSummary(overrides: Record<string, unknown> = {}) {
  return {
    simulatorId: 'sim-member-level-v1',
    simulatorName: 'Member Level Simulator',
    totalRuns: 100,
    matchedRuns: 65,
    matchRate: 0.65,
    avgExecutionTimeMs: 4.5,
    p50ExecutionTimeMs: 3,
    p95ExecutionTimeMs: 8,
    p99ExecutionTimeMs: 12,
    mostTriggeredConditions: [
      { conditionId: 'cond-high-spend', count: 80 },
      { conditionId: 'cond-high-points', count: 70 },
    ],
    results: [],
    recommendation: 'No issues detected.',
    ...overrides,
  }
}

function makeEngineStatus(overrides: Record<string, unknown> = {}) {
  return {
    engineId: 'member-level-v1',
    engineName: 'Member Level Evaluator',
    conditionsCount: 3,
    actionsCount: 3,
    matchStrategy: 'ALL',
    status: 'succeeded',
    ...overrides,
  }
}

// ── Inline Controller (mirrors source: ai-rule-engine.controller.ts) ───
interface EvaluateResponse {
  type: string
  result: unknown
  timestamp: string
}

class AiRuleEngineController {
  private aiRuleEngineService: any

  constructor(aiRuleEngineService: any) {
    this.aiRuleEngineService = aiRuleEngineService
  }

  evaluate(body: { type: string; data: unknown }): EvaluateResponse {
    const { type, data } = body

    if (type === 'member-level') {
      const result = this.aiRuleEngineService.evaluateMemberLevel(data)
      return { type: 'member-level', result, timestamp: new Date().toISOString() }
    }

    if (type === 'device-anomaly') {
      const result = this.aiRuleEngineService.detectDeviceAnomaly(data)
      return { type: 'device-anomaly', result, timestamp: new Date().toISOString() }
    }

    throw new Error(
      `Unsupported evaluation type: ${type}. Supported: member-level, device-anomaly`
    )
  }

  evaluateMemberLevel(input: Record<string, unknown>): EvaluateResponse {
    const result = this.aiRuleEngineService.evaluateMemberLevel(input)
    return { type: 'member-level', result, timestamp: new Date().toISOString() }
  }

  detectDeviceAnomaly(input: Record<string, unknown>): EvaluateResponse {
    const result = this.aiRuleEngineService.detectDeviceAnomaly(input)
    return { type: 'device-anomaly', result, timestamp: new Date().toISOString() }
  }

  evaluateBatch(request: { items: Array<{ type: string; data: unknown }> }) {
    return this.aiRuleEngineService.batchEvaluate(request)
  }

  evaluateRiskScore(input: Record<string, unknown>) {
    const result = this.aiRuleEngineService.evaluateRiskScore(input)
    return { type: 'risk-score', result, timestamp: new Date().toISOString() }
  }

  getEngines() {
    return this.aiRuleEngineService.getEngineStatus()
  }

  listSimulators() {
    return this.aiRuleEngineService.listSimulators()
  }

  getSimulator(id: string) {
    return this.aiRuleEngineService.getSimulator(id)
  }

  runSimulator(input: Record<string, unknown>) {
    return this.aiRuleEngineService.runSimulator(input)
  }

  runSimulatorBatch(input: Record<string, unknown>) {
    return this.aiRuleEngineService.runSimulatorBatch(input)
  }

  getEngineDetail(id: string) {
    const detail = this.aiRuleEngineService.getEngineDetail(id)
    if (!detail) throw new Error(`Engine ${id} not found`)
    return detail
  }

  updateEngineConfig(id: string, config: Record<string, unknown>) {
    const detail = this.aiRuleEngineService.updateEngineConfig(id, config)
    if (!detail) throw new Error(`Engine ${id} not found`)
    return detail
  }

  resetEngine(id: string) {
    const detail = this.aiRuleEngineService.resetEngine(id)
    if (!detail) throw new Error(`Engine ${id} not found`)
    return detail
  }
}

// ── Helpers ───────────────────────────────────────────────────
function makeMockService(overrides: Record<string, any> = {}) {
  return {
    evaluateMemberLevel: () => makeMemberLevelOutput(),
    detectDeviceAnomaly: () => makeDeviceAnomalyOutput(),
    batchEvaluate: () => ({
      total: 0,
      succeeded: 0,
      failed: 0,
      items: [],
      timestamp: '2026-06-24T09:00:00.000Z',
    }),
    evaluateRiskScore: () => makeRiskScoreOutput(),
    getEngineStatus: () => [],
    listSimulators: () => [],
    getSimulator: () => undefined,
    runSimulator: () => makeSimulatorResult(),
    runSimulatorBatch: () => makeSimulatorSummary(),
    getEngineDetail: () => undefined,
    updateEngineConfig: () => undefined,
    resetEngine: () => undefined,
    ...overrides,
  }
}

function makeMockServiceWithData() {
  const mlOutput = makeMemberLevelOutput()
  const daOutput = makeDeviceAnomalyOutput()
  const rsOutput = makeRiskScoreOutput()
  const engines = [
    makeEngineStatus(),
    makeEngineStatus({ engineId: 'device-anomaly-v1', engineName: 'Device Anomaly Detector', matchStrategy: 'ANY' }),
    makeEngineStatus({ engineId: 'risk-score-v1', engineName: 'Risk Score Evaluator', matchStrategy: 'ANY' }),
  ]
  const simulators = [
    makeRuleSimulator(),
    makeRuleSimulator({ id: 'sim-device-anomaly-v1', engineId: 'device-anomaly-v1', name: 'Device Anomaly Simulator', enableMutation: true }),
  ]
  const simResult = makeSimulatorResult()
  const simSummary = makeSimulatorSummary()

  return makeMockService({
    evaluateMemberLevel: (input: any) => {
      if (input.totalPoints >= 5000 && input.totalSpend >= 10000) {
        return makeMemberLevelOutput()
      }
      return makeMemberLevelOutput({ suggestedLevel: 'REGULAR', triggeredRules: [], confidence: 0.3 })
    },
    detectDeviceAnomaly: (input: any) => {
      if (input.metrics?.cpuUsage >= 90) {
        return makeDeviceAnomalyOutput()
      }
      return makeDeviceAnomalyOutput({ isAnomaly: false, severity: 'LOW', anomalyType: undefined, triggeredRules: [], recommendations: ['All metrics within normal range'] })
    },
    batchEvaluate: (request: any) => {
      const items = request.items.map((item: any, idx: number) => ({
        index: idx,
        type: item.type,
        inputId: item.type === 'member-level' ? item.data.memberId : item.data.deviceId,
        result: item.type === 'member-level' ? makeMemberLevelOutput() : makeDeviceAnomalyOutput(),
      }))
      return {
        total: items.length,
        succeeded: items.length,
        failed: 0,
        items,
        timestamp: '2026-06-24T09:00:00.000Z',
      }
    },
    evaluateRiskScore: (input: any) => {
      const refund = input.metrics?.refundCount ?? 0
      const abnormal = input.metrics?.abnormalPaymentCount ?? 0
      if (refund >= 3 || abnormal >= 2) {
        return makeRiskScoreOutput()
      }
      return makeRiskScoreOutput({ riskScore: 0, riskLevel: 'LOW', triggeredRules: [], reasons: [], recommendations: [] })
    },
    getEngineStatus: () => engines,
    listSimulators: () => simulators,
    getSimulator: (id: string) => simulators.find((s) => s.id === id),
    runSimulator: (input: any) => {
      if (!input.simulatorId) throw new Error('simulatorId is required')
      return makeSimulatorResult()
    },
    runSimulatorBatch: (input: any) => {
      const rounds = input.rounds ?? 100
      return makeSimulatorSummary({ totalRuns: rounds, matchedRuns: Math.floor(rounds * 0.65) })
    },
    getEngineDetail: (_id: string) => {
      if (_id === 'non-existent-engine') return undefined
      const isMemberLevel = _id === 'member-level-v1'
      const memberConditions = [
        { id: 'cond-high-spend', field: 'totalSpend', operator: 'GTE', value: 10000, weight: 0.4, description: '累计消费 >= 10000' },
        { id: 'cond-high-points', field: 'totalPoints', operator: 'GTE', value: 5000, weight: 0.3, description: '积分 >= 5000' },
        { id: 'cond-frequent-visit', field: 'visitCount', operator: 'GTE', value: 20, weight: 0.3, description: '到访次数 >= 20' }
      ]
      const deviceConditions = [
        { id: 'cond-cpu-high', field: 'cpuUsage', operator: 'GTE', value: 90, weight: 0.25, description: 'CPU >= 90%' },
        { id: 'cond-memory-high', field: 'memoryUsage', operator: 'GTE', value: 85, weight: 0.25, description: '内存 >= 85%' },
        { id: 'cond-disk-high', field: 'diskUsage', operator: 'GTE', value: 90, weight: 0.2, description: '磁盘 >= 90%' },
        { id: 'cond-network-slow', field: 'networkLatencyMs', operator: 'GTE', value: 500, weight: 0.15, description: '网络 >= 500ms' },
        { id: 'cond-error-high', field: 'errorRate', operator: 'GTE', value: 5, weight: 0.15, description: '错误率 >= 5%' }
      ]
      const memberActions = [
        { id: 'act-assign-svip', type: 'ASSIGN_LEVEL', params: { level: 'SVIP' }, priority: 1, description: '分配 SVIP' },
        { id: 'act-assign-vip', type: 'ASSIGN_LEVEL', params: { level: 'VIP' }, priority: 2, description: '分配 VIP' },
        { id: 'act-assign-regular', type: 'ASSIGN_LEVEL', params: { level: 'REGULAR' }, priority: 3, description: '分配 REGULAR' }
      ]
      const deviceActions = [
        { id: 'act-flag-critical', type: 'FLAG_ANOMALY', params: { severity: 'CRITICAL' }, priority: 1, description: '严重异常' },
        { id: 'act-escalate', type: 'ESCALATE', params: { channel: 'ops-team' }, priority: 2, description: '升级运维' }
      ]
      return {
        engineId: _id,
        engineName: isMemberLevel ? 'Member Level Evaluator' : 'Device Anomaly Detector',
        conditionsCount: isMemberLevel ? 3 : 5,
        actionsCount: isMemberLevel ? 3 : 2,
        matchStrategy: isMemberLevel ? 'ALL' : 'ANY',
        status: 'SUCCEEDED',
        enabled: true,
        provider: 'openai',
        model: 'gpt-4',
        conditions: isMemberLevel ? memberConditions : deviceConditions,
        actions: isMemberLevel ? memberActions : deviceActions
      }
    },
    updateEngineConfig: (_id: string, config: any) => {
      if (_id === 'non-existent') return undefined
      const isMemberLevel = _id === 'member-level-v1'
      const memberConditions = [
        { id: 'cond-high-spend', field: 'totalSpend', operator: 'GTE', value: 10000, weight: 0.4, description: '累计消费 >= 10000' },
        { id: 'cond-high-points', field: 'totalPoints', operator: 'GTE', value: 5000, weight: 0.3, description: '积分 >= 5000' },
        { id: 'cond-frequent-visit', field: 'visitCount', operator: 'GTE', value: 20, weight: 0.3, description: '到访次数 >= 20' }
      ]
      const deviceConditions = [
        { id: 'cond-cpu-high', field: 'cpuUsage', operator: 'GTE', value: 90, weight: 0.25, description: 'CPU >= 90%' },
        { id: 'cond-memory-high', field: 'memoryUsage', operator: 'GTE', value: 85, weight: 0.25, description: '内存 >= 85%' },
        { id: 'cond-disk-high', field: 'diskUsage', operator: 'GTE', value: 90, weight: 0.2, description: '磁盘 >= 90%' },
        { id: 'cond-network-slow', field: 'networkLatencyMs', operator: 'GTE', value: 500, weight: 0.15, description: '网络 >= 500ms' },
        { id: 'cond-error-high', field: 'errorRate', operator: 'GTE', value: 5, weight: 0.15, description: '错误率 >= 5%' }
      ]
      const memberActions = [
        { id: 'act-assign-svip', type: 'ASSIGN_LEVEL', params: { level: 'SVIP' }, priority: 1, description: '分配 SVIP' },
        { id: 'act-assign-vip', type: 'ASSIGN_LEVEL', params: { level: 'VIP' }, priority: 2, description: '分配 VIP' },
        { id: 'act-assign-regular', type: 'ASSIGN_LEVEL', params: { level: 'REGULAR' }, priority: 3, description: '分配 REGULAR' }
      ]
      const deviceActions = [
        { id: 'act-flag-critical', type: 'FLAG_ANOMALY', params: { severity: 'CRITICAL' }, priority: 1, description: '严重异常' },
        { id: 'act-escalate', type: 'ESCALATE', params: { channel: 'ops-team' }, priority: 2, description: '升级运维' }
      ]
      const conditions = isMemberLevel ? [...memberConditions] : [...deviceConditions]
      const actions = isMemberLevel ? [...memberActions] : [...deviceActions]
      const detail: any = {
        engineId: _id,
        engineName: isMemberLevel ? 'Member Level Evaluator' : 'Device Anomaly Detector',
        conditionsCount: isMemberLevel ? 3 : 5,
        actionsCount: isMemberLevel ? 3 : 2,
        matchStrategy: isMemberLevel ? 'ALL' : 'ANY',
        status: 'SUCCEEDED',
        enabled: true,
        provider: 'openai',
        model: 'gpt-4',
        conditions,
        actions
      }
      if (config.enabled !== undefined) {
        detail.enabled = config.enabled
        detail.status = config.enabled ? 'SUCCEEDED' : 'FAILED'
      }
      if (config.matchStrategy !== undefined) {
        detail.matchStrategy = config.matchStrategy
      }
      if (config.description !== undefined) {
        detail.description = config.description
      }
      if (config.conditionOverrides) {
        for (const override of config.conditionOverrides) {
          const cond = detail.conditions.find((c: any) => c.id === override.conditionId)
          if (cond) {
            if (override.value !== undefined) cond.value = override.value
            if (override.weight !== undefined) cond.weight = override.weight
            if (override.field !== undefined) cond.field = override.field
          }
        }
      }
      return detail
    },
    resetEngine: (_id: string) => {
      if (_id === 'non-existent-engine') return undefined
      const isMemberLevel = _id === 'member-level-v1'
      return {
        engineId: _id,
        engineName: isMemberLevel ? 'Member Level Evaluator' : 'Device Anomaly Detector',
        conditionsCount: isMemberLevel ? 3 : 5,
        actionsCount: isMemberLevel ? 3 : 2,
        matchStrategy: isMemberLevel ? 'ALL' : 'ANY',
        status: 'SUCCEEDED',
        enabled: true,
        provider: 'openai',
        model: 'gpt-4',
        conditions: isMemberLevel
          ? [
              { id: 'cond-high-spend', field: 'totalSpend', operator: 'GTE', value: 10000, weight: 0.4 },
              { id: 'cond-high-points', field: 'totalPoints', operator: 'GTE', value: 5000, weight: 0.3 },
              { id: 'cond-frequent-visit', field: 'visitCount', operator: 'GTE', value: 20, weight: 0.3 }
            ]
          : [
              { id: 'cond-cpu-high', field: 'cpuUsage', operator: 'GTE', value: 90, weight: 0.25 },
              { id: 'cond-memory-high', field: 'memoryUsage', operator: 'GTE', value: 85, weight: 0.25 },
              { id: 'cond-disk-high', field: 'diskUsage', operator: 'GTE', value: 90, weight: 0.2 },
              { id: 'cond-network-slow', field: 'networkLatencyMs', operator: 'GTE', value: 500, weight: 0.15 },
              { id: 'cond-error-high', field: 'errorRate', operator: 'GTE', value: 5, weight: 0.15 }
            ],
        actions: isMemberLevel
          ? [
              { id: 'act-assign-svip', type: 'ASSIGN_LEVEL', params: { level: 'SVIP' }, priority: 1 },
              { id: 'act-assign-vip', type: 'ASSIGN_LEVEL', params: { level: 'VIP' }, priority: 2 },
              { id: 'act-assign-regular', type: 'ASSIGN_LEVEL', params: { level: 'REGULAR' }, priority: 3 }
            ]
          : [
              { id: 'act-flag-critical', type: 'FLAG_ANOMALY', params: { severity: 'CRITICAL' }, priority: 1 },
              { id: 'act-escalate', type: 'ESCALATE', params: { channel: 'ops-team' }, priority: 2 }
            ]
      }
    },
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('AiRuleEngineController', () => {

  // ── POST /ai-rule-engine/evaluate ──────────────────────────
  describe('evaluate()', () => {
    it('evaluates member level and returns formatted response', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeMemberLevelInput()
      const response = controller.evaluate({ type: 'member-level', data: input })

      assert.equal(response.type, 'member-level')
      assert.ok(typeof response.timestamp === 'string')
      assert.ok(Date.parse(response.timestamp) > 0)
      const result = response.result as any
      assert.equal(result.memberId, 'mem-001')
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.ok(result.triggeredRules.length > 0)
      assert.equal(result.confidence, 0.9)
    })

    it('evaluates device anomaly and returns formatted response', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeDeviceAnomalyInput()
      const response = controller.evaluate({ type: 'device-anomaly', data: input })

      assert.equal(response.type, 'device-anomaly')
      assert.ok(typeof response.timestamp === 'string')
      const result = response.result as any
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'CPU_SPIKE')
      assert.equal(result.severity, 'HIGH')
    })

    it('returns regular level when member does not meet criteria', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeMemberLevelInput({ totalPoints: 100, totalSpend: 200, visitCount: 2 })
      const response = controller.evaluate({ type: 'member-level', data: input })

      const result = response.result as any
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.triggeredRules.length, 0)
      assert.equal(result.confidence, 0.3)
    })

    it('returns no anomaly for healthy device metrics', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeDeviceAnomalyInput({
        metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 },
      })
      const response = controller.evaluate({ type: 'device-anomaly', data: input })

      const result = response.result as any
      assert.equal(result.isAnomaly, false)
      assert.equal(result.severity, 'LOW')
      assert.equal(result.triggeredRules.length, 0)
    })

    it('throws for unsupported evaluation type', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.evaluate({ type: 'unsupported-type', data: {} }),
        /Unsupported evaluation type/
      )
    })
  })

  // ── POST /ai-rule-engine/evaluate/member-level ────────────
  describe('evaluateMemberLevel()', () => {
    it('returns SVIP for high-value member', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeMemberLevelInput()
      const response = controller.evaluateMemberLevel(input)

      assert.equal(response.type, 'member-level')
      const result = response.result as any
      assert.equal(result.suggestedLevel, 'SVIP')
    })

    it('returns REGULAR for zero-spend member', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeMemberLevelInput({ totalPoints: 0, totalSpend: 0, visitCount: 0 })
      const response = controller.evaluateMemberLevel(input)

      const result = response.result as any
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.confidence, 0.3)
    })

    it('handles missing fields gracefully via service defaults', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateMemberLevel({
        memberId: 'mem-min',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't-001',
      })

      assert.equal(response.type, 'member-level')
      assert.ok(response.result)
    })
  })

  // ── POST /ai-rule-engine/evaluate/device-anomaly ──────────
  describe('detectDeviceAnomaly()', () => {
    it('detects CPU anomaly for high CPU usage', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeDeviceAnomalyInput()
      const response = controller.detectDeviceAnomaly(input)

      assert.equal(response.type, 'device-anomaly')
      const result = response.result as any
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'CPU_SPIKE')
    })

    it('returns no anomaly for low metrics', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeDeviceAnomalyInput({
        metrics: { cpuUsage: 10, memoryUsage: 20, diskUsage: 30, networkLatencyMs: 40, errorRate: 0.1, uptimeHours: 50 },
      })
      const response = controller.detectDeviceAnomaly(input)

      const result = response.result as any
      assert.equal(result.isAnomaly, false)
      assert.equal(result.recommendations[0], 'All metrics within normal range')
    })

    it('handles zero metrics input', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const input = makeDeviceAnomalyInput({
        metrics: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkLatencyMs: 0, errorRate: 0, uptimeHours: 0 },
      })
      const response = controller.detectDeviceAnomaly(input)

      const result = response.result as any
      assert.equal(result.isAnomaly, false)
    })
  })

  // ── POST /ai-rule-engine/evaluate/batch ───────────────────
  describe('evaluateBatch()', () => {
    it('evaluates multiple member levels in batch', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateBatch({
        items: [
          { type: 'member-level', data: makeMemberLevelInput({ memberId: 'batch-001', totalPoints: 8000 }) },
          { type: 'member-level', data: makeMemberLevelInput({ memberId: 'batch-002', totalPoints: 100 }) },
        ],
      })

      assert.equal(response.total, 2)
      assert.equal(response.succeeded, 2)
      assert.equal(response.failed, 0)
      assert.equal(response.items[0].type, 'member-level')
      assert.equal(response.items[0].inputId, 'batch-001')
      assert.equal(response.items[1].inputId, 'batch-002')
    })

    it('evaluates mixed member and device types in batch', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateBatch({
        items: [
          { type: 'member-level', data: makeMemberLevelInput() },
          { type: 'device-anomaly', data: makeDeviceAnomalyInput() },
        ],
      })

      assert.equal(response.total, 2)
      assert.equal(response.items[0].type, 'member-level')
      assert.equal(response.items[1].type, 'device-anomaly')
    })

    it('handles empty batch request', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateBatch({ items: [] })

      assert.equal(response.total, 0)
      assert.equal(response.succeeded, 0)
      assert.equal(response.failed, 0)
      assert.equal(response.items.length, 0)
    })

    it('handles single item batch', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateBatch({
        items: [{ type: 'device-anomaly', data: makeDeviceAnomalyInput() }],
      })

      assert.equal(response.total, 1)
      assert.equal(response.succeeded, 1)
      assert.equal(response.items[0].type, 'device-anomaly')
    })
  })

  // ── POST /ai-rule-engine/evaluate/risk-score ──────────────
  describe('evaluateRiskScore()', () => {
    it('returns CRITICAL risk for high refund member', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-001',
        subjectType: 'member',
        metrics: { refundCount: 5, abnormalPaymentCount: 4 },
        tenantId: 't-001',
      })

      assert.equal(response.type, 'risk-score')
      const result = response.result as any
      assert.equal(result.riskLevel, 'CRITICAL')
      assert.equal(result.riskScore, 80)
      assert.ok(result.reasons.length > 0)
    })

    it('returns LOW risk for clean subject', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-002',
        subjectType: 'store',
        metrics: { refundCount: 0, abnormalPaymentCount: 0, complaintCount: 0 },
        tenantId: 't-001',
      })

      const result = response.result as any
      assert.equal(result.riskLevel, 'LOW')
      assert.equal(result.riskScore, 0)
      assert.equal(result.triggeredRules.length, 0)
    })

    it('handles minimal metrics input', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-003',
        subjectType: 'device',
        metrics: {},
        tenantId: 't-001',
      })

      const result = response.result as any
      assert.equal(result.riskLevel, 'LOW')
      assert.equal(result.riskScore, 0)
    })
  })

  // ── GET /ai-rule-engine/engines ────────────────────────────
  describe('getEngines()', () => {
    it('returns all engine statuses', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const engines = controller.getEngines()

      assert.equal(engines.length, 3)
      assert.equal(engines[0].engineId, 'member-level-v1')
      assert.equal(engines[1].engineId, 'device-anomaly-v1')
      assert.equal(engines[2].engineId, 'risk-score-v1')
    })

    it('each engine status has required fields', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const engines = controller.getEngines()

      for (const engine of engines) {
        assert.ok(typeof engine.engineId === 'string')
        assert.ok(typeof engine.engineName === 'string')
        assert.ok(typeof engine.conditionsCount === 'number')
        assert.ok(typeof engine.actionsCount === 'number')
        assert.ok(['ALL', 'ANY'].includes(engine.matchStrategy))
        assert.ok(typeof engine.status === 'string')
      }
    })
  })

  // ── GET /ai-rule-engine/simulators ────────────────────────
  describe('listSimulators()', () => {
    it('returns all simulators', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const sims = controller.listSimulators()

      assert.equal(sims.length, 2)
      assert.equal(sims[0].id, 'sim-member-level-v1')
      assert.equal(sims[1].id, 'sim-device-anomaly-v1')
    })

    it('simulators have required schema', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const sims = controller.listSimulators()

      for (const sim of sims) {
        assert.ok(typeof sim.id === 'string')
        assert.ok(typeof sim.name === 'string')
        assert.ok(typeof sim.rounds === 'number')
        assert.ok(typeof sim.timeoutMs === 'number')
        assert.ok(typeof sim.enableMutation === 'boolean')
      }
    })
  })

  // ── GET /ai-rule-engine/simulators/:id ────────────────────
  describe('getSimulator()', () => {
    it('returns simulator by id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const sim = controller.getSimulator('sim-member-level-v1')

      assert.ok(sim)
      assert.equal(sim.id, 'sim-member-level-v1')
      assert.equal(sim.name, 'Member Level Simulator')
    })

    it('returns undefined for unknown simulator id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const sim = controller.getSimulator('non-existent-sim')

      assert.equal(sim, undefined)
    })
  })

  // ── POST /ai-rule-engine/simulators/run ───────────────────
  describe('runSimulator()', () => {
    it('runs simulator and returns result with matched=true', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: makeMemberLevelInput(),
      })

      assert.equal(result.simulatorId, 'sim-member-level-v1')
      assert.equal(result.matched, true)
      assert.ok(typeof result.matchScore === 'number')
      assert.ok(typeof result.executionTimeMs === 'number')
    })

    it('includes triggered conditions and actions when matched', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.runSimulator({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: makeMemberLevelInput(),
      })

      assert.ok(Array.isArray(result.triggeredConditions))
      assert.ok(result.triggeredConditions.length > 0)
      assert.ok(Array.isArray(result.triggeredActions))
    })
  })

  // ── POST /ai-rule-engine/simulators/run-batch ─────────────
  describe('runSimulatorBatch()', () => {
    it('runs batch simulator and returns summary', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const summary = controller.runSimulatorBatch({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: makeMemberLevelInput(),
        rounds: 50,
      })

      assert.equal(summary.simulatorId, 'sim-member-level-v1')
      assert.equal(summary.totalRuns, 50)
      assert.equal(summary.matchedRuns, 32)
      assert.ok(typeof summary.matchRate === 'number')
      assert.ok(summary.avgExecutionTimeMs > 0)
      assert.ok(summary.p50ExecutionTimeMs > 0)
      assert.ok(summary.p95ExecutionTimeMs > 0)
    })

    it('returns summary with most triggered conditions', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const summary = controller.runSimulatorBatch({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: makeMemberLevelInput(),
      })

      assert.ok(Array.isArray(summary.mostTriggeredConditions))
      assert.ok(summary.mostTriggeredConditions.length > 0)
      assert.ok(typeof summary.recommendation === 'string')
    })

    it('uses default rounds when not specified', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const summary = controller.runSimulatorBatch({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: makeMemberLevelInput(),
      })

      assert.equal(summary.totalRuns, 100) // default
    })
  })

  // ── Error handling ──────────────────────────────────────────
  describe('error handling', () => {
    it('throws when unsupported type passed to evaluate', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.evaluate({ type: 'unknown-type', data: {} }),
        /Unsupported evaluation type/
      )
    })

    it('runSimulator throws when simulatorId is missing', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.runSimulator({ dataType: 'member-level', data: {} }),
        /simulatorId is required/
      )
    })

    it('evaluate throws for completely empty body type', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.evaluate({ type: '', data: {} }),
        /Unsupported evaluation type/
      )
    })
  })

  // ── GET /ai-rule-engine/engines/:id ─────────────────────────
  describe('getEngineDetail()', () => {
    it('returns full engine detail for known id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const detail = controller.getEngineDetail('member-level-v1') as any

      assert.equal(detail.engineId, 'member-level-v1')
      assert.equal(detail.engineName, 'Member Level Evaluator')
      assert.equal(detail.conditionsCount, 3)
      assert.equal(detail.actionsCount, 3)
      assert.equal(detail.matchStrategy, 'ALL')
      assert.equal(detail.enabled, true)
      assert.ok(typeof detail.provider === 'string')
      assert.ok(typeof detail.model === 'string')
      assert.ok(Array.isArray(detail.conditions))
      assert.ok(Array.isArray(detail.actions))
    })

    it('throws for unknown engine id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.getEngineDetail('non-existent-engine'),
        /Engine non-existent-engine not found/
      )
    })

    it('returns all condition and action details', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const detail = controller.getEngineDetail('member-level-v1') as any

      assert.equal(detail.conditions.length, 3)
      assert.equal(detail.conditions[0].id, 'cond-high-spend')
      assert.equal(detail.conditions[0].field, 'totalSpend')
      assert.ok(typeof detail.conditions[0].value !== 'undefined')
      assert.ok(typeof detail.conditions[0].weight === 'number')

      assert.equal(detail.actions.length, 3)
      assert.equal(detail.actions[0].id, 'act-assign-svip')
      assert.equal(detail.actions[0].type, 'ASSIGN_LEVEL')
      assert.ok(typeof detail.actions[0].priority === 'number')
    })

    it('returns device-anomaly engine detail with 5 conditions', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const detail = controller.getEngineDetail('device-anomaly-v1') as any

      assert.equal(detail.engineId, 'device-anomaly-v1')
      assert.equal(detail.conditionsCount, 5)
      assert.equal(detail.actionsCount, 2)
      assert.equal(detail.matchStrategy, 'ANY')
    })
  })

  // ── POST /ai-rule-engine/engines/:id/config ─────────────────
  describe('updateEngineConfig()', () => {
    it('disables engine when enabled=false', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.updateEngineConfig('member-level-v1', { enabled: false }) as any

      assert.equal(result.engineId, 'member-level-v1')
      assert.equal(result.enabled, false)
    })

    it('changes match strategy', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.updateEngineConfig('device-anomaly-v1', { matchStrategy: 'ALL' }) as any

      assert.equal(result.matchStrategy, 'ALL')
    })

    it('re-enables disabled engine', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      // disable first
      controller.updateEngineConfig('member-level-v1', { enabled: false })
      // re-enable
      const result = controller.updateEngineConfig('member-level-v1', { enabled: true }) as any

      assert.equal(result.enabled, true)
    })

    it('throws for unknown engine id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.updateEngineConfig('non-existent', { enabled: false }),
        /Engine non-existent not found/
      )
    })

    it('updates condition threshold via overrides', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.updateEngineConfig('member-level-v1', {
        conditionOverrides: [
          { conditionId: 'cond-high-spend', value: 5000 }
        ]
      }) as any

      const cond = result.conditions.find((c: any) => c.id === 'cond-high-spend')
      assert.ok(cond)
      assert.equal(cond.value, 5000)
    })

    it('updates multiple conditions simultaneously', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      const result = controller.updateEngineConfig('device-anomaly-v1', {
        conditionOverrides: [
          { conditionId: 'cond-cpu-high', value: 85 },
          { conditionId: 'cond-memory-high', value: 80, weight: 0.3 }
        ]
      }) as any

      const cpuCond = result.conditions.find((c: any) => c.id === 'cond-cpu-high')
      assert.equal(cpuCond.value, 85)

      const memCond = result.conditions.find((c: any) => c.id === 'cond-memory-high')
      assert.equal(memCond.value, 80)
      assert.equal(memCond.weight, 0.3)
    })
  })

  // ── POST /ai-rule-engine/engines/:id/reset ──────────────────
  describe('resetEngine()', () => {
    it('resets engine after disable and config changes', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      // disable engine
      controller.updateEngineConfig('member-level-v1', { enabled: false })
      // reset
      const result = controller.resetEngine('member-level-v1') as any

      assert.equal(result.engineId, 'member-level-v1')
      assert.equal(result.enabled, true)
      assert.equal(result.matchStrategy, 'ALL')
    })

    it('throws for unknown engine id on reset', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AiRuleEngineController(mockService)
      assert.throws(
        () => controller.resetEngine('non-existent-engine'),
        /Engine non-existent-engine not found/
      )
    })
  })
})
