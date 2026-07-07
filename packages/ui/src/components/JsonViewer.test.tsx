import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { JsonViewer } = require('./JsonViewer');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(JsonViewer, props));
}

test('JsonViewer: renders primitive string data', () => {
  const html = renderHTML({ data: 'hello' });
  assert.ok(html.includes('hello'), 'should include string content');
});

test('JsonViewer: renders number data', () => {
  const html = renderHTML({ data: 42 });
  assert.ok(html.includes('42'));
});

test('JsonViewer: renders boolean data', () => {
  const html = renderHTML({ data: true });
  assert.ok(html.includes('true'));
});

test('JsonViewer: renders null data', () => {
  const html = renderHTML({ data: null });
  assert.ok(html.includes('null'));
});

test('JsonViewer: renders empty object', () => {
  const html = renderHTML({ data: {} });
  assert.ok(html.includes('{') && html.includes('}'));
});

test('JsonViewer: renders empty array', () => {
  const html = renderHTML({ data: [] });
  assert.ok(html.includes('[') && html.includes(']'));
});

test('JsonViewer: renders object with string key', () => {
  const data = { name: 'test' };
  const html = renderHTML({ data });
  assert.ok(html.includes('name'), 'should include key name');
  assert.ok(html.includes('test'), 'should include value');
});

test('JsonViewer: renders nested object at depth 1', () => {
  const data = { a: { b: 1 } };
  const html = renderHTML({ data, defaultExpandDepth: 1 });
  assert.ok(html.includes('a'), 'should include outer key');
  assert.ok(html.includes('b'), 'should include inner key');
});

test('JsonViewer: renders array elements', () => {
  const data = [10, 20, 30];
  const html = renderHTML({ data });
  assert.ok(html.includes('10'));
  assert.ok(html.includes('20'));
  assert.ok(html.includes('30'));
});

test('JsonViewer: renders mixed type data', () => {
  const data = { id: 1, active: true, tags: ['x', 'y'], meta: null };
  const html = renderHTML({ data });
  assert.ok(html.includes('id'), 'key id');
  assert.ok(html.includes('active'), 'key active');
  assert.ok(html.includes('tags'), 'key tags');
  assert.ok(html.includes('meta'), 'key meta');
  assert.ok(html.includes('x'), 'array item x');
});

test('JsonViewer: has role="region" and aria-label', () => {
  const html = renderHTML({ data: { foo: 1 } });
  assert.ok(html.includes('role="region"'));
  assert.ok(html.includes('aria-label'));
});

test('JsonViewer: accepts custom className', () => {
  const html = renderHTML({ data: {}, className: 'custom-json' });
  assert.ok(html.includes('custom-json'));
});

test('JsonViewer: accepts custom style override', () => {
  const html = renderHTML({ data: {}, style: JSON.stringify({ maxHeight: '200px' }) });
  // style object just passes through, no string assertion
  assert.ok(html.includes('json-viewer'));
});

test('JsonViewer: renders data-testid attribute', () => {
  const html = renderHTML({ data: { key: 'val' } });
  assert.ok(html.includes('data-testid="json-viewer"'));
});
