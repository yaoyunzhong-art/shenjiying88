import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ConfigurationVersionDiff } = require('./ConfigurationVersionDiff');

// ── Helpers ──────────────────────────────────────────────────────────────────

function render(jsx: React.ReactElement): string {
  return renderToStaticMarkup(jsx);
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

// ── Sample entries ───────────────────────────────────────────────────────────

const SAMPLE_ENTRIES = [
  {
    key: 'features.newCheckout.enabled',
    label: '新结账流程',
    oldValue: 'false',
    newValue: 'true',
    description: '启用新版结账流程',
  },
  {
    key: 'features.newCheckout.minOrderAmount',
    label: '最低订单金额',
    oldValue: '0',
    newValue: '0',
    description: '最小订单金额（元）',
  },
  {
    key: 'payment.gateway',
    label: '支付网关',
    oldValue: 'stripe',
    newValue: '',
    description: '支付服务提供商',
  },
  {
    key: 'notifications.email.enabled',
    label: '邮件通知',
    oldValue: '',
    newValue: 'true',
    description: '启用邮件通知',
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ConfigurationVersionDiff', () => {
  test('renders headers with default labels', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    assert.ok(hasText(html, '配置项'), 'should show 配置项 header');
    assert.ok(hasText(html, '旧版本'), 'should show 旧版本 header');
    assert.ok(hasText(html, '新版本'), 'should show 新版本 header');
    assert.ok(hasText(html, '变更'), 'should show 变更 header');
  });

  test('renders custom column labels', () => {
    const html = render(
      <ConfigurationVersionDiff
        entries={SAMPLE_ENTRIES}
        oldLabel="v1.2.0"
        newLabel="v1.3.0"
      />,
    );
    assert.ok(hasText(html, 'v1.2.0'), 'should show custom old label');
    assert.ok(hasText(html, 'v1.3.0'), 'should show custom new label');
  });

  test('renders all entry labels', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    assert.ok(hasText(html, '新结账流程'), 'entry 1');
    assert.ok(hasText(html, '最低订单金额'), 'entry 2');
    assert.ok(hasText(html, '支付网关'), 'entry 3');
    assert.ok(hasText(html, '邮件通知'), 'entry 4');
  });

  test('classifies changes correctly', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    assert.ok(hasText(html, '修改'), 'false->true is modified');
    assert.ok(hasText(html, '未变'), '0->0 is unchanged');
    assert.ok(hasText(html, '删除'), 'stripe->"" is removed');
    assert.ok(hasText(html, '新增'), '" "->true is added');
  });

  test('renders value cells with content', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    assert.ok(hasText(html, 'false'), 'shows old value false');
    assert.ok(hasText(html, 'true'), 'shows new value true');
    assert.ok(hasText(html, 'stripe'), 'shows old value stripe');
  });

  test('shows placeholder for empty values', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    const count = html.split('空').length - 1;
    assert.ok(count >= 2, `found ${count} empty placeholders, expected >=2`);
  });

  test('shows descriptions when provided', () => {
    const html = render(<ConfigurationVersionDiff entries={SAMPLE_ENTRIES} />);
    assert.ok(hasText(html, '启用新版结账流程'), 'description 1');
    assert.ok(hasText(html, '最小订单金额（元）'), 'description 2');
  });

  test('renders empty state when no entries provided', () => {
    const html = render(<ConfigurationVersionDiff entries={[]} />);
    assert.ok(hasText(html, '暂无配置差异'), 'empty state');
  });

  test('accepts className and style props', () => {
    const html = render(
      <ConfigurationVersionDiff
        entries={SAMPLE_ENTRIES}
        className="my-diff"
        style={{ maxWidth: 800 }}
      />,
    );
    assert.ok(hasText(html, 'my-diff'), 'class name passed');
    assert.ok(hasText(html, 'max-width'), 'style applied');
  });
});
