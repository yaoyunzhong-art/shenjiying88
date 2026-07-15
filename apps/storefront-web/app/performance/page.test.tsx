import { render, screen } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('@m5/ui', () => ({
  StatCard: ({ label, value, variant }: {
    label: string; value: string; variant?: string;
  }) => (
    <div data-testid="stat-card" data-variant={variant}>
      <div>{label}</div>
      <div>{value}</div>
    </div>
  ),
  QuickStats: ({ items }: { items: { label: string; value: string }[] }) => (
    <div data-testid="quick-stats">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}: </span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  ),
  GaugeChart: ({ value, label, size }: {
    value: number; label: string; size: number;
  }) => (
    <div data-testid="gauge-chart" data-value={value} data-label={label}>
      {value}%
    </div>
  ),
  HeatmapChart: ({ data, rowLabels, colLabels }: {
    data: unknown[]; rowLabels: string[]; colLabels: string[];
  }) => (
    <div data-testid="heatmap-chart" data-rows={rowLabels.length} data-cols={colLabels.length}>
      Heatmap {rowLabels.length}x{colLabels.length}
    </div>
  ),
}));

jest.mock('./performance-data', () => ({
  makeStorePerformanceData: () => ({
    todayRevenue: 45280.50,
    todayOrders: 128,
    todayCustomers: 156,
    avgOrderValue: 290.26,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    completionRate: 87,
    satisfactionScore: 92,
    weekly: {
      dailyRevenue: [35000, 42000, 38000, 45000, 52000, 48000, 55000],
    },
    categoryPerformance: [
      { category: '护肤品', revenue: 125000, salesCount: 320, targetAchievement: 85 },
      { category: '彩妆', revenue: 98000, salesCount: 245, targetAchievement: 78 },
      { category: '饮品', revenue: 45000, salesCount: 520, targetAchievement: 92 },
    ],
  }),
}));

describe('PerformancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('📊 门店绩效')).toBeInTheDocument();
  });

  it('renders page title', () => {
    render(<Page />);
    const h1 = screen.getByText('📊 门店绩效');
    expect(h1.tagName).toBe('H1');
  });

  it('renders quick stats component', () => {
    render(<Page />);
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
  });

  it('renders today revenue in quick stats', () => {
    render(<Page />);
    expect(screen.getByText(/今日营收/)).toBeInTheDocument();
  });

  it('renders today orders in quick stats', () => {
    render(<Page />);
    expect(screen.getByText(/今日订单/)).toBeInTheDocument();
  });

  it('renders gauge chart for completion rate', () => {
    render(<Page />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders completion rate gauge with value 87', () => {
    render(<Page />);
    const gauges = screen.getAllByTestId('gauge-chart');
    const completionGauge = gauges.find((g) => g.getAttribute('data-label') === '完成率');
    expect(completionGauge).toBeInTheDocument();
  });

  it('renders satisfaction score gauge', () => {
    render(<Page />);
    expect(screen.getByText('客户满意度')).toBeInTheDocument();
  });

  it('renders heatmap chart', () => {
    render(<Page />);
    expect(screen.getByTestId('heatmap-chart')).toBeInTheDocument();
  });
});

describe('PerformancePage - Metrics & Categories', () => {
  it('renders revenue week-over-week stat card', () => {
    render(<Page />);
    expect(screen.getByText('营收周同比')).toBeInTheDocument();
  });

  it('renders order week-over-week stat card', () => {
    render(<Page />);
    expect(screen.getByText('订单周同比')).toBeInTheDocument();
  });

  it('renders weekly cumulative revenue stat', () => {
    render(<Page />);
    expect(screen.getByText('本周累计营收')).toBeInTheDocument();
  });

  it('renders category performance section', () => {
    render(<Page />);
    expect(screen.getByText('📦 品类达成率')).toBeInTheDocument();
  });

  it('renders skincare category performance', () => {
    render(<Page />);
    expect(screen.getByText('护肤品')).toBeInTheDocument();
  });

  it('renders revenue growth as positive percentage', () => {
    render(<Page />);
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('renders order growth as positive percentage', () => {
    render(<Page />);
    expect(screen.getByText('+8.3%')).toBeInTheDocument();
  });

  it('renders the heatmap title', () => {
    render(<Page />);
    expect(screen.getByText('🔥 周营收热力图 (星期 × 时段)')).toBeInTheDocument();
  });
});
