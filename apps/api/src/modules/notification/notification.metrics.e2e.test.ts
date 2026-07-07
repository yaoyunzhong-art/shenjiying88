import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Notification + Cache + EventBus + Metrics 跨服务 observability (Phase-14 task 5)
 *
 * 验证 NotificationService.send/enqueue 时:
 *   - 增 notification_dispatches_total counter (按 channel + status)
 *   - 增 notification_enqueued_total counter (按 channel)
 *   - 记录 notification_dispatch_duration_ms histogram
 *   - 无 metrics 注入时不抛错
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test, type TestingModule } from '@nestjs/testing'
import { CacheModule } from '../../infrastructure/cache/cache.module'
import { EventBusModule } from '../../infrastructure/event-bus/event-bus.module'
import {
  NotificationService,
  resetNotificationServiceTestState
} from './notification.service'
import {
  FoundationScopeType,
  NotificationChannelType
} from './notification.entity'
import { MetricsService } from '../observability/metrics.service'

async function buildApp(): Promise<{
  moduleRef: TestingModule
  notification: NotificationService
  metrics: MetricsService
}> {
  resetNotificationServiceTestState()

  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory(), EventBusModule.forRootInMemory()],
    providers: [MetricsService, NotificationService]
  }).compile()

  const notification = moduleRef.get(NotificationService)
  const metrics = moduleRef.get(MetricsService)
  notification.onModuleInit()

  return { moduleRef, notification, metrics }
}

beforeEach(() => {
  resetNotificationServiceTestState()
})

it('e2e: send() 增加 notification_dispatches_total counter', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.send({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'metric@test.com',
      payload: {}
    })

    const text = metrics.render()
    assert.ok(text.includes('notification_dispatches_total'), `输出应包含 counter,实际:\n${text}`)
    assert.ok(text.includes('channel="EMAIL"'))
    assert.ok(text.includes('status="SENT"'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: send() 失败时 counter status=FAILED', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.send({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-bounce@test.com',
      payload: {}
    })

    const text = metrics.render()
    assert.ok(text.includes('status="FAILED"'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: enqueue() 增加 notification_enqueued_total', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.enqueue({
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Brand,
      recipient: '+8613800009999',
      payload: { code: '999' }
    })

    const text = metrics.render()
    assert.ok(text.includes('notification_enqueued_total'))
    assert.ok(text.includes('channel="SMS"'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: enqueue → handler → dispatch 完成增加 dispatches_total', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.enqueue({
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Brand,
      recipient: '+8613800008888',
      payload: {}
    })

    const text = metrics.render()
    assert.ok(text.includes('notification_enqueued_total'))
    assert.ok(text.includes('notification_dispatches_total'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: histogram 记录 dispatch duration', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.send({
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'device-metric-001',
      payload: {}
    })

    const text = metrics.render()
    assert.ok(text.includes('notification_dispatch_duration_ms'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: 多 channel 各自计数', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'a@b.com', payload: {} })
    notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'c@d.com', payload: {} })
    notification.send({ channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Tenant, recipient: '+86138', payload: {} })

    const text = metrics.render()
    assert.ok(text.includes('channel="EMAIL"'))
    assert.ok(text.includes('channel="SMS"'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: 批量 dispatch histogram count 累加', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    for (let i = 0; i < 5; i++) {
      notification.send({
        channel: NotificationChannelType.Push,
        scopeType: FoundationScopeType.Tenant,
        recipient: `device-batch-${i}`,
        payload: {}
      })
    }

    const text = metrics.render()
    assert.ok(text.includes('notification_dispatch_duration_ms_count'))
  } finally {
    await moduleRef.close()
  }
})

it('e2e: 无 metrics 注入时 send 不抛错', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory(), EventBusModule.forRootInMemory()],
    providers: [NotificationService]
  }).compile()

  try {
    const notification = moduleRef.get(NotificationService)
    notification.onModuleInit()
    const dispatch = notification.send({
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      recipient: '+86138',
      payload: {}
    })
    assert.ok(dispatch.id)
  } finally {
    await moduleRef.close()
  }
})

it('e2e: 10 次 enqueue 后 enqueued_total + dispatches_total 都记录', async () => {
  const { moduleRef, notification, metrics } = await buildApp()
  try {
    for (let i = 0; i < 10; i++) {
      notification.enqueue({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        recipient: `enqueue-metric-${i}`,
        payload: {}
      })
    }

    const text = metrics.render()
    assert.ok(text.includes('notification_enqueued_total'))
    assert.ok(text.includes('notification_dispatches_total'))
  } finally {
    await moduleRef.close()
  }
})
