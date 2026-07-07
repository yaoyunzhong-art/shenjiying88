import { describe, it, expect, beforeEach, vi } from 'vitest'
import assert from 'node:assert/strict'
/**
 * 🐜 自动: [webhook] [C] 角色测试
 *
 * 8 角色视角的 webhook 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { WebhookController } from './webhook.controller'
import { WebhookService, type WebhookEventType } from './webhook.service'
import { webhookEventBus } from './webhook.eventbus'
import type { CreateWebhookRequest } from './webhook.dto'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function createController() {
  const service = new WebhookService()
  // Mock HTTP client so we don't make real network calls
  service.setHttpClient({
    post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }),
  } as any)
  return { controller: new WebhookController(service), service }
}

const defaultCreate: CreateWebhookRequest = {
  url: 'https://hooks.example.com/notify',
  secret: 'store-secret-001',
  events: ['order.created', 'order.paid'],
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} webhook 角色测试`, () => {
  it('店长创建 webhook 端点用于接收订单通知（管理决策辅助）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://hooks.example.com/store',
      secret: 'store-mgr-key',
      events: ['order.created', 'order.paid', 'order.refunded'],
    })
    assert.ok(ep)
    assert.ok(ep.id)
    assert.equal(ep.url, 'https://hooks.example.com/store')
    assert.deepEqual(ep.events, ['order.created', 'order.paid', 'order.refunded'])
    assert.equal(ep.active, true)
    assert.ok(ep.createdAt instanceof Date)
  })

  it('店长查看所有已注册的 webhook 端点', async () => {
    const { controller } = createController()
    await controller.create(defaultCreate)
    await controller.create({
      url: 'https://hooks.example.com/analytics',
      secret: 'ana-key',
      events: ['inventory.low', 'inventory.out'],
    })

    const list = await controller.list()
    assert.equal(list.length, 2)
    const urls = list.map((ep: any) => ep.url)
    assert.ok(urls.includes('https://hooks.example.com/notify'))
    assert.ok(urls.includes('https://hooks.example.com/analytics'))
  })

  it('店长查询不存在的 webhook 端点应返回 null（边界）', async () => {
    const { controller } = createController()
    const result = await controller.getById('non-existent-id')
    assert.equal(result, null)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} webhook 角色测试`, () => {
  it('前台创建一个支付相关的 webhook（顾客下单通知）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://pos.example.com/payment-alert',
      secret: 'pos-secret',
      events: ['order.paid'],
    })
    assert.ok(ep)
    assert.equal(ep.url, 'https://pos.example.com/payment-alert')
    assert.deepEqual(ep.events, ['order.paid'])
  })

  it('前台测试 webhook 发送普通事件', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const result = await controller.test(ep.id, {
      eventType: 'order.created',
    })
    assert.ok(result)
    assert.equal(result.emitted, true)
    assert.equal(result.endpointId, ep.id)
  })

  it('前台测试不存在的端点时返回错误信息（边界）', async () => {
    const { controller } = createController()
    const result = await controller.test('bad-id', {
      eventType: 'order.created',
    })
    assert.equal(result.error, 'endpoint not found')
    assert.equal(result.id, 'bad-id')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} webhook 角色测试`, () => {
  it('HR 创建 webhook 接收员工注册通知（员工关怀场景）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://hr.example.com/new-user',
      secret: 'hr-secret-2024',
      events: ['user.registered', 'user.upgraded'],
    })
    assert.equal(ep.url, 'https://hr.example.com/new-user')
    assert.deepEqual(ep.events, ['user.registered', 'user.upgraded'])
  })

  it('HR 更新现有 webhook 配置', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)

    const updated = await controller.update(ep.id, {
      url: 'https://hr.example.com/new-url',
      events: ['user.registered'],
    })
    assert.equal(updated.url, 'https://hr.example.com/new-url')
    assert.deepEqual(updated.events, ['user.registered'])
  })

  it('HR 更新不存在的端点应报错（权限边界）', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => controller.update('fake-id', { url: 'https://evil.com' }),
      /Endpoint fake-id not found/,
    )
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} webhook 角色测试`, () => {
  it('安监验证 webhook 签名机制正确（数据完整性监督）', async () => {
    const { service } = createController()
    const payload = '{"alert":"fire detected"}'
    const sig = service.signPayload(payload, 'security-key')

    assert.ok(sig)
    assert.equal(typeof sig, 'string')
    assert.equal(sig.length, 64) // SHA256 hex

    // 验证签名
    assert.equal(service.verifySignature(payload, sig, 'security-key'), true)
    // 错误密钥应拒绝
    assert.equal(service.verifySignature(payload, sig, 'wrong-key'), false)
  })

  it('安监检查 webhook 端点事件列表只包含合法事件类型', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const validTypes = [
      'order.created', 'order.paid', 'order.refunded',
      'points.earned', 'points.redeemed', 'points.adjusted',
      'coupon.issued', 'coupon.used', 'coupon.expired',
      'inventory.low', 'inventory.out', 'inventory.restock',
      'user.registered', 'user.upgraded',
    ]
    for (const event of ep.events) {
      assert.ok(validTypes.includes(event), `事件类型 ${event} 应在白名单中`)
    }

    // 查看内置事件列表
    const events = await controller.getEvents()
    assert.ok(events.items)
    assert.equal(events.items.length, 9)
  })

  it('安监删除无效/过期 webhook 端点（边界：清理废弃配置）', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    // 删除端点
    await controller.delete(ep.id)
    // 确认已删除
    const result = await controller.getById(ep.id)
    assert.equal(result, null)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} webhook 角色测试`, () => {
  it('导玩员创建积分变动 webhook（顾客积分提醒）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://game.example.com/points-alert',
      secret: 'game-points-key',
      events: ['points.earned', 'points.redeemed', 'points.adjusted'],
    })
    assert.equal(ep.url, 'https://game.example.com/points-alert')
    assert.equal(ep.events.length, 3)
  })

  it('导玩员发送测试 webhook 验证积分事件', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const result = await controller.test(ep.id, {
      eventType: 'points.earned',
      customPayload: { userId: 'gamer-001', points: 500, game: '投篮机' },
    })
    assert.equal(result.emitted, true)
    assert.equal(result.eventType, 'points.earned')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} webhook 角色测试`, () => {
  it('运行专员创建库存监控 webhook（运营保障场景）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://ops.example.com/inventory-alert',
      secret: 'ops-inv-key',
      events: ['inventory.low', 'inventory.out', 'inventory.restock'],
    })
    assert.equal(ep.url, 'https://ops.example.com/inventory-alert')
    assert.deepEqual(ep.events, ['inventory.low', 'inventory.out', 'inventory.restock'])
  })

  it('运行专员查看 webhook 投递日志', async () => {
    const { controller, service } = createController()
    const ep = await controller.create(defaultCreate)

    // 订阅并发送事件
    await service.subscribe(ep.id, 'order.created')
    await service.emit('order.created', { orderId: 'ops-001' })

    // 等待异步投递
    await vi.waitFor(async () => {
      const deliveries = await controller.listDeliveries(ep.id)
      expect(deliveries.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 2000 })

    const deliveries = await controller.listDeliveries(ep.id)
    assert.ok(deliveries.length >= 1)
    assert.equal(deliveries[0].event, 'order.created')
  })

  it('运行专员查看无投递记录的端点返回空数组（边界）', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const deliveries = await controller.listDeliveries(ep.id)
    assert.ok(Array.isArray(deliveries))
    assert.equal(deliveries.length, 0)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} webhook 角色测试`, () => {
  it('团建创建活动通知 webhook（团队活动场景）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://team.example.com/event-notify',
      secret: 'team-event-key',
      events: ['order.created', 'points.earned'],
    })
    assert.equal(ep.url, 'https://team.example.com/event-notify')
    assert.equal(ep.events.length, 2)
  })

  it('团建修改现有 webhook 端点的 URL（活动信息变更）', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const updated = await controller.update(ep.id, {
      url: 'https://team.example.com/new-event-notify',
    })
    assert.equal(updated.url, 'https://team.example.com/new-event-notify')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} webhook 角色测试`, () => {
  it('营销创建优惠券相关 webhook（营销活动场景）', async () => {
    const { controller } = createController()
    const ep = await controller.create({
      url: 'https://mkt.example.com/coupon-track',
      secret: 'mkt-coupon-key',
      events: ['coupon.issued', 'coupon.used', 'coupon.expired'],
    })
    assert.equal(ep.url, 'https://mkt.example.com/coupon-track')
    assert.equal(ep.events.length, 3)
  })

  it('营销发送测试事件验证优惠券下发流程', async () => {
    const { controller } = createController()
    const ep = await controller.create(defaultCreate)
    const testResult = await controller.test(ep.id, {
      eventType: 'coupon.issued',
      customPayload: { couponId: 'cpn-888', campaign: '双十一', discount: 30 },
    })
    assert.equal(testResult.emitted, true)
    assert.equal(testResult.eventType, 'coupon.issued')
  })

  it('营销通过内部事件总线发送 webhook 事件（边界：缺少 tenantId）', async () => {
    const { controller } = createController()
    const result = await controller.emitInternal({
      eventType: 'insight.generated',
      data: { insight: 'test' } as any,
    })
    assert.equal(result.error, 'data.tenantId required')
  })
})
