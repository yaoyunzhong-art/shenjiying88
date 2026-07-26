import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MOCK_STAFF,
  STAFF_ROLE_MAP,
  STAFF_STATUS_MAP,
  computeStaffStats,
} from './staff-data'

describe('staff-data — fallback 资产', () => {
  it('应复用既有员工样本并覆盖多市场', () => {
    assert.ok(MOCK_STAFF.length >= 20)
    const markets = new Set(MOCK_STAFF.map((item) => item.marketCode))
    assert.ok(markets.has('cn-mainland'))
    assert.ok(markets.has('us-default'))
    assert.ok(markets.has('uk-default'))
  })

  it('样本应保持唯一 id 与 code', () => {
    assert.equal(new Set(MOCK_STAFF.map((item) => item.id)).size, MOCK_STAFF.length)
    assert.equal(new Set(MOCK_STAFF.map((item) => item.code)).size, MOCK_STAFF.length)
  })

  it('角色与状态映射应完整', () => {
    assert.ok(Object.keys(STAFF_ROLE_MAP).length >= 8)
    assert.equal(Object.keys(STAFF_STATUS_MAP).length, 4)
  })
})

describe('staff-data — 统计摘要', () => {
  it('应正确计算员工概览', () => {
    const stats = computeStaffStats(MOCK_STAFF)
    assert.equal(stats.total, MOCK_STAFF.length)
    assert.equal(stats.active, MOCK_STAFF.filter((item) => item.status === 'active').length)
    assert.ok(stats.managers > 0)
    assert.ok(stats.topPerformers > 0)
  })
})
