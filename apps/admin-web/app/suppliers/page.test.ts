import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MOCK_SUPPLIERS,
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_LIST_SEARCH_FIELDS,
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_MAP,
  computeSupplierStats,
  formatCurrency,
  getSupplierById,
} from './suppliers-data'

describe('suppliers-data — fallback 资产', () => {
  it('应保留 16 条 fallback 供应商样本', () => {
    assert.equal(MOCK_SUPPLIERS.length, 16)
  })

  it('样本应保持唯一 id 与 code', () => {
    assert.equal(new Set(MOCK_SUPPLIERS.map((item) => item.id)).size, MOCK_SUPPLIERS.length)
    assert.equal(new Set(MOCK_SUPPLIERS.map((item) => item.code)).size, MOCK_SUPPLIERS.length)
  })

  it('分类与状态映射应完整', () => {
    assert.equal(Object.keys(SUPPLIER_STATUS_MAP).length, SUPPLIER_STATUSES.length)
    assert.equal(Object.keys(SUPPLIER_CATEGORY_MAP).length, SUPPLIER_CATEGORIES.length)
    assert.equal(Object.keys(SUPPLIER_CREDIT_MAP).length, 5)
  })
})

describe('suppliers-data — 统计与查询', () => {
  it('应能按 id 读取供应商', () => {
    assert.equal(getSupplierById('sp-001')?.name, '绿源食品有限公司')
    assert.equal(getSupplierById('missing'), undefined)
  })

  it('应正确计算统计摘要', () => {
    const stats = computeSupplierStats(MOCK_SUPPLIERS)
    assert.equal(stats.total, 16)
    assert.equal(stats.active, MOCK_SUPPLIERS.filter((item) => item.status === 'active').length)
    assert.equal(stats.totalAmount, MOCK_SUPPLIERS.reduce((sum, item) => sum + item.totalAmount, 0))
    assert.ok(SUPPLIER_CATEGORIES.includes(stats.topCategory as (typeof SUPPLIER_CATEGORIES)[number]))
  })

  it('应保留搜索字段和金额格式化能力', () => {
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('name'))
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('contactPhone'))
    assert.equal(formatCurrency(0), '0')
    assert.ok(formatCurrency(15800000).includes('万'))
  })
})
