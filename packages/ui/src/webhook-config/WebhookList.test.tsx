/**
 * WebhookList 组件测试 (V10 Sprint 2)
 *
 * 覆盖:
 * - 列表渲染 (端点列表/状态标签/平台标签/事件标签)
 * - 操作按钮 (测试/投递日志/编辑/删除)
 * - 空状态展示
 * - 紧凑模式 (h5/app variant)
 * - 编辑回调
 */

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const Module = require('module');
const origResolveFilename = Module._resolveFilename;

// ===== Hook Module Mock — 使用已有的 useWebhook.mock =====
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === './useWebhook') {
    return require.resolve('./useWebhook.mock');
  }
  return origResolveFilename.call(Module, request, parent, isMain, options);
};

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { WebhookList } = require('./index');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂 ----

function makeProps(overrides = {}) {
  return {
    variant: 'pc',
    ...overrides,
  };
}

// ---- 测试 ----

describe('WebhookList', () => {
  test('基础渲染 — 列表展示两个端点', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    assert.ok(html.includes('webhook-list'), '应渲染根容器');
    // 两个端点
    assert.ok(html.includes('wh-001'), '应包含 wh-001');
    assert.ok(html.includes('wh-002'), '应包含 wh-002');
    // 名称
    assert.ok(html.includes('飞书运营群'), '应展示端点名称');
    assert.ok(html.includes('钉钉销售群'), '应展示端点名称');
    // 摘要行: 共 2 个端点
    assert.ok(html.includes('共 2 个端点'), '应展示统计行');
  });

  test('状态标签渲染 — active 和 paused', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    assert.ok(html.includes('已启用'), 'active 状态的端点应展示「已启用」');
    assert.ok(html.includes('已暂停'), 'paused 状态的端点应展示「已暂停」');
  });

  test('平台标签渲染 — 飞书 / 钉钉', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    assert.ok(html.includes('飞书'), '应展示飞书标签');
    assert.ok(html.includes('钉钉'), '应展示钉钉标签');
  });

  test('事件标签渲染 — 非紧凑模式下', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    // wh-001 有三个事件
    assert.ok(html.includes('License 过期'), '应展示 license.expired 事件标签');
    assert.ok(html.includes('灰度晋级'), '应展示 canary.promoted 事件标签');
    assert.ok(html.includes('告警触发'), '应展示 monitoring.alert.fired 事件标签');
    // wh-002 有一个事件
    assert.ok(html.includes('AI 洞察生成'), '应展示 insight.generated 事件标签');
  });

  test('紧凑模式 (h5) — 不渲染事件标签', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps({ variant: 'h5' })));
    assert.ok(html.includes('data-variant="h5"'), '应标记 variant 为 h5');
    // 事件不应该渲染
    assert.ok(!html.includes('License 过期'), '紧凑模式不应展示事件标签');
    assert.ok(!html.includes('灰度晋级'), '紧凑模式不应展示事件标签');
  });

  test('紧凑模式 (app) — 不渲染事件标签', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps({ variant: 'app' })));
    assert.ok(html.includes('data-variant="app"'), '应标记 variant 为 app');
    assert.ok(!html.includes('License 过期'), '紧凑模式不应展示事件标签');
  });

  test('每个端点渲染操作按钮 — 测试/投递日志/删除', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    // wh-001 的按钮
    assert.ok(html.includes('btn-test-wh-001'), 'wh-001 应有测试按钮');
    assert.ok(html.includes('btn-deliveries-wh-001'), 'wh-001 应有投递日志按钮');
    assert.ok(html.includes('btn-delete-wh-001'), 'wh-001 应有删除按钮');
    // wh-002 的按钮
    assert.ok(html.includes('btn-test-wh-002'), 'wh-002 应有测试按钮');
    assert.ok(html.includes('btn-deliveries-wh-002'), 'wh-002 应有投递日志按钮');
    assert.ok(html.includes('btn-delete-wh-002'), 'wh-002 应有删除按钮');
    // 按钮文本
    assert.ok(html.includes('🧪 测试'), '应包含测试按钮文本');
    assert.ok(html.includes('📜 投递日志'), '应包含投递日志按钮文本');
    assert.ok(html.includes('🗑️ 删除'), '应包含删除按钮文本');
  });

  test('提供 onEdit 回调时渲染编辑按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(WebhookList, makeProps({
        onEdit: function fakeEdit() {},
      }))
    );
    assert.ok(html.includes('btn-edit-wh-001'), 'onEdit 提供时应渲染编辑按钮');
    assert.ok(html.includes('btn-edit-wh-002'), 'onEdit 提供时应渲染编辑按钮');
    assert.ok(html.includes('✏️ 编辑'), '编辑按钮应有文本');
  });

  test('不提供 onEdit 时不渲染编辑按钮', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    assert.ok(!html.includes('✏️ 编辑'), '不提供 onEdit 时不渲染编辑按钮');
  });

  test('端点 URL 渲染 — 每个端点有一个 URL', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    const urlMatches = html.match(/data-testid="endpoint-url"/g);
    assert.ok(urlMatches, '应有 URL 元素');
    assert.equal(urlMatches.length, 2, '应有 2 个 endpoint URL');
  });

  test('Secret Fingerprint 显示', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps()));
    assert.ok(html.includes('ey***xz'), '应显示 wh-001 密钥指纹');
    assert.ok(html.includes('SE***ET'), '应显示 wh-002 密钥指纹');
  });

  test('pad variant — 非紧凑模式展示事件', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps({ variant: 'pad' })));
    assert.ok(html.includes('data-variant="pad"'), '应标记 variant 为 pad');
    assert.ok(html.includes('License 过期'), 'pad 模式应展示事件标签');
  });

  test('miniprogram variant — 非紧凑模式展示事件', () => {
    const html = renderToStaticMarkup(React.createElement(WebhookList, makeProps({ variant: 'miniprogram' })));
    assert.ok(html.includes('data-variant="miniprogram"'), '应标记 variant 为 miniprogram');
    assert.ok(html.includes('License 过期'), 'miniprogram 模式应展示事件标签');
  });
});
