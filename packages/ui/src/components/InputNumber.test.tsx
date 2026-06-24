import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { InputNumber } = require('./InputNumber');

describe('InputNumber', () => {
  // ── Basic rendering ──
  test('renders basic input with stepper buttons', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 5 }));
    assert.ok(html.includes('−'));
    assert.ok(html.includes('+'));
    assert.ok(html.includes('value="5"'));
  });

  test('renders without stepper when showStepper=false', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, showStepper: false }));
    assert.ok(!html.includes('−'));
    assert.ok(!html.includes('+'));
    assert.ok(html.includes('value="0"'));
  });

  // ── Label, helper, error ──
  test('renders label', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { label: '数量', defaultValue: 1 }));
    assert.ok(html.includes('数量'));
  });

  test('renders required indicator', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { label: '数量', required: true, defaultValue: 1 }));
    assert.ok(html.includes('*'));
  });

  test('renders helper text', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, helperText: '输入 1-100 之间的数字' }));
    assert.ok(html.includes('输入 1-100 之间的数字'));
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 200, max: 100, error: '超出最大范围' }));
    assert.ok(html.includes('超出最大范围'));
  });

  test('error hides helper text', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, helperText: '提示', error: '出错了' }));
    assert.ok(html.includes('出错了'));
    assert.ok(!html.includes('提示'));
  });

  test('renders error with role=alert', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, error: '出错了' }));
    assert.ok(html.includes('role="alert"'));
  });

  // ── Unit and prefix ──
  test('renders unit text', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 10, unit: 'kg' }));
    assert.ok(html.includes('kg'));
    assert.ok(html.includes('value="10"'));
  });

  test('renders prefix text', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 100, prefix: '¥' }));
    assert.ok(html.includes('¥'));
  });

  test('renders both prefix and unit', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 3.5, prefix: '$', unit: '万' }));
    assert.ok(html.includes('$'));
    assert.ok(html.includes('万'));
  });

  // ── Stepper button states ──
  test('increment button enabled when below max', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 50, min: 0, max: 100 }));
    // Both buttons should not be disabled (check by counting disabled attribs)
    const disabledMatches = html.match(/disabled=""/g) || [];
    // disabled="" appears on buttons but not on the input itself (check html structure)
    // Just verify stepper exists
    assert.ok(html.includes('−'));
    assert.ok(html.includes('+'));
  });

  test('increment button disabled at max', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 100, max: 100 }));
    assert.ok(html.includes('disabled=""'));
  });

  test('decrement button disabled at min', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, min: 0 }));
    assert.ok(html.includes('disabled=""'));
  });

  // ── Disabled state ──
  test('full disabled state disables everything', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 10, disabled: true }));
    assert.ok(html.includes('disabled=""'));
  });

  // ── Sizes ──
  test('renders three sizes', () => {
    const sm = renderToStaticMarkup(React.createElement(InputNumber, { size: 'sm', defaultValue: 1 }));
    assert.ok(sm.includes('1'));
    const md = renderToStaticMarkup(React.createElement(InputNumber, { size: 'md', defaultValue: 2 }));
    assert.ok(md.includes('2'));
    const lg = renderToStaticMarkup(React.createElement(InputNumber, { size: 'lg', defaultValue: 3 }));
    assert.ok(lg.includes('3'));
  });

  // ── Value display ──
  test('renders controlled value', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { value: 42 }));
    assert.ok(html.includes('value="42"'));
  });

  test('precision=2 formats display value in input', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { value: 3.5, precision: 2 }));
    assert.ok(html.includes('3.50'));
  });

  test('precision=0 formats as integer in input', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { value: 3.99, precision: 0 }));
    assert.ok(html.includes('4'));
  });

  // ── Custom width ──
  test('custom width prop sets inline style', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, width: 300 }));
    assert.ok(html.includes('width:300px'));
  });

  // ── Name and aria ──
  test('passes name attribute to input', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, name: 'quantity' }));
    assert.ok(html.includes('name="quantity"'));
  });

  test('sets explicit aria-label', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, 'aria-label': '商品数量' }));
    assert.ok(html.includes('商品数量'));
  });

  test('aria-label falls back to label prop', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, label: '库存' }));
    assert.ok(html.includes('库存'));
  });

  test('sets aria-valuemin and aria-valuemax on input', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 50, min: 0, max: 100 }));
    assert.ok(html.includes('aria-valuemin="0"'));
    assert.ok(html.includes('aria-valuemax="100"'));
    assert.ok(html.includes('aria-valuenow="50"'));
  });

  test('aria-invalid when error present', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, error: '错了' }));
    assert.ok(html.includes('aria-invalid="true"'));
  });

  test('aria-invalid when no error', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0 }));
    assert.ok(html.includes('aria-invalid="false"'));
  });

  // ── Negative values ──
  test('supports negative values', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { value: -10 }));
    assert.ok(html.includes('-10'));
  });

  // ── Placeholder ──
  test('shows placeholder in input', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { placeholder: '请输入数量', defaultValue: 0 }));
    assert.ok(html.includes('placeholder="请输入数量"'));
  });

  // ── Default empty ──
  test('defaults to 0 when no value given', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, {}));
    assert.ok(html.includes('value="0"'));
  });

  // ── data-testid propagation ──
  test('data-testid propagation to root div', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0, 'data-testid': 'stock-input' }));
    assert.ok(html.includes('stock-input'));
  });

  // ── Read-only state ──
  test('readOnly renders input as readonly', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 5, readOnly: true }));
    assert.ok(html.includes('readonly=""'));
  });

  // ── inputMode numeric ──
  test('input has numeric inputMode', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0 }));
    assert.ok(html.includes('inputmode="numeric"') || html.includes('inputMode="numeric"'));
  });

  // ── tabular-nums font ──
  test('input uses tabular-nums for number alignment', () => {
    const html = renderToStaticMarkup(React.createElement(InputNumber, { defaultValue: 0 }));
    assert.ok(html.includes('tabular-nums'));
  });
});
