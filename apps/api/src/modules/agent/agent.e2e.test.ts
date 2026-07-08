import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Agent 模块 HTTP 链路
 *
 * 链路: HTTP → TestController → AgentService
 *
 * 验证:
 *   - Agent 配置 CRUD (GET / POST / PUT / DELETE)
 *   - Agent 会话 (POST /sessions/run, GET /sessions)
 *   - 批量执行 (POST /sessions/batch)
 *   - 质量评估 (POST /evaluations, GET /evaluations)
 *   - 统计查询 (GET /stats)
 *   - 工具查询 (GET /tools)
 *   - Session Events replay (GET /sessions/:id/events)
 *   - 异常输入与错误边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  HttpException
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AgentService } from './agent.service'
import { EventBufferService } from './event-buffer.service'
import { ToolRegistry } from './tool-registry'
import type { AgentConfig, AgentSession } from './agent.entity'

// ── 测试专用 Controller (NestJS HTTP 链路, 省略 SSE 避免重定向混淆) ──
@Controller('agent')
class TestAgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly eventBuffer: EventBufferService
  ) {}

  @Get('configs')
  getConfigs(): AgentConfig[] { return this.agentService.getConfigs() }

  @Get('configs/:id')
  getConfig(@Param('id') id: string): AgentConfig | undefined {
    const c = this.agentService.getConfig(id)
    if (!c) throw new Error(`Agent config ${id} not found`)
    return c
  }

  @Post('configs')
  createConfig(@Body() config: AgentConfig): AgentConfig {
    return this.agentService.createConfig(config)
  }

  @Put('configs/:id')
  updateConfig(@Param('id') id: string, @Body() up: Partial<AgentConfig>): AgentConfig {
    const u = this.agentService.updateConfig(id, up)
    if (!u) throw new Error(`Agent config ${id} not found`)
    return u
  }

  @Delete('configs/:id')
  deleteConfig(@Param('id') id: string): { deleted: boolean } {
    const result = this.agentService.deleteConfig(id)
    if (!result) throw new Error(`Agent config ${id} not found`)
    return { deleted: true }
  }

  @Post('sessions/run')
  createAndRunSession(@Body() r: any): any {
    return this.agentService.createAndRunSession(r)
  }

  @Post('sessions/batch')
  batchExecute(@Body() r: any): any {
    return this.agentService.batchExecute(r)
  }

  @Get('sessions')
  getSessions(): AgentSession[] { return this.agentService.getSessions() }

  @Get('sessions/:id')
  getSession(@Param('id') id: string): AgentSession {
    const s = this.agentService.getSession(id)
    if (!s) throw new Error(`Agent session ${id} not found`)
    return s
  }

  @Get('sessions/:id/execution')
  getSessionExecution(@Param('id') id: string): any {
    const e = this.agentService.getSessionExecution(id)
    if (!e) throw new Error(`Execution for session ${id} not found`)
    return e
  }

  @Get('sessions/:id/evaluation')
  getSessionEvaluation(@Param('id') id: string): any {
    const e = this.agentService.getEvaluation(id)
    if (!e) throw new Error(`Evaluation for session ${id} not found`)
    return e
  }

  @Get('sessions/:id/events')
  getSessionEvents(@Param('id') id: string, @Query('after') after?: string): any {
    if (!after) return { events: [], lastValidId: 0, found: false, sessionId: id }
    const afterNum = parseInt(after, 10)
    if (isNaN(afterNum)) throw new HttpException('Invalid "after" parameter, must be integer', 400)
    if (!this.eventBuffer.has(id)) throw new HttpException(`No buffered events for session ${id}`, 404)
    const result = this.eventBuffer.replayAfter(id, afterNum)
    if (!result.found && result.events.length === 0) {
      throw new HttpException({
        error: 'events_expired', lastValidId: result.lastValidId,
        message: `Last-Event-ID ${afterNum} expired`
      }, 410)
    }
    return { events: result.events, lastValidId: result.lastValidId, found: result.found, sessionId: id }
  }

  @Post('evaluations')
  submitEvaluation(@Body() ev: any): any { return (this.agentService as any).submitEvaluation(ev) }

  @Get('evaluations')
  getEvaluations(): any[] { return this.agentService.getEvaluations() }

  @Get('stats')
  getStats(@Query('tenantId') tenantId?: string): any { return this.agentService.getStats(tenantId) }

  @Get('tools')
  getTools(): unknown { return this.agentService.getTools() }
}

// ── 测试工厂 ──
async function buildApp() {
  const toolRegistry = new ToolRegistry()
  const agentService = new AgentService(toolRegistry)
  const eventBuffer = new EventBufferService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAgentController],
    providers: [
      { provide: AgentService, useValue: agentService },
      { provide: EventBufferService, useValue: eventBuffer }
    ]
  }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, agentService, eventBuffer }
}

// 测试用配置
const testCfg: AgentConfig = {
  id: 'test-cfg-1', name: 'Test Agent',
  systemPrompt: 'You are helpful.', model: 'gpt-4',
  maxSteps: 5, enableReflection: true,
  allowedTools: ['calculator'], timeoutMs: 30000,
  enabled: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  tenantId: 'tenant-A'
}

// Helpers
function data(res: any) { return res.body.data }

// ═══════════════════════════════════════════════
// Config CRUD
// ═══════════════════════════════════════════════

it('e2e: GET /agent/configs returns configs including default', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/configs')
    assert.equal(res.statusCode, 200)
    const configs: AgentConfig[] = res.body.data
    assert.ok(Array.isArray(configs))
    assert.ok(configs.length >= 1)
    const def = configs.find(c => c.id === 'default-agent-v1')
    assert.ok(def)
    assert.equal(def!.name, 'Default Agent')
    assert.ok(def!.systemPrompt)
  } finally { await app.close() }
})

it('e2e: GET /agent/configs/:id returns default-config', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/configs/default-agent-v1')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.id, 'default-agent-v1')
    assert.equal(res.body.data.name, 'Default Agent')
  } finally { await app.close() }
})

it('e2e: GET /agent/configs/:id returns 500 for unknown', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/configs/nope')
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

it('e2e: POST /agent/configs creates', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/agent/configs').send(testCfg)
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.id, 'test-cfg-1')
  } finally { await app.close() }
})

it('e2e: PUT /agent/configs/:id updates', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService.createConfig(testCfg)
    const res = await request(app.getHttpServer()).put('/agent/configs/test-cfg-1').send({ name: 'Updated', maxSteps: 10 })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.name, 'Updated')
    assert.equal(res.body.data.maxSteps, 10)
    assert.equal(res.body.data.model, 'gpt-4') // unchanged
  } finally { await app.close() }
})

it('e2e: PUT /agent/configs/:id 500 for unknown', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).put('/agent/configs/nope').send({ name: 'X' })
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

it('e2e: DELETE /agent/configs/:id deletes', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService.createConfig(testCfg)
    const res = await request(app.getHttpServer()).delete('/agent/configs/test-cfg-1')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.deleted, true)
    const get = await request(app.getHttpServer()).get('/agent/configs')
    assert.equal(get.body.data.some((c: any) => c.id === 'test-cfg-1'), false)
  } finally { await app.close() }
})

it('e2e: DELETE /agent/configs/:id 500 for unknown', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).delete('/agent/configs/nope')
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

// ═══════════════════════════════════════════════
// Sessions
// ═══════════════════════════════════════════════

it('e2e: POST /agent/sessions/run creates & runs', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const res = await request(app.getHttpServer()).post('/agent/sessions/run').send({
      configId: 'test-cfg-1', userInput: 'Hi',
      createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    const d = res.body.data
    assert.ok(d.session)
    assert.equal(d.session.configId, 'test-cfg-1')
    assert.equal(d.session.status, 'COMPLETED')
    assert.ok(d.execution)
    assert.equal(d.execution.status, 'SUCCESS')
  } finally { await app.close() }
})

it('e2e: POST /agent/sessions/run 500 for unknown config', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/agent/sessions/run').send({
      configId: 'nope', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

it('e2e: POST /agent/sessions/run 500 for disabled config', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService.createConfig({ ...testCfg, enabled: false })
    const res = await request(app.getHttpServer()).post('/agent/sessions/run').send({
      configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

it('e2e: POST /agent/sessions/run respects maxSteps', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const res = await request(app.getHttpServer()).post('/agent/sessions/run').send({
      configId: 'test-cfg-1', userInput: 'Solve 2+2', maxSteps: 3,
      createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.session.maxSteps, 3)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions returns sessions', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'A', createdBy: 'u1', tenantId: 'tenant-A' })
    await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'B', createdBy: 'u1', tenantId: 'tenant-A' })
    const res = await request(app.getHttpServer()).get('/agent/sessions')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.length >= 2)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id returns session', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'X', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    const res = await request(app.getHttpServer()).get(`/agent/sessions/${sid}`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.id, sid)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id 500 for unknown', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/sessions/nope')
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/execution returns execution', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'X', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    const res = await request(app.getHttpServer()).get(`/agent/sessions/${sid}/execution`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.sessionId, sid)
    assert.equal(res.body.data.status, 'SUCCESS')
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/execution 500 for unknown', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/sessions/nope/execution')
    assert.equal(res.statusCode, 500)
  } finally { await app.close() }
})

// ═══════════════════════════════════════════════
// Batch
// ═══════════════════════════════════════════════

it('e2e: POST /agent/sessions/batch runs multiple', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const res = await request(app.getHttpServer()).post('/agent/sessions/batch').send({
      items: [{ configId: 'test-cfg-1', userInput: 'One' }, { configId: 'test-cfg-1', userInput: 'Two' }],
      createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    const d = res.body.data
    assert.equal(d.total, 2)
    assert.equal(d.succeeded, 2)
    assert.equal(d.failed, 0)
    assert.ok(d.results)
    assert.equal(d.results.length, 2)
    assert.equal(d.results[0].session.status, 'COMPLETED')
    assert.equal(d.results[1].session.status, 'COMPLETED')
    assert.ok(d.timestamp)
  } finally { await app.close() }
})

it('e2e: POST /agent/sessions/batch handles partial failures', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const res = await request(app.getHttpServer()).post('/agent/sessions/batch').send({
      items: [{ configId: 'test-cfg-1', userInput: 'OK' }, { configId: 'nope', userInput: 'Fail' }],
      createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.total, 2)
    assert.equal(res.body.data.succeeded, 1)
    assert.equal(res.body.data.failed, 1)
    assert.equal(res.body.data.results.length, 1)
  } finally { await app.close() }
})

it('e2e: POST /agent/sessions/batch handles empty items', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/agent/sessions/batch').send({
      items: [], createdBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.total, 0)
    assert.equal(res.body.data.succeeded, 0)
    assert.equal(res.body.data.failed, 0)
    assert.equal(res.body.data.results.length, 0)
  } finally { await app.close() }
})

// ═══════════════════════════════════════════════
// Evaluations
// ═══════════════════════════════════════════════

it('e2e: POST /agent/evaluations submits', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    const res = await request(app.getHttpServer()).post('/agent/evaluations').send({
      sessionId: sid, userInput: 'Hi', agentOutput: 'Hello!',
      relevanceScore: 0.9, accuracyScore: 0.85, completenessScore: 0.8,
      safetyScore: 1.0, helpfulnessScore: 0.95, concisenessScore: 0.7,
      feedback: 'Good', evaluatedBy: 'u1', tenantId: 'tenant-A'
    })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.id)
    assert.equal(res.body.data.sessionId, sid)
    assert.equal(res.body.data.relevanceScore, 0.9)
  } finally { await app.close() }
})

it('e2e: GET /agent/evaluations', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    await request(app.getHttpServer()).post('/agent/evaluations').send({
      sessionId: sid, userInput: 'Hi', agentOutput: 'Hello!',
      relevanceScore: 0.9, accuracyScore: 0.85, completenessScore: 0.8,
      safetyScore: 1.0, helpfulnessScore: 0.95, concisenessScore: 0.7,
      feedback: 'Good', evaluatedBy: 'u1', tenantId: 'tenant-A'
    })
    const res = await request(app.getHttpServer()).get('/agent/evaluations')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.length >= 1)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/evaluation', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    await request(app.getHttpServer()).post('/agent/evaluations').send({
      sessionId: sid, userInput: 'Hi', agentOutput: 'Hello!',
      relevanceScore: 0.9, accuracyScore: 0.85, completenessScore: 0.8,
      safetyScore: 1.0, helpfulnessScore: 0.95, concisenessScore: 0.7,
      feedback: 'Good', evaluatedBy: 'u1', tenantId: 'tenant-A'
    })
    const res = await request(app.getHttpServer()).get(`/agent/sessions/${sid}/evaluation`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.sessionId, sid)
  } finally { await app.close() }
})

// ═══════════════════════════════════════════════
// Stats & Tools
// ═══════════════════════════════════════════════

it('e2e: GET /agent/stats returns statistics', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const res = await request(app.getHttpServer()).get('/agent/stats')
    assert.equal(res.statusCode, 200)
    assert.ok(res.body.data.totalSessions >= 1)
    assert.ok(res.body.data.completedSessions >= 1)
    assert.ok(res.body.data.tenantId === 'all')
  } finally { await app.close() }
})

it('e2e: GET /agent/stats?tenantId=filters', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/stats?tenantId=tenant-A')
    assert.equal(res.statusCode, 200)
  } finally { await app.close() }
})

it('e2e: GET /agent/tools returns tools', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/tools')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally { await app.close() }
})

// ═══════════════════════════════════════════════
// Session Events (replay endpoint)
// ═══════════════════════════════════════════════

it('e2e: GET /agent/sessions/:id/events?after=0', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    const res = await request(app.getHttpServer()).get(`/agent/sessions/${sid}/events?after=0`)
    // Because runSessionWithStream is not called in this test controller (the service uses the non-stream path),
    // the eventBuffer may not have the session. That is expected.
    // 404 means no events buffered, which is acceptable.
    if (res.statusCode === 404) {
      assert.equal(res.body.message, `No buffered events for session ${sid}`)
    } else {
      assert.equal(res.statusCode, 200)
      assert.ok(Array.isArray(res.body.data.events))
    }
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/events rejects bad after', async () => {
  const { app, agentService } = await buildApp()
  try {
    agentService['configs'].push(testCfg)
    const run = await request(app.getHttpServer()).post('/agent/sessions/run').send({ configId: 'test-cfg-1', userInput: 'Hi', createdBy: 'u1', tenantId: 'tenant-A' })
    const sid = run.body.data.session.id
    const res = await request(app.getHttpServer()).get(`/agent/sessions/${sid}/events?after=abc`)
    assert.equal(res.statusCode, 400)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/events without after returns empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/sessions/any-session/events')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.events.length, 0)
  } finally { await app.close() }
})

it('e2e: GET /agent/sessions/:id/events 404 for unknown session', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/agent/sessions/unknown/events?after=1')
    assert.equal(res.statusCode, 404)
  } finally { await app.close() }
})
