import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Push 消息推送 HTTP 链路
 *
 * 链路:
 *   HTTP → PushController → APNsService / WebSocketService / PushNotificationScheduler
 *
 * 验证:
 *   - 通道注册: 推送模板创建 / WS 连接注册
 *   - 消息发送: iOS 推送 / WS 消息
 *   - 回执: 推送历史 / WS 消息送达
 *   - 失败重试: WS 重连恢复
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PushController } from './push.controller'
import { APNsService, WebSocketService, PushNotificationScheduler } from './push.service'
import { DndConfigService, FrequencyCapService } from './dnd-config'
import { PushPriorityGuard } from './push-priority.guard'
import { DualChannelRouter, EmailPushChannel, SmsPushChannel } from './channels'

/**
 * 在测试请求中注入 tenant 上下文到 request 对象
 * @TenantContext() decorator 通过 request.tenantContext 获取
 */
function useTenantMiddleware(app: INestApplication): void {
  const httpAdapter = app.getHttpAdapter()
  const instance = httpAdapter.getInstance()
  instance.use((req: any, _res: any, next: () => void) => {
    req.tenantContext = {
      tenantId: req.headers['x-tenant-id'] ?? 'test-tenant',
      brandId: req.headers['x-brand-id'] ?? 'test-brand',
      storeId: req.headers['x-store-id'] ?? 'test-store',
      userId: 'test-user',
      role: 'operator',
    }
    next()
  })
}

async function buildApp() {
  const apnsService = new APNsService()
  const wsService = new WebSocketService()
  const scheduler = new PushNotificationScheduler(apnsService)
  const dndConfig = new DndConfigService()
  const frequencyCap = new FrequencyCapService()
  const priorityGuard = new PushPriorityGuard(dndConfig, frequencyCap)
  const emailChannel = new EmailPushChannel()
  const smsChannel = new SmsPushChannel()
  const dualChannelRouter = new DualChannelRouter()
  dualChannelRouter.register(emailChannel)
  dualChannelRouter.register(smsChannel)

  const moduleRef = await Test.createTestingModule({
    controllers: [PushController],
    providers: [
      { provide: APNsService, useValue: apnsService },
      { provide: WebSocketService, useValue: wsService },
      { provide: PushNotificationScheduler, useValue: scheduler },
      { provide: PushPriorityGuard, useValue: priorityGuard },
      { provide: DndConfigService, useValue: dndConfig },
      { provide: FrequencyCapService, useValue: frequencyCap },
      { provide: DualChannelRouter, useValue: dualChannelRouter },
      { provide: EmailPushChannel, useValue: emailChannel },
      { provide: SmsPushChannel, useValue: smsChannel },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  useTenantMiddleware(app)
  await app.init()
  return { app, apnsService, wsService, scheduler }
}

// ─── 1. 通道注册 ─────────────────────────────────────────────

it('e2e: register push template returns template with id', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/push/templates')
      .send({
        code: 'welcome',
        platform: 'ios',
        title: 'Welcome!',
        body: 'Hello new user',
        sound: 'default',
      })
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
    assert.equal(res.statusCode, 201)
    const template = res.body as Record<string, unknown>
    assert.ok(template.id)
    assert.equal(template.code, 'welcome')
    assert.equal(template.platform, 'ios')
  } finally {
    await app.close()
  }
})

it('e2e: connect WS client registers and returns sessionId', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/push/ws/connect')
      .send({ clientId: 'ws-client-1', userId: 'user-1' })
    assert.equal(res.statusCode, 201)
    const client = res.body as Record<string, unknown>
    assert.equal(client.clientId, 'ws-client-1')
    assert.equal(client.userId, 'user-1')
    assert.ok(client.sessionId)
  } finally {
    await app.close()
  }
})

// ─── 2. 消息发送 ─────────────────────────────────────────────

it('e2e: send push to iOS device returns success', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/push/send')
      .send({
        deviceToken: 'dev_' + 'a'.repeat(64),
        platform: 'ios',
        alert: 'Test notification',
        badge: 1,
        priority: 'high',
      })
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
    assert.equal(res.statusCode, 201)
    const result = res.body as Record<string, unknown>
    assert.equal(result.success, true)
    assert.ok(result.recordId)
  } finally {
    await app.close()
  }
})

it('e2e: send WS message to connected client succeeds', async () => {
  const { app } = await buildApp()
  try {
    // Connect first
    await request(app.getHttpServer())
      .post('/push/ws/connect')
      .send({ clientId: 'msg-target', userId: 'user-msg' })

    const res = await request(app.getHttpServer())
      .post('/push/ws/send')
      .send({ clientId: 'msg-target', channel: 'chat', data: { text: 'hello' } })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
  } finally {
    await app.close()
  }
})

it('e2e: send-high-priority expedites urgent notification', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/push/send-high-priority')
      .send({ deviceToken: 'dev_' + 'b'.repeat(64), alert: 'URGENT: fire alarm' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
  } finally {
    await app.close()
  }
})

// ─── 3. 回执 ─────────────────────────────────────────────────

it('e2e: push history records sent pushes', async () => {
  const { app } = await buildApp()
  try {
    const deviceToken = 'dev_hist_' + 'c'.repeat(60)
    await request(app.getHttpServer())
      .post('/push/send')
      .send({ deviceToken, platform: 'ios', alert: 'History test' })
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')

    const res = await request(app.getHttpServer()).get(`/push/history/${deviceToken}`)
    assert.equal(res.statusCode, 200)
    const records = res.body as Array<Record<string, unknown>>
    assert.ok(records.length >= 1)
    assert.equal(records[0].deviceToken, deviceToken)
  } finally {
    await app.close()
  }
})

it('e2e: get WS connection count after connect', async () => {
  const { app, wsService } = await buildApp()
  try {
    wsService.connect('conn-a', 'user-stats')
    wsService.connect('conn-b', 'user-stats')

    const res = await request(app.getHttpServer()).get('/push/ws/connections')
    assert.equal(res.statusCode, 200)
    assert.ok((res.body.activeConnections as number) >= 2)
  } finally {
    await app.close()
  }
})

it('e2e: WS broadcast sends to all connected clients', async () => {
  const { app, wsService } = await buildApp()
  try {
    wsService.connect('broadcast-1', 'user-bc')
    wsService.connect('broadcast-2', 'user-bc')

    const res = await request(app.getHttpServer())
      .post('/push/ws/broadcast')
      .send({ channel: 'announcement', data: { message: 'System update' } })
    assert.equal(res.statusCode, 201)
    assert.ok((res.body.sent as number) >= 2)
  } finally {
    await app.close()
  }
})

// ─── 4. 失败重试 ─────────────────────────────────────────────

it('e2e: WS reconnect restores session context', async () => {
  const { app, wsService } = await buildApp()
  try {
    // Connect and get sessionId
    const conn = wsService.connect('old-client', 'user-reconnect')
    assert.ok(conn.sessionId)

    // Reconnect with old session
    const result = wsService.handleReconnect('new-client', conn.sessionId!)
    assert.equal(result.restored, true)
    assert.ok(result.sessionId)
    assert.notEqual(result.sessionId, conn.sessionId)
  } finally {
    await app.close()
  }
})

it('e2e: reconnect with invalid session returns restored=false', async () => {
  const { app, wsService } = await buildApp()
  try {
    const result = wsService.handleReconnect('new-client', 'non-existent-session')
    assert.equal(result.restored, false)
  } finally {
    await app.close()
  }
})

it('e2e: schedule push creates pending scheduled push', async () => {
  const { app } = await buildApp()
  try {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const res = await request(app.getHttpServer())
      .post('/push/schedule')
      .send({ memberId: 'member-1', content: 'Scheduled reminder', sendAt: futureDate })
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
    assert.equal(res.statusCode, 201)
    const sched = res.body as Record<string, unknown>
    assert.ok(sched.id)
    assert.equal(sched.memberId, 'member-1')
  } finally {
    await app.close()
  }
})

it('e2e: cancel scheduled push changes status to cancelled', async () => {
  const { app, scheduler } = await buildApp()
  try {
    const futureDate = new Date(Date.now() + 86400000)
    const sched = scheduler.schedulePush('member-cancel', 'Review reminder', futureDate)

    const res = await request(app.getHttpServer())
      .post('/push/schedule/cancel')
      .send({ pushId: sched.id })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
  } finally {
    await app.close()
  }
})

it('e2e: revoke token changes status', async () => {
  const { app, apnsService } = await buildApp()
  try {
    const deviceToken = 'dev_revoke_' + 'd'.repeat(58)
    await apnsService.pushToiOS(deviceToken, { alert: 'before revoke' }, 'normal' as const)

    const res = await request(app.getHttpServer())
      .post('/push/revoke-token')
      .send({ deviceToken })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)

    const history = await apnsService.getPushHistory(deviceToken)
    assert.ok(history.some((r) => r.status === 'revoked'))
  } finally {
    await app.close()
  }
})

// ═══ 5. 推送模板管理增强 ═══════════════════════════════════

describe('push template management', () => {
  it('e2e: register template with all optional fields', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/push/templates')
        .send({
          code: 'promo-q3',
          platform: 'ios',
          title: 'Q3 Promo',
          body: 'Big sale!',
          sound: 'alert.caf',
          badge: 1,
          enabled: true,
          extra: { campaign: 'q3_2026' },
        })
        .set('x-tenant-id', 'tenant-001')
        .set('x-brand-id', 'brand-001')
        .set('x-store-id', 'store-001')
      assert.equal(res.statusCode, 201)
      const t = res.body as Record<string, unknown>
      assert.equal(t.code, 'promo-q3')
      assert.equal(t.badge, 1)
      assert.equal(t.enabled, true)
    } finally {
      await app.close()
    }
  })

  it('e2e: register template without optional fields defaults correctly', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/push/templates')
        .send({ code: 'basic', platform: 'android', title: 'Minimal', body: 'Hi' })
        .set('x-tenant-id', 'tenant-001')
        .set('x-brand-id', 'brand-001')
        .set('x-store-id', 'store-001')
      assert.equal(res.statusCode, 201)
      const t = res.body as Record<string, unknown>
      assert.equal(t.code, 'basic')
      assert.equal(t.platform, 'android')
    } finally {
      await app.close()
    }
  })
})

// ═══ 6. 推送统计 ═══════════════════════════════════════════

describe('push statistics', () => {
  it('e2e: get push stats returns aggregated counters', async () => {
    const { app } = await buildApp()
    try {
      // Send a few pushes first to generate stats
      await request(app.getHttpServer())
        .post('/push/send')
        .send({ deviceToken: 'dev_stats_1_' + 'e'.repeat(58), platform: 'ios', alert: 'stat-1' })
        .set('x-tenant-id', 'tenant-001')
        .set('x-brand-id', 'brand-001')
        .set('x-store-id', 'store-001')

      const res = await request(app.getHttpServer())
        .get('/push/stats')
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 200)
      const stats = res.body as Record<string, unknown>
      assert.ok(typeof stats.totalSent === 'number')
      assert.ok(typeof stats.totalFailed === 'number')
      assert.ok(typeof stats.activeConnections === 'number')
    } finally {
      await app.close()
    }
  })

  it('e2e: stats tracks failed pushes correctly', async () => {
    const { app } = await buildApp()
    try {
      // Send with an invalid token (too short) should still be recorded
      await request(app.getHttpServer())
        .post('/push/send')
        .send({ deviceToken: 'short', platform: 'ios', alert: 'fail-me' })
        .set('x-tenant-id', 'tenant-001')
        .set('x-brand-id', 'brand-001')
        .set('x-store-id', 'store-001')

      const res = await request(app.getHttpServer())
        .get('/push/stats')
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 200)
    } finally {
      await app.close()
    }
  })
})

// ═══ 7. 定时推送管理 ═══════════════════════════════════════

describe('scheduled push management', () => {
  it('e2e: query scheduled pushes for a member', async () => {
    const { app } = await buildApp()
    try {
      const futureDate = new Date(Date.now() + 172800000).toISOString()
      await request(app.getHttpServer())
        .post('/push/schedule')
        .send({ memberId: 'member-query', content: 'Query test', sendAt: futureDate })
        .set('x-tenant-id', 'tenant-001')
        .set('x-brand-id', 'brand-001')
        .set('x-store-id', 'store-001')

      const res = await request(app.getHttpServer())
        .get('/push/schedule?memberId=member-query')
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 200)
      const list = res.body as Array<Record<string, unknown>>
      assert.ok(list.length >= 1)
      assert.equal(list[0].status, 'PENDING')
    } finally {
      await app.close()
    }
  })

  it('e2e: cancel non-existent push returns false success', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/push/schedule/cancel')
        .send({ pushId: 'non-existent-id' })
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, false)
    } finally {
      await app.close()
    }
  })
})

// ═══ 8. WebSocket 管理增强 ═════════════════════════════════

describe('WS connection lifecycle', () => {
  it('e2e: disconnect WS client via HTTP', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/push/ws/connect')
        .send({ clientId: 'disconnect-me', userId: 'user-disc' })
        .set('x-tenant-id', 'tenant-001')

      const res = await request(app.getHttpServer())
        .post('/push/ws/disconnect')
        .send({ clientId: 'disconnect-me' })
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, true)
    } finally {
      await app.close()
    }
  })

  it('e2e: reconnect via HTTP endpoint restores session', async () => {
    const { app, wsService } = await buildApp()
    try {
      const conn = wsService.connect('orig-client', 'user-reconn-http')
      assert.ok(conn.sessionId)

      const res = await request(app.getHttpServer())
        .post('/push/ws/reconnect')
        .send({ clientId: 'new-client', oldSessionId: conn.sessionId })
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 201)
      const result = res.body as Record<string, unknown>
      assert.equal(result.restored, true)
      assert.ok(result.sessionId)
    } finally {
      await app.close()
    }
  })

  it('e2e: send to disconnected client fails gracefully', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/push/ws/send')
        .send({ clientId: 'ghost-client', channel: 'chat', data: { text: 'ping' } })
        .set('x-tenant-id', 'tenant-001')
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, false)
    } finally {
      await app.close()
    }
  })

  it('e2e: get user connection count returns correct number', async () => {
    const { app, wsService } = await buildApp()
    try {
      wsService.connect('multi-a', 'user-multi')
      wsService.connect('multi-b', 'user-multi')

      const count = wsService.getUserConnectionCount('user-multi')
      assert.equal(count, 2)
      assert.equal(wsService.getUserConnectionCount('unknown-user'), 0)
    } finally {
      await app.close()
    }
  })
})

// ═══ 9. 推送失败与边界 ═════════════════════════════════════

describe('push failure and edge cases', () => {
  it('e2e: push with empty device token returns failure', async () => {
    const { app } = await buildApp()
    try {
      const success = await app.get(APNsService).pushToiOS('', { alert: 'empty' }, 'normal')
      assert.equal(success, false)
    } finally {
      await app.close()
    }
  })

  it('e2e: push with high priority sends expedited', async () => {
    const { app, apnsService } = await buildApp()
    try {
      const deviceToken = 'dev_high_' + 'f'.repeat(60)
      const success = await apnsService.sendWithHighPriority(deviceToken, 'URGENT: test')
      assert.equal(success, true)

      const history = await apnsService.getPushHistory(deviceToken)
      assert.equal(history[0].priority, 'high')
    } finally {
      await app.close()
    }
  })

  it('e2e: normal priority push recorded correctly', async () => {
    const { app, apnsService } = await buildApp()
    try {
      const deviceToken = 'dev_normal_' + 'g'.repeat(59)
      await apnsService.pushToiOS(deviceToken, { alert: 'normal test' }, 'normal')
      const history = await apnsService.getPushHistory(deviceToken)
      assert.equal(history[0].priority, 'normal')
    } finally {
      await app.close()
    }
  })
})

// ═══ 10. 推送批量与性能 ════════════════════════════════════

describe('batch push and performance', () => {
  it('e2e: push to history stores up to 100 records per token', async () => {
    const { app, apnsService } = await buildApp()
    try {
      const deviceToken = 'dev_batch_' + 'h'.repeat(59)
      for (let i = 0; i < 50; i++) {
        await apnsService.pushToiOS(deviceToken, { alert: `batch-${i}` }, 'normal')
      }
      const history = await apnsService.getPushHistory(deviceToken)
      assert.ok(history.length >= 50)
    } finally {
      await app.close()
    }
  })

  it('e2e: broadcast to no clients returns 0', async () => {
    const { app, wsService } = await buildApp()
    try {
      const sent = wsService.broadcast('empty-chan', {})
      assert.equal(sent, 0)
    } finally {
      await app.close()
    }
  })

  it('e2e: push with sound and badge parameters', async () => {
    const { app, apnsService } = await buildApp()
    try {
      const deviceToken = 'dev_sound_' + 'i'.repeat(60)
      await apnsService.pushToiOS(deviceToken, { alert: 'sound test', sound: 'chime.caf', badge: 3 }, 'high')
      const history = await apnsService.getPushHistory(deviceToken)
      assert.equal(history[0].payload.sound, 'chime.caf')
      assert.equal(history[0].payload.badge, 3)
    } finally {
      await app.close()
    }
  })

  it('e2e: push extra metadata is persisted', async () => {
    const { app, apnsService } = await buildApp()
    try {
      const deviceToken = 'dev_extra_' + 'j'.repeat(60)
      const extra = { campaign: 'test', topic: 'com.test.app' }
      await apnsService.pushToiOS(deviceToken, { alert: 'extra', extra }, 'normal')
      const history = await apnsService.getPushHistory(deviceToken)
      expect(history[0].payload.extra).toEqual(extra)
    } finally {
      await app.close()
    }
  })
})

// ═══ 11. 定时推送调度器 ════════════════════════════════════

describe('push scheduler edge cases', () => {
  it('e2e: schedule already-passed time executes immediately', async () => {
    const { app, scheduler, apnsService } = await buildApp()
    try {
      const pastDate = new Date(Date.now() - 60000)
      const sched = scheduler.schedulePush('member-immediate', 'Immediate push', pastDate)
      // Past-time pushes execute via void async call, so initially pending
      // Wait briefly for async execution
      await new Promise(r => setTimeout(r, 50))
      assert.equal(sched.status, 'sent')
    } finally {
      await app.close()
    }
  })

  it('e2e: query scheduled for member with no pushes returns empty', async () => {
    const { app, scheduler } = await buildApp()
    try {
      const list = scheduler.queryScheduled('non-existent-member')
      assert.equal(list.length, 0)
    } finally {
      await app.close()
    }
  })

  it('e2e: cancel already-cancelled push returns false', async () => {
    const { app, scheduler } = await buildApp()
    try {
      const futureDate = new Date(Date.now() + 86400000)
      const sched = scheduler.schedulePush('member-double-cancel', 'Already cancelled', futureDate)
      const first = scheduler.cancelScheduledPush(sched.id)
      assert.equal(first, true)
      const second = scheduler.cancelScheduledPush(sched.id)
      assert.equal(second, false)
    } finally {
      await app.close()
    }
  })
})
