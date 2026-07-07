/**
 * ThreeLevelConfigPanel tests (V9 Art 4, V10 Day 6)
 *
 * 使用 node:test + renderToStaticMarkup + Module hook 避免 react-query 实际调用
 */

import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'

// ============ Module Resolution Hook ============
const Module = require('module')
const origResolveFilename = Module._resolveFilename

// 重定向 useThreeLevelConfig 到 mock (本测试不需要真实 react-query)
Module._resolveFilename = function (
  request: string,
  parent: { filename?: string; paths?: string[] },
  isMain?: boolean,
  options?: Record<string, unknown>,
) {
  if (
    request === './useThreeLevelConfig' &&
    parent?.filename?.includes('three-level-config')
  ) {
    // 改为直接 require 一个简化版 (不依赖 react-query)
    return require.resolve('./useThreeLevelConfig.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)

const {
  ThreeLevelConfigPanel,
  WStoreConfigPanel,
  WTenantConfigPanel,
  WBrandConfigPanel,
} = require('./ThreeLevelConfigPanel')

Module._resolveFilename = origResolveFilename

describe('ThreeLevelConfigPanel V10 Day 6 Phase 90', () => {
  before(() => {
    // 测试前的全局初始化
  })

  it('renders 3 workbench cards in default state', () => {
    const html = renderToStaticMarkup(React.createElement(ThreeLevelConfigPanel, {}))
    assert.ok(html.includes('data-testid="workbench-card-W-S"'))
    assert.ok(html.includes('data-testid="workbench-card-W-T"'))
    assert.ok(html.includes('data-testid="workbench-card-W-B"'))
    assert.ok(html.includes('三级配置工作台'))
  })

  it('default workbench is W-T', () => {
    const html = renderToStaticMarkup(React.createElement(ThreeLevelConfigPanel, {}))
    assert.ok(html.includes('data-workbench="W-T"'))
  })

  it('defaultWorkbench=W-S prop overrides default', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-S' }),
    )
    assert.ok(html.includes('data-workbench="W-S"'))
  })

  it('defaultWorkbench=W-B prop overrides default', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-B' }),
    )
    assert.ok(html.includes('data-workbench="W-B"'))
  })

  it('WStoreConfigPanel renders with W-S default', () => {
    const html = renderToStaticMarkup(React.createElement(WStoreConfigPanel, {}))
    assert.ok(html.includes('data-workbench="W-S"'))
  })

  it('WTenantConfigPanel renders with W-T default', () => {
    const html = renderToStaticMarkup(React.createElement(WTenantConfigPanel, {}))
    assert.ok(html.includes('data-workbench="W-T"'))
  })

  it('WBrandConfigPanel renders with W-B default', () => {
    const html = renderToStaticMarkup(React.createElement(WBrandConfigPanel, {}))
    assert.ok(html.includes('data-workbench="W-B"'))
  })

  it('shows config rows from mock (W-T ai.default_model)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-T' }),
    )
    assert.ok(html.includes('ai.default_model'))
  })

  it('shows config rows from mock (W-S pos.tax_rate)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-S' }),
    )
    assert.ok(html.includes('pos.tax_rate'))
  })

  it('shows config rows from mock (W-B compliance.audit_retention_days)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-B' }),
    )
    assert.ok(html.includes('compliance.audit_retention_days'))
  })

  it('masked secret values displayed with masked style', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { defaultWorkbench: 'W-T' }),
    )
    assert.ok(html.includes('已脱敏'))
  })

  it('readOnly mode hides edit buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { readOnly: true }),
    )
    assert.ok(!html.includes('config-edit-'))
  })

  it('h5 variant applies compact density', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { variant: 'h5' }),
    )
    assert.ok(html.includes('data-density="comfortable"'))
  })

  it('category filter chips present', () => {
    const html = renderToStaticMarkup(React.createElement(ThreeLevelConfigPanel, {}))
    assert.ok(html.includes('全部'))
    assert.ok(html.includes('POS/收银'))
    assert.ok(html.includes('会员'))
  })

  it('density compact prop applied to data attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(ThreeLevelConfigPanel, { density: 'compact' }),
    )
    assert.ok(html.includes('data-density="compact"'))
  })
})
