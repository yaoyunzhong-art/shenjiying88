import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StrategyConfigPanel } = require('./StrategyConfigPanel');

// ---- 测试工厂 ----
function makeStrategy(overrides = {}) {
  return {
    id: 'strategy-1',
    name: '价格异常检测策略',
    description: '检测商品价格异常波动',
    category: 'price',
    enabled: true,
    priority: 75,
    params: [
      {
        key: 'price_threshold',
        name: '价格波动阈值',
        description: '环比波动百分比阈值',
        type: 'number',
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        required: true,
      },
      {
        key: 'auto_fix',
        name: '自动修正',
        description: '是否自动修正异常价格',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'scope',
        name: '检测范围',
        type: 'select',
        defaultValue: 'all',
        options: [
          { label: '全平台', value: 'all' },
          { label: '自营商品', value: 'self' },
        ],
      },
      {
        key: 'channels',
        name: '适配渠道',
        type: 'tags',
        defaultValue: ['online'],
        options: [
          { label: '线上商城', value: 'online' },
          { label: '线下门店', value: 'offline' },
        ],
      },
      {
        key: 'remark',
        name: '备注',
        type: 'string',
        defaultValue: '',
        placeholder: '输入备注信息...',
      },
    ],
    conditions: [
      { id: 'c1', field: 'price_change_pct', operator: 'gt', value: 50 },
    ],
    tags: ['price', 'anomaly'],
    updatedAt: '2026-06-26 10:00',
    ...overrides,
  };
}

// ---- SSR 渲染辅助 ----
function render(component) {
  return renderToStaticMarkup(component);
}

function contains(haystack, needle) {
  return haystack.indexOf(needle) !== -1;
}

// ==================== 测试 ====================

describe('StrategyConfigPanel', () => {
  test('renders title', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '⚙️'));
    assert.ok(contains(html, '策略配置'));
  });

  test('renders strategy name', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '价格异常检测策略'));
  });

  test('renders description', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '检测商品价格异常波动'));
  });

  test('renders category badge', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, 'price'));
  });

  test('renders priority badge with value', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, 'P75'));
  });

  test('renders enabled state as checked', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, 'checked'));
    assert.ok(contains(html, '已启用'));
  });

  test('renders disabled state when enabled=false', () => {
    const html = render(
      React.createElement(StrategyConfigPanel, { strategy: makeStrategy({ enabled: false }) })
    );
    assert.ok(contains(html, '已禁用'));
  });

  test('renders all param names', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '价格波动阈值'));
    assert.ok(contains(html, '自动修正'));
    assert.ok(contains(html, '检测范围'));
    assert.ok(contains(html, '适配渠道'));
    assert.ok(contains(html, '备注'));
  });

  test('renders param descriptions', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '环比波动百分比阈值'));
    assert.ok(contains(html, '是否自动修正异常价格'));
  });

  test('renders trigger conditions', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, 'price_change_pct'));
    assert.ok(contains(html, 'gt'));
  });

  test('renders tags', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '#price'));
    assert.ok(contains(html, '#anomaly'));
  });

  test('renders updatedAt', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '2026-06-26 10:00'));
  });

  test('renders save and reset buttons in edit mode', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '保存配置'));
    assert.ok(contains(html, '恢复默认'));
  });

  test('renders empty strategy gracefully', () => {
    const empty = makeStrategy({ name: '', enabled: false, priority: 0, params: [] });
    const html = render(React.createElement(StrategyConfigPanel, { strategy: empty }));
    assert.ok(contains(html, '⚙️'));
  });

  test('renders readOnly mode with locked indicator', () => {
    const html = render(
      React.createElement(StrategyConfigPanel, { strategy: makeStrategy(), readOnly: true })
    );
    assert.ok(contains(html, '只读模式'));
    assert.ok(!contains(html, '保存配置'));
    assert.ok(!contains(html, '恢复默认'));
  });

  test('renders number input for number type param', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    // 应该有两个 input[type=number] / input[type=range]
    assert.ok(contains(html, 'type="range"'));
    assert.ok(contains(html, '20')); // defaultValue for price_threshold
  });

  test('renders checkbox for boolean type param', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '未启用'));
  });

  test('renders select for select type param', () => {
    const html = render(React.createElement(StrategyConfigPanel, { strategy: makeStrategy() }));
    assert.ok(contains(html, '全平台'));
    assert.ok(contains(html, '自营商品'));
  });

  test('renders custom title', () => {
    const html = render(
      React.createElement(StrategyConfigPanel, {
        strategy: makeStrategy(),
        title: '自定义策略面板',
      })
    );
    assert.ok(contains(html, '自定义策略面板'));
  });

  test('renders number param as disabled when readOnly', () => {
    const html = render(
      React.createElement(StrategyConfigPanel, { strategy: makeStrategy(), readOnly: true })
    );
    // All inputs should be disabled
    assert.ok(contains(html, 'disabled'));
  });

  test('renders conditions section with count', () => {
    const strategy = makeStrategy();
    const html = render(React.createElement(StrategyConfigPanel, { strategy }));
    assert.ok(contains(html, '触发条件'));
    assert.ok(contains(html, '1')); // condition count
  });

  test('renders empty conditions gracefully', () => {
    const strategy = makeStrategy({ conditions: [] });
    const html = render(React.createElement(StrategyConfigPanel, { strategy }));
    assert.ok(!contains(html, '触发条件'));
  });

  test('renders empty tags gracefully', () => {
    const strategy = makeStrategy({ tags: [] });
    const html = render(React.createElement(StrategyConfigPanel, { strategy }));
    assert.ok(!contains(html, '#price'));
  });
});
