import React from 'react';
import type {
  FoundationAlertLinkedOverviewCardDefinition,
  FoundationAlertLinkedOverviewSummaryLike,
  FoundationAlertLinkedOverviewPalette,
} from './FoundationAlertLinkedOverview';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  FoundationAlertLinkedOverviewSection,
  FoundationAlertLinkedOverviewSurface,
  createFoundationAlertLinkedOverviewStats,
} = require('./FoundationAlertLinkedOverview');

/* ========== helpers ========== */

function makeSummary(overrides: Partial<FoundationAlertLinkedOverviewSummaryLike> = {}): FoundationAlertLinkedOverviewSummaryLike {
  return {
    approvalsPending: 3,
    approvalsWithFailures: 1,
    highRiskAudits: 2,
    blockedLedgers: 0,
    rotationDueSecrets: 5,
    expiredSecrets: 0,
    expiringCertificates: 2,
    expiredCertificates: 0,
    degradedSignals: 1,
    attentionRecoveryPlans: 1,
    staleDrills: 0,
    ...overrides,
  };
}

const defaultPalette: FoundationAlertLinkedOverviewPalette = {
  accentText: '#93c5fd',
  focusBannerBackground: 'rgba(30,41,59,0.5)',
  focusBannerBorder: 'rgba(96,165,250,0.18)',
  actionButtonBorder: 'rgba(96,165,250,0.28)',
  actionButtonBackground: 'rgba(37,99,235,0.18)',
  actionButtonText: '#dbeafe',
  overviewActiveBorder: 'rgba(147,197,253,0.8)',
  overviewActiveBackground: 'rgba(30,41,59,0.72)',
  riskCardBorder: 'rgba(96,165,250,0.2)',
  riskCardBackground: 'rgba(59,130,246,0.12)',
  riskActiveBorder: 'rgba(147,197,253,0.82)',
  riskActiveBackground: 'rgba(37,99,235,0.2)',
  catalogActiveBorder: 'rgba(96,165,250,0.82)',
  catalogActiveBackground: 'rgba(30,64,175,0.16)',
};

const defaultOverviewStats: FoundationAlertLinkedOverviewCardDefinition[] = [
  { label: '待处理审批', value: '18', helper: '执行失败 1', preferredCodes: ['approvals-pending', 'approval-execution-failures'] },
  { label: '高风险审计', value: '2', helper: '限流封禁 0', preferredCodes: ['high-risk-audits', 'blocked-rate-limit-ledgers'] },
  { label: '密钥与证书', value: '8', helper: '信号异常 1', preferredCodes: ['secret-rotation-attention', 'observability-degradation'] },
];

function makeGovernance(overrides: Record<string, unknown> = {}): any {
  return {
    topRisks: [
      {
        code: 'secret-rotation-attention',
        summary: '3 secrets need rotation',
        count: 3,
        triageState: 'needs-triage',
        triageSummary: 'Secret rotation overdue',
        recentOperation: { action: 'ACK', createdAt: new Date().toISOString(), actorId: 'ops-bot' },
        acknowledgement: null,
      },
      {
        code: 'high-risk-audits',
        summary: '2 high-risk audits pending',
        count: 2,
        triageState: 'needs-triage',
        triageSummary: 'Pending audit review',
        recentOperation: { action: 'ACK', createdAt: new Date().toISOString(), actorId: 'auditor-1' },
        acknowledgement: null,
      },
      {
        code: 'observability-degradation',
        summary: 'Signal degradation detected',
        count: 1,
        triageState: 'acknowledged',
        triageSummary: 'Signal below threshold',
        recentOperation: null,
        acknowledgement: { actorId: 'ops-oncall' },
      },
    ],
    overviewAlerts: [
      { code: 'approvals-pending', triageState: 'needs-triage', recentOperation: null, defaultSummary: '18 pending', triageSummary: 'Approvals queue backed up' },
      { code: 'runtime-callback-timeout', triageState: 'needs-triage', recentOperation: null, defaultSummary: '3 timed out', triageSummary: 'Callback timeout' },
    ],
    alerts: [
      { code: 'expiring-certificates', triageState: 'needs-triage', recentOperation: null, defaultSummary: '2 expiring soon', triageSummary: 'Certs expiring in 7d' },
      { code: 'stale-recovery-drills', triageState: 'needs-triage', recentOperation: null, defaultSummary: '30d stale', triageSummary: 'Drill overdue' },
    ],
    ...overrides,
  };
}

function makeNavigationBindings() {
  return {
    searchParams: new URLSearchParams(),
    pathname: '/alerts',
    replace: () => {},
  };
}

function renderPanel(): React.ReactNode {
  return React.createElement('div', { 'data-testid': 'mock-panel' }, 'Panel Content');
}

/* ========== createFoundationAlertLinkedOverviewStats ========== */

describe('createFoundationAlertLinkedOverviewStats', () => {
  test('admin preset returns 3 stat cards', () => {
    const cards = createFoundationAlertLinkedOverviewStats('admin', makeSummary());
    assert.equal(cards.length, 3);
    assert.equal(cards[0].label, '待处理审批');
    assert.equal(cards[1].label, '高风险审计');
    assert.equal(cards[2].label, '密钥与证书');
  });

  test('admin preset shows approvals values', () => {
    const summary = makeSummary({ approvalsPending: 8, approvalsWithFailures: 3 });
    const cards = createFoundationAlertLinkedOverviewStats('admin', summary);
    assert.equal(cards[0].value, '8');
    assert.ok(cards[0].helper.includes('3'));
  });

  test('tob preset returns 3 stat cards', () => {
    const cards = createFoundationAlertLinkedOverviewStats('tob', makeSummary());
    assert.equal(cards.length, 3);
  });

  test('tob preset includes resilience stats', () => {
    const summary = makeSummary({ degradedSignals: 2, attentionRecoveryPlans: 3, staleDrills: 1 });
    const cards = createFoundationAlertLinkedOverviewStats('tob', summary);
    assert.equal(cards[2].value, '6'); // 2 + 3 + 1
  });

  test('storefront preset returns 3 stat cards', () => {
    const cards = createFoundationAlertLinkedOverviewStats('storefront', makeSummary());
    assert.equal(cards.length, 3);
  });

  test('storefront preset includes certificate/secrets stats', () => {
    const summary = makeSummary({ rotationDueSecrets: 2, expiredSecrets: 1, expiringCertificates: 3, expiredCertificates: 0 });
    const cards = createFoundationAlertLinkedOverviewStats('storefront', summary);
    assert.equal(cards[1].value, '6'); // 2+1+3+0
  });

  test('preferredCodes are set on all cards', () => {
    for (const preset of ['admin', 'tob', 'storefront']) {
      const cards = createFoundationAlertLinkedOverviewStats(preset, makeSummary());
      for (const card of cards) {
        assert.ok(card.preferredCodes.length > 0);
      }
    }
  });

  test('topRiskCount is passed through to tob preset helper', () => {
    const cards = createFoundationAlertLinkedOverviewStats('tob', makeSummary(), 5);
    assert.ok(cards[2].helper.includes('5'));
  });

  test('topRiskCount is passed through to storefront preset helper', () => {
    const cards = createFoundationAlertLinkedOverviewStats('storefront', makeSummary(), 3);
    assert.ok(cards[2].helper.includes('3'));
  });
});

/* ========== FoundationAlertLinkedOverviewSection ========== */

describe('FoundationAlertLinkedOverviewSection', () => {
  test('renders focus bar with default query label', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('当前聚焦'));
  });

  test('renders overview stat cards', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('待处理审批'));
    assert.ok(html.includes('高风险审计'));
    assert.ok(html.includes('密钥与证书'));
  });

  test('renders stat card values', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('>18<'));
  });

  test('renders top risks section', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        topRisksTitle: 'Top Risks',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('Top Risks'));
    assert.ok(html.includes('secret-rotation-attention'));
    assert.ok(html.includes('high-risk-audits'));
  });

  test('renders catalog triage section', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        catalogTitle: 'Catalog Triage',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('Catalog Triage'));
  });

  test('renders the renderPanel output', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('data-testid="mock-panel"'));
    assert.ok(html.includes('Panel Content'));
  });

  test('renders title and description when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        title: '治理总览',
        description: '所有告警概览',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('治理总览'));
    assert.ok(html.includes('所有告警概览'));
  });

  test('renders without title wrapper when no shell props', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('Panel Content'));
  });

  test('handles empty governance data gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance({ topRisks: [], overviewAlerts: [], alerts: [] }),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('data-testid="mock-panel"'));
  });

  test('uses custom focusQueryKey', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        focusQueryKey: 'customAlert',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('customAlert='));
  });

  test('renders search input when search.enabled is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        search: { enabled: true, placeholder: '搜索告警...' },
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('搜索告警...'));
  });

  test('does not render search input when search is disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        search: { enabled: false },
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(!html.includes('搜索'));
  });

  test('does not render search input when search prop is omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(!html.includes('SearchFilterInput'));
    assert.ok(!html.includes('placeholder'));
  });

  test('renders custom empty share status', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        emptyShareStatus: '按 URL 打开时会自动滚到当前治理面板',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('按 URL 打开时会自动滚到当前治理面板'));
  });

  test('uses custom empty texts for top risks and catalog', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance({ topRisks: [], alerts: [] }),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        topRisksEmptyText: '暂无风险',
        catalogEmptyText: '暂无目录',
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('暂无风险'));
    assert.ok(html.includes('暂无目录'));
  });

  test('renders copy and clear buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('复制联动链接'));
  });

  test('renders default empty texts when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    // default top risks title and catalog title
    assert.ok(html.includes('Top Risks'));
    assert.ok(html.includes('Catalog Triage'));
  });

  test('renders triage summary and count for risk items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    // risk items should show triage state and count
    assert.ok(html.includes('needs-triage'));
    assert.ok(html.includes('3 件'));
  });

  test('renders focus bar with linked filter summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSection, {
        governance: makeGovernance(),
        navigationBindings: makeNavigationBindings(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    // focus bar should show "全部 timeline" since no linked filters
    assert.ok(html.includes('全部 timeline'));
    assert.ok(html.includes('(default)'));
  });
});

/* ========== FoundationAlertLinkedOverviewSurface ========== */

describe('FoundationAlertLinkedOverviewSurface', () => {
  test('renders with router-style navigation bindings', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSurface, {
        governance: makeGovernance(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        router: { push: () => {}, replace: () => {} },
        pathname: '/governance',
        searchParams: new URLSearchParams('alert=secret-rotation-attention'),
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('data-testid="mock-panel"'));
  });

  test('renders without router (uses defaults)', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSurface, {
        governance: makeGovernance(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('data-testid="mock-panel"'));
  });

  test('renders with focus from searchParams', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertLinkedOverviewSurface, {
        governance: makeGovernance(),
        palette: defaultPalette,
        overviewStats: defaultOverviewStats,
        pathname: '/governance',
        searchParams: new URLSearchParams('alert=secret-rotation-attention'),
        renderPanel: renderPanel as any,
      })
    );
    assert.ok(html.includes('secret-rotation-attention'));
  });
});
