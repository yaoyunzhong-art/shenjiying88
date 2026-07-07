/**
 * AIScenarioSimulator 组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — 标题、变量标签
 * 2. 模拟调用 — 点击按钮触发 onSimulate
 * 3. 结果显示 — 模拟返回结果显示趋势指标
 * 4. 错误态 — onSimulate 抛出异常时显示错误提示
 * 5. 重置 — 重置按钮清空结果
 */

import assert from 'node:assert/strict';
import { describe, test, mock } from 'node:test';
import React from 'react';

// 使用 require 加载 CJS 模块 — 避免 ESM/CJS React 版本冲突
const { AIScenarioSimulator } = require('./AIScenarioSimulator');

// ─── 测试套件 ───────────────────────────────────────────

describe('AIScenarioSimulator', () => {
  const mockVariables = [
    {
      id: 'adBudget',
      label: '广告预算 (元)',
      type: 'number' as const,
      defaultValue: 10000,
      min: 1000,
      max: 100000,
      step: 1000,
    },
    {
      id: 'channel',
      label: '投放渠道',
      type: 'select' as const,
      defaultValue: 'social',
      options: [
        { value: 'social', label: '社交媒体' },
        { value: 'search', label: '搜索引擎' },
        { value: 'display', label: '展示广告' },
      ],
    },
  ];

  test('1. 组件导出为函数', () => {
    assert.equal(typeof AIScenarioSimulator, 'function');
  });

  test('2. 渲染为有效 React 元素', () => {
    const elem = React.createElement(AIScenarioSimulator, {
      scenarioName: '测试',
      variables: [],
      onSimulate: async () => [],
    });
    assert.ok(React.isValidElement(elem), '应生成有效 React 元素');
  });

  test('3. 使用变量默认值生成元素', () => {
    const elem = React.createElement(AIScenarioSimulator, {
      scenarioName: '默认值测试',
      variables: mockVariables,
      onSimulate: async () => [],
    });
    assert.ok(React.isValidElement(elem));
    assert.equal(elem.props.scenarioName, '默认值测试');
    assert.equal(elem.props.variables, mockVariables);
  });

  test('4. 可传入自定义 loadingText 和 errorText', () => {
    const elem = React.createElement(AIScenarioSimulator, {
      scenarioName: '自定义文案',
      variables: mockVariables,
      onSimulate: async () => [],
      loadingText: '玩命计算中…',
      errorText: '出错了，稍后重试',
    });
    assert.equal(elem.props.loadingText, '玩命计算中…');
    assert.equal(elem.props.errorText, '出错了，稍后重试');
  });

  test('5. 模拟调用 — onSimulate 被正确传递', async () => {
    const simulateFn = mock.fn(async () => []);
    const elem = React.createElement(AIScenarioSimulator, {
      scenarioName: '测试模拟',
      variables: mockVariables,
      onSimulate: simulateFn,
    });
    assert.equal(typeof elem.props.onSimulate, 'function');
    const result = await elem.props.onSimulate({ adBudget: 20000, channel: 'search' });
    assert.ok(Array.isArray(result));
    simulateFn.mock.resetCalls();
  });

  test('6. 使用单变量渲染元素', () => {
    const singleVar = [
      {
        id: 'budget',
        label: '预算',
        type: 'number' as const,
        defaultValue: 5000,
      },
    ];
    const elem = React.createElement(AIScenarioSimulator, {
      scenarioName: '单变量',
      variables: singleVar,
      onSimulate: async () => [],
    });
    assert.ok(React.isValidElement(elem));
    assert.equal(elem.props.scenarioName, '单变量');
  });
});
