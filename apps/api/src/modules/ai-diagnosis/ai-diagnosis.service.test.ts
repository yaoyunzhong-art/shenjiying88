import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiDiagnosisService } from './ai-diagnosis.service'

describe('AiDiagnosisService', () => {
  let service: AiDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    service = new AiDiagnosisService()
  })

  // ── createDiagnosis ──

  describe('createDiagnosis', () => {
    it('should create a diagnosis with PENDING status', () => {
      const result = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })

      assert.ok(result.diagnosisId.startsWith('diag-'))
      assert.equal(result.engineId, 'engine-001')
      assert.equal(result.scenarioId, 'scenario-001')
      assert.equal(result.status, 'PENDING')
      assert.equal(result.riskLevel, 'low')
      assert.equal(result.tenantId, 'T001')
      assert.equal(result.requestedBy, 'user-001')
      assert.ok(result.createdAt)
      assert.ok(result.diagnosisId)
    })

    it('should create a diagnosis with optional fields', () => {
      const result = service.createDiagnosis({
        engineId: 'engine-002',
        scenarioId: 'scenario-002',
        tenantId: 'T002',
        requestedBy: 'user-002',
        promptSummary: 'Custom prompt',
        inputSnapshot: { key: 'value' }
      })

      assert.equal(result.promptSummary, 'Custom prompt')
      assert.deepEqual(result.inputSnapshot, { key: 'value' })
    })

    it('should create unique diagnosisIds per call', () => {
      const r1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const r2 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      assert.notEqual(r1.diagnosisId, r2.diagnosisId)
    })
  })

  // ── getDiagnosis ──

  describe('getDiagnosis', () => {
    it('should return created diagnosis', () => {
      const created = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })

      const found = service.getDiagnosis(created.diagnosisId)
      assert.ok(found)
      assert.deepEqual(found, created)
    })

    it('should return undefined for non-existent diagnosis', () => {
      const found = service.getDiagnosis('non-existent')
      assert.equal(found, undefined)
    })
  })

  // ── listDiagnoses ──

  describe('listDiagnoses', () => {
    it('should return empty list when no diagnoses exist', () => {
      const result = service.listDiagnoses()
      assert.equal(result.total, 0)
      assert.deepEqual(result.diagnoses, [])
    })

    it('should list all created diagnoses', () => {
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const result = service.listDiagnoses()
      assert.equal(result.total, 2)
      assert.equal(result.diagnoses.length, 2)
    })

    it('should filter by engineId', () => {
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.createDiagnosis({
        engineId: 'engine-002',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const result = service.listDiagnoses({ engineId: 'engine-001' })
      assert.equal(result.total, 1)
      assert.equal(result.diagnoses[0]!.engineId, 'engine-001')
    })

    it('should filter by status', () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d1.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'low',
        recommendation: 'ok'
      })

      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const pending = service.listDiagnoses({ status: 'PENDING' })
      const completed = service.listDiagnoses({ status: 'COMPLETED' })

      assert.equal(pending.total, 1)
      assert.equal(completed.total, 1)
    })

    it('should filter by riskLevel', () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high' })

      const highRisk = service.listDiagnoses({ riskLevel: 'high' })
      assert.equal(highRisk.total, 1)
    })

    it('should filter by tenantId', () => {
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T002',
        requestedBy: 'u2'
      })

      const t1results = service.listDiagnoses({ tenantId: 'T001' })
      assert.equal(t1results.total, 1)
    })

    it('should return results sorted by createdAt desc', async () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 'first',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))
      const d2 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 'second',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const result = service.listDiagnoses()
      assert.equal(result.diagnoses[0]!.diagnosisId, d2.diagnosisId)
      assert.equal(result.diagnoses[1]!.diagnosisId, d1.diagnosisId)
    })
  })

  // ── updateDiagnosis ──

  describe('updateDiagnosis', () => {
    it('should update diagnosis status', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      const updated = service.updateDiagnosis(d.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'medium',
        recommendation: 'All good'
      })

      assert.ok(updated)
      assert.equal(updated.status, 'COMPLETED')
      assert.equal(updated.riskLevel, 'medium')
      assert.equal(updated.recommendation, 'All good')
      assert.ok(updated.completedAt)
    })

    it('should set completedAt when status transitions to COMPLETED', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      assert.equal(d.completedAt, undefined)

      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' })
      assert.ok(updated?.completedAt)
    })

    it('should set completedAt when status transitions to FAILED', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'FAILED' })
      assert.ok(updated?.completedAt)
    })

    it('should preserve completedAt when transitioning from COMPLETED to IN_PROGRESS', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' })
      const completedAt = service.getDiagnosis(d.diagnosisId)!.completedAt

      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'IN_PROGRESS' })
      assert.equal(updated?.completedAt, completedAt)
    })

    it('should return undefined for non-existent diagnosis', () => {
      const result = service.updateDiagnosis('non-existent', { status: 'COMPLETED' })
      assert.equal(result, undefined)
    })

    it('should update matchedRuleIds and triggeredActionIds', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      const updated = service.updateDiagnosis(d.diagnosisId, {
        matchedRuleIds: ['rule-001', 'rule-002'],
        matchedConditionIds: ['cond-001'],
        triggeredActionIds: ['act-001'],
        evaluationDurationMs: 42
      })

      assert.deepEqual(updated?.matchedRuleIds, ['rule-001', 'rule-002'])
      assert.deepEqual(updated?.matchedConditionIds, ['cond-001'])
      assert.deepEqual(updated?.triggeredActionIds, ['act-001'])
      assert.equal(updated?.evaluationDurationMs, 42)
    })
  })

  // ── deleteDiagnosis ──

  describe('deleteDiagnosis', () => {
    it('should delete existing diagnosis', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      const deleted = service.deleteDiagnosis(d.diagnosisId)
      assert.equal(deleted, true)
      assert.equal(service.getDiagnosis(d.diagnosisId), undefined)
    })

    it('should return false for non-existent diagnosis', () => {
      const deleted = service.deleteDiagnosis('non-existent')
      assert.equal(deleted, false)
    })
  })

  // ── createDiagnosisBatch ──

  describe('createDiagnosisBatch', () => {
    it('should create a batch with multiple diagnoses', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2', 's3'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.ok(batch.batchId.startsWith('batch-'))
      assert.equal(batch.engineId, 'engine-001')
      assert.equal(batch.totalDiagnoses, 3)
      assert.equal(batch.diagnoses.length, 3)
      assert.equal(batch.triggeredBy, 'user-001')
      assert.equal(batch.tenantId, 'T001')
    })

    it('should auto-complete all diagnoses in batch', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      for (const d of batch.diagnoses) {
        assert.equal(d.status, 'COMPLETED')
        assert.ok(d.recommendation)
      }
    })

    it('should mark critical scenario as high risk', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['critical-scenario-1', 'normal-scenario'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      const criticalDiag = batch.diagnoses.find((d) => d.scenarioId === 'critical-scenario-1')
      const normalDiag = batch.diagnoses.find((d) => d.scenarioId === 'normal-scenario')

      assert.equal(criticalDiag?.riskLevel, 'high')
      assert.equal(normalDiag?.riskLevel, 'low')
    })

    it('should calculate match rate correctly', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['critical-1', 'high-1', 'normal-1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.equal(batch.totalDiagnoses, 3)
      assert.equal(batch.matchedDiagnoses, 2) // critical-1 and high-1 match
      assert.equal(batch.matchRate, 2 / 3)
    })

    it('should compute risk distribution', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['critical-1', 'high-2', 'normal-1', 'normal-2'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.equal(batch.riskDistribution.high, 2)
      assert.equal(batch.riskDistribution.low, 2)
      assert.equal(batch.riskDistribution.medium, 0)
      assert.equal(batch.riskDistribution.critical, 0)
    })

    it('should handle empty scenarioIds gracefully', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: [],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.equal(batch.totalDiagnoses, 0)
      assert.equal(batch.matchRate, 0)
      assert.equal(batch.diagnoses.length, 0)
    })
  })

  // ── getDiagnosisBatch ──

  describe('getDiagnosisBatch', () => {
    it('should return created batch', () => {
      const created = service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      const found = service.getDiagnosisBatch(created.batchId)
      assert.ok(found)
      assert.deepEqual(found, created)
    })

    it('should return undefined for non-existent batch', () => {
      const found = service.getDiagnosisBatch('non-existent')
      assert.equal(found, undefined)
    })
  })

  // ── listDiagnosisBatches ──

  describe('listDiagnosisBatches', () => {
    it('should list all created batches', () => {
      service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      service.createDiagnosisBatch({
        engineId: 'engine-002',
        scenarioIds: ['s2'],
        tenantId: 'T001',
        triggeredBy: 'user-002'
      })

      const batches = service.listDiagnosisBatches()
      assert.equal(batches.length, 2)
    })

    it('should filter by engineId', () => {
      service.createDiagnosisBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      service.createDiagnosisBatch({
        engineId: 'engine-002',
        scenarioIds: ['s2'],
        tenantId: 'T001',
        triggeredBy: 'user-002'
      })

      const filtered = service.listDiagnosisBatches({ engineId: 'engine-001' })
      assert.equal(filtered.length, 1)
      assert.equal(filtered[0]!.engineId, 'engine-001')
    })
  })

  // ── generateRiskReport ──

  describe('generateRiskReport', () => {
    it('should return empty report when no diagnoses exist', () => {
      const report = service.generateRiskReport()
      assert.equal(report.totalEvaluated, 0)
      assert.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
      assert.deepEqual(report.topRecommendations, [])
      assert.equal(report.averageEvaluationDurationMs, 0)
    })

    it('should calculate risk distribution correctly', () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const d2 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high', recommendation: 'Critical issue', status: 'COMPLETED' })
      service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'critical', recommendation: 'Urgent', status: 'COMPLETED' })

      const report = service.generateRiskReport()
      assert.equal(report.totalEvaluated, 2)
      assert.equal(report.riskDistribution.high, 1)
      assert.equal(report.riskDistribution.critical, 1)
      assert.equal(report.riskDistribution.low, 0)
      assert.equal(report.riskDistribution.medium, 0)
    })

    it('should return top recommendations sorted by risk', () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const d2 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'critical', recommendation: 'Fix immediately', status: 'COMPLETED' })
      service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'high', recommendation: 'Review needed', status: 'COMPLETED' })

      const report = service.generateRiskReport()
      assert.equal(report.topRecommendations.length, 2)
      assert.equal(report.topRecommendations[0]!.riskLevel, 'critical')
      assert.equal(report.topRecommendations[1]!.riskLevel, 'high')
    })

    it('should only include high and critical in top recommendations', () => {
      for (let i = 0; i < 5; i++) {
        const d = service.createDiagnosis({
          engineId: 'engine-001',
          scenarioId: `s${i}`,
          tenantId: 'T001',
          requestedBy: 'u1'
        })
        service.updateDiagnosis(d.diagnosisId, { riskLevel: 'low', status: 'COMPLETED' })
      }

      const report = service.generateRiskReport()
      assert.equal(report.topRecommendations.length, 0)
      assert.equal(report.totalEvaluated, 5)
    })

    it('should filter report by engineId', () => {
      const d1 = service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const d2 = service.createDiagnosis({
        engineId: 'engine-002',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high', status: 'COMPLETED' })
      service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'low', status: 'COMPLETED' })

      const report = service.generateRiskReport({ engineId: 'engine-001' })
      assert.equal(report.totalEvaluated, 1)
      assert.equal(report.riskDistribution.high, 1)
    })

    it('should filter report by tenantId', () => {
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      service.createDiagnosis({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T002',
        requestedBy: 'u1'
      })

      const report = service.generateRiskReport({ tenantId: 'T001' })
      assert.equal(report.totalEvaluated, 1)
    })
  })
})
