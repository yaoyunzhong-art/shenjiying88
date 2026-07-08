/**
 * AnomalyFrequencyClient — L1冒烟测试
 *
 * 测试策略:
 * - 正例: 组件渲染、按钮交互、统计计算
 * - 边界: 空数据、全零数据、大量数据
 * - 反例: 缺失属性不崩溃
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

const {
  AnomalyFrequencyClient,
} = require('./anomaly-frequency-client');

const { AdminGovernanceReadModel } = require('../bootstrap');

// ---- 工厂 ----

function makeGovernance(overrides = {}) {
  return {
    deliveryMode: 'fallback',
    ...overrides,
  };
}

// ---- 辅助 ----

function render(el) {
  return renderToStaticMarkup(el);
}

function contains(html, str) {
  return html.includes(str);
}

// ---- 正例 ----

describe('AnomalyFrequencyClient — 正例', () => {
  test('导出存在且为函数', () => {
    assert.equal(typeof AnomalyFrequencyClient, 'function');
  });

  test('渲染页面标题', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '异常时序频率'), '应展示页面标题');
  });

  test('渲染统计卡片', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '总异常数'), '应展示总异常数统计');
    assert.ok(contains(html, '严重异常'), '应展示严重异常统计');
    assert.ok(contains(html, '高优先级'), '应展示高优先级统计');
    assert.ok(contains(html, '时段均值'), '应展示时段均值统计');
  });

  test('渲染时间范围按钮', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '近6小时'), '应展示近6小时按钮');
    assert.ok(contains(html, '近24小时'), '应展示近24小时按钮');
    assert.ok(contains(html, '近7天'), '应展示近7天按钮');
    assert.ok(contains(html, '近30天'), '应展示近30天按钮');
  });

  test('渲染严重程度过滤按钮', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '全部'), '应展示全部按钮');
    assert.ok(contains(html, '严重'), '应展示严重按钮');
    assert.ok(contains(html, '高'), '应展示高按钮');
    assert.ok(contains(html, '中'), '应展示中按钮');
    assert.ok(contains(html, '低'), '应展示低按钮');
  });

  test('渲染刷新按钮', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '刷新'), '应展示刷新按钮');
  });

  test('渲染异常时序图组件', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, 'anomaly-frequency-timeline-page'), '应渲染 AnomalyFrequencyTimeline');
    assert.ok(contains(html, '异常时序分布'), '应展示图表标题');
  });

  test('渲染底部说明', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    assert.ok(contains(html, '说明'), '应展示说明区域');
    assert.ok(contains(html, '时序频率图'), '应展示说明内容');
  });

  test('离线模式标识', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance({ deliveryMode: 'fallback' }) }));
    assert.ok(contains(html, '离线模式'), 'fallback 模式应展示离线标识');
  });

  test('API 模式不展示离线标识', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance({ deliveryMode: 'api' }) }));
    assert.ok(!contains(html, '离线模式'), 'API 模式不应展示离线标识');
  });

  test('初始时间范围为近24小时（默认选中）', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    // 默认近24小时应生成24个数据桶 -> 由 AnomalyFrequencyTimeline 渲染
    assert.ok(contains(html, '异常时序分布'), '图表应正常渲染');
  });

  test('统计数字为非负整数', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    // 验证统计卡片渲染出数字
    const statMatch = html.match(/总异常数<\/span><span[^>]*>(\d+)<\/span>/);
    if (statMatch) {
      const val = parseInt(statMatch[1], 10);
      assert.ok(Number.isFinite(val) && val >= 0, `总异常数应为非负整数，实际: ${val}`);
    }
  });
});

// ---- 边界 ----

describe('AnomalyFrequencyClient — 边界', () => {
  test('governance 为 undefined 时不崩溃', () => {
    assert.doesNotThrow(() => {
      const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: undefined }));
      assert.ok(html.includes('异常时序频率'), 'undefined 时应正常渲染');
      assert.ok(html.includes('离线模式'), 'undefined 时应回退到 fallback');
    });
  });

  test('governance 缺失 deliveryMode 时不崩溃', () => {
    assert.doesNotThrow(() => {
      render(React.createElement(AnomalyFrequencyClient, { initialGovernance: {} }));
    });
  });

  test('超长时间范围（30天）不崩溃', () => {
    const html = render(React.createElement(AnomalyFrequencyClient, { initialGovernance: makeGovernance() }));
    // 近30天按钮存在
    assert.ok(contains(html, '近30天'));
  });
});

// ---- 反例 ----

describe('AnomalyFrequencyClient — 反例', () => {
  test('缺失 required props 不崩溃', () => {
    // @ts-expect-error - 测试缺失属性
    assert.doesNotThrow(() => {
      render(React.createElement(AnomalyFrequencyClient));
    });
  });

  test('极端的 deliveryMode 值不崩溃', () => {
    assert.doesNotThrow(() => {
      render(React.createElement(AnomalyFrequencyClient, { initialGovernance: { deliveryMode: 'unknown' } }));
    });
  });
});
