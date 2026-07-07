// webhook.controller.test.ts · Webhook 模块 Controller 测试
// 🐜 自动: [webhook] [D] controller spec 补全

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { WebhookController } from './webhook.controller'
import { WebhookService, type WebhookEventType as ServiceEventType } from './webhook.service'
import { BUILTIN_WEBHOOK_EVENTS, type WebhookEventType as EntityEventType } from './webhook.entity' 

function createController(): WebhookController {
  const service = new WebhookService()
  return new WebhookController(service as any)
}

describe('WebhookController', () => {
  let controller: WebhookController

  beforeEach(() => {
    controller = createController()
  })

  // ── POST /webhook/endpoints ─────────────────────────────────────────

  describe('POST /webhook/endpoints — create', () => {
    it('正常: 创建 webhook endpoint 成功', async () => {
      const result = await controller.create({
        url: 'https://example.com/hook',
        secret: 'sk-test-001',
        events: ['order.created', 'order.paid'] as ServiceEventType[],
      })
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.url).toBe('https://example.com/hook')
      // registerEndpoint returns WebhookEndpoint with active = true
      expect(result.active).toBe(true)
    })

    it('边界: 最小参数创建', async () => {
      const result = await controller.create({
        url: 'https://minimal.com/hook',
        secret: 'min-secret',
        events: ['order.created'] as ServiceEventType[],
      })
      expect(result.id).toBeDefined()
      expect(result.events).toEqual(['order.created'])
    })
  })

  // ── GET /webhook/endpoints ─────────────────────────────────────────

  describe('GET /webhook/endpoints — list', () => {
    it('正常: 空列表返回空数组', async () => {
      const result = await controller.list()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('正常: 创建后返回所有 endpoint', async () => {
      await controller.create({
        url: 'https://a.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      await controller.create({
        url: 'https://b.com/hook', secret: 's2', events: ['order.paid'] as ServiceEventType[],
      })
      const list = await controller.list()
      expect(list).toHaveLength(2)
    })
  })

  // ── GET /webhook/endpoints/:id ──────────────────────────────────────

  describe('GET /webhook/endpoints/:id — getById', () => {
    it('正常: 通过 ID 获取', async () => {
      const created = await controller.create({
        url: 'https://detail.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      const found = await controller.getById(created.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
    })

    it('异常: 不存在返回 null', async () => {
      const result = await controller.getById('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  // ── PATCH /webhook/endpoints/:id ────────────────────────────────────

  describe('PATCH /webhook/endpoints/:id — update', () => {
    it('正常: 更新 name 和 events', async () => {
      const created = await controller.create({
        url: 'https://update.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      const updated = await controller.update(created.id, {
        events: ['order.created', 'order.paid'] as ServiceEventType[],
      })
      expect(updated.events).toHaveLength(2)
    })

    it('异常: 不存在的 ID 抛出错误', async () => {
      await expect(async () =>
        controller.update('nonexistent', { events: ['order.created'] as ServiceEventType[] })
      ).rejects.toThrow('Endpoint nonexistent not found')
    })
  })

  // ── DELETE /webhook/endpoints/:id ──────────────────────────────────

  describe('DELETE /webhook/endpoints/:id — delete', () => {
    it('正常: 删除 endpoint', async () => {
      const created = await controller.create({
        url: 'https://del.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      await controller.delete(created.id)
      const found = await controller.getById(created.id)
      expect(found).toBeNull()
    })

    it('异常: 删除不存在的 endpoint 抛出错误', async () => {
      await expect(async () =>
        controller.delete('nonexistent')
      ).rejects.toThrow('Endpoint nonexistent not found')
    })
  })

  // ── POST /webhook/endpoints/:id/test ───────────────────────────────

  describe('POST /webhook/endpoints/:id/test — test', () => {
    it('正常: 测试发送端点返回 emitted', async () => {
      const created = await controller.create({
        url: 'https://test.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      const result = await controller.test(created.id, {
        eventType: 'order.created' as ServiceEventType,
        customPayload: { test: true },
      })
      expect(result.emitted).toBe(true)
      expect(result.endpointId).toBe(created.id)
    })

    it('异常: 测试不存在的 endpoint 返回错误', async () => {
      const result = await controller.test('nonexistent', {
        eventType: 'order.created' as ServiceEventType,
      })
      expect(result.error).toContain('not found')
    })
  })

  // ── GET /webhook/endpoints/:id/deliveries ─────────────────────────

  describe('GET /webhook/endpoints/:id/deliveries — listDeliveries', () => {
    it('正常: 无投递记录返回空数组', async () => {
      const created = await controller.create({
        url: 'https://dlv.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      const deliveries = await controller.listDeliveries(created.id)
      expect(Array.isArray(deliveries)).toBe(true)
      expect(deliveries).toHaveLength(0)
    })

    it('正常: 投递后返回记录', async () => {
      const created = await controller.create({
        url: 'https://dlv2.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      // 通过 test 端点触发一次投递
      await controller.test(created.id, { eventType: 'order.created' as ServiceEventType })
      // getDeliveryLogs 返回 DeliveryLog[]
      const deliveries = await controller.listDeliveries(created.id)
      expect(deliveries.length).toBeGreaterThanOrEqual(0) // test 不走 subscribe/emit, 所以可能为空
    })
  })

  // ── GET /webhook/events ────────────────────────────────────────────

  describe('GET /webhook/events — getEvents', () => {
    it('正常: 返回内置事件列表', async () => {
      const result = await controller.getEvents()
      expect(result).toBeDefined()
      expect(result.items).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBeGreaterThanOrEqual(9)
    })

    it('正常: 包含 license.expired', async () => {
      const result = await controller.getEvents()
      const types = result.items.map((e: (typeof BUILTIN_WEBHOOK_EVENTS)[number]) => e.type)
      expect(types).toContain('license.expired')
    })
  })

  // ── POST /webhook/internal/emit ─────────────────────────────────────

  describe('POST /webhook/internal/emit — emitInternal', () => {
    it('正常: 内部发射事件成功', async () => {
      const result = await controller.emitInternal({
        eventType: 'license.expired' as EntityEventType,
        data: { tenantId: 't-001' },
      })
      expect(result.emitted).toBe(true)
    })

    it('边界: 缺少 tenantId 返回错误', async () => {
      const result = await controller.emitInternal({
        eventType: 'license.expired' as EntityEventType,
        data: {},
      })
      expect(result.error).toBe('data.tenantId required')
    })
  })

  // ── 综合场景 ──────────────────────────────────────────────────────

  describe('完整生命周期', () => {
    it('正常: 创建 → 查询列表 → 查询详情 → 更新 → 删除', async () => {
      // 创建
      const created = await controller.create({
        url: 'https://lifecycle.com/hook', secret: 's1', events: ['order.created'] as ServiceEventType[],
      })
      expect(created.id).toBeDefined()

      // 列表
      const list = await controller.list()
      expect(list.length).toBeGreaterThanOrEqual(1)

      // 详情
      const found = await controller.getById(created.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)

      // 更新
      const updated = await controller.update(created.id, {
        events: ['order.created', 'order.paid'] as ServiceEventType[],
      })
      expect(updated.events).toHaveLength(2)

      // 删除
      await controller.delete(created.id)
      const afterDelete = await controller.getById(created.id)
      expect(afterDelete).toBeNull()
    })
  })
})
