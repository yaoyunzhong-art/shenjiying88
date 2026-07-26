import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  computeCustomerStats,
  CUSTOMER_STATUSES,
  filterCustomers,
  formatCustomerCurrency,
  loadCustomersSnapshot,
  MEMBER_LEVELS,
} from './customers-data'

describe('Customers snapshot contract', () => {
  it('应返回 fallback 快照与来源态证据', async () => {
    const snapshot = await loadCustomersSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'customers-local-snapshot')
    assert.ok(snapshot.controlPlaneSource.includes('MOCK_CUSTOMERS'))
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
