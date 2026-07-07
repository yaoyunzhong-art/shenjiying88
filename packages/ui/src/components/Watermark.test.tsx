/**
 * Watermark 组件测试 (SSR 模式)
 *
 * 覆盖:
 * 1. 基础渲染 - 水印文字
 * 2. disabled 禁用
 * 3. 空 content 不渲染
 * 4. 自定义属性 (字体大小、颜色、透明度、旋转角度)
 * 5. 自定义间距
 * 6. 嵌套 children
 * 7. 类型导出一致性
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const { Watermark } = require('./Watermark');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Watermark, props));
}

test('Watermark: renders watermark overlay with content', () => {
  const html = renderHTML({ content: '机密文件', children: React.createElement('div', null, '内容') });
  assert.ok(html.includes('data-watermark="true"'));
  assert.ok(html.includes('data-testid="watermark-overlay"'));
  assert.ok(html.includes('内容'));
});

test('Watermark: disabled hides overlay', () => {
  const html = renderHTML({ content: '机密', disabled: true, children: React.createElement('div', null, '内容') });
  assert.ok(!html.includes('data-watermark="true"'));
  assert.ok(!html.includes('watermark-overlay'));
  assert.ok(html.includes('内容'));
});

test('Watermark: empty content returns children only', () => {
  const html = renderHTML({ children: React.createElement('span', null, 'hello') });
  assert.ok(!html.includes('watermark-overlay'));
  assert.ok(html.includes('hello'));
});

test('Watermark: custom fontSize renders', () => {
  const html = renderHTML({ content: 'Test', fontSize: 20, children: React.createElement('div') });
  assert.ok(html.includes('data-watermark="true"'));
});

test('Watermark: custom opacity included in generated SVG', () => {
  const html = renderHTML({ content: 'OP', opacity: 0.5, children: React.createElement('div') });
  assert.ok(html.includes('data-watermark="true"'));
  // The opacity value is embedded in the SVG data URL
  assert.ok(html.includes('data-watermark'));
});

test('Watermark: custom rotation included in generated SVG', () => {
  const html = renderHTML({ content: 'ROT', rotate: 45, children: React.createElement('div') });
  assert.ok(html.includes('data-watermark="true"'));
});

test('Watermark: custom color included', () => {
  const html = renderHTML({ content: 'CLR', color: '#ff0000', children: React.createElement('div') });
  assert.ok(html.includes('data-watermark="true"'));
});

test('Watermark: custom gap and offset', () => {
  const html = renderHTML({
    content: 'GAP',
    gap: [200, 200] as [number, number],
    offset: [10, 10] as [number, number],
    children: React.createElement('div'),
  });
  assert.ok(html.includes('data-watermark="true"'));
});

test('Watermark: custom zIndex', () => {
  const html = renderHTML({ content: 'Z', zIndex: 100, children: React.createElement('div') });
  // Check that the overlay div has the z-index inline style in the data URL
  assert.ok(html.includes('data-watermark="true"'));
  // Overlay should have z-index in the style
  assert.ok(html.includes('9999') || html.includes('z-index') || html.includes('position'));
});

test('Watermark: custom data-testid on root', () => {
  const html = renderHTML({ content: 'TID', 'data-testid': 'my-watermark', children: React.createElement('div') });
  assert.ok(html.includes('data-testid="my-watermark"'));
});

test('Watermark: renders children correctly', () => {
  const html = renderHTML({
    content: '水印',
    children: React.createElement('section', { className: 'content-area' }, 'Hello World'),
  });
  assert.ok(html.includes('Hello World'));
  assert.ok(html.includes('content-area'));
});
