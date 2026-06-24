import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'

describe('DiagnosisEntity 类型形状', () => {
  // ── 构造合规对象并验证字段 ──

  test('应支持 PENDING 状态的诊断实体', () => {
    const diagnosis: DiagnosisEntity = {
      diagnosisId: 'diag-abc12345',
      engineId: 'engine-001',
      scenarioId: 'scenario-001',
      status: 'PENDING',
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: '初始化诊断',
      evaluationDurationMs: 0,
      inputSnapshot: {},
      outputSnapshot: {},
      createdAt: '2024-01-15T08:00:00Z',
      tenantId: 'T001',
      requestedBy: 'user-001'
    }

    assert.equal(diagnosis.diagnosisId, 'diag-abc12345')
    assert.equal(diagnosis.engineId, 'engine-001')
    assert.equal(diagnosis.scenarioId, 'scenario-001')
    assert.equal(diagnosis.status, 'PENDING')
    assert.equal(diagnosis.riskLevel, 'low')
    assert.equal(diagnosis.tenantId, 'T001')
    assert.equal(diagnosis.requestedBy, 'user-001')
    assert.equal(diagnosis.recommendation, '')
    assert.equal(diagnosis.promptSummary, '初始化诊断')
    assert.equal(diagnosis.evaluationDurationMs, 0)
    assert.deepEqual(diagnosis.matchedRuleIds, [])
    assert.deepEqual(diagnosis.matchedConditionIds, [])
    assert.deepEqual(diagnosis.triggeredActionIds, [])
    assert.deepEqual(diagnosis.inputSnapshot, {})
    assert.deepEqual(diagnosis.outputSnapshot, {})
    assert.ok(diagnosis.createdAt)
    // completedAt 可选，未传入时应为 undefined
    assert.equal(diagnosis.completedAt, undefined)
  })

  test('应支持 COMPLETED 状态的诊断实体', () => {
    const diagnosis: DiagnosisEntity = {
      diagnosisId: 'diag-xyz98765',
      engineId: 'engine-002',
      scenarioId: 'scenario-002',
      status: 'COMPLETED',
      matchedRuleIds: ['rule-001', 'rule-002'],
      matchedConditionIds: ['cond-001'],
      triggeredActionIds: ['act-001'],
      riskLevel: 'high',
      recommendation: '触发高风险警告，建议即时检查',
      promptSummary: '批量诊断 - scenario-002',
      evaluationDurationMs: 150,
      inputSnapshot: { memberId: 'M001', points: 500 },
      outputSnapshot: { riskScore: 85 },
      createdAt: '2024-01-15T08:05:00Z',
      completedAt: '2024-01-15T08:05:01.150Z',
      tenantId: 'T002',
      requestedBy: 'user-002'
    }

    assert.equal(diagnosis.status, 'COMPLETED')
    assert.equal(diagnosis.riskLevel, 'high')
    assert.deepEqual(diagnosis.matchedRuleIds, ['rule-001', 'rule-002'])
    assert.deepEqual(diagnosis.matchedConditionIds, ['cond-001'])
    assert.deepEqual(diagnosis.triggeredActionIds, ['act-001'])
    assert.equal(diagnosis.evaluationDurationMs, 150)
    assert.deepEqual(diagnosis.inputSnapshot, { memberId: 'M001', points: 500 })
    assert.deepEqual(diagnosis.outputSnapshot, { riskScore: 85 })
    assert.equal(diagnosis.completedAt, '2024-01-15T08:05:01.150Z')
  })

  test('应支持 FAILED 状态的诊断实体', () => {
    const diagnosis: DiagnosisEntity = {
      diagnosisId: 'diag-fail01',
      engineId: 'engine-003',
      scenarioId: 'scenario-fail',
      status: 'FAILED',
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '执行失败：超时',
      promptSummary: '诊断失败',
      evaluationDurationMs: 5000,
      inputSnapshot: { reason: 'timeout' },
      outputSnapshot: { error: 'Execution timeout' },
      createdAt: '2024-01-15T08:10:00Z',
      completedAt: '2024-01-15T08:10:05Z',
      tenantId: 'T003',
      requestedBy: 'system'
    }

    assert.equal(diagnosis.status, 'FAILED')
    assert.equal(diagnosis.evaluationDurationMs, 5000)
    assert.ok(diagnosis.completedAt)
  })
})

describe('DiagnosisEntity status 枚举约束', () => {
  test('status 仅接受 PENDING | IN_PROGRESS | COMPLETED | FAILED', () => {
    // 类型编译时约束 —— 运行时验证合法值
    const validStatuses: DiagnosisEntity['status'][] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
    assert.equal(validStatuses.length, 4)
    assert.ok(validStatuses.includes('PENDING'))
    assert.ok(validStatuses.includes('IN_PROGRESS'))
    assert.ok(validStatuses.includes('COMPLETED'))
    assert.ok(validStatuses.includes('FAILED'))
  })
})

describe('DiagnosisEntity riskLevel 枚举约束', () => {
  test('riskLevel 仅接受 low | medium | high | critical', () => {
    const validLevels: DiagnosisEntity['riskLevel'][] = ['low', 'medium', 'high', 'critical']
    assert.equal(validLevels.length, 4)
    assert.ok(validLevels.includes('low'))
    assert.ok(validLevels.includes('medium'))
    assert.ok(validLevels.includes('high'))
    assert.ok(validLevels.includes('critical'))
  })
})

describe('DiagnosisBatch 类型形状', () => {
  test('应包含 DiagnosisEntity[] 数组', () => {
    const diagnosis: DiagnosisEntity = {
      diagnosisId: 'diag-test001',
      engineId: 'engine-001',
      scenarioId: 's1',
      status: 'COMPLETED',
      matchedRuleIds: ['rule-001'],
      matchedConditionIds: ['cond-001'],
      triggeredActionIds: ['act-001'],
      riskLevel: 'medium',
      recommendation: '建议复查',
      promptSummary: '测试诊断',
      evaluationDurationMs: 42,
      inputSnapshot: {},
      outputSnapshot: {},
      createdAt: '2024-01-15T08:00:00Z',
      completedAt: '2024-01-15T08:00:00.042Z',
      tenantId: 'T001',
      requestedBy: 'user-001'
    }

    const batch: DiagnosisBatch = {
      batchId: 'batch-abc12345',
      engineId: 'engine-001',
      totalDiagnoses: 1,
      matchedDiagnoses: 1,
      matchRate: 1.0,
      riskDistribution: { low: 0, medium: 1, high: 0, critical: 0 },
      avgEvaluationDurationMs: 42,
      diagnoses: [diagnosis],
      createdAt: '2024-01-15T08:01:00Z',
      triggeredBy: 'user-001',
      tenantId: 'T001'
    }

    assert.equal(batch.batchId, 'batch-abc12345')
    assert.equal(batch.engineId, 'engine-001')
    assert.equal(batch.totalDiagnoses, 1)
    assert.equal(batch.matchedDiagnoses, 1)
    assert.equal(batch.matchRate, 1.0)
    assert.deepEqual(batch.riskDistribution, { low: 0, medium: 1, high: 0, critical: 0 })
    assert.equal(batch.avgEvaluationDurationMs, 42)
    assert.equal(batch.triggeredBy, 'user-001')
    assert.equal(batch.tenantId, 'T001')
    assert.ok(batch.createdAt)
    // 验证 diagnoses 是数组且包含 DiagnosisEntity
    assert.ok(Array.isArray(batch.diagnoses))
    assert.equal(batch.diagnoses.length, 1)
    assert.equal(batch.diagnoses[0]!.diagnosisId, 'diag-test001')
    assert.equal(batch.diagnoses[0]!.riskLevel, 'medium')
  })

  test('应支持多个 diagnoses', () => {
    const makeDiagnosis = (id: string, riskLevel: DiagnosisEntity['riskLevel']): DiagnosisEntity => ({
      diagnosisId: id,
      engineId: 'engine-001',
      scenarioId: id,
      status: 'COMPLETED',
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel,
      recommendation: '',
      promptSummary: '',
      evaluationDurationMs: 50,
      inputSnapshot: {},
      outputSnapshot: {},
      createdAt: '2024-01-15T08:00:00Z',
      tenantId: 'T001',
      requestedBy: 'user-001'
    })

    const batch: DiagnosisBatch = {
      batchId: 'batch-multi',
      engineId: 'engine-001',
      totalDiagnoses: 3,
      matchedDiagnoses: 2,
      matchRate: 2 / 3,
      riskDistribution: { low: 1, medium: 1, high: 1, critical: 0 },
      avgEvaluationDurationMs: 50,
      diagnoses: [
        makeDiagnosis('diag-1', 'low'),
        makeDiagnosis('diag-2', 'medium'),
        makeDiagnosis('diag-3', 'high')
      ],
      createdAt: '2024-01-15T08:01:00Z',
      triggeredBy: 'user-001',
      tenantId: 'T001'
    }

    assert.equal(batch.diagnoses.length, 3)
    assert.equal(batch.totalDiagnoses, 3)
    assert.equal(batch.matchedDiagnoses, 2)
    assert.equal(batch.riskDistribution.low, 1)
    assert.equal(batch.riskDistribution.medium, 1)
    assert.equal(batch.riskDistribution.high, 1)
    assert.equal(batch.riskDistribution.critical, 0)
    // 验证每个元素都是 DiagnosisEntity
    for (const d of batch.diagnoses) {
      assert.ok(d.diagnosisId)
      assert.ok(d.status)
      assert.ok(d.riskLevel)
    }
  })

  test('DiagnosisBatch 的 diagnoses 应为 DiagnosisEntity 类型数组', () => {
    // 通过构造和类型推导验证 diagnoses 是 DiagnosisEntity[]
    const batch: DiagnosisBatch = {
      batchId: 'batch-type-check',
      engineId: 'engine-001',
      totalDiagnoses: 0,
      matchedDiagnoses: 0,
      matchRate: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      avgEvaluationDurationMs: 0,
      diagnoses: [],
      createdAt: '2024-01-15T08:00:00Z',
      triggeredBy: 'user-001',
      tenantId: 'T001'
    }

    // 空数组也是合法的
    assert.ok(Array.isArray(batch.diagnoses))
    assert.equal(batch.diagnoses.length, 0)
    assert.equal(batch.totalDiagnoses, 0)
  })
})
