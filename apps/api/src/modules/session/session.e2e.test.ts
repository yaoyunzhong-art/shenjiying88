import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Session 会话管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → SessionService
 *
 * 验证:
 *   - POST /sessions 创建会话
 *   - POST /sessions/validate 验证会话
 *   - POST /sessions/revoke 作废会话
 *   - POST /sessions/revoke-all 作废用户所有会话
 *   - GET /sessions/user/:userId 获取用户会话列表
 *   - GET /sessions/:sessionId 获取会话详情
 *   - DELETE /sessions/:sessionId 删除会话
 *   - 异常输入 (缺少必填字段 / 不存在的会话)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { SessionService } from './session.service'
import type { DeviceInfo } from './session.entity'

@Controller('sessions')
class TestSessionController {
  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
  ) {}

  @Post()
  @HttpCode(201)
  createSession(@Body() body: { userId: string; tenantId: string; deviceInfo?: DeviceInfo }) {
    if (!body.userId || !body.tenantId) throw new BadRequestException('userId and tenantId are required')
    const session = this.sessionService.createSession(
      body.userId, body.tenantId,
      body.deviceInfo ?? { deviceId: 'unknown', deviceType: 'unknown' },
    )
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      tenantId: session.tenantId,
      deviceType: session.deviceInfo.deviceType,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      status: session.status,
    }
  }

  @Post('validate')
  @HttpCode(200)
  validateSession(@Body() body: { sessionId: string }) {
    if (!body.sessionId) throw new BadRequestException('sessionId is required')
    const session = this.sessionService.getSession(body.sessionId)
    return { valid: session !== null, userId: session?.userId, tenantId: session?.tenantId }
  }

  @Post('revoke')
  @HttpCode(200)
  revokeSession(@Body() body: { sessionId: string }) {
    if (!body.sessionId) throw new BadRequestException('sessionId is required')
    const ok = this.sessionService.revokeSession(body.sessionId)
    if (!ok) throw new NotFoundException(`Session ${body.sessionId} not found`)
    return { success: true }
  }

  @Post('revoke-all')
  @HttpCode(200)
  revokeAll(@Body() body: { userId: string }) {
    if (!body.userId) throw new BadRequestException('userId is required')
    const count = this.sessionService.revokeAllUserSessions(body.userId)
    return { success: true, revokedCount: count }
  }

  @Get('user/:userId')
  @HttpCode(200)
  getUserSessions(@Param('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required')
    const sessions = this.sessionService.getUserSessions(userId)
    return {
      sessions: sessions.map(s => ({
        sessionId: s.sessionId, userId: s.userId, tenantId: s.tenantId,
        deviceType: s.deviceInfo.deviceType, createdAt: s.createdAt,
        expiresAt: s.expiresAt, status: s.status,
      })),
      count: sessions.length,
    }
  }

  @Get(':sessionId')
  @HttpCode(200)
  getSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId is required')
    const session = this.sessionService.getSession(sessionId)
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`)
    return { sessionId: session.sessionId, userId: session.userId, tenantId: session.tenantId, deviceType: session.deviceInfo.deviceType, createdAt: session.createdAt, expiresAt: session.expiresAt, status: session.status }
  }

  @Delete(':sessionId')
  @HttpCode(200)
  deleteSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId is required')
    const ok = this.sessionService.revokeSession(sessionId)
    if (!ok) throw new NotFoundException(`Session ${sessionId} not found`)
    return { success: true }
  }
}

async function buildApp() {
  const sessionService = new SessionService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestSessionController],
    providers: [{ provide: SessionService, useValue: sessionService }],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, sessionService }
}

const deviceInfo: DeviceInfo = { deviceId: 'e2e-device', deviceType: 'mobile', browser: 'Chrome', os: 'iOS' }

describe('Session E2E', () => {
  it('POST /sessions → 201: create session', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions')
      .send({ userId: 'u-e2e', tenantId: 't-e2e', deviceInfo })
    assert.equal(res.status, 201)
    const d = res.body.data ?? res.body
    assert.ok(d.sessionId)
    assert.equal(d.userId, 'u-e2e')
    assert.equal(d.tenantId, 't-e2e')
    assert.equal(d.status, 'active')
    assert.equal(d.deviceType, 'mobile')
    await app.close()
  })

  it('POST /sessions → 400: missing userId/tenantId', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions')
      .send({ deviceInfo })
    assert.equal(res.status, 400)
    await app.close()
  })

  it('POST /sessions → 400: empty body', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions')
      .send({})
    assert.equal(res.status, 400)
    await app.close()
  })

  it('POST /sessions/validate → 200: valid session', async () => {
    const { app, sessionService } = await buildApp()
    const session = sessionService.createSession('u-e2e', 't-e2e', deviceInfo)
    const res = await request(app.getHttpServer())
      .post('/sessions/validate')
      .send({ sessionId: session.sessionId })
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.valid, true)
    assert.equal(d.userId, 'u-e2e')
    await app.close()
  })

  it('POST /sessions/validate → 200: invalid session', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions/validate')
      .send({ sessionId: 'non-existent' })
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.valid, false)
    await app.close()
  })

  it('POST /sessions/revoke → 200: revoke session', async () => {
    const { app, sessionService } = await buildApp()
    const session = sessionService.createSession('u-e2e', 't-e2e', deviceInfo)
    const res = await request(app.getHttpServer())
      .post('/sessions/revoke')
      .send({ sessionId: session.sessionId })
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.success, true)
    assert.equal(sessionService.getSession(session.sessionId), null)
    await app.close()
  })

  it('POST /sessions/revoke → 404: non-existent session', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions/revoke')
      .send({ sessionId: 'non-existent' })
    assert.equal(res.status, 404)
    await app.close()
  })

  it('POST /sessions/revoke-all → 200: revoke all', async () => {
    const { app, sessionService } = await buildApp()
    sessionService.createSession('u-revoke', 't-e2e', deviceInfo)
    sessionService.createSession('u-revoke', 't-e2e', deviceInfo)
    const res = await request(app.getHttpServer())
      .post('/sessions/revoke-all')
      .send({ userId: 'u-revoke' })
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.success, true)
    assert.equal(d.revokedCount, 2)
    assert.equal(sessionService.getUserSessionCount('u-revoke'), 0)
    await app.close()
  })

  it('POST /sessions/revoke-all → 200: no sessions', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer())
      .post('/sessions/revoke-all')
      .send({ userId: 'no-sessions' })
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.revokedCount, 0)
    await app.close()
  })

  it('GET /sessions/user/:userId → 200: list sessions', async () => {
    const { app, sessionService } = await buildApp()
    sessionService.createSession('u-list', 't-e2e', { deviceId: 'd1', deviceType: 'mobile' })
    sessionService.createSession('u-list', 't-e2e', { deviceId: 'd2', deviceType: 'web' })
    const res = await request(app.getHttpServer()).get('/sessions/user/u-list')
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.count, 2)
    assert.equal(d.sessions.length, 2)
    await app.close()
  })

  it('GET /sessions/user/:userId → 200: empty list', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer()).get('/sessions/user/no-sessions')
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.count, 0)
    assert.deepEqual(d.sessions, [])
    await app.close()
  })

  it('GET /sessions/:sessionId → 200: get by id', async () => {
    const { app, sessionService } = await buildApp()
    const session = sessionService.createSession('u-get', 't-e2e', deviceInfo)
    const res = await request(app.getHttpServer()).get(`/sessions/${session.sessionId}`)
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.sessionId, session.sessionId)
    assert.equal(d.status, 'active')
    await app.close()
  })

  it('GET /sessions/:sessionId → 404: non-existent', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer()).get('/sessions/non-existent')
    assert.equal(res.status, 404)
    await app.close()
  })

  it('DELETE /sessions/:sessionId → 200: delete session', async () => {
    const { app, sessionService } = await buildApp()
    const session = sessionService.createSession('u-del', 't-e2e', deviceInfo)
    const res = await request(app.getHttpServer()).delete(`/sessions/${session.sessionId}`)
    assert.equal(res.status, 200)
    const d = res.body.data ?? res.body
    assert.equal(d.success, true)
    assert.equal(sessionService.getSession(session.sessionId), null)
    await app.close()
  })

  it('DELETE /sessions/:sessionId → 404: non-existent', async () => {
    const { app } = await buildApp()
    const res = await request(app.getHttpServer()).delete('/sessions/non-existent')
    assert.equal(res.status, 404)
    await app.close()
  })

  it('should enforce max concurrent sessions (5)', async () => {
    const { app, sessionService } = await buildApp()
    for (let i = 0; i < 5; i++) {
      sessionService.createSession('u-concurrent', 't-e2e', { deviceId: `d${i}`, deviceType: 'mobile' })
    }
    assert.equal(sessionService.getUserSessionCount('u-concurrent'), 5)
    sessionService.createSession('u-concurrent', 't-e2e', { deviceId: 'd6', deviceType: 'mobile' })
    assert.equal(sessionService.getUserSessionCount('u-concurrent'), 5)
    await app.close()
  })
})
