import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { GiftCardController } from './gift-card.controller'

describe('GiftCardController metadata', () => {
  it('controller should keep gift-card path', () => {
    assert.equal(Reflect.getMetadata('path', GiftCardController), 'gift-card')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [GiftCardController.prototype.create, 1, '/'],
      [GiftCardController.prototype.activate, 1, ':cardId/activate'],
      [GiftCardController.prototype.topup, 1, ':cardId/topup'],
      [GiftCardController.prototype.consume, 1, ':cardId/consume'],
      [GiftCardController.prototype.freeze, 1, ':cardId/freeze'],
      [GiftCardController.prototype.unfreeze, 1, ':cardId/unfreeze'],
      [GiftCardController.prototype.cancel, 1, ':cardId/cancel'],
      [GiftCardController.prototype.refund, 1, ':cardId/refund'],
      [GiftCardController.prototype.getById, 0, ':cardId'],
      [GiftCardController.prototype.list, 0, '/'],
      [GiftCardController.prototype.getTransactions, 0, ':cardId/transactions'],
      [GiftCardController.prototype.getStats, 0, 'stats'],
      [GiftCardController.prototype.cleanupExpired, 1, 'cleanup-expired'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
