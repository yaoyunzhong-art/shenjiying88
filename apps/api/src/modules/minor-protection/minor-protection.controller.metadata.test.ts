import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { MinorProtectionController } from './minor-protection.controller'

describe('MinorProtectionController metadata', () => {
  it('controller should keep minor-protection path', () => {
    assert.equal(Reflect.getMetadata('path', MinorProtectionController), 'minor-protection')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MinorProtectionController.prototype.registerProfile, 1, 'profile'],
      [MinorProtectionController.prototype.getProfile, 0, 'profile/:userId'],
      [MinorProtectionController.prototype.verifyAge, 1, 'profile/:userId/verify'],
      [MinorProtectionController.prototype.createConsent, 1, 'consent'],
      [MinorProtectionController.prototype.approveConsent, 1, 'consent/:id/approve'],
      [MinorProtectionController.prototype.getConsents, 0, 'consent/:minorUserId'],
      [MinorProtectionController.prototype.checkTimeLimit, 1, 'check/:userId/time'],
      [MinorProtectionController.prototype.checkSpendLimit, 1, 'check/:userId/spend'],
      [MinorProtectionController.prototype.checkBlindbox, 0, 'check/:userId/blindbox'],
      [MinorProtectionController.prototype.checkContent, 1, 'check/:userId/content'],
      [MinorProtectionController.prototype.recordTime, 1, 'record/:userId/time'],
      [MinorProtectionController.prototype.recordSpend, 1, 'record/:userId/spend'],
      [MinorProtectionController.prototype.getReport, 0, 'report/:userId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
