import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { StockController } from './stock.controller'

describe('StockController metadata', () => {
  it('controller should keep stock/items path', () => {
    assert.equal(Reflect.getMetadata('path', StockController), 'stock/items')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [StockController.prototype.list, 0, '/'],
      [StockController.prototype.getById, 0, ':id'],
      [StockController.prototype.create, 1, '/'],
      [StockController.prototype.update, 2, ':id'],
      [StockController.prototype.adjust, 1, ':id/adjust'],
      [StockController.prototype.getTransactions, 0, ':id/transactions'],
      [StockController.prototype.getLowStock, 0, 'low-stock'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
