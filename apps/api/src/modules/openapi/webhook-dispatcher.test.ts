import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { WebhookDispatcher } from './webhook-dispatcher'
import { WebhookAdapter } from './datasources/webhook.adapter'
import type { WebhookSubscription, WebhookDelivery } from './openapi.entity'

describe('WebhookDispatcher', () => {
  let dispatcher: WebhookDispatcher
  let adapter: WebhookAdapter

  beforeEach(() => {
    adapter = new WebhookAdapter()
    dispatcher = new WebhookDispatcher(adapter)
  })

  function makeSub(overrides: Partial<WebhookSubscription> = {}): WebhookSubscription {
    return {
      id: 'sub-1',
      tenantId: 't1',
      url: 'https://hooks.example.com/webhook',
      events: ['order.created'],
      secret: 'sub-secret',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      ...overrides
    }
  }

  describe('dispatch', () => {
    it('成功投递', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })

      const delivery = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created',
        payload: { id: 'evt-1', total: 100 }
      })
      assert.equal(delivery.status, 'SUCCESS')
      assert.equal(delivery.attempts, 1)
    })

    it('失败进入 FAILED 状态', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500, errorMessage: 'server error' })

      const delivery = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created',
        payload: { id: 'evt-2' }
      })
      assert.equal(delivery.status, 'FAILED')
      assert.ok(delivery.nextRetryAt)
    })

    it('重试 5 次后入死信', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500, errorMessage: 'always fail' })

      // 1 次 dispatch + 4 次 retry = 5 次尝试, 第 5 次入死信
      let lastDelivery: WebhookDelivery = null as any
      lastDelivery = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created',
        payload: { id: 'evt-fail' }
      })
      for (let i = 1; i < 5; i++) {
        lastDelivery = await dispatcher.retry('t1', lastDelivery.id)
      }
      assert.equal(lastDelivery.status, 'DEAD_LETTER')
      assert.equal(lastDelivery.attempts, 5)
    })

    it('订阅不存在抛错', async () => {
      await assert.rejects(async () => {
        await dispatcher.dispatch({
          tenantId: 't1', subscriptionId: 'non-existent',
          eventType: 'order.created', payload: {}
        })
      }, /subscription_not_found/)
    })

    it('订阅暂停抛错', async () => {
      adapter.saveSubscription(makeSub({ status: 'PAUSED' }))
      await assert.rejects(async () => {
        await dispatcher.dispatch({
          tenantId: 't1', subscriptionId: 'sub-1',
          eventType: 'order.created', payload: {}
        })
      }, /subscription_inactive/)
    })

    it('事件未订阅抛错', async () => {
      adapter.saveSubscription(makeSub())
      await assert.rejects(async () => {
        await dispatcher.dispatch({
          tenantId: 't1', subscriptionId: 'sub-1',
          eventType: 'order.paid' as any, payload: {}
        })
      }, /event_not_subscribed/)
    })

    it('重复投递 (同 eventId) 抛错', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created', payload: { id: 'same-evt' }
      })
      await assert.rejects(async () => {
        await dispatcher.dispatch({
          tenantId: 't1', subscriptionId: 'sub-1',
          eventType: 'order.created', payload: { id: 'same-evt' }
        })
      }, /duplicate_delivery/)
    })
  })

  describe('retry', () => {
    it('手动重试', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500, errorMessage: 'temp' })
      const d = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created', payload: { id: 'r-1' }
      })
      assert.equal(d.status, 'FAILED')

      dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      const retried = await dispatcher.retry('t1', d.id)
      assert.equal(retried.status, 'SUCCESS')
    })
  })

  describe('recoverFromDeadLetter', () => {
    it('从死信恢复', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500 })
      const d = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created', payload: { id: 'dl-1' }
      })
      // 模拟死信
      d.status = 'DEAD_LETTER'
      adapter.saveDelivery(d)

      dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      const recovered = await dispatcher.recoverFromDeadLetter('t1', d.id)
      assert.equal(recovered.status, 'SUCCESS')
    })
  })

  describe('重试延迟', () => {
    it('getNextRetryDelay 返回递增延迟', () => {
      assert.equal(dispatcher.getNextRetryDelay(0), 1000)    // 1s
      assert.equal(dispatcher.getNextRetryDelay(1), 5000)    // 5s
      assert.equal(dispatcher.getNextRetryDelay(2), 30000)   // 30s
      assert.equal(dispatcher.getNextRetryDelay(3), 300000)  // 5min
      assert.equal(dispatcher.getNextRetryDelay(4), 1800000) // 30min
      assert.equal(dispatcher.getNextRetryDelay(5), -1)      // 超出
    })

    it('isMaxAttemptsReached', () => {
      assert.equal(dispatcher.isMaxAttemptsReached(4), false)
      assert.equal(dispatcher.isMaxAttemptsReached(5), true)
    })

    it('getMaxAttempts = 5', () => {
      assert.equal(dispatcher.getMaxAttempts(), 5)
    })
  })

  describe('签名', () => {
    it('delivery 包含 HMAC 签名', async () => {
      adapter.saveSubscription(makeSub())
      dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      const d = await dispatcher.dispatch({
        tenantId: 't1', subscriptionId: 'sub-1',
        eventType: 'order.created', payload: { id: 'sig-1' }
      })
      assert.ok(d.signature)
      assert.ok(d.signature.length > 0)
    })
  })
})