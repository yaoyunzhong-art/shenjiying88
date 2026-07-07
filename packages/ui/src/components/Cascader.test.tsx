import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { Cascader } = require('./Cascader');

const regionOptions = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖区' },
          { value: 'binjiang', label: '滨江区' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京' },
      { value: 'suzhou', label: '苏州' },
    ],
  },
  {
    value: 'beijing',
    label: '北京',
    children: [
      { value: 'haidian', label: '海淀区' },
      { value: 'chaoyang', label: '朝阳区' },
    ],
  },
];

describe('Cascader', () => {
  // ── 基本渲染 ──
  test('renders placeholder when no selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, placeholder: '请选择地区' })
    );
    assert.match(html, />请选择地区</);
  });

  test('renders with default placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions })
    );
    assert.match(html, />请选择</);
  });

  // ── aria 属性 ──
  test('has aria-expanded on trigger', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions })
    );
    assert.match(html, /aria-expanded="false"/);
  });

  test('trigger button has type="button"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions })
    );
    assert.match(html, /type="button"/);
  });

  test('accepts custom aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, 'aria-label': '地区选择' })
    );
    assert.match(html, /aria-label="地区选择"/);
  });

  // ── data-testid ──
  test('accepts data-testid on root', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, 'data-testid': 'cascader-1' })
    );
    assert.match(html, /data-testid="cascader-1"/);
  });

  test('renders trigger with data-testid suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, 'data-testid': 'cascader-1' })
    );
    assert.match(html, /data-testid="cascader-1-trigger"/);
  });

  // ── 显示选中值 ──
  test('defaultValue displays path in trigger text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: regionOptions,
        defaultValue: ['zhejiang', 'hangzhou'],
      })
    );
    // SSR renders trigger with full path in display text
    assert.match(html, />浙江 \/ 杭州</);
  });

  test('single-level defaultValue displays in trigger', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: [{ value: 'opt1', label: '选项一' }],
        defaultValue: ['opt1'],
      })
    );
    assert.match(html, />选项一</);
  });

  // ── 禁用状态 ──
  test('disabled prop disables trigger button', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, disabled: true })
    );
    assert.match(html, /disabled=""/);
  });

  test('disabled trigger has gray background', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, disabled: true })
    );
    assert.match(html, /background-color:#f3f4f6/);
  });

  // ── 尺寸 ──
  test('size=sm renders smaller trigger', () => {
    const htmlSm = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, size: 'sm' })
    );
    const htmlLg = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, size: 'lg' })
    );
    assert.match(htmlSm, /height:\s*28px/);
    assert.match(htmlLg, /height:\s*44px/);
  });

  test('size=md renders default trigger', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions, size: 'md' })
    );
    assert.match(html, /height:\s*36px/);
  });

  // ── 3级路径选中 ──
  test('selects nested value with 3-level path', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: regionOptions,
        defaultValue: ['zhejiang', 'hangzhou', 'xihu'],
      })
    );
    assert.match(html, />浙江 \/ 杭州 \/ 西湖区</);
  });

  // ── className ──
  test('accepts className on trigger button', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: regionOptions,
        className: 'my-cascader-cls',
      })
    );
    assert.match(html, /class="my-cascader-cls"/);
  });

  // ── 空选项 ──
  test('renders trigger with placeholder when options is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: [] })
    );
    assert.match(html, />请选择</);
    assert.match(html, /type="button"/);
  });

  // ── 箭头图标 ──
  test('renders dropdown arrow indicator in trigger', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, { options: regionOptions })
    );
    assert.match(html, />▾</);
  });

  // ── 自定义 style 透传宽度 ──
  test('custom style width is applied to outer wrapper', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: regionOptions,
        style: { width: 300 },
      })
    );
    // 外层的 display:inline-block 内的 width
    assert.match(html, /width:300px/);
  });

  // ── 选项不含 children（叶子节点） ──
  test('leaf-only options select and display', () => {
    const leafOptions = [
      { value: 'a', label: '选项A' },
      { value: 'b', label: '选项B' },
      { value: 'c', label: '选项C' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: leafOptions,
        defaultValue: ['b'],
      })
    );
    assert.match(html, />选项B</);
  });

  // ── 非受控模式 ──
  test('uncontrolled mode with defaultValue works in SSR', () => {
    const html = renderToStaticMarkup(
      React.createElement(Cascader, {
        options: regionOptions,
        defaultValue: ['jiangsu', 'suzhou'],
      })
    );
    assert.match(html, />江苏 \/ 苏州</);
  });
});
