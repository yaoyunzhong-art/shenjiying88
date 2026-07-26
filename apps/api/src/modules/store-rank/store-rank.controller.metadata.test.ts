import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { StoreRankController } from './store-rank.controller'

describe('StoreRankController metadata', () => {
  it('controller should keep store-rank path', () => {
    assert.equal(Reflect.getMetadata('path', StoreRankController), 'store-rank')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [StoreRankController.prototype.list, 0, '/'],
      [StoreRankController.prototype.get, 0, ':id'],
      [StoreRankController.prototype.getSummary, 0, 'summary'],
      [StoreRankController.prototype.getChanges, 0, 'changes'],
      [StoreRankController.prototype.create, 1, '/'],
      [StoreRankController.prototype.delete, 3, ':id'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
