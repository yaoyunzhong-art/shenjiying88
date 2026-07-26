import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiRuleEngineController } from './ai-rule-engine.controller'

describe('AiRuleEngineController metadata', () => {
  it('controller should keep ai-rule-engine path', () => {
    assert.equal(Reflect.getMetadata('path', AiRuleEngineController), 'ai-rule-engine')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiRuleEngineController.prototype.evaluate, 1, 'evaluate'],
      [AiRuleEngineController.prototype.evaluateMemberLevel, 1, 'evaluate/member-level'],
      [AiRuleEngineController.prototype.detectDeviceAnomaly, 1, 'evaluate/device-anomaly'],
      [AiRuleEngineController.prototype.evaluateBatch, 1, 'evaluate/batch'],
      [AiRuleEngineController.prototype.getEngines, 0, 'engines'],
      [AiRuleEngineController.prototype.evaluateRiskScore, 1, 'evaluate/risk-score'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
