import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ColorPicker } = require('./ColorPicker');

describe('ColorPicker', () => {
  // ========== 基础渲染 ==========
  test('renders with default value', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#1677FF' }),
    );
    assert.match(html, /#1677FF/);
    assert.match(html, /role="group"/);
  });

  test('renders with no value uses default color', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {}),
    );
    // 默认值为 #1677FF
    assert.match(html, /#1677FF/);
  });

  test('renders with empty string value', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '' }),
    );
    assert.match(html, /无颜色/);
  });

  // ========== ARIA 属性 ==========
  test('has role="group" and aria-label on wrapper', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '#F5222D',
        'aria-label': '选择主题色',
      }),
    );
    assert.match(html, /role="group"/);
    assert.match(html, /aria-label="选择主题色"/);
  });

  test('trigger has aria-haspopup and aria-expanded', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#52C41A' }),
    );
    assert.match(html, /aria-haspopup="dialog"/);
    assert.match(html, /aria-expanded="false"/);
  });

  test('disabled trigger has aria-disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#000', disabled: true }),
    );
    assert.match(html, /disabled/);
  });

  test('disabled trigger has tabIndex -1', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#000', disabled: true }),
    );
    assert.match(html, /tabindex="-1"/);
  });

  test('enabled trigger has tabIndex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#000' }),
    );
    assert.match(html, /tabindex="0"/);
  });

  // ========== 颜色显示格式 ==========
  test('renders hex format by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#1677FF' }),
    );
    assert.match(html, /#1677FF/);
  });

  // ========== 清除按钮 ==========
  test('renders clear button when allowClear and value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '#F5222D',
        allowClear: true,
      }),
    );
    assert.match(html, /aria-label="清除颜色"/);
  });

  test('does not render clear button when allowClear but no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '',
        allowClear: true,
      }),
    );
    assert.doesNotMatch(html, /清除颜色/);
  });

  test('does not render clear button when allowClear is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#1677FF' }),
    );
    assert.doesNotMatch(html, /清除颜色/);
  });

  // ========== 禁用状态 ==========
  test('renders disabled state without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#EB2F96', disabled: true }),
    );
    assert.match(html, /#EB2F96/);
  });

  // ========== SSR 菜单不渲染 ==========
  test('panel is not rendered in SSR (open=false)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#13C2C2' }),
    );
    assert.doesNotMatch(html, /role="dialog"/);
  });

  test('presets are not rendered in SSR', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#722ED1' }),
    );
    assert.doesNotMatch(html, /class="color-picker-preset-swatch"/);
    // CSS 样式中有 class 名称是正常的，检查没有实际元素即可
  });

  // ========== 预设颜色 ==========
  test('accepts custom presets without crash (SSR — panel closed)', () => {
    const presets = [
      { label: '品牌蓝', color: '#1677FF' },
      { label: '成功绿', color: '#52C41A' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '#1677FF',
        presets: presets,
      }),
    );
    assert.match(html, /#1677FF/);
    assert.doesNotMatch(html, /role="dialog"/);
  });

  // ========== 隐藏表单字段 ==========
  test('renders hidden input for form integration', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        name: 'themeColor',
        value: '#F5222D',
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /name="themeColor"/);
    assert.match(html, /value="#F5222D"/);
  });

  test('hidden input has empty value when no selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        name: 'themeColor',
        value: '',
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /value=""/);
  });

  // ========== 尺寸 ==========
  test('renders small size without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#1677FF', size: 'small' }),
    );
    assert.match(html, /cp-small/);
    assert.match(html, /#1677FF/);
  });

  test('renders large size without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#1677FF', size: 'large' }),
    );
    assert.match(html, /cp-large/);
    assert.match(html, /#1677FF/);
  });

  // ========== className / style ==========
  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '#1677FF',
        className: 'my-color-picker',
      }),
    );
    assert.match(html, /my-color-picker/);
  });

  test('applies custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, {
        value: '#1677FF',
        style: { width: 300 },
      }),
    );
    assert.match(html, /width/);
  });

  // ========== 边界情况 ==========
  test('renders with invalid hex value gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: 'invalid' }),
    );
    // 应该回退到默认颜色
    assert.match(html, /无颜色/);
  });

  test('renders with short hex (#RGB) format', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#F00' }),
    );
    assert.match(html, /#F00/);
  });

  test('renders with black color', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#000000' }),
    );
    assert.match(html, /#000000/);
  });

  test('renders with white color', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#FFFFFF' }),
    );
    assert.match(html, /#FFFFFF/);
  });

  test('swatch renders with background color', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorPicker, { value: '#52C41A' }),
    );
    assert.match(html, /background-color/);
  });

  // ========== 类型导出检查 ==========
  test('ColorPicker component is a function', () => {
    assert.strictEqual(typeof ColorPicker, 'function');
  });

  test('ColorPicker component has display name', () => {
    assert.strictEqual(ColorPicker.displayName, 'ColorPicker');
  });
});
