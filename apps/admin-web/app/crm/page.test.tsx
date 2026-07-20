/**
 * crm/page.test.tsx — CRM客户管理列表页渲染测试
 *
 * 覆盖: 页面组件导出、统计卡片、筛选逻辑的渲染验证
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render, screen, cleanup, act } from '@testing-library/react'

import { MOCK_CRM_CUSTOMERS } from './crm-data'

// ===== 从 page.tsx 提取的辅助函数 =====
import type { CustomerProfile, CrmCustomerStatus } from './crm-data'

// ─── 辅助函数 ───

function formatCents(n: number): string {
  const yuan = n / 100
  if (yuan >= 1_000_000) return `¥${(yuan / 10_000).toFixed(1)}万`
  if (yuan >= 1_000) return `¥${(yuan / 1000).toFixed(1)}K`
  return `¥${yuan}`
}

function filterCustomers(
  items: CustomerProfile[],
  search: string,
  statusFilter: CrmCustomerStatus | 'all',
  minScore: number,
  maxScore: number,
): CustomerProfile[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  result = result.filter((c) => c.engagementScore >= minScore && c.engagementScore <= maxScore)

  return result
}

function computeStats(items: CustomerProfile[]) {
  const total = items.length
  const active = items.filter((c) => c.status === 'active').length
  const avgScore = items.length > 0 ? Math.round(items.reduce((s, c) => s + c.engagementScore, 0) / items.length) : 0
  const openTickets = items.reduce((s, c) => s + c.tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length, 0)
  return { total, active, avgScore, openTickets }
}

// ===== 统计验证 =====

describe('CRM 统计计算', () => {
  it('统计应正确计算总客户数', () => {
    const stats = computeStats(MOCK_CRM_CUSTOMERS)
    assert.equal(stats.total, MOCK_CRM_CUSTOMERS.length)
  })

  it('统计应正确计算活跃客户数', () => {
    const stats = computeStats(MOCK_CRM_CUSTOMERS)
    const expectedActive = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'active').length
    assert.equal(stats.active, expectedActive)
  })

  it('统计应正确计算平均评分', () => {
    const stats = computeStats(MOCK_CRM_CUSTOMERS)
    const expectedAvg = Math.round(MOCK_CRM_CUSTOMERS.reduce((s, c) => s + c.engagementScore, 0) / MOCK_CRM_CUSTOMERS.length)
    assert.equal(stats.avgScore, expectedAvg)
  })

  it('统计应正确计算未处理工单数', () => {
    const stats = computeStats(MOCK_CRM_CUSTOMERS)
    const expectedTickets = MOCK_CRM_CUSTOMERS.reduce((s, c) => s + c.tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length, 0)
    assert.equal(stats.openTickets, expectedTickets)
  })
})

// ===== 筛选验证 =====

describe('CRM 筛选验证', () => {
  it('活跃筛选只返回 active 客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'active', 0, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'active'))
  })

  it('沉默状态筛选只返回 inactive 客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'inactive', 0, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'inactive'))
  })

  it('流失状态筛选只返回 churned 客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'churned', 0, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'churned'))
  })

  it('潜在客户筛选只返回 lead 客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'lead', 0, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.status === 'lead'))
  })

  it('评分上限20筛选应返回低评分客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 0, 20)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.engagementScore <= 20))
  })

  it('评分下限80筛选应返回高评分客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 80, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.engagementScore >= 80))
  })

  it('搜索客户姓名应精确匹配', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '张明', 'all', 0, 100)
    assert.ok(result.length === 1)
    assert.equal(result[0].name, '张明')
  })

  it('搜索邮箱应精确匹配', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, 'lifang@example.com', 'all', 0, 100)
    assert.ok(result.length === 1)
    assert.equal(result[0].email, 'lifang@example.com')
  })

  it('活跃+评分80筛选', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'active', 80, 100)
    assert.ok(result.every((c) => c.status === 'active' && c.engagementScore >= 80))
  })
})

// ===== 组件渲染 =====

describe('CrmPage 组件渲染', () => {
  async function renderAfterLoading() {
    const mod = await import('./page')
    const view = render(React.createElement(mod.default))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150))
    })
    return view
  }

  beforeEach(() => {
    // setup
  })

  afterEach(() => {
    cleanup()
  })

  it('应导出默认函数组件', async () => {
    const mod = await import('./page')
    assert.equal(typeof mod.default, 'function', 'default export should be a function (React component)')
  })

  it('组件名应包含 Crm', async () => {
    const mod = await import('./page')
    assert.ok(
      mod.default.name.includes('Crm'),
      `component name should contain "Crm", got "${mod.default.name}"`,
    )
  })

  it('渲染后不应抛出异常', async () => {
    const mod = await import('./page')
    assert.doesNotThrow(() => render(React.createElement(mod.default)))
  })

  it('应渲染出页面标题', async () => {
    const { container } = await renderAfterLoading()
    const heading = container.querySelector('h1')
    assert.ok(heading, 'should render an h1')
    assert.ok(heading!.textContent?.includes('客户关系管理'), `expected "客户关系管理", got "${heading!.textContent}"`)
  })

  it('应渲染统计卡片 (4个)', async () => {
    const { container } = await renderAfterLoading()
    const statCards = container.querySelectorAll('[data-mock="StatCard"]')
    assert.equal(statCards.length, 4, 'should render 4 stat cards')
  })

  it('应渲染搜索输入框', async () => {
    const { container } = await renderAfterLoading()
    const searchInput = container.querySelector('input[aria-label="客户搜索"]')
    assert.ok(searchInput, 'should render search input')
  })

  it('应渲染状态筛选下拉框', async () => {
    await renderAfterLoading()
    const statusSelect = screen.getByLabelText('状态筛选')
    assert.ok(statusSelect, 'should render status filter select')
  })

  it('应渲染评分范围输入框', async () => {
    const { container } = await renderAfterLoading()
    const minScore = container.querySelector('input[aria-label="最低评分"]')
    const maxScore = container.querySelector('input[aria-label="最高评分"]')
    assert.ok(minScore, 'should render min score input')
    assert.ok(maxScore, 'should render max score input')
  })
})
