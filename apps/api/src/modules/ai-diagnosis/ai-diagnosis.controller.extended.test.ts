/**
 * ai-diagnosis.controller.test.ts — 扩展版 AI 诊断 Controller 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiDiagnosisController } from './ai-diagnosis.controller'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { CreateDiagnosisDto, CreateDiagnosisBatchDto, UpdateDiagnosisDto, DiagnosisQueryDto } from './ai-diagnosis.dto'

describe('AiDiagnosisController (Complete)', () => {
  let controller: AiDiagnosisController
  let service: AiDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    service = new AiDiagnosisService()
    controller = new AiDiagnosisController(service)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('Controller path metadata = "ai-diagnosis"', () => {
    const path = Reflect.getMetadata('path', AiDiagnosisController)
    expect(path).toBe('ai-diagnosis')
  })

  describe('POST /', () => {
    it('should create a diagnosis and return it', () => {
      const dto = new CreateDiagnosisDto()
      dto.engineId = 'engine-1'
      dto.scenarioId = 'scenario-1'
      dto.tenantId = 'tenant-a'
      dto.requestedBy = 'user-1'

      const result = controller.create(dto)
      expect(result.diagnosis).toBeDefined()
      expect(result.diagnosis.engineId).toBe('engine-1')
      expect(result.diagnosis.status).toBe('PENDING')
    })
  })

  describe('GET /', () => {
    it('should list diagnoses', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const dto = new DiagnosisQueryDto()
      const result = controller.list(dto)
      expect(result.diagnoses.length).toBe(1)
      expect(result.total).toBe(1)
    })

    it('should filter by engineId', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })
      const dto = new DiagnosisQueryDto()
      dto.engineId = 'e1'
      const result = controller.list(dto)
      expect(result.diagnoses).toHaveLength(1)
    })
  })

  describe('GET /:diagnosisId', () => {
    it('should get diagnosis by ID', () => {
      const created = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const result = controller.get(created.diagnosisId)
      expect(result.diagnosis.diagnosisId).toBe(created.diagnosisId)
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      expect(() => controller.get('non-existent')).toThrow()
    })
  })

  describe('PATCH /:diagnosisId', () => {
    it('should update diagnosis', () => {
      const created = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const dto = new UpdateDiagnosisDto()
      dto.status = 'COMPLETED'
      dto.riskLevel = 'high'
      const result = controller.update(created.diagnosisId, dto)
      expect(result.diagnosis.status).toBe('COMPLETED')
      expect(result.diagnosis.riskLevel).toBe('high')
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      const dto = new UpdateDiagnosisDto()
      expect(() => controller.update('fake-id', dto)).toThrow()
    })
  })

  describe('DELETE /:diagnosisId', () => {
    it('should delete diagnosis', () => {
      const created = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      expect(() => controller.remove(created.diagnosisId)).not.toThrow()
    })

    it('should throw NotFoundException for missing diagnosis', () => {
      expect(() => controller.remove('fake-id')).toThrow()
    })
  })

  describe('POST /batch', () => {
    it('should create a batch', () => {
      const dto = new CreateDiagnosisBatchDto()
      dto.engineId = 'engine-1'
      dto.scenarioIds = ['s1', 's2', 's3']
      dto.tenantId = 't1'
      dto.triggeredBy = 'user-1'
      const result = controller.createBatch(dto)
      expect(result.batch.totalDiagnoses).toBe(3)
    })
  })

  describe('GET /batch/:batchId', () => {
    it('should get batch by ID', () => {
      const batch = service.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
      const result = controller.getBatch(batch.batchId)
      expect(result.batch.batchId).toBe(batch.batchId)
    })

    it('should throw NotFoundException for missing batch', () => {
      expect(() => controller.getBatch('non-existent-batch')).toThrow()
    })
  })

  describe('GET /batch', () => {
    it('should list batches', () => {
      service.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
      const result = controller.listBatches()
      expect(result.length).toBe(1)
    })
  })

  describe('GET /report/risk', () => {
    it('should generate risk report', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 'critical-1', tenantId: 't1', requestedBy: 'u1' })
      const result = controller.riskReport()
      expect(result.totalEvaluated).toBeGreaterThan(0)
      expect(result.generatedAt).toBeTruthy()
    })
  })
})
