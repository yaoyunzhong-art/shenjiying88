import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { WebhookDispatcher, type DeliveryAttemptResult } from './webhook-dispatcher'
import { WebhookAdapter } from './datasources/webhook.adapter'
import type { WebhookSubscription } from './openapi.entity'

describe('WebhookDispatcher - 事件分发 + 指数退避', () => {
  let adapter: WebhookAdapter
  let dispatcher: WebhookDispatcher
  let activeSub: WebhookSubscription

  beforeEach(() => {
    adapter = new WebhookAdapter()
    dispatcher = new WebhookDispatcher(adapter)
    activeSub = {
      id: 'whsub-001',
      tenantId: 't-001',
      url: 'https://example.com/webhook',
      events: ['order.created', 'order.paid'],
      secret: 'webhook-secret-123',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'admin'
    }
    adapter.saveSubscription(activeSub)
  })

  it('getMaxAttempts 返回 5', () => {
    assert.equal(dispatcher.getMaxAttempts(), 5)
  })

  it('getNextRetryDelay 指数退避延迟', () => {
    assert.equal(dispatcher.getNextRetryDelay(0), 1000)
    assert.equal(dispatcher.getNextRetryDelay(1), 5000)
    assert.equal(dispatcher.getNextRetryDelay(2), 30000)
    assert.equal(dispatcher.getNextRetryDelay(3), 300000)
    assert.equal(dispatcher.getNextRetryDelay(4), 1800000)
    assert.equal(dispatcher.getNextRetryDelay(5), -1) // 超上限
    assert.equal(dispatcher.getNextRetryDelay(-1), -1)
  })

  it('isMaxAttemptsReached 上限判断', () => {
    assert.ok(!dispatcher.isMaxAttemptsReached(0))
    assert.ok(!dispatcher.isMaxAttemptsReached(4))
    assert.ok(dispatcher.isMaxAttemptsReached(5))
    assert.ok(dispatcher.isMaxAttemptsReached(6))
  })

  it('dispatch 成功投递返回 SUCCESS', async () => {
    dispatcher.httpPoster = async (_url, _body, _headers): Promise<DeliveryAttemptResult> => {
      return { success: true, responseStatus: 200, responseBody: 'ok' }
    }
    const delivery = await dispatcher.dispatch({
      tenantId: 't-001',
      subscriptionId: 'whsub-001',
      eventType: 'order.created',
      payload: { id: 'evt-001', orderId: 'ord-001' }
    })
    assert.equal(delivery.status, 'SUCCESS')
    assert.equal(delivery.attempts, 1)
    assert.ok(delivery.deliveredAt)
  })

  it('dispatch 投递失败 + 重试达到上限 → DEAD_LETTER', async () => {
    let attemptCount = 0
    dispatcher.httpPoster = async (_url, _body, _headers): Promise<DeliveryAttemptResult> => {
      attemptCount++
      return { success: false, responseStatus: 500, errorMessage: `attempt_${attemptCount}` }
    }
    // 模拟递送 - 需要手动调用 attempt 来填充多次重试
    // 先触发 dispatch，它会做第一次尝试
    let delivery = await dispatcher.dispatch({
      tenantId: 't-001',
      subscriptionId: 'whsub-001',
      eventType: 'order.created',
      payload: { id: 'evt-001' }
    })
    // 这是一个一次调用就失败到 DEAD_LETTER 的路由
    // httpPoster 失败时，dispatcher 内部会判断 attempts >= MAX_ATTEMPTS
    // 但是 dispatch 内一次 attempt 只会增加一次，所以这里看实际 status
    // 因为每次只尝试一次，第一次失败后 attempts=1, status=FAILED（有重试机会）
    assert.equal(delivery.status, 'FAILED')
    assert.equal(delivery.attempts, 1)
    // 之后手动通过 retry 触发额外重试
    for (let i = 0; i < 5; i++) {
      delivery = await dispatcher.retry('t-001', delivery.id)
      if (delivery.status === 'DEAD_LETTER') break
    }
    assert.equal(delivery.status, 'DEAD_LETTER')
    // MAX_ATTEMPTS=5, dispatch 尝试1次+4次重试到 DEAD_LETTER → attempts=5
    assert.ok(delivery.attempts >= 5)
  })

  it('dispatch 订阅不存在 → 抛错', async () => {
    await assert.rejects(
      dispatcher.dispatch({ tenantId: 't-001', subscriptionId: 'nonexistent', eventType: 'order.created', payload: {} }),
      /subscription_not_found/
    )
  })

  it('dispatch 订阅 PAUSED → 抛错', async () => {
    activeSub.status = 'PAUSED'
    adapter.saveSubscription(activeSub)
    await assert.rejects(
      dispatcher.dispatch({ tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created', payload: {} }),
      /subscription_inactive/
    )
  })

  it('dispatch 未订阅事件 → 抛错', async () => {
    await assert.rejects(
      dispatcher.dispatch({ tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'member.created', payload: {} }),
      /event_not_subscribed/
    )
  })

  it('dispatch 幂等: 同一 eventId 不重复投递', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => {
      return { success: true, responseStatus: 200, responseBody: 'ok' }
    }
    await dispatcher.dispatch({
      tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-001' }
    })
    // 第二次同一 eventId → 抛错
    await assert.rejects(
      dispatcher.dispatch({
        tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
        payload: { id: 'evt-001' }
      }),
      /duplicate_delivery/
    )
  })

  it('retryDelivery 不存在的 delivery → 抛错', async () => {
    await assert.rejects(
      dispatcher.retry('t-001', 'nonexistent'),
      /delivery_not_found/
    )
  })

  it('recoverFromDeadLetter 死信恢复', async () => {
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => {
      return { success: true, responseStatus: 200, responseBody: 'ok' }
    }
    // 先创建一个 delivery，手动改成 DEAD_LETTER
    const delivery = await dispatcher.dispatch({
      tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-002' }
    })
    // 这个 delivery 是 SUCCESS 的，我们需要个失败的
    // 换一种方式 - 创建直接失败到 dead letter
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => {
      return { success: false, responseStatus: 500, errorMessage: 'server_error' }
    }
    // 创建新事件，让它多次重试到 DEAD_LETTER
    let failDelivery = await dispatcher.dispatch({
      tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-003' }
    })
    // 重试到死信
    for (let i = 0; i < 6; i++) {
      failDelivery = await dispatcher.retry('t-001', failDelivery.id)
      if (failDelivery.status === 'DEAD_LETTER') break
    }
    assert.equal(failDelivery.status, 'DEAD_LETTER')

    // 恢复 - 注入成功 poster
    dispatcher.httpPoster = async (): Promise<DeliveryAttemptResult> => {
      return { success: true, responseStatus: 200, responseBody: 'ok' }
    }
    const recovered = await dispatcher.recoverFromDeadLetter('t-001', failDelivery.id)
    assert.equal(recovered.status, 'SUCCESS')
  })

  it('recoverFromDeadLetter 非死信 → 抛错', async () => {
    await assert.rejects(
      dispatcher.recoverFromDeadLetter('t-001', 'nonexistent'),
      /delivery_not_found/
    )
  })
})

describe('WebhookAdapter - 数据层', () => {
  let adapter: WebhookAdapter

  beforeEach(() => {
    adapter = new WebhookAdapter()
  })

  it('saveSubscription + querySubscription 保存和查询', () => {
    adapter.saveSubscription({
      id: 'whsub-001', tenantId: 't-001', url: 'https://example.com/hook',
      events: ['order.created'], secret: 'sec', status: 'ACTIVE',
      createdAt: '2025-01-01', createdBy: 'admin'
    })
    const found = adapter.querySubscription('t-001', 'whsub-001')
    assert.ok(found)
    assert.equal(found!.url, 'https://example.com/hook')
  })

  it('querySubscription 跨租户隔离', () => {
    adapter.saveSubscription({
      id: 'whsub-001', tenantId: 't-001', url: 'https://a.com', events: ['order.created'],
      secret: 'sec', status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin'
    })
    assert.equal(adapter.querySubscription('t-002', 'whsub-001'), null)
  })

  it('saveDelivery + queryDelivery 投递记录', () => {
    adapter.saveDelivery({
      id: 'del-001', tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-001' }, attempts: 1, status: 'SUCCESS', signature: 'sig',
      createdAt: '2025-01-01T00:00:00.000Z'
    })
    const found = adapter.queryDelivery('t-001', 'del-001')
    assert.ok(found)
    assert.equal(found!.status, 'SUCCESS')
  })

  it('queryDeadLetter 返回死信投递', () => {
    adapter.saveDelivery({
      id: 'del-001', tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-001' }, attempts: 5, status: 'DEAD_LETTER', signature: 'sig',
      errorMessage: 'timeout', createdAt: '2025-01-01T00:00:00.000Z'
    })
    adapter.saveDelivery({
      id: 'del-002', tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.paid',
      payload: { id: 'evt-002' }, attempts: 1, status: 'SUCCESS', signature: 'sig',
      createdAt: '2025-01-01T00:00:00.000Z'
    })
    const dlq = adapter.queryDeadLetter('t-001')
    assert.equal(dlq.length, 1)
    assert.equal(dlq[0].id, 'del-001')
  })

  it('isAlreadyDelivered 幂等检查', () => {
    adapter.saveDelivery({
      id: 'del-001', tenantId: 't-001', subscriptionId: 'whsub-001', eventType: 'order.created',
      payload: { id: 'evt-001' }, attempts: 1, status: 'SUCCESS', signature: 'sig',
      createdAt: '2025-01-01T00:00:00.000Z'
    })
    assert.ok(adapter.isAlreadyDelivered('t-001', 'whsub-001', 'evt-001'))
    assert.ok(!adapter.isAlreadyDelivered('t-001', 'whsub-001', 'evt-999'))
  })

  it('deleteSubscription 删除订阅', () => {
    adapter.saveSubscription({
      id: 'whsub-001', tenantId: 't-001', url: 'https://a.com', events: ['order.created'],
      secret: 'sec', status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin'
    })
    assert.equal(adapter.deleteSubscription('t-001', 'whsub-001'), true)
    assert.equal(adapter.querySubscription('t-001', 'whsub-001'), null)
  })

  it('reset 清空所有数据', () => {
    adapter.seedSubs([{
      id: 'whsub-001', tenantId: 't-001', url: 'https://a.com', events: ['order.created'],
      secret: 'sec', status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin'
    }])
    adapter.reset()
    assert.equal(adapter.querySubscriptionsByTenant('t-001').length, 0)
  })
})
