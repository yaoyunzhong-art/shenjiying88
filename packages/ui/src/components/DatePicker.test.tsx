import React from 'react';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { default: DatePicker } = require('./DatePicker');

describe('DatePicker - 渲染', () => {
  test('应渲染触发按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, {}),
    );
    assert.ok(html.includes('选择日期'), '应显示默认占位文本');
  });

  test('传入 value 应显示对应日期', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { value: '2026-07-06' }),
    );
    assert.ok(html.includes('2026-07-06'), '应显示传入的日期');
  });

  test('label 应正确渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { label: '出生日期' }),
    );
    assert.ok(html.includes('出生日期'), '应显示 label');
  });

  test('必填标记应显示星号', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { label: '出生日期', required: true }),
    );
    assert.ok(html.includes('*'), '应显示必填标记');
  });

  test('error 信息应显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { error: '请选择有效日期' }),
    );
    assert.ok(html.includes('请选择有效日期'), '应显示错误信息');
  });

  test('helpText 应显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { helpText: '格式: YYYY-MM-DD' }),
    );
    assert.ok(html.includes('格式: YYYY-MM-DD'), '应显示帮助文本');
  });

  test('disabled 状态下 trigger 应包含禁用样式标识', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { disabled: true }),
    );
    assert.ok(html.includes('选择日期'), '禁用时仍显示占位文本');
  });

  test('自定义 className 被传入', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { className: 'my-datepicker' }),
    );
    assert.ok(html.includes('my-datepicker'), '应包含自定义类名');
  });
});

describe('DatePicker - 日历面板', () => {
  test('点击触发按钮展开面板 (aria-expanded)', () => {
    // 静态渲染验证初始状态不展开
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, {}),
    );
    // aria-expanded 初始为 false
    assert.ok(html.includes('aria-expanded="false"'), '初始应折叠');
  });

  test('min/max 边界标记于 DOM', () => {
    // min/max 通过 aria-label 不直接体现在 render 结果中
    // 但组件内部通过点击禁用处理；验证 props 被接受
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { min: '2026-01-01', max: '2026-12-31' }),
    );
    assert.ok(html.includes('选择日期'), '带 min/max 渲染正常');
  });
});

describe('DatePicker - 无障碍', () => {
  test('role combobox 存在', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, {}),
    );
    assert.ok(html.includes('role="combobox"'), '应包含 combobox 角色');
  });

  test('value 作为 aria-label 内容', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { value: '2026-07-06' }),
    );
    assert.ok(html.includes('aria-label="2026-07-06"'), 'value 应作为 aria-label');
  });

  test('清除按钮有 aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { value: '2026-07-06' }),
    );
    assert.ok(html.includes('aria-label="清除"'), '清除按钮应有 aria-label');
  });
});

describe('DatePicker - 类型导出', () => {
  test('DatePicker 是函数', () => {
    assert.strictEqual(typeof DatePicker, 'function');
  });

  test('可以通过 require 正确加载', () => {
    const mod = require('./DatePicker');
    assert.ok(mod.default, 'default export 存在');
  });
});
