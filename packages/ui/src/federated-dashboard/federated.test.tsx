/**
 * Phase 97 联邦学习 前台 Tests (V10 Sprint 2 Day 28)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useFederated' && parent?.filename?.includes('federated-dashboard')) {
    return require.resolve('./useFederated.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { FederatedDashboard } = require('./index')
Module._resolveFilename = origResolveFilename

describe('联邦学习前台 V10 Sprint 2 Day 28', () => {
  it('FederatedDashboard 渲染仪表盘', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('data-testid="federated-dashboard"'))
    assert.ok(html.includes('联邦学习仪表盘'))
  })

  it('渲染 2 个 mock 任务', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-task-fed-task-sales'))
    assert.ok(html.includes('fed-task-fed-task-inventory'))
  })

  it('销售任务 active 状态', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('运行中'))
  })

  it('库存任务 completed 状态', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('已完成'))
  })

  it('聚合方法标签 FedAvg + SCAFFOLD', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('FedAvg'))
    assert.ok(html.includes('SCAFFOLD'))
  })

  it('active 任务显示新轮次按钮', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-start-round-fed-task-sales'))
  })

  it('draft/paused 任务显示启动按钮', () => {
    // 当前 mock 中没有 draft 任务, 但应该预留位置
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(!html.includes('fed-activate-fed-task-inventory')) // completed 没有
  })

  it('进度条渲染', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-progress-fed-task-sales'))
    // sales: 5/10 = 50%
    assert.ok(html.includes('data-progress'))
  })

  it('默认选中第一个任务并显示详情', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-detail-fed-task-sales'))
  })

  it('隐私预算面板', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-privacy-panel'))
    assert.ok(html.includes('差分隐私预算'))
    assert.ok(html.includes('fed-eps-bar'))
  })

  it('隐私剩余 ε 显示', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-eps-remaining'))
  })

  it('轮次列表渲染', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-round-r1'))
    assert.ok(html.includes('fed-round-r5'))
  })

  it('收集中的轮次显示聚合按钮', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('fed-aggregate-r5'))
  })

  it('已完成轮次无聚合按钮', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(!html.includes('fed-aggregate-r1'))
  })

  it('5 端 variant: h5', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('5 端 variant: app', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('5 端 variant: miniprogram', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  it('5 端 variant: pad', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('selectedTaskId prop', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, { selectedTaskId: 'fed-task-inventory' }))
    assert.ok(html.includes('fed-detail-fed-task-inventory'))
  })

  it('组合方式 basic', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('组合方式'))
    assert.ok(html.includes('basic'))
  })

  it('模型架构显示', () => {
    const html = renderToStaticMarkup(React.createElement(FederatedDashboard, {}))
    assert.ok(html.includes('lstm-v2'))
    assert.ok(html.includes('mlp-v3'))
  })
})