import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  FoundationAlertPanelFrame,
  FoundationAlertPanelSurface,
  foundationAlertPanelThemePresets,
  useFoundationAsyncLoader,
} = require('./FoundationAlertPanel');

import type {
  GovernanceReadModel,
  FoundationAlertPanelClientAccess,
} from './FoundationAlertPanel';

/* --------------- Helpers --------------- */

function gov(overrides: Partial<GovernanceReadModel> = {}): GovernanceReadModel {
  return {
    alerts: [
      { code: 'ALERT-001', message: 'CPU usage exceeded 90%', severity: 'critical', acknowledged: false, muted: false, source: 'monitoring', owner: 'ops-team' },
      { code: 'ALERT-002', message: 'Memory usage warning', severity: 'warning', acknowledged: true, muted: false, source: 'monitoring', owner: 'dev-team' },
      { code: 'ALERT-003', message: 'Disk space notification', severity: 'info', acknowledged: false, muted: true, source: 'infra', owner: '' },
    ],
    summary: { total: 3, critical: 1, warning: 1, info: 1, acknowledged: 1, muted: 1 },
    ...overrides,
  };
}

function pa(): FoundationAlertPanelClientAccess {
  return { tenantId: 't1', storeId: 's1' };
}

const theme = foundationAlertPanelThemePresets.admin;

/* --------------- Tests --------------- */

describe('FoundationAlertPanel', () => {
  /* ---- useFoundationAsyncLoader ---- */
  describe('useFoundationAsyncLoader', () => {
    test('is a function', () => {
      assert.equal(typeof useFoundationAsyncLoader, 'function');
    });
  });

  /* ---- FoundationAlertPanelFrame ---- */
  describe('FoundationAlertPanelFrame', () => {
    test('renders data-component attribute', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /data-component="foundation-alert-panel"/);
    });

    test('renders summary badges with correct counts', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /总计/);
      assert.match(html, /严重/);
      assert.match(html, /警告/);
      assert.match(html, /信息/);
      assert.match(html, /已确认/);
      assert.match(html, /已静音/);
    });

    test('renders all alert codes and messages', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /ALERT-001/);
      assert.match(html, /ALERT-002/);
      assert.match(html, /ALERT-003/);
      assert.match(html, /CPU usage exceeded 90%/);
      assert.match(html, /Memory usage warning/);
      assert.match(html, /Disk space notification/);
    });

    test('renders acknowledged badge for acknowledged alerts', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // ALERT-002 is acknowledged
      assert.match(html, /已确认/);
    });

    test('renders muted badge for muted alerts', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // ALERT-003 is muted
      assert.match(html, /已静音/);
    });

    test('shows empty state when no alerts', () => {
      const emptyGov: GovernanceReadModel = {
        alerts: [],
        summary: { total: 0, critical: 0, warning: 0, info: 0, acknowledged: 0, muted: 0 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: emptyGov,
          loadGovernance: async () => emptyGov,
        })
      );
      assert.match(html, /暂无告警/);
    });

    test('displays query key indicators when provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
          timelineQueryKey: 'alertAction',
          ownerQueryKey: 'alertOwner',
          sourceQueryKey: 'alertSource',
        })
      );
      assert.match(html, /alertAction/);
      assert.match(html, /alertOwner/);
      assert.match(html, /alertSource/);
    });

    test('does not render query indicators when keys omitted', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // timelineQueryKey defaults undefined -> not in markup
      // ownerQueryKey defaults undefined -> not in markup
      assert.equal(html.includes('timeline:'), false);
      assert.equal(html.includes('owner:'), false);
    });

    test('renders refresh button', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /刷新/);
    });

    test('renders ActionButton for each alert', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // "确认" button for unacknowledged alerts (ALERT-001, ALERT-003 = 2)
      // "静音" for unmuted (ALERT-001, ALERT-002 = 2)
      // "取消静音" for muted (ALERT-003 = 1)
      const confirmCount = (html.match(/确认/g) || []).length;
      // "静音" appears in "静音" buttons and "已静音" badge text
      assert.ok(confirmCount >= 2, `Expected >= 2 confirm buttons, got ${confirmCount}`);
    });

    test('does not show confirm button for already acknowledged alert', () => {
      const g = gov();
      g.alerts = g.alerts.map((a) => ({ ...a, acknowledged: true }));
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: g,
          loadGovernance: async () => g,
        })
      );
      // All alerts acknowledged → no "确认" action buttons
      const confirmMatches = html.match(/<button[^>]*>确认<\/button>/g);
      assert.equal(confirmMatches, null);
    });

    test('shows source and owner metadata', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /monitoring/);
      assert.match(html, /ops-team/);
    });

    test('applies admin palette styles', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // admin palette uses rgba(15, 23, 42, 0.6) background
      assert.match(html, /rgba\(15, 23, 42/);
    });

    /* ---- FoundationAlertPanelSurface ---- */
    test('Surface: renders with admin preset', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'admin',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /data-component="foundation-alert-panel"/);
    });

    test('Surface: renders with tob preset', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'tob',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /data-component="foundation-alert-panel"/);
      // tob uses cyan-ish palette
      assert.match(html, /rgba\(6, 182, 212/);
    });

    test('Surface: renders with storefront preset', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'storefront',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      assert.match(html, /data-component="foundation-alert-panel"/);
    });

    test('Surface: passes focusAlertCode to filter', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'admin',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
          focusAlertCode: 'ALERT-002',
          focusContext: 'surface-test',
        })
      );
      // Should only render ALERT-002
      assert.match(html, /ALERT-002/);
      assert.equal(html.includes('ALERT-001'), false);
      assert.equal(html.includes('ALERT-003'), false);
    });

    test('Surface: passes query keys through', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'admin',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
          timelineQueryKey: 'customTimeline',
          ownerQueryKey: 'customOwner',
          sourceQueryKey: 'customSource',
        })
      );
      assert.match(html, /customTimeline/);
      assert.match(html, /customOwner/);
      assert.match(html, /customSource/);
    });

    test('Surface: uses default query keys when omitted', () => {
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          panelAccess: pa(),
          themePreset: 'admin',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // Default timelineQueryKey = 'alertAction'
      assert.match(html, /alertAction/);
      // Default ownerQueryKey = 'alertOwner'
      assert.match(html, /alertOwner/);
    });

    test('Surface: passes router/pathname/searchParams', () => {
      const router = { push: () => {}, replace: () => {} };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelSurface, {
          router,
          pathname: '/alerts',
          searchParams: { tenantId: 't1' },
          panelAccess: pa(),
          themePreset: 'admin',
          initialGovernance: gov(),
          loadGovernance: async () => gov(),
        })
      );
      // Should render without crash
      assert.match(html, /data-component="foundation-alert-panel"/);
    });
  });

  /* ---- Theme presets ---- */
  describe('foundationAlertPanelThemePresets', () => {
    test('exports admin, tob, storefront presets', () => {
      assert.ok('admin' in foundationAlertPanelThemePresets);
      assert.ok('tob' in foundationAlertPanelThemePresets);
      assert.ok('storefront' in foundationAlertPanelThemePresets);
    });

    test('each preset has palette and toolbarPalette', () => {
      for (const key of ['admin', 'tob', 'storefront'] as const) {
        const preset = foundationAlertPanelThemePresets[key];
        assert.ok(preset.palette, `${key} should have palette`);
        assert.ok(preset.toolbarPalette, `${key} should have toolbarPalette`);
        assert.ok(preset.palette.background, `${key} palette should have background`);
        assert.ok(preset.palette.text, `${key} palette should have text`);
        assert.ok(preset.toolbarPalette.ackBackground, `${key} toolbar should have ackBackground`);
      }
    });

    test('tob preset has runtime callback colors', () => {
      const tob = foundationAlertPanelThemePresets.tob;
      assert.ok(tob.runtimeCallbackAccentColor);
      assert.ok(tob.runtimeCallbackBorderColor);
    });
  });

  /* ---- Interface types ---- */
  describe('type exports', () => {
    test('FoundationAlertPanelSurface is a function component', () => {
      assert.equal(typeof FoundationAlertPanelSurface, 'function');
    });

    test('FoundationAlertPanelFrame is a function component', () => {
      assert.equal(typeof FoundationAlertPanelFrame, 'function');
    });
  });

  /* ---- Alert severity display ---- */
  describe('severity display', () => {
    test('critical, warning, info severities all render', () => {
      const testGov: GovernanceReadModel = {
        alerts: [
          { code: 'C1', message: 'Critical', severity: 'critical', acknowledged: false, muted: false, source: 's', owner: 'o' },
          { code: 'W1', message: 'Warning', severity: 'warning', acknowledged: false, muted: false, source: 's', owner: 'o' },
          { code: 'I1', message: 'Info', severity: 'info', acknowledged: false, muted: false, source: 's', owner: 'o' },
        ],
        summary: { total: 3, critical: 1, warning: 1, info: 1, acknowledged: 0, muted: 0 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: testGov,
          loadGovernance: async () => testGov,
        })
      );
      assert.match(html, /C1/);
      assert.match(html, /W1/);
      assert.match(html, /I1/);
      // All three should have severity indicator circles (width:8px;height:8px)
      const severityIndicators = (html.match(/width:8px;height:8px/g) || []).length;
      assert.ok(severityIndicators >= 3, `Expected >= 3 severity indicators, got ${severityIndicators}`);
    });
  });

  /* ---- Edge cases ---- */
  describe('edge cases', () => {
    test('alert with empty source/owner does not crash', () => {
      const testGov: GovernanceReadModel = {
        alerts: [
          { code: 'NO-META', message: 'No metadata', severity: 'warning', acknowledged: false, muted: false },
        ],
        summary: { total: 1, critical: 0, warning: 1, info: 0, acknowledged: 0, muted: 0 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: testGov,
          loadGovernance: async () => testGov,
        })
      );
      assert.match(html, /NO-META/);
      assert.match(html, /No metadata/);
    });

    test('missing severity defaults to info color scheme', () => {
      const testGov: GovernanceReadModel = {
        alerts: [
          { code: 'NO-SEV', message: 'No severity', acknowledged: false, muted: false },
        ],
        summary: { total: 1, critical: 0, warning: 0, info: 1, acknowledged: 0, muted: 0 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: testGov,
          loadGovernance: async () => testGov,
        })
      );
      assert.match(html, /NO-SEV/);
    });

    test('single alert renders without grid issues', () => {
      const testGov: GovernanceReadModel = {
        alerts: [
          { code: 'SINGLE', message: 'Just one', severity: 'critical', acknowledged: true, muted: true, source: 'x', owner: 'y' },
        ],
        summary: { total: 1, critical: 1, warning: 0, info: 0, acknowledged: 1, muted: 1 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: testGov,
          loadGovernance: async () => testGov,
        })
      );
      assert.match(html, /SINGLE/);
      assert.match(html, /已确认/);
      assert.match(html, /已静音/);
    });

    test('zero-summary renders all zero badges', () => {
      const zeroGov: GovernanceReadModel = {
        alerts: [],
        summary: { total: 0, critical: 0, warning: 0, info: 0, acknowledged: 0, muted: 0 },
      };
      const html = renderToStaticMarkup(
        React.createElement(FoundationAlertPanelFrame, {
          panelAccess: pa(),
          palette: theme.palette,
          toolbarPalette: theme.toolbarPalette,
          initialGovernance: zeroGov,
          loadGovernance: async () => zeroGov,
        })
      );
      // Should show "暂无告警"
      assert.match(html, /暂无告警/);
      // But summary badges still show 0 values
      assert.match(html, /0/);
    });
  });
});
