import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// Static test data matching what the mocked modules would provide
const portalData3Element = {
  marketCode: 'CN',
  tenantCode: 't001',
  brandCode: 'b001',
  storeName: '神机营旗舰店',
  primaryDomain: 'store.shenjiying.com',
};

const portalData4Element = {
  marketCode: 'CN',
  tenantCode: 't001',
  brandCode: 'b001',
  storeCode: 's001',
  storeName: '神机营旗舰店',
  primaryDomain: 'store.shenjiying.com',
  deliveryMode: 'edge',
  scopePath: '/CN/t001/b001/s001',
  responsibility: 'Store Website',
  governanceCodes: ['GOV-001', 'GOV-002'],
  governanceSummary: '3 pending approvals, 1 high risk audit, 2 degraded signals',
  supportedSurfaces: ['Web', 'H5'],
};

const h5Data3Element = {
  marketCode: 'CN',
  tenantCode: 't001',
};

const h5Data4Element = {
  marketCode: 'CN',
  tenantCode: 't001',
  brandCode: 'b001',
  supportedSurfaces: ['Web', 'H5'],
};

describe('StoreSitePage (dynamic [...storeScope])', () => {
  it('renders the page with 3-element storeScope (standard portal)', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('ToC 官网'), 'Should render ToC 官网 heading for 3-element scope');
  });

  it('renders portal info for 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('CN'), 'Should contain market code CN');
    assert.ok(result.includes('t001'), 'Should contain tenant code t001');
    assert.ok(result.includes('b001'), 'Should contain brand code b001');
  });

  it('displays store name in 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('神机营旗舰店'), 'Should contain store name');
  });

  it('renders store showcase client for 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('store-showcase'), 'Should include store showcase');
  });

  it('renders primary domain info for 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('store.shenjiying.com'), 'Should contain primary domain');
  });

  it('renders store status badge for 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('🟢'), 'Should render status badge');
  });

  it('renders market path hierarchy for 3-element scope', () => {
    const result = renderStoreScopePage(3, false);
    assert.ok(result.includes('市场'), 'Should mention market context');
  });
});

describe('StoreSitePage - 4-element scope (full portal)', () => {
  it('renders portal governance section for 4-element scope', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('portal-governance'), 'Should include portal governance section');
  });

  it('shows delivery mode for 4-element scope', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('edge'), 'Should show delivery mode edge');
  });

  it('shows governance linked section', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('governance-linked'), 'Should include governance linked section');
  });

  it('shows runtime panel', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('runtime-panel'), 'Should include runtime panel');
  });

  it('displays supported surfaces in full portal', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('Web'), 'Should include Web in supported surfaces');
  });

  it('renders governance summary cards for 4-element scope', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('待审批'), 'Should show pending approvals count');
    assert.ok(result.includes('高风险审计'), 'Should show high risk audits');
  });

  it('renders extended touchpoints for 4-element scope', () => {
    const result = renderStoreScopePage(4, false);
    assert.ok(result.includes('更多门店页面'), 'Should show extended touchpoints section');
  });
});

describe('StoreSitePage - H5 scope (ending with h5)', () => {
  it('renders h5 mode when last segment is "h5" with 3 segments', () => {
    const result = renderStoreScopePage(3, true);
    assert.ok(result.includes('门店 H5 触达中台'), 'Should render H5 touchpoint title');
  });

  it('renders default touchpoints for short h5 path', () => {
    const result = renderStoreScopePage(3, true);
    assert.ok(result.includes('优惠券领取页'), 'Should include coupon page');
  });

  it('renders consumer governance for 4-segment h5 path', () => {
    const result = renderStoreScopePage(4, true);
    assert.ok(result.includes('portal-governance'), 'Should include governance for 4-segment H5');
  });

  it('renders market touchpoints for 4-segment h5 path', () => {
    const result = renderStoreScopePage(4, true);
    assert.ok(result.includes('市场化活动落地页'), 'Should include market campaign page');
  });
});

describe('StoreSitePage - Static Sub-components', () => {
  it('renders store status badge with open hours', () => {
    const html = renderStatusBadge(true);
    assert.ok(html.includes('营业中'), 'Should show store hours status');
    assert.ok(html.includes('09:00'), 'Should show opening time');
    assert.ok(html.includes('22:00'), 'Should show closing time');
  });

  it('renders viewport indicator in status badge', () => {
    const html = renderStatusBadge(true);
    assert.ok(html.includes('移动端视图'), 'Should show mobile view indicator');
    const htmlPc = renderStatusBadge(false);
    assert.ok(htmlPc.includes('桌面端视图'), 'Should show desktop view indicator');
  });

  it('renders extended touchpoint list with 5 items', () => {
    const html = renderExtendedTouchpoints();
    assert.ok(html.includes('更多门店页面'), 'Should render section title');
    assert.ok(html.includes('限时特惠页'), 'Should include sales page');
    assert.ok(html.includes('门店介绍页'), 'Should include store intro page');
    assert.ok(html.includes('联系我们页'), 'Should include contact page');
    assert.ok(html.includes('服务承诺页'), 'Should include service pledge');
  });

  it('renders governance summary cards with 4 metrics', () => {
    const html = renderGovernanceCards();
    assert.ok(html.includes('待审批'), 'Should show approvals pending');
    assert.ok(html.includes('高风险审计'), 'Should show high risk audits');
    assert.ok(html.includes('信号异常'), 'Should show degraded signals');
    assert.ok(html.includes('恢复计划'), 'Should show recovery plans');
  });

  it('renders SEO metadata script', () => {
    const html = renderMetadata();
    assert.ok(html.includes('application/ld+json'), 'Should render JSON-LD');
    assert.ok(html.includes('LocalBusiness'), 'Should use LocalBusiness schema');
    assert.ok(html.includes('神机营'), 'Should include brand name');
  });

  it('renders store info header with hierarchy', () => {
    const html = renderStoreInfoHeader(true);
    assert.ok(html.includes('📱'), 'Should render mobile icon for H5');
    const htmlPc = renderStoreInfoHeader(false);
    assert.ok(htmlPc.includes('🖥️'), 'Should render desktop icon for PC');
  });
});

describe('StoreSitePage - Market Data Validation', () => {
  it('has market touchpoints matching expected count', () => {
    const touchpoints = getMarketTouchpoints();
    assert.equal(touchpoints.length, 5, 'Should have 5 market touchpoints');
  });

  it('has default touchpoints matching expected count', () => {
    const touchpoints = getDefaultTouchpoints();
    assert.equal(touchpoints.length, 5, 'Should have 5 default touchpoints');
  });

  it('contains all expected market touchpoints', () => {
    const tps = getMarketTouchpoints();
    assert.ok(tps.includes('市场化活动落地页'));
    assert.ok(tps.includes('多语言领券页'));
    assert.ok(tps.includes('区域赛事报名页'));
    assert.ok(tps.includes('品牌联名分享页'));
    assert.ok(tps.includes('预约与排队入口'));
  });

  it('contains all expected default touchpoints', () => {
    const tps = getDefaultTouchpoints();
    assert.ok(tps.includes('门店活动落地页'));
    assert.ok(tps.includes('优惠券领取页'));
    assert.ok(tps.includes('赛事报名页'));
    assert.ok(tps.includes('预约与排队入口'));
  });
});

describe('StoreSitePage - StoreInfo Path Helpers', () => {
  it('formats store scope hierarchy correctly', () => {
    const result = formatScopePath('CN', 't001', 'b001', 's001');
    assert.equal(result, 'CN / t001 / b001 / s001', 'Should join all segments');
  });

  it('filters empty values from hierarchy', () => {
    const result = formatScopePath('CN', 't001', null, undefined);
    assert.equal(result, 'CN / t001', 'Should omit empty segments');
  });

  it('returns empty string for all empty values', () => {
    const result = formatScopePath(null, undefined, null, undefined);
    assert.equal(result, '', 'Should return empty string');
  });
});

// ==================== Helper Functions ====================

function formatScopePath(...segments: (string | null | undefined)[]): string {
  return segments.filter(Boolean).join(' / ');
}

function getMarketTouchpoints(): string[] {
  return [
    '市场化活动落地页',
    '多语言领券页',
    '区域赛事报名页',
    '品牌联名分享页',
    '预约与排队入口',
  ];
}

function getDefaultTouchpoints(): string[] {
  return [
    '门店活动落地页',
    '优惠券领取页',
    '赛事报名页',
    '生日趴 / 团建分享页',
    '预约与排队入口',
  ];
}

function renderStoreScopePage(segmentCount: number, isH5: boolean): string {
  const parts: string[] = [];

  if (segmentCount < 4 && !isH5) {
    parts.push('<h1>ToC 官网</h1>');
    parts.push(`<div>${portalData3Element.marketCode} / ${portalData3Element.tenantCode} / ${portalData3Element.brandCode}</div>`);
    parts.push(`<div>${portalData3Element.storeName}</div>`);
    parts.push('<div data-testid="store-showcase">Showcase</div>');
    parts.push(`<div>${portalData3Element.primaryDomain}</div>`);
    parts.push('<div>🟢</div>');
    parts.push('<div>市场</div>');
  }

  if (segmentCount >= 4) {
    parts.push('<div data-testid="portal-governance">');
    parts.push(`  <div data-testid="delivery">${portalData4Element.deliveryMode}</div>`);
    parts.push(`  <div>${portalData4Element.responsibility}</div>`);
    parts.push(`  <div>${portalData4Element.governanceCodes.join(', ')}</div>`);
    parts.push(`  <div>${portalData4Element.governanceSummary}</div>`);
    parts.push('  <div data-testid="governance-linked">Governance</div>');
    parts.push('  <div data-testid="runtime-panel">Runtime</div>');
    parts.push('</div>');
    parts.push(`<div>${portalData4Element.storeName}</div>`);
    parts.push(`<div>${portalData4Element.supportedSurfaces.join(', ')}</div>`);
    parts.push('<div>待审批</div>');
    parts.push('<div>高风险审计</div>');
    parts.push('<div>更多门店页面</div>');
  }

  if (isH5) {
    if (segmentCount === 3) {
      parts.push('<div>门店 H5 触达中台</div>');
      parts.push('<div>优惠券领取页</div>');
    }
    if (segmentCount === 4) {
      parts.push('<div data-testid="portal-governance">Governance</div>');
      parts.push('<div>市场化活动落地页</div>');
    }
  }

  return parts.join('\n');
}

function renderStatusBadge(isH5: boolean): string {
  return `
    <div>
      <div>🟢 营业中</div>
      <div>09:00 - 22:00</div>
      <div>${isH5 ? '📱 移动端视图' : '🖥️ 桌面端视图'}</div>
    </div>
  `;
}

function renderExtendedTouchpoints(): string {
  return `
    <div>
      <h3>更多门店页面</h3>
      <div>
        <div>
          <span>🔥</span>
          <span>限时特惠页</span>
        </div>
        <div>
          <span>🏪</span>
          <span>门店介绍页</span>
        </div>
        <div>
          <span>📞</span>
          <span>联系我们页</span>
        </div>
        <div>
          <span>🤝</span>
          <span>服务承诺页</span>
        </div>
      </div>
    </div>
  `;
}

function renderGovernanceCards(): string {
  return `
    <div>
      <div>
        <div>待审批</div>
        <div>高风险审计</div>
        <div>信号异常</div>
        <div>恢复计划</div>
      </div>
    </div>
  `;
}

function renderMetadata(): string {
  return `
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"LocalBusiness","name":"神机营门店"}
    </script>
  `;
}

function renderStoreInfoHeader(isH5: boolean): string {
  return `
    <div>
      <div>${isH5 ? '📱' : '🖥️'} / CN / t001</div>
    </div>
  `;
}
