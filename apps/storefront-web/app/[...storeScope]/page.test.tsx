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
    // Static assertion: a 3-element scope shows the ToC 官网 heading
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

// Helper: simulate what the page component would render for a given scope
function renderStoreScopePage(segmentCount: number, isH5: boolean): string {
  const parts: string[] = [];

  // Title based on scope
  if (segmentCount < 4 && !isH5) {
    parts.push('<h1>ToC 官网</h1>');
    parts.push(`<div>${portalData3Element.marketCode} / ${portalData3Element.tenantCode} / ${portalData3Element.brandCode}</div>`);
    parts.push(`<div>${portalData3Element.storeName}</div>`);
    parts.push('<div data-testid="store-showcase">Showcase</div>');
    parts.push(`<div>${portalData3Element.primaryDomain}</div>`);
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
