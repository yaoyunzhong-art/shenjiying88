import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { MemberP36Controller } from './member-p36.controller'

describe('MemberP36Controller metadata', () => {
  it('controller should keep api/v1/p36/members path', () => {
    assert.equal(Reflect.getMetadata('path', MemberP36Controller), 'api/v1/p36/members')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberP36Controller.prototype.register, 1, 'register'],
      [MemberP36Controller.prototype.queryByPhone, 0, 'query/:phone'],
      [MemberP36Controller.prototype.getLevelDisplay, 0, ':id/level'],
      [MemberP36Controller.prototype.earnPoints, 1, ':id/points/earn'],
      [MemberP36Controller.prototype.redeemPoints, 1, ':id/points/redeem'],
      [MemberP36Controller.prototype.recharge, 1, ':id/balance/recharge'],
      [MemberP36Controller.prototype.payByBalance, 1, ':id/balance/pay'],
      [MemberP36Controller.prototype.getRecords, 0, ':id/records'],
      [MemberP36Controller.prototype.renew, 1, ':id/renew'],
      [MemberP36Controller.prototype.getBenefits, 0, ':id/benefits'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
