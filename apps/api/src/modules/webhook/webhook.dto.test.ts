import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'
import type { CreateWebhookRequest, UpdateWebhookRequest, TestWebhookRequest } from './webhook.dto'
import type { WebhookEventType } from './webhook.service'

describe('Webhook DTO types', () => {
  describe('CreateWebhookRequest', () => {
    it('should create a valid CreateWebhookRequest with all fields', () => {
      const dto: CreateWebhookRequest = {
        url: 'https://example.com/hook',
        secret: 'my-secret',
        events: ['order.created', 'order.paid'],
        active: true,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      }
      assert.equal(dto.url, 'https://example.com/hook')
      assert.equal(dto.secret, 'my-secret')
      assert.equal(dto.events.length, 2)
      assert.ok(dto.events.includes('order.created'))
      assert.equal(dto.active, true)
      assert.equal(dto.retryPolicy?.maxRetries, 3)
      assert.equal(dto.retryPolicy?.backoffMs, 1000)
    })

    it('should allow minimal CreateWebhookRequest (required fields only)', () => {
      const dto: CreateWebhookRequest = {
        url: 'https://example.com/hook',
        secret: 'minimal-secret',
        events: ['order.created'],
      }
      assert.equal(dto.url, 'https://example.com/hook')
      assert.equal(dto.secret, 'minimal-secret')
      assert.equal(dto.events.length, 1)
      // Optional fields should be undefined
      assert.equal(dto.active, undefined)
      assert.equal(dto.retryPolicy, undefined)
    })

    it('should accept all valid WebhookEventType values', () => {
      const allEvents: CreateWebhookRequest = {
        url: 'https://example.com/hook',
        secret: 's',
        events: [
          'order.created',
          'order.paid',
          'order.refunded',
          'points.earned',
          'points.redeemed',
          'points.adjusted',
          'coupon.issued',
          'coupon.used',
          'coupon.expired',
          'inventory.low',
          'inventory.out',
          'inventory.restock',
          'user.registered',
          'user.upgraded',
        ],
      }
      assert.equal(allEvents.events.length, 14)
    })
  })

  describe('UpdateWebhookRequest', () => {
    it('should allow partial updates', () => {
      const dto: UpdateWebhookRequest = { url: 'https://new-url.com' }
      assert.equal(dto.url, 'https://new-url.com')
      assert.equal(dto.secret, undefined)
      assert.equal(dto.events, undefined)
    })

    it('should allow updating all fields', () => {
      const dto: UpdateWebhookRequest = {
        url: 'https://updated.com',
        secret: 'new-secret',
        events: ['order.paid', 'order.refunded'],
        active: false,
        retryPolicy: { maxRetries: 5, backoffMs: 2000 },
      }
      assert.equal(dto.url, 'https://updated.com')
      assert.equal(dto.secret, 'new-secret')
      assert.equal(dto.events?.length, 2)
      assert.equal(dto.active, false)
      assert.equal(dto.retryPolicy?.maxRetries, 5)
    })

    it('should allow empty update object (no fields)', () => {
      const dto: UpdateWebhookRequest = {}
      assert.deepEqual(Object.keys(dto), [])
    })
  })

  describe('TestWebhookRequest', () => {
    it('should create with event type only', () => {
      const dto: TestWebhookRequest = {
        eventType: 'order.created',
      }
      assert.equal(dto.eventType, 'order.created')
      assert.equal(dto.customPayload, undefined)
    })

    it('should create with event type and custom payload', () => {
      const dto: TestWebhookRequest = {
        eventType: 'order.paid',
        customPayload: { orderId: 'ord-123', amount: 99.99 },
      }
      assert.equal(dto.eventType, 'order.paid')
      assert.deepEqual(dto.customPayload, { orderId: 'ord-123', amount: 99.99 })
    })

    it('should accept any event type from the service enum', () => {
      const dto: TestWebhookRequest = { eventType: 'inventory.low' as any }
      assert.equal(dto.eventType, 'inventory.low')
    })
  })
})
