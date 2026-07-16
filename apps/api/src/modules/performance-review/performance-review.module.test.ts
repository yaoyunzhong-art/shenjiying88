import { describe, it } from 'vitest'
/**
 * 🐜 自动: [performance-review] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PerformanceReviewModule } from './performance-review.module'
import { PerformanceReviewController } from './performance-review.controller'
import { PerformanceReviewService } from './performance-review.service'

describe('PerformanceReviewModule', () => {
  it('should be defined', () => {
    const module = new PerformanceReviewModule()
    assert.ok(module instanceof PerformanceReviewModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', PerformanceReviewModule)
    const providers = Reflect.getMetadata('providers', PerformanceReviewModule)
    const exports = Reflect.getMetadata('exports', PerformanceReviewModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(PerformanceReviewController))
    assert.ok(providers.includes(PerformanceReviewService))
    assert.ok(exports.includes(PerformanceReviewService))
  })
})
