/**
 * 会员等级分布页面测试 — Member Tier Distribution Page Test
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberTierDistributionPage from './page';

// Mock @m5/ui 组件
jest.mock('@m5/ui', () => {
  const actual = jest.requireActual('@m5/ui');
  return {
    ...actual,
    DonutChart: ({ data, showLegend, showPercent }: any) => (
      <div data-testid="donut-chart" data-data={JSON.stringify(data)} data-legend={showLegend} data-percent={showPercent}>
        DonutChart Mock
      </div>
    ),
    SparklineChart: ({ data, color, showArea, showLabels }: any) => (
      <div
        data-testid="sparkline-chart"
        data-count={data?.length}
        data-color={color}
        data-area={showArea}
        data-labels={showLabels}
      >
        SparklineChart Mock
      </div>
    ),
    MemberTierDistribution: ({ tiers, onTierClick }: any) => (
      <div data-testid="member-tier-distribution" data-tier-count={tiers?.length}>
        MemberTierDistribution Mock
      </div>
    ),
    MemberLevelDistribution: ({ data, showValues, showPercentage }: any) => (
      <div
        data-testid="member-level-distribution"
        data-level-count={data?.length}
        data-values={showValues}
        data-percent={showPercentage}
      >
        MemberLevelDistribution Mock
      </div>
    ),
    KpiSummaryCard: ({ title, value, unit }: any) => (
      <div data-testid="kpi-card" data-title={title}>
        {title}: {value}{unit}
      </div>
    ),
    Card: ({ title, children, bordered }: any) => (
      <div data-testid={`card-${title?.replace(/\s+/g, '-')}`} data-bordered={bordered}>
        <h3>{title}</h3>
        {children}
      </div>
    ),
    PageShell: ({ title, subtitle, breadcrumbs, children }: any) => (
      <div data-testid="page-shell" data-title={title} data-subtitle={subtitle} data-breadcrumbs={breadcrumbs?.length}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    ),
    EmptyState: () => <div data-testid="empty-state">Empty</div>,
    LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading</div>,
  };
});

describe('MemberTierDistributionPage', () => {
  it('renders page shell with correct title and subtitle', () => {
    render(<MemberTierDistributionPage />);
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-title', '会员等级分布');
    expect(shell).toHaveAttribute('data-subtitle', expect.stringContaining('可视化'));
    expect(shell).toHaveAttribute('data-breadcrumbs', '3');
  });

  it('renders 4 KPI summary cards', () => {
    render(<MemberTierDistributionPage />);
    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards).toHaveLength(4);
    expect(kpiCards[0]).toHaveAttribute('data-title', '总会员数');
    expect(kpiCards[1]).toHaveAttribute('data-title', '高价值会员');
  });

  it('renders DonutChart with correct data', () => {
    render(<MemberTierDistributionPage />);
    const donut = screen.getByTestId('donut-chart');
    expect(donut).toBeInTheDocument();
    const data = JSON.parse(donut.getAttribute('data-data') || '[]');
    expect(data).toHaveLength(5);
    expect(data[0].name).toBe('钻石会员');
    expect(data[0].value).toBe(86);
    expect(donut.getAttribute('data-legend')).toBe('true');
    expect(donut.getAttribute('data-percent')).toBe('true');
  });

  it('renders MemberTierDistribution with correct tier count', () => {
    render(<MemberTierDistributionPage />);
    const tierDist = screen.getByTestId('member-tier-distribution');
    expect(tierDist).toHaveAttribute('data-tier-count', '5');
  });

  it('renders MemberLevelDistribution with correct level count', () => {
    render(<MemberTierDistributionPage />);
    const levelDist = screen.getByTestId('member-level-distribution');
    expect(levelDist).toHaveAttribute('data-level-count', '5');
    expect(levelDist.getAttribute('data-values')).toBe('true');
    expect(levelDist.getAttribute('data-percent')).toBe('true');
  });

  it('renders SparklineChart with 6 data points', () => {
    render(<MemberTierDistributionPage />);
    const sparkline = screen.getByTestId('sparkline-chart');
    expect(sparkline).toHaveAttribute('data-count', '6');
    expect(sparkline.getAttribute('data-color')).toBe('#3b82f6');
    expect(sparkline.getAttribute('data-area')).toBe('true');
    expect(sparkline.getAttribute('data-labels')).toBe('true');
  });

  it('renders tier analysis table with correct data', () => {
    render(<MemberTierDistributionPage />);
    // 表应该有5行数据（不含表头）
    const rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(5);

    // 第一行应该是钻石会员（按MOCK_TIERS顺序）
    const firstRow = rows[0];
    expect(firstRow.textContent).toContain('钻石会员');
    expect(firstRow.textContent).toContain('86');
    expect(firstRow.textContent).toContain('高价值');

    // 黄金会员显示"中价值"
    const goldRow = rows[2];
    expect(goldRow.textContent).toContain('黄金会员');
    expect(goldRow.textContent).toContain('中价值');
  });

  it('renders all 5 Card titles correctly', () => {
    render(<MemberTierDistributionPage />);
    // KPI cards 和 chart cards 都有对应的 test ids
    expect(screen.getByTestId('card-等级分布（饼图）')).toBeInTheDocument();
    expect(screen.getByTestId('card-等级分布（柱状图）')).toBeInTheDocument();
    expect(screen.getByTestId('card-等级占比（水平柱状）')).toBeInTheDocument();
    expect(screen.getByTestId('card-高价值会员增长趋势')).toBeInTheDocument();
    expect(screen.getByTestId('card-等级构成分析')).toBeInTheDocument();
  });

  it('calculates totalMembers correctly (86+215+378+425+182=1286)', () => {
    render(<MemberTierDistributionPage />);
    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards[0].textContent).toContain('1,286');
  });

  it('calculates highValueMembers correctly (86+215=301)', () => {
    render(<MemberTierDistributionPage />);
    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards[1].textContent).toContain('301');
  });

  it('has responsive grid layout classes', () => {
    render(<MemberTierDistributionPage />);
    // 查找 grid 容器
    const grids = document.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThanOrEqual(3); // KPI + 图表行 + 第二行
  });

  it('renders tier analysis with correct percentage values', () => {
    render(<MemberTierDistributionPage />);
    const rows = document.querySelectorAll('tbody tr');

    // 钻石会员 86/1286 ≈ 6.7%
    const diamondRow = rows[0];
    expect(diamondRow.textContent).toContain('6.7%');

    // 银卡会员 425/1286 ≈ 33.0%
    const silverRow = rows[3];
    expect(silverRow.textContent).toContain('33.0');
  });
});
