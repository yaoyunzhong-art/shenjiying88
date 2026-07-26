import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { MemberStoreAController } from './member-store-a.controller'

describe('MemberStoreAController metadata', () => {
  it('controller should keep api/members path', () => {
    assert.equal(Reflect.getMetadata('path', MemberStoreAController), 'api/members')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberStoreAController.prototype.getMember, 0, ':id'],
      [MemberStoreAController.prototype.register, 1, '/'],
      [MemberStoreAController.prototype.earnPoints, 1, ':id/points'],
      [MemberStoreAController.prototype.redeemPoints, 1, ':id/redeem'],
      [MemberStoreAController.prototype.getLevels, 0, ':id/levels'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
