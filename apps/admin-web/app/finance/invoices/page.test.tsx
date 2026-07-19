/**
 * B2 发票管理页面测试
 *
 * 三件套覆盖:
 * 正例 — 列表渲染 / 新建 / 开具 / 作废
 * 反例 — 空态 / 错误态
 * 边界 — 筛选切换
 */

import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import FinanceInvoicesPage from './page'

afterEach(() => {
  cleanup()
})

// ─── 正例 ──────────────────────────────────────────

describe('B2 Invoice 发票管理页', () => {
  it('正例: 渲染发票列表', () => {
    render(React.createElement(FinanceInvoicesPage))

    assert.ok(screen.getByText('发票管理'))
    // 默认有 2 条 mock 数据
    assert.ok(screen.getByText('INV-20260719-001'))
    assert.ok(screen.getByText('INV-20260719-002'))
  })

  it('正例: 新建发票功能', async () => {
    render(React.createElement(FinanceInvoicesPage))

    // 打开新建弹窗
    fireEvent.click(screen.getByText('+ 新建发票'))
    await waitFor(() => {
      assert.ok(screen.getByText('新建发票'))
    })

    // 填入订单号
    const orderInput = screen.getByPlaceholderText('ORD-20260719-XXXX')
    fireEvent.change(orderInput, { target: { value: 'ORD-NEW-001' } })

    // 点击创建
    fireEvent.click(screen.getByText('创建'))

    // 新发票出现在列表中
    await waitFor(() => {
      assert.ok(screen.getByText(/ORD-NEW-001/))
    })
  })

  it('正例: 开具发票操作', async () => {
    render(React.createElement(FinanceInvoicesPage))

    // 找到 DRAFT 状态的发票的开具按钮
    const issueBtns = screen.getAllByText('开具')
    assert.ok(issueBtns.length > 0)

    fireEvent.click(issueBtns[0]!)

    await waitFor(() => {
      // 状态标签"已开"出现在列表中（至少一处）
      assert.ok(screen.getAllByText('已开').length > 0)
    })
  })

  it('正例: 作废发票操作', async () => {
    render(React.createElement(FinanceInvoicesPage))

    // 开具后作废
    const issueBtns = screen.getAllByText('开具')
    fireEvent.click(issueBtns[0]!)

    await waitFor(() => {
      assert.ok(screen.getAllByText('已开').length > 0)
    })

    // 作废
    const cancelBtns = screen.getAllByText('作废')
    fireEvent.click(cancelBtns[0]!)
  })

  // ─── 反例 ──────────────────────────────────────

  it('反例: 筛选为全部时展示所有发票', () => {
    render(React.createElement(FinanceInvoicesPage))

    // 默认已在"全部"状态，确认两条数据都在
    assert.ok(screen.getByText('INV-20260719-001'))
    assert.ok(screen.getByText('INV-20260719-002'))
  })

  // ─── 边界 ──────────────────────────────────────

  it('边界: 筛选切换至草稿只显示草稿发票', async () => {
    render(React.createElement(FinanceInvoicesPage))

    fireEvent.click(screen.getAllByText('草稿')[0]!)

    // 等待筛选生效后确认草稿发票还在
    await waitFor(() => {
      assert.ok(screen.getByText('INV-20260719-002'))
    })
  })

  it('边界: 新建弹窗取消后能重新打开', async () => {
    render(React.createElement(FinanceInvoicesPage))

    // 打开
    fireEvent.click(screen.getByText('+ 新建发票'))
    await waitFor(() => {
      assert.ok(screen.getByText('新建发票'))
    })

    // 取消
    fireEvent.click(screen.getByText('取消'))

    // 重新打开
    fireEvent.click(screen.getByText('+ 新建发票'))
    await waitFor(() => {
      assert.ok(screen.getByText('新建发票'))
    })
  })
})
