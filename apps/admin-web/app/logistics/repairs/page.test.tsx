/**
 * P-30 维修工单页面测试
 * 三件套: 正例(列表/状态标签) + 反例(空态) + 边界(筛选切换)
 */

import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import RepairsPage from './page'

afterEach(() => { cleanup() })

describe('P-30 维修工单页', () => {
  it('正例: 渲染页面标题', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('维修工单'))
  })

  it('正例: 渲染5条工单', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('RO-001'))
    assert.ok(screen.getByText('RO-002'))
    assert.ok(screen.getByText('RO-003'))
    assert.ok(screen.getByText('RO-004'))
    assert.ok(screen.getByText('RO-005'))
  })

  it('正例: 状态标签渲染(包含表格和筛选按钮)', () => {
    render(React.createElement(RepairsPage))
    const items = screen.getAllByText('维修中')
    assert.ok(items.length > 0, '维修中标签存在')
    assert.ok(screen.getAllByText('待指派').length > 0)
    assert.ok(screen.getAllByText('已完成').length > 0)
  })

  it('正例: 门店/设备/维修人信息', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('射击枪 A-01'))
    assert.ok(screen.getByText('VR头盔 H-03'))
    assert.ok(screen.getByText('李师傅'))
  })

  it('反例: 筛选待指派后只显示待指派工单', () => {
    render(React.createElement(RepairsPage))
    const filterBtn = screen.getAllByText('待指派')[0]!
    fireEvent.click(filterBtn)
    // RO-002 是待指派
    assert.ok(screen.getByText('RO-002'))
    // RO-001 (维修中) 应不显示
    const ro1 = screen.queryByText('RO-001')
    assert.equal(ro1, null)
  })

  it('边界: 全部筛选恢复', () => {
    render(React.createElement(RepairsPage))
    // 筛选待指派
    fireEvent.click(screen.getAllByText('待指派')[0]!)
    assert.equal(screen.queryByText('RO-001'), null)
    // 切回全部
    fireEvent.click(screen.getByText('全部'))
    assert.ok(screen.getByText('RO-001'))
  })

  it('边界: 已验收标签', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getAllByText('已验收').length > 0)
  })

  it('边界: 7个筛选按钮', () => {
    render(React.createElement(RepairsPage))
    const expected = ['全部', '待指派', '已指派', '维修中', '已完成', '待验收', '已验收']
    for (const label of expected) {
      assert.ok(screen.getAllByText(label).length > 0, `${label} exists`)
    }
  })
})
