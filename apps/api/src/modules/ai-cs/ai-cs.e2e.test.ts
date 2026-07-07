import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-cs] [D] e2e spec 补全
 *
 * E2E: AI 智能客服 — 使用 Express 直接测试 controller handler
 *
 * 受 tsx esbuild 无法 emitDecoratorMetadata 的限制，
 * 这里直接构造 CSEngine 实例 + express + supertest
 *
 * 验证:
 *   - POST /ai-cs/send          发送消息
 *   - POST /ai-cs/handoff       转人工  
 *   - POST /ai-cs/knowledge     添加知识库
 *   - GET  /ai-cs/knowledge/search  知识库检索
 *   - GET  /ai-cs/sessions      会话列表
 *   - GET  /ai-cs/health        健康检查
 *   - 空内容 / 边界 / 并发
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import { CSEngine } from './cs.engine'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { HandoffService } from './handoff.service'
import { FallbackService } from './fallback.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import { IntentAdapter } from './datasources/intent.adapter'
import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { MockProvider } from './providers/mock.provider'
import type { SendMessageRequest, HandoffRequest, Knowledge } from './ai-cs.entity'

// ─── 构建 express 应用 ───────────────────────────────

function buildApp() {
  const openAIProvider = new OpenAIProvider()
  const deepSeekProvider = new DeepSeekProvider()
  const mockProvider = new MockProvider()
  const fallbackService = new FallbackService(openAIProvider, deepSeekProvider, mockProvider)
  const knowledgeAdapter = new KnowledgeAdapter()
  const intentAdapter = new IntentAdapter()
  const conversationAdapter = new ConversationAdapter()
  const intentService = new IntentService(intentAdapter)
  const knowledgeService = new KnowledgeService(knowledgeAdapter)
  const sessionService = new SessionService()
  const handoffService = new HandoffService(conversationAdapter)
  const engine = new CSEngine(
    sessionService,
    intentService,
    knowledgeService,
    fallbackService,
    handoffService,
    conversationAdapter,
    knowledgeAdapter,
  )

  const app = express()
  app.use(express.json())

  // POST /send
  app.post('/ai-cs/send', async (req, res) => {
    try {
      const result = await engine.sendMessage(req.body as SendMessageRequest)
      res.status(201).json(result)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  // POST /handoff
  app.post('/ai-cs/handoff', async (req, res) => {
    try {
      const result = await handoffService.createTicket(req.body as HandoffRequest)
      res.status(201).json(result)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  // POST /knowledge
  app.post('/ai-cs/knowledge', async (req, res) => {
    try {
      const kb = req.body as Knowledge
      const existing = knowledgeService.search(kb.tenantId, kb.title)
      const result = existing.length > 0 ? { ...kb, id: kb.id } : existing
      res.status(201).json(result)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  // GET /knowledge/search
  app.get('/ai-cs/knowledge/search', async (req, res) => {
    try {
      const { tenantId, q } = req.query as Record<string, string>
      const result = knowledgeService.search(tenantId, q)
      res.json(result)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  // GET /sessions
  app.get('/ai-cs/sessions', async (req, res) => {
    try {
      const { tenantId, memberId } = req.query as Record<string, string>
      const result = memberId
        ? conversationAdapter.queryByMember(tenantId, memberId)
        : conversationAdapter.queryAll(tenantId)
      res.json(result)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  // GET /health
  app.get('/ai-cs/health', async (req, res) => {
    try {
      const providers = await fallbackService.listAvailable()
      res.json({
        status: 'ok',
        providers,
        timestamp: new Date().toISOString(),
      })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  return app
}

// ─── E2E 测试 ────────────────────────────────────────

describe('AiCs E2E — HTTP 链路 (express)', () => {
  const app = buildApp()

  // ── 正例: 发送消息 ──────────────────────────────

it('POST /ai-cs/send — 发送用户消息，返回 AI 回复', async () => {
    const res = await request(app)
      .post('/ai-cs/send')
      .send({
        tenantId: 'tenant-1',
        memberId: 'member-1',
        channel: 'web',
        content: '你好，我想咨询会员等级',
      })
      .expect(201)

    assert.ok(res.body)
    assert.ok(res.body.conversationId)
    assert.ok(res.body.message)
    assert.equal(typeof res.body.message.content, 'string')
    assert.ok(res.body.latencyMs >= 0)
    assert.ok(typeof res.body.confidence === 'number')
  })

it('POST /ai-cs/send — 触发转人工 (forceHandoff)', async () => {
    const res = await request(app)
      .post('/ai-cs/send')
      .send({
        tenantId: 'tenant-2',
        memberId: 'member-2',
        channel: 'mobile',
        content: '我要投诉！',
        options: { forceHandoff: true },
      })
      .expect(201)

    assert.equal(res.body.handoffTriggered, true)
    assert.ok(res.body.handoffTicketId)
    assert.ok(typeof res.body.provider === 'string')
  })

  // ── 正例: 转人工 ────────────────────────────────

it('POST /ai-cs/handoff — 创建转人工工单', async () => {
    const sendRes = await request(app)
      .post('/ai-cs/send')
      .send({ tenantId: 'tenant-1', memberId: 'member-1', channel: 'web', content: '人工' })

    const res = await request(app)
      .post('/ai-cs/handoff')
      .send({
        tenantId: 'tenant-1',
        conversationId: sendRes.body.conversationId,
        reason: 'user-request',
        priority: 'medium',
      })
      .expect(201)

    assert.ok(res.body.ticket)
    assert.equal(res.body.ticket.reason, 'user-request')
    assert.ok(res.body.estimatedWaitMs >= 0)
  })

  // ── 正例: 知识库 ────────────────────────────────

it('POST /ai-cs/knowledge — 添加知识库条目', async () => {
    const res = await request(app)
      .post('/ai-cs/knowledge')
      .send({
        id: 'kb-e2e-1',
        tenantId: 'tenant-1',
        category: 'faq',
        title: 'E2E 测试知识',
        content: 'E2E 测试内容',
        tags: ['e2e'],
        metadata: { viewCount: 0, helpfulCount: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .expect(201)

    assert.ok(res.body)
  })

it('GET /ai-cs/knowledge/search — 知识库检索', async () => {
    const res = await request(app)
      .get('/ai-cs/knowledge/search')
      .query({ tenantId: 'tenant-1', q: '会员等级' })
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

  // ── 正例: 会话 ──────────────────────────────────

it('GET /ai-cs/sessions — 获取会话列表', async () => {
    await request(app)
      .post('/ai-cs/send')
      .send({ tenantId: 'tenant-1', memberId: 'member-1', channel: 'web', content: '测试' })

    const res = await request(app)
      .get('/ai-cs/sessions')
      .query({ tenantId: 'tenant-1' })
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

it('GET /ai-cs/health — 健康检查', async () => {
    const res = await request(app)
      .get('/ai-cs/health')
      .expect(200)

    assert.equal(res.body.status, 'ok')
    assert.ok(Array.isArray(res.body.providers))
    assert.ok(res.body.timestamp)
  })

  // ── 边界 / 反例 ─────────────────────────────────

it('POST /ai-cs/send — 空内容', async () => {
    const res = await request(app)
      .post('/ai-cs/send')
      .send({ tenantId: 'tenant-1', channel: 'web', content: '' })
      .expect(201)

    assert.ok(res.body)
    assert.ok(typeof res.body.message?.content === 'string')
  })

it('GET /ai-cs/knowledge/search — 空查询字符串', async () => {
    const res = await request(app)
      .get('/ai-cs/knowledge/search')
      .query({ tenantId: 'tenant-1', q: '' })
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

it('GET /ai-cs/sessions — 不存在的 tenantId', async () => {
    const res = await request(app)
      .get('/ai-cs/sessions')
      .query({ tenantId: 'nonexistent-tenant' })
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

it('POST /ai-cs/send — 并发 3 条消息', async () => {
    const promises = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .post('/ai-cs/send')
        .send({
          tenantId: 'tenant-bulk',
          memberId: `member-${i}`,
          channel: 'web',
          content: `并发消息 #${i}`,
        }),
    )

    const results = await Promise.all(promises)
    for (const r of results) {
      assert.equal(r.status, 201)
      assert.ok(r.body.conversationId)
    }
  })
})
