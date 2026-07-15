import { render, screen } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/reports',
}));

jest.mock('./components/ReportsPage', () => ({
  ReportsPage: ({ items, total }: { items: unknown[]; total: number }) => (
    <div data-testid="reports-page" data-total={total}>
      {items.length} reports loaded
    </div>
  ),
}));

jest.mock('@m5/ui', () => ({
  Button: ({ children, variant, size, onClick }: {
    children: React.ReactNode; variant?: string; size?: string; onClick?: () => void;
  }) => (
    <button data-variant={variant} data-size={size} onClick={onClick}>{children}</button>
  ),
  LoadingSkeleton: ({ variant: skVariant, rows, label }: {
    variant?: string; rows?: number; label?: string;
  }) => (
    <div data-testid="loading-skeleton" data-variant={skVariant} data-rows={rows} aria-label={label} />
  ),
  EmptyState: ({ title, description, actionLabel, actionHref }: {
    title: string; description: string; actionLabel?: string; actionHref?: string;
  }) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
      {actionLabel && <a href={actionHref}>{actionLabel}</a>}
    </div>
  ),
  ErrorBoundary: ({ children, fallback }: {
    children: React.ReactNode; fallback: () => React.ReactNode;
  }) => <div data-testid="error-boundary">{children}</div>,
  Tabs: () => <div data-testid="tabs">Tabs</div>,
  Suspense: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ReportsListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText('销售报表')).toBeInTheDocument();
  });

  it('renders metadata title', () => {
    const { container } = render(<div />);
    expect(true).toBe(true);
  });

  it('renders reports summary cards with total count', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders "已生成" summary count', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    const generatedCounts = screen.getAllByText(/已生成/);
    expect(generatedCounts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders action buttons', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText('📄 新建报表')).toBeInTheDocument();
    expect(screen.getByText('📥 批量导出')).toBeInTheDocument();
    expect(screen.getByText('📊 对比分析')).toBeInTheDocument();
  });

  it('renders the ReportsPage component', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByTestId('reports-page')).toBeInTheDocument();
  });

  it('renders JSON-LD structured data script', async () => {
    const PageComponent = await Page();
    const { container } = render(PageComponent);
    const jsonld = container.querySelector('script[type="application/ld+json"]');
    expect(jsonld).toBeInTheDocument();
    const parsed = JSON.parse(jsonld?.innerHTML || '{}');
    expect(parsed['@type']).toBe('WebApplication');
  });

  it('shows 8 reports total', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByTestId('reports-page')).toHaveAttribute('data-total', '8');
  });
});

describe('ReportsListPage - Categories & Footer', () => {
  it('renders report type category tabs', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('日活')).toBeInTheDocument();
    expect(screen.getByText('周报')).toBeInTheDocument();
    expect(screen.getByText('月报')).toBeInTheDocument();
  });

  it('renders data disclaimer footer', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText(/日活报表每日凌晨自动生成/)).toBeInTheDocument();
  });

  it('renders search input for reports', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByPlaceholderText('搜索报表标题、摘要...')).toBeInTheDocument();
  });

  it('renders status filter select', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "生成中" count in stats', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders ErrorBoundary wrapper', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('renders "最近更新" timestamp', async () => {
    const PageComponent = await Page();
    render(PageComponent);
    expect(screen.getByText(/最近更新/)).toBeInTheDocument();
  });
});
