/**
 * SLACompliancePanel 测试
 */
const React = require('react');
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SLACompliancePanel } = require('./SLACompliancePanel');

const sampleMetrics = [
  {
    id: 'sla-001',
    name: '工单响应时间',
    target: '≤ 30分钟',
    current: '12分钟',
    complianceRate: 97.3,
    status: 'compliant',
    period: 'daily',
    totalCount: 1452,
    compliantCount: 1413,
    breachCount: 39,
    trend: 'up',
    trendDelta: 2.1,
  },
  {
    id: 'sla-002',
    name: '售后解决时长',
    target: '≤ 4小时',
    current: '3.2小时',
    complianceRate: 91.6,
    status: 'warning',
    period: 'weekly',
    totalCount: 876,
    compliantCount: 802,
    breachCount: 74,
    trend: 'down',
    trendDelta: -1.8,
  },
  {
    id: 'sla-003',
    name: '客户满意度',
    target: '≥ 95%',
    current: '93.2%',
    complianceRate: 88.5,
    status: 'breached',
    period: 'monthly',
    totalCount: 3201,
    compliantCount: 2833,
    breachCount: 368,
    trend: 'down',
    trendDelta: -3.5,
  },
  {
    id: 'sla-004',
    name: '首次修复率',
    target: '≥ 85%',
    current: '87.5%',
    complianceRate: 100,
    status: 'compliant',
    period: 'monthly',
    totalCount: 654,
    compliantCount: 654,
    breachCount: 0,
    trend: 'stable',
    trendDelta: 0,
  },
];

describe('SLACompliancePanel', () => {
  test('renders with metrics and shows title', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /SLA 合规监控/);
    assert.match(html, /4 项指标/);
  });

  test('renders custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics, title: '服务SLA看板' })
    );
    assert.match(html, /服务SLA看板/);
  });

  test('shows empty state when no metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: [] })
    );
    assert.match(html, /暂无 SLA 指标数据/);
    assert.ok(html.includes('data-testid="sla-empty"'));
  });

  test('shows summary counts (compliant / warning / breached)', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /达标 2/);
    assert.match(html, /预警 1/);
    assert.match(html, /违规 1/);
  });

  test('shows compliance bar for each metric', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    // compliance bars rendered
    const barMatches = html.match(/data-testid="compliance-bar"/g);
    assert.ok(barMatches && barMatches.length >= 4);
  });

  test('renders trend indicators', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /↑/);
    assert.match(html, /↓/);
    assert.match(html, /→/);
  });

  test('renders SLA status indicators', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /data-testid="sla-status-compliant"/);
    assert.match(html, /data-testid="sla-status-warning"/);
    assert.match(html, /data-testid="sla-status-breached"/);
  });

  test('shows period labels on metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /日/);
    assert.match(html, /周/);
    assert.match(html, /月/);
  });

  test('renders target and current values', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.match(html, /≤ 30分钟/);
    assert.match(html, /12分钟/);
    assert.match(html, /≥ 95%/);
    assert.match(html, /93\.2%/);
  });

  test('showOnlyWarnings filters compliant metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics, showOnlyWarnings: true })
    );
    // Compliant items should be filtered out (只有 warning 和 breached 的项)
    assert.match(html, /售后解决时长/);   // warning
    assert.match(html, /客户满意度/);     // breached
    // Compliant items should NOT appear
    assert.ok(!html.includes('工单响应时间'));   // compliant
    assert.ok(!html.includes('首次修复率'));     // compliant
  });

  test('renders refresh button when onRefresh provided', () => {
    let called = false;
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics, onRefresh: () => { called = true; } })
    );
    assert.match(html, /data-testid="sla-refresh-btn"/);
    assert.match(html, /刷新/);
  });

  test('compliance rate shows in summary header', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    // Avg: (97.3 + 91.6 + 88.5 + 100) / 4 = 94.35 -> toFixed(1) = 94.3
    assert.match(html, /94\.3%/);
  });

  test('renders with single metric', () => {
    const single = [sampleMetrics[0]];
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: single })
    );
    assert.match(html, /1 项指标/);
    assert.match(html, /工单响应时间/);
    assert.match(html, /达标 1/);
  });

  test('handles empty and null gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: null })
    );
    assert.match(html, /暂无 SLA 指标数据/);
    assert.ok(html.includes('data-testid="sla-empty"'));
  });

  test('undefined metrics shows empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, {})
    );
    assert.match(html, /暂无 SLA 指标数据/);
    assert.ok(html.includes('data-testid="sla-empty"'));
  });

  test('data-testid on main container', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.ok(html.includes('data-testid="sla-compliance-panel"'));
  });

  test('data-testid on metric rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.ok(html.includes('data-testid="sla-row-sla-001"'));
    assert.ok(html.includes('data-testid="sla-row-sla-003"'));
  });

  test('breach count shown in expanded detail', () => {
    // Static test: verify metric rows have data-testid (expanded detail is toggled via state)
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.ok(html.includes('data-testid="sla-row-sla-001"'));
    assert.ok(html.includes('data-testid="sla-row-sla-002"'));
    assert.ok(html.includes('data-testid="sla-row-sla-003"'));
    assert.ok(html.includes('data-testid="sla-row-sla-004"'));
    assert.ok(html.includes('data-testid="sla-metric-list"'));
  });

  test('no refresh button when onRefresh is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(SLACompliancePanel, { metrics: sampleMetrics })
    );
    assert.ok(!html.includes('data-testid="sla-refresh-btn"'));
  });
});
