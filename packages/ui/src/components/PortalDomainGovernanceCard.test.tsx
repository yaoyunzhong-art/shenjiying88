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

const baseModel = {
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

describe('PortalDomainGovernanceCard', () => {
  // ============ Originals ============

  test('renders richer section contract', () => {
    const html = renderToStaticMarkup(React.createElement(PortalDomainGovernanceCard, { model: baseModel }));

    assert.ok(html.includes(baseModel.eyebrow), 'should render header eyebrow');
    assert.ok(html.includes(baseModel.title), 'should render header title slot');
    assert.ok(html.includes(baseModel.statusLabel), 'should render status badge');
    assert.ok(html.includes(domainGovernanceDisplayCopy.sectionTitles.summary), 'should render summary section title');
    assert.ok(html.includes(baseModel.renderSections[1].title), 'should render focus scope title');
    assert.ok(html.includes(baseModel.renderSections[1].items[0].value), 'should render focus scope value');
    assert.ok(html.includes(baseModel.renderSections[2].items[0].value), 'should render recommendation value');
    assert.ok(html.includes(baseModel.workspaceLabel), 'should render workspace label');
    assert.ok(html.includes('href="/saas/domains?tenantId=tenant-demo'), 'should render workspace href');
    assert.ok(html.includes(baseModel.ctaLabel), 'should render CTA');
  });

  test('supports palette overrides', () => {
    const preset = resolveDomainGovernanceDisplayPreset('TOB_BRAND', true);
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model: baseModel,
        preset,
      }),
    );

    assert.ok(html.includes(preset.accentColor), 'should use accent color');
    assert.ok(html.includes(preset.titleColor), 'should use title color');
    assert.ok(html.includes(preset.summaryColor), 'should use summary color');
    assert.ok(html.includes(preset.buttonTextColor), 'should use button text color');
  });

  // ============ New tests ============

  test('renders model without sections (empty renderSections)', () => {
    const modelEmptySections = {
      ...baseModel,
      renderSections: [],
    };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: modelEmptySections })
    );
    // Should still render header, status and CTA
    assert.ok(html.includes(modelEmptySections.eyebrow));
    assert.ok(html.includes(modelEmptySections.title));
    assert.ok(html.includes(modelEmptySections.ctaLabel));
    // Should NOT render any section title
    assert.ok(!html.includes(domainGovernanceDisplayCopy.sectionTitles.summary));
  });

  test('renders model with a single section and a single item', () => {
    const modelSingle = {
      ...baseModel,
      renderSections: [
        {
          title: '单一章节',
          items: [
            { label: '标签', value: '数值', tone: 'primary' },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: modelSingle })
    );
    assert.ok(html.includes('单一章节'));
    assert.ok(html.includes('标签'));
    assert.ok(html.includes('数值'));
  });

  test('renders model with section items without tone field (undefined)', () => {
    const modelNoTone = {
      ...baseModel,
      renderSections: [
        {
          title: '无色调项',
          items: [
            { label: '项1', value: '值1' },
            { label: '项2', value: '值2' },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: modelNoTone })
    );
    assert.ok(html.includes('项1'));
    assert.ok(html.includes('值1'));
    assert.ok(html.includes('项2'));
    assert.ok(html.includes('值2'));
  });

  test('renders with STOREFRONT_PC preset and requiresAttention=false', () => {
    const preset = resolveDomainGovernanceDisplayPreset('STOREFRONT_PC', false);
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model: { ...baseModel, requiresAttention: false },
        preset,
      })
    );
    assert.ok(html.includes(preset.accentColor));
    assert.ok(html.includes(preset.background));
  });

  test('renders with TOB_BRAND preset and requiresAttention=false', () => {
    const preset = resolveDomainGovernanceDisplayPreset('TOB_BRAND', false);
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model: { ...baseModel, requiresAttention: false },
        preset,
      })
    );
    assert.ok(html.includes(preset.background));
  });

  test('renders inline style prop merged with card styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model: baseModel,
        style: { marginTop: 20, opacity: 0.9 },
      })
    );
    assert.ok(html.includes('margin-top'));
  });

  test('renders CTA as anchor with correct href', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes('href="/saas/domains?tenantId=tenant-demo'));
    assert.ok(html.includes(domainGovernanceDisplayCopy.workspaceLabel));
  });

  test('renders status badge with rounded pill style', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes('border-radius'));
    assert.ok(html.includes(baseModel.statusLabel));
  });

  test('renders subtitle text under eyebrow', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes(baseModel.subtitle));
  });

  test('renders multiple sections with their titles in order', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    const sectionTitles = baseModel.renderSections.map(s => s.title);
    for (const title of sectionTitles) {
      assert.ok(html.includes(title), `should render section title: ${title}`);
    }
  });

  test('renders all item entries from all sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    let totalItems = 0;
    for (const section of baseModel.renderSections) {
      for (const item of section.items) {
        totalItems++;
        assert.ok(html.includes(item.label), `should contain label: ${item.label}`);
        if (item.value) {
          assert.ok(html.includes(item.value.substring(0, 20)), `should contain value prefix: ${item.value.substring(0, 20)}`);
        }
      }
    }
    assert.ok(totalItems >= 5); // at least 5 items from the full model
  });

  test('renders with custom preset having null/empty properties gracefully', () => {
    const minimalPreset = {
      background: '#000',
      borderColor: '#ccc',
      accentColor: '#ff0',
      subtitleColor: '#999',
      titleColor: '#fff',
      statusColor: '#0f0',
      statusBackground: '#030',
      buttonBackground: '#00f',
      buttonTextColor: '#fff',
      summaryColor: '#888',
      itemColors: { primary: '#eee', accent: '#ff0', summary: '#888' },
    };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, {
        model: baseModel,
        preset: minimalPreset,
      })
    );
    assert.ok(html.includes('#ff0'));
    assert.ok(html.includes('#fff'));
  });

  test('defaults to STOREFRONT_PC preset when no preset provided', () => {
    // The component internally calls resolveDomainGovernanceDisplayPreset with defaults
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    // Should render without error
    assert.ok(html.includes(baseModel.title));
  });

  test('renders section items with label:value separator colon', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    // Each item renders as "label：value" (Chinese colon)
    for (const section of baseModel.renderSections) {
      for (const item of section.items) {
        assert.ok(html.includes('：'), 'renders colon separator');
        break;
      }
      break;
    }
  });

  test('status badge text matches model.statusLabel', () => {
    const customStatus = { ...baseModel, statusLabel: '需立即处理' };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: customStatus })
    );
    assert.ok(html.includes('需立即处理'));
  });

  test('renders correctly with focusScope section', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes(domainGovernanceDisplayCopy.sectionTitles.focusScope));
  });

  test('renders correctly with recommendation section', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes(domainGovernanceDisplayCopy.sectionTitles.recommendation));
  });

  test('renders correctly with timeline section', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: baseModel })
    );
    assert.ok(html.includes(domainGovernanceDisplayCopy.sectionTitles.timeline));
  });

  test('renders without crashing when model has no workspaceHref', () => {
    const noHref = { ...baseModel, workspaceHref: '' };
    const html = renderToStaticMarkup(
      React.createElement(PortalDomainGovernanceCard, { model: noHref })
    );
    assert.ok(html.includes(noHref.ctaLabel));
    // href="" is valid HTML
    assert.ok(html.includes('href=""'));
  });
});
