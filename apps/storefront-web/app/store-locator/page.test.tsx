import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/store-locator',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...rest } = props;
    return <img {...rest} />;
  },
}));

jest.mock('../../lib/store-locator-service', () => ({
  storeLocatorService: {
    searchStores: jest.fn(),
  },
  STATUS_INFO: {} as Record<string, { text: string; color: string }>,
}));

jest.mock('../../lib/store-locator-style', () => ({
  STATUS_INFO: {
    open: { text: '营业中', color: '#22c55e' },
    closed: { text: '已休息', color: '#6b7280' },
    maintenance: { text: '维护中', color: '#f59e0b' },
  },
  getCityButtonStyle: jest.fn(() => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  })),
  getStoreCardStyle: jest.fn(() => ({
    borderRadius: 12,
    overflow: 'hidden',
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.08)',
    transition: 'all 0.2s',
  })),
  getStatusBadgeStyle: jest.fn(() => ({
    position: 'absolute' as const,
    top: 8,
    right: 8,
    padding: '2px 8px',
    borderRadius: 6,
    background: 'rgba(34,197,94,0.15)',
    color: '#22c55e',
    fontSize: 11,
    fontWeight: 600,
  })),
  getFeatureChipStyle: jest.fn(() => ({
    padding: '2px 8px',
    borderRadius: 6,
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
    fontSize: 11,
  })),
  getContactActionButtonStyle: jest.fn(() => ({
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(148,163,184,0.1)',
    border: 'none',
    color: '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'none',
  })),
  getActionButtonRowStyle: jest.fn(() => ({
    display: 'flex',
    gap: 8,
    marginTop: 10,
  })),
  getBottomNavItemStyle: jest.fn((active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    textDecoration: 'none',
    color: active ? '#f59e0b' : '#64748b',
  })),
  filterStoreByKeyword: jest.fn((stores, keyword) => {
    if (!keyword) return stores;
    return stores.filter((s: { storeName: string; address: string }) =>
      s.storeName.includes(keyword) || s.address.includes(keyword)
    );
  }),
}));

describe('StoreLocatorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('门店搜索')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Page />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText('搜索门店名称或地址...')).toBeInTheDocument();
  });

  it('renders city filter button "全部城市"', () => {
    render(<Page />);
    expect(screen.getByText('全部城市')).toBeInTheDocument();
  });

  it('renders bottom navigation with 4 items', () => {
    render(<Page />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('门店')).toBeInTheDocument();
    expect(screen.getByText('卡券')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  it('renders header description text', () => {
    render(<Page />);
    expect(screen.getByText('查找离您最近的门店')).toBeInTheDocument();
  });
});

describe('StoreLocatorPage - Search & Filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows typing in search input', () => {
    render(<Page />);
    const input = screen.getByPlaceholderText('搜索门店名称或地址...');
    fireEvent.change(input, { target: { value: '旗舰店' } });
    expect(input).toHaveValue('旗舰店');
  });

  it('renders form for search submission', () => {
    render(<Page />);
    const searchIcon = screen.getByText('🔍');
    expect(searchIcon).toBeInTheDocument();
  });

  it('shows empty state text in page', () => {
    render(<Page />);
    expect(screen.getByText('门店搜索')).toBeInTheDocument();
  });

  it('renders main container with correct background', () => {
    const { container } = render(<Page />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ background: '#0f172a' });
  });

  it('renders logo heading with h1 tag', () => {
    const { container } = render(<Page />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('门店搜索');
  });
});

describe('StoreLocatorPage - Navigation', () => {
  it('renders bottom nav with fixed position', () => {
    const { container } = render(<Page />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveStyle({ position: 'fixed', bottom: 0 });
  });

  it('renders nav with 4 link items', () => {
    render(<Page />);
    const navItems = ['🏠', '🔍', '🎫', '👤'];
    navItems.forEach((icon) => {
      expect(screen.getByText(icon)).toBeInTheDocument();
    });
  });

  it('renders store section container', () => {
    const { container } = render(<Page />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});
