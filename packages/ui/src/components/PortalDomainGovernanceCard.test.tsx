import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PortalDomainGovernanceCard } = require('./PortalDomainGovernanceCard');

describe('PortalDomainGovernanceCard', () => {
  const model = {
    title: '域名治理工作台',
    subtitle: '统一域名缺口、推荐补选和治理入口展示',
    statusLabel: '待治理',
    countsSummary: '缺主 scope 2 / 活跃未设主域名 3',
    sourceSummary: '域名来源 custom / 可直接补选 1',
    statusSummary: '治理状态：待治理 / 可直接补选 1',
    compactSummary: '缺主 scope 2 / 域名来源 custom',
    workspaceSummary:
      '治理入口 /saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    workspaceHref:
      '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    ctaLabel: '打开域名治理工作台',
    focusScopeLabel: '焦点 scope STORE / tenant-demo / brand-demo / store-001',
    focusScopeSummary: '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
    recommendationSummary: '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
    lastEvaluatedSummary: '最近评估 2026-07-18T00:00:00.000Z',
    detailLines: [
      '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
      '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
      '最近评估 2026-07-18T00:00:00.000Z',
    ],
    requiresAttention: true,
  };

  test('renders richer section contract', () => {
    const html = renderToStaticMarkup(React.createElement(PortalDomainGovernanceCard, { model }));

    assert.ok(html.includes(model.title), 'should render title');
    assert.ok(html.includes(model.subtitle), 'should render subtitle');
    assert.ok(html.includes(model.statusLabel), 'should render status badge');
    assert.ok(html.includes(model.sourceSummary), 'should render source summary');
    assert.ok(html.includes(model.countsSummary), 'should render counts summary');
    assert.ok(html.includes(model.focusScopeSummary), 'should render focus scope summary');
    assert.ok(html.includes(model.recommendationSummary), 'should render recommendation summary');
    assert.ok(html.includes(model.lastEvaluatedSummary), 'should render evaluated summary');
    assert.ok(html.includes(model.workspaceHref), 'should render workspace href');
    assert.ok(html.includes(model.ctaLabel), 'should render CTA');
  });

  test('supports palette overrides', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model,
        accentColor: '#f0abfc',
        titleColor: '#f5f3ff',
        summaryColor: '#ddd6fe',
        buttonBackground: '#f0abfc',
        buttonTextColor: '#3b0764',
      }),
    );

    assert.ok(html.includes('#f0abfc'), 'should use accent color');
    assert.ok(html.includes('#f5f3ff'), 'should use title color');
    assert.ok(html.includes('#ddd6fe'), 'should use summary color');
    assert.ok(html.includes('#3b0764'), 'should use button text color');
  });
});
