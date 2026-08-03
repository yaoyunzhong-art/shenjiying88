import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { WebhookService } from './webhook.service'
import { WebhookDispatcher, type DeliveryAttemptResult } from '../webhook-dispatcher'
import { WebhookAdapter } from '../datasources/webhook.adapter'

describe('WebhookService - Webhook 业务层', () => {
  let adapter: WebhookAdapter
  let dispatcher: WebhookDispatcher
  let service: WebhookService

  beforeEach(() => {
    adapter = new WebhookAdapter()
    dispatcher = new WebhookDispatcher(adapter)
    service = new WebhookService(dispatcher, adapter)
  })

  it('createSubscription 创建 HTTPS 订阅', () => {
    const sub = service.createSubscription({
      tenantId: 't-001',
      url: 'https://example.com/hook',
      events: ['order.created'],
      createdBy: 'admin'
    })
    assert.ok(sub.id.startsWith('whsub-'))
    assert.equal(sub.url, 'https://example.com/hook')
    assert.equal(sub.status, 'ACTIVE')
    assert.ok(sub.secret.length > 0)
  })

  it('createSubscription 非 HTTPS URL 抛错', () => {
    assert.throws(() => {
      service.createSubscription({
        tenantId: 't-001', url: 'http://insecure.com/hook',
        events: ['order.created'], createdBy: 'admin'
      })
    }, /url_must_be_https/)
  })

  it('createSubscription 缺少 events 抛错', () => {
    assert.throws(() => {
      service.createSubscription({
        tenantId: 't-001', url: 'https://example.com/hook',
        events: [], createdBy: 'admin'
      })
    }, /events_required/)
  })

  it('createSubscription 非 HTTPS URL 先检查前缀', () => {
    assert.throws(() => {
      service.createSubscription({
        tenantId: 't-001', url: 'not-a-url',
        events: ['order.created'], createdBy: 'admin'
      })
    }, /url_must_be_https/)
  })

  it('listSubscriptions 列出订阅', () => {
    service.createSubscription({ tenantId: 't-001', url: 'https://a.com/hook', events: ['order.created'], createdBy: 'admin' })
    service.createSubscription({ tenantId: 't-001', url: 'https://b.com/hook', events: ['order.paid'], createdBy: 'admin' })
    service.createSubscription({ tenantId: 't-002', url: 'https://c.com/hook', events: ['order.created'], createdBy: 'admin' })
    const list = service.listSubscriptions('t-001')
    assert.equal(list.length, 2)
  })

  it('pauseSubscription + resumeSubscription 暂停/恢复', () => {
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    const paused = service.pauseSubscription('t-001', sub.id)
    assert.equal(paused!.status, 'PAUSED')
    const resumed = service.resumeSubscription('t-001', sub.id)
    assert.equal(resumed!.status, 'ACTIVE')
  })

  it('pauseSubscription 不存在的订阅返回 null', () => {
    assert.equal(service.pauseSubscription('t-001', 'nonexistent'), null)
  })

  it('deleteSubscription 删除订阅', () => {
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    assert.equal(service.deleteSubscription('t-001', sub.id), true)
    assert.equal(service.deleteSubscription('t-001', 'nonexistent'), false)
  })

  it('dispatchEvent 投递事件', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: true, responseStatus: 200, responseBody: 'ok' })
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    const delivery = await service.dispatchEvent({
      tenantId: 't-001', subscriptionId: sub.id,
      eventType: 'order.created', payload: { id: 'evt-001' }
    })
    assert.equal(delivery.status, 'SUCCESS')
  })

  it('listDeliveries 列出投递记录', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: true, responseStatus: 200, responseBody: 'ok' })
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    await service.dispatchEvent({ tenantId: 't-001', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'evt-001' } })
    await service.dispatchEvent({ tenantId: 't-001', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'evt-002' } })
    const deliveries = service.listDeliveries('t-001')
    assert.equal(deliveries.length, 2)
  })

  it('listDeadLetter 返回死信', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: false, responseStatus: 500, errorMessage: 'err' })
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    let delivery = await service.dispatchEvent({ tenantId: 't-001', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'evt-001' } })
    for (let i = 0; i < 6; i++) {
      delivery = await service.retryDelivery('t-001', delivery.id)
      if (delivery.status === 'DEAD_LETTER') break
    }
    const dlq = service.listDeadLetter('t-001')
    assert.equal(dlq.length, 1)
  })

  it('stats 统计信息', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: true, responseStatus: 200, responseBody: 'ok' })
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    await service.dispatchEvent({ tenantId: 't-001', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'evt-001' } })
    const s = service.stats('t-001')
    assert.equal(s.subscriptions.total, 1)
    assert.equal(s.subscriptions.active, 1)
    assert.equal(s.deliveries.total, 1)
    assert.equal(s.deliveries.success, 1)
  })

  it('recoverFromDeadLetter 从死信恢复', async () => {
    // Create a failed dispatch that becomes dead letter
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: false, responseStatus: 500, errorMessage: 'err' })
    const sub = service.createSubscription({ tenantId: 't-001', url: 'https://example.com/hook', events: ['order.created'], createdBy: 'admin' })
    let delivery = await service.dispatchEvent({ tenantId: 't-001', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'evt-001' } })
    for (let i = 0; i < 6; i++) {
      delivery = await service.retryDelivery('t-001', delivery.id)
      if (delivery.status === 'DEAD_LETTER') break
    }
    assert.equal(delivery.status, 'DEAD_LETTER')

    // Now recover with success
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => ({ success: true, responseStatus: 200, responseBody: 'ok' })
    const recovered = await service.recoverFromDeadLetter('t-001', delivery.id)
    assert.equal(recovered.status, 'SUCCESS')
  })
})
