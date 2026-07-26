import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TimeSeriesController } from './time-series.controller'

describe('TimeSeriesController metadata', () => {
  it('controller should keep time-series path', () => {
    assert.equal(Reflect.getMetadata('path', TimeSeriesController), 'time-series')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TimeSeriesController.prototype.record, 1, 'record'],
      [TimeSeriesController.prototype.query, 1, 'query'],
      [TimeSeriesController.prototype.recordBatch, 1, 'batch'],
      [TimeSeriesController.prototype.seasonality, 1, 'seasonality'],
      [TimeSeriesController.prototype.listKeys, 0, 'keys'],
      [TimeSeriesController.prototype.getStatus, 0, 'status'],
      [TimeSeriesController.prototype.getAlertRules, 0, 'alert-rules'],
      [TimeSeriesController.prototype.registerAlertRule, 1, 'alert-rules'],
      [TimeSeriesController.prototype.removeAlertRule, 3, 'alert-rules/:id'],
      [TimeSeriesController.prototype.evaluateAlerts, 1, 'alerts/evaluate'],
      [TimeSeriesController.prototype.getSummary, 0, 'summary'],
      [TimeSeriesController.prototype.compareWindows, 1, 'compare'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
