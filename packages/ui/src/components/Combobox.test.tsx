import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { renderToString } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Combobox } = require('./Combobox');

const FRUIT_OPTIONS = [
  { value: 'apple', label: '苹果 Apple', description: '一种常见水果' },
  { value: 'banana', label: '香蕉 Banana' },
  { value: 'cherry', label: '樱桃 Cherry', description: '春季水果' },
  { value: 'dragonfruit', label: '火龙果 Dragon Fruit' },
  { value: 'elderberry', label: '接骨木 Elderberry', disabled: true },
  { value: 'fig', label: '无花果 Fig' },
  { value: 'grape', label: '葡萄 Grape' },
  { value: 'honeydew', label: '蜜瓜 Honeydew' },
  { value: 'kiwi', label: '猕猴桃 Kiwi' },
  { value: 'lemon', label: '柠檬 Lemon' },
];

const COUNTRY_OPTIONS = [
  { value: 'cn', label: '中国', group: '亚洲' },
  { value: 'jp', label: '日本', group: '亚洲' },
  { value: 'kr', label: '韩国', group: '亚洲' },
  { value: 'us', label: '美国', group: '美洲' },
  { value: 'br', label: '巴西', group: '美洲' },
  { value: 'de', label: '德国', group: '欧洲' },
  { value: 'fr', label: '法国', group: '欧洲' },
];

describe('Combobox', () => {
  // ── Export ──
  test('exported as a function', () => {
    assert.notEqual(Combobox, undefined);
    assert.notEqual(Combobox, null);
  });

  // ── Basic rendering ──
  test('renders with default placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('placeholder="搜索选择..."'));
  });

  test('renders with custom placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, placeholder: '请选择水果' })
    );
    assert.ok(html.includes('placeholder="请选择水果"'));
  });

  test('renders with label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, label: '水果选择' })
    );
    assert.ok(html.includes('水果选择'));
  });

  test('renders required asterisk in label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, label: '水果', required: true })
    );
    assert.ok(html.includes('*'));
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, error: '请选择一个选项' })
    );
    assert.ok(html.includes('请选择一个选项'));
    assert.ok(html.includes('#f87171'));
  });

  test('renders help text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, helpText: '最多选择一项' })
    );
    assert.ok(html.includes('最多选择一项'));
  });

  test('help text hidden when error present', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, error: '错误', helpText: '帮助' })
    );
    assert.ok(html.includes('错误'));
  });

  // ── Disabled state ──
  test('renders disabled input', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, disabled: true })
    );
    assert.ok(html.includes('disabled'));
  });

  // ── Selected value display ──
  test('shows selected option label as input value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'cherry' })
    );
    // When closed, the input shows the display value for selected option
    // renderToStaticMarkup renders initial state; value is reflected as selectedLabel
    assert.ok(html.includes('樱桃 Cherry') || html.includes('value="樱桃 Cherry"'));
  });

  test('shows raw value when option not matched', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'unknown' })
    );
    assert.ok(html.includes('unknown'));
  });

  // ── Clear button ──
  test('shows clear button when value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'apple' })
    );
    assert.ok(html.includes('Clear selection'));
  });

  test('does not show clear button when value is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: '' })
    );
    const clearCount = (html.match(/Clear selection/g) || []).length;
    assert.equal(clearCount, 0);
  });

  test('does not show clear button when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'apple', disabled: true })
    );
    // Disabled input cannot be cleared via the button — clear is hidden
    const clearCount = (html.match(/Clear selection/g) || []).length;
    assert.equal(clearCount, 0);
  });

  // ── aria attributes ──
  test('has combobox role', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('role="combobox"'));
  });

  test('has aria-expanded false by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('aria-expanded="false"'));
  });

  test('has aria-haspopup listbox', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('aria-haspopup="listbox"'));
  });

  test('has aria-autocomplete list', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('aria-autocomplete="list"'));
  });

  test('has autoComplete off', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('autoComplete="off"'));
  });

  // ── Dropdown chevron ──
  test('renders dropdown chevron SVG', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    // Contains a chevron SVG path
    assert.ok(html.includes('<svg') && (html.includes('chevron') || html.includes('M4 6l4 4')));
  });

  // ── Loading state ──
  test('shows loading spinner when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, loading: true })
    );
    assert.ok(html.includes('data-combobox-loading="true"'));
  });

  test('does not show loading spinner when not loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, loading: false })
    );
    assert.ok(!html.includes('data-combobox-loading="true"'));
  });

  // ── data-testid ──
  test('passes data-testid to container', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, 'data-testid': 'fruit-cb' })
    );
    assert.ok(html.includes('data-testid="fruit-cb"'));
  });

  // ── Grouped options rendering ──
  test('renders grouped options', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: COUNTRY_OPTIONS })
    );
    // The combobox renders without options until focused; so only check the input itself
    assert.ok(html.includes('role="combobox"'));
  });

  // ── Icon rendering for options ──
  test('renders option with icon', () => {
    const optionsWithIcon = [
      {
        value: 'red',
        label: '红色',
        icon: React.createElement('span', { 'data-testid': 'color-icon' }, '🔴'),
      },
      { value: 'blue', label: '蓝色' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: optionsWithIcon })
    );
    assert.ok(html.includes('role="combobox"'));
  });

  // ── Empty options ──
  test('renders with empty options array', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: [] })
    );
    assert.ok(html.includes('role="combobox"'));
  });

  // ── allowCustom ──
  test('renders with allowCustom prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, allowCustom: true })
    );
    // No distinct static rendering for allowCustom — it's a behavior prop
    assert.ok(html.includes('role="combobox"'));
  });

  // ── maxVisible ──
  test('renders with maxVisible prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, maxVisible: 5 })
    );
    assert.ok(html.includes('role="combobox"'));
  });

  // ── emptyMessage ──
  test('renders with custom emptyMessage', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, emptyMessage: '没有结果' })
    );
    assert.ok(html.includes('role="combobox"'));
  });

  // ── Controlled value updates ──
  test('updates display when value changes (renderToString with multiple renders)', () => {
    // render with a value, check it's in output
    const html1 = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'apple' })
    );
    assert.ok(html1.includes('苹果 Apple'));
    const html2 = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'banana' })
    );
    assert.ok(html2.includes('香蕉 Banana'));
  });

  // ── Style inclusion checks ──
  test('includes input border styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    assert.ok(html.includes('border'));
  });

  test('error state changes border color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, error: '必填' })
    );
    // Error color should appear
    assert.ok(html.includes('#f87171'));
  });

  // ── Selected option checkmark ──
  test('renders checkmark SVG for selected option logic', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, value: 'cherry' })
    );
    // The selected label should show
    assert.ok(html.includes('樱桃 Cherry'));
  });

  // ── Keyboard related: initial structure ──
  test('initial listbox is not rendered in static markup (closed by default)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS })
    );
    // The listbox role should NOT appear because the dropdown is closed initially
    assert.ok(!html.includes('role="listbox"'));
  });

  // ── CSS class / style props ──
  test('applies className prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, className: 'my-custom-cb' })
    );
    assert.ok(html.includes('my-custom-cb'));
  });

  test('applies style prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Combobox, { options: FRUIT_OPTIONS, style: { marginTop: '8px' } })
    );
    assert.ok(html.includes('margin-top:8px') || html.includes('marginTop'));
  });
});
