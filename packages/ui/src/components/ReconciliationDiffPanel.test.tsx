import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ReconciliationDiffPanel } = require('./ReconciliationDiffPanel');
import type { ReconciliationDiff } from './ReconciliationDiffPanel';

// ── 模拟数据 ─────────────────────────────────────────────────────────────────

const now = Date.now();

const mockDiffs: ReconciliationDiff[] = [
  {
    id: 'diff-1',
    refId: 'ORD-20260601-001',
    sourceSystem: 'POS系统',
    targetSystem: '财务系统',
    sourceValue: '1280.00',
    targetValue: '1275.00',
    diffAmount: 5.0,
    field: '订单金额',
    severity: 'minor',
    description: 'POS系统显示含包装费5元，财务系统未包含。',
    occurredAt: new Date(now - 5 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'diff-2',
    refId: 'ORD-20260601-002',
    sourceSystem: 'POS系统',
    targetSystem: '库存系统',
    sourceValue: '100',
    targetValue: '98',
    diffAmount: 2,
    field: '销售数量',
    severity: 'major',
    description: '一笔退单未同步到库存系统。',
    occurredAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'diff-3',
    refId: 'ORD-20260531-015',
    sourceSystem: '会员系统',
    targetSystem: '支付系统',
    sourceValue: '5000',
    targetValue: '5200',
    diffAmount: 200,
    field: '积分变动',
    severity: 'critical',
    description: '会员充值积分未同步。',
    occurredAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'diff-4',
    refId: 'ORD-20260531-020',
    sourceSystem: 'POS系统',
    targetSystem: '财务系统',
    sourceValue: '320.50',
    targetValue: '320.50',
    diffAmount: 0,
    field: '实收金额',
    severity: 'info',
    description: '已人工核对该笔订单。',
    occurredAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    resolved: true,
  },
  {
    id: 'diff-5',
    refId: 'ORD-20260530-099',
    sourceSystem: '第三方平台',
    targetSystem: '财务系统',
    sourceValue: '9999.99',
    targetValue: '9800.00',
    diffAmount: 199.99,
    field: '结算金额',
    severity: 'critical',
    description: '平台抽成计算方式与系统不一致。',
    occurredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
];

// ── 帮助函数 ─────────────────────────────────────────────────────────────────

function hasClass(html: string, className: string): boolean {
  return html.includes(`data-testid="${className}"`);
}

function countOccurrences(html: string, substr: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = html.indexOf(substr, idx)) !== -1) {
    count++;
    idx += substr.length;
  }
  return count;
}

// ── 测试 ─────────────────────────────────────────────────────────────────────

describe('ReconciliationDiffPanel', () => {
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('对账差异'), 'should render title');
    assert.ok(html.includes('差异总额'), 'should render total diff amount');
  });

  test('renders all 5 diff rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    const count = countOccurrences(html, 'data-testid="diff-row-');
    assert.strictEqual(count, 5, 'should render 5 diff rows');
  });

  test('renders panel with data-testid on root', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('reconciliation-diff-panel'), 'root should have testid');
  });

  test('renders filter buttons for all, unresolved, critical, major, minor', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('filter-all'), 'all filter');
    assert.ok(html.includes('filter-unresolved'), 'unresolved filter');
    assert.ok(html.includes('filter-critical'), 'critical filter');
    assert.ok(html.includes('filter-major'), 'major filter');
    assert.ok(html.includes('filter-minor'), 'minor filter');
  });

  test('shows empty state when no diffs', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: [], title: '对账差异' }),
    );
    assert.ok(html.includes('暂无差异数据'), 'should show empty state');
  });

  test('shows loading indicator when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, {
        diffs: mockDiffs,
        loading: true,
      }),
    );
    assert.ok(html.includes('刷新中'), 'should show loading text');
  });

  test('renders export button when onExport provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, {
        diffs: mockDiffs,
        onExport: () => {},
      }),
    );
    assert.ok(html.includes('export-btn'), 'export button should render');
    assert.ok(html.includes('导出'), 'export text should render');
  });

  test('does not render export button when onExport omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(!html.includes('export-btn'), 'export button should not render');
  });

  test('renders view detail buttons when onViewDetail provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, {
        diffs: mockDiffs,
        onViewDetail: () => {},
      }),
    );
    assert.ok(html.includes('data-testid="view-diff-'), 'view buttons should render');
  });

  test('renders resolve buttons for unresolved diffs when onResolve provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, {
        diffs: mockDiffs,
        onResolve: () => {},
      }),
    );
    // 4 unresolved → 4 resolve buttons
    const resolveCount = countOccurrences(html, 'data-testid="resolve-diff-');
    assert.strictEqual(resolveCount, 4, 'should have 4 resolve buttons');
  });

  test('does not render resolve buttons when onResolve omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(!html.includes('data-testid="resolve-diff-'), 'resolve buttons should not render');
  });

  test('resolved diff shows checkmark', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('✓ 已处理'), 'resolved indicator should render');
  });

  test('unresolved diffs show pending status', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    const pendingCount = countOccurrences(html, '待处理');
    assert.strictEqual(pendingCount, 4, 'should show 4 pending diffs');
  });

  test('displays diff field names in rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('订单金额'), 'should show field: 订单金额');
    assert.ok(html.includes('销售数量'), 'should show field: 销售数量');
    assert.ok(html.includes('积分变动'), 'should show field: 积分变动');
    assert.ok(html.includes('实收金额'), 'should show field: 实收金额');
    assert.ok(html.includes('结算金额'), 'should show field: 结算金额');
  });

  test('formats diff amounts correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('¥5.00'), 'should format diff-1 amount');
    assert.ok(html.includes('¥2.00'), 'should format diff-2 amount');
    assert.ok(html.includes('¥200.00'), 'should format diff-3 amount');
    assert.ok(html.includes('¥199.99'), 'should format diff-5 amount');
    // diff-4 has diffAmount=0, should show ¥0.00
    // It shows: diffAmount > 0 ? '+' : '' => '' + '¥0.00'
    assert.ok(html.includes('¥0.00'), 'should format diff-4 zero amount');
  });

  test('shows severity labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('严重'), 'critical severity label');
    assert.ok(html.includes('主要'), 'major severity label');
    assert.ok(html.includes('轻微'), 'minor severity label');
    assert.ok(html.includes('信息'), 'info severity label');
  });

  test('renders with custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, {
        diffs: mockDiffs,
        title: '对账差异面板',
      }),
    );
    assert.ok(html.includes('对账差异面板'), 'custom title should render');
  });

  test('renders footer with count and severity summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('共'), 'footer should show count');
    assert.ok(html.includes('严重'), 'footer should show critical count');
    assert.ok(html.includes('未处理'), 'footer should show unresolved count');
  });

  test('renders source system names', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReconciliationDiffPanel, { diffs: mockDiffs }),
    );
    assert.ok(html.includes('POS系统'), 'source system POS');
    assert.ok(html.includes('会员系统'), 'source system 会员系统');
    assert.ok(html.includes('第三方平台'), 'source system 第三方平台');
  });
});
