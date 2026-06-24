import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const {
  FoundationAlertPanelSelectedAlertReadout,
  FoundationAlertPanelSourceSummaryReadout,
  FoundationAlertPanelOwnerSummaryReadout,
  FoundationAlertPanelSummaryDigestReadout,
  FoundationAlertPanelTimelineReadout,
  createFoundationAlertPanelSectionStyle,
  createFoundationAlertPanelSelectionButtonStyle,
  createFoundationAlertPanelActionButtonStyle,
  createFoundationAlertPanelFeedbackStyle,
  createFoundationAlertPanelFilterButtonStyle,
  createFoundationAlertPanelFilterChipStyle,
  createFoundationAlertPanelSummaryCardStyle,
  createFoundationAlertPanelShortcutCardStyle,
} = require('./FoundationAlertPanelReadouts');

const testPalette = {
  surface: '#0f172a',
  border: '#334155',
  text: '#f1f5f9',
  muted: '#94a3b8',
  accent: '#38bdf8',
  row: 'rgba(148,163,184,0.06)',
  rowAlt: 'rgba(148,163,184,0.12)',
};

const testAlert = {
  code: 'alert-001',
  title: 'CPU Usage Spike',
  severity: 'critical',
  source: 'monitoring',
  status: 'open',
  createdAt: '2026-06-14T03:00:00Z',
  updatedAt: '2026-06-14T03:30:00Z',
};

const testTimelineItems = [
  { id: 't1', source: 'monitoring', message: 'CPU exceeded 90%', timestamp: '2026-06-14T03:00:00Z' },
  { id: 't2', source: 'logging', message: 'Memory threshold warning', timestamp: '2026-06-14T03:05:00Z' },
  { id: 't3', source: 'tracing', action: 'Trace re-evaluation', timestamp: '2026-06-14T03:10:00Z' },
];

const testSourceSummary = [
  { source: 'monitoring', count: 5, latestTimestamp: '2026-06-14T03:00:00Z' },
  { source: 'logging', count: 3, latestTimestamp: '2026-06-14T02:30:00Z' },
];

const testOwnerSummary = [
  { actorId: 'user-1', count: 4, latestTimestamp: '2026-06-14T03:00:00Z' },
  { actorId: 'user-2', count: 2, latestTimestamp: '2026-06-14T02:00:00Z' },
];

const testFilterSummary = [
  { label: 'Severity', value: 'critical', count: 3 },
  { label: 'Source', value: 'monitoring', count: 5 },
];

const testTimelineMetrics = {
  total: 10,
  filtered: 3,
  latestTimestamp: '2026-06-14T03:10:00Z',
};

const testFilterState = {
  severity: 'critical',
  source: 'monitoring',
};

// ---- Style factories ----
describe('createFoundationAlertPanelSectionStyle', () => {
  test('returns section style with palette', () => {
    const style = createFoundationAlertPanelSectionStyle(testPalette);
    assert.strictEqual(style.background, '#0f172a');
    assert.ok(style.border.includes('#334155'));
    assert.strictEqual(style.borderRadius, 12);
  });

  test('returns section style without palette', () => {
    const style = createFoundationAlertPanelSectionStyle();
    assert.ok(style.background);
    assert.strictEqual(style.borderRadius, 12);
  });
});

describe('createFoundationAlertPanelSelectionButtonStyle', () => {
  test('returns selected style', () => {
    const style = createFoundationAlertPanelSelectionButtonStyle(testPalette, true, 'default');
    assert.strictEqual(style.fontWeight, 600);
    assert.ok(style.background.includes('#38bdf8'));
  });

  test('returns unselected style', () => {
    const style = createFoundationAlertPanelSelectionButtonStyle(testPalette, false, 'default');
    assert.strictEqual(style.fontWeight, 400);
    assert.strictEqual(style.background, 'transparent');
  });

  test('accepts quick variant', () => {
    const style = createFoundationAlertPanelSelectionButtonStyle(testPalette, true, 'quick');
    assert.strictEqual(style.cursor, 'pointer');
  });
});

describe('createFoundationAlertPanelActionButtonStyle', () => {
  test('uses provided background color', () => {
    const style = createFoundationAlertPanelActionButtonStyle('#dc2626');
    assert.strictEqual(style.background, '#dc2626');
    assert.strictEqual(style.color, '#ffffff');
    assert.strictEqual(style.border, 'none');
  });
});

describe('createFoundationAlertPanelFeedbackStyle', () => {
  test('returns feedback style', () => {
    const style = createFoundationAlertPanelFeedbackStyle(testPalette);
    assert.ok(style.padding);
    assert.strictEqual(style.borderRadius, 8);
  });
});

describe('createFoundationAlertPanelFilterButtonStyle', () => {
  test('returns selected filter style', () => {
    const style = createFoundationAlertPanelFilterButtonStyle(testPalette, true);
    assert.strictEqual(style.fontWeight, 600);
  });

  test('returns unselected filter style', () => {
    const style = createFoundationAlertPanelFilterButtonStyle(testPalette, false);
    assert.strictEqual(style.fontWeight, 400);
  });
});

describe('createFoundationAlertPanelFilterChipStyle', () => {
  test('returns chip style', () => {
    const style = createFoundationAlertPanelFilterChipStyle(testPalette);
    assert.strictEqual(style.borderRadius, 4);
    assert.strictEqual(style.whiteSpace, 'nowrap');
  });
});

describe('createFoundationAlertPanelSummaryCardStyle', () => {
  test('returns summary card style', () => {
    const style = createFoundationAlertPanelSummaryCardStyle(testPalette);
    assert.strictEqual(style.borderRadius, 8);
    assert.strictEqual(style.display, 'flex');
  });
});

describe('createFoundationAlertPanelShortcutCardStyle', () => {
  test('wraps summary card style with palette', () => {
    const summaryStyle = createFoundationAlertPanelSummaryCardStyle(testPalette);
    const result = createFoundationAlertPanelShortcutCardStyle(testPalette, summaryStyle, false);
    assert.strictEqual(result.cursor, 'pointer');
    assert.strictEqual(result.borderRadius, 8);
    assert.strictEqual(result.display, 'flex');
  });

  test('highlights border when active', () => {
    const summaryStyle = createFoundationAlertPanelSummaryCardStyle(testPalette);
    const active = createFoundationAlertPanelShortcutCardStyle(testPalette, summaryStyle, true);
    const inactive = createFoundationAlertPanelShortcutCardStyle(testPalette, summaryStyle, false);
    assert.notStrictEqual(active.borderColor, inactive.borderColor);
  });
});

// ---- Readout components ----
describe('FoundationAlertPanelSelectedAlertReadout', () => {
  test('renders alert title and code', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSelectedAlertReadout, {
        palette: testPalette,
        selectedAlert: testAlert,
      })
    );
    assert.ok(html.includes('CPU Usage Spike'));
    assert.ok(html.includes('alert-001'));
  });

  test('renders with owner and note', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSelectedAlertReadout, {
        palette: testPalette,
        selectedAlert: testAlert,
        currentOwner: 'ops-team',
        currentNote: 'Under investigation',
      })
    );
    assert.ok(html.includes('ops-team'));
    assert.ok(html.includes('Under investigation'));
  });

  test('renders without palette using defaults', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSelectedAlertReadout, {
        selectedAlert: testAlert,
      })
    );
    assert.ok(html.includes('CPU Usage Spike'));
  });
});

describe('FoundationAlertPanelSourceSummaryReadout', () => {
  test('renders source summary items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSourceSummaryReadout, {
        palette: testPalette,
        items: testSourceSummary,
      })
    );
    assert.ok(html.includes('Source Summary'));
    assert.ok(html.includes('monitoring'));
    assert.ok(html.includes('5'));
  });

  test('renders empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSourceSummaryReadout, {
        palette: testPalette,
        items: [],
      })
    );
    assert.ok(html.includes('No source data'));
  });

  test('renders with undefined items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSourceSummaryReadout, {})
    );
    assert.ok(html.includes('No source data'));
  });
});

describe('FoundationAlertPanelOwnerSummaryReadout', () => {
  test('renders owner summary items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelOwnerSummaryReadout, {
        palette: testPalette,
        items: testOwnerSummary,
      })
    );
    assert.ok(html.includes('Owner Summary'));
    assert.ok(html.includes('user-1'));
    assert.ok(html.includes('4'));
  });

  test('renders empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelOwnerSummaryReadout, {
        palette: testPalette,
        items: [],
      })
    );
    assert.ok(html.includes('No owner data'));
  });
});

describe('FoundationAlertPanelSummaryDigestReadout', () => {
  test('renders with filter count and metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSummaryDigestReadout, {
        palette: testPalette,
        activeFilterCount: 2,
        timelineMetrics: testTimelineMetrics,
        defaultLatestSource: 'monitoring',
        filterSummary: testFilterSummary,
      })
    );
    assert.ok(html.includes('Summary Digest'));
    assert.ok(html.includes('2'));
  });

  test('renders with timeline digest text', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSummaryDigestReadout, {
        palette: testPalette,
        timelineDigest: '3 critical alerts in the last hour',
      })
    );
    assert.ok(html.includes('3 critical alerts'));
  });

  test('renders without optional props', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSummaryDigestReadout, {})
    );
    assert.ok(html.includes('Summary Digest'));
  });

  test('renders with filter state and summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelSummaryDigestReadout, {
        palette: testPalette,
        filterState: testFilterState,
        activeFilterCount: 1,
        filterSummary: testFilterSummary,
      })
    );
    assert.ok(html.includes('Summary Digest'));
  });
});

describe('FoundationAlertPanelTimelineReadout', () => {
  test('renders timeline items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelTimelineReadout, {
        palette: testPalette,
        recentTimeline: testTimelineItems,
      })
    );
    assert.ok(html.includes('Timeline'));
    assert.ok(html.includes('CPU exceeded 90%'));
    assert.ok(html.includes('Memory threshold warning'));
  });

  test('renders filtered timeline', () => {
    const filtered = testTimelineItems.slice(0, 1);
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelTimelineReadout, {
        palette: testPalette,
        recentTimeline: testTimelineItems,
        filteredTimeline: filtered,
      })
    );
    assert.ok(html.includes('CPU exceeded 90%'));
  });

  test('renders filter empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelTimelineReadout, {
        palette: testPalette,
        recentTimeline: testTimelineItems,
        filteredTimeline: [],
        filterEmptyState: true,
      })
    );
    assert.ok(html.includes('No timeline events match current filters'));
  });

  test('renders empty timeline without items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FoundationAlertPanelTimelineReadout, {
        palette: testPalette,
        recentTimeline: [],
      })
    );
    assert.ok(html.includes('No timeline events'));
  });
});
