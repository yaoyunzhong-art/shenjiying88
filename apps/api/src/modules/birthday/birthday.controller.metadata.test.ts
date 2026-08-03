import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { BirthdayController } from './birthday.controller'

describe('BirthdayController metadata', () => {
  it('controller should keep birthday path', () => {
    assert.equal(Reflect.getMetadata('path', BirthdayController), 'birthday')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [BirthdayController.prototype.createPlan, 1, 'plans'],
      [BirthdayController.prototype.listPlans, 0, 'plans'],
      [BirthdayController.prototype.getPlan, 0, 'plans/:id'],
      [BirthdayController.prototype.triggerPush, 1, 'plans/:id/trigger'],
      [BirthdayController.prototype.claimReward, 1, 'plans/:id/claim'],
      [BirthdayController.prototype.recordTracking, 1, 'plans/:id/track'],
      [BirthdayController.prototype.getDashboard, 0, 'stats'],
      [BirthdayController.prototype.getMemberStats, 0, 'stats/:memberId'],
      [BirthdayController.prototype.getCountdown, 0, 'countdown/:memberId'],
      [BirthdayController.prototype.getPreview, 0, 'preview/:memberId'],
      [BirthdayController.prototype.preloadEffects, 1, 'effects/preload/:memberId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
