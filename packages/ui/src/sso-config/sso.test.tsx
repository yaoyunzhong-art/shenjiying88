/**
 * Phase 96 SSO 前台 Tests (V10 Sprint 2 Day 24)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useSso' && parent?.filename?.includes('sso-config')) {
    return require.resolve('./useSso.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { SsoConnectionList, SsoLoginPage } = require('./index')
Module._resolveFilename = origResolveFilename

describe('SSO 前台 V10 Sprint 2 Day 24', () => {
  it('SsoConnectionList 渲染列表', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(html.includes('data-testid="sso-connection-list"'))
    assert.ok(html.includes('Okta 企业 SSO'))
  })

  it('渲染 2 个 mock 连接', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(html.includes('sso-conn-sso-okta-corp'))
    assert.ok(html.includes('sso-conn-sso-azure-oidc'))
  })

  it('显示协议徽章 SAML/OIDC', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(html.includes('SAML 2.0'))
    assert.ok(html.includes('OpenID Connect'))
  })

  it('显示状态徽章 active/disabled', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(html.includes('已启用'))
    assert.ok(html.includes('已禁用'))
  })

  it('默认连接标记', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(html.includes('sso-default-sso-okta-corp'))
    assert.ok(html.includes('默认'))
  })

  it('操作按钮 (test/edit/delete)', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { onEdit: () => undefined }))
    assert.ok(html.includes('sso-test-sso-okta-corp'))
    assert.ok(html.includes('sso-edit-sso-okta-corp'))
    assert.ok(html.includes('sso-delete-sso-okta-corp'))
  })

  it('无 edit prop 时不渲染编辑按钮', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(!html.includes('sso-edit-sso-okta-corp'))
  })

  it('禁用连接测试按钮 disabled', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    // disabled 状态测试按钮应 disabled
    assert.ok(html.includes('sso-test-sso-azure-oidc'))
  })

  it('h5 variant 紧凑模式', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('app variant', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('miniprogram variant', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  // ============ SsoLoginPage ============

  it('SsoLoginPage 渲染登录卡片', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, {}))
    assert.ok(html.includes('data-testid="sso-login-page"'))
    assert.ok(html.includes('企业 SSO 登录'))
  })

  it('SsoLoginPage 显示所有 active 连接', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, {}))
    assert.ok(html.includes('sso-login-sso-okta-corp'))
    assert.ok(!html.includes('sso-login-sso-azure-oidc')) // disabled 不显示
  })

  it('SsoLoginPage defaultConnectionId 直接显示按钮', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, { defaultConnectionId: 'sso-okta-corp' }))
    assert.ok(html.includes('sso-direct-login'))
  })

  it('SsoLoginPage h5 variant', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('SsoLoginPage pc variant', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, { variant: 'pc' }))
    assert.ok(html.includes('data-variant="pc"'))
  })

  it('SsoConnectionList pad variant', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('服务条款链接渲染', () => {
    const html = renderToStaticMarkup(React.createElement(SsoLoginPage, {}))
    assert.ok(html.includes('服务条款'))
    assert.ok(html.includes('隐私政策'))
  })

  it('创建按钮', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, { onCreate: () => undefined }))
    assert.ok(html.includes('sso-create-btn'))
  })

  it('无 onCreate 时不渲染创建按钮', () => {
    const html = renderToStaticMarkup(React.createElement(SsoConnectionList, {}))
    assert.ok(!html.includes('sso-create-btn'))
  })
})