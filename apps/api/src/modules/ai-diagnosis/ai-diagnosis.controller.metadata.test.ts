import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiDiagnosisController } from './ai-diagnosis.controller'

describe('AiDiagnosisController metadata', () => {
  it('controller should keep ai-diagnosis path', () => {
    assert.equal(Reflect.getMetadata('path', AiDiagnosisController), 'ai-diagnosis')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiDiagnosisController.prototype.create, 1, '/'],
      [AiDiagnosisController.prototype.list, 0, '/'],
      [AiDiagnosisController.prototype.get, 0, '/:diagnosisId'],
      [AiDiagnosisController.prototype.update, 4, '/:diagnosisId'],
      [AiDiagnosisController.prototype.remove, 3, '/:diagnosisId'],
      [AiDiagnosisController.prototype.createBatch, 1, '/batch'],
      [AiDiagnosisController.prototype.getBatch, 0, '/batch/:batchId'],
      [AiDiagnosisController.prototype.listBatches, 0, '/batch'],
      [AiDiagnosisController.prototype.riskReport, 0, '/report/risk'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
