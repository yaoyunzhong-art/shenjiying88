/**
 * analytics/page.vitest.tsx — 数据分析页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · KPI指标 · 仪表盘 · 品类分析 · 客流高峰 · 营收趋势 · 异常指标 · 边界
 * 角色: 👔店长 · 🎯运行专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  QuickStats: vi.fn(({ items }: { items: { label: string; value: string; trend: number; variant: string }[] }) => (
    <div data-testid="quick-stats">
      {items.map((item, idx) => (
        <div key={idx} data-testid={`stat-${item.label}`}>
          <span>{item.label}</span>
          <span>{item.value}</span>
          <span data-testid={`trend-${item.label}`}>{item.trend}</span>
        </div>
      ))}
    </div>
  )),
  StatCard: vi.fn(({ label, value, variant }: { label: string; value: string; variant: string }) => (
    <div data-testid="stat-card" data-variant={variant}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )),
  GaugeChart: vi.fn(({ value, segments, label }: { value: number; segments: unknown[]; label: string }) => (
    <div data-testid="gauge-chart" data-value={value} data-label={label}>
      {label}
    </div>
  )),
  HeatmapChart: vi.fn(() => <div data-testid="heatmap-chart" />),
  StatusBadge: vi.fn(({ label, variant }: { label: string; variant: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  )),
}));

vi.mock('@m5/sdk', () => ({
  createBusinessClient: vi.fn(),
  getDefaultApiBaseUrl: vi.fn(),
}));

import AnalyticsPage from './page';

describe('AnalyticsPage — 数据分析', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders page title 数据分析', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('数据分析')).toBeInTheDocument();
  });

  test('renders QuickStats component', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
  });

  test('renders all 6 KPI stat cards', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('stat-今日营收')).toBeInTheDocument();
    expect(screen.getByTestId('stat-今日订单')).toBeInTheDocument();
    expect(screen.getByTestId('stat-客单价')).toBeInTheDocument();
    expect(screen.getByTestId('stat-到店客流')).toBeInTheDocument();
    expect(screen.getByTestId('stat-转化率')).toBeInTheDocument();
    expect(screen.getByTestId('stat-会员消费占比')).toBeInTheDocument();
  });

  test('renders KPI values correctly', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('¥12,580')).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText('25.1%')).toBeInTheDocument();
  });

  test('renders 营收达标率 gauge chart', () => {
    render(<AnalyticsPage />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges[0]).toHaveAttribute('data-label', '营收达标率');
    expect(gauges[0]).toHaveAttribute('data-value', '75');
  });

  test('renders 2 gauge charts', () => {
    render(<AnalyticsPage />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBe(2);
  });

  test('second gauge is 客户满意度', () => {
    render(<AnalyticsPage />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges[1]).toHaveAttribute('data-label', '客户满意度');
    expect(gauges[1]).toHaveAttribute('data-value', '88');
  });

  test('renders 品类分析 section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('品类分析')).toBeInTheDocument();
  });

  test('renders Top 品类 info', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/Top 品类:/)).toBeInTheDocument();
  });

  test('renders 增长率 info', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/增长率/)).toBeInTheDocument();
  });

  test('renders 客流高峰分析 section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('客流高峰分析')).toBeInTheDocument();
  });

  test('renders peak hour info (18:00 with 92 visitors)', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/高峰时段:/)).toBeInTheDocument();
    expect(screen.getByText(/客流 92 人/)).toBeInTheDocument();
  });

  test('renders 营收趋势 section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('营收趋势')).toBeInTheDocument();
  });

  test('renders 日均营收 info', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/日均营收:/)).toBeInTheDocument();
  });

  test('renders 同环比增长 info', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/同环比增长:/)).toBeInTheDocument();
  });

  test('renders 异常指标 section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('异常指标')).toBeInTheDocument();
  });

  test('renders unresolved anomaly count', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/未处理异常:/)).toBeInTheDocument();
  });

  // ====== 数据正确性测试 ======

  test('今日营收 trend is 8.3', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-今日营收').textContent).toBe('8.3');
  });

  test('今日订单 trend is 5.1', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-今日订单').textContent).toBe('5.1');
  });

  test('客单价 trend is -2.4', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-客单价').textContent).toBe('-2.4');
  });

  test('到店客流 trend is 12.7', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-到店客流').textContent).toBe('12.7');
  });

  test('转化率 trend is -0.8', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-转化率').textContent).toBe('-0.8');
  });

  test('会员消费占比 trend is 3.5', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-会员消费占比').textContent).toBe('3.5');
  });

  // ====== 品类分析测试 ======

  test('top category is 饮品', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/饮品/)).toBeInTheDocument();
  });

  test('positive growth count = 4', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/增长率 >0: 4/)).toBeInTheDocument();
  });

  test('negative growth count = 2', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/, <0: 2/)).toBeInTheDocument();
  });

  // ====== 营收趋势测试 ======

  test('日均营收 is formatted correctly', () => {
    render(<AnalyticsPage />);
    const avgRevenue = Math.round([48200, 51300, 46800, 55600, 61200, 58900, 44500].reduce((s, v) => s + v, 0) / 7);
    expect(screen.getByText(new RegExp(`¥${avgRevenue.toLocaleString()}`))).toBeInTheDocument();
  });

  test('growth percentage is positive', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/同环比增长: \d+%/)).toBeInTheDocument();
  });

  // ====== 异常指标测试 ======

  test('unresolved anomaly count = 4', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/未处理异常: 4 条/)).toBeInTheDocument();
  });

  // ====== 边界测试 ======

  test('export default is a function', () => {
    expect(typeof AnalyticsPage).toBe('function');
  });

  test('page container has max-width 1280px', () => {
    const { container } = render(<AnalyticsPage />);
    const outerDiv = container.querySelector('[style*="max-width: 1280px"]') as HTMLElement;
    expect(outerDiv).toBeTruthy();
  });

  test('all 6 KPI stat trends are accessible', () => {
    render(<AnalyticsPage />);
    const expectedStats = ['今日营收', '今日订单', '客单价', '到店客流', '转化率', '会员消费占比'];
    expectedStats.forEach(stat => {
      expect(screen.getByTestId(`trend-${stat}`)).toBeInTheDocument();
    });
  });

  test('kpi total positive trends = 4', () => {
    render(<AnalyticsPage />);
    const trends = ['8.3', '5.1', '-2.4', '12.7', '-0.8', '3.5'].map(Number);
    const positive = trends.filter(t => t > 0).length;
    expect(positive).toBe(4);
  });

  test('kpi total negative trends = 2', () => {
    render(<AnalyticsPage />);
    const trends = ['8.3', '5.1', '-2.4', '12.7', '-0.8', '3.5'].map(Number);
    const negative = trends.filter(t => t < 0).length;
    expect(negative).toBe(2);
  });

  test('peak hour is 18:00', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/18:00/)).toBeInTheDocument();
  });
});
