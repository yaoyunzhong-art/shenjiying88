import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PortalDomainGovernanceCard } = require('./PortalDomainGovernanceCard');
const { resolveDomainGovernanceDisplayPreset } = require('@m5/types');

describe('PortalDomainGovernanceCard', () => {
  const model = {
    headerSection: {
      eyebrow: '域名治理工作台',
      subtitle: '统一域名缺口、推荐补选和治理入口展示',
      titleSlot: {
        key: 'source-summary',
        label: '域名来源',
        value: '域名来源 custom / 可直接补选 1',
        tone: 'primary',
      },
      statusBadge: {
        key: 'status-badge',
        label: '治理状态',
        value: '待治理',
        tone: 'accent',
      },
      summarySlots: [
        {
          key: 'counts-summary',
          label: '治理概览',
          value: '缺主 scope 2 / 活跃未设主域名 3',
          tone: 'summary',
        },
        {
          key: 'status-summary',
          label: '状态摘要',
          value: '治理状态：待治理 / 可直接补选 1',
          tone: 'summary',
        },
      ],
    },
    detailGroups: [
      {
        key: 'focus-scope',
        title: '焦点 scope',
        slots: [
          {
            key: 'focus-scope-summary',
            label: '焦点 scope STORE / tenant-demo / brand-demo / store-001',
            value: '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
            tone: 'accent',
          },
        ],
      },
      {
        key: 'recommendation',
        title: '推荐补选',
        slots: [
          {
            key: 'recommendation-summary',
            label: '推荐主域名',
            value: '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
            tone: 'summary',
          },
        ],
      },
      {
        key: 'timeline',
        title: '评估时间',
        slots: [
          {
            key: 'last-evaluated-summary',
            label: '最近评估',
            value: '最近评估 2026-07-18T00:00:00.000Z',
            tone: 'summary',
          },
        ],
      },
    ],
    footerSection: {
      workspaceSlot: {
        key: 'workspace-entry',
        label: '治理入口',
        value:
          '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
        tone: 'accent',
      },
      ctaLabel: '打开域名治理工作台',
    },
    requiresAttention: true,
  };

  test('renders richer section contract', () => {
    const html = renderToStaticMarkup(React.createElement(PortalDomainGovernanceCard, { model }));

    assert.ok(html.includes(model.headerSection.eyebrow), 'should render header eyebrow');
    assert.ok(html.includes(model.headerSection.titleSlot.value), 'should render header title slot');
    assert.ok(html.includes(model.headerSection.statusBadge.value), 'should render status badge');
    assert.ok(html.includes('治理概览'), 'should render summary section title');
    assert.ok(html.includes(model.detailGroups[0].title), 'should render focus scope title');
    assert.ok(html.includes(model.detailGroups[0].slots[0].value), 'should render focus scope value');
    assert.ok(html.includes(model.detailGroups[1].slots[0].value), 'should render recommendation value');
    assert.ok(html.includes(model.footerSection.workspaceSlot.label), 'should render workspace label');
    assert.ok(html.includes('href="/saas/domains?tenantId=tenant-demo'), 'should render workspace href');
    assert.ok(html.includes(model.footerSection.ctaLabel), 'should render CTA');
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
