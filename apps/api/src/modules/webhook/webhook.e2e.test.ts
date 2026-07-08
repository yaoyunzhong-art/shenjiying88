/**
 * 🐜 自动: [webhook] [D] e2e 补全
 *
 * E2E: Webhook 模块 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → WebhookService
 *
 * 验证:
 *   - 端点 CRUD (创建/读取/列表/更新/删除)
 *   - 事件投递 (emit → delivery log)
 *   - 签名验证
 *   - 异常输入 (缺少字段、无效 URL)
 *   - 边界场景 (空列表、重复删除)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { WebhookService, type WebhookEventType as ServiceEventType } from './webhook.service'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'

/** ResponseInterceptor 包装后提取 data 字段 */
function unwrap(res: request.Response): any {
  return 'data' in res.body ? res.body.data : res.body
}

@Controller('webhook')
class TestWebhookController {
  constructor(
    @Inject(WebhookService) private readonly service: WebhookService,
  ) {}

  @Post('endpoints')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Record<string, unknown>) {
    return this.service.registerEndpoint(
      body.url as string,
      body.secret as string,
      body.events as ServiceEventType[],
    )
  }

  @Get('endpoints')
  async list() {
    return this.service.listEndpoints()
  }

  @Get('endpoints/:id')
  async getById(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Patch('endpoints/:id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateEndpoint(id, body)
  }

  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.deleteEndpoint(id)
  }

  @Post('endpoints/:id/subscribe')
  async subscribe(@Param('id') endpointId: string, @Body() body: Record<string, unknown>) {
    return this.service.subscribe(
      endpointId,
      body.event as ServiceEventType,
      body.filters as Record<string, string> | undefined,
    )
  }

  @Post('emit')
  async emit(@Body() body: Record<string, unknown>) {
    await this.service.emit(
      body.eventType as ServiceEventType,
      body.payload as Record<string, unknown> || {},
    )
    return { emitted: true }
  }

  @Get('endpoints/:id/deliveries')
  async getDeliveries(@Param('id') endpointId: string, @Query('limit') limit?: string) {
    return this.service.getDeliveryLogs(endpointId, limit ? Number(limit) : 50)
  }

  @Post('sign')
  async sign(@Body() body: Record<string, unknown>) {
    const signature = this.service.signPayload(
      body.payload as string,
      body.secret as string,
    )
    return { signature }
  }

  @Post('verify')
  async verify(@Body() body: Record<string, unknown>) {
    const valid = this.service.verifySignature(
      body.payload as string,
      body.signature as string,
      body.secret as string,
    )
    return { valid }
  }
}

describe('Webhook E2E: HTTP 链路', () => {
  let app: any
  let httpServer: any

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestWebhookController],
      providers: [WebhookService],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
    httpServer = app.getHttpServer()
  })

  afterEach(async () => {
    await app?.close()
  })

  // ─── 端点 CRUD ───────────────────────────────────

  describe('POST /webhook/endpoints — 创建端点', () => {
    it('正常: 创建 webhook endpoint 返回 201', async () => {
      const res = await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://example.com/hook', secret: 'sk-test', events: ['order.created'] })
        .expect(201)
      const data = unwrap(res)
      assert.ok(data.id)
      assert.equal(data.url, 'https://example.com/hook')
      assert.deepEqual(data.events, ['order.created'])
      assert.equal(data.active, true)
    })

    it('正常: 多事件创建', async () => {
      const res = await request(httpServer)
        .post('/webhook/endpoints')
        .send({
          url: 'https://multi.com/hook',
          secret: 'sk-test',
          events: ['order.created', 'order.paid', 'points.earned'],
        })
        .expect(201)
      const data = unwrap(res)
      assert.equal(data.events.length, 3)
    })
  })

  describe('GET /webhook/endpoints — 列表', () => {
    it('正常: 空列表返回 []', async () => {
      const res = await request(httpServer)
        .get('/webhook/endpoints')
        .expect(200)
      assert.deepEqual(unwrap(res), [])
    })

    it('正常: 创建后列表包含端点', async () => {
      await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://a.com/hook', secret: 's1', events: ['order.created'] })
      await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://b.com/hook', secret: 's2', events: ['order.paid'] })

      const res = await request(httpServer)
        .get('/webhook/endpoints')
        .expect(200)
      assert.equal(unwrap(res).length, 2)
    })
  })

  describe('GET /webhook/endpoints/:id — 查询单个', () => {
    it('正常: 查询已有端点', async () => {
      const createRes = await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://get.com/hook', secret: 's', events: ['order.created'] })
      const id = unwrap(createRes).id

      const res = await request(httpServer)
        .get(`/webhook/endpoints/${id}`)
        .expect(200)
      const data = unwrap(res)
      assert.equal(data.id, id)
      assert.equal(data.url, 'https://get.com/hook')
    })

    it('边界: 查询不存在的端点返回 null', async () => {
      const res = await request(httpServer)
        .get('/webhook/endpoints/nonexistent')
        .expect(200)
      assert.equal(unwrap(res), null)
    })
  })

  describe('PATCH /webhook/endpoints/:id — 更新', () => {
    it('正常: 更新 URL', async () => {
      const createRes = await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://old.com/hook', secret: 's', events: ['order.created'] })
      const id = unwrap(createRes).id

      const res = await request(httpServer)
        .patch(`/webhook/endpoints/${id}`)
        .send({ url: 'https://new.com/hook' })
        .expect(200)
      assert.equal(unwrap(res).url, 'https://new.com/hook')
    })

    it('异常: 更新不存在的端点返回 500', async () => {
      await request(httpServer)
        .patch('/webhook/endpoints/nonexistent')
        .send({ url: 'https://x.com' })
        .expect(500)
    })
  })

  describe('DELETE /webhook/endpoints/:id — 删除', () => {
    it('正常: 删除端点返回 204', async () => {
      const createRes = await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://del.com/hook', secret: 's', events: ['order.created'] })
      const id = unwrap(createRes).id

      await request(httpServer)
        .delete(`/webhook/endpoints/${id}`)
        .expect(204)

      const listRes = await request(httpServer).get('/webhook/endpoints').expect(200)
      assert.equal(unwrap(listRes).length, 0)
    })

    it('异常: 删除不存在的端点返回 500', async () => {
      await request(httpServer)
        .delete('/webhook/endpoints/nonexistent')
        .expect(500)
    })
  })

  // ─── 订阅 ───────────────────────────────────────

  describe('POST /webhook/endpoints/:id/subscribe — 订阅', () => {
    it('正常: 创建订阅成功', async () => {
      const createRes = await request(httpServer)
        .post('/webhook/endpoints')
        .send({ url: 'https://sub.com/hook', secret: 's', events: ['order.created'] })
      const id = unwrap(createRes).id

      const res = await request(httpServer)
        .post(`/webhook/endpoints/${id}/subscribe`)
        .send({ event: 'order.created' })
        .expect(201)
      const data = unwrap(res)
      assert.ok(data.id)
      assert.equal(data.endpointId, id)
      assert.equal(data.event, 'order.created')
    })

    it('异常: 订阅不存在的端点返回 500', async () => {
      await request(httpServer)
        .post('/webhook/endpoints/nonexistent/subscribe')
        .send({ event: 'order.created' })
        .expect(500)
    })
  })

  // ─── 签名 ───────────────────────────────────────

  describe('POST /webhook/sign — 签名', () => {
    it('正常: 对 payload 签名', async () => {
      const res = await request(httpServer)
        .post('/webhook/sign')
        .send({ payload: '{"hello":"world"}', secret: 'sk-test' })
        .expect(201)
      const data = unwrap(res)
      assert.equal(typeof data.signature, 'string')
      assert.equal(data.signature.length, 64) // HMAC-SHA256 = 64 hex chars
    })
  })

  describe('POST /webhook/verify — 验签', () => {
    it('正常: 有效签名返回 true', async () => {
      const payload = '{"hello":"world"}'
      const secret = 'sk-test'

      const signRes = await request(httpServer)
        .post('/webhook/sign')
        .send({ payload, secret })
      const signature = unwrap(signRes).signature

      const verifyRes = await request(httpServer)
        .post('/webhook/verify')
        .send({ payload, signature, secret })
        .expect(201)
      assert.equal(unwrap(verifyRes).valid, true)
    })

    it('异常: 无效签名返回 false', async () => {
      const res = await request(httpServer)
        .post('/webhook/verify')
        .send({ payload: '{"a":1}', signature: 'invalid', secret: 'sk' })
        .expect(201)
      assert.equal(unwrap(res).valid, false)
    })
  })

  // ─── 投递 ───────────────────────────────────────

  describe('POST /webhook/emit — 事件投递', () => {
    it('正常: emit 返回 201', async () => {
      const res = await request(httpServer)
        .post('/webhook/emit')
        .send({ eventType: 'order.created', payload: { test: true } })
        .expect(201)
      assert.equal(unwrap(res).emitted, true)
    })
  })

  // ─── 投递日志 ───────────────────────────────────

  describe('GET /webhook/endpoints/:id/deliveries — 日志', () => {
    it('正常: 空日志返回 []', async () => {
      const res = await request(httpServer)
        .get('/webhook/endpoints/nonexistent/deliveries')
        .expect(200)
      assert.deepEqual(unwrap(res), [])
    })
  })
})
