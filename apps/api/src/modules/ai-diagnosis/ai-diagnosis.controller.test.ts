import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiDiagnosisController } from './ai-diagnosis.controller'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { NotFoundException } from '@nestjs/common'

describe('AiDiagnosisController', () => {
  let controller: AiDiagnosisController
  let service: AiDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    service = new AiDiagnosisService()
    controller = new AiDiagnosisController(service)
  })

  // ── POST / ──

  describe('POST /ai-diagnosis', () => {
    it('should create a diagnosis and return 201', () => {
      const dto = {
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      }
      const result = controller.create(dto)
      assert.ok(result.diagnosis)
      assert.equal(result.diagnosis.engineId, 'engine-001')
      assert.equal(result.diagnosis.status, 'PENDING')
    })

    it('should return diagnosis with unique id', () => {
      const r1 = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const r2 = controller.create({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })
      assert.notEqual(r1.diagnosis.diagnosisId, r2.diagnosis.diagnosisId)
    })
  })

  // ── GET / ──

  describe('GET /ai-diagnosis', () => {
    it('should return empty list', () => {
      const result = controller.list({})
      assert.equal(result.total, 0)
      assert.deepEqual(result.diagnoses, [])
    })

    it('should list created diagnoses', () => {
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const result = controller.list({})
      assert.equal(result.total, 2)
    })

    it('should filter by status', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.update(d.diagnosis.diagnosisId, { status: 'COMPLETED' })

      const result = controller.list({ status: 'COMPLETED' })
      assert.equal(result.total, 1)
    })

    it('should filter by engineId', () => {
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.create({
        engineId: 'engine-002',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })

      const result = controller.list({ engineId: 'engine-001' })
      assert.equal(result.total, 1)
    })
  })

  // ── GET /:diagnosisId ──

  describe('GET /ai-diagnosis/:diagnosisId', () => {
    it('should return diagnosis by id', () => {
      const created = controller.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })
      const result = controller.get(created.diagnosis.diagnosisId)
      assert.equal(result.diagnosis.diagnosisId, created.diagnosis.diagnosisId)
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      assert.throws(
        () => controller.get('non-existent'),
        (err: any) => err.message === 'Diagnosis non-existent not found'
      )
    })
  })

  // ── PATCH /:diagnosisId ──

  describe('PATCH /ai-diagnosis/:diagnosisId', () => {
    it('should update diagnosis status', () => {
      const created = controller.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })

      const result = controller.update(created.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'medium',
        recommendation: 'Done'
      })

      assert.equal(result.diagnosis.status, 'COMPLETED')
      assert.equal(result.diagnosis.riskLevel, 'medium')
      assert.equal(result.diagnosis.recommendation, 'Done')
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      assert.throws(
        () => controller.update('non-existent', { status: 'COMPLETED' }),
        (err: any) => err.message === 'Diagnosis non-existent not found'
      )
    })
  })

  // ── DELETE /:diagnosisId ──

  describe('DELETE /ai-diagnosis/:diagnosisId', () => {
    it('should delete diagnosis', () => {
      const created = controller.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })

      controller.remove(created.diagnosis.diagnosisId)

      assert.throws(
        () => controller.get(created.diagnosis.diagnosisId),
        (err: any) => err.message.includes('not found')
      )
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      assert.throws(
        () => controller.remove('non-existent'),
        (err: any) => err.message === 'Diagnosis non-existent not found'
      )
    })
  })

  // ── POST /batch ──

  describe('POST /ai-diagnosis/batch', () => {
    it('should create a batch', () => {
      const result = controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2', 's3'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.ok(result.batch)
      assert.equal(result.batch.totalDiagnoses, 3)
      assert.ok(result.batch.batchId.startsWith('batch-'))
    })

    it('should auto-complete all diagnoses', () => {
      const result = controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.equal(result.batch.matchedDiagnoses, 0)
      assert.equal(result.batch.riskDistribution.low, 2)
    })

    it('should detect critical scenarios', () => {
      const result = controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['critical-scenario'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      assert.equal(result.batch.matchedDiagnoses, 1)
      assert.equal(result.batch.riskDistribution.high, 1)
    })
  })

  // ── GET /batch/:batchId ──

  describe('GET /ai-diagnosis/batch/:batchId', () => {
    it('should return batch by id', () => {
      const created = controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })

      const result = controller.getBatch(created.batch.batchId)
      assert.equal(result.batch.batchId, created.batch.batchId)
    })

    it('should throw NotFoundException for missing batch', () => {
      assert.throws(
        () => controller.getBatch('non-existent'),
        (err: any) => err.message.includes('not found')
      )
    })
  })

  // ── GET /batch ──

  describe('GET /ai-diagnosis/batch', () => {
    it('should list all batches', () => {
      controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      controller.createBatch({
        engineId: 'engine-002',
        scenarioIds: ['s2'],
        tenantId: 'T001',
        triggeredBy: 'user-002'
      })

      const result = controller.listBatches()
      assert.equal(result.length, 2)
    })

    it('should filter by engineId', () => {
      controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      controller.createBatch({
        engineId: 'engine-002',
        scenarioIds: ['s2'],
        tenantId: 'T001',
        triggeredBy: 'user-002'
      })

      const result = controller.listBatches('engine-001')
      assert.equal(result.length, 1)
    })
  })

  // ── GET /report/risk ──

  describe('GET /ai-diagnosis/report/risk', () => {
    it('should generate risk report', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.update(d.diagnosis.diagnosisId, {
        riskLevel: 'high',
        recommendation: 'Check rules',
        status: 'COMPLETED'
      })

      const report = controller.riskReport()
      assert.ok(report.generatedAt)
      assert.equal(report.totalEvaluated, 1)
      assert.equal(report.riskDistribution.high, 1)
      assert.equal(report.topRecommendations.length, 1)
    })

    it('should filter report by engineId', () => {
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })

      const report = controller.riskReport('engine-001')
      assert.equal(report.totalEvaluated, 1)
    })

    it('should handle empty dataset', () => {
      const report = controller.riskReport()
      assert.equal(report.totalEvaluated, 0)
      assert.deepEqual(report.topRecommendations, [])
      assert.equal(report.averageEvaluationDurationMs, 0)
    })

    it('should include averageEvaluationDurationMs in report', () => {
      const d1 = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.update(d1.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        evaluationDurationMs: 100
      } as any)
      const d2 = controller.create({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })
      controller.update(d2.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        evaluationDurationMs: 200
      } as any)

      const report = controller.riskReport('engine-001')
      assert.equal(report.averageEvaluationDurationMs, 150)
    })

    it('should sort high-risk recommendations first', () => {
      const d1 = controller.create({
        engineId: 'engine-001',
        scenarioId: 'critical-s1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.update(d1.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'critical',
        recommendation: 'Urgent fix'
      })
      const d2 = controller.create({
        engineId: 'engine-001',
        scenarioId: 'high-s2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })
      controller.update(d2.diagnosis.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'high',
        recommendation: 'Check soon'
      })

      const report = controller.riskReport('engine-001')
      assert.equal(report.topRecommendations.length, 2)
      assert.equal(report.topRecommendations[0].riskLevel, 'critical')
      assert.equal(report.topRecommendations[1].riskLevel, 'high')
      assert.equal(report.riskDistribution.critical, 1)
      assert.equal(report.riskDistribution.high, 1)
    })
  })

  // ── 边界与错误处理 ──

  describe('boundary & error handling', () => {
    it('should handle update with empty patch (no-op)', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const result = controller.update(d.diagnosis.diagnosisId, {})
      assert.equal(result.diagnosis.diagnosisId, d.diagnosis.diagnosisId)
      assert.equal(result.diagnosis.status, 'PENDING') // unchanged
    })

    it('should update diagnosis to IN_PROGRESS status', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })
      const result = controller.update(d.diagnosis.diagnosisId, {
        status: 'IN_PROGRESS'
      })
      assert.equal(result.diagnosis.status, 'IN_PROGRESS')
    })

    it('should update diagnosis to FAILED status', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })
      const result = controller.update(d.diagnosis.diagnosisId, {
        status: 'FAILED'
      })
      assert.equal(result.diagnosis.status, 'FAILED')
    })

    it('should throw NotFoundException when updating deleted diagnosis', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.remove(d.diagnosis.diagnosisId)

      assert.throws(
        () => controller.update(d.diagnosis.diagnosisId, { status: 'COMPLETED' }),
        (err: any) => err instanceof NotFoundException
      )
    })

    it('should throw NotFoundException when getting deleted diagnosis', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.remove(d.diagnosis.diagnosisId)

      assert.throws(
        () => controller.get(d.diagnosis.diagnosisId),
        (err: any) => err instanceof NotFoundException
      )
    })

    it('should handle delete returning 204 (void return)', () => {
      const d = controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const result = controller.remove(d.diagnosis.diagnosisId)
      assert.equal(result, undefined) // 204 NO_CONTENT returns void
    })

    it('should list empty batch when no batches created', () => {
      const batches = controller.listBatches()
      assert.deepEqual(batches, [])
    })

    it('should filter batches by tenantId', () => {
      controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'u1'
      })
      controller.createBatch({
        engineId: 'engine-001',
        scenarioIds: ['s2'],
        tenantId: 'T002',
        triggeredBy: 'u2'
      })

      const result = controller.listBatches(undefined, 'T001')
      assert.equal(result.length, 1)
      assert.equal(result[0].tenantId, 'T001')
    })

    it('should filter report by tenantId', () => {
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T002',
        requestedBy: 'u2'
      })

      const report = controller.riskReport(undefined, 'T001')
      assert.equal(report.totalEvaluated, 1)
    })

    it('should create diagnosis with optional promptSummary and inputSnapshot', () => {
      const inputSnapshot = { deviceId: 'dev-001', cpuUsage: 95 }
      const dto = {
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001',
        promptSummary: '设备异常检测',
        inputSnapshot
      }
      const result = controller.create(dto)
      assert.equal(result.diagnosis.promptSummary, '设备异常检测')
      assert.deepEqual(result.diagnosis.inputSnapshot, inputSnapshot)
    })

    it('should persist created diagnosis in list after creation', () => {
      controller.create({
        engineId: 'engine-001',
        scenarioId: 's1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      const list1 = controller.list({})
      assert.equal(list1.total, 1)

      controller.create({
        engineId: 'engine-001',
        scenarioId: 's2',
        tenantId: 'T001',
        requestedBy: 'u2'
      })
      const list2 = controller.list({})
      assert.equal(list2.total, 2)
    })

    it('should filter diagnosis by riskLevel', () => {
      const d1 = controller.create({
        engineId: 'engine-001',
        scenarioId: 'low-s1',
        tenantId: 'T001',
        requestedBy: 'u1'
      })
      controller.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'low' })

      const d2 = controller.create({
        engineId: 'engine-001',
        scenarioId: 'high-s1',
        tenantId: 'T001',
        requestedBy: 'u2'
      })
      controller.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high' })

      const result = controller.list({ riskLevel: 'high' })
      assert.equal(result.total, 1)
      assert.equal(result.diagnoses[0].riskLevel, 'high')
    })
  })
})
