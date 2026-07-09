import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AlertCorrelationDashboard } = require('./AlertCorrelationDashboard');

/** Helper: produce a sample alert */
function alert(overrides = {}) {
  return {
    id: 'alert-001',
    title: '测试告警',
    severity: 'medium',
    source: 'device',
    timestamp: '2026-07-09T10:00:00Z',
    description: '测试告警描述',
    acknowledged: false,
    ...overrides,
  };
}

/** Helper: produce a sample correlation group */
function group(overrides = {}) {
  return {
    groupId: 'group-001',
    rootCause: '网络故障导致连锁异常',
    confidence: 'high',
    alertIds: ['alert-001'],
    impact: '影响门店正常运营',
    recommendedAction: '立即检查网络设备',
    estimatedResolutionMin: 30,
    ...overrides,
  };
}

const emptyProps = { alerts: [], correlationGroups: [] };

test('exports AlertCorrelationDashboard', () => {
  assert.ok(typeof AlertCorrelationDashboard === 'function');
});

test('renders empty dashboard', () => {
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, emptyProps),
  );
  assert.ok(html.length > 0);
  assert.ok(html.includes('AI 告警关联分析'));
  assert.ok(html.includes('暂无关联告警分组'));
});

test('renders custom title', () => {
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      ...emptyProps,
      title: '自定义标题',
    }),
  );
  assert.ok(html.includes('自定义标题'));
  assert.ok(!html.includes('AI 告警关联分析'));
});

test('renders unacknowledged count', () => {
  const alerts = [
    alert({ id: 'a1', acknowledged: false }),
    alert({ id: 'a2', acknowledged: true }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: [],
    }),
  );
  assert.ok(html.includes('1 条未确认'));
});

test('renders all acknowledged message', () => {
  const alerts = [alert({ acknowledged: true })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: [],
    }),
  );
  assert.ok(html.includes('全部已确认'));
});

test('renders severity stats for all levels', () => {
  const alerts = [
    alert({ id: 'a1', severity: 'critical' }),
    alert({ id: 'a2', severity: 'high' }),
    alert({ id: 'a3', severity: 'medium' }),
    alert({ id: 'a4', severity: 'low' }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: [],
    }),
  );
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    assert.ok(html.includes(`severity-stat-${sev}`), `should include severity-stat-${sev}`);
  }
});

test('renders correlation group with content', () => {
  const alerts = [alert()];
  const groups = [group({ rootCause: '核心交换机故障' })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, { alerts, correlationGroups: groups }),
  );
  assert.ok(html.includes('correlation-group-group-001'));
  assert.ok(html.includes('核心交换机故障'));
});

test('renders AI recommendation in group', () => {
  const alerts = [alert()];
  const groups = [group({ recommendedAction: '立即重启核心交换机' })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, { alerts, correlationGroups: groups }),
  );
  assert.ok(html.includes('立即重启核心交换机'));
});

test('renders impact and ETA', () => {
  const alerts = [alert()];
  const groups = [group({ impact: '影响收银系统', estimatedResolutionMin: 45 })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, { alerts, correlationGroups: groups }),
  );
  assert.ok(html.includes('影响收银系统'));
  assert.ok(html.includes('45min'));
});

test('renders execute-action button when callback provided', () => {
  const alerts = [alert()];
  const groups = [group()];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: groups,
      onExecuteAction: () => {},
    }),
  );
  assert.ok(html.includes('执行推荐'));
});

test('renders view-detail button when callback provided', () => {
  const alerts = [alert()];
  const groups = [group()];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: groups,
      onViewDetail: () => {},
    }),
  );
  assert.ok(html.includes('查看详情'));
});

test('renders acknowledge-group button when unacknowledged', () => {
  const alerts = [alert()];
  const groups = [group()];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: groups,
      onAcknowledgeGroup: () => {},
    }),
  );
  assert.ok(html.includes('确认关联组'));
});

test('hides acknowledge-group button when all acknowledged', () => {
  const alerts = [alert({ id: 'alert-001', acknowledged: true })];
  const groups = [group({ alertIds: ['alert-001'] })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      alerts,
      correlationGroups: groups,
      onAcknowledgeGroup: () => {},
    }),
  );
  assert.ok(!html.includes('确认关联组'));
});

test('renders acknowledged checkmark', () => {
  const alerts = [alert({ id: 'alert-001', acknowledged: true })];
  const groups = [group({ alertIds: ['alert-001'] })];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, { alerts, correlationGroups: groups }),
  );
  assert.ok(html.includes('✓'));
});

test('renders multiple correlation groups', () => {
  const alerts = [alert({ id: 'a1' }), alert({ id: 'a2', severity: 'low' })];
  const groups = [
    group({ groupId: 'g1', alertIds: ['a1'] }),
    group({ groupId: 'g2', alertIds: ['a2'], rootCause: '次要问题' }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, { alerts, correlationGroups: groups }),
  );
  assert.ok(html.includes('correlation-group-g1'));
  assert.ok(html.includes('correlation-group-g2'));
  assert.ok(html.includes('次要问题'));
});

test('renders severity label data-testid in group', () => {
  // Test with a single alert at each severity level
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    const html = renderToStaticMarkup(
      React.createElement(AlertCorrelationDashboard, {
        alerts: [alert({ id: `a-${sev}`, severity: sev })],
        correlationGroups: [group({ alertIds: [`a-${sev}`], rootCause: `Test ${sev}` })],
      }),
    );
    assert.ok(html.includes(`severity-label-${sev}`), `should render severity-label-${sev}`);
  }
});

test('renders confidence badge data-testid', () => {
  for (const level of ['high', 'medium', 'low']) {
    const html = renderToStaticMarkup(
      React.createElement(AlertCorrelationDashboard, {
        alerts: [alert()],
        correlationGroups: [group({ confidence: level })],
      }),
    );
    assert.ok(html.includes(`confidence-badge-${level}`), `should render confidence-badge-${level}`);
  }
});

test('renders source labels in group alerts', () => {
  const sources = {
    device: '设备', member: '会员', transaction: '交易', system: '系统', network: '网络',
  };
  for (const [src, label] of Object.entries(sources)) {
    const html = renderToStaticMarkup(
      React.createElement(AlertCorrelationDashboard, {
        alerts: [alert({ id: 'a1', source: src })],
        correlationGroups: [group({ alertIds: ['a1'] })],
      }),
    );
    assert.ok(html.includes(`[${label}]`), `source ${src} should render [${label}]`);
  }
});

test('renders className prop', () => {
  const html = renderToStaticMarkup(
    React.createElement(AlertCorrelationDashboard, {
      ...emptyProps,
      className: 'custom-class-name',
    }),
  );
  assert.ok(html.includes('custom-class-name'));
});
