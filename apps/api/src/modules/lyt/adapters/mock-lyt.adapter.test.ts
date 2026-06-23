import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

describe('MockLytAdapter', () => {
   
  const { MockLytAdapter } = require('./mock-lyt.adapter')

  test('getMember returns member profile with input memberId', async () => {
    const adapter = new MockLytAdapter()
    const profile = await adapter.getMember('member-001')

    assert.equal(profile.memberId, 'member-001')
    assert.equal(profile.nickname, 'Mock Member')
    assert.equal(profile.levelName, 'SVIP Seed')
  })

  test('getMember returns profile for different memberId', async () => {
    const adapter = new MockLytAdapter()
    const profile = await adapter.getMember('member-xyz')

    assert.equal(profile.memberId, 'member-xyz')
  })

  test('createOrder computes totalAmount from items', async () => {
    const adapter = new MockLytAdapter()
    const payload = {
      items: [
        { quantity: 2, price: 100 },
        { quantity: 1, price: 200 }
      ]
    }

    const result = await adapter.createOrder(payload as any)

    assert.equal(result.totalAmount, 400)
    assert.equal(result.status, 'CREATED')
    assert.ok(result.orderId.startsWith('mock-'))
  })

  test('createOrder handles single item', async () => {
    const adapter = new MockLytAdapter()
    const payload = {
      items: [
        { quantity: 5, price: 50 }
      ]
    }

    const result = await adapter.createOrder(payload as any)

    assert.equal(result.totalAmount, 250)
    assert.equal(result.status, 'CREATED')
  })

  test('createOrder handles empty items as zero total', async () => {
    const adapter = new MockLytAdapter()
    const payload = { items: [] }

    const result = await adapter.createOrder(payload as any)

    assert.equal(result.totalAmount, 0)
    assert.equal(result.status, 'CREATED')
  })

  test('applyDiscount returns orderId and couponCode', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.applyDiscount('order-1', 'SAVE10')

    assert.equal(result.orderId, 'order-1')
    assert.equal(result.couponCode, 'SAVE10')
  })

  test('applyDiscount works with empty coupon code', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.applyDiscount('order-2', '')

    assert.equal(result.orderId, 'order-2')
    assert.equal(result.couponCode, '')
  })

  test('syncGateEvent returns accepted true with storeId', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.syncGateEvent('store-sh', 'pass-123')

    assert.equal(result.accepted, true)
    assert.equal(result.storeId, 'store-sh')
  })

  test('syncGateEvent ignores passCode', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.syncGateEvent('store-bj', 'any-pass-code')

    assert.equal(result.accepted, true)
    assert.equal(result.storeId, 'store-bj')
  })

  test('getDeviceStatus returns ONLINE status with deviceId', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.getDeviceStatus('device-42')

    assert.equal(result.deviceId, 'device-42')
    assert.equal(result.status, 'ONLINE')
  })

  test('getDeviceStatus returns ONLINE for any deviceId', async () => {
    const adapter = new MockLytAdapter()
    const result = await adapter.getDeviceStatus('offline-device-99')

    assert.equal(result.deviceId, 'offline-device-99')
    assert.equal(result.status, 'ONLINE')
  })
})
