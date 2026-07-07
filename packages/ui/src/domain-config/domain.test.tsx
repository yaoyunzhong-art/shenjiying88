/**
 * Phase 96 Domain 前台 Tests (V10 Sprint 2 Day 25)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useDomain' && parent?.filename?.includes('domain-config')) {
    return require.resolve('./useDomain.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { DomainConfigPanel } = require('./index')
Module._resolveFilename = origResolveFilename

describe('Domain 前台 V10 Sprint 2 Day 25', () => {
  it('DomainConfigPanel 渲染面板', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('data-testid="domain-config-panel"'))
    assert.ok(html.includes('自定义域名'))
  })

  it('渲染 2 个 mock 域名', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('domain-dom-acme-001'))
    assert.ok(html.includes('domain-dom-shop-002'))
  })

  it('显示 acme 域名 active_ssl 状态', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('SSL 已签发'))
    assert.ok(html.includes('domain-ssl-dom-acme-001'))
  })

  it('显示 shop 域名 pending_verification 状态', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('待 DNS 校验'))
  })

  it('pending 状态显示校验按钮', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('domain-verify-dom-shop-002'))
    assert.ok(!html.includes('domain-verify-dom-acme-001')) // active_ssl 不显示
  })

  it('active_ssl 域名 SSL 徽章', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('SSL 至'))
  })

  it('添加域名输入框', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('domain-input'))
    assert.ok(html.includes('domain-add-btn'))
  })

  it('详情展开按钮', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('domain-toggle-dom-acme-001'))
  })

  it('删除按钮', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('domain-remove-dom-acme-001'))
    assert.ok(html.includes('domain-remove-dom-shop-002'))
  })

  it('5 端 variant', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('app variant', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('miniprogram variant', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  it('pad variant', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('pc variant 默认', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('data-variant="pc"'))
  })

  it('提示文案存在', () => {
    const html = renderToStaticMarkup(React.createElement(DomainConfigPanel, {}))
    assert.ok(html.includes('添加后需在 DNS 服务商添加 TXT 记录完成校验'))
  })
})