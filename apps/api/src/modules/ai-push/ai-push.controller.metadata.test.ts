import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiPushController } from './ai-push.controller'

describe('AiPushController metadata', () => {
  it('controller should keep ai-push path', () => {
    assert.equal(Reflect.getMetadata('path', AiPushController), 'ai-push')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiPushController.prototype.createTask, 1, 'tasks'],
      [AiPushController.prototype.segmentPush, 1, 'segment-push'],
      [AiPushController.prototype.getTasks, 0, 'tasks'],
      [AiPushController.prototype.getStats, 0, 'stats'],
      [AiPushController.prototype.createExperiment, 1, 'experiments'],
      [AiPushController.prototype.getExperimentResult, 0, 'experiments/result'],
      [AiPushController.prototype.recordConversion, 1, 'conversion'],
      [AiPushController.prototype.getOptimalTiming, 0, 'optimal-timing'],
      [AiPushController.prototype.getSegmentProfile, 1, 'segment-profile'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
