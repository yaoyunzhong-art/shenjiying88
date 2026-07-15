import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/sales-clerk',
}));

jest.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  ),
  SalesClerkTool: ({
    stats,
    followUpClients,
    scripts,
    clerkName,
    storeName,
    onMemberSearch,
    onFollowUp,
    onScriptCopy,
  }: Record<string, unknown>) => (
    <div data-testid="sales-clerk-tool">
      <div data-testid="clerk-info">{String(clerkName)} - {String(storeName)}</div>
      <div data-testid="stats-receptions">{String((stats as { totalReceptions: number }).totalReceptions)}</div>
      <div data-testid="follow-up-count">{String((followUpClients as unknown[]).length)}</div>
      <div data-testid="scripts-count">{String((scripts as unknown[]).length)}</div>
    </div>
  ),
}));

describe('SalesClerkPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });

  it('renders page title', () => {
    render(<Page />);
    expect(screen.getByText('导购员工作台')).toBeInTheDocument();
  });

  it('renders page shell with correct title', () => {
    render(<Page />);
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-title', '导购员工作台');
  });

  it('renders sales clerk tool component', () => {
    render(<Page />);
    expect(screen.getByTestId('sales-clerk-tool')).toBeInTheDocument();
  });

  it('renders clerk name and store name', () => {
    render(<Page />);
    expect(screen.getByTestId('clerk-info')).toHaveTextContent('张三');
    expect(screen.getByTestId('clerk-info')).toHaveTextContent('朝阳旗舰店');
  });

  it('renders page header with date', () => {
    render(<Page />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    const today = new Date().toLocaleDateString('zh-CN');
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it('renders mock reception stats', () => {
    render(<Page />);
    expect(screen.getByTestId('stats-receptions')).toHaveTextContent('47');
  });

  it('renders follow-up clients count', () => {
    render(<Page />);
    expect(screen.getByTestId('follow-up-count')).toHaveTextContent('5');
  });

  it('renders scripts count', () => {
    render(<Page />);
    expect(screen.getByTestId('scripts-count')).toHaveTextContent('4');
  });
});

describe('SalesClerkPage - Structure & Layout', () => {
  it('renders main container div with data-testid', () => {
    const { container } = render(<Page />);
    const mainDiv = container.querySelector('[data-testid="sales-clerk-page"]');
    expect(mainDiv).toBeInTheDocument();
  });

  it('renders page header with correct structure', () => {
    render(<Page />);
    const header = screen.getByTestId('page-header');
    expect(header).toBeInTheDocument();
    expect(header.querySelector('h1')).toHaveTextContent(/导购员工作台/);
  });

  it('does not show copy toast initially', () => {
    render(<Page />);
    expect(screen.queryByTestId('copy-toast')).not.toBeInTheDocument();
  });

  it('renders store info in header', () => {
    render(<Page />);
    expect(screen.getByText(/朝阳旗舰店/)).toBeInTheDocument();
  });

  it('renders emoji icon in title', () => {
    render(<Page />);
    const h1 = screen.getByText(/导购员工作台/);
    expect(h1.innerHTML).toContain('🛍️');
  });
});
