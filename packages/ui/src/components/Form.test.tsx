/**
 * Form.test.tsx — Form 复合组件 L1 测试
 * 测试项: 基础渲染 + 字段 + 提交按钮
 * 模式: 正例 + 反例 + 边界
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Form } = require('./Form');
const { Input } = require('./Input');
const { FormField } = require('./FormField');
const { SubmitButton } = require('./SubmitButton');

describe('Form 组件 — 基础渲染', () => {
  test('渲染空的 form 元素', () => {
    const html = renderToStaticMarkup(React.createElement(Form));
    assert.match(html, /<form/);
    assert.match(html, /<\/form>/);
  });

  test('包含 children 时正确渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null, React.createElement('div', { 'data-testid': 'child' }, 'content'))
    );
    assert.match(html, /content/);
  });
});

describe('Form.Item', () => {
  test('渲染 label 与必填标记', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Item, { label: '用户名', name: 'username', required: true },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /用户名/);
    assert.match(html, /\*/);
  });

  test('可选字段不显示 *', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Item, { label: '备注', name: 'note' },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /备注/);
    // 检查没有红色星号出现在备注旁边（* 可能来自 label 内）
    const labelIdx = html.indexOf('备注');
    const afterLabel = html.slice(labelIdx + 2, labelIdx + 10);
    assert.ok(!afterLabel.includes('*'));
  });

  test('hint 提示文字正常显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Item, { label: '密码', name: 'password', hint: '至少8位字符' },
          React.createElement(Input, { type: 'password' })
        )
      )
    );
    assert.match(html, /至少8位字符/);
  });

  test('input 的 name 属性与 Form.Item name 一致', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Item, { label: '邮箱', name: 'email' },
          React.createElement(Input)
        )
      )
    );
    // Input 会渲染为 <input name="email">
    assert.match(html, /name="email"/);
  });
});

describe('Form.Submit', () => {
  test('渲染提交按钮，默认文字为"提交"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Submit)
      )
    );
    assert.match(html, /提交/);
    assert.match(html, /type="submit"/);
  });

  test('自定义按钮文字', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Submit, null, '保存')
      )
    );
    assert.match(html, /保存/);
  });
});

describe('Form 布局模式', () => {
  test('horizontal 布局使用 grid 样式', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, { layout: 'horizontal' },
        React.createElement(Form.Item, { label: '字段A', name: 'a' },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /display:\s*grid/);
  });

  test('inline 布局使用 flex 样式', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, { layout: 'inline' },
        React.createElement(Form.Item, { label: '关键词', name: 'q' },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /display:\s*flex/);
  });

  test('vertical 为默认布局', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, { layout: 'vertical' },
        React.createElement(Form.Item, { label: '字段', name: 'f' },
          React.createElement(Input)
        )
      )
    );
    // vertical 模式不额外设置 grid/flex display
    assert.ok(!html.includes('display: grid'));
    assert.ok(!html.includes('display: flex'));
  });
});

// ── 边界 ──

describe('Form 边界情况', () => {
  test('没有 Form.Item 时正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(SubmitButton, null, '保存')
      )
    );
    assert.match(html, /保存/);
    assert.match(html, /<form/);
  });

  test('多个 Form.Item 渲染不丢失字段', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Item, { label: '姓名', name: 'name' },
          React.createElement(Input)
        ),
        React.createElement(Form.Item, { label: '邮箱', name: 'email' },
          React.createElement(Input)
        ),
        React.createElement(Form.Item, { label: '手机号', name: 'phone' },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /姓名/);
    assert.match(html, /邮箱/);
    assert.match(html, /手机号/);
    // 三个 input
    const inputMatches = html.match(/<input/g);
    assert.ok(inputMatches);
    assert.equal(inputMatches.length, 3);
  });

  test('禁用状态下 input 带 disabled 属性', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, { disabled: true },
        React.createElement(Form.Item, { label: '字段', name: 'f' },
          React.createElement(Input)
        ),
        React.createElement(Form.Submit)
      )
    );
    assert.match(html, /disabled=""/);
  });

  test('size 属性传递到 input 的 data-size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, { size: 'lg' },
        React.createElement(Form.Item, { label: '大号', name: 'big' },
          React.createElement(Input)
        )
      )
    );
    assert.match(html, /data-size="lg"/);
  });

  test('noValidate 属性存在于 form 元素', () => {
    const html = renderToStaticMarkup(
      React.createElement(Form, null,
        React.createElement(Form.Submit)
      )
    );
    assert.match(html, /novalidate/);
  });
});
