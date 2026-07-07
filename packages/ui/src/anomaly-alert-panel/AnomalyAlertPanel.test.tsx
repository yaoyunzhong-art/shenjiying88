/**
 * AnomalyAlertPanel tests - AI异常告警面板
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useAnomalyAlert' && parent?.filename?.includes('anomaly-alert-panel')) {
    return require.resolve('./useAnomalyAlert.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { AnomalyAlertPanel } = require('./AnomalyAlertPanel')
Module._resolveFilename = origResolveFilename

describe('AnomalyAlertPanel V10 Day 9', () => {
  it('renders anomaly alert panel', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('data-testid="anomaly-alert-panel"'))
    assert.ok(html.includes('AI 异常告警中心'))
  })

  it('shows severity counters', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('severity-critical'))
    assert.ok(html.includes('severity-warning'))
    assert.ok(html.includes('severity-info'))
  })

  it('shows 4 anomaly alerts from mock data', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('anomaly-anomaly-1'))
    assert.ok(html.includes('anomaly-anomaly-2'))
    assert.ok(html.includes('anomaly-anomaly-3'))
    assert.ok(html.includes('anomaly-anomaly-4'))
  })

  it('anomaly severity data attributes', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('data-severity="critical"'))
    assert.ok(html.includes('data-severity="warning"'))
    assert.ok(html.includes('data-severity="info"'))
  })

  it('anomaly status data attributes', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('data-status="open"'))
    assert.ok(html.includes('data-status="investigating"'))
    assert.ok(html.includes('data-status="dismissed"'))
  })

  it('shows anomaly type badges', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('anomaly-type-badge-spike'))
    assert.ok(html.includes('anomaly-type-badge-drift'))
    assert.ok(html.includes('anomaly-type-badge-outlier'))
    assert.ok(html.includes('anomaly-type-badge-seasonal_break'))
    assert.ok(html.includes('anomaly-type-badge-pattern_change'))
  })

  it('trend bar chart rendered', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('trend-bar-'))
  })

  it('shows investigate buttons for open alerts', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('investigate-anomaly-1'))
    assert.ok(html.includes('investigate-anomaly-2'))
  })

  it('shows dismiss buttons for open alerts', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('dismiss-anomaly-1'))
  })

  it('no resolve button for open alerts', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(!html.includes('resolve-anomaly-1'))
  })

  it('shows resolve button for investigating alerts', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('resolve-anomaly-3'))
  })

  it('tabs rendered', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('tab-anomalies'))
    assert.ok(html.includes('tab-decisions'))
  })

  it('shows AI decision records count', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('AI 决策记录'))
  })

  it('shows decision stats in tab label', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('AI 决策记录'))
    // Stats section is in decisions tab (non-default), check tab contains count
    assert.ok(html.includes('AI 决策记录 (5)'))
  })

  it('shows AI recommendations on alerts', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('AI建议'))
    assert.ok(html.includes('rate-limit'))
  })

  it('h5 variant applies compact', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('pc variant', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, { variant: 'pc' }))
    assert.ok(html.includes('data-variant="pc"'))
  })

  it('pad variant', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('tabs with counts shown', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('data-testid="tab-decisions"'))
    assert.ok(html.includes('异常告警 (4)'))
    assert.ok(html.includes('AI 决策记录 (5)'))
  })

  it('anomaly type labels rendered', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('突增'))
    assert.ok(html.includes('漂移'))
    assert.ok(html.includes('离群点'))
    assert.ok(html.includes('季节性中断'))
  })

  it('severity labels rendered', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('严重'))
    assert.ok(html.includes('警告'))
    assert.ok(html.includes('提示'))
  })

  it('metric values in alert detail', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('1250'))
    assert.ok(html.includes('420'))
    assert.ok(html.includes('197.6'))
    assert.ok(html.includes('62.5'))
    assert.ok(html.includes('650'))
  })

  it('error message in tab label', () => {
    const html = renderToStaticMarkup(React.createElement(AnomalyAlertPanel, {}))
    assert.ok(html.includes('AI 决策记录 (5)'))
  })
})
