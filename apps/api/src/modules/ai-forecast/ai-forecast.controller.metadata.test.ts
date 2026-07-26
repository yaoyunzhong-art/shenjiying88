import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiForecastController } from './ai-forecast.controller'

describe('AiForecastController metadata', () => {
  it('controller should keep ai-forecast path', () => {
    assert.equal(Reflect.getMetadata('path', AiForecastController), 'ai-forecast')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiForecastController.prototype.forecastSales, 0, 'forecast/sales'],
      [AiForecastController.prototype.forecastCategory, 0, 'forecast/category'],
      [AiForecastController.prototype.getSeasonality, 0, 'seasonality'],
      [AiForecastController.prototype.adjustForPromotions, 1, 'forecast/adjust-promotions'],
      [AiForecastController.prototype.calculateOptimalStock, 0, 'inventory/optimal-stock'],
      [AiForecastController.prototype.suggestReorder, 0, 'inventory/reorder'],
      [AiForecastController.prototype.detectSlowMoving, 0, 'inventory/slow-moving'],
      [AiForecastController.prototype.suggestTransfer, 0, 'transfer/suggest'],
      [AiForecastController.prototype.calculateTransferBenefit, 0, 'transfer/benefit'],
      [AiForecastController.prototype.optimizeGlobalAllocation, 1, 'transfer/optimize-global'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
