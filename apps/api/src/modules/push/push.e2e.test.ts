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
import request from 'supertest'
import { PushController } from './push.controller'
import { APNsService, WebSocketService, PushNotificationScheduler } from './push.service'

async function buildApp() {
  const apnsService = new APNsService()
  const wsService = new WebSocketService()
  const scheduler = new PushNotificationScheduler(apnsService)

  const moduleRef = await Test.createTestingModule({
    controllers: [PushController],
    providers: [
      { provide: APNsService, useValue: apnsService },
      { provide: WebSocketService, useValue: wsService },
      { provide: PushNotificationScheduler, useValue: scheduler },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
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
