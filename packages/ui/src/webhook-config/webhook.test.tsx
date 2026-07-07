/**
 * Webhook 前台组件测试 (V10 Sprint 2 Day 21)
 *
 * 18 tests 覆盖:
 * - WebhookList 渲染 (6)
 * - WebhookForm 表单 (7)
 * - WebhookDeliveryLog 表格 (5)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const Module = require('module')
const origResolveFilename = Module._resolveFilename
Module._resolveFilename = function (
  request: string, parent: any, isMain?: boolean, options?: any,
) {
  if (request === './useWebhook' && parent?.filename?.includes('webhook-config')) {
    return require.resolve('./useWebhook.mock')
  }
  return origResolveFilename.call(Module, request, parent, isMain, options)
}

const React = require('react')
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
)
const { WebhookList } = require('./WebhookList')
const { WebhookForm } = require('./WebhookForm')
const { WebhookDeliveryLog } = require('./WebhookDeliveryLog')
Module._resolveFilename = origResolveFilename

describe('Webhook 前台 V10 Sprint 2 Phase 95', () => {
  // ============ 1. WebhookList 渲染 (6 tests) ============
  describe('1. WebhookList 渲染', () => {
    it('渲染根容器 + variant', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('data-testid="webhook-list"'))
      assert.ok(html.includes('data-variant="pc"'))
    })

    it('显示 endpoint 数量', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('共'))
      assert.ok(html.includes('个端点'))
    })

    it('渲染 mock endpoint 项 (wh-001 + wh-002)', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('data-testid="endpoint-wh-001"'))
      assert.ok(html.includes('data-testid="endpoint-wh-002"'))
    })

    it('显示平台 badge (飞书/钉钉)', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('飞书'))
      assert.ok(html.includes('钉钉'))
    })

    it('显示状态 badge (active=绿/paused=橙)', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('#10b981')) // active
      assert.ok(html.includes('#f59e0b')) // paused
      assert.ok(html.includes('已启用'))
      assert.ok(html.includes('已暂停'))
    })

    it('渲染 3 个操作按钮 (test/deliveries/delete) + 可选 edit', () => {
      // 无 onEdit 时: 3 个按钮
      const html = renderToStaticMarkup(React.createElement(WebhookList, {}))
      assert.ok(html.includes('data-testid="btn-test-wh-001"'))
      assert.ok(html.includes('data-testid="btn-deliveries-wh-001"'))
      assert.ok(html.includes('data-testid="btn-delete-wh-001"'))
    })

    it('传 onEdit 时渲染 edit 按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(WebhookList, { onEdit: () => null }),
      )
      assert.ok(html.includes('data-testid="btn-edit-wh-001"'))
    })
  })

  // ============ 2. WebhookForm 表单 (7 tests) ============
  describe('2. WebhookForm 表单', () => {
    it('渲染表单根 + title', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('data-testid="webhook-form"'))
      assert.ok(html.includes('新建 Webhook'))
    })

    it('包含 5 个输入字段', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('data-testid="input-name"'))
      assert.ok(html.includes('data-testid="input-url"'))
      assert.ok(html.includes('data-testid="input-secret"'))
      assert.ok(html.includes('data-testid="input-max-retries"'))
      assert.ok(html.includes('data-testid="input-description"'))
    })

    it('平台下拉含 4 个选项', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('data-testid="select-platform"'))
      assert.ok(html.includes('飞书'))
      assert.ok(html.includes('钉钉'))
      assert.ok(html.includes('企业微信'))
      assert.ok(html.includes('通用'))
    })

    it('事件订阅 grid 含 9 个事件', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('data-testid="events-grid"'))
      assert.ok(html.includes('License 过期'))
      assert.ok(html.includes('灰度晋级'))
      assert.ok(html.includes('AI 洞察'))
    })

    it('默认 maxRetries=3', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('value="3"'))
    })

    it('提交按钮 + 取消按钮', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, { onCancel: () => null }))
      assert.ok(html.includes('data-testid="btn-submit"'))
      assert.ok(html.includes('data-testid="btn-cancel"'))
    })

    it('默认平台 = feishu, URL 前缀自动填充', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookForm, {}))
      assert.ok(html.includes('https://open.feishu.cn/open-apis/bot/v2/hook/'))
    })
  })

  // ============ 3. WebhookDeliveryLog 表格 (5 tests) ============
  describe('3. WebhookDeliveryLog 表格', () => {
    it('渲染表格根 + 表头', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookDeliveryLog, {}))
      assert.ok(html.includes('data-testid="delivery-log"'))
      assert.ok(html.includes('data-testid="delivery-table"'))
      assert.ok(html.includes('事件'))
      assert.ok(html.includes('状态'))
      assert.ok(html.includes('尝试'))
      assert.ok(html.includes('HTTP'))
      assert.ok(html.includes('耗时'))
    })

    it('显示统计 (success/retry/fail)', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookDeliveryLog, {}))
      assert.ok(html.includes('data-testid="stat-success"'))
      assert.ok(html.includes('data-testid="stat-retry"'))
      assert.ok(html.includes('data-testid="stat-fail"'))
      assert.ok(html.includes('成功'))
      assert.ok(html.includes('重试'))
      assert.ok(html.includes('失败'))
    })

    it('3 条 mock 投递记录', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookDeliveryLog, {}))
      assert.ok(html.includes('data-testid="delivery-whd-001"'))
      assert.ok(html.includes('data-testid="delivery-whd-002"'))
      assert.ok(html.includes('data-testid="delivery-whd-003"'))
    })

    it('显示成功/重试/死信 3 种状态色', () => {
      const html = renderToStaticMarkup(React.createElement(WebhookDeliveryLog, {}))
      assert.ok(html.includes('#10b981')) // success 绿
      assert.ok(html.includes('#3b82f6')) // retrying 蓝
      assert.ok(html.includes('#dc2626')) // dead_letter 深红
    })

    it('endpoint 过滤 (传 endpoint 时)', () => {
      const html = renderToStaticMarkup(
        React.createElement(WebhookDeliveryLog, {
          endpoint: {
            id: 'wh-001', name: 'Test', platform: 'feishu',
            url: '', events: [], status: 'active', maxRetries: 3,
            secretFingerprint: '', createdAt: '', updatedAt: '',
          },
        }),
      )
      assert.ok(html.includes('data-endpoint="wh-001"'))
      assert.ok(html.includes('Test'))
    })
  })
})
