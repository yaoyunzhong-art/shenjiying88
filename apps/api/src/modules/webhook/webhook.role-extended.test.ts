import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WebhookService } from './webhook.service'
import { WebhookController } from './webhook.controller'

/**
 * 🐜 [webhook] 角色扩展测试
 * 覆盖 webhook 创建、更新、删除、事件发送边界场景
 */

function setup() {
  const service = new WebhookService()
  service.setHttpClient({
    post: vi.fn().mockResolvedValue({ status: 200, body: 'ok' }),
  } as any)
  const controller = new WebhookController(service)
  return { service, controller }
}

describe('👔店长 webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('创建并列出多个 webhook', async () => {
    await svc.controller.create({ url: 'https://hook1.example.com', secret: 's1', events: ['order.created'] })
    await svc.controller.create({ url: 'https://hook2.example.com', secret: 's2', events: ['order.paid'] })
    const list = await svc.controller.list()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('查询不存在的 webhook 返回 null', async () => {
    const result = await svc.controller.getById('no-such')
    expect(result).toBeNull()
  })
})

describe('🛒前台 webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('创建并测试 webhook 发送', async () => {
    const ep = await svc.controller.create({ url: 'https://test.example.com', secret: 'sec', events: ['order.created'] })
    const result = await svc.controller.test(ep.id, { eventType: 'order.created' })
    expect(result.emitted).toBe(true)
  })

  it('测试不存在的端点返回错误', async () => {
    const result = await svc.controller.test('bad-id', { eventType: 'order.created' })
    expect(result.error).toBe('endpoint not found')
  })
})

describe('👥HR webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('更新 webhook 配置', async () => {
    const ep = await svc.controller.create({ url: 'https://hr.example.com', secret: 's', events: ['user.registered'] })
    const updated = await svc.controller.update(ep.id, { url: 'https://hr-new.example.com', events: ['user.upgraded'] })
    expect(updated.url).toBe('https://hr-new.example.com')
    expect(updated.events).toEqual(['user.upgraded'])
  })

  it('更新不存在的端点应报错', async () => {
    await expect(svc.controller.update('fake', { url: 'https://evil.com' })).rejects.toThrow()
  })
})

describe('🔧安监 webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('验证签名机制', () => {
    const payload = 'test payload'
    const sig = svc.service.signPayload(payload, 'my-key')
    expect(sig).toBeTruthy()
    expect(sig.length).toBe(64)
    expect(svc.service.verifySignature(payload, sig, 'my-key')).toBe(true)
    expect(svc.service.verifySignature(payload, sig, 'wrong-key')).toBe(false)
  })

  it('删除 webhook 端点', async () => {
    const ep = await svc.controller.create({ url: 'https://del.example.com', secret: 's', events: ['order.created'] })
    await svc.controller.delete(ep.id)
    const result = await svc.controller.getById(ep.id)
    expect(result).toBeNull()
  })
})

describe('🎯运行专员 webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('查看投递日志', async () => {
    const ep = await svc.controller.create({ url: 'https://ops.example.com', secret: 's', events: ['order.created'] })
    await svc.service.subscribe(ep.id, 'order.created')
    await svc.service.emit('order.created', { orderId: 'o1' })
    const deliveries = await vi.waitFor(async () => {
      const d = await svc.controller.listDeliveries(ep.id)
      return d
    }, { timeout: 1500 })
    expect(deliveries.length).toBeGreaterThanOrEqual(1)
  })

  it('查看空投递返回空数组', async () => {
    const ep = await svc.controller.create({ url: 'https://empty.example.com', secret: 's', events: ['order.created'] })
    const deliveries = await svc.controller.listDeliveries(ep.id)
    expect(deliveries).toEqual([])
  })
})

describe('📢营销 webhook 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('获取支持的事件类型列表', async () => {
    const events = await svc.controller.getEvents()
    expect(events.items).toBeDefined()
    expect(events.items.length).toBeGreaterThan(0)
  })

  it('内部事件发送缺少 tenantId 返回错误', async () => {
    const result = await svc.controller.emitInternal({
      eventType: 'insight.generated',
      data: { insight: 'test' },
    })
    expect(result.error).toContain('tenantId')
  })
})
