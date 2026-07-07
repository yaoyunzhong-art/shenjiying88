import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * WebhookController 单元测试 (node:test)
 *
 * 策略: 构造 Controller + Mock WebhookService 实例
 * 覆盖: 所有 10 个路由端点（正向 + 边界 + 错误）
 *
 * 路由:
 * - POST   /webhook/endpoints            创建 webhook
 * - GET    /webhook/endpoints            列表查询
 * - GET    /webhook/endpoints/:id        按 ID 查询
 * - PATCH  /webhook/endpoints/:id        更新
 * - DELETE /webhook/endpoints/:id        删除
 * - POST   /webhook/endpoints/:id/test   测试发送
 * - GET    /webhook/deliveries           投递记录列表
 * - POST   /webhook/deliveries/:id/retry 重试投递
 * - GET    /webhook/events               事件列表
 * - POST   /webhook/internal/emit        内部事件发射
 */

import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ── Mock WebhookService ──────────────────────────────────────────
class MockWebhookService {
  endpoints: Map<string, any> = new Map()
  deliveries: Map<string, any> = new Map()
  nextSeq = 0

  async create(body: any) {
    if (!body.url || !body.secret) {
      const err: any = new Error('url and secret are required')
      err.status = 400
      throw err
    }
    if (!body.events || body.events.length === 0) {
      const err: any = new Error('At least one event subscription is required')
      err.status = 400
      throw err
    }
    const id = `wh-mock-${++this.nextSeq}`
    const ep = {
      id,
      tenantId: 'tenant-001',
      name: body.name,
      platform: body.platform,
      url: body.url,
      events: body.events,
      status: 'active',
      maxRetries: body.maxRetries ?? 3,
      description: body.description,
      headers: body.headers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'mock-tester',
      secretFingerprint: 'mo***ck',
    }
    this.endpoints.set(id, ep)
    return ep
  }

  async list(req: any) {
    let items = Array.from(this.endpoints.values())
    if (req.status) items = items.filter((e: any) => e.status === req.status)
    if (req.platform) items = items.filter((e: any) => e.platform === req.platform)
    items.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    const limit = Math.min(req.limit ?? 20, 100)
    const startIdx = req.cursor ? Number(req.cursor) : 0
    const paged = items.slice(startIdx, startIdx + limit)
    return {
      items: paged,
      total: items.length,
      nextCursor: startIdx + limit < items.length ? String(startIdx + limit) : undefined,
    }
  }

  async getById(id: string) {
    const ep = this.endpoints.get(id)
    if (!ep) {
      const err: any = new Error(`Webhook ${id} not found`)
      err.status = 404
      throw err
    }
    return ep
  }

  async update(id: string, req: any) {
    const ep = this.endpoints.get(id)
    if (!ep) {
      const err: any = new Error(`Webhook ${id} not found`)
      err.status = 404
      throw err
    }
    if (req.name !== undefined) ep.name = req.name
    if (req.status !== undefined) ep.status = req.status
    if (req.events !== undefined) ep.events = req.events
    ep.updatedAt = new Date().toISOString()
    return ep
  }

  async delete(id: string) {
    const ep = this.endpoints.get(id)
    if (!ep) {
      const err: any = new Error(`Webhook ${id} not found`)
      err.status = 404
      throw err
    }
    this.endpoints.delete(id)
  }

  async testSend(id: string, req: any) {
    const ep = this.endpoints.get(id)
    if (!ep) {
      const err: any = new Error(`Webhook ${id} not found`)
      err.status = 404
      throw err
    }
    const deliveryId = `whd-mock-${++this.nextSeq}`
    const delivery = {
      id: deliveryId,
      endpointId: id,
      eventType: req.eventType,
      status: 'success',
      attempt: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      durationMs: 120,
    }
    this.deliveries.set(deliveryId, delivery)
    return delivery
  }

  async listDeliveries(req: any) {
    let items = Array.from(this.deliveries.values())
    if (req.endpointId) items = items.filter((d: any) => d.endpointId === req.endpointId)
    if (req.status) items = items.filter((d: any) => d.status === req.status)
    items.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    const limit = Math.min(req.limit ?? 20, 100)
    return { items: items.slice(0, limit), total: items.length }
  }

  async retry(deliveryId: string) {
    const dlv = this.deliveries.get(deliveryId)
    if (!dlv) {
      const err: any = new Error(`Delivery ${deliveryId} not found`)
      err.status = 404
      throw err
    }
    const newDelivery = {
      ...dlv,
      id: `whd-mock-${++this.nextSeq}`,
      status: 'success',
      attempt: dlv.attempt + 1,
      durationMs: 85,
    }
    this.deliveries.set(newDelivery.id, newDelivery)
    return newDelivery
  }

  async countEndpoints() {
    return this.endpoints.size
  }
  async countDeliveries() {
    return this.deliveries.size
  }
}

// ── Helper: 构造 Controller ──
async function createController() {
  const mockService = new MockWebhookService()
  // 验证Controller文件存在
  const controllerPath = resolve(__dirname, './webhook.controller.ts')
  if (!existsSync(controllerPath)) {
    throw new Error('WebhookController file not found')
  }
  try {
    // 尝试动态导入 WebhookController
    const { WebhookController } = await import('./webhook.controller')
    return { controller: new WebhookController(mockService as any), service: mockService }
  } catch (e) {
    // 如果导入失败，使用文件验证
    return { controller: null, service: mockService, validated: true }
  }
}

describe('WebhookController', () => {
  let controller: any
  let service: MockWebhookService

  beforeEach(async () => {
    const ctx = await createController()
    controller = ctx.controller
    service = ctx.service
  })

  // ───── POST /webhook/endpoints ─────
  describe('create — POST /webhook/endpoints', () => {
    it('should create a webhook endpoint successfully', async () => {
      const result = await controller.create({
        name: '测试飞书通知',
        platform: 'feishu',
        url: 'https://open.feishu.cn/open-apis/bot/v2/hook/abc123',
        secret: 'sk-test-secret-001',
        events: ['license.expired', 'canary.created'],
        maxRetries: 5,
        description: '测试用 webhook',
      })
      assert.ok(result.id, 'should return an id')
      assert.equal(result.platform, 'feishu')
      assert.equal(result.status, 'active')
      assert.equal(result.name, '测试飞书通知')
    })

    it('should fail when url is missing', async () => {
      await assert.rejects(
        () =>
          controller.create({
            name: 'bad',
            platform: 'generic',
            secret: 's',
            events: ['insight.generated'],
          }),
        (err: any) => err.status === 400,
      )
    })

    it('should fail when secret is missing', async () => {
      await assert.rejects(
        () =>
          controller.create({
            name: 'bad',
            platform: 'generic',
            url: 'https://example.com/hook',
            events: ['insight.generated'],
          }),
        (err: any) => err.status === 400,
      )
    })

    it('should fail when events array is empty', async () => {
      await assert.rejects(
        () =>
          controller.create({
            name: 'bad',
            platform: 'generic',
            url: 'https://example.com/hook',
            secret: 's',
            events: [],
          }),
        (err: any) => err.status === 400,
      )
    })

    it('should default maxRetries to 3 when not provided', async () => {
      const result = await controller.create({
        name: '默认重试',
        platform: 'dingtalk',
        url: 'https://oapi.dingtalk.com/robot/send?access_token=abc',
        secret: 'sk-default',
        events: ['monitoring.alert.fired'],
      })
      assert.equal(result.maxRetries, 3)
    })
  })

  // ───── GET /webhook/endpoints ─────
  describe('list — GET /webhook/endpoints', () => {
    it('should return empty list when no endpoints exist', async () => {
      const result = await controller.list({})
      assert.deepEqual(result.items, [])
      assert.equal(result.total, 0)
    })

    it('should list all endpoints after creation', async () => {
      await controller.create({
        name: 'A', platform: 'generic', url: 'https://a.com/hook', secret: 's1',
        events: ['license.expired'],
      })
      await controller.create({
        name: 'B', platform: 'feishu', url: 'https://open.feishu.cn/hook', secret: 's2',
        events: ['canary.created', 'canary.promoted'],
      })
      const result = await controller.list({})
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('should filter by status', async () => {
      const epA = await controller.create({
        name: 'A', platform: 'generic', url: 'https://a.com/hook', secret: 's1',
        events: ['license.expired'],
      })
      // 手动改状态
      const ep = service.endpoints.get(epA.id)
      ep.status = 'paused'

      const active = await controller.list({ status: 'active' })
      assert.equal(active.total, 0)

      const paused = await controller.list({ status: 'paused' })
      assert.equal(paused.total, 1)
    })

    it('should filter by platform', async () => {
      await controller.create({
        name: 'A', platform: 'generic', url: 'https://a.com/hook', secret: 's1',
        events: ['license.expired'],
      })
      await controller.create({
        name: 'B', platform: 'feishu', url: 'https://open.feishu.cn/hook', secret: 's2',
        events: ['canary.created'],
      })
      const feishu = await controller.list({ platform: 'feishu' })
      assert.equal(feishu.total, 1)
      assert.equal(feishu.items[0].platform, 'feishu')
    })

    it('should paginate with cursor', async () => {
      for (let i = 0; i < 5; i++) {
        await controller.create({
          name: `EP-${i}`, platform: 'generic', url: `https://e${i}.com/hook`, secret: 's',
          events: ['license.expired'],
        })
      }
      const page1 = await controller.list({ limit: 2 })
      assert.equal(page1.items.length, 2)
      assert.ok(page1.nextCursor)

      const page2 = await controller.list({ limit: 2, cursor: page1.nextCursor })
      assert.equal(page2.items.length, 2)
    })
  })

  // ───── GET /webhook/endpoints/:id ─────
  describe('getById — GET /webhook/endpoints/:id', () => {
    it('should get endpoint by id', async () => {
      const created = await controller.create({
        name: '详情', platform: 'generic', url: 'https://d.com/hook', secret: 's',
        events: ['tenant.config.updated'],
      })
      const found = await controller.getById(created.id)
      assert.equal(found.id, created.id)
      assert.equal(found.name, '详情')
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.getById('wh-nonexistent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── PATCH /webhook/endpoints/:id ─────
  describe('update — PATCH /webhook/endpoints/:id', () => {
    it('should update endpoint name and status', async () => {
      const created = await controller.create({
        name: '旧的', platform: 'generic', url: 'https://u.com/hook', secret: 's',
        events: ['license.expired'],
      })
      const updated = await controller.update(created.id, {
        name: '新的名字',
        status: 'paused',
      })
      assert.equal(updated.name, '新的名字')
      assert.equal(updated.status, 'paused')
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.update('wh-nonexistent', { name: 'nope' }),
        (err: any) => err.status === 404,
      )
    })

    it('should allow partial update (only events)', async () => {
      const created = await controller.create({
        name: '部分更新', platform: 'generic', url: 'https://p.com/hook', secret: 's',
        events: ['license.expired'],
      })
      const updated = await controller.update(created.id, {
        events: ['canary.created', 'insight.generated'],
      })
      assert.deepEqual(updated.events, ['canary.created', 'insight.generated'])
    })
  })

  // ───── DELETE /webhook/endpoints/:id ─────
  describe('delete — DELETE /webhook/endpoints/:id', () => {
    it('should delete endpoint successfully', async () => {
      const created = await controller.create({
        name: '待删', platform: 'generic', url: 'https://del.com/hook', secret: 's',
        events: ['license.expired'],
      })
      await controller.delete(created.id)
      // 再查应当 404
      await assert.rejects(
        () => controller.getById(created.id),
        (err: any) => err.status === 404,
      )
    })

    it('should throw 404 for non-existent id', async () => {
      await assert.rejects(
        () => controller.delete('wh-nonexistent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── POST /webhook/endpoints/:id/test ─────
  describe('testSend — POST /webhook/endpoints/:id/test', () => {
    it('should send test delivery and return result', async () => {
      const created = await controller.create({
        name: '测试发送', platform: 'generic', url: 'https://t.com/hook', secret: 's',
        events: ['license.expired'],
      })
      const result = await controller.test(created.id, {
        eventType: 'license.expired',
        customPayload: { test: true, from: 'spec' },
      })
      assert.ok(result.id, 'should have delivery id')
      assert.equal(result.status, 'success')
      assert.equal(result.eventType, 'license.expired')
      assert.ok(result.durationMs >= 0)
    })

    it('should throw 404 for non-existent endpoint', async () => {
      await assert.rejects(
        () => controller.test('wh-nonexistent', { eventType: 'license.expired' }),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── GET /webhook/deliveries ─────
  describe('listDeliveries — GET /webhook/deliveries', () => {
    it('should return empty list when no deliveries', async () => {
      const result = await controller.listDeliveries({})
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })

    it('should list deliveries after test sends', async () => {
      const ep = await controller.create({
        name: '投递源', platform: 'generic', url: 'https://dlv.com/hook', secret: 's',
        events: ['license.expired'],
      })
      await controller.test(ep.id, { eventType: 'license.expired' })
      await controller.test(ep.id, { eventType: 'license.expired' })

      const result = await controller.listDeliveries({})
      assert.equal(result.total, 2)
    })

    it('should filter deliveries by endpointId', async () => {
      const epA = await controller.create({
        name: 'A', platform: 'generic', url: 'https://a.com/hook', secret: 's',
        events: ['license.expired'],
      })
      const epB = await controller.create({
        name: 'B', platform: 'generic', url: 'https://b.com/hook', secret: 's',
        events: ['tenant.config.updated'],
      })
      await controller.test(epA.id, { eventType: 'license.expired' })
      await controller.test(epB.id, { eventType: 'tenant.config.updated' })

      const filtered = await controller.listDeliveries({ endpointId: epA.id })
      assert.equal(filtered.total, 1)
      assert.equal(filtered.items[0].endpointId, epA.id)
    })
  })

  // ───── POST /webhook/deliveries/:id/retry ─────
  describe('retry — POST /webhook/deliveries/:id/retry', () => {
    it('should retry a delivery and produce new delivery', async () => {
      const ep = await controller.create({
        name: '重试源', platform: 'generic', url: 'https://r.com/hook', secret: 's',
        events: ['license.expired'],
      })
      const sent = await controller.test(ep.id, { eventType: 'license.expired' })
      const retried = await controller.retry(sent.id)
      assert.ok(retried.id, 'should produce new delivery id')
      assert.notEqual(retried.id, sent.id)
    })

    it('should throw 404 for non-existent delivery', async () => {
      await assert.rejects(
        () => controller.retry('whd-nonexistent'),
        (err: any) => err.status === 404,
      )
    })
  })

  // ───── GET /webhook/events ─────
  describe('getEvents — GET /webhook/events', () => {
    it('should return builtin event list', async () => {
      const result = await controller.getEvents()
      assert.ok(Array.isArray(result.items))
      assert.ok(result.items.length >= 9, 'should have at least 9 builtin events')
      // 验证有 license.expired
      const hasLicenseEvent = result.items.some(
        (e: any) => e.type === 'license.expired',
      )
      assert.ok(hasLicenseEvent)
    })

    it('each event should have type, description, category', async () => {
      const result = await controller.getEvents()
      for (const ev of result.items) {
        assert.ok(typeof ev.type === 'string', 'type should be string')
        assert.ok(typeof ev.description === 'string', 'description should be string')
        assert.ok(typeof ev.category === 'string', 'category should be string')
      }
    })
  })

  // ───── POST /webhook/internal/emit ─────
  describe('emitInternal — POST /webhook/internal/emit', () => {
    it('should emit event when tenantId is provided in data', async () => {
      const result = await controller.emitInternal({
        eventType: 'license.expired',
        data: { tenantId: 't-001', storeId: 's-001' },
      })
      assert.ok(result.emitted)
      assert.equal(result.eventType, 'license.expired')
    })

    it('should return error when tenantId is missing', async () => {
      const result = await controller.emitInternal({
        eventType: 'license.expired',
        data: { storeId: 's-001' },
      })
      assert.equal(result.error, 'data.tenantId required')
    })

    it('should emit event with extra data fields', async () => {
      const result = await controller.emitInternal({
        eventType: 'monitoring.alert.fired',
        data: {
          tenantId: 't-002',
          alertName: 'CPU > 90%',
          severity: 'critical',
        },
      })
      assert.ok(result.emitted)
      assert.equal(result.eventType, 'monitoring.alert.fired')
    })
  })
})
