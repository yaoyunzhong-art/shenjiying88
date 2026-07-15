import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  ),
  StatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div data-testid="stat-card" data-label={label}>{label}: {String(value)}</div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder: string;
  }) => (
    <input
      data-testid="search-filter"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  SegmentedControl: ({ options, value, onChange }: {
    options: { value: string; label: string }[];
    value: string; onChange: (v: string) => void;
  }) => (
    <div data-testid="segmented-control">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} data-active={opt.value === value}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
  Pagination: ({ page, total, totalPages, onPageChange }: {
    page: number; total: number; totalPages: number; onPageChange: (p: number) => void;
  }) => (
    <div data-testid="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
      <span>{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  ),
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

jest.mock('./model', () => {
  const mockDevices = [
    { id: 'd1', name: '收银机-01', category: 'pos', storeName: '旗舰店', ip: '192.168.1.10', status: 'online', firmware: 'v3.2.1', alerts: 0 },
    { id: 'd2', name: '监控摄像头-02', category: 'camera', storeName: '旗舰店', ip: '192.168.1.20', status: 'offline', firmware: 'v2.1.0', alerts: 0 },
    { id: 'd3', name: '空调系统-01', category: 'hvac', storeName: '分店A', ip: '192.168.2.10', status: 'warning', firmware: 'v1.5.0', alerts: 3 },
    { id: 'd4', name: '门禁系统-01', category: 'access', storeName: '分店A', ip: '192.168.2.20', status: 'error', firmware: 'v4.0.1', alerts: 5 },
    { id: 'd5', name: '打印机-01', category: 'printer', storeName: '分店B', ip: '192.168.3.10', status: 'pending', firmware: 'v2.0.0', alerts: 0 },
  ];

  return {
    DEVICE_CATEGORY_LABELS: { pos: '收银机', camera: '摄像头', hvac: '空调', access: '门禁', printer: '打印机' },
    DEVICE_STATUS_LABELS: { online: '在线', offline: '离线', warning: '警告', error: '故障', pending: '待确认' },
    DEVICE_STATUS_COLORS: { online: '#22c55e', offline: '#6b7280', warning: '#f59e0b', error: '#ef4444', pending: '#3b82f6' },
    FILTER_OPTIONS: [
      { value: 'all', label: '全部' },
      { value: 'online', label: '在线' },
      { value: 'offline', label: '离线' },
      { value: 'warning', label: '警告' },
      { value: 'error', label: '故障' },
    ],
    sortDevicesBySeverity: (devices: unknown[]) => devices,
    filterDevices: (devices: unknown[], statusFilter: string, searchTerm: string) => {
      let result = [...devices] as { status: string; name: string }[];
      if (statusFilter !== 'all') {
        result = result.filter((d) => d.status === statusFilter);
      }
      if (searchTerm) {
        result = result.filter((d) => d.name.includes(searchTerm));
      }
      return result;
    },
    computeStats: (devices: unknown[]) => {
      const d = devices as { status: string }[];
      return {
        total: d.length,
        online: d.filter((x) => x.status === 'online').length,
        offline: d.filter((x) => x.status === 'offline').length,
        warning: d.filter((x) => x.status === 'warning').length,
        error: d.filter((x) => x.status === 'error').length,
        healthRate: 85,
      };
    },
    generateMockDevices: () => mockDevices,
  };
});

describe('DeviceMonitoringPage', () => {
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
    expect(shell).toHaveAttribute('data-title', '设备监控');
  });

  it('renders stat cards for device counts', () => {
    render(<Page />);
    const cards = screen.getAllByTestId('stat-card');
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });

  it('renders total device count stat', () => {
    render(<Page />);
    expect(screen.getByText(/设备总数/)).toBeInTheDocument();
  });

  it('renders online device stat', () => {
    render(<Page />);
    expect(screen.getByText(/在线/)).toBeInTheDocument();
  });

  it('renders segmented control for status filter', () => {
    render(<Page />);
    expect(screen.getByTestId('segmented-control')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Page />);
    const searchInput = screen.getByTestId('search-filter');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders device list items', () => {
    render(<Page />);
    expect(screen.getByText('收银机-01')).toBeInTheDocument();
    expect(screen.getByText('监控摄像头-02')).toBeInTheDocument();
  });
});

describe('DeviceMonitoringPage - Filter & Interaction', () => {
  it('renders pagination component', () => {
    render(<Page />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('shows device IP addresses', () => {
    render(<Page />);
    expect(screen.getByText(/192\.168\.1\.10/)).toBeInTheDocument();
  });

  it('shows firmware versions', () => {
    render(<Page />);
    expect(screen.getByText(/v3\.2\.1/)).toBeInTheDocument();
  });

  it('shows store names for devices', () => {
    render(<Page />);
    expect(screen.getByText(/旗舰店/)).toBeInTheDocument();
    expect(screen.getByText(/分店A/)).toBeInTheDocument();
  });

  it('shows health rate percentage', () => {
    render(<Page />);
    const healthCards = screen.getAllByText(/85%/);
    expect(healthCards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders device category labels', () => {
    render(<Page />);
    expect(screen.getByText(/收银机/)).toBeInTheDocument();
    expect(screen.getByText(/摄像头/)).toBeInTheDocument();
  });
});
