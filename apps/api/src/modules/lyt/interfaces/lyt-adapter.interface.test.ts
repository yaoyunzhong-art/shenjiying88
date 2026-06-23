import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MockLytAdapter } from '../adapters/mock-lyt.adapter'

/**
 * Contract test for ILytAdapter interface.
 * Any ILytAdapter implementation must satisfy these contracts.
 */
describe('ILytAdapter contract', () => {
  const adapter = new MockLytAdapter()

  describe('getMember', () => {
    it('returns memberId matching the input', async () => {
      const profile = await adapter.getMember('mem-001')
      assert.equal(profile.memberId, 'mem-001')
    })

    it('returns nickname as a non-empty string', async () => {
      const profile = await adapter.getMember('mem-002')
      assert.equal(typeof profile.nickname, 'string')
      assert.ok(profile.nickname!.length > 0)
    })

    it('returns levelName as a non-empty string', async () => {
      const profile = await adapter.getMember('mem-003')
      assert.equal(typeof profile.levelName, 'string')
      assert.ok(profile.levelName!.length > 0)
    })
  })

  describe('createOrder', () => {
    it('returns orderId as string prefixed with mock-', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [{ skuId: 'sku-001', quantity: 1, price: 10 }] })
      assert.equal(typeof result.orderId, 'string')
      assert.ok(result.orderId.startsWith('mock-'))
    })

    it('returns totalAmount as a number', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [{ skuId: 'sku-002', quantity: 3, price: 20 }] })
      assert.equal(typeof result.totalAmount, 'number')
      assert.equal(result.totalAmount, 60)
    })

    it('returns status CREATED', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [] })
      assert.equal(result.status, 'CREATED')
    })
  })

  describe('applyDiscount', () => {
    it('returns the given orderId and couponCode', async () => {
      const result = await adapter.applyDiscount('ord-10', 'FLAT50')
      assert.equal(result.orderId, 'ord-10')
      assert.equal(result.couponCode, 'FLAT50')
    })
  })

  describe('syncGateEvent', () => {
    it('returns accepted true and the storeId', async () => {
      const result = await adapter.syncGateEvent('store-gz', 'code-xyz')
      assert.equal(result.accepted, true)
      assert.equal(result.storeId, 'store-gz')
    })
  })

  describe('getDeviceStatus', () => {
    it('returns deviceId and ONLINE status', async () => {
      const result = await adapter.getDeviceStatus('dev-88')
      assert.equal(result.deviceId, 'dev-88')
      assert.equal(result.status, 'ONLINE')
    })
  })
})
