import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DeliveryTrackingController } from './delivery-tracking.controller'

describe('DeliveryTrackingController metadata', () => {
  it('controller should keep delivery-tracking path', () => {
    assert.equal(Reflect.getMetadata('path', DeliveryTrackingController), 'delivery-tracking')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [DeliveryTrackingController.prototype.createDelivery, 1, '/'],
      [DeliveryTrackingController.prototype.listDeliveries, 0, '/'],
      [DeliveryTrackingController.prototype.getDelivery, 0, ':deliveryId'],
      [DeliveryTrackingController.prototype.updateDelivery, 4, ':deliveryId'],
      [DeliveryTrackingController.prototype.updateDeliveryStatus, 4, ':deliveryId/status'],
      [DeliveryTrackingController.prototype.addDeliveryEvent, 1, ':deliveryId/events'],
      [DeliveryTrackingController.prototype.getTrackingTimeline, 0, ':deliveryId/timeline'],
      [DeliveryTrackingController.prototype.seedMockData, 1, 'seed'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
