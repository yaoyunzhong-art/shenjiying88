import { render, screen, fireEvent } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/maintenance',
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
  DataTable: ({ columns, rows }: { columns: unknown[]; rows: unknown[] }) => (
    <div data-testid="data-table" data-row-count={rows.length}>{rows.length} rows</div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
  Button: ({ children, variant, onClick }: {
    children: React.ReactNode; variant?: string; onClick?: () => void;
  }) => (
    <button data-variant={variant} onClick={onClick}>{children}</button>
  ),
  Pagination: ({ page, total, totalPages, onPageChange, pageSize, onPageSizeChange }: {
    page: number; total: number; totalPages: number; onPageChange: (p: number) => void;
    pageSize?: number; onPageSizeChange?: (s: number) => void;
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
  useSearchFilter: () => ({ search: '', setSearch: jest.fn(), debouncedSearch: '' }),
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

describe('MaintenancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });

  it('renders page title via PageShell', () => {
    render(<Page />);
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-title', '设备保养工单');
  });

  it('renders search filter input', () => {
    render(<Page />);
    expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(<Page />);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('renders priority filter dropdown', () => {
    render(<Page />);
    expect(screen.getByTestId('priority-filter')).toBeInTheDocument();
  });

  it('renders create order button', () => {
    render(<Page />);
    expect(screen.getByText('+ 新建工单')).toBeInTheDocument();
  });

  it('renders data table with rows', () => {
    render(<Page />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('renders pagination', () => {
    render(<Page />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });
});

describe('MaintenancePage - Data Display', () => {
  it('shows correct number of data table rows', () => {
    render(<Page />);
    const table = screen.getByTestId('data-table');
    expect(table).toHaveAttribute('data-row-count', '5');
  });

  it('renders pagination with total of 10 items', () => {
    render(<Page />);
    const pagination = screen.getByTestId('pagination');
    expect(pagination).toHaveAttribute('data-total', '10');
  });

  it('provides status filter options', () => {
    render(<Page />);
    const statusFilter = screen.getByTestId('status-filter');
    expect(statusFilter).toBeInTheDocument();
  });

  it('renders search placeholder correctly', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText('搜索工单/设备/门店/负责人…')).toBeInTheDocument();
  });

  it('renders all status filter option labels', () => {
    render(<Page />);
    const select = screen.getByTestId('status-filter');
    const options = select.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain('全部');
    expect(labels).toContain('待处理');
    expect(labels).toContain('已完成');
  });

  it('renders all priority filter option labels', () => {
    render(<Page />);
    const select = screen.getByTestId('priority-filter');
    const options = select.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain('全部');
    expect(labels).toContain('紧急');
    expect(labels).toContain('高');
  });
});
