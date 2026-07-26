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
  NotificationChannelType,
  NotificationStatus
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
    providers: [
      {
        provide: MetricsService,
        useFactory: () => new MetricsService(false),
      },
      NotificationService,
    ],
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

// ── 增强测试: CRUD / 边界 / 并发 / 回滚 ──

describe('Notification Metrics E2E - Enhanced', () => {
  it('e2e: send() 后 getDispatch 返回完整 dispatch 记录', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const d = notification.send({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        recipient: 'get-dispatch@test.com',
        payload: { orderId: 'ORD-001' }
      })
      const fetched = notification.getDispatch(d.id)
      assert.ok(fetched, 'getDispatch 应返回记录')
      assert.equal(fetched.id, d.id)
      assert.equal(fetched.recipient, 'get-dispatch@test.com')
      assert.equal(fetched.channel, NotificationChannelType.Email)
      assert.deepEqual(fetched.payload, { orderId: 'ORD-001' })
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: getDispatch 对不存在 id 返回 undefined', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const result = notification.getDispatch('non-existent-id-xxx')
      assert.equal(result, undefined)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: createTemplate 后 getTemplate 返回正确模板', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const tpl = notification.registerTemplate({
        code: 'welcome_email',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-001',
        locale: 'zh-CN',
        titleTemplate: '欢迎 {{name}}',
        bodyTemplate: '您好 {{name}}, 欢迎注册!',
        variables: ['name']
      })
      const fetched = notification.getTemplate(tpl.id)
      assert.ok(fetched)
      assert.equal(fetched.code, 'welcome_email')
      assert.equal(fetched.titleTemplate, '欢迎 {{name}}')
      assert.equal(fetched.bodyTemplate, '您好 {{name}}, 欢迎注册!')
      assert.ok(fetched.enabled)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: findTemplateByCode 按 code 查找已启用的模板', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.registerTemplate({
        code: 'order_confirmed',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        locale: 'en',
        bodyTemplate: 'Order {{orderId}} confirmed'
      })
      const found = notification.findTemplateByCode('order_confirmed')
      assert.ok(found)
      assert.equal(found.code, 'order_confirmed')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: findTemplateByCode 对未启用模板返回 undefined', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.registerTemplate({
        code: 'disabled_tpl',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        locale: 'en',
        bodyTemplate: 'disabled',
        enabled: false
      })
      const found = notification.findTemplateByCode('disabled_tpl')
      assert.equal(found, undefined)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: updateTemplate 修改生效且 updatedAt 变更', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const tpl = notification.registerTemplate({
        code: 'updatable',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        locale: 'en',
        bodyTemplate: 'original body'
      })
      const originalUpdatedAt = tpl.updatedAt

      // 等待少许确保 updatedAt 变化
      await new Promise(r => setTimeout(r, 5))

      const updated = notification.updateTemplate(tpl.id, {
        bodyTemplate: 'updated body',
        enabled: false
      })
      assert.ok(updated)
      assert.equal(updated.bodyTemplate, 'updated body')
      assert.equal(updated.enabled, false)
      assert.notEqual(updated.updatedAt, originalUpdatedAt)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: updateTemplate 对不存在 id 返回 undefined', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const result = notification.updateTemplate('non-existent', { bodyTemplate: 'x' })
      assert.equal(result, undefined)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: listTemplates 支持按 channel 筛选', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.registerTemplate({ code: 'email1', channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, locale: 'en', bodyTemplate: 'a' })
      notification.registerTemplate({ code: 'email2', channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, locale: 'en', bodyTemplate: 'b' })
      notification.registerTemplate({ code: 'sms1', channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Tenant, locale: 'en', bodyTemplate: 'c' })

      const emailTpls = notification.listTemplates({ channel: NotificationChannelType.Email })
      const smsTpls = notification.listTemplates({ channel: NotificationChannelType.Sms })

      assert.equal(emailTpls.length, 2)
      assert.equal(smsTpls.length, 1)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: listTemplates 支持按 tenantId + enabled 组合筛选', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.registerTemplate({ code: 't1', channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, tenantId: 'tenant-a', locale: 'en', bodyTemplate: 'a', enabled: true })
      notification.registerTemplate({ code: 't2', channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, tenantId: 'tenant-a', locale: 'en', bodyTemplate: 'b', enabled: false })
      notification.registerTemplate({ code: 't3', channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, tenantId: 'tenant-b', locale: 'en', bodyTemplate: 'c', enabled: true })

      const tenantA = notification.listTemplates({ tenantId: 'tenant-a', enabled: true })
      assert.equal(tenantA.length, 1)
      assert.equal(tenantA[0].code, 't1')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 后 listDispatches 能按 status 筛选', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'status-a@test.com', payload: {} })
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fail-bounce-status@test.com', payload: {} })

      const sent = notification.listDispatches({ status: NotificationStatus.Sent })
      const failed = notification.listDispatches({ status: NotificationStatus.Failed })

      assert.ok(sent.length >= 1)
      assert.ok(failed.length >= 1)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: listDispatches 支持按 recipient 精确筛选', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'unique-recip@test.com', payload: {} })
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'other-recip@test.com', payload: {} })

      const results = notification.listDispatches({ recipient: 'unique-recip@test.com' })
      assert.equal(results.length, 1)
      assert.equal(results[0].recipient, 'unique-recip@test.com')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 后 status 为 SENT', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'check-status@test.com', payload: {} })
      assert.equal(d.status, 'SENT')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: retryDispatch 对已失败的 dispatch 重试后 retryCount 增加', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      // 使用 fail 前缀触发失败
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fail-bounce-retry@test.com', payload: {} })
      assert.equal(d.status, 'FAILED')
      assert.equal(d.retryCount, 0)

      // retry 后 simulateSend 再次执行, 因 recipient 仍含 fail 所以 status 可能仍是 FAILED
      // 但 retryCount 应增加
      const retried = notification.retryDispatch(d.id)
      assert.ok(retried)
      assert.equal(retried.retryCount, 1)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: retryDispatch 对已发送的 dispatch 不重复发送', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      // 用一个正常发送的 dispatch
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'normal-no-retry@test.com', payload: {} })
      assert.equal(d.status, 'SENT')

      const result = notification.retryDispatch(d.id)
      assert.ok(result)
      assert.equal(result.status, 'SENT')
      assert.equal(result.retryCount, 0) // 不增加
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: retryDispatch 对不存在 id 返回 undefined', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const result = notification.retryDispatch('no-such-dispatch-xxx')
      assert.equal(result, undefined)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: cancelDispatch 对 FAILED dispatch 标为 CANCELLED', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      // 先发送一个失败 dispatch (recipient 包含 fail)
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fail-bounce-cancel@test.com', payload: {} })
      assert.equal(d.status, 'FAILED')

      const cancelled = notification.cancelDispatch(d.id)
      assert.ok(cancelled)
      assert.equal(cancelled.status, 'CANCELLED')
      // updatedAt 在 +1ms 内可能相同,但如果足够快 cancel 返回的对象可能不同实例但时间戳接近
      // 仅验证 status 被更新为 CANCELLED
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: cancelDispatch 对已发送的 dispatch 无影响', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      // 正常发送已 SENT, cancelDispatch 应当跳过
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'sent-no-cancel@test.com', payload: {} })

      const result = notification.cancelDispatch(d.id)
      assert.ok(result)
      assert.equal(result.status, 'SENT') // 保持 SENT
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: cancelDispatch 对不存在 id 返回 undefined', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const result = notification.cancelDispatch('non-existent-cancel')
      assert.equal(result, undefined)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 支持 templateCode 解析 template', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.registerTemplate({
        code: 'with_tpl',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-001',
        locale: 'en',
        bodyTemplate: 'Your order {{orderId}}'
      })

      const d = notification.send({
        templateCode: 'with_tpl',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-001',
        recipient: 'tpl-user@test.com',
        payload: { orderId: 'ORD-999' }
      })

      assert.ok(d.id)
      assert.ok(d.templateId)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send Push 通道并验证 tenantId 出现在 metrics 标签', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      notification.send({
        channel: NotificationChannelType.Push,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-push-xyz',
        recipient: 'push-device-999',
        payload: {}
      })

      const text = metrics.render()
      assert.ok(text.includes('tenantId="tenant-push-xyz"'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: enqueue 支持多个 channel: InApp / Webhook / Social', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      notification.enqueue({ channel: NotificationChannelType.InApp, scopeType: FoundationScopeType.Tenant, recipient: 'inapp@test.com', payload: {} })
      notification.enqueue({ channel: NotificationChannelType.Webhook, scopeType: FoundationScopeType.Brand, recipient: 'https://hook.test/callback', payload: { event: 'test' } })
      notification.enqueue({ channel: NotificationChannelType.Social, scopeType: FoundationScopeType.Store, recipient: 'social-user', payload: {} })

      const text = metrics.render()
      assert.ok(text.includes('channel="IN_APP"'))
      assert.ok(text.includes('channel="WEBHOOK"'))
      assert.ok(text.includes('channel="SOCIAL"'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send 支持多种 scopeType: Brand / Store', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Brand, brandId: 'brand-001', recipient: 'brand@test.com', payload: {} })
      notification.send({ channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Store, storeId: 'store-001', recipient: '+8613800000001', payload: {} })

      const text = metrics.render()
      assert.ok(text.includes('notification_dispatches_total'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: enqueue 使用 scheduledAt 字段不产生异常', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      const d = notification.enqueue({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        recipient: 'scheduled@test.com',
        payload: {},
        scheduledAt: new Date(Date.now() + 86400000).toISOString()
      })

      assert.ok(d.id)
      assert.equal(d.status, 'PENDING')
      assert.ok(d.scheduledAt! > new Date().toISOString())

      const text = metrics.render()
      assert.ok(text.includes('notification_enqueued_total'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: 并发 send 5 条不同 channel 不抛错', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      const results = await Promise.all([
        Promise.resolve().then(() => notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'c1@test.com', payload: {} })),
        Promise.resolve().then(() => notification.send({ channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Tenant, recipient: 'c2@test.com', payload: {} })),
        Promise.resolve().then(() => notification.send({ channel: NotificationChannelType.Push, scopeType: FoundationScopeType.Tenant, recipient: 'c3@test.com', payload: {} })),
        Promise.resolve().then(() => notification.send({ channel: NotificationChannelType.InApp, scopeType: FoundationScopeType.Tenant, recipient: 'c4@test.com', payload: {} })),
        Promise.resolve().then(() => notification.enqueue({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'c5@test.com', payload: {} })),
      ])

      assert.equal(results.length, 5)
      results.forEach(d => assert.ok(d.id))

      const text = metrics.render()
      assert.ok(text.includes('notification_dispatches_total'))
      assert.ok(text.includes('notification_enqueued_total'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 支持复杂 payload (嵌套对象)', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const payload = {
        user: { name: '张三', email: 'zhangsan@test.com' },
        order: { id: 'ORD-888', items: [{ sku: 'A-1', qty: 2 }, { sku: 'B-2', qty: 1 }] },
        meta: { source: 'web', timestamp: Date.now() }
      }
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'complex@test.com', payload })

      const fetched = notification.getDispatch(d.id)
      assert.ok(fetched)
      assert.deepEqual(fetched.payload, payload)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 使用 brandId + storeId 不抛错', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const d = notification.send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Store,
        tenantId: 'tenant-store',
        brandId: 'brand-store',
        storeId: 'store-999',
        recipient: '+8613800000999',
        payload: { storeAlert: true }
      })
      assert.ok(d.id)
      assert.equal(d.recipient, '+8613800000999')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() + enqueue() 互不干扰各自 dispatch store', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const sendD = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'mix-a@test.com', payload: {} })
      const enqD = notification.enqueue({ channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Tenant, recipient: 'mix-b@test.com', payload: {} })

      assert.ok(sendD.id)
      assert.ok(enqD.id)
      assert.notEqual(sendD.id, enqD.id)

      const all = notification.listDispatches({})
      assert.ok(all.some(d => d.recipient === 'mix-a@test.com'))
      assert.ok(all.some(d => d.recipient === 'mix-b@test.com'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: enqueue 不带 EventBus module 时 fallback 到同步 send', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.forRootInMemory()],
      providers: [NotificationService]
    }).compile()
    try {
      const notification = moduleRef.get(NotificationService)
      notification.onModuleInit()

      const d = notification.enqueue({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fallback-enq@test.com', payload: {} })
      assert.ok(d.id)
      // fallback send 后 status 不是 PENDING
      assert.notEqual(d.status, 'PENDING')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: createTemplate 支持全字段赋值', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const tpl = notification.registerTemplate({
        code: 'full_fields',
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Brand,
        tenantId: 'tenant-a',
        brandId: 'brand-a',
        marketCode: 'CN',
        locale: 'zh-CN',
        titleTemplate: '验证码 {{code}}',
        bodyTemplate: '您的验证码是 {{code}}, 5分钟内有效',
        variables: ['code'],
        enabled: true
      })
      assert.equal(tpl.code, 'full_fields')
      assert.equal(tpl.channel, NotificationChannelType.Sms)
      assert.equal(tpl.scopeType, FoundationScopeType.Brand)
      assert.equal(tpl.tenantId, 'tenant-a')
      assert.equal(tpl.brandId, 'brand-a')
      assert.equal(tpl.marketCode, 'CN')
      assert.equal(tpl.locale, 'zh-CN')
      assert.equal(tpl.titleTemplate, '验证码 {{code}}')
      assert.deepEqual(tpl.variables, ['code'])
      assert.ok(tpl.enabled)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: send() 使用 fail-bounce 前缀触发失败后 metrics 记录 FAILED', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fail-bounce-xyz@test.com', payload: {} })
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'fail-bounce-abc@test.com', payload: {} })

      const text = metrics.render()
      // FAILED 应出现至少 2 次
      const matches = text.match(/status="FAILED"/g)
      assert.ok(matches, '应出现 FAILED 标签')
      assert.ok(matches.length >= 2, `FAILED 至少出现 2 次,实际 ${matches.length}`)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: validate dispatch 字段完整性 (id, createdAt, updatedAt)', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      const d = notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'validate-fields@test.com', payload: {} })

      assert.ok(d.id, 'id 不应为空')
      assert.ok(d.createdAt, 'createdAt 不应为空')
      assert.ok(d.updatedAt, 'updatedAt 不应为空')
      assert.equal(d.retryCount, 0)
      assert.ok(d.channel)
      assert.ok(d.scopeType)
      assert.ok(d.status)
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: sendRenewalSuccessNotification 发送后 metrics 有记录', async () => {
    const { moduleRef, notification, metrics } = await buildApp()
    try {
      notification.sendRenewalSuccessNotification({
        tenantId: 'tenant-renew',
        licenseId: 'LIC-001',
        packageName: 'Enterprise',
        newExpireAt: new Date('2027-12-31')
      })

      const text = metrics.render()
      assert.ok(text.includes('notification_dispatches_total'))
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: sendRenewalFailureNotification 发送后 dispatch 有记录', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.sendRenewalFailureNotification({
        tenantId: 'tenant-renew-fail',
        licenseId: 'LIC-002',
        packageName: 'Pro',
        errorMessage: 'Payment declined'
      })

      const all = notification.listDispatches({ recipient: 'tenant-renew-fail-admin' })
      assert.ok(all.length >= 1)
      const d = all[0]
      assert.equal(d.payload.type, 'renewal_failure')
      assert.equal(d.payload.licenseId, 'LIC-002')
    } finally {
      await moduleRef.close()
    }
  })

  it('e2e: listDispatches 无筛选返回所有记录', async () => {
    const { moduleRef, notification } = await buildApp()
    try {
      notification.send({ channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant, recipient: 'ls-all-1@test.com', payload: {} })
      notification.send({ channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Brand, recipient: 'ls-all-2@test.com', payload: {} })
      notification.enqueue({ channel: NotificationChannelType.Push, scopeType: FoundationScopeType.Store, recipient: 'ls-all-3@test.com', payload: {} })

      const all = notification.listDispatches({})
      assert.ok(all.length >= 3)
    } finally {
      await moduleRef.close()
    }
  })
})
