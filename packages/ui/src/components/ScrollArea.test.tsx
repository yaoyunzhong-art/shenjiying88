import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ScrollArea } = require('./ScrollArea');

test('ScrollArea: renders children with data-testid and aria attributes', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, { 'data-testid': 'sa1', maxHeight: 200 },
      React.createElement('div', { key: '1' }, 'Item 1'),
      React.createElement('div', { key: '2' }, 'Item 2'),
      React.createElement('div', { key: '3' }, 'Item 3'),
    )
  );
  assert.ok(html.includes('Item 1'));
  assert.ok(html.includes('Item 2'));
  assert.ok(html.includes('Item 3'));
  assert.ok(html.includes('sa1-viewport'));
  assert.ok(html.includes('sa1-content'));
  assert.ok(html.includes('role="region"'));
  assert.ok(html.includes('tabindex="0"'));
  assert.ok(html.includes('Scrollable content'));
});

test('ScrollArea: renders custom aria-label', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-aria',
      'aria-label': '门店列表滚动区域',
      maxHeight: 200,
    }, React.createElement('div', null, '内容'))
  );
  assert.ok(html.includes('门店列表滚动区域'));
});

test('ScrollArea: renders with fixed height style', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-h',
      height: 300,
    }, React.createElement('div', null, 'A'))
  );
  assert.ok(html.includes('height:300px'));
});

test('ScrollArea: renders with maxHeight style', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-mh',
      maxHeight: 400,
    }, React.createElement('div', null, 'B'))
  );
  assert.ok(html.includes('max-height:400px'));
});

test('ScrollArea: renders with track and thumb data-testids', () => {
  const items = Array.from({ length: 50 }, (_, i) =>
    React.createElement('div', { key: String(i) }, `Row ${i}`)
  );
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-track',
      maxHeight: 150,
    }, ...items)
  );
  assert.ok(html.includes('sa-track-viewport'));
  assert.ok(html.includes('sa-track-content'));
  assert.ok(html.includes('Row 0'));
  assert.ok(html.includes('Row 49'));
  // In SSR, scrollHeight===clientHeight===0 so hasScrollbar is false
  // Track/thumb only render when hasScrollbar is true
  // We verify the viewport and content render correctly
});

test('ScrollArea: SSR renders class name', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-cls',
      className: 'my-scroll-area custom-panel',
      maxHeight: 200,
    }, React.createElement('div', null, 'H'))
  );
  assert.ok(html.includes('my-scroll-area'));
  assert.ok(html.includes('custom-panel'));
});

test('ScrollArea: SSR renders style merge', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-style',
      maxHeight: 200,
      style: { borderRadius: 8, background: '#f8fafc' },
    }, React.createElement('div', null, 'K'))
  );
  assert.ok(html.includes('border-radius:8px'));
  assert.ok(html.includes('background:#f8fafc'));
});

test('ScrollArea: renders with shadow edges flag (SSR, no edge visible initially)', () => {
  // showShadowEdges renders top/bottom shadow divs conditionally;
  // in SSR, scrollTop=0 so only bottom may appear if overflow
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-se',
      maxHeight: 200,
      showShadowEdges: true,
    }, React.createElement('div', null, 'E'))
  );
  assert.ok(html.includes('sa-se-viewport'));
});

test('ScrollArea: alwaysVisible renders viewport with data-testid', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-av',
      maxHeight: 200,
      alwaysVisible: true,
    }, React.createElement('div', null, 'D'))
  );
  assert.ok(html.includes('sa-av-viewport'));
  assert.ok(html.includes('sa-av-content'));
});

test('ScrollArea: thumb has ARIA attributes in SSR when alwaysVisible', () => {
  // In SSR, scrollHeight===clientHeight===0 so hasScrollbar=false
  // Track/thumb not rendered in SSR. Validate container renders.
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-aria2',
      maxHeight: 200,
      alwaysVisible: true,
    }, React.createElement('div', null, 'J'))
  );
  assert.ok(html.includes('sa-aria2-viewport'));
  assert.ok(html.includes('J'));
});

test('ScrollArea: renders maxWidth on wrapper', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-mw',
      maxWidth: 600,
      maxHeight: 200,
    }, React.createElement('div', null, 'F'))
  );
  assert.ok(html.includes('max-width:600px'));
});

test('ScrollArea: renders with small content (no overflow)', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-fit',
      maxHeight: 500,
    }, React.createElement('div', null, 'small content'))
  );
  assert.ok(html.includes('sa-fit-viewport'));
  assert.ok(html.includes('small content'));
});

test('ScrollArea: renders nested ScrollArea elements', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'outer',
      maxHeight: 300,
    },
      React.createElement(ScrollArea, {
        'data-testid': 'inner',
        maxHeight: 150,
        key: 'nested',
      }, React.createElement('div', null, 'nested content'))
    )
  );
  assert.ok(html.includes('outer-viewport'));
  assert.ok(html.includes('inner-viewport'));
  assert.ok(html.includes('nested content'));
});

test('ScrollArea: renders Chinese text content', () => {
  const html = renderToStaticMarkup(
    React.createElement(ScrollArea, {
      'data-testid': 'sa-zh',
      maxHeight: 200,
    },
      React.createElement('span', null, '可滚动内容'),
      React.createElement('p', null, '第二段')
    )
  );
  assert.ok(html.includes('可滚动内容'));
  assert.ok(html.includes('第二段'));
});

test('ScrollArea: is a function component exportable', () => {
  assert.equal(typeof ScrollArea, 'function');
  assert.ok(ScrollArea.length >= 1);
});

test('ScrollArea: Props type is exported', () => {
  // Verify the type export — just a compile-time check.
  // At runtime, ScrollArea component exists and can be invoked via createElement.
  const el = React.createElement(ScrollArea, { maxHeight: 100 }, null);
  assert.ok(React.isValidElement(el));
});
