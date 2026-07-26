import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PerfMonitorController } from './perf-monitor.controller'

describe('PerfMonitorController metadata', () => {
  it('controller should keep perf-monitor path', () => {
    assert.equal(Reflect.getMetadata('path', PerfMonitorController), 'perf-monitor')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PerfMonitorController.prototype.record, 1, 'record'],
      [PerfMonitorController.prototype.registerSla, 1, 'sla'],
      [PerfMonitorController.prototype.getStats, 0, 'stats'],
      [PerfMonitorController.prototype.getAllStats, 0, 'stats/all'],
      [PerfMonitorController.prototype.getSummary, 0, 'summary'],
      [PerfMonitorController.prototype.getViolations, 0, 'violations'],
      [PerfMonitorController.prototype.getSlowQueries, 0, 'slow-queries'],
      [PerfMonitorController.prototype.reset, 1, 'reset'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
