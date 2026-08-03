import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CurrencyController } from './currency.controller'

describe('CurrencyController metadata', () => {
  it('controller should keep currency path', () => {
    assert.equal(Reflect.getMetadata('path', CurrencyController), 'currency')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CurrencyController.prototype.getAllRates, 0, 'rates'],
      [CurrencyController.prototype.getBaseRates, 0, 'rates/base'],
      [CurrencyController.prototype.convert, 1, 'convert'],
      [CurrencyController.prototype.setRate, 1, 'rates'],
      [CurrencyController.prototype.add, 1, 'add'],
      [CurrencyController.prototype.subtract, 1, 'subtract'],
      [CurrencyController.prototype.getConfig, 0, 'config'],
      [CurrencyController.prototype.updateConfig, 1, 'config'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
