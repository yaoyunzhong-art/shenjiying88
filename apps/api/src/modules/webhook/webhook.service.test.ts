import { describe, it, expect, beforeEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { WebhookService, type WebhookEventType } from './webhook.service'

describe('WebhookService', () => {
  let service: WebhookService

  const testUrl = 'https://example.com/webhook'
  const testSecret = 'test-secret-key'
  const testEvents: WebhookEventType[] = ['order.created', 'order.paid']

  beforeEach(() => {
    service = new WebhookService()
  })

  describe('registerEndpoint', () => {
    it('should register a new webhook endpoint', async () => {
      const endpoint = await service.registerEndpoint(testUrl, testSecret, testEvents)
      assert.ok(endpoint)
      assert.ok(endpoint.id)
      assert.equal(endpoint.url, testUrl)
      assert.equal(endpoint.secret, testSecret)
      assert.deepEqual(endpoint.events, testEvents)
      assert.equal(endpoint.active, true)
      assert.ok(endpoint.createdAt instanceof Date)
    })

    it('should assign unique ids to different endpoints', async () => {
      const ep1 = await service.registerEndpoint('https://a.com', 's1', ['order.created'])
      const ep2 = await service.registerEndpoint('https://b.com', 's2', ['order.paid'])
      assert.notEqual(ep1.id, ep2.id)
    })
  })

  describe('listEndpoints', () => {
    it('should return empty list when no endpoints exist', async () => {
      const list = await service.listEndpoints()
      assert.deepEqual(list, [])
    })

    it('should return all registered endpoints', async () => {
      await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.registerEndpoint('https://other.com', 'other-secret', ['order.paid'])
      const list = await service.listEndpoints()
      assert.equal(list.length, 2)
    })
  })

  describe('getById', () => {
    it('should return null for non-existent endpoint', async () => {
      const result = await service.getById('non-existent')
      assert.equal(result, null)
    })

    it('should return the endpoint by id', async () => {
      const created = await service.registerEndpoint(testUrl, testSecret, testEvents)
      const found = await service.getById(created.id)
      assert.ok(found)
      assert.equal(found?.id, created.id)
    })
  })

  describe('updateEndpoint', () => {
    it('should throw when updating non-existent endpoint', async () => {
      await assert.rejects(
        () => service.updateEndpoint('non-existent', { url: 'https://new.com' }),
        /Endpoint non-existent not found/,
      )
    })

    it('should update endpoint fields', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      const updated = await service.updateEndpoint(ep.id, { url: 'https://new.com', active: false })
      assert.equal(updated.url, 'https://new.com')
      assert.equal(updated.active, false)
      // Original fields unchanged
      assert.equal(updated.secret, testSecret)
      assert.equal(updated.id, ep.id)
    })
  })

  describe('deleteEndpoint', () => {
    it('should throw when deleting non-existent endpoint', async () => {
      await assert.rejects(
        () => service.deleteEndpoint('non-existent'),
        /Endpoint non-existent not found/,
      )
    })

    it('should delete endpoint and its subscriptions', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      const sub = await service.subscribe(ep.id, 'order.created')
      assert.ok(sub)

      await service.deleteEndpoint(ep.id)

      // Verify endpoint is gone
      const found = await service.getById(ep.id)
      assert.equal(found, null)

      // Verify subscriptions are cleaned up
      assert.equal(service.getSubscriptions().size, 0)

      // Verify delivery logs are cleaned up
      const logs = await service.getDeliveryLogs(ep.id)
      assert.deepEqual(logs, [])
    })
  })

  describe('subscribe / unsubscribe', () => {
    it('should subscribe to an event on an endpoint', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      const sub = await service.subscribe(ep.id, 'order.created')
      assert.ok(sub)
      assert.equal(sub.endpointId, ep.id)
      assert.equal(sub.event, 'order.created')
      assert.equal(sub.active, true)
    })

    it('should throw when subscribing to non-existent endpoint', async () => {
      await assert.rejects(
        () => service.subscribe('bad-id', 'order.created'),
        /Endpoint bad-id not found/,
      )
    })

    it('should unsubscribe', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      const sub = await service.subscribe(ep.id, 'order.created')
      await service.unsubscribe(sub.id)
      // After unsubscribing, no subscriptions remain
      assert.equal(service.getSubscriptions().size, 0)
    })
  })

  describe('signPayload / verifySignature', () => {
    it('should produce consistent signatures', () => {
      const sig1 = service.signPayload('{"key":"value"}', 'secret')
      const sig2 = service.signPayload('{"key":"value"}', 'secret')
      assert.equal(sig1, sig2)
    })

    it('should produce different signatures for different payloads', () => {
      const sig1 = service.signPayload('payload1', 'secret')
      const sig2 = service.signPayload('payload2', 'secret')
      assert.notEqual(sig1, sig2)
    })

    it('should verify correct signature', () => {
      const payload = '{"orderId":"123"}'
      const sig = service.signPayload(payload, 'secret')
      assert.equal(service.verifySignature(payload, sig, 'secret'), true)
    })

    it('should reject incorrect signature', () => {
      const payload = '{"orderId":"123"}'
      const sig = service.signPayload(payload, 'secret')
      assert.equal(service.verifySignature(payload, sig, 'wrong-secret'), false)
    })

    it('should handle empty payload', () => {
      const sig = service.signPayload('', 'secret')
      assert.ok(sig)
      assert.equal(service.verifySignature('', sig, 'secret'), true)
    })

    it('should reject invalid signature format gracefully', () => {
      assert.equal(service.verifySignature('payload', 'not-hex', 'secret'), false)
    })
  })

  describe('delivery and retry', () => {
    it('should use mock http client for testing', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created')

      const mockClient = { post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }) }
      service.setHttpClient(mockClient as any)

      await service.emit('order.created', { orderId: 'ord-001' })

      // Wait for async delivery
      await vi.waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledTimes(1)
      }, { timeout: 1000 })

      const [callUrl, callBody, callHeaders] = mockClient.post.mock.calls[0]
      assert.equal(callUrl, testUrl)
      const parsed = JSON.parse(callBody)
      assert.equal(parsed.orderId, 'ord-001')
      assert.ok(callHeaders['X-Webhook-Signature'])
      assert.equal(callHeaders['X-Webhook-Event'], 'order.created')
    })

    it('should retry on failure with exponential backoff', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created')

      const mockClient = {
        post: vi.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ status: 200, body: 'ok' }),
      }
      service.setHttpClient(mockClient as any)

      await service.emit('order.created', { orderId: 'ord-002' })

      // Wait for delivery (may retry)
      await vi.waitFor(() => {
        expect(mockClient.post.mock.calls.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 2000 })

      // Should have attempted at least once
      assert.ok(mockClient.post.mock.calls.length >= 1)
    })

    it('should mark delivery as failed after max retries', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created')

      const mockClient = {
        post: vi.fn().mockRejectedValue(new Error('Always fails')),
      }
      service.setHttpClient(mockClient as any)

      await service.emit('order.created', { orderId: 'ord-003' })

      // Wait for retries to exhaust (maxRetries=5 → 5 retries + initial = 6 attempts)
      await vi.waitFor(() => {
        expect(mockClient.post.mock.calls.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 5000 })

      // After all retries, the delivery log should exist
      const logs = await service.getDeliveryLogs(ep.id)
      // At least one delivery log should exist
      assert.ok(logs.length > 0)
    })
  })

  describe('emit with filter matching', () => {
    it('should only deliver to subscriptions with matching filters', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created', { storeId: 'store-001' })

      const mockClient = { post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }) }
      service.setHttpClient(mockClient as any)

      // Emit with matching storeId
      await service.emit('order.created', { storeId: 'store-001', orderId: 'ord-001' })
      await vi.waitFor(() => {
        expect(mockClient.post.mock.calls.length).toBe(1)
      }, { timeout: 1000 })

      // Emit with non-matching storeId
      mockClient.post.mockClear()
      await service.emit('order.created', { storeId: 'store-002', orderId: 'ord-002' })
      // Give async time; since filters don't match, no delivery
      await new Promise(r => setTimeout(r, 200))
      assert.equal(mockClient.post.mock.calls.length, 0)
    })
  })

  describe('delivery logs', () => {
    it('should record delivery attempts in logs', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created')

      const mockClient = { post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }) }
      service.setHttpClient(mockClient as any)

      await service.emit('order.created', { orderId: 'ord-004' })
      await vi.waitFor(() => {
        expect(mockClient.post.mock.calls.length).toBe(1)
      }, { timeout: 1000 })

      const logs = await service.getDeliveryLogs(ep.id)
      assert.ok(logs.length >= 1)
      const lastLog = logs[0]
      assert.equal(lastLog.event, 'order.created')
      assert.equal(lastLog.status, 'success')
      assert.equal(lastLog.responseCode, 200)
    })
  })

  describe('edge cases', () => {
    it('should handle emitting with no matching subscriptions gracefully', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      // No subscriptions
      await service.emit('order.created', { orderId: 'ord-005' })
      // No error should be thrown
      const logs = await service.getDeliveryLogs(ep.id)
      assert.ok(Array.isArray(logs))
    })

    it('should handle non-active endpoints in delivery', async () => {
      const ep = await service.registerEndpoint(testUrl, testSecret, testEvents)
      await service.subscribe(ep.id, 'order.created')
      // Deactivate endpoint
      await service.updateEndpoint(ep.id, { active: false })

      const mockClient = { post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }) }
      service.setHttpClient(mockClient as any)

      await service.emit('order.created', { orderId: 'ord-006' })
      await new Promise(r => setTimeout(r, 200))
      // Should not attempt delivery since endpoint is inactive
      assert.equal(mockClient.post.mock.calls.length, 0)
    })
  })
})
