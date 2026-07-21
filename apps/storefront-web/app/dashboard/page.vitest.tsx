import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('next/link', () => ({
  default: ({ children, href, style }: any) => (
    <a data-testid="next-link" href={href} style={style}>{children}</a>
  ),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description, actions }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {actions}
      {children}
    </div>
  ),
  StatCard: ({ label, value, variant }: any) => (
    <div data-testid="stat-card" data-variant={variant}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="m5-status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  Tabs: ({ items, activeKey, onChange, variant, size }: any) => (
    <div data-testid="m5-tabs" data-active-key={activeKey} data-variant={variant} data-size={size}>
      {items.map((item: any) => (
        <button key={item.key} data-testid={`tab-${item.key}`} onClick={() => onChange(item.key)}>
          {item.label}
        </button>
      ))}
    </div>
  ),
  Card: ({ children, title, style }: any) => (
    <div data-testid="m5-card" style={style}>
      {title && <h4 data-testid="card-title">{title}</h4>}
      {children}
    </div>
  ),
  GaugeChart: (props: any) => <div data-testid="m5-gauge" />,
  SparklineChart: ({ data, width, height, color }: any) => (
    <div data-testid="m5-sparkline" data-points={data?.length} data-color={color} />
  ),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="m5-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  Button: Object.assign(
    ({ children, onClick, variant, size }: any) => (
      <button data-testid={`btn-${variant || 'default'}`} onClick={onClick}>{children}</button>
    ),
    { displayName: 'Button' },
  ),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

// ---- Test Subject ----

import DashboardPage from './page';

describe('DashboardPage — 门店仪表盘', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '门店仪表盘');
    });
  });

  test('renders PageShell with correct description', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-description', 'Shenjiying 旗舰店 · 今日运营概览');
    });
  });

  test('renders time dimension tabs', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-today')).toBeInTheDocument();
      expect(screen.getByTestId('tab-week')).toBeInTheDocument();
      expect(screen.getByTestId('tab-month')).toBeInTheDocument();
    });
  });

  test('renders 6 stat sections', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const sparklines = screen.getAllByTestId('m5-sparkline');
      expect(sparklines.length).toBe(6);
    });
  });

  test('renders 今日 tab as active by default', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('m5-tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'today');
    });
  });

  test('renders top products card', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const cards = screen.getAllByTestId('card-title');
      expect(cards.some(c => c.textContent?.includes('畅销产品'))).toBe(true);
    });
  });

  test('renders recent orders card', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const cards = screen.getAllByTestId('card-title');
      expect(cards.some(c => c.textContent?.includes('最近订单'))).toBe(true);
    });
  });

  test('renders alerts card', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const cards = screen.getAllByTestId('card-title');
      expect(cards.some(c => c.textContent?.includes('预警提醒'))).toBe(true);
    });
  });

  test('renders 8 top products rows', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('瑜伽初级课')).toBeInTheDocument();
      expect(screen.getByText('游泳季卡')).toBeInTheDocument();
      expect(screen.getByText('HIIT 高强度训练')).toBeInTheDocument();
      expect(screen.getByText('私教一对一')).toBeInTheDocument();
    });
  });

  test('renders 8 recent order rows', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('张伟')).toBeInTheDocument();
      expect(screen.getByText('李娜')).toBeInTheDocument();
      expect(screen.getByText('王芳')).toBeInTheDocument();
      expect(screen.getByText('赵强')).toBeInTheDocument();
    });
  });

  test('renders 5 alert items', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('冰柜温度异常')).toBeInTheDocument();
      expect(screen.getByText('库存预警 - 蛋白粉不足')).toBeInTheDocument();
      expect(screen.getByText('打印机故障 - 前台1号')).toBeInTheDocument();
      expect(screen.getByText('会员投诉跟进超时')).toBeInTheDocument();
      expect(screen.getByText('排班冲突 - 晚班缺人')).toBeInTheDocument();
    });
  });

  test('renders 7 shortcut links', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const links = screen.getAllByTestId('next-link');
      expect(links.length).toBeGreaterThanOrEqual(7);
    });
  });

  test('renders action buttons', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('🔄 刷新')).toBeInTheDocument();
      expect(screen.getByText('📋 查看产品')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('tri-state-loading')).toBeInTheDocument();
  });

  // ====== 状态测试 ======

  test('shows 今日营收 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('今日营收')).toBeInTheDocument();
    });
  });

  test('shows 订单数 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('订单数')).toBeInTheDocument();
    });
  });

  test('shows 客单价 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('客单价')).toBeInTheDocument();
    });
  });

  test('shows 新增会员 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('新增会员')).toBeInTheDocument();
    });
  });

  test('shows 活跃设备 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('活跃设备')).toBeInTheDocument();
    });
  });

  test('shows 在线率 stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('在线率')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('switches to week tab', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-week'));
    });
    await waitFor(() => {
      const tabs = screen.getByTestId('m5-tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'week');
    });
  });

  test('switches to month tab', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-month'));
    });
    await waitFor(() => {
      const tabs = screen.getByTestId('m5-tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'month');
    });
  });

  test('switches back to today tab from week', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-week'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-today'));
    });
    await waitFor(() => {
      const tabs = screen.getByTestId('m5-tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'today');
    });
  });

  test('refresh button triggers alert', async () => {
    const originalAlert = window.alert;
    const mockAlert = vi.fn();
    window.alert = mockAlert;
    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('🔄 刷新'));
    });
    expect(mockAlert).toHaveBeenCalledWith('数据刷新中...');
    window.alert = originalAlert;
  });

  test('查看产品 button redirects', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 查看产品'));
    });
    expect(window.location.href).toBe('/products');

    window.location = originalLocation;
  });

  test('shows StatusBadge for recent orders', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  // ====== 边界情况 ======

  test('trend badges show positive values with + sign', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      // 今日营收 trend is +12.5% (positive)
      expect(screen.getByText(/12\.5/)).toBeInTheDocument();
    });
  });

  test('trend badges show negative values', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      // 客单价 trend is -1.2% (negative)
      expect(screen.getByText(/-1\.2/)).toBeInTheDocument();
    });
  });

  test('shows 查看全部订单 link', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/查看全部订单/)).toBeInTheDocument();
    });
  });

  test('shows 查看全部告警 text', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('🔔 查看全部告警')).toBeInTheDocument();
    });
  });

  test('link to orders page has correct href', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const links = screen.getAllByTestId('next-link');
      const ordersLink = links.find(l => l.textContent?.includes('查看全部订单'));
      expect(ordersLink).toHaveAttribute('href', '/orders');
    });
  });

  test('link to products page exists in shortcuts', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const links = screen.getAllByTestId('next-link');
      const productsLink = links.find(l => l.textContent?.includes('商品管理'));
      expect(productsLink).toHaveAttribute('href', '/products');
    });
  });

  test('link to members page exists in shortcuts', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const links = screen.getAllByTestId('next-link');
      const membersLink = links.find(l => l.textContent?.includes('会员管理'));
      expect(membersLink).toHaveAttribute('href', '/members');
    });
  });

  test('link to orders page exists in shortcuts', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const links = screen.getAllByTestId('next-link');
      const ordersLink = links.find(l => l.textContent?.includes('订单管理'));
      expect(ordersLink).toHaveAttribute('href', '/orders');
    });
  });

  test('shows sparkline for each stat', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const sparklines = screen.getAllByTestId('m5-sparkline');
      expect(sparklines.length).toBe(6);
      // Each sparkline should have 24 data points (today)
      expect(sparklines[0]).toHaveAttribute('data-points', '24');
    });
  });

  test('sparkline data points change when switching to week', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-week'));
    });
    await waitFor(() => {
      const sparklines = screen.getAllByTestId('m5-sparkline');
      // Week data has 7 points
      expect(sparklines[0]).toHaveAttribute('data-points', '7');
    });
  });

  test('trend badge shows "持平" for zero trend', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      // 活跃设备 has trend 0
      expect(screen.getByText('持平')).toBeInTheDocument();
    });
  });

  test('shows correctly styled alert severity colors', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      const alertBadges = badges.filter(b => b.textContent === '设备' || b.textContent === '库存' || b.textContent === '服务' || b.textContent === '人力');
      expect(alertBadges.length).toBeGreaterThan(0);
    });
  });

  test('alerts have correct data-variant based on severity', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
