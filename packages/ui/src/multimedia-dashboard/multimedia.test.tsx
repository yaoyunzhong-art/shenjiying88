/**
 * Phase 99 多模态存储 前台 Tests (V11 Sprint 3 Day 34)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useMultimedia' && parent?.filename?.includes('multimedia-dashboard')) {
    return require.resolve('./useMultimedia.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { MultimediaDashboard } = require('./index')
Module._resolveFilename = origResolveFilename

describe('多模态存储前台 V11 Sprint 3 Day 34', () => {
  it('MultimediaDashboard 渲染主面板', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('data-testid="multimedia-dashboard"'))
    assert.ok(html.includes('多模态存储'))
  })

  it('渲染存储统计面板', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-stats-panel'))
    assert.ok(html.includes('总资产'))
    assert.ok(html.includes('总占用'))
  })

  it('统计数字正确', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-stat-total'))
    assert.ok(html.includes('156')) // totalAssets
    assert.ok(html.includes('mm-stat-dedup'))
    assert.ok(html.includes('7')) // duplicateHits
  })

  it('按类型展示标签 chip', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-type-image'))
    assert.ok(html.includes('mm-type-video'))
    assert.ok(html.includes('mm-type-document'))
    assert.ok(html.includes('mm-type-audio'))
  })

  it('渲染资产卡片网格', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-asset-asset-001'))
    assert.ok(html.includes('mm-asset-asset-002'))
    assert.ok(html.includes('mm-asset-asset-003'))
  })

  it('资产状态标签', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('就绪')) // ready
    assert.ok(html.includes('处理中')) // processing
  })

  it('资产类型 data-type 属性', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('data-type="image"'))
    assert.ok(html.includes('data-type="video"'))
    assert.ok(html.includes('data-type="document"'))
  })

  it('衍生版本数显示', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('3 衍生')) // asset-001: variantCount=3
  })

  it('资产操作按钮 (签名 URL + 删除)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-asset-signed-asset-001'))
    assert.ok(html.includes('mm-asset-delete-asset-001'))
  })

  it('存储后端 toggle 按钮', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-toggle-backends'))
    assert.ok(html.includes('存储后端 (2)'))
  })

  it('上传按钮', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-upload-btn'))
  })

  it('compact 模式 (h5)', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  it('filterType 过滤显示', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, { filterType: 'image' }))
    assert.ok(html.includes('过滤: 图片'))
  })

  it('处理中资产显示进度条', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('mm-asset-progress-asset-002'))
  })

  it('asset tags 展示', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    assert.ok(html.includes('#hero'))
    assert.ok(html.includes('#finance'))
  })

  it('存储后端默认标记', () => {
    const html = renderToStaticMarkup(React.createElement(MultimediaDashboard, {}))
    // 没有显示 backends (showBackends=false), 但 toggle button 显示数量
    assert.ok(html.includes('存储后端 (2)'))
  })
})