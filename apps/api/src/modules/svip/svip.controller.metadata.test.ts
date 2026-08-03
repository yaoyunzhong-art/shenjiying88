import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SvipController } from './svip.controller'

describe('SvipController metadata', () => {
  it('controller should keep svip path', () => {
    assert.equal(Reflect.getMetadata('path', SvipController), 'svip')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SvipController.prototype.createPlan, 1, 'plans'],
      [SvipController.prototype.listPlans, 0, 'plans'],
      [SvipController.prototype.subscribe, 1, 'subscribe'],
      [SvipController.prototype.getSubscription, 0, 'subscription/:userId'],
      [SvipController.prototype.cancel, 1, ':subscriptionId/cancel'],
      [SvipController.prototype.renew, 1, ':subscriptionId/renew'],
      [SvipController.prototype.useBenefit, 1, ':subscriptionId/benefit'],
      [SvipController.prototype.getBenefits, 0, ':subscriptionId/benefits'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
