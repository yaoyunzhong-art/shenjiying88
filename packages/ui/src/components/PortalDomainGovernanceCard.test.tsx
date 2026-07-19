import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PortalDomainGovernanceCard } = require('./PortalDomainGovernanceCard');
const {
  domainGovernanceDisplayCopy,
  formatDomainGovernanceStatusSummary,
  resolveDomainGovernanceDisplayPreset,
} = require('@m5/types');

describe('PortalDomainGovernanceCard', () => {
  const model = {
    eyebrow: domainGovernanceDisplayCopy.eyebrow,
    subtitle: domainGovernanceDisplayCopy.subtitle,
    title: '域名来源 custom / 可直接补选 1',
    statusLabel: '待治理',
    summaryText: '缺主 scope 2 / 活跃未设主域名 3',
    renderSections: [
      {
        title: domainGovernanceDisplayCopy.sectionTitles.summary,
        items: [
          {
            label: domainGovernanceDisplayCopy.itemLabels.source,
            value: '域名来源 custom / 可直接补选 1',
            tone: 'primary',
          },
          {
            label: domainGovernanceDisplayCopy.itemLabels.status,
            value: '待治理',
            tone: 'accent',
          },
          {
            label: domainGovernanceDisplayCopy.itemLabels.summary,
            value: '缺主 scope 2 / 活跃未设主域名 3',
            tone: 'summary',
          },
          {
            label: domainGovernanceDisplayCopy.itemLabels.statusSummary,
            value: formatDomainGovernanceStatusSummary({
              requiresAttention: true,
              totalMissingPrimaryScopes: 2,
              totalActiveWithoutPrimaryDomains: 3,
              recommendedReadyScopes: 1,
              lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
              currentScopes: [],
              missingPrimaryScopes: [],
              activeWithoutPrimaryDomains: [],
            }),
            tone: 'summary',
          },
        ],
      },
      {
        title: domainGovernanceDisplayCopy.sectionTitles.focusScope,
        items: [
          {
            label: '焦点 scope STORE / tenant-demo / brand-demo / store-001',
            value: '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
            tone: 'accent',
          },
        ],
      },
      {
        title: domainGovernanceDisplayCopy.sectionTitles.recommendation,
        items: [
          {
            label: domainGovernanceDisplayCopy.itemLabels.recommendation,
            value: '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
            tone: 'summary',
          },
        ],
      },
      {
        title: domainGovernanceDisplayCopy.sectionTitles.timeline,
        items: [
          {
            label: domainGovernanceDisplayCopy.itemLabels.lastEvaluated,
            value: '最近评估 2026-07-18T00:00:00.000Z',
            tone: 'summary',
          },
        ],
      },
    ],
    workspaceLabel: domainGovernanceDisplayCopy.workspaceLabel,
    workspaceHref:
      '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    ctaLabel: domainGovernanceDisplayCopy.ctaLabel,
    requiresAttention: true,
  };

  test('renders richer section contract', () => {
    const html = renderToStaticMarkup(React.createElement(PortalDomainGovernanceCard, { model }));

    assert.ok(html.includes(model.eyebrow), 'should render header eyebrow');
    assert.ok(html.includes(model.title), 'should render header title slot');
    assert.ok(html.includes(model.statusLabel), 'should render status badge');
    assert.ok(html.includes(domainGovernanceDisplayCopy.sectionTitles.summary), 'should render summary section title');
    assert.ok(html.includes(model.renderSections[1].title), 'should render focus scope title');
    assert.ok(html.includes(model.renderSections[1].items[0].value), 'should render focus scope value');
    assert.ok(html.includes(model.renderSections[2].items[0].value), 'should render recommendation value');
    assert.ok(html.includes(model.workspaceLabel), 'should render workspace label');
    assert.ok(html.includes('href="/saas/domains?tenantId=tenant-demo'), 'should render workspace href');
    assert.ok(html.includes(model.ctaLabel), 'should render CTA');
  });

  test('supports palette overrides', () => {
    const preset = resolveDomainGovernanceDisplayPreset('TOB_BRAND', true);
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model,
        preset,
      }),
    );

    assert.ok(html.includes(preset.accentColor), 'should use accent color');
    assert.ok(html.includes(preset.titleColor), 'should use title color');
    assert.ok(html.includes(preset.summaryColor), 'should use summary color');
    assert.ok(html.includes(preset.buttonTextColor), 'should use button text color');
  });
});
