import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { SegmentedControl } = require('./SegmentedControl');

const basicOptions = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
];

describe('SegmentedControl', () => {
  // ── 基本渲染 ──
  test('renders all options', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions })
    );
    assert.match(html, />日</);
    assert.match(html, />周</);
    assert.match(html, />月</);
  });

  test('has role="radiogroup" on container', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions })
    );
    assert.match(html, /role="radiogroup"/);
  });

  test('each option has role="radio"', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions })
    );
    const matches = html.match(/role="radio"/g);
    assert.equal(matches?.length, 3);
  });

  // ── 默认/受控选中 ──
  test('defaultValue marks initial selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, {
        options: basicOptions,
        defaultValue: 'week',
      })
    );
    assert.match(html, /aria-checked="true"/);
    // 确保 aria-checked 只出现一次
    const checked = html.match(/aria-checked="true"/g);
    assert.equal(checked?.length, 1);
  });

  test('first option is selected when no defaultValue given', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions })
    );
    // 第一个选项应该 isSelected 样式（fontWeight 600）
    assert.match(html, /font-weight:\s*600;.*>日/);
  });

  // ── 图标渲染 ──
  test('renders icon when provided', () => {
    const optionsWithIcon = [
      { value: 'list', label: '列表', icon: React.createElement('span', { 'data-icon': 'list' }) },
      { value: 'grid', label: '网格', icon: React.createElement('span', { 'data-icon': 'grid' }) },
    ];
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: optionsWithIcon })
    );
    assert.match(html, /data-icon="list"/);
    assert.match(html, /data-icon="grid"/);
  });

  // ── 禁用选项 ──
  test('disabled option has aria-disabled and cursor style', () => {
    const optsWithDisabled = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: optsWithDisabled })
    );
    assert.match(html, /disabled=""/);
    assert.match(html, /opacity:\s*0\.5/);
  });

  // ── 整体禁用 ──
  test('disabled prop disables all options', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions, disabled: true })
    );
    const disabledAttrs = html.match(/disabled=""/g);
    assert.equal(disabledAttrs?.length, 3);
  });

  // ── 尺寸 ──
  test('size=sm renders smaller container', () => {
    const htmlSm = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions, size: 'sm' })
    );
    const htmlLg = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions, size: 'lg' })
    );
    // sm 高度 28px, lg 高度 44px
    assert.match(htmlSm, /height:\s*28px/);
    assert.match(htmlLg, /height:\s*44px/);
  });

  // ── fullWidth ──
  test('fullWidth adds width 100%', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: basicOptions, fullWidth: true })
    );
    assert.match(html, /width:\s*100%/);
  });

  // ── aria-label ──
  test('accepts custom aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, {
        options: basicOptions,
        'aria-label': '视图切换',
      })
    );
    assert.match(html, /aria-label="视图切换"/);
  });

  // ── data-testid ──
  test('accepts data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, {
        options: basicOptions,
        'data-testid': 'segment-1',
      })
    );
    assert.match(html, /data-testid="segment-1"/);
  });

  // ── 自定义 className ──
  test('accepts className', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, {
        options: basicOptions,
        className: 'my-custom-cls',
      })
    );
    assert.match(html, /class="my-custom-cls"/);
  });

  // ── 无 options（空数组） ──
  test('renders empty container when no options', () => {
    const html = renderToStaticMarkup(
      React.createElement(SegmentedControl, { options: [] })
    );
    assert.match(html, /role="radiogroup"/);
    assert.doesNotMatch(html, /role="radio"/);
  });
});
