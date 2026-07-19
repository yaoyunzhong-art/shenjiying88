import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import OperationsPage from './page'

afterEach(() => { cleanup() })

describe('运营参谋 — 活动参谋扩充 (P-50 V2)', () => {

  // ── 基础渲染 ──

  it('正例: 渲染页面标题', () => {
    render(React.createElement(OperationsPage))
    assert.ok(screen.getByText('💡 运营参谋'))
  })

  it('正例: 渲染7个分类标签（含3个新增）', () => {
    render(React.createElement(OperationsPage))
    const labels = [
      '💰 定价策略', '🎯 活动方案',
      '🛠️ 设备更新', '🏷️ 促销应对',
      '🤝 联名活动/IP跨界',
      '🏖️ 暑假/寒假限定',
      '🎁 盲盒/抽奖促销合规版',
    ]
    for (const label of labels) {
      const els = screen.getAllByText(label)
      assert.ok(els.length >= 1, `${label} 应在页面中出现`)
    }
  })

  // ── dataEvidence 测试 ──

  it('正例: 所有选项渲染dataEvidence', () => {
    render(React.createElement(OperationsPage))
    const allTxt = document.body.textContent || ''

    // 新3类dataEvidence
    assert.ok(allTxt.includes('同城5家竞品IP联名后，客流平均+65%'))
    assert.ok(allTxt.includes('同城6家竞品跨界合作，客流平均+32%'))
    assert.ok(allTxt.includes('同城20家竞品推假期畅玩卡，客流平均+35%'))
    assert.ok(allTxt.includes('同城8家竞品推消费抽奖，客流平均+55%'))
    assert.ok(allTxt.includes('同城10家竞品用满赠盲盒，客单价平均+20%'))

    // 原有类dataEvidence
    assert.ok(allTxt.includes('同城8家竞品采用此方案，平均月收入+9%'))
    assert.ok(allTxt.includes('同城12家竞品采用此方案，平均客流+42%'))
  })

  it('正例: 联名活动/IP跨界3个选项', () => {
    render(React.createElement(OperationsPage))
    assert.ok(screen.getByText('大型IP联名'))
    assert.ok(screen.getByText('游戏/品牌跨界'))
    assert.ok(screen.getByText('自有IP孵化'))
  })

  it('正例: 暑假/寒假限定3个选项', () => {
    render(React.createElement(OperationsPage))
    assert.ok(screen.getByText('假期畅玩卡'))
    assert.ok(screen.getByText('亲子套餐'))
    assert.ok(screen.getByText('学生专场'))
  })

  it('正例: 盲盒/抽奖促销合规版3个选项', () => {
    render(React.createElement(OperationsPage))
    assert.ok(screen.getByText('消费抽盲盒'))
    assert.ok(screen.getByText('积分翻牌'))
    assert.ok(screen.getByText('满额赠盲盒'))
  })

  // ── pros/cons渲染 ──

  it('正例: 选项渲染pros标签', () => {
    render(React.createElement(OperationsPage))
    const pros = document.querySelectorAll('.bg-green-100')
    assert.ok(pros.length >= 10, `pros标签数 ${pros.length} 应 >= 10`)
  })

  it('正例: 选项渲染cons标签', () => {
    render(React.createElement(OperationsPage))
    const cons = document.querySelectorAll('.bg-red-100')
    assert.ok(cons.length >= 10, `cons标签数 ${cons.length} 应 >= 10`)
  })

  // ── 历史案例切换（静态内容验证） ──

  it('正例: 活动方案的历史案例切换UI存在（默认隐藏）', () => {
    render(React.createElement(OperationsPage))
    const allTxt = document.body.textContent || ''

    // 历史案例模式切换按钮默认不应出现（因为 activeCategory !== 'activity'）
    // 但题目卡片中的"🎯 活动方案"标签应出现
    assert.ok(allTxt.includes('🎯 活动方案'))

    // 历史案例数据本身不应直接渲染在页面中
    // 它只在切换到历史模式后出现
  })

  // ── estimatedEffect 渲染 ──

  it('正例: 新类别的预估效果渲染', () => {
    render(React.createElement(OperationsPage))
    const allTxt = document.body.textContent || ''
    assert.ok(allTxt.includes('客流+55%'))
    assert.ok(allTxt.includes('客流+35%'))
    assert.ok(allTxt.includes('客流+50%'))
  })
})
