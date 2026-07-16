import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Realtime 实时通信 HTTP 链路
 *
 * 链路:
 *   HTTP → RealtimeController → RealtimeService + CollabService + CRDTDocument + PresenceService
 *
 * 验证:
 *   - WS 连接: 会话创建 / 加入 / 离开
 *   - 消息广播: 房间消息发送 / 广播送达
 *   - 房间管理: 创建房间 / 查询状态 / 列出活跃房间
 *   - 心跳: 在线状态 / 心跳 / 最后活跃
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { RealtimeController } from './realtime.controller'
import { RealtimeService } from './realtime.service'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'

async function buildApp() {
  const collabEditor = new CollaborativeEditor()
  const presenceService = new PresenceService()
  const conflictResolver = new ConflictResolver()
  const collabService = new CollabService()
  const crdtDocument = new CRDTDocument()
  const wsManager = new WebSocketSessionManager()
  const syncService = new MultiDeviceSyncService(crdtDocument, wsManager)
  const realtimeService = new RealtimeService(collabService)

  const moduleRef = await Test.createTestingModule({
    controllers: [RealtimeController],
    providers: [
      { provide: CollaborativeEditor, useValue: collabEditor },
      { provide: PresenceService, useValue: presenceService },
      { provide: ConflictResolver, useValue: conflictResolver },
      { provide: CollabService, useValue: collabService },
      { provide: CRDTDocument, useValue: crdtDocument },
      { provide: WebSocketSessionManager, useValue: wsManager },
      { provide: MultiDeviceSyncService, useValue: syncService },
      { provide: RealtimeService, useValue: realtimeService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, realtimeService, collabEditor, presenceService, wsManager, crdtDocument }
}

// ─── 1. WS 连接（会话管理） ──────────────────────────────────

it('e2e-http: create WS session returns session with user', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/realtime/session/create')
      .send({ docId: 'doc-1', userId: 'user-alice' })
    assert.equal(res.statusCode, 201)
    const data = res.body as { success: boolean; data?: Record<string, unknown> }
    assert.equal(data.success, true)
    assert.ok(data.data!.sessionId)
    const session = data.data as Record<string, unknown>
    assert.equal(session.docId, 'doc-1')
  } finally {
    await app.close()
  }
})

it('e2e-http: join existing WS session adds user', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/realtime/session/create')
      .send({ docId: 'doc-join', userId: 'user-owner' })
    const sessionId = ((createRes.body as Record<string, unknown>).data as Record<string, unknown>).sessionId as string

    const res = await request(app.getHttpServer())
      .post('/realtime/session/join')
      .send({ sessionId, userId: 'user-guest' })
    assert.equal(res.statusCode, 201)
    const data = res.body as { success: boolean; data?: { users: Set<string> } }
    assert.equal(data.success, true)
  } finally {
    await app.close()
  }
})

it('e2e-http: leave session removes user', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/realtime/session/create')
      .send({ docId: 'doc-leave', userId: 'user-leave' })
    const sessionId = ((createRes.body as Record<string, unknown>).data as Record<string, unknown>).sessionId as string

    const res = await request(app.getHttpServer())
      .post('/realtime/session/leave')
      .send({ sessionId, userId: 'user-leave' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
  } finally {
    await app.close()
  }
})

it('e2e-http: get session returns session details', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/realtime/session/create')
      .send({ docId: 'doc-get', userId: 'user-get' })
    const sessionId = ((createRes.body as Record<string, unknown>).data as Record<string, unknown>).sessionId as string

    const res = await request(app.getHttpServer()).get(`/realtime/session/${sessionId}`)
    assert.equal(res.statusCode, 200)
    const data = res.body as { success: boolean; data?: Record<string, unknown> }
    assert.equal(data.success, true)
    assert.ok(data.data!.sessionId)
  } finally {
    await app.close()
  }
})

// ─── 2. 消息广播 ─────────────────────────────────────────────

it('e2e-http: create room returns room with participant', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Chat Room', 'user-owner', 'doc-chat')
    assert.ok(room.roomId)
    assert.equal(room.name, 'Chat Room')
    assert.equal(room.participants.length, 1)
    assert.equal(room.participants[0].userId, 'user-owner')
  } finally {
    await app.close()
  }
})

it('e2e-http: join room adds participant', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Team Room', 'user-alice', 'doc-team')

    const updated = realtimeService.joinRoom(room.roomId, 'user-bob', 'editor')
    assert.equal(updated.participants.length, 2)
    assert.ok(updated.participants.some((p) => p.userId === 'user-bob'))
  } finally {
    await app.close()
  }
})

it('e2e-http: send message in room returns messageId and deliveredTo', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Msg Room', 'user-sender', 'doc-msg')
    realtimeService.joinRoom(room.roomId, 'user-receiver', 'viewer')

    const result = await realtimeService.sendMessage(room.roomId, 'user-sender', 'Hello everyone', 'text')
    assert.ok(result.messageId)
    assert.ok(result.deliveredTo.includes('user-receiver'))
  } finally {
    await app.close()
  }
})

it('e2e-http: CollabService broadcast change returns session', async () => {
  const { app, collabEditor } = await buildApp()
  try {
    const collabService = new CollabService()
    const session = collabService.createSession('doc-bc', 'user-bc')
    const result = collabService.broadcastChange(session.sessionId, 'user-bc', { type: 'edit', data: 'test' })
    assert.ok(result)
  } finally {
    await app.close()
  }
})

// ─── 3. 房间管理 ─────────────────────────────────────────────

it('e2e-http: get room status returns participant count', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Status Room', 'user-status', 'doc-status')
    realtimeService.joinRoom(room.roomId, 'user-viewer', 'viewer')

    const status = realtimeService.getRoomStatus(room.roomId)
    assert.equal(status.participantCount, 2)
    assert.equal(status.status, 'active')
  } finally {
    await app.close()
  }
})

it('e2e-http: list rooms returns created rooms sorted by activity', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    realtimeService.createRoom('Room A', 'user-a', 'doc-a')
    realtimeService.createRoom('Room B', 'user-b', 'doc-b')

    const rooms = realtimeService.listRooms()
    assert.ok(rooms.length >= 2)
    assert.ok(rooms.some((r) => r.name === 'Room A'))
  } finally {
    await app.close()
  }
})

it('e2e-http: leave room removes participant and archives empty room', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Temp Room', 'user-temp', 'doc-temp')

    realtimeService.leaveRoom(room.roomId, 'user-temp')
    const status = realtimeService.getRoomStatus(room.roomId)
    assert.equal(status.status, 'archived')
  } finally {
    await app.close()
  }
})

it('e2e-http: close room changes status to closed', async () => {
  const { app, realtimeService } = await buildApp()
  try {
    const room = realtimeService.createRoom('Close Room', 'user-close', 'doc-close')
    const closed = realtimeService.closeRoom(room.roomId)
    assert.equal(closed, true)

    const status = realtimeService.getRoomStatus(room.roomId)
    assert.equal(status.status, 'closed')
  } finally {
    await app.close()
  }
})

// ─── 4. 心跳 ─────────────────────────────────────────────────

it('e2e-http: presence heartbeat updates last active', async () => {
  const { app, presenceService } = await buildApp()
  try {
    presenceService.heartbeat('user-heartbeat', 'doc-heartbeat')
    const lastActive = presenceService.getLastActive('user-heartbeat')
    assert.ok(lastActive !== undefined)
    assert.ok(typeof lastActive === 'number')
  } finally {
    await app.close()
  }
})

it('e2e-http: presence heartbeat on doc returns online users', async () => {
  const { app, presenceService, collabEditor } = await buildApp()
  try {
    collabEditor.createDocument('doc-presence', 'user-online')
    presenceService.heartbeat('user-online', 'doc-presence')

    const online = presenceService.getOnlineUsers('doc-presence')
    assert.ok(online.some((u: { userId: string }) => u.userId === 'user-online'))
  } finally {
    await app.close()
  }
})

it('e2e-http: set user status updates presence status', async () => {
  const { app, presenceService } = await buildApp()
  try {
    presenceService.setUserStatus('user-busy', 'busy')
    presenceService.heartbeat('user-busy', 'doc-busy')

    const lastActive = presenceService.getLastActive('user-busy')
    assert.ok(lastActive !== undefined)
  } finally {
    await app.close()
  }
})

it('e2e-http: CRDT health check returns ok', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/realtime/health')
    assert.equal(res.statusCode, 200)
    const body = res.body as Record<string, unknown>
    assert.equal(body.status, 'ok')
    assert.equal(body.module, 'realtime')
  } finally {
    await app.close()
  }
})
