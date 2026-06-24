import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { PolicyConditionOperator, AiProvider, AiExecutionStatus } from '@m5/domain'
import type {
  RuleCondition,
  RuleAction,
  RuleEngine,
  MemberLevelInput,
  MemberLevelOutput,
  DeviceAnomalyInput,
  DeviceAnomalyOutput,
  BatchEvaluateRequest,
  BatchEvaluateItem,
  BatchEvaluateResponse,
  EngineStatus
} from './ai-rule-engine.entity'

// ── RuleCondition type contract ─────────────────────────────────
describe('ai-rule-engine.entity: RuleCondition', () => {
  test('creates valid RuleCondition with all required fields', () => {
    const cond: RuleCondition = {
      id: 'cond-001',
      engineId: 'engine-v1',
      field: 'totalSpend',
      operator: PolicyConditionOperator.Gte,
      value: 10000,
      weight: 0.4,
      description: '消费金额 >= 10000'
    }

    assert.equal(cond.id, 'cond-001')
    assert.equal(cond.engineId, 'engine-v1')
    assert.equal(cond.field, 'totalSpend')
    assert.equal(cond.operator, PolicyConditionOperator.Gte)
    assert.equal(cond.value, 10000)
    assert.equal(cond.weight, 0.4)
    assert.equal(cond.description, '消费金额 >= 10000')
  })

  test('creates RuleCondition without optional description', () => {
    const cond: RuleCondition = {
      id: 'cond-002',
      engineId: 'engine-v1',
      field: 'visitCount',
      operator: PolicyConditionOperator.Lte,
      value: 5,
      weight: 0.3
    }

    assert.equal(cond.id, 'cond-002')
    assert.equal(cond.description, undefined)
  })

  test('weight is a number in 0-1 range', () => {
    const cond: RuleCondition = {
      id: 'cond-003',
      engineId: 'engine-v2',
      field: 'errorRate',
      operator: PolicyConditionOperator.Gte,
      value: 5,
      weight: 0.15
    }

    assert.ok(cond.weight >= 0 && cond.weight <= 1)
  })

  test('value supports unknown type for flexibility', () => {
    const stringCond: RuleCondition = {
      id: 'cond-str',
      engineId: 'eng-str',
      field: 'status',
      operator: PolicyConditionOperator.Eq,
      value: 'ACTIVE',
      weight: 1
    }
    assert.equal(stringCond.value, 'ACTIVE')

    const arrayCond: RuleCondition = {
      id: 'cond-arr',
      engineId: 'eng-arr',
      field: 'level',
      operator: PolicyConditionOperator.In,
      value: ['VIP', 'SVIP'],
      weight: 1
    }
    assert.deepEqual(arrayCond.value, ['VIP', 'SVIP'])
  })
})

// ── RuleAction type contract ────────────────────────────────────
describe('ai-rule-engine.entity: RuleAction', () => {
  test('creates valid ASSIGN_LEVEL action', () => {
    const action: RuleAction = {
      id: 'act-001',
      engineId: 'engine-v1',
      type: 'ASSIGN_LEVEL',
      params: { level: 'SVIP' },
      priority: 1,
      description: '分配 SVIP 等级'
    }

    assert.equal(action.id, 'act-001')
    assert.equal(action.type, 'ASSIGN_LEVEL')
    assert.deepEqual(action.params, { level: 'SVIP' })
    assert.equal(action.priority, 1)
  })

  test('creates valid FLAG_ANOMALY action', () => {
    const action: RuleAction = {
      id: 'act-002',
      engineId: 'engine-v2',
      type: 'FLAG_ANOMALY',
      params: { severity: 'CRITICAL' },
      priority: 2
    }

    assert.equal(action.type, 'FLAG_ANOMALY')
    assert.equal(action.priority, 2)
  })

  test('creates valid SEND_NOTIFICATION action', () => {
    const action: RuleAction = {
      id: 'act-003',
      engineId: 'engine-v1',
      type: 'SEND_NOTIFICATION',
      params: { channel: 'sms', message: '异常告警' },
      priority: 3
    }

    assert.equal(action.type, 'SEND_NOTIFICATION')
  })

  test('creates valid ESCALATE action', () => {
    const action: RuleAction = {
      id: 'act-004',
      engineId: 'engine-v1',
      type: 'ESCALATE',
      params: { channel: 'ops-team' },
      priority: 1
    }

    assert.equal(action.type, 'ESCALATE')
  })

  test('priority is within valid range 1-10', () => {
    const low: RuleAction = {
      id: 'low-prio',
      engineId: 'eng',
      type: 'SEND_NOTIFICATION',
      params: {},
      priority: 10
    }
    assert.equal(low.priority, 10)

    const high: RuleAction = {
      id: 'high-prio',
      engineId: 'eng',
      type: 'ASSIGN_LEVEL',
      params: {},
      priority: 1
    }
    assert.equal(high.priority, 1)
  })
})

// ── RuleEngine type contract ────────────────────────────────────
describe('ai-rule-engine.entity: RuleEngine', () => {
  test('creates valid RuleEngine with ALL match strategy', () => {
    const conditions: RuleCondition[] = [
      { id: 'c1', engineId: 'eng-v1', field: 'points', operator: PolicyConditionOperator.Gte, value: 5000, weight: 0.5 },
      { id: 'c2', engineId: 'eng-v1', field: 'spend', operator: PolicyConditionOperator.Gte, value: 10000, weight: 0.5 }
    ]

    const actions: RuleAction[] = [
      { id: 'a1', engineId: 'eng-v1', type: 'ASSIGN_LEVEL', params: { level: 'VIP' }, priority: 1 }
    ]

    const engine: RuleEngine = {
      id: 'eng-v1',
      name: 'Member Level Evaluator',
      provider: AiProvider.DeepSeek,
      model: 'deepseek-v4',
      conditions,
      actions,
      matchStrategy: 'ALL',
      status: AiExecutionStatus.Succeeded,
      description: '评估会员等级'
    }

    assert.equal(engine.id, 'eng-v1')
    assert.equal(engine.provider, AiProvider.DeepSeek)
    assert.equal(engine.matchStrategy, 'ALL')
    assert.equal(engine.conditions.length, 2)
    assert.equal(engine.actions.length, 1)
    assert.equal(engine.status, AiExecutionStatus.Succeeded)
  })

  test('creates valid RuleEngine with ANY match strategy', () => {
    const engine: RuleEngine = {
      id: 'eng-v2',
      name: 'Device Anomaly Detector',
      provider: AiProvider.DeepSeek,
      model: 'deepseek-v4',
      conditions: [],
      actions: [],
      matchStrategy: 'ANY',
      status: AiExecutionStatus.Pending
    }

    assert.equal(engine.matchStrategy, 'ANY')
    assert.equal(engine.status, AiExecutionStatus.Pending)
    assert.equal(engine.conditions.length, 0)
  })

  test('lastEvaluatedAt is optional and can be ISO date string', () => {
    const engine: RuleEngine = {
      id: 'eng-v3',
      name: 'Test Engine',
      provider: AiProvider.DeepSeek,
      model: 'deepseek-v4',
      conditions: [],
      actions: [],
      matchStrategy: 'ALL',
      status: AiExecutionStatus.Succeeded,
      lastEvaluatedAt: '2026-06-14T06:00:00.000Z'
    }

    assert.equal(engine.lastEvaluatedAt, '2026-06-14T06:00:00.000Z')
    // Verify it's valid ISO
    assert.ok(!isNaN(Date.parse(engine.lastEvaluatedAt)))
  })

  test('description is optional', () => {
    const engine: RuleEngine = {
      id: 'eng-no-desc',
      name: 'No Description',
      provider: AiProvider.OpenAI,
      model: 'gpt-4',
      conditions: [],
      actions: [],
      matchStrategy: 'ANY',
      status: AiExecutionStatus.Failed
    }

    assert.equal(engine.description, undefined)
  })
})

// ── MemberLevelInput type contract ──────────────────────────────
describe('ai-rule-engine.entity: MemberLevelInput', () => {
  test('creates valid MemberLevelInput', () => {
    const input: MemberLevelInput = {
      memberId: 'mem-001',
      totalPoints: 6000,
      totalSpend: 12000,
      visitCount: 25,
      tenantId: 'tenant-1'
    }

    assert.equal(input.memberId, 'mem-001')
    assert.equal(input.totalPoints, 6000)
    assert.equal(input.totalSpend, 12000)
    assert.equal(input.visitCount, 25)
    assert.equal(input.tenantId, 'tenant-1')
  })

  test('accepts zero values for new members', () => {
    const input: MemberLevelInput = {
      memberId: 'new-member',
      totalPoints: 0,
      totalSpend: 0,
      visitCount: 0,
      tenantId: 'tenant-1'
    }

    assert.equal(input.totalPoints, 0)
    assert.equal(input.totalSpend, 0)
    assert.equal(input.visitCount, 0)
  })

  test('field types are correct', () => {
    const input: MemberLevelInput = {
      memberId: 'mem-002',
      totalPoints: 3000,
      totalSpend: 8000,
      visitCount: 15,
      tenantId: 'tenant-2'
    }

    assert.equal(typeof input.memberId, 'string')
    assert.equal(typeof input.totalPoints, 'number')
    assert.equal(typeof input.totalSpend, 'number')
    assert.equal(typeof input.visitCount, 'number')
    assert.equal(typeof input.tenantId, 'string')
  })
})

// ── MemberLevelOutput type contract ─────────────────────────────
describe('ai-rule-engine.entity: MemberLevelOutput', () => {
  test('creates valid MemberLevelOutput with triggered rules', () => {
    const output: MemberLevelOutput = {
      memberId: 'mem-001',
      currentLevel: 'VIP',
      suggestedLevel: 'SVIP',
      triggeredRules: ['cond-high-spend', 'cond-frequent-visit'],
      confidence: 0.85
    }

    assert.equal(output.memberId, 'mem-001')
    assert.equal(output.currentLevel, 'VIP')
    assert.equal(output.suggestedLevel, 'SVIP')
    assert.deepEqual(output.triggeredRules, ['cond-high-spend', 'cond-frequent-visit'])
    assert.ok(output.confidence >= 0 && output.confidence <= 1)
  })

  test('creates output with no triggered rules（无匹配）', () => {
    const output: MemberLevelOutput = {
      memberId: 'mem-002',
      currentLevel: 'REGULAR',
      suggestedLevel: 'REGULAR',
      triggeredRules: [],
      confidence: 0.3
    }

    assert.equal(output.triggeredRules.length, 0)
    assert.equal(output.confidence, 0.3)
  })

  test('confidence is always between 0 and 1', () => {
    const boundaries = [0, 0.5, 1.0]
    for (const c of boundaries) {
      const output: MemberLevelOutput = {
        memberId: 'mem-test',
        currentLevel: 'REGULAR',
        suggestedLevel: 'REGULAR',
        triggeredRules: [],
        confidence: c
      }
      assert.ok(output.confidence >= 0 && output.confidence <= 1)
    }
  })
})

// ── DeviceAnomalyInput type contract ────────────────────────────
describe('ai-rule-engine.entity: DeviceAnomalyInput', () => {
  test('creates valid DeviceAnomalyInput', () => {
    const input: DeviceAnomalyInput = {
      deviceId: 'dev-001',
      storeId: 'store-1',
      metrics: {
        cpuUsage: 95,
        memoryUsage: 88,
        diskUsage: 92,
        networkLatencyMs: 600,
        errorRate: 7,
        uptimeHours: 100
      },
      tenantId: 'tenant-1'
    }

    assert.equal(input.deviceId, 'dev-001')
    assert.equal(input.storeId, 'store-1')
    assert.equal(input.metrics.cpuUsage, 95)
    assert.equal(input.metrics.memoryUsage, 88)
    assert.equal(input.metrics.diskUsage, 92)
    assert.equal(input.metrics.networkLatencyMs, 600)
    assert.equal(input.metrics.errorRate, 7)
    assert.equal(input.metrics.uptimeHours, 100)
    assert.equal(input.tenantId, 'tenant-1')
  })

  test('metrics fields are all numbers', () => {
    const input: DeviceAnomalyInput = {
      deviceId: 'dev-002',
      storeId: 'store-2',
      metrics: {
        cpuUsage: 50,
        memoryUsage: 50,
        diskUsage: 50,
        networkLatencyMs: 100,
        errorRate: 1,
        uptimeHours: 200
      },
      tenantId: 'tenant-2'
    }

    for (const [key, val] of Object.entries(input.metrics)) {
      assert.equal(typeof val, 'number', `metrics.${key} should be number`)
    }
  })
})

// ── DeviceAnomalyOutput type contract ───────────────────────────
describe('ai-rule-engine.entity: DeviceAnomalyOutput', () => {
  test('creates anomaly detected output with CRITICAL severity', () => {
    const output: DeviceAnomalyOutput = {
      deviceId: 'dev-001',
      isAnomaly: true,
      anomalyType: 'CPU_SPIKE',
      severity: 'CRITICAL',
      triggeredRules: ['cond-cpu-high', 'cond-memory-high', 'cond-disk-high'],
      recommendations: ['检查高性能进程', '排查内存泄漏', '清理日志']
    }

    assert.equal(output.isAnomaly, true)
    assert.equal(output.anomalyType, 'CPU_SPIKE')
    assert.equal(output.severity, 'CRITICAL')
    assert.ok(output.triggeredRules.length >= 3)
  })

  test('creates normal output with no anomaly', () => {
    const output: DeviceAnomalyOutput = {
      deviceId: 'dev-002',
      isAnomaly: false,
      severity: 'LOW',
      triggeredRules: [],
      recommendations: ['All metrics within normal range']
    }

    assert.equal(output.isAnomaly, false)
    assert.equal(output.severity, 'LOW')
    assert.equal(output.anomalyType, undefined)
    assert.equal(output.triggeredRules.length, 0)
  })

  test('severity extends valid values: LOW / MEDIUM / HIGH / CRITICAL', () => {
    const severities: DeviceAnomalyOutput['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    for (const sev of severities) {
      const output: DeviceAnomalyOutput = {
        deviceId: 'dev-sev',
        isAnomaly: sev !== 'LOW',
        severity: sev,
        triggeredRules: [],
        recommendations: []
      }
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(output.severity))
    }
  })

// ── BatchEvaluate type contracts ─────────────────────────────────
describe('ai-rule-engine.entity: BatchEvaluate', () => {
  test('creates valid BatchEvaluateRequest with mixed items', () => {
    const request: BatchEvaluateRequest = {
      items: [
        {
          type: 'member-level',
          data: { memberId: 'mem-001', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' }
        },
        {
          type: 'device-anomaly',
          data: {
            deviceId: 'dev-001', storeId: 'store-1',
            metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
            tenantId: 't-001'
          }
        }
      ]
    }

    assert.equal(request.items.length, 2)
    assert.equal(request.items[0].type, 'member-level')
    assert.equal(request.items[1].type, 'device-anomaly')
  })

  test('BatchEvaluateItem carries index and result', () => {
    const item: BatchEvaluateItem = {
      index: 0,
      type: 'member-level',
      inputId: 'mem-001',
      result: {
        memberId: 'mem-001',
        currentLevel: 'VIP',
        suggestedLevel: 'SVIP',
        triggeredRules: ['cond-high-spend'],
        confidence: 0.85
      }
    }

    assert.equal(item.index, 0)
    assert.equal(item.inputId, 'mem-001')
    assert.equal(item.type, 'member-level')
    assert.ok((item.result as { confidence: number }).confidence >= 0)
  })

  test('BatchEvaluateResponse includes summary stats', () => {
    const response: BatchEvaluateResponse = {
      total: 3,
      succeeded: 3,
      failed: 0,
      items: [],
      timestamp: new Date().toISOString()
    }

    assert.equal(response.total, 3)
    assert.equal(response.succeeded, 3)
    assert.equal(response.failed, 0)
    assert.ok(new Date(response.timestamp).getTime() > 0)
  })

  test('BatchEvaluateResponse handles partial failures', () => {
    const response: BatchEvaluateResponse = {
      total: 5,
      succeeded: 3,
      failed: 2,
      items: [],
      timestamp: new Date().toISOString()
    }

    assert.equal(response.succeeded + response.failed, response.total)
  })
})

// ── EngineStatus type contract ──────────────────────────────────
describe('ai-rule-engine.entity: EngineStatus', () => {
  test('creates valid EngineStatus snapshot', () => {
    const status: EngineStatus = {
      engineId: 'member-level-v1',
      engineName: 'Member Level Evaluator',
      conditionsCount: 3,
      actionsCount: 3,
      matchStrategy: 'ALL',
      status: AiExecutionStatus.Succeeded,
      lastEvaluatedAt: '2026-06-14T08:00:00.000Z'
    }

    assert.equal(status.engineId, 'member-level-v1')
    assert.equal(status.conditionsCount, 3)
    assert.equal(status.actionsCount, 3)
    assert.equal(status.matchStrategy, 'ALL')
    assert.equal(status.status, AiExecutionStatus.Succeeded)
  })

  test('EngineStatus lastEvaluatedAt is optional', () => {
    const status: EngineStatus = {
      engineId: 'device-anomaly-v1',
      engineName: 'Device Anomaly Detector',
      conditionsCount: 5,
      actionsCount: 2,
      matchStrategy: 'ANY',
      status: AiExecutionStatus.Pending
    }

    assert.equal(status.lastEvaluatedAt, undefined)
  })
})

  test('anomalyType valid values', () => {
    const types: DeviceAnomalyOutput['anomalyType'][] = [
      'CPU_SPIKE', 'MEMORY_LEAK', 'DISK_FULL', 'NETWORK_LATENCY', 'HIGH_ERROR_RATE'
    ]
    for (const t of types) {
      const output: DeviceAnomalyOutput = {
        deviceId: 'dev-type',
        isAnomaly: true,
        anomalyType: t,
        severity: 'MEDIUM',
        triggeredRules: ['cond-1'],
        recommendations: ['check']
      }
      assert.ok([
        'CPU_SPIKE', 'MEMORY_LEAK', 'DISK_FULL', 'NETWORK_LATENCY', 'HIGH_ERROR_RATE'
      ].includes(output.anomalyType!))
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-3 🐜7 补强：DiagnosisEntity / DiagnosisBatch 单元测试
// ──────────────────────────────────────────────────────────────────────────

test('entity: DiagnosisEntity shape validation with COMPLETED status', () => {
  const entity: import('./ai-rule-engine.entity').DiagnosisEntity = {
    diagnosisId: 'diag-001',
    engineId: 'engine-fraud-v1',
    scenarioId: 'scenario-spike-tx',
    status: 'COMPLETED',
    matchedRuleIds: ['rule-spike-amount'],
    matchedConditionIds: ['cond-amount-gt-50k'],
    triggeredActionIds: ['action-flag-anomaly'],
    riskLevel: 'high',
    recommendation: '建议加强大额交易的人工审核',
    promptSummary: 'amount=60000, freq=12/min',
    evaluationDurationMs: 18,
    inputSnapshot: { amount: 60000, frequency: 12 },
    outputSnapshot: { matched: true, risk: 'high' },
    createdAt: '2026-06-23T10:00:00.000Z',
    completedAt: '2026-06-23T10:00:00.018Z',
    tenantId: 'tenant-demo',
    requestedBy: 'sec-admin-001'
  }
  assert.equal(entity.status, 'COMPLETED')
  assert.equal(entity.matchedRuleIds.length, 1)
  assert.equal(entity.riskLevel, 'high')
  assert.ok(entity.completedAt, 'expected completedAt to be set on COMPLETED status')
})

test('entity: DiagnosisEntity without completedAt is valid for PENDING status', () => {
  const entity: import('./ai-rule-engine.entity').DiagnosisEntity = {
    diagnosisId: 'diag-002',
    engineId: 'engine-fraud-v1',
    scenarioId: 'scenario-pending',
    status: 'PENDING',
    matchedRuleIds: [],
    matchedConditionIds: [],
    triggeredActionIds: [],
    riskLevel: 'low',
    recommendation: '',
    promptSummary: '',
    evaluationDurationMs: 0,
    inputSnapshot: {},
    outputSnapshot: {},
    createdAt: '2026-06-23T10:01:00.000Z',
    tenantId: 'tenant-demo',
    requestedBy: 'system'
  }
  assert.equal(entity.status, 'PENDING')
  assert.equal(entity.completedAt, undefined)
  assert.equal(entity.matchedRuleIds.length, 0)
})

test('entity: DiagnosisBatch riskDistribution sums to totalDiagnoses', () => {
  const batch: import('./ai-rule-engine.entity').DiagnosisBatch = {
    batchId: 'batch-001',
    engineId: 'engine-fraud-v2',
    totalDiagnoses: 10,
    matchedDiagnoses: 7,
    matchRate: 0.7,
    riskDistribution: { low: 3, medium: 4, high: 2, critical: 1 },
    avgEvaluationDurationMs: 22,
    diagnoses: [],
    createdAt: '2026-06-23T10:00:00.000Z',
    triggeredBy: 'sec-admin-001',
    tenantId: 'tenant-demo'
  }
  const sum = batch.riskDistribution.low + batch.riskDistribution.medium + batch.riskDistribution.high + batch.riskDistribution.critical
  assert.equal(sum, batch.totalDiagnoses)
  assert.equal(batch.matchRate, 0.7)
})

test('entity: DiagnosisBatch with zero match preserves zero matchRate', () => {
  const batch: import('./ai-rule-engine.entity').DiagnosisBatch = {
    batchId: 'batch-002',
    engineId: 'engine-fraud-v2',
    totalDiagnoses: 5,
    matchedDiagnoses: 0,
    matchRate: 0,
    riskDistribution: { low: 5, medium: 0, high: 0, critical: 0 },
    avgEvaluationDurationMs: 8,
    diagnoses: [],
    createdAt: '2026-06-23T10:05:00.000Z',
    triggeredBy: 'sec-admin-002',
    tenantId: 'tenant-demo'
  }
  assert.equal(batch.matchedDiagnoses, 0)
  assert.equal(batch.matchRate, 0)
})
