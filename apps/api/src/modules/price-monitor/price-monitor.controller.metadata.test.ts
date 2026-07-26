import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { PriceMonitorController } from './price-monitor.controller'

describe('PriceMonitorController metadata', () => {
  it('controller should keep price-monitor path', () => {
    assert.equal(Reflect.getMetadata('path', PriceMonitorController), 'price-monitor')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PriceMonitorController.prototype.list, 0, '/'],
      [PriceMonitorController.prototype.get, 0, ':id'],
      [PriceMonitorController.prototype.getSummary, 0, 'summary'],
      [PriceMonitorController.prototype.getAnomalies, 0, 'anomalies'],
      [PriceMonitorController.prototype.getComparison, 0, 'comparison'],
      [PriceMonitorController.prototype.create, 1, '/'],
      [PriceMonitorController.prototype.delete, 3, ':id'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
