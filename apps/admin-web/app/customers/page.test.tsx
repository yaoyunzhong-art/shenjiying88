/**
 * customers/page.test.tsx — 客户管理列表页渲染测试
 *
 * 覆盖: 页面组件导出、统计卡片、筛选逻辑的渲染验证
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'

import { MOCK_CUSTOMERS } from './customers-data'

// ===== 从 page.tsx 提取的辅助函数 =====
import type { CustomerRecord, CustomerStatus, MemberLevel } from './customers-data'

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`
  return `¥${n}`
}

function filterCustomers(
  items: CustomerRecord[],
  search: string,
  statusFilter: CustomerStatus | 'all',
  levelFilter: MemberLevel | 'all',
): CustomerRecord[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    const searchFields: (keyof CustomerRecord)[] = ['name', 'phone', 'city']
    result = result.filter((c) =>
      searchFields.some((f) => String(c[f]).toLowerCase().includes(lower)),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  if (levelFilter !== 'all') {
    result = result.filter((c) => c.memberLevel === levelFilter)
  }

  return result
}

function computeStats(items: CustomerRecord[]) {
  const total = items.length
  const active = items.filter((c) => c.status === 'active').length
  const totalSpent = items.reduce((s, c) => s + c.totalSpent, 0)
  const diamond = items.filter((c) => c.memberLevel === 'diamond').length
  return { total, active, totalSpent, diamond }
}

// ===== 统计卡片验证 =====

describe('CustomersPage 统计计算', () => {
  it('统计应正确计算总客户数', () => {
    const stats = computeStats(MOCK_CUSTOMERS)
    assert.equal(stats.total, MOCK_CUSTOMERS.length)
  })

  it('统计应正确计算活跃客户数', () => {
    const stats = computeStats(MOCK_CUSTOMERS)
    const expectedActive = MOCK_CUSTOMERS.filter((c) => c.status === 'active').length
    assert.equal(stats.active, expectedActive)
  })

  it('统计应正确计算累计消费', () => {
    const stats = computeStats(MOCK_CUSTOMERS)
    const expectedTotal = MOCK_CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0)
    assert.equal(stats.totalSpent, expectedTotal)
  })

  it('统计应正确计算钻石会员数', () => {
    const stats = computeStats(MOCK_CUSTOMERS)
    const expectedDiamond = MOCK_CUSTOMERS.filter((c) => c.memberLevel === 'diamond').length
    assert.equal(stats.diamond, expectedDiamond)
  })
})

describe('CustomersPage 筛选验证', () => {
  it('活跃筛选只返回 active 客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'active', 'all')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'active'))
  })

  it('钻石等级筛选只返回 diamond 会员', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'all', 'diamond')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.memberLevel === 'diamond'))
  })

  it('活跃+黄金组合筛选', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'active', 'gold')
    assert.ok(result.every((c) => c.status === 'active' && c.memberLevel === 'gold'))
  })

  it('沉默状态筛选只返回 inactive 客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'inactive', 'all')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'inactive'))
  })

  it('冻结状态筛选只返回 blocked 客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'blocked', 'all')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'blocked'))
  })

  it('流失状态筛选只返回 churned 客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'churned', 'all')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'churned'))
  })

  it('搜索客户姓名应精确匹配', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '张明', 'all', 'all')
    assert.ok(result.length === 1)
    assert.equal(result[0].name, '张明')
  })

  it('搜索城市广州应返回广州客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '广州', 'all', 'all')
    assert.ok(result.every((c) => c.city === '广州'))
  })
})

describe('CustomersPage 组件渲染', () => {
  // 渲染辅助：等待 useEffect loading 完成后断言
  async function renderAfterLoading() {
    const mod = await import('./page')
    const view = render(React.createElement(mod.default))
    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })
    return view
  }

  it('页面不应抛出渲染异常', async () => {
    const mod = await import('./page')
    assert.doesNotThrow(() => render(React.createElement(mod.default)))
  })
  beforeEach(() => {
    // The mock will handle the module load; just set up
  })

  afterEach(() => {
    cleanup()
  })

  it('应导出默认函数组件', async () => {
    const mod = await import('./page')
    assert.equal(typeof mod.default, 'function', 'default export should be a function (React component)')
  })

  it('组件名应包含 Customers', async () => {
    const mod = await import('./page')
    assert.ok(
      mod.default.name.includes('Customers'),
      `component name should contain "Customers", got "${mod.default.name}"`,
    )
  })

  it('应渲染出页面标题', async () => {
    const { container } = await renderAfterLoading()
    const heading = container.querySelector('h1')
    assert.ok(heading, 'should render an h1')
    assert.ok(heading!.textContent?.includes('客户管理'), `expected "客户管理", got "${heading!.textContent}"`)
  })

  it('应渲染 StatCard 统计区域', async () => {
    const { container } = await renderAfterLoading()
    const statCards = container.querySelectorAll('[data-mock="StatCard"]')
    assert.equal(statCards.length, 4, 'should render 4 stat cards')
  })

  it('统计卡片应包含正确的标签', async () => {
    const { container } = await renderAfterLoading()
    const statLabels = container.querySelectorAll('[data-testid="stat-label"]')
    const labels = Array.from(statLabels).map(el => el.textContent)
    assert.ok(labels.includes('总客户'), `missing 总客户, got: ${labels.join(', ')}`)
    assert.ok(labels.includes('活跃客户'), `missing 活跃客户, got: ${labels.join(', ')}`)
    assert.ok(labels.includes('累计消费'), `missing 累计消费, got: ${labels.join(', ')}`)
    assert.ok(labels.includes('钻石会员'), `missing 钻石会员, got: ${labels.join(', ')}`)
  })

  it('应渲染 DataTable 组件', async () => {
    const { container } = await renderAfterLoading()
    const dataTable = container.querySelector('[data-mock="DataTable"]')
    assert.ok(dataTable, 'should render DataTable')
  })

  it('应渲染筛选输入框', async () => {
    const { container } = await renderAfterLoading()
    const searchInput = container.querySelector('[data-mock="SearchFilterInput"]')
    assert.ok(searchInput, 'should render SearchFilterInput')
  })

  it('应渲染状态筛选下拉框', async () => {
    const { container: _c1 } = await renderAfterLoading()
    const statusSelect = screen.getAllByLabelText('状态筛选')
    assert.ok(statusSelect.length > 0, 'should render status filter select')
  })

  it('应渲染会员等级筛选下拉框', async () => {
    const { container: _c2 } = await renderAfterLoading()
    const levelSelect = screen.getAllByLabelText('会员等级筛选')
    assert.ok(levelSelect.length > 0, 'should render member level filter select')
  })

  it('应渲染分页按钮', async () => {
    const { container } = await renderAfterLoading()
    const pageButtons = Array.from(container.querySelectorAll('button'))
    const paginationButtons = pageButtons.filter(b => /^[12]$/.test(b.textContent || ''))
    assert.ok(paginationButtons.length >= 1, 'should render at least one pagination button')
  })

  it('应显示记录总数', async () => {
    const { container } = await renderAfterLoading()
    const totalText = Array.from(container.querySelectorAll('span'))
    const found = totalText.some(el => /共.*12.*条/.test(el.textContent || ''))
    assert.ok(found, 'should show total record count')
  })
})

describe('formatCurrency 边界值', () => {
  it('负数金额', () => {
    const result = formatCurrency(-500)
    assert.equal(result, '¥-500')
  })

  it('999 金额', () => {
    assert.equal(formatCurrency(999), '¥999')
  })

  it('正好 1000', () => {
    assert.equal(formatCurrency(1000), '¥1.0K')
  })

  it('正好 1000000', () => {
    const result = formatCurrency(1_000_000)
    assert.ok(result.includes('万'), `expected "万" in result, got "${result}"`)
  })

  it('大量金额', () => {
    const result = formatCurrency(12_340_000)
    assert.ok(result.includes('万'), `expected "万" in result, got "${result}"`)
  })
})
