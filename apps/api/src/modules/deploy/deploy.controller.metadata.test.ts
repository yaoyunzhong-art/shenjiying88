import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DeployController } from './deploy.controller'

describe('DeployController metadata', () => {
  it('controller should keep deploy path', () => {
    assert.equal(Reflect.getMetadata('path', DeployController), 'deploy')
  })

  it('GET routes should keep REST metadata', () => {
    const cases = [
      [DeployController.prototype.getPlan, 'plan/:planId'],
      [DeployController.prototype.getStatus, 'plan/:planId/status'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 0)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('POST routes should keep REST metadata', () => {
    const cases = [
      [DeployController.prototype.generatePlan, 'plan'],
      [DeployController.prototype.preflightCheck, 'preflight'],
      [DeployController.prototype.calculateResources, 'resources'],
      [DeployController.prototype.deploy, 'plan/:planId/deploy'],
      [DeployController.prototype.stop, 'plan/:planId/stop'],
      [DeployController.prototype.rollback, 'plan/:planId/rollback'],
      [DeployController.prototype.estimateMonthlyCost, 'cost'],
      [DeployController.prototype.generateQuote, 'quote'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 1)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
