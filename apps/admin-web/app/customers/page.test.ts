import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  computeCustomerStats,
  CUSTOMER_STATUSES,
  filterCustomers,
  formatCustomerCurrency,
  loadCustomersSnapshot,
  MEMBER_LEVELS,
} from './customers-data'

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = originalFetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('Customers snapshot contract', () => {
  it('应在 CRM API 可用时返回 api 快照与来源态证据', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('crm/customers')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              customers: [
                {
                  id: 'crm-001',
                  name: '张明',
                  phone: '138****0001',
                  status: 'active',
                  engagementScore: 92,
                  totalSpentCents: 888800,
                  visitCount: 18,
                  lastVisitAt: '2026-07-26T12:00:00.000Z',
                  createdAt: '2024-03-10T08:00:00.000Z',
                  tags: ['VIP'],
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      }

      if (url.includes('crm/stats')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              totalCustomers: 1,
              activeCustomers: 1,
              totalSpent: 888800,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      }

      throw new Error(`unexpected fetch: ${url}`)
    }) as typeof fetch

    const snapshot = await loadCustomersSnapshot()
    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.sourceLabel, 'customers-api-live')
    assert.ok(snapshot.controlPlaneSource.includes('crm/customers + crm/stats'))
    assert.equal(snapshot.customers[0]?.name, '张明')
    assert.equal(snapshot.stats.totalSpent, 8888)
  })

  it('应在 CRM API 不可用时回退到 fallback 快照', async () => {
    globalThis.fetch = (async () => {
      throw new Error('crm down')
    }) as typeof fetch

    const snapshot = await loadCustomersSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'customers-local-snapshot')
    assert.ok(snapshot.controlPlaneSource.includes('MOCK_CUSTOMERS'))
    assert.ok(snapshot.error?.includes('已切换到 fallback 样本数据'))
    assert.equal(snapshot.customers.length >= 10, true)
  })

  it('统计聚合应正确输出总量与钻石会员数', async () => {
    const snapshot = await loadCustomersSnapshot()
    const stats = computeCustomerStats(snapshot.customers)
    assert.equal(stats.total, snapshot.customers.length)
    assert.equal(stats.active > 0, true)
    assert.equal(stats.diamond > 0, true)
  })

  it('筛选逻辑应支持关键词 + 状态 + 等级组合', async () => {
    const snapshot = await loadCustomersSnapshot()
    const filtered = filterCustomers(snapshot.customers, '广州', 'active', 'gold')
    assert.ok(filtered.every((item) => item.status === 'active'))
    assert.ok(filtered.every((item) => item.memberLevel === 'gold'))
  })

  it('金额格式化应兼容普通值与大值', () => {
    assert.equal(formatCustomerCurrency(500), '¥500')
    assert.equal(formatCustomerCurrency(1500), '¥1.5K')
    assert.equal(formatCustomerCurrency(1_000_000).includes('万'), true)
  })

  it('状态与等级常量应完整暴露', () => {
    assert.ok(CUSTOMER_STATUSES.includes('active'))
    assert.ok(MEMBER_LEVELS.includes('diamond'))
  })
})
