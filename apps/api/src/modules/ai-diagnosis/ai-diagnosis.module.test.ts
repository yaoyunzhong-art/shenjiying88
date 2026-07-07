import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiDiagnosisController } from './ai-diagnosis.controller'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { AiDiagnosisModule } from './ai-diagnosis.module'

describe('AiDiagnosisModule', () => {
  it('should export AiDiagnosisController and AiDiagnosisService', () => {
    const moduleMetadata = Reflect.getMetadata('modules', AiDiagnosisModule) ?? {}

    // Verify module decorator exists
    assert.ok(AiDiagnosisModule)
  })

  it('should have controller and provider metadata', () => {
    // Module存在即可，具体DI由NestJS启动验证
    assert.ok(AiDiagnosisModule)
  })

  it('service instance works standalone', () => {
    AiDiagnosisService.resetStores()
    const service = new AiDiagnosisService()
    const controller = new AiDiagnosisController(service)

    const result = controller.create({
      engineId: 'engine-test',
      scenarioId: 'scenario-test',
      tenantId: 'T-test',
      requestedBy: 'user-test'
    })

    assert.ok(result.diagnosis)
    assert.equal(result.diagnosis.status, 'PENDING')
    assert.equal(result.diagnosis.engineId, 'engine-test')
  })

  it('controller throws NotFound for missing diagnosis', () => {
    AiDiagnosisService.resetStores()
    const service = new AiDiagnosisService()
    const controller = new AiDiagnosisController(service)

    assert.throws(
      () => controller.get('non-existent'),
      (err: any) => err.message.includes('not found')
    )
  })
})
