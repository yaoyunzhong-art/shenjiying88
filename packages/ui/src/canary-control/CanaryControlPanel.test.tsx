/**
 * CanaryControlPanel tests (V10 Day 8)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useCanaryControl' && parent?.filename?.includes('canary-control')) {
    return require.resolve('./useCanaryControl.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { CanaryControlPanel } = require('./CanaryControlPanel')
Module._resolveFilename = origResolveFilename

describe('CanaryControlPanel V10 Day 8 Phase 92', () => {
  it('renders control panel', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('data-testid="canary-control-panel"'))
    assert.ok(html.includes('灰度发布控制台'))
  })

  it('shows 5 stat cards', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('stat-总数'))
    assert.ok(html.includes('stat-进行中'))
    assert.ok(html.includes('stat-已暂停'))
    assert.ok(html.includes('stat-已完成'))
    assert.ok(html.includes('stat-已回滚'))
  })

  it('renders 3 seeded experiments', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('experiment-card-exp-ai-v2'))
    assert.ok(html.includes('experiment-card-exp-checkout'))
    assert.ok(html.includes('experiment-card-exp-recommend'))
  })

  it('shows status labels', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('进行中'))
    assert.ok(html.includes('已暂停'))
  })

  it('shows strategy labels', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('百分比'))
    assert.ok(html.includes('门店'))
    assert.ok(html.includes('租户'))
  })

  it('shows progress data', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('data-current="25"'))
    assert.ok(html.includes('data-current="100"'))
    assert.ok(html.includes('data-target="100"'))
  })

  it('shows action buttons for active experiments', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('btn-rollback-exp-ai-v2'))
    assert.ok(html.includes('btn-promote-exp-ai-v2'))
  })

  it('h5 variant applies compact padding', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('pc variant', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, { variant: 'pc' }))
    assert.ok(html.includes('data-variant="pc"'))
  })

  it('pad variant', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('experiment status data attributes', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('data-status="active"'))
    assert.ok(html.includes('data-status="paused"'))
  })

  it('shows current and target percentages', () => {
    const html = renderToStaticMarkup(React.createElement(CanaryControlPanel, {}))
    assert.ok(html.includes('当前'))
    assert.ok(html.includes('目标'))
  })
})
