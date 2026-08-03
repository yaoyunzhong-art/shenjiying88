import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RoyaltyController } from './royalty.controller'

describe('RoyaltyController metadata', () => {
  it('controller should keep royalty path', () => {
    assert.equal(Reflect.getMetadata('path', RoyaltyController), 'royalty')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RoyaltyController.prototype.createRule, 1, 'rules'],
      [RoyaltyController.prototype.findAllRules, 0, 'rules'],
      [RoyaltyController.prototype.findRuleById, 0, 'rules/:ruleId'],
      [RoyaltyController.prototype.updateRule, 4, 'rules/:ruleId'],
      [RoyaltyController.prototype.deleteRule, 3, 'rules/:ruleId'],
      [RoyaltyController.prototype.calculate, 1, 'calculate'],
      [RoyaltyController.prototype.findAllCalculations, 0, 'calculations'],
      [RoyaltyController.prototype.findCalculationById, 0, 'calculations/:calculationId'],
      [RoyaltyController.prototype.settle, 1, 'settle'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
