/**
 * Phase 100 OCR 工作台 前台 Tests (V11 Sprint 3 Day 35)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useOcr' && parent?.filename?.includes('ocr-workspace')) {
    return require.resolve('./useOcr.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { OcrWorkspace } = require('./index')
Module._resolveFilename = origResolveFilename

describe('OCR + 文档解析工作台 V11 Sprint 3 Day 35', () => {
  it('OcrWorkspace 渲染主面板', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('data-testid="ocr-workspace"'))
    assert.ok(html.includes('OCR + 文档解析工作台'))
  })

  it('渲染统计面板 5 个指标', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-stats-panel'))
    assert.ok(html.includes('ocr-stat-tasks'))
    assert.ok(html.includes('ocr-stat-completed'))
    assert.ok(html.includes('ocr-stat-docs'))
    assert.ok(html.includes('ocr-stat-chars'))
    assert.ok(html.includes('ocr-stat-confidence'))
  })

  it('统计数字正确', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('89')) // totalTasks
    assert.ok(html.includes('82')) // completedTasks
    assert.ok(html.includes('56')) // totalDocuments
    assert.ok(html.includes('1,245,780')) // totalChars (with toLocaleString)
    assert.ok(html.includes('93.0%')) // avgConfidence 0.93
  })

  it('Tab 切换按钮', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-tab-tasks'))
    assert.ok(html.includes('ocr-tab-docs'))
    assert.ok(html.includes('ocr-tab-engines'))
  })

  it('默认 OCR 任务 Tab 激活', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('data-active="true"'))
  })

  it('OCR 任务卡片渲染', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-task-ocr-001'))
    assert.ok(html.includes('ocr-task-ocr-002'))
    assert.ok(html.includes('ocr-task-ocr-003'))
  })

  it('任务状态标签', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('已完成')) // completed
    assert.ok(html.includes('识别中')) // processing
  })

  it('任务 data-status 属性', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('data-status="completed"'))
    assert.ok(html.includes('data-status="processing"'))
  })

  it('处理中任务显示进度条', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-task-progress-ocr-003'))
  })

  it('新任务创建表单', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-new-task-form'))
    assert.ok(html.includes('ocr-new-asset'))
    assert.ok(html.includes('ocr-new-engine'))
    assert.ok(html.includes('ocr-new-submit'))
  })

  it('任务详情面板 (默认选中第一个)', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-task-detail-ocr-001'))
  })

  it('文本块 (含置信度 + 位置)', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('ocr-block-b1'))
    assert.ok(html.includes('ocr-block-b2'))
    assert.ok(html.includes('data-block-type="title"'))
    assert.ok(html.includes('data-block-type="text"'))
  })

  it('置信度显示', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('置信 96%'))
  })

  it('compact 模式', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('engine 显示', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('mock-paddleocr'))
    assert.ok(html.includes('mock-azure-cv'))
    assert.ok(html.includes('mock-tesseract'))
  })

  it('语言支持显示', () => {
    const html = renderToStaticMarkup(React.createElement(OcrWorkspace, {}))
    assert.ok(html.includes('zh-CN'))
  })
})