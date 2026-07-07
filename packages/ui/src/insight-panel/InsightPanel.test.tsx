/**
 * InsightPanel tests (V10 Sprint 2 Day 18)
 *
 * 12 tests 覆盖:
 * - 基础渲染 (5)
 * - 5 模板按钮 (1)
 * - 洞察列表渲染 (2)
 * - 状态徽章 (2)
 * - Markdown 详情 (1)
 * - 5 端适配 (1)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useInsight' && parent?.filename?.includes('insight-panel')) {
    return require.resolve('./useInsight.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { InsightPanel } = require('./InsightPanel')
const { InsightTrigger } = require('./InsightTrigger')
Module._resolveFilename = origResolveFilename

// ============ Mock useInsight (替代 react-query) ============
function MockInsightPanel() {
  return React.createElement(InsightPanel)
}

describe('InsightPanel V10 Sprint 2 Phase 94', () => {
  // ============ 1. 基础渲染 (5 tests) ============
  describe('1. 基础渲染', () => {
    it('renders panel root with testid', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('data-testid="insight-panel"'))
    })

    it('默认 variant=pc', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('data-variant="pc"'))
    })

    it('显示标题 "AI 智能洞察"', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('AI 智能洞察'))
    })

    it('显示模板数描述', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('基于'))
      assert.ok(html.includes('模板'))
    })

    it('显示洞察列表 section', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('data-testid="insight-list"'))
    })
  })

  // ============ 2. 模板按钮 (1 test) ============
  describe('2. 模板按钮', () => {
    it('渲染 5 个模板按钮', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('data-testid="template-sales"'))
      assert.ok(html.includes('data-testid="template-inventory"'))
      assert.ok(html.includes('data-testid="template-finance"'))
      assert.ok(html.includes('data-testid="template-marketing"'))
      assert.ok(html.includes('data-testid="template-customer"'))
    })
  })

  // ============ 3. 列表渲染 (2 tests) ============
  describe('3. 列表渲染', () => {
    it('显示 mock 洞察项', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('销售洞察'))
      assert.ok(html.includes('库存洞察'))
    })

    it('显示 token 用量', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('Tokens'))
      assert.ok(html.includes('375'))
    })
  })

  // ============ 4. 状态徽章 (2 tests) ============
  describe('4. 状态徽章', () => {
    it('completed 状态显示绿色徽章', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('已完成'))
      assert.ok(html.includes('#10b981'))
    })

    it('generating 状态显示蓝色徽章', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('生成中'))
      assert.ok(html.includes('#3b82f6'))
    })
  })

  // ============ 5. Markdown 详情 (1 test) ============
  describe('5. Markdown 详情', () => {
    it('显示 markdown 内容 (h3 + ul)', () => {
      const html = renderToStaticMarkup(React.createElement(InsightPanel, {}))
      assert.ok(html.includes('data-testid="insight-detail"'))
      assert.ok(html.includes('<h3>'))
      assert.ok(html.includes('<li>'))
    })
  })

  // ============ 6. InsightTrigger (1 test) ============
  describe('6. InsightTrigger 按钮', () => {
    it('渲染触发按钮 + data-* 属性', () => {
      const html = renderToStaticMarkup(
        React.createElement(InsightTrigger, {
          reportId: 'rpt-001',
          templateType: 'sales',
        }),
      )
      assert.ok(html.includes('data-testid="insight-trigger"'))
      assert.ok(html.includes('data-report-id="rpt-001"'))
      assert.ok(html.includes('data-template="sales"'))
      assert.ok(html.includes('AI 洞察'))
    })
  })
})
