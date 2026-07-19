/**
 * P-35 POS Terminal 页面测试（简化版）
 * 使用 container query + 同步渲染检查, 避免 jsdom fireEvent 兼容问题
 */

import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
})
globalThis.document = dom.window.document
globalThis.window = dom.window
globalThis.navigator = dom.window.navigator
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.HTMLInputElement = dom.window.HTMLInputElement
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.KeyboardEvent = dom.window.KeyboardEvent
dom.window.matchMedia = () => ({ matches: false, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })

import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import PosTerminalPage from './page'

afterEach(() => { cleanup() })

describe('P-35 POS Terminal', () => {
  // ─── 正例 ─────────────────────────────────

  it('正例: 渲染页面组件', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    assert.ok(container.textContent?.includes('收银终端 POS'))
    assert.ok(container.textContent?.includes('购物车为空'))
    assert.ok(container.querySelector('[data-testid="sku-input"]'))
    assert.ok(container.querySelector('[data-testid="checkout-btn"]'))
    assert.ok(container.querySelector('[data-testid="pay-CASH"]'))
  })

  it('正例: 通过快速按钮添加商品', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    assert.ok(container.querySelector('[data-testid="quick-sku-SKU-001"]'))
    assert.ok(container.querySelector('[data-testid="quick-sku-SKU-002"]'))
    assert.ok(container.querySelector('[data-testid="quick-sku-SKU-003"]'))
    // 点击添加
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-001"]')!)
    assert.ok(container.textContent?.includes('标准畅玩票'))
    assert.ok(!container.textContent?.includes('购物车为空'))
  })

  it('正例: 快速按钮添加后购物车显示数量', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    const btn = container.querySelector('[data-testid="quick-sku-SKU-001"]')!
    fireEvent.click(btn)
    fireEvent.click(btn) // 点两次
    const item = container.querySelector('[data-testid="cart-item-SKU-001"]')
    assert.ok(item, 'cart item exists')
    assert.ok(item!.textContent?.includes('× 2'), 'quantity = 2')
  })

  it('正例: 多个商品添加', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-001"]')!)
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-002"]')!)
    assert.ok(container.textContent?.includes('标准畅玩票'))
    assert.ok(container.textContent?.includes('VIP 通票'))
  })

  it('正例: 支付方式切换', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    // 默认现金
    const cash = container.querySelector('[data-testid="pay-CASH"]')!
    const wechat = container.querySelector('[data-testid="pay-WECHAT"]')!
    assert.ok(cash)
    assert.ok(wechat)
    // 切换到微信
    fireEvent.click(wechat)
    // 默认选中的 border 风格
    const wechatStyle = (wechat as HTMLElement).getAttribute('style') || ''
    assert.ok(wechatStyle.includes('border'), 'wechat should be selected')
  })

  // ─── 反例 ─────────────────────────────────

  it('反例: 空购物车结账按钮禁用', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    const btn = container.querySelector('[data-testid="checkout-btn"]') as HTMLButtonElement
    assert.ok(btn.disabled)
  })

  it('反例: 添加后删除商品恢复空态', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-001"]')!)
    assert.ok(!container.textContent?.includes('购物车为空'))
    const xBtns = Array.from(container.querySelectorAll('button')).filter(b => b.textContent === '✕')
    assert.ok(xBtns.length > 0)
    fireEvent.click(xBtns[0]!)
    assert.ok(container.textContent?.includes('购物车为空'))
  })

  // ─── 边界 ─────────────────────────────────

  it('边界: 清空按钮重置所有状态', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-001"]')!)
    assert.ok(container.textContent?.includes('标准畅玩票'))
    fireEvent.click(container.querySelector('[data-testid="pay-ALIPAY"]')!)
    // 清空
    const clearBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '清空')
    assert.ok(clearBtn)
    fireEvent.click(clearBtn!)
    assert.ok(container.textContent?.includes('购物车为空'))
  })

  it('边界: 合计金额计算正确', () => {
    const { container } = render(React.createElement(PosTerminalPage))
    // 标准畅玩票 ¥88.00 × 1
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-001"]')!)
    // 合计显示 ¥88.00
    assert.ok(container.textContent?.includes('¥88.00'))
    // 再加一个 VIP ¥188.00 × 1
    fireEvent.click(container.querySelector('[data-testid="quick-sku-SKU-002"]')!)
    // 合计应该是 88 + 188 = 276
    assert.ok(container.textContent?.includes('¥276.00'))
  })
})
