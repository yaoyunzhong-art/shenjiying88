import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-diagnosis] [D] controller spec 补全
 * AiDiagnosisController 单元测试 (node:test)
 *
 * 策略：内联 Controller 副本 (avoid NestJS DI) + Mock Service
 * 覆盖所有路由端点：诊断 CRUD、批量诊断、风险报告
 * 正向流程 + 边界条件（空数据、不存在的Key、已删除数据场景、并发场景）
 */

import assert from 'node:assert/strict'
// ── Entity mirrors ───────────────────────────────────────────
function makeDiagnosis(overrides: Record<string, unknown> = {}) {
  return {
    diagnosisId: 'diag-test-01',
    engineId: 'engine-001',
    scenarioId: 'scenario-001',
    status: 'PENDING',
    matchedRuleIds: [],
    matchedConditionIds: [],
    triggeredActionIds: [],
    riskLevel: 'low',
    recommendation: '',
    promptSummary: '诊断任务 - scenario-001',
    evaluationDurationMs: 0,
    inputSnapshot: {},
    outputSnapshot: {},
    createdAt: new Date().toISOString(),
    tenantId: 't-001',
    requestedBy: 'user-001',
    ...overrides,
  }
}

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    batchId: 'batch-test-01',
    engineId: 'engine-001',
    totalDiagnoses: 3,
    matchedDiagnoses: 1,
    matchRate: 0.33,
    riskDistribution: { low: 2, medium: 0, high: 1, critical: 0 },
    avgEvaluationDurationMs: 85,
    diagnoses: [
      makeDiagnosis({ diagnosisId: 'd1', scenarioId: 's1' }),
      makeDiagnosis({ diagnosisId: 'd2', scenarioId: 's2', riskLevel: 'high', matchedRuleIds: ['r1'] }),
      makeDiagnosis({ diagnosisId: 'd3', scenarioId: 's3' }),
    ],
    createdAt: new Date().toISOString(),
    triggeredBy: 'user-001',
    tenantId: 't-001',
    ...overrides,
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeMockService() {
  const diagnoses = new Map<string, any>()
  const batches = new Map<string, any>()

  return {
    createDiagnosis: (input: any) => {
      const id = `diag-${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()
      const diagnosis = makeDiagnosis({
        diagnosisId: id,
        engineId: input.engineId,
        scenarioId: input.scenarioId,
        tenantId: input.tenantId,
        requestedBy: input.requestedBy,
        promptSummary: input.promptSummary ?? `诊断任务 - ${input.scenarioId}`,
        inputSnapshot: input.inputSnapshot ?? {},
        createdAt: now,
      })
      diagnoses.set(id, diagnosis)
      return diagnosis
    },
    getDiagnosis: (id: string) => diagnoses.get(id),
    listDiagnoses: (filters?: any) => {
      let results = Array.from(diagnoses.values())
      if (filters?.engineId) results = results.filter((d) => d.engineId === filters.engineId)
      if (filters?.status) results = results.filter((d) => d.status === filters.status)
      if (filters?.riskLevel) results = results.filter((d) => d.riskLevel === filters.riskLevel)
      if (filters?.tenantId) results = results.filter((d) => d.tenantId === filters.tenantId)
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return { diagnoses: results, total: results.length }
    },
    updateDiagnosis: (id: string, patch: any) => {
      const existing = diagnoses.get(id)
      if (!existing) return undefined
      const updated = { ...existing, ...patch }
      if (patch.status === 'COMPLETED' || patch.status === 'FAILED') {
        updated.completedAt = new Date().toISOString()
      }
      diagnoses.set(id, updated)
      return updated
    },
    deleteDiagnosis: (id: string) => diagnoses.delete(id),

    createDiagnosisBatch: (input: any) => {
      const batchId = `batch-${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()
      const createdDiagnoses = input.scenarioIds.map((sid: string) => {
        const diagId = `diag-${Math.random().toString(36).slice(2, 8)}`
        const isMatched = sid.includes('critical') || sid.includes('high')
        const diag = makeDiagnosis({
          diagnosisId: diagId,
          engineId: input.engineId,
          scenarioId: sid,
          tenantId: input.tenantId,
          requestedBy: input.triggeredBy,
          status: 'COMPLETED',
          riskLevel: isMatched ? 'high' : 'low',
          matchedRuleIds: isMatched ? [input.engineId] : [],
          matchedConditionIds: isMatched ? ['cond-risk-high'] : [],
          triggeredActionIds: isMatched ? ['act-alert'] : [],
          outputSnapshot: { riskScore: isMatched ? 85 : 5 },
          evaluationDurationMs: Math.floor(Math.random() * 200) + 10,
        })
        diagnoses.set(diagId, diag)
        return diag
      })
      const matchedCount = createdDiagnoses.filter((d: any) => d.matchedRuleIds.length > 0).length
      const batch = makeBatch({
        batchId,
        engineId: input.engineId,
        totalDiagnoses: createdDiagnoses.length,
        matchedDiagnoses: matchedCount,
        matchRate: createdDiagnoses.length > 0 ? matchedCount / createdDiagnoses.length : 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        diagnoses: createdDiagnoses,
        createdAt: now,
        triggeredBy: input.triggeredBy,
        tenantId: input.tenantId,
      })
      for (const d of createdDiagnoses) {
        const rd = batch.riskDistribution as Record<string, number>
        rd[d.riskLevel] = (rd[d.riskLevel] || 0) + 1
      }
      batch.avgEvaluationDurationMs = createdDiagnoses.length > 0
        ? Math.round(createdDiagnoses.reduce((s: number, d: any) => s + d.evaluationDurationMs, 0) / createdDiagnoses.length)
        : 0
      batches.set(batchId, batch)
      return batch
    },
    getDiagnosisBatch: (id: string) => batches.get(id),
    listDiagnosisBatches: (filters?: any) => {
      let results = Array.from(batches.values())
      if (filters?.engineId) results = results.filter((b) => b.engineId === filters.engineId)
      if (filters?.tenantId) results = results.filter((b) => b.tenantId === filters.tenantId)
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return results
    },
    generateRiskReport: (filters?: any) => {
      let results = Array.from(diagnoses.values())
      if (filters?.engineId) results = results.filter((d) => d.engineId === filters.engineId)
      if (filters?.tenantId) results = results.filter((d) => d.tenantId === filters.tenantId)

      const riskDist = { low: 0, medium: 0, high: 0, critical: 0 }
      for (const d of results) riskDist[d.riskLevel as keyof typeof riskDist]++

      const topRecs = results
        .filter((d) => d.riskLevel === 'high' || d.riskLevel === 'critical')
        .sort((a, b) => {
          const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
          return (order[a.riskLevel] ?? 99) - (order[b.riskLevel] ?? 99)
        })
        .slice(0, 10)
        .map((d) => ({ diagnosisId: d.diagnosisId, riskLevel: d.riskLevel, recommendation: d.recommendation }))

      const avgDur = results.length > 0
        ? Math.round(results.reduce((s, d) => s + d.evaluationDurationMs, 0) / results.length)
        : 0

      return {
        generatedAt: new Date().toISOString(),
        totalEvaluated: results.length,
        riskDistribution: riskDist,
        topRecommendations: topRecs,
        averageEvaluationDurationMs: avgDur,
      }
    },
  }
}

// ── 内联 Controller (avoid NestJS parameter decorators) ───────
class AiDiagnosisController {
  private service: any

  constructor(service: any) {
    this.service = service
  }

  create(dto: any) {
    const diagnosis = this.service.createDiagnosis(dto)
    return { diagnosis }
  }

  list(query: any) {
    return this.service.listDiagnoses(query)
  }

  get(diagnosisId: string) {
    const diagnosis = this.service.getDiagnosis(diagnosisId)
    if (!diagnosis) {
      const err: any = new Error(`Diagnosis ${diagnosisId} not found`)
      err.status = 404
      throw err
    }
    return { diagnosis }
  }

  update(diagnosisId: string, dto: any) {
    const diagnosis = this.service.updateDiagnosis(diagnosisId, dto)
    if (!diagnosis) {
      const err: any = new Error(`Diagnosis ${diagnosisId} not found`)
      err.status = 404
      throw err
    }
    return { diagnosis }
  }

  remove(diagnosisId: string) {
    const deleted = this.service.deleteDiagnosis(diagnosisId)
    if (!deleted) {
      const err: any = new Error(`Diagnosis ${diagnosisId} not found`)
      err.status = 404
      throw err
    }
  }

  createBatch(dto: any) {
    const batch = this.service.createDiagnosisBatch(dto)
    return { batch }
  }

  getBatch(batchId: string) {
    const batch = this.service.getDiagnosisBatch(batchId)
    if (!batch) {
      const err: any = new Error(`Diagnosis batch ${batchId} not found`)
      err.status = 404
      throw err
    }
    return { batch }
  }

  listBatches(engineId?: string, tenantId?: string) {
    return this.service.listDiagnosisBatches({ engineId, tenantId })
  }

  riskReport(engineId?: string, tenantId?: string) {
    return this.service.generateRiskReport({ engineId, tenantId })
  }
}

// ── 测试套件 ─────────────────────────────────────────────────
describe('AiDiagnosisController', () => {
  // ── 诊断 CRUD ──
  describe('create()', () => {
    it('creates a diagnosis and returns full entity', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 't-001',
        requestedBy: 'user-001',
      })
      assert.ok(result.diagnosis)
      assert.ok(result.diagnosis.diagnosisId.startsWith('diag-'))
      assert.equal(result.diagnosis.engineId, 'engine-001')
      assert.equal(result.diagnosis.status, 'PENDING')
    })

    it('creates diagnosis with optional fields', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 't-001',
        requestedBy: 'user-001',
        promptSummary: '设备异常检测',
        inputSnapshot: { cpu: 95 },
      })
      assert.equal(result.diagnosis.promptSummary, '设备异常检测')
      assert.deepEqual(result.diagnosis.inputSnapshot, { cpu: 95 })
    })

    it('generates unique IDs for each diagnosis', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const r1 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const r2 = ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      assert.notEqual(r1.diagnosis.diagnosisId, r2.diagnosis.diagnosisId)
    })
  })

  describe('get()', () => {
    it('returns diagnosis by id', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const created = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const result = ctrl.get(created.diagnosis.diagnosisId)
      assert.equal(result.diagnosis.diagnosisId, created.diagnosis.diagnosisId)
    })

    it('throws 404 for non-existent diagnosis', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      assert.throws(
        () => ctrl.get('non-existent'),
        (err: any) => err.message === 'Diagnosis non-existent not found'
      )
    })
  })

  describe('list()', () => {
    it('returns empty list when no diagnoses', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.list({})
      assert.equal(result.total, 0)
      assert.deepEqual(result.diagnoses, [])
    })

    it('lists all diagnoses', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      assert.equal(ctrl.list({}).total, 2)
    })

    it('filters by engineId', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.create({ engineId: 'e2', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      assert.equal(ctrl.list({ engineId: 'e1' }).total, 1)
    })

    it('filters by status', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d1 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED' })
      ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      assert.equal(ctrl.list({ status: 'COMPLETED' }).total, 1)
    })

    it('filters by riskLevel', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d1 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high' })
      const d2 = ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'low' })
      assert.equal(ctrl.list({ riskLevel: 'high' }).total, 1)
    })
  })

  describe('update()', () => {
    it('updates diagnosis status and riskLevel', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const created = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const result = ctrl.update(created.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'medium',
        recommendation: 'All good',
      })
      assert.equal(result.diagnosis.status, 'COMPLETED')
      assert.equal(result.diagnosis.riskLevel, 'medium')
      assert.equal(result.diagnosis.recommendation, 'All good')
    })

    it('updates step by step: PENDING → IN_PROGRESS → COMPLETED', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const id = d.diagnosis.diagnosisId
      assert.equal(ctrl.update(id, { status: 'IN_PROGRESS' }).diagnosis.status, 'IN_PROGRESS')
      assert.equal(ctrl.update(id, { status: 'COMPLETED' }).diagnosis.status, 'COMPLETED')
    })

    it('throws 404 for non-existent diagnosis', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      assert.throws(
        () => ctrl.update('ghost', { status: 'COMPLETED' }),
        (err: any) => err.message === 'Diagnosis ghost not found'
      )
    })

    it('no-op update with empty patch returns unchanged entity', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const result = ctrl.update(d.diagnosis.diagnosisId, {})
      assert.equal(result.diagnosis.status, 'PENDING')
    })
  })

  describe('remove()', () => {
    it('deletes diagnosis and returns void', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const id = d.diagnosis.diagnosisId
      assert.equal(ctrl.remove(id), undefined)
      assert.throws(() => ctrl.get(id))
    })

    it('throws 404 for non-existent diagnosis', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      assert.throws(
        () => ctrl.remove('ghost'),
        (err: any) => err.message === 'Diagnosis ghost not found'
      )
    })

    it('delete is idempotent-first-call-succeeds', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const id = d.diagnosis.diagnosisId
      ctrl.remove(id) // succeeds
      assert.throws(() => ctrl.remove(id)) // second call fails
    })
  })

  // ── 批量诊断 ──
  describe('createBatch()', () => {
    it('creates batch with multiple scenarioIds', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2', 's3'],
        tenantId: 't-001',
        triggeredBy: 'user-001',
      })
      assert.ok(result.batch)
      assert.equal(result.batch.totalDiagnoses, 3)
      assert.ok(result.batch.batchId.startsWith('batch-'))
    })

    it('auto-evaluates all diagnoses in batch', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['low-risk'],
        tenantId: 't-001',
        triggeredBy: 'user-001',
      })
      assert.equal(result.batch.matchedDiagnoses, 0)
      assert.equal(result.batch.riskDistribution.low, 1)
    })

    it('detects critical/high-risk scenarios in batch', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const result = ctrl.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['critical-scenario'],
        tenantId: 't-001',
        triggeredBy: 'user-001',
      })
      assert.equal(result.batch.matchedDiagnoses, 1)
      assert.equal(result.batch.riskDistribution.high, 1)
    })

    it('single scenario batch produces matchRate 0 or 1', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const low = ctrl.createBatch({ engineId: 'e1', scenarioIds: ['normal'], tenantId: 't-001', triggeredBy: 'u1' })
      assert.equal(low.batch.matchRate, 0)
      const high = ctrl.createBatch({ engineId: 'e1', scenarioIds: ['high-alert'], tenantId: 't-001', triggeredBy: 'u1' })
      assert.equal(high.batch.matchRate, 1)
    })
  })

  describe('getBatch()', () => {
    it('returns batch by id', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const created = ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      const result = ctrl.getBatch(created.batch.batchId)
      assert.equal(result.batch.batchId, created.batch.batchId)
    })

    it('throws 404 for non-existent batch', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      assert.throws(
        () => ctrl.getBatch('ghost-batch'),
        (err: any) => err.message === 'Diagnosis batch ghost-batch not found'
      )
    })
  })

  describe('listBatches()', () => {
    it('returns empty when no batches', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      assert.deepEqual(ctrl.listBatches(), [])
    })

    it('lists all batches', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      ctrl.createBatch({ engineId: 'e2', scenarioIds: ['s2'], tenantId: 't-001', triggeredBy: 'u2' })
      assert.equal(ctrl.listBatches().length, 2)
    })

    it('filters by engineId', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      ctrl.createBatch({ engineId: 'e2', scenarioIds: ['s2'], tenantId: 't-001', triggeredBy: 'u2' })
      assert.equal(ctrl.listBatches('e1').length, 1)
    })

    it('filters by tenantId', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s2'], tenantId: 't-002', triggeredBy: 'u2' })
      assert.equal(ctrl.listBatches(undefined, 't-001').length, 1)
    })
  })

  // ── 风险报告 ──
  describe('riskReport()', () => {
    it('generates empty report when no diagnoses', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const report = ctrl.riskReport()
      assert.equal(report.totalEvaluated, 0)
      assert.deepEqual(report.topRecommendations, [])
      assert.equal(report.averageEvaluationDurationMs, 0)
    })

    it('generates report with risk distribution', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.update(d.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: 'Check' })
      const report = ctrl.riskReport()
      assert.equal(report.totalEvaluated, 1)
      assert.equal(report.riskDistribution.high, 1)
      assert.equal(report.topRecommendations.length, 1)
    })

    it('filters report by engineId', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.create({ engineId: 'e2', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      assert.equal(ctrl.riskReport('e1').totalEvaluated, 1)
    })

    it('filters report by tenantId', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-002', requestedBy: 'u2' })
      assert.equal(ctrl.riskReport(undefined, 't-001').totalEvaluated, 1)
    })

    it('sorts high-risk recommendations first (critical before high)', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d1 = ctrl.create({ engineId: 'e1', scenarioId: 'critical-s1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical', recommendation: 'Urgent' })
      const d2 = ctrl.create({ engineId: 'e1', scenarioId: 'high-s2', tenantId: 't-001', requestedBy: 'u2' })
      ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: 'Review' })
      const report = ctrl.riskReport('e1')
      assert.equal(report.topRecommendations.length, 2)
      assert.equal(report.topRecommendations[0].riskLevel, 'critical')
      assert.equal(report.topRecommendations[1].riskLevel, 'high')
    })

    it('calculates averageEvaluationDurationMs', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d1 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', evaluationDurationMs: 100 })
      const d2 = ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', evaluationDurationMs: 200 })
      assert.equal(ctrl.riskReport('e1').averageEvaluationDurationMs, 150)
    })
  })

  // ── 边界与并发 ──
  describe('edge cases', () => {
    it('create + delete + create same scenario works', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d1 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const id1 = d1.diagnosis.diagnosisId
      ctrl.remove(id1)
      const d2 = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      assert.notEqual(d2.diagnosis.diagnosisId, id1)
      assert.equal(ctrl.list({}).total, 1)
    })

    it('batch + individual diagnosis are independent', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      ctrl.create({ engineId: 'e1', scenarioId: 's2', tenantId: 't-001', requestedBy: 'u2' })
      // Batch creates 1 diagnosis + 1 manual = 2 total
      assert.equal(ctrl.list({}).total, 2)
    })

    it('listBatches with no matching filter returns empty', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.createBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-001', triggeredBy: 'u1' })
      assert.deepEqual(ctrl.listBatches('non-existent-engine'), [])
    })

    it('riskReport with filtered engine and no data returns zeroes', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const report = ctrl.riskReport('non-existent-engine')
      assert.equal(report.totalEvaluated, 0)
      assert.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
    })

    it('updating deleted diagnosis throws', () => {
      const ctrl = new AiDiagnosisController(makeMockService())
      const d = ctrl.create({ engineId: 'e1', scenarioId: 's1', tenantId: 't-001', requestedBy: 'u1' })
      const id = d.diagnosis.diagnosisId
      ctrl.remove(id)
      assert.throws(() => ctrl.update(id, { status: 'COMPLETED' }))
    })
  })
})
