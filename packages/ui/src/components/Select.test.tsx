import React from 'react';
import type { SelectOption } from './Select';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Select } = require('./Select');

const fruitOptions: SelectOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
];

describe('Select', () => {
  // ========== 基础渲染 ==========
  test('renders placeholder when no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        placeholder: '请选择水果',
      }),
    );
    assert.match(html, /请选择水果/);
  });

  test('renders selected option label when value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'apple',
        options: fruitOptions,
      }),
    );
    assert.match(html, /苹果/);
    assert.doesNotMatch(html, /请选择/);
  });

  test('renders with no options gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: [],
        placeholder: '无选项',
      }),
    );
    assert.match(html, /无选项/);
  });

  test('renders with undefined value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== ARIA 属性 ==========
  test('has combobox role and aria attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        'aria-label': '选择水果',
      }),
    );
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-haspopup="listbox"/);
    assert.match(html, /aria-label="选择水果"/);
  });

  test('trigger button has aria-disabled when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /aria-disabled="true"/);
  });

  // ========== 禁用状态 ==========
  test('renders disabled state without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'apple',
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /苹果/);
  });

  // ========== 清除按钮 ==========
  test('renders clear button when allowClear and value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'banana',
        options: fruitOptions,
        allowClear: true,
      }),
    );
    assert.match(html, /香蕉/);
    assert.match(html, /aria-label="清除选择"/);
    assert.match(html, /✕/);
  });

  test('does not render clear button when allowClear but no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        allowClear: true,
      }),
    );
    assert.doesNotMatch(html, /清除选择/);
  });

  test('does not render clear button when allowClear is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'apple',
        options: fruitOptions,
      }),
    );
    assert.doesNotMatch(html, /清除选择/);
  });

  // ========== SSR 状态下菜单不渲染 ==========
  test('dropdown is not rendered in SSR (open=false)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
      }),
    );
    assert.doesNotMatch(html, /role="listbox"/);
  });

  // ========== 隐藏 input 用于表单 ==========
  test('renders hidden input for form integration', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        name: 'fruit',
        value: 'cherry',
        options: fruitOptions,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /name="fruit"/);
    assert.match(html, /value="cherry"/);
  });

  test('hidden input has empty value when no selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        name: 'fruit',
        options: fruitOptions,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /value=""/);
  });

  // ========== 搜索功能（SSR 不渲染搜索框） ==========
  test('showSearch prop does not break SSR render', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        showSearch: true,
      }),
    );
    // SSR 时菜单未打开，不渲染搜索框
    assert.match(html, /请选择/);
    assert.doesNotMatch(html, /搜索/);
  });

  // ========== 空数据 ==========
  test('accepts custom notFoundContent without crash (SSR — dropdown closed)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: [],
        notFoundContent: '暂无数据',
      }),
    );
    // notFoundContent only renders when dropdown is open (client-side)
    // SSR always has open=false, so it renders placeholder and no listbox
    assert.match(html, /请选择/);
    assert.doesNotMatch(html, /role="listbox"/);
  });

  // ========== 禁用选项 ==========
  test('disabled option in list does not crash SSR', () => {
    const optionsWithDisabled: SelectOption[] = [
      { value: 'a', label: '可用' },
      { value: 'b', label: '禁用', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'a',
        options: optionsWithDisabled,
      }),
    );
    assert.match(html, /可用/);
  });

  // ========== 边界情况 ==========
  test('renders with long text values without overflow crash', () => {
    const longOptions: SelectOption[] = [
      { value: 'very-long-value-that-exceeds-normal-length', label: '非常长的标签文本用于测试溢出处理' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'very-long-value-that-exceeds-normal-length',
        options: longOptions,
      }),
    );
    assert.match(html, /非常长的标签文本用于测试溢出处理/);
  });

  test('renders with special characters in label', () => {
    const specialOptions: SelectOption[] = [
      { value: 'special', label: '<script>alert("xss")</script>' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'special',
        options: specialOptions,
      }),
    );
    // React escapes special characters by default
    assert.match(html, /script/);
  });

  test('renders with many options without crash', () => {
    const manyOptions: SelectOption[] = Array.from({ length: 100 }, (_, i) => ({
      value: `opt-${i}`,
      label: `选项 ${i}`,
    }));
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        value: 'opt-50',
        options: manyOptions,
      }),
    );
    assert.match(html, /选项 50/);
  });

  // ========== className / style ==========
  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        className: 'my-select',
      }),
    );
    assert.match(html, /my-select/);
  });

  test('applies custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        style: { width: 300 },
      }),
    );
    assert.match(html, /width/);
  });

  test('accepts dropdownClassName without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        dropdownClassName: 'custom-dropdown',
      }),
    );
    // dropdownClassName 不影响 SSR（菜单不渲染）
    assert.match(html, /请选择/);
  });

  // ========== tabIndex ==========
  test('not disabled select has tabIndex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /tabindex="0"/);
  });

  test('disabled select has tabIndex -1', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /tabindex="-1"/);
  });

  // ========== 箭头图标 ==========
  test('renders dropdown arrow indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /▼/);
  });

  // ========== minWidth ==========
  test('accepts minWidth prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Select, {
        options: fruitOptions,
        minWidth: 250,
      }),
    );
    // minWidth is applied as inline style
    assert.match(html, /250/);
  });

  // ========== 类型导出检查 ==========
  test('Select component is a function', () => {
    assert.strictEqual(typeof Select, 'function');
  });

  test('Select component has display name or is named function', () => {
    assert.strictEqual(Select.name, 'Select');
  });
});
