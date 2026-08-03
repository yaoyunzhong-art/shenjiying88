import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AnomalyDetectorController } from './anomaly-detector.controller'

describe('AnomalyDetectorController metadata', () => {
  it('controller should keep anomaly-detector path', () => {
    assert.equal(Reflect.getMetadata('path', AnomalyDetectorController), 'anomaly-detector')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AnomalyDetectorController.prototype.detect, 1, 'detect'],
      [AnomalyDetectorController.prototype.detectBatch, 1, 'detect/batch'],
      [AnomalyDetectorController.prototype.configure, 1, 'configure'],
      [AnomalyDetectorController.prototype.getStatus, 0, 'status'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
