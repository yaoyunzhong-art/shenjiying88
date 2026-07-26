import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MarketController } from './market.controller'

describe('MarketController metadata', () => {
  it('controller should keep markets path', () => {
    assert.equal(Reflect.getMetadata('path', MarketController), 'markets')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MarketController.prototype.getBootstrap, 0, 'bootstrap'],
      [MarketController.prototype.getScopedMarket, 0, ':scopeType/:scopeCode'],
      [MarketController.prototype.getScopedPortalMarket, 0, ':scopeType/:scopeCode/portal'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
