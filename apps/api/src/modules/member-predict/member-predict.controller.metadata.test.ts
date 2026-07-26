import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { MemberPredictController } from './member-predict.controller'

describe('MemberPredictController metadata', () => {
  it('controller should keep member-predict path', () => {
    assert.equal(Reflect.getMetadata('path', MemberPredictController), 'member-predict')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberPredictController.prototype.findAll, 0, '/'],
      [MemberPredictController.prototype.getSummary, 0, 'summary'],
      [MemberPredictController.prototype.getRiskDistribution, 0, 'risk-distribution'],
      [MemberPredictController.prototype.evaluateRisk, 1, 'evaluate'],
      [MemberPredictController.prototype.findById, 0, ':id'],
      [MemberPredictController.prototype.create, 1, '/'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
