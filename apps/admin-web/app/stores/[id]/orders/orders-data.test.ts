import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  DEFAULT_STORE_ORDERS,
  loadStoreOrdersSnapshot,
} from './orders-data'

const originalFetch = globalThis.fetch
const originalApiBaseUrl = process.env.M5_API_BASE_URL

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalApiBaseUrl === undefined) {
    delete process.env.M5_API_BASE_URL
  } else {
    process.env.M5_API_BASE_URL = originalApiBaseUrl
  }
})

describe('store-orders-data', () => {
  it('优先映射真实交易接口并汇总门店维度统计', async () => {
    process.env.M5_API_BASE_URL = 'http://orders-service'

    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      calls.push(url)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                orderId: 'txn-9001',
                orderNo: 'ORD-9001',
                customerName: '赵一',
                customerPhone: '13800001111',
                items: [{ title: '包厢 2h' }, { title: '饮品 x2' }],
                totalAmount: 16800,
                paidAmount: 16800,
                paymentMethod: 'wechat_pay',
                status: 'paid',
                channel: 'miniapp',
                createdAt: '2026-07-26T11:00:00.000Z',
                updatedAt: '2026-07-26T11:05:00.000Z',
                storeId: 'store-001',
              },
              {
                orderId: 'txn-9002',
                orderNo: 'ORD-9002',
                customerName: '钱二',
                totalAmount: 8800,
                paidAmount: 0,
                paymentMethod: 'alipay',
                status: 'pending',
                channel: 'online',
                createdAt: '2026-07-26T10:00:00.000Z',
                updatedAt: '2026-07-26T10:00:00.000Z',
                storeId: 'store-001',
                itemSummary: '桌游套餐',
              },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }) as typeof fetch

    const snapshot = await loadStoreOrdersSnapshot('store-001')

    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.sourceLabel, 'store-orders-api')
    assert.equal(snapshot.orders.length, 2)
    assert.equal(snapshot.orders[0]?.method, '微信')
    assert.equal(snapshot.orders[0]?.status, 'completed')
    assert.equal(snapshot.orders[0]?.items, '包厢 2h、饮品 x2')
    assert.equal(snapshot.summary.total, 2)
    assert.equal(snapshot.summary.completed, 1)
    assert.equal(snapshot.summary.pending, 1)
    assert.equal(snapshot.summary.completedRevenue, 168)
    assert.deepEqual(calls, [
      'http://orders-service/api/v1/transactions?type=order&storeId=store-001',
    ])
  })

  it('接口失败时应回退到本地门店订单样本', async () => {
    process.env.M5_API_BASE_URL = 'http://orders-service'
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch

    const snapshot = await loadStoreOrdersSnapshot('store-001')

    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'store-orders-fallback')
    assert.deepEqual(snapshot.orders, DEFAULT_STORE_ORDERS)
    assert.equal(snapshot.summary.total, DEFAULT_STORE_ORDERS.length)
    assert.ok(snapshot.error?.includes('fallback'))
  })
})
