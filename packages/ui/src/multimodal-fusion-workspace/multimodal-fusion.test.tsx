/**
 * Phase 103 多模态融合 前台 Tests (V11 Sprint 3 Day 46)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useMultimodalFusion' && parent?.filename?.includes('multimodal-fusion-workspace')) {
    return require.resolve('./useMultimodalFusion.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { MultimodalFusionWorkspace } = require('./index')
Module._resolveFilename = origResolveFilename

describe('多模态融合前台 V11 Sprint 3 Day 46', () => {
  it('MultimodalFusionWorkspace 渲染主面板', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('data-testid="multimodal-fusion-workspace"'))
    assert.ok(html.includes('多模态融合分析'))
  })

  it('5 个统计框 (总任务/已完成/洞察/异常/关键异常)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-stat-total'))
    assert.ok(html.includes('mf-stat-completed'))
    assert.ok(html.includes('mf-stat-insights'))
    assert.ok(html.includes('mf-stat-anomalies'))
    assert.ok(html.includes('mf-stat-critical'))
  })

  it('统计数字正确', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('78'))
    assert.ok(html.includes('245'))
    assert.ok(html.includes('18'))
  })

  it('4 个 Tab 渲染', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-tab-tasks'))
    assert.ok(html.includes('mf-tab-insights'))
    assert.ok(html.includes('mf-tab-search'))
    assert.ok(html.includes('mf-tab-templates'))
  })

  it('默认选中 tasks tab', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-tasks-tab'))
  })

  it('渲染 2 个 mock 任务', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-task-task-001'))
    assert.ok(html.includes('mf-task-task-002'))
  })

  it('任务显示数据源权重', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-task-source-task-001-0'))
    assert.ok(html.includes('40%'))
    assert.ok(html.includes('30%'))
  })

  it('任务显示洞察/异常计数', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-task-insights-task-001'))
    assert.ok(html.includes('mf-task-anomalies-task-001'))
  })

  it('任务状态显示 (completed)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('已完成'))
  })

  it('过滤器显示 8 taskType + 全部', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, {}))
    assert.ok(html.includes('mf-filter-all'))
    assert.ok(html.includes('mf-filter-comprehensive_analysis'))
    assert.ok(html.includes('mf-filter-anomaly_detection'))
    assert.ok(html.includes('mf-filter-compliance_audit'))
  })

  it('5 端 variant: h5', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('5 端 variant: app', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('5 端 variant: miniprogram', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  it('5 端 variant: pad', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('defaultTab prop (insights)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { defaultTab: 'insights' }))
    assert.ok(html.includes('mf-insights-tab'))
  })

  it('defaultTab prop (search)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { defaultTab: 'search' }))
    assert.ok(html.includes('mf-search-tab'))
  })

  it('defaultTab prop (templates)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { defaultTab: 'templates' }))
    assert.ok(html.includes('mf-templates-tab'))
  })

  it('selectedTaskId prop 标记选中', () => {
    const html = renderToStaticMarkup(React.createElement(MultimodalFusionWorkspace, { selectedTaskId: 'task-001' }))
    assert.ok(html.includes('data-selected="true"'))
  })
})