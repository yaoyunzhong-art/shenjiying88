import { describe, it, expect, beforeEach } from 'vitest'
import { OmnichannelService } from './omnichannel.service'

/**
 * 🐜 [omnichannel] 角色扩展测试
 * 覆盖全渠道订单、库存、会员同步边界场景
 */

function setup() {
  const svc = new OmnichannelService()
  return { svc }
}

describe('👔店长 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建跨渠道订单', () => {
    const order = svc.svc.createOrder({
      channel: 'online',
      items: [{ productId: 'p1', quantity: 2, price: 100 }],
      customerId: 'c1',
    })
    expect(order.orderId).toBeTruthy()
    expect(order.channel).toBe('online')
    expect(order.totalAmount).toBe(200)
  })

  it('查询订单详情', () => {
    const order = svc.svc.createOrder({ channel: 'pos', items: [{ productId: 'p1', quantity: 1, price: 50 }], customerId: 'c1' })
    const found = svc.svc.getOrder(order.orderId)
    expect(found).not.toBeNull()
    expect(found!.orderId).toBe(order.orderId)
  })

  it('查询不存在的订单返回 null', () => {
    expect(svc.svc.getOrder('no-such')).toBeNull()
  })
})

describe('🛒前台 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('跨渠道库存同步', () => {
    svc.svc.syncInventory('p1', 'store-1', 100)
    const stock = svc.svc.getInventory('p1', 'store-1')
    expect(stock).toBe(100)
  })

  it('多渠道库存汇总', () => {
    svc.svc.syncInventory('p1', 'online', 50)
    svc.svc.syncInventory('p1', 'store-1', 30)
    const total = svc.svc.getTotalInventory('p1')
    expect(total).toBe(80)
  })
})

describe('👥HR omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('跨渠道会员信息同步', () => {
    const member = svc.svc.syncMember({ externalId: 'wx-001', name: '张三', phone: '13800138000', channel: 'wechat' })
    expect(member.memberId).toBeTruthy()
    expect(member.name).toBe('张三')
  })

  it('按外部 ID 查询会员', () => {
    svc.svc.syncMember({ externalId: 'wx-002', name: '李四', phone: '13900139000', channel: 'wechat' })
    const found = svc.svc.getMemberByExternalId('wx-002', 'wechat')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('李四')
  })
})

describe('🎯运行专员 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('取消订单并验证状态', () => {
    const order = svc.svc.createOrder({ channel: 'online', items: [{ productId: 'p1', quantity: 1, price: 100 }], customerId: 'c1' })
    const cancelled = svc.svc.cancelOrder(order.orderId)
    expect(cancelled.status).toBe('cancelled')
  })

  it('取消已取消订单不报错', () => {
    const order = svc.svc.createOrder({ channel: 'pos', items: [{ productId: 'p1', quantity: 1, price: 100 }], customerId: 'c1' })
    svc.svc.cancelOrder(order.orderId)
    expect(() => svc.svc.cancelOrder(order.orderId)).not.toThrow()
  })
})

describe('📢营销 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('按渠道过滤订单', () => {
    svc.svc.createOrder({ channel: 'online', items: [{ productId: 'p1', quantity: 1, price: 100 }], customerId: 'c1' })
    svc.svc.createOrder({ channel: 'pos', items: [{ productId: 'p2', quantity: 2, price: 200 }], customerId: 'c2' })
    svc.svc.createOrder({ channel: 'mini-program', items: [{ productId: 'p3', quantity: 3, price: 300 }], customerId: 'c3' })
    const onlineOrders = svc.svc.getOrdersByChannel('online')
    expect(onlineOrders.length).toBeGreaterThanOrEqual(1)
    onlineOrders.forEach(o => expect(o.channel).toBe('online'))
  })
})
