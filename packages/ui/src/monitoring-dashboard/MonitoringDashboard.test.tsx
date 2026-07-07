/**
 * MonitoringDashboard tests (V10 Day 9)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useMonitoringDashboard' && parent?.filename?.includes('monitoring-dashboard')) {
    return require.resolve('./useMonitoringDashboard.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { MonitoringDashboard } = require('./MonitoringDashboard')
Module._resolveFilename = origResolveFilename

describe('MonitoringDashboard V10 Day 9 Phase 93', () => {
  it('renders dashboard', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('data-testid="monitoring-dashboard"'))
    assert.ok(html.includes('监控告警中心'))
  })

  it('shows 4 severity counters', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('severity-critical'))
    assert.ok(html.includes('severity-error'))
    assert.ok(html.includes('severity-warning'))
    assert.ok(html.includes('severity-info'))
  })

  it('shows 3 seeded alerts', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('alert-alert-1'))
    assert.ok(html.includes('alert-alert-2'))
    assert.ok(html.includes('alert-alert-3'))
  })

  it('alert severity data attributes', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('data-severity="critical"'))
    assert.ok(html.includes('data-severity="warning"'))
    assert.ok(html.includes('data-severity="error"'))
  })

  it('alert status data attributes', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('data-status="firing"'))
    assert.ok(html.includes('data-status="resolved"'))
  })

  it('shows alert rules section', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('rule-rule-1'))
    assert.ok(html.includes('rule-rule-2'))
    assert.ok(html.includes('rule-rule-3'))
  })

  it('shows metrics definitions', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('metric-http.error.rate'))
    assert.ok(html.includes('metric-ai.latency.avg'))
    assert.ok(html.includes('metric-cpu.usage_percent'))
  })

  it('silence button on firing alerts', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('silence-alert-1'))
    assert.ok(html.includes('silence-alert-2'))
  })

  it('no silence button on resolved alerts', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(!html.includes('silence-alert-3'))
  })

  it('h5 variant applies compact', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('pc variant', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, { variant: 'pc' }))
    assert.ok(html.includes('data-variant="pc"'))
  })

  it('pad variant', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('severity labels rendered', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('严重'))
    assert.ok(html.includes('警告'))
    assert.ok(html.includes('错误'))
  })

  it('alert messages contain thresholds', () => {
    const html = renderToStaticMarkup(React.createElement(MonitoringDashboard, {}))
    assert.ok(html.includes('cpu.usage_percent'))
    assert.ok(html.includes('ai.latency.avg'))
    assert.ok(html.includes('80'))
    assert.ok(html.includes('1000'))
  })
})
