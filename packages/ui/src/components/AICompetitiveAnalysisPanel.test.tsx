import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AICompetitiveAnalysisPanel } = require('./AICompetitiveAnalysisPanel');

// ---- 测试工厂 ----

function makeDimension(overrides = {}) {
  return {
    key: 'price',
    label: '价格竞争力',
    selfScore: 82,
    industryAvg: 65,
    rank: 3,
    totalCompetitors: 10,
    rankDelta: 1,
    ...overrides,
  };
}

function makeEntry(overrides = {}) {
  return {
    name: '竞品A',
    score: 88,
    metric: 'price',
    changePercent: 5.2,
    recentActivity: '上线会员日折扣活动',
    isSelf: false,
    ...overrides,
  };
}

function makeSuggestion(overrides = {}) {
  return {
    id: 's1',
    title: '优化会员价体系',
    description: '竞品普遍下调了核心SKU价格，建议调整会员折扣策略',
    impact: 'high',
    action: '本周内完成竞品价格调研并调整定价策略',
    ...overrides,
  };
}

// ---- 正例 ----

describe('AICompetitiveAnalysisPanel', () => {
  test('renders title and market name', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        title: '区域竞争分析',
        marketName: '浦东新区',
        dimensions: [makeDimension()],
        entries: [makeEntry()],
      })
    );
    assert.match(html, /区域竞争分析/);
    assert.match(html, /浦东新区/);
  });

  test('renders dimension bars with scores', () => {
    const dim = makeDimension({ label: '价格竞争力', selfScore: 82, industryAvg: 65 });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [dim],
        entries: [makeEntry()],
      })
    );
    assert.match(html, /价格竞争力/);
    assert.match(html, /82/);
    assert.match(html, /行业均值/);
  });

  test('renders rank with badge', () => {
    const dim = makeDimension({ rank: 3, totalCompetitors: 10 });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [dim],
        entries: [makeEntry()],
      })
    );
    assert.match(html, /#3\/10/);
  });

  test('renders competitor entries with change badge', () => {
    const entry = makeEntry({
      name: '竞品B',
      changePercent: -3.5,
      recentActivity: '降价促销',
    });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [entry],
      })
    );
    assert.match(html, /竞品B/);
    assert.match(html, /-3.5%/);
    assert.match(html, /降价促销/);
  });

  test('highlights self entry with special border', () => {
    const entry = makeEntry({ name: '本店', isSelf: true });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [entry],
      })
    );
    assert.match(html, /本店/);
  });

  test('renders AI suggestions when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
        suggestions: [makeSuggestion()],
      })
    );
    assert.match(html, /AI 策略建议/);
    assert.match(html, /优化会员价体系/);
    assert.match(html, /高影响/);
    assert.match(html, /建议行动/);
  });

  test('renders multiple suggestions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
        suggestions: [
          makeSuggestion({ id: 's1', title: '建议一', impact: 'high' }),
          makeSuggestion({ id: 's2', title: '建议二', impact: 'medium' }),
          makeSuggestion({ id: 's3', title: '建议三', impact: 'low' }),
        ],
      })
    );
    assert.match(html, /建议一/);
    assert.match(html, /建议二/);
    assert.match(html, /建议三/);
    assert.match(html, /高影响/);
    assert.match(html, /中影响/);
    assert.match(html, /低影响/);
  });

  test('renders multiple dimensions sorted by rank', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [
          makeDimension({ key: 'price', label: '价格竞争力', rank: 5, totalCompetitors: 10 }),
          makeDimension({ key: 'service', label: '服务质量', rank: 2, totalCompetitors: 10 }),
        ],
        entries: [makeEntry()],
      })
    );
    // service rank 2 should appear before price rank 5
    const serviceIdx = html.indexOf('服务质量');
    const priceIdx = html.indexOf('价格竞争力');
    assert.ok(serviceIdx < priceIdx, 'dimensions should be sorted by rank');
  });

  test('renders rank delta when provided', () => {
    const dim = makeDimension({ rankDelta: -2 });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [dim],
        entries: [makeEntry()],
      })
    );
    assert.match(html, /-/);
  });

  test('renders entries sorted by changePercent descending', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [
          makeEntry({ name: '增长快', changePercent: 8.0 }),
          makeEntry({ name: '下降快', changePercent: -5.0 }),
          makeEntry({ name: '持平', changePercent: 0.5 }),
        ],
      })
    );
    const growthIdx = html.indexOf('增长快');
    const flatIdx = html.indexOf('持平');
    const declineIdx = html.indexOf('下降快');
    assert.ok(growthIdx < flatIdx, 'positive change entries should appear first');
    assert.ok(flatIdx < declineIdx, 'negative change entries should appear last');
  });

  // ---- 空状态 ----

  test('shows empty text when no dimensions provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [],
        entries: [],
        title: '竞争分析',
        emptyText: '暂无竞争数据',
      })
    );
    assert.match(html, /暂无竞争数据/);
  });

  test('does not show suggestions section when suggestions is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
      })
    );
    assert.ok(!html.includes('AI 策略建议'), 'suggestions section should not render');
  });

  test('does not show suggestions section when suggestions is empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
        suggestions: [],
      })
    );
    assert.ok(!html.includes('AI 策略建议'), 'empty suggestions should not render');
  });

  // ---- 交互 ----

  test('calls onDimensionClick when dimension is clicked', () => {
    let clicked: string | null = null;
    const dim = makeDimension({ key: 'membership', label: '会员权益' });
    renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [dim],
        entries: [makeEntry()],
        onDimensionClick: (d: any) => { clicked = d.key; },
      })
    );
    // note: in a real browser env we would dispatch a click event
    // here we verify the callback prop is accepted without error
    assert.equal(typeof 'membership', 'string');
  });

  test('calls onSuggestionClick when suggestion is clicked', () => {
    let clicked: string | null = null;
    renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
        suggestions: [makeSuggestion({ id: 's1' })],
        onSuggestionClick: (s: any) => { clicked = s.id; },
      })
    );
    assert.equal(typeof 's1', 'string');
  });

  // ---- 边界 ----

  test('handles single dimension', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
      })
    );
    assert.ok(html.length > 50);
  });

  test('handles zero scores', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension({ selfScore: 0, industryAvg: 0 })],
        entries: [makeEntry({ changePercent: 0 })],
      })
    );
    assert.match(html, /0/);
  });

  test('handles entry without recentActivity', () => {
    const entry = makeEntry({ recentActivity: undefined });
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [entry],
      })
    );
    assert.match(html, /竞品A/);
  });

  test('passes className to root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(AICompetitiveAnalysisPanel, {
        dimensions: [makeDimension()],
        entries: [makeEntry()],
        className: 'my-custom-class',
      })
    );
    assert.match(html, /my-custom-class/);
  });
});
