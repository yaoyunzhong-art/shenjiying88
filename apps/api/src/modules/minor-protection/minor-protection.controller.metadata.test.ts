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
      [MinorProtectionController.prototype.getConfig, 0, 'config'],
      [MinorProtectionController.prototype.verifyIdentity, 1, 'verify'],
      [MinorProtectionController.prototype.listVerifications, 0, 'verifications'],
      [MinorProtectionController.prototype.getVerification, 0, 'verifications/:id'],
      [MinorProtectionController.prototype.checkAccess, 1, 'check-access'],
      [MinorProtectionController.prototype.getAccessLogs, 0, 'access-logs'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
