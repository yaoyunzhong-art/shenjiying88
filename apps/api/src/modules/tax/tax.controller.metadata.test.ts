import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { TaxController } from './tax.controller'

describe('TaxController metadata', () => {
  it('controller should keep tax path', () => {
    assert.equal(Reflect.getMetadata('path', TaxController), 'tax')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TaxController.prototype.calculate, 1, 'calculate'],
      [TaxController.prototype.calculateBatch, 1, 'calculate/batch'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
