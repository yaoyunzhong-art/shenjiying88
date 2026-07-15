import { render, screen, fireEvent } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/device-inspection',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  ),
  StatCard: ({ label, value, variant }: {
    label: string; value: string | number; variant?: string;
  }) => (
    <div data-testid="stat-card" data-variant={variant}>{label}: {String(value)}</div>
  ),
  DataTable: ({ columns, rows }: { columns: unknown[]; rows: unknown[] }) => (
    <div data-testid="data-table" data-row-count={rows.length}>{rows.length} rows</div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
  Button: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <button data-variant={variant}>{children}</button>
  ),
  Pagination: ({ page, total, totalPages, onPageChange }: {
    page: number; total: number; totalPages: number; onPageChange: (p: number) => void;
  }) => (
    <div data-testid="pagination" data-page={page} data-total={total} data-totalpages={totalPages}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</button>
      <span>{page}/{totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  ),
  usePagination: (total: number, defaultPageSize: number) => ({
    page: 1,
    setPage: jest.fn(),
    pageSize: defaultPageSize,
    setPageSize: jest.fn(),
    totalPages: Math.max(1, Math.ceil(total / defaultPageSize)),
  }),
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder: string;
  }) => (
    <div data-testid="search-filter-input">
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

describe('DeviceInspectionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });

  it('renders page shell with correct title', () => {
    render(<Page />);
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-title', '设备巡检工作台');
  });

  it('renders search filter input', () => {
    render(<Page />);
    expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(<Page />);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('renders risk filter dropdown', () => {
    render(<Page />);
    expect(screen.getByTestId('risk-filter')).toBeInTheDocument();
  });

  it('renders create inspection task button', () => {
    render(<Page />);
    expect(screen.getByText('+ 创建巡检任务')).toBeInTheDocument();
  });

  it('renders export report button', () => {
    render(<Page />);
    expect(screen.getByText('导出报告')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<Page />);
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(7);
  });

  it('renders data table', () => {
    render(<Page />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });
});

describe('DeviceInspectionPage - Data Display & Filters', () => {
  it('shows total inspection count', () => {
    render(<Page />);
    const totalCard = screen.getByText(/总巡检/);
    expect(totalCard).toBeInTheDocument();
  });

  it('shows pending inspections count', () => {
    render(<Page />);
    const pendingCards = screen.getAllByText(/待巡检/);
    expect(pendingCards.length).toBeGreaterThanOrEqual(1);
  });

  it('shows passed inspections count', () => {
    render(<Page />);
    const passedCards = screen.getAllByText(/已通过/);
    expect(passedCards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pagination component', () => {
    render(<Page />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('renders data table with correct row count', () => {
    render(<Page />);
    const table = screen.getByTestId('data-table');
    expect(Number(table.getAttribute('data-row-count'))).toBeLessThanOrEqual(6);
  });

  it('renders search placeholder', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText('搜索设备/位置/巡检人编号…')).toBeInTheDocument();
  });

  it('renders status filter with all status options', () => {
    render(<Page />);
    const statusFilter = screen.getByTestId('status-filter');
    const options = statusFilter.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain('全部状态');
    expect(labels).toContain('待巡检');
    expect(labels).toContain('已通过');
    expect(labels).toContain('不合格');
  });

  it('renders risk filter with all risk options', () => {
    render(<Page />);
    const riskFilter = screen.getByTestId('risk-filter');
    const options = riskFilter.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain('全部风险');
    expect(labels).toContain('危急');
    expect(labels).toContain('高');
    expect(labels).toContain('低');
  });
});
