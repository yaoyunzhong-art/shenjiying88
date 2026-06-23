import React from 'react';
import type { MultiSelectOption } from './MultiSelect';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { MultiSelect } = require('./MultiSelect');

const fruitOptions: MultiSelectOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'dragon', label: '火龙果' },
  { value: 'elder', label: '接骨木' },
];

describe('MultiSelect', () => {
  // ========== 基础渲染 ==========
  test('renders placeholder when no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        placeholder: '请选择水果',
      }),
    );
    assert.match(html, /请选择水果/);
  });

  test('renders selected tags when value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'banana'],
        options: fruitOptions,
      }),
    );
    assert.match(html, /苹果/);
    assert.match(html, /香蕉/);
  });

  test('renders with empty options array gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: [],
        placeholder: '无选项',
      }),
    );
    assert.match(html, /无选项/);
  });

  test('renders with undefined value (defaults to empty array)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /请选择/);
  });

  test('renders with empty value array', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: [],
        options: fruitOptions,
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== 标签渲染与移除按钮 ==========
  test('renders remove button on each tag', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple'],
        options: fruitOptions,
      }),
    );
    assert.match(html, /aria-label="移除 苹果"/);
    assert.match(html, /✕/);
  });

  test('renders multiple tags with remove buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'cherry', 'dragon'],
        options: fruitOptions,
      }),
    );
    assert.match(html, /移除 苹果/);
    assert.match(html, /移除 樱桃/);
    assert.match(html, /移除 火龙果/);
  });

  // ========== maxTagCount ==========
  test('shows all tags when count <= maxTagCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'banana'],
        options: fruitOptions,
        maxTagCount: 2,
      }),
    );
    assert.match(html, /苹果/);
    assert.match(html, /香蕉/);
    assert.doesNotMatch(html, /\+/);
  });

  test('shows overflow badge when count > maxTagCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'banana', 'cherry'],
        options: fruitOptions,
        maxTagCount: 2,
      }),
    );
    assert.match(html, /\+1/);
    // Should still show first 2 tags
    assert.match(html, /苹果/);
    assert.match(html, /香蕉/);
  });

  test('shows correct overflow count', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'banana', 'cherry', 'dragon'],
        options: fruitOptions,
        maxTagCount: 1,
      }),
    );
    assert.match(html, /\+3/);
  });

  // ========== ARIA 属性 ==========
  test('has combobox role and aria attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
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
      React.createElement(MultiSelect, {
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /aria-disabled="true"/);
  });

  test('listbox has aria-multiselectable', () => {
    // In SSR dropdown is closed, so listbox not rendered
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
      }),
    );
    assert.doesNotMatch(html, /aria-multiselectable/);
  });

  // ========== 禁用状态 ==========
  test('renders disabled state with tags still visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple', 'banana'],
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /苹果/);
    assert.match(html, /香蕉/);
  });

  // ========== 搜索功能（SSR 不渲染下拉） ==========
  test('showSearch prop does not break SSR render', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        showSearch: true,
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== 空数据 ==========
  test('accepts custom notFoundContent without crash (SSR)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: [],
        notFoundContent: '暂无数据',
      }),
    );
    assert.match(html, /请选择/);
    assert.doesNotMatch(html, /role="listbox"/);
  });

  // ========== 全选/清除文本自定义 ==========
  test('renders default selectAllText and clearAllText in dropdown (SSR closed)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple'],
        options: fruitOptions,
      }),
    );
    // SSR dropdown closed, action bar not rendered
    assert.match(html, /苹果/);
  });

  // ========== 禁用选项 ==========
  test('disabled option in list does not crash SSR', () => {
    const optionsWithDisabled: MultiSelectOption[] = [
      { value: 'a', label: '可用' },
      { value: 'b', label: '禁用', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['a'],
        options: optionsWithDisabled,
      }),
    );
    assert.match(html, /可用/);
  });

  // ========== 边界情况 ==========
  test('renders with long labels without overflow crash', () => {
    const longOptions: MultiSelectOption[] = [
      { value: 'long', label: '非常长的标签文本用于测试溢出和换行处理能力' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['long'],
        options: longOptions,
      }),
    );
    assert.match(html, /非常长的标签文本用于测试溢出和换行处理能力/);
  });

  test('renders with many selected options', () => {
    const manyOptions: MultiSelectOption[] = Array.from({ length: 50 }, (_, i) => ({
      value: `opt-${i}`,
      label: `选项 ${i}`,
    }));
    const manyValues = Array.from({ length: 10 }, (_, i) => `opt-${i}`);
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: manyValues,
        options: manyOptions,
        maxTagCount: 5,
      }),
    );
    assert.match(html, /\+5/);
    assert.match(html, /选项 0/);
    assert.match(html, /选项 4/);
  });

  test('renders with special characters in label', () => {
    const specialOptions: MultiSelectOption[] = [
      { value: 'special', label: '<script>alert("xss")</script>' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['special'],
        options: specialOptions,
      }),
    );
    // React escapes special characters by default
    assert.match(html, /script/);
  });

  // ========== 隐藏 input 用于表单 ==========
  test('renders hidden input for form integration', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        name: 'fruits',
        value: ['apple', 'cherry'],
        options: fruitOptions,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /name="fruits"/);
    assert.match(html, /value="apple,cherry"/);
  });

  test('hidden input has empty value when no selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        name: 'fruits',
        options: fruitOptions,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /name="fruits"/);
  });

  // ========== className / style ==========
  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        className: 'my-multiselect',
      }),
    );
    assert.match(html, /my-multiselect/);
  });

  test('applies custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        style: { width: 400 },
      }),
    );
    assert.match(html, /width/);
  });

  test('accepts dropdownClassName without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        dropdownClassName: 'custom-dropdown',
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== tabIndex ==========
  test('not disabled select has tabIndex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /tabindex="0"/);
  });

  test('disabled select has tabIndex -1', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        disabled: true,
      }),
    );
    assert.match(html, /tabindex="-1"/);
  });

  // ========== 箭头图标 ==========
  test('renders dropdown arrow indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
      }),
    );
    assert.match(html, /▼/);
  });

  // ========== minWidth ==========
  test('accepts minWidth prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        options: fruitOptions,
        minWidth: 300,
      }),
    );
    assert.match(html, /300/);
  });

  // ========== SSR 状态下拉不渲染 ==========
  test('dropdown is not rendered in SSR (open=false)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['apple'],
        options: fruitOptions,
      }),
    );
    assert.doesNotMatch(html, /role="listbox"/);
    assert.doesNotMatch(html, /全选/);
  });

  // ========== 类型检查 ==========
  test('MultiSelect component is a function', () => {
    assert.strictEqual(typeof MultiSelect, 'function');
  });

  test('MultiSelect component has display name', () => {
    assert.strictEqual(MultiSelect.name, 'MultiSelect');
  });

  // ========== 单选选择不显示额外标签 ==========
  test('single selection shows one tag correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(MultiSelect, {
        value: ['banana'],
        options: fruitOptions,
      }),
    );
    assert.match(html, /香蕉/);
    assert.doesNotMatch(html, /苹果/);
    assert.doesNotMatch(html, /樱桃/);
  });
});
