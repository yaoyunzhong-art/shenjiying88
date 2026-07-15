import { render, screen } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('../market-bootstrap', () => ({
  getStorePortal: jest.fn(() => Promise.resolve({
    marketCode: 'CN',
    tenantCode: 't001',
    brandCode: 'b001',
    storeCode: 's001',
    storeName: '神机营旗舰店',
    primaryDomain: 'store.shenjiying.com',
    supportedSurfaces: ['Web', 'H5', 'MiniApp'],
    supportedLanguages: ['zh-CN', 'en'],
  })),
  getStorefrontConsumerSnapshot: jest.fn(() => Promise.resolve({
    deliveryMode: 'edge',
    scope: {
      scopePath: '/CN/t001/b001/s001',
      mismatchStrategy: 'strict',
    },
    consumerDescriptor: {
      responsibility: 'Store Website',
      recommendedSequence: ['auth', 'sso', 'cms'],
      highRiskEntrypoints: ['payment'],
    },
    degradation: {
      featureFlagFallback: 'configurable',
    },
    challenge: {
      enforcement: 'route-guard',
      notes: ['multi-currency', 'tax-display'],
    },
    governance: {
      alerts: [{ code: 'GOV-001' }, { code: 'GOV-002' }],
      summary: {
        approvalsPending: 3,
        highRiskAudits: 1,
        degradedSignals: 2,
        attentionRecoveryPlans: 1,
        staleDrills: 0,
      },
    },
    portal: {
      marketCode: 'CN',
      tenantCode: 't001',
      brandCode: 'b001',
      storeCode: 's001',
      storeName: '神机营旗舰店',
      primaryDomain: 'store.shenjiying.com',
      supportedSurfaces: ['Web', 'H5'],
      supportedLanguages: ['zh-CN'],
    },
  })),
}));

jest.mock('../store-scope', () => ({
  resolveStoreScope: jest.fn(() => ({
    marketCode: 'CN',
    tenantCode: 't001',
    brandCode: 'b001',
    storeCode: 's001',
  })),
}));

jest.mock('../components/governance-linked-overview', () => ({
  GovernanceLinkedSection: () => <div data-testid="governance-linked">Governance</div>,
}));

jest.mock('../components/runtime-governance-panel', () => ({
  RuntimeGovernancePanel: () => <div data-testid="runtime-panel">Runtime</div>,
}));

jest.mock('../components/store-showcase-client', () => ({
  StoreShowcaseClient: () => <div data-testid="store-showcase">Showcase</div>,
}));

jest.mock('@m5/ui', () => ({
  PortalConsumerGovernanceSection: ({
    deliverySummary,
    responsibility,
    detailLines,
    governanceCodes,
    governanceSummary,
    linkedOverview,
    runtimePanel,
  }: {
    deliverySummary: string;
    responsibility: string;
    detailLines: string[];
    governanceCodes: string[];
    governanceSummary: string;
    linkedOverview: React.ReactNode;
    runtimePanel: React.ReactNode;
  }) => (
    <div data-testid="portal-governance">
      <div data-testid="delivery">{deliverySummary}</div>
      <div data-testid="responsibility">{responsibility}</div>
      <div data-testid="detail-lines">{detailLines.join(' | ')}</div>
      <div data-testid="codes">{governanceCodes.join(', ')}</div>
      <div data-testid="summary-text">{governanceSummary}</div>
      {linkedOverview}
      {runtimePanel}
    </div>
  ),
}));

describe('StoreSitePage (dynamic [...storeScope])', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with 3-element storeScope (standard portal)', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001'] }) });
    const { container } = render(PageComponent);
    expect(container.querySelector('h1')).toHaveTextContent('ToC 官网');
  });

  it('renders portal info for 3-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001'] }) });
    render(PageComponent);
    expect(screen.getByText(/CN \/ t001 \/ b001/)).toBeInTheDocument();
  });

  it('displays store name in 3-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001'] }) });
    render(PageComponent);
    expect(screen.getByText(/神机营旗舰店/)).toBeInTheDocument();
  });

  it('renders store showcase client for 3-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001'] }) });
    render(PageComponent);
    expect(screen.getByTestId('store-showcase')).toBeInTheDocument();
  });

  it('renders primary domain info for 3-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001'] }) });
    render(PageComponent);
    expect(screen.getByText('store.shenjiying.com')).toBeInTheDocument();
  });
});

describe('StoreSitePage - 4-element scope (full portal)', () => {
  it('renders portal governance section for 4-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 's001'] }) });
    render(PageComponent);
    expect(screen.getByTestId('portal-governance')).toBeInTheDocument();
  });

  it('shows delivery mode for 4-element scope', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 's001'] }) });
    render(PageComponent);
    expect(screen.getByTestId('delivery')).toHaveTextContent('edge');
  });

  it('shows governance linked section', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 's001'] }) });
    render(PageComponent);
    expect(screen.getByTestId('governance-linked')).toBeInTheDocument();
  });

  it('shows runtime panel', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 's001'] }) });
    render(PageComponent);
    expect(screen.getByTestId('runtime-panel')).toBeInTheDocument();
  });

  it('displays supported surfaces in full portal', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 's001'] }) });
    render(PageComponent);
    expect(screen.getByText(/Web/)).toBeInTheDocument();
  });
});

describe('StoreSitePage - H5 scope (ending with h5)', () => {
  it('renders h5 mode when last segment is "h5" with 3 segments', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'h5'] }) });
    render(PageComponent);
    expect(screen.getByText('门店 H5 触达中台')).toBeInTheDocument();
  });

  it('renders default touchpoints for short h5 path', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'h5'] }) });
    render(PageComponent);
    expect(screen.getByText('优惠券领取页')).toBeInTheDocument();
  });

  it('renders consumer governance for 4-segment h5 path', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 'h5'] }) });
    render(PageComponent);
    expect(screen.getByTestId('portal-governance')).toBeInTheDocument();
  });

  it('renders market touchpoints for 4-segment h5 path', async () => {
    const PageComponent = await Page({ params: Promise.resolve({ storeScope: ['CN', 't001', 'b001', 'h5'] }) });
    render(PageComponent);
    expect(screen.getByText('市场化活动落地页')).toBeInTheDocument();
  });
});
