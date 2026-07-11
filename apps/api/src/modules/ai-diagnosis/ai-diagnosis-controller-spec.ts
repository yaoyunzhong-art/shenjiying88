/**
 * ai-diagnosis-controller-spec.ts — 诊断 Controller 测试补充
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiDiagnosisController } from './ai-diagnosis.controller'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { CreateDiagnosisDto, CreateDiagnosisBatchDto, UpdateDiagnosisDto, DiagnosisQueryDto } from './ai-diagnosis.dto'

describe('AiDiagnosisController (All Endpoints)', () => {
  let ctrl: AiDiagnosisController
  let svc: AiDiagnosisService
  beforeEach(() => {
    AiDiagnosisService.resetStores()
    svc = new AiDiagnosisService()
    ctrl = new AiDiagnosisController(svc)
  })

  it('POST / 创建诊断', () => {
    const dto = Object.assign(new CreateDiagnosisDto(), { engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    const r = ctrl.create(dto)
    expect(r.diagnosis.diagnosisId).toMatch(/^diag-/)
  })

  it('GET / 列出', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    expect(ctrl.list(new DiagnosisQueryDto()).diagnoses.length).toBe(1)
  })

  it('GET /:id 获取存在', () => {
    const d = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    expect(ctrl.get(d.diagnosisId).diagnosis.diagnosisId).toBe(d.diagnosisId)
  })

  it('GET /:id 不存在抛异常', () => {
    expect(() => ctrl.get('fake')).toThrow()
  })

  it('PATCH /:id 更新', () => {
    const d = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    const dto = Object.assign(new UpdateDiagnosisDto(), { status: 'COMPLETED' as const })
    expect(ctrl.update(d.diagnosisId, dto).diagnosis.status).toBe('COMPLETED')
  })

  it('DELETE /:id 删除', () => {
    const d = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    expect(() => ctrl.remove(d.diagnosisId)).not.toThrow()
  })

  it('DELETE /:id 不存在抛异常', () => {
    expect(() => ctrl.remove('fake')).toThrow()
  })

  it('POST /batch 批量', () => {
    const dto = Object.assign(new CreateDiagnosisBatchDto(), { engineId: 'e1', scenarioIds: ['s1', 's2'], tenantId: 't1', triggeredBy: 'u1' })
    expect(ctrl.createBatch(dto).batch.diagnoses).toHaveLength(2)
  })

  it('GET /report/risk 风险报告', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    const r = ctrl.riskReport()
    expect(r.totalEvaluated).toBe(1)
  })
})
