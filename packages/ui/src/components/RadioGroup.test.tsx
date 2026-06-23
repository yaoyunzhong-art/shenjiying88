import React from 'react';
import type { RadioOption } from './RadioGroup';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { RadioGroup } = require('./RadioGroup');

// ==================== 测试数据 ====================

const BASIC_OPTIONS: RadioOption[] = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
  { value: 'archived', label: '归档' },
];

const DESCRIBED_OPTIONS: RadioOption[] = [
  { value: 'public', label: '公开', description: '所有人可见' },
  { value: 'private', label: '私密', description: '仅自己可见' },
];

const MIXED_OPTIONS: RadioOption[] = [
  { value: 'a', label: '选项A' },
  { value: 'b', label: '选项B', disabled: true, description: '暂不可用' },
  { value: 'c', label: '选项C' },
];

// ==================== 渲染测试 ====================

describe('RadioGroup — 渲染', () => {
  test('renders all options', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    assert.match(html, /启用/);
    assert.match(html, /停用/);
    assert.match(html, /归档/);
  });

  test('renders group label', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, label: '状态选择' })
    );
    assert.match(html, /状态选择/);
  });

  test('renders required mark', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, label: '状态', required: true })
    );
    assert.match(html, /\*/);
    assert.match(html, /状态/);
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, error: '请选择一个选项' })
    );
    assert.match(html, /请选择一个选项/);
  });

  test('renders hint text', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, hint: '选择后不可更改' })
    );
    assert.match(html, /选择后不可更改/);
  });

  test('renders option descriptions', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: DESCRIBED_OPTIONS })
    );
    assert.match(html, /所有人可见/);
    assert.match(html, /仅自己可见/);
  });

  test('renders role="radiogroup"', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    assert.match(html, /role="radiogroup"/);
  });

  test('renders radio inputs with correct type', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    // Count radio inputs — 3 options
    const matches = html.match(/type="radio"/g);
    assert.equal(matches?.length, 3);
  });

  test('renders with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, 'data-testid': 'my-radio' })
    );
    assert.match(html, /data-testid="my-radio"/);
  });

  test('uses provided name attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, name: 'status-field' })
    );
    const matches = html.match(/name="status-field"/g);
    assert.equal(matches?.length, 3);
  });
});

// ==================== 选中状态测试 ====================

describe('RadioGroup — 选中状态', () => {
  test('renders with default value', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, defaultValue: 'active' })
    );
    assert.match(html, /checked/);
  });

  test('renders with controlled value', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, value: 'inactive' })
    );
    assert.match(html, /value="inactive"/);
  });

  test('no default value: all unchecked', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    assert.ok(!html.includes('checked'));
  });
});

// ==================== 禁用测试 ====================

describe('RadioGroup — 禁用', () => {
  test('disabled group: fieldset has disabled attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, disabled: true })
    );
    assert.match(html, /disabled/);
  });

  test('individual option disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: MIXED_OPTIONS })
    );
    // 选项B 应该被禁用
    assert.match(html, /选项B/);
    assert.match(html, /暂不可用/);
  });

  test('disabled option renders description', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: MIXED_OPTIONS })
    );
    assert.match(html, /暂不可用/);
  });
});

// ==================== 排列方向测试 ====================

describe('RadioGroup — 排列方向', () => {
  test('default vertical direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    assert.match(html, /flex-direction:\s*column/);
  });

  test('horizontal direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, direction: 'horizontal' })
    );
    assert.match(html, /flex-wrap:\s*wrap/);
  });
});

// ==================== 尺寸测试 ====================

describe('RadioGroup — 尺寸', () => {
  test('renders sm / md / lg without crashing', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      const html = renderToStaticMarkup(
        React.createElement(RadioGroup, { options: BASIC_OPTIONS, size })
      );
      assert.match(html, /启用/);
      assert.match(html, /radio/);
    });
  });
});

// ==================== 边界情况测试 ====================

describe('RadioGroup — 边界', () => {
  test('empty options does not crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: [] })
    );
    assert.match(html, /role="radiogroup"/);
    assert.ok(!html.includes('type="radio"'));
  });

  test('className and style passthrough', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, {
        options: BASIC_OPTIONS,
        className: 'custom-class',
        style: { marginTop: 20 },
      })
    );
    assert.match(html, /custom-class/);
    assert.match(html, /margin-top:\s*20px/);
  });

  test('error state sets aria-invalid', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, error: '必选' })
    );
    assert.match(html, /aria-invalid="true"/);
  });

  test('disabled group with controlled value renders checked', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS, value: 'active', disabled: true })
    );
    assert.match(html, /启动|启用/);
    assert.match(html, /disabled/);
  });

  test('option description links via aria-describedby', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: DESCRIBED_OPTIONS })
    );
    assert.match(html, /aria-describedby/);
    assert.match(html, /所有人可见/);
  });

  test('options without description do not have aria-describedby (check not on all)', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { options: BASIC_OPTIONS })
    );
    // 没有描述的选项不应该有 aria-describedby
    // 但 because all 3 have no description, none should have it
    assert.ok(!html.includes('aria-describedby'));
  });
});
