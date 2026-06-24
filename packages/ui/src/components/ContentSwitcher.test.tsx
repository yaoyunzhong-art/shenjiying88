import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { renderToString } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ContentSwitcher } = require('./ContentSwitcher');

const segments = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中', badge: 3 },
  { key: 'done', label: '已完成' },
  { key: 'archived', label: '已归档', disabled: true },
];

describe('ContentSwitcher', () => {
  // ---------- rendering ----------
  it('renders all segment labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('全部'));
    assert.ok(html.includes('进行中'));
    assert.ok(html.includes('已完成'));
    assert.ok(html.includes('已归档'));
  });

  it('renders with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, 'data-testid': 'cs-test-id' }),
    );
    assert.ok(html.includes('data-testid="cs-test-id"'));
  });

  it('renders badge count', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('>3<'));
  });

  it('renders badge overflow as 99+', () => {
    const bigSegments = [{ key: 'a', label: 'A', badge: 150 }];
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments: bigSegments }),
    );
    assert.ok(html.includes('>99+<'));
  });

  it('hides badge when count is 0', () => {
    const zeroSegments = [{ key: 'a', label: 'A', badge: 0 }];
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments: zeroSegments }),
    );
    assert.ok(!html.includes('>0<'));
  });

  it('renders disabled attribute on disabled segment', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('disabled=""'));
  });

  it('renders bar variant with role=tablist', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, variant: 'bar' }),
    );
    assert.ok(html.includes('role="tablist"'));
  });

  it('renders pills variant with tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, variant: 'pills' }),
    );
    assert.ok(html.includes('role="tab"'));
  });

  it('renders sm size without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, size: 'sm' }),
    );
    assert.ok(html.includes('role="tab"'));
  });

  // ---------- uncontrolled mode ----------
  it('selects first segment by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    // first segment has data-selected="true"
    assert.ok(html.includes('data-selected="true"'));
    // other segments have data-selected="false"
    assert.ok(html.includes('data-selected="false"'));
  });

  it('uses defaultSelected prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, defaultSelected: 'done' }),
    );
    assert.ok(html.includes('data-selected="true"'));
  });

  // ---------- fullWidth ----------
  it('renders fullWidth style', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments, fullWidth: true }),
    );
    // fullWidth sets container width:100% and flex:1 on buttons
    assert.ok(html.includes('width:100%'));
  });

  // ---------- accessibility ----------
  it('has role=tablist on container', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('role="tablist"'));
  });

  it('has role=tab on buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    const tabCount = (html.match(/role="tab"/g) || []).length;
    assert.strictEqual(tabCount, segments.length);
  });

  it('sets aria-selected attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('aria-selected="true"'));
  });

  it('sets aria-disabled on disabled segment', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('aria-disabled="true"'));
  });

  // ---------- icon ----------
  it('renders segments with icon', () => {
    const iconSegs = [
      { key: 'grid', label: '网格', icon: React.createElement('span', null, '🔲') },
      { key: 'list', label: '列表', icon: React.createElement('span', null, '📋') },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments: iconSegs }),
    );
    assert.ok(html.includes('网格'));
    assert.ok(html.includes('列表'));
  });

  // ---------- empty ----------
  it('handles empty segments gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments: [] }),
    );
    const tabCount = (html.match(/role="tab"/g) || []).length;
    assert.strictEqual(tabCount, 0);
  });

  // ---------- data-segment-key ----------
  it('sets data-segment-key on buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    assert.ok(html.includes('data-segment-key="all"'));
    assert.ok(html.includes('data-segment-key="active"'));
    assert.ok(html.includes('data-segment-key="done"'));
  });

  // ---------- onSelect via SSR (basic structure) ----------
  it('renders 4 segments total', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContentSwitcher, { segments }),
    );
    const buttonCount = (html.match(/<button/g) || []).length;
    assert.strictEqual(buttonCount, 4);
  });
});
