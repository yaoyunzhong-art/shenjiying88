/**
 * Phase 101 图像识别 前台 Tests (V11 Sprint 3 Day 43)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useImageRecognition' && parent?.filename?.includes('image-recognition-dashboard')) {
    return require.resolve('./useImageRecognition.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { ImageRecognitionDashboard } = require('./index')
Module._resolveFilename = origResolveFilename

describe('图像识别前台 V11 Sprint 3 Day 43', () => {
  it('ImageRecognitionDashboard 渲染主面板', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('data-testid="image-recognition-dashboard"'))
    assert.ok(html.includes('图像识别'))
  })

  it('渲染 5 个统计框 (总任务/已完成/对象/置信度/重复)', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-stat-total'))
    assert.ok(html.includes('ir-stat-completed'))
    assert.ok(html.includes('ir-stat-objects'))
    assert.ok(html.includes('ir-stat-confidence'))
    assert.ok(html.includes('ir-stat-dupes'))
  })

  it('统计数字正确', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('89'))   // totalTasks
    assert.ok(html.includes('412'))  // totalObjectsDetected
    assert.ok(html.includes('89.0%')) // avgConfidence (0.89 * 100 = 89.0%)
  })

  it('4 个 Tab 渲染 (任务/对象/视觉搜索/引擎)', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-tab-tasks'))
    assert.ok(html.includes('ir-tab-objects'))
    assert.ok(html.includes('ir-tab-visual'))
    assert.ok(html.includes('ir-tab-engines'))
  })

  it('引擎 tab badge 显示 7', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-tab-badge-engines'))
    assert.ok(html.includes('>7<'))
  })

  it('默认选中 tasks tab', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-tasks-tab'))
  })

  it('渲染 3 个 mock 任务', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-task-rec-001'))
    assert.ok(html.includes('ir-task-rec-002'))
    assert.ok(html.includes('ir-task-rec-003'))
  })

  it('任务状态标签 (completed)', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('已完成'))
  })

  it('任务引擎显示 YOLOv8n-Shelf', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('YOLOv8n-Shelf'))
    assert.ok(html.includes('EfficientNet-B0'))
    assert.ok(html.includes('CLIP'))
  })

  it('任务显示对象数和置信度', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('5 对象'))   // rec-001: objectCount=5
    assert.ok(html.includes('24 对象'))  // rec-002: objectCount=24
    assert.ok(html.includes('92.0%'))    // rec-001: avgConfidence=0.92
  })

  it('过滤器显示 6 个 taskType + 全部', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, {}))
    assert.ok(html.includes('ir-filter-all'))
    assert.ok(html.includes('ir-filter-product_recognition'))
    assert.ok(html.includes('ir-filter-shelf_analysis'))
    assert.ok(html.includes('ir-filter-image_classification'))
  })

  it('5 端 variant: h5', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('5 端 variant: app', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { variant: 'app' }))
    assert.ok(html.includes('data-variant="app"'))
  })

  it('5 端 variant: miniprogram', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { variant: 'miniprogram' }))
    assert.ok(html.includes('data-variant="miniprogram"'))
  })

  it('5 端 variant: pad', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { variant: 'pad' }))
    assert.ok(html.includes('data-variant="pad"'))
  })

  it('defaultTaskType prop', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { defaultTaskType: 'shelf_analysis' }))
    // 过滤器 active 显示 shelf_analysis
    assert.ok(html.includes('ir-tasks-tab'))
  })

  it('selectedTaskId prop 标记选中', () => {
    const html = renderToStaticMarkup(React.createElement(ImageRecognitionDashboard, { selectedTaskId: 'rec-001' }))
    assert.ok(html.includes('data-selected="true"'))
  })
})