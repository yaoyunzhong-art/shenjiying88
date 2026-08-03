import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { HealthDashboardController } from './health-dashboard.controller'

describe('HealthDashboardController metadata', () => {
  it('controller should keep health-dashboard path', () => {
    assert.equal(Reflect.getMetadata('path', HealthDashboardController), 'health-dashboard')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [HealthDashboardController.prototype.evaluate, 1, 'evaluate'],
      [HealthDashboardController.prototype.generateSummary, 0, 'summary'],
      [HealthDashboardController.prototype.checkAlerts, 1, 'alerts'],
      [HealthDashboardController.prototype.getMetrics, 0, 'metrics'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
