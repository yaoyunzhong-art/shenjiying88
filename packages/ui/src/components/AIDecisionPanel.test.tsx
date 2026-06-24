import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIDecisionPanel } = require('./AIDecisionPanel');

const mockRules = [
  {
    id: '1',
    name: '价格合规检查',
    description: '检查商品价格是否在合规范围内',
    status: 'passed' as const,
    matchedCount: 1280,
    durationMs: 45,
    executedAt: '11:00',
  },
  {
    id: '2',
    name: '库存异常检测',
    description: '检测库存为负或超量SKU',
    status: 'failed' as const,
    matchedCount: 3,
    durationMs: 120,
    suggestion: 'SKU-001, SKU-045, SKU-089 库存为负',
    executedAt: '11:00',
  },
  {
    id: '3',
    name: '会员等级异常',
    status: 'warning' as const,
    matchedCount: 12,
    durationMs: 88,
    executedAt: '11:01',
  },
  {
    id: '4',
    name: '待执行规则',
    status: 'pending' as const,
  },
];

const mockSummary = {
  total: 4,
  passed: 1,
  failed: 1,
  warning: 1,
  pending: 1,
  coveragePercent: 95,
  delta: 2,
};

describe('AIDecisionPanel', () => {
  // ==================== 基础渲染 ====================

  test('渲染面板标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        title: '质量检测结果',
      })
    );
    assert.match(html, /质量检测结果/);
  });

  test('渲染副标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        title: 'AI决策',
        subtitle: '最近一次执行: 11:00',
      })
    );
    assert.match(html, /11:00/);
  });

  test('渲染规则名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: mockRules })
    );
    assert.match(html, /价格合规检查/);
    assert.match(html, /库存异常检测/);
    assert.match(html, /会员等级异常/);
    assert.match(html, /待执行规则/);
  });

  test('渲染状态标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: mockRules })
    );
    assert.match(html, /通过/);
    assert.match(html, /未通过/);
    assert.match(html, /警告/);
    assert.match(html, /待执行/);
  });

  // ==================== 空状态 ====================

  test('空规则列表显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: [] })
    );
    assert.match(html, /暂无规则执行结果/);
  });

  test('自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [],
        emptyText: '所有规则已通过',
      })
    );
    assert.match(html, /所有规则已通过/);
  });

  // ==================== 统计汇总 ====================

  test('渲染汇总统计数字', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        summary: mockSummary,
      })
    );
    // 总计=4
    assert.match(html, />4</);
    // 覆盖率
    assert.match(html, /95%/);
  });

  test('未传入 summary 时自动计算', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: mockRules })
    );
    // 自动计算: total=4, passed=1, failed=1
    assert.match(html, />4</);
  });

  // ==================== 匹配数和耗时 ====================

  test('渲染匹配数和耗时', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: mockRules })
    );
    assert.match(html, /1280/);
    assert.match(html, /45ms/);
    assert.match(html, /120ms/);
    assert.match(html, /88ms/);
  });

  // ==================== 建议信息 ====================

  test('failed 规则显示建议', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: mockRules })
    );
    assert.match(html, /库存为负/);
  });

  // ==================== 紧凑模式 ====================

  test('compact 模式不显示描述', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        compact: true,
      })
    );
    // 规则名称仍渲染
    assert.match(html, /价格合规检查/);
    // 规则描述不应出现
    assert.ok(!html.includes('检查商品价格是否在合规范围内'));
  });

  // ==================== 覆盖率与趋势 ====================

  test('渲染覆盖率百分比', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        summary: { total: 4, passed: 1, failed: 1, warning: 1, pending: 1, coveragePercent: 88 },
      })
    );
    assert.match(html, /88%/);
  });

  test('渲染 delta 趋势变化', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: mockRules,
        summary: { total: 4, passed: 1, failed: 1, warning: 1, pending: 1, coveragePercent: 88, delta: -5 },
      })
    );
    assert.match(html, /vs 上轮/);
    assert.match(html, /5%/);
  });

  // ==================== 通过率颜色 ====================

  test('高通过率显示绿色', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [
          { id: '1', name: 'R1', status: 'passed' },
          { id: '2', name: 'R2', status: 'passed' },
          { id: '3', name: 'R3', status: 'passed' },
          { id: '4', name: 'R4', status: 'passed' },
          { id: '5', name: 'R5', status: 'passed' },
          { id: '6', name: 'R6', status: 'passed' },
          { id: '7', name: 'R7', status: 'passed' },
          { id: '8', name: 'R8', status: 'passed' },
          { id: '9', name: 'R9', status: 'passed' },
          { id: '10', name: 'R10', status: 'failed' },
        ],
      })
    );
    // 90% pass rate -> should have #22c55e (green)
    assert.match(html, /#22c55e/);
  });

  test('低通过率显示红色', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [
          { id: '1', name: 'R1', status: 'failed' },
          { id: '2', name: 'R2', status: 'failed' },
          { id: '3', name: 'R3', status: 'failed' },
          { id: '4', name: 'R4', status: 'failed' },
          { id: '5', name: 'R5', status: 'failed' },
          { id: '6', name: 'R6', status: 'failed' },
          { id: '7', name: 'R7', status: 'failed' },
          { id: '8', name: 'R8', status: 'passed' },
          { id: '9', name: 'R9', status: 'passed' },
          { id: '10', name: 'R10', status: 'passed' },
        ],
      })
    );
    // 30% pass rate -> should have #ef4444 (red)
    assert.match(html, /#ef4444/);
  });
});
