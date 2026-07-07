/**
 * ExportButton.test.tsx — Unit tests for ExportButton component.
 *
 * Patterns:
 * - L1: 正例 — 正常导出状态渲染 / serializeToCsv 工具函数
 * - L2: 反例 — disabled / 错误提示渲染
 * - L3: 边界 — 各种 variant / format / csv 转义
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ExportButton, serializeToCsv } = require('./ExportButton');

// ---- serializeToCsv 单元测试 ----

describe('serializeToCsv', () => {
  test('应处理空数组', () => {
    assert.equal(serializeToCsv([]), '');
  });

  test('应生成带表头的 CSV', () => {
    const csv = serializeToCsv([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);
    const lines = csv.split('\n');
    assert.equal(lines[0], 'a,b');
    assert.equal(lines[1], '1,x');
    assert.equal(lines[2], '2,y');
  });

  test('应转义含逗号的值', () => {
    const csv = serializeToCsv([{ name: 'Zhang, San', age: 30 }]);
    const lines = csv.split('\n');
    assert.ok(lines[1].includes('"Zhang, San"'));
  });

  test('应处理 null 和 undefined', () => {
    const csv = serializeToCsv([{ a: null, b: undefined, c: '' }]);
    const lines = csv.split('\n');
    assert.equal(lines[0], 'a,b,c');
    assert.equal(lines[1], ',,');
  });
});

// ---- ExportButton 渲染测试 ----

describe('ExportButton', () => {
  test('应渲染默认 CSV 导出按钮', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" onExport={async () => []} />
    );
    assert.ok(html.includes('导出 CSV'));
    assert.ok(html.includes('button'));
    assert.ok(html.includes('type="button"'));
  });

  test('应渲染 JSON 导出按钮', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" format="json" onExport={async () => []} />
    );
    assert.ok(html.includes('导出 JSON'));
  });

  test('应支持自定义 label', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" label="下载报表" onExport={async () => []} />
    );
    assert.ok(html.includes('下载报表'));
  });

  test('disabled 状态应渲染 disabled 属性', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" disabled onExport={async () => []} />
    );
    assert.ok(html.includes('disabled'));
  });

  test('ghost 变体应包含 transparent 背景色', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" variant="ghost" onExport={async () => []} />
    );
    assert.ok(html.includes('transparent'));
  });

  test('默认 variant 应为 secondary', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" onExport={async () => []} />
    );
    assert.ok(html.includes('#1e293b'));
  });

  test('primary 变体应包含蓝色背景', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" variant="primary" onExport={async () => []} />
    );
    assert.ok(html.includes('#3b82f6'));
  });

  test('应渲染 SVG 下载图标', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" onExport={async () => []} />
    );
    assert.ok(html.includes('svg'));
    assert.ok(html.includes('M21 15v4'));
  });

  test('应渲染 aria-busy 属性', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" onExport={async () => []} />
    );
    assert.ok(html.includes('aria-busy'));
  });

  test('应渲染 aria-label', () => {
    const html = renderToStaticMarkup(
      <ExportButton filename="test" onExport={async () => []} />
    );
    assert.ok(html.includes('aria-label'));
  });
});
