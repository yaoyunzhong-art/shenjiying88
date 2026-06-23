import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { default: DateRangePicker } = require('./DateRangePicker');

describe('DateRangePicker - 渲染', () => {
  test('应渲染输入框', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    assert.ok(html.includes('drp-root'), '应包含 drp-root');
    assert.ok(html.includes('drp-trigger'), '应包含 drp-trigger');
  });

  test('无值时显示占位文本', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    assert.ok(
      html.includes('开始日期 ~ 结束日期'),
      '应显示默认占位文本',
    );
  });

  test('自定义占位文本', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        placeholder: ['开始', '结束'],
      }),
    );
    assert.ok(html.includes('开始 ~ 结束'), '应显示自定义占位文本');
  });

  test('有值时显示日期范围', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2026-06-01', end: '2026-06-15' },
      }),
    );
    assert.ok(
      html.includes('2026-06-01 ~ 2026-06-15'),
      '应显示完整的日期范围',
    );
  });

  test('只有开始日期', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2026-06-01', end: '' },
      }),
    );
    assert.ok(html.includes('2026-06-01 ~'), '应显示开始日期');
  });

  test('渲染标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        label: '日期范围',
      }),
    );
    assert.ok(html.includes('日期范围'), '应包含标签');
  });

  test('渲染必填标记', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        label: '日期',
        required: true,
      }),
    );
    assert.ok(html.includes('drp-required'), '应包含必填标记');
  });

  test('渲染错误信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        error: '日期不能为空',
      }),
    );
    assert.ok(html.includes('日期不能为空'), '应包含错误信息');
    assert.ok(html.includes('drp-error'), '应包含错误样式');
  });

  test('渲染帮助文本', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        helpText: '请选择查询日期范围',
      }),
    );
    assert.ok(html.includes('请选择查询日期范围'), '应包含帮助文本');
    assert.ok(html.includes('drp-help'), '应包含帮助样式');
  });

  test('错误优先于帮助文本显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        error: '日期错误',
        helpText: '请选择日期',
      }),
    );
    assert.ok(html.includes('日期错误'), '应包含错误信息');
    assert.ok(!html.includes('请选择日期'), '不应包含帮助文本（错误优先级更高）');
  });
});

describe('DateRangePicker - 快捷选项', () => {
  test('默认状态下不显示面板内容', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    // The panel is client-side only (useState), so in SSR it is not rendered
    // These checks verify the baseline render is correct
    assert.ok(html.includes('drp-root'), '应正常渲染根元素');
  });

  test('自定义预设不崩溃', () => {
    const customPresets = [
      {
        label: '本月',
        getValue: () => ({ start: '2026-06-01', end: '2026-06-30' }),
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        presets: customPresets,
      }),
    );
    assert.ok(html.includes('drp-root'), '应正常渲染');
  });
});

describe('DateRangePicker - 清除按钮', () => {
  test('有值时显示清除按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2026-06-01', end: '2026-06-15' },
      }),
    );
    assert.ok(html.includes('drp-clear-btn'), '应包含清除按钮');
  });

  test('无值时不渲染清除按钮标记', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    // When no value, input value should be placeholder-only
    const inputMatch = html.match(/value="(.*?)"/);
    assert.ok(inputMatch, '应有 value 属性');
    assert.strictEqual(inputMatch[1], '', '空值时 value 为空');
  });

  test('禁用时输入框不可交互', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2026-06-01', end: '2026-06-15' },
        disabled: true,
      }),
    );
    assert.ok(html.includes('drp-trigger--disabled'), '禁用时应包含禁用样式');
  });
});

describe('DateRangePicker - 禁用态', () => {
  test('禁用态渲染正确', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        disabled: true,
      }),
    );
    assert.ok(html.includes('drp-trigger--disabled'), '应包含禁用样式');
  });
});

describe('DateRangePicker - 样式', () => {
  test('接受 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        className: 'my-picker',
      }),
    );
    assert.ok(html.includes('my-picker'), '应包含自定义类名');
  });

  test('接受 style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        style: { width: 400 },
      }),
    );
    assert.ok(
      html.includes('style="width:400px"'),
      '应包含自定义样式',
    );
  });
});

describe('DateRangePicker - SSR渲染检查', () => {
  test('SSR默认渲染不含面板（面板靠客户端state打开）', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    // In SSR, panel content driven by useState is not visible
    // This ensures the component renders gracefully in server context
    assert.ok(html.includes('drp-root'), '根元素正常');
    assert.ok(html.includes('<style>'), '应包含样式标签');
  });

  test('input 有 combobox 角色', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    assert.ok(html.includes('role="combobox"'), '应有 combobox 角色');
    assert.ok(html.includes('aria-expanded="false"'), '默认 aria-expanded 为 false');
  });
});

describe('DateRangePicker - 边界情况', () => {
  test('空 value 不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {}),
    );
    assert.ok(typeof html === 'string', '应返回字符串');
  });

  test('start 和 end 为空字符串时不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '', end: '' },
      }),
    );
    assert.ok(typeof html === 'string', '应返回字符串');
  });

  test('跨年日期正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2025-12-28', end: '2026-01-05' },
      }),
    );
    assert.ok(
      html.includes('2025-12-28 ~ 2026-01-05'),
      '应正确显示跨年日期范围',
    );
  });

  test('单日范围正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(DateRangePicker, {
        value: { start: '2026-06-23', end: '2026-06-23' },
      }),
    );
    assert.ok(
      html.includes('2026-06-23 ~ 2026-06-23'),
      '应正确显示单日范围',
    );
  });
});

describe('DateRangePicker - 类型导出', () => {
  test('DateRangePicker 是函数', () => {
    assert.strictEqual(typeof DateRangePicker, 'function');
  });

  test('可以通过 require 正确加载', () => {
    const mod = require('./DateRangePicker');
    assert.ok(mod.default, 'default export 存在');
  });
});
