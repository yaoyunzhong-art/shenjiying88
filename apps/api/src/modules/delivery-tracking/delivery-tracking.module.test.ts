import { describe, it } from 'vitest'
/**
 * 🐜 自动: [delivery-tracking] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { DeliveryTrackingModule } from './delivery-tracking.module'
import { DeliveryTrackingController } from './delivery-tracking.controller'
import { DeliveryTrackingService } from './delivery-tracking.service'

describe('DeliveryTrackingModule', () => {
  it('should be defined', () => {
    const module = new DeliveryTrackingModule()
    assert.ok(module instanceof DeliveryTrackingModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', DeliveryTrackingModule)
    const providers = Reflect.getMetadata('providers', DeliveryTrackingModule)
    const exports = Reflect.getMetadata('exports', DeliveryTrackingModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(DeliveryTrackingController))
    assert.ok(providers.includes(DeliveryTrackingService))
    assert.ok(exports.includes(DeliveryTrackingService))
  })
})
