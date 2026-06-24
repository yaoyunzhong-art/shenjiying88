import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TierDistributionChart } from './TierDistributionChart';
import type { TierDistributionChartProps } from './TierDistributionChart';

describe('TierDistributionChart', () => {
  const defaultProps: TierDistributionChartProps = {
    tiers: [
      { key: 'diamond', label: '钻石', count: 5, color: '#a78bfa' },
      { key: 'gold', label: '黄金', count: 15, color: '#fbbf24' },
      { key: 'silver', label: '白银', count: 25, color: '#94a3b8' },
      { key: 'bronze', label: '青铜', count: 10, color: '#d97706' },
      { key: 'standard', label: '标准', count: 5, color: '#6b7280' },
    ],
    total: 60,
  };

  it('renders the chart container', () => {
    const { container } = render(<TierDistributionChart {...defaultProps} />);
    expect(container.querySelector('[data-testid="tier-dist-chart"]')).toBeTruthy();
  });

  it('renders chart title when provided', () => {
    render(<TierDistributionChart {...defaultProps} title="会员等级分布" />);
    expect(screen.getByTestId('tier-dist-chart-title')).toHaveTextContent('会员等级分布');
  });

  it('renders correct number of tier segments', () => {
    const { container } = render(<TierDistributionChart {...defaultProps} />);
    const segments = container.querySelectorAll('[data-testid^="tier-dist-segment-"]');
    expect(segments.length).toBe(5);
  });

  it('renders tier labels in legend', () => {
    render(<TierDistributionChart {...defaultProps} />);
    expect(screen.getByText('钻石')).toBeTruthy();
    expect(screen.getByText('黄金')).toBeTruthy();
    expect(screen.getByText('白银')).toBeTruthy();
    expect(screen.getByText('青铜')).toBeTruthy();
    expect(screen.getByText('标准')).toBeTruthy();
  });

  it('renders legend with correct counts and percentages', () => {
    render(<TierDistributionChart {...defaultProps} />);
    expect(screen.getByTestId('tier-dist-legend-diamond').textContent).toMatch(/5/);
    expect(screen.getByTestId('tier-dist-legend-diamond').textContent).toMatch(/8\.?3?%?/);
    expect(screen.getByTestId('tier-dist-legend-gold').textContent).toMatch(/15/);
  });

  it('shows empty state when no tier data', () => {
    render(<TierDistributionChart tiers={[]} total={0} />);
    expect(screen.getByTestId('tier-dist-chart-empty')).toHaveTextContent('暂无等级分布数据');
  });

  it('shows custom empty text', () => {
    render(
      <TierDistributionChart
        tiers={[]}
        total={0}
        emptyText="尚未生成等级数据"
      />
    );
    expect(screen.getByTestId('tier-dist-chart-empty')).toHaveTextContent('尚未生成等级数据');
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <TierDistributionChart {...defaultProps} loading />
    );
    expect(container.querySelector('[data-testid="tier-dist-chart-loading"]')).toBeTruthy();
  });

  it('renders total label in center when showTotalInCenter is true', () => {
    render(<TierDistributionChart {...defaultProps} showTotalInCenter />);
    expect(screen.getByTestId('tier-dist-chart-total')).toBeTruthy();
    expect(screen.getByTestId('tier-dist-chart-total-label')).toHaveTextContent('总会员');
  });

  it('renders inner arcs for smaller radii', () => {
    const { container } = render(
      <TierDistributionChart {...defaultProps} size={200} />
    );
    const segments = container.querySelectorAll('[data-testid^="tier-dist-segment-"]');
    expect(segments.length).toBe(5);
  });

  it('handles a single tier that occupies 100%', () => {
    const { container } = render(
      <TierDistributionChart
        tiers={[{ key: 'standard', label: '标准', count: 60, color: '#6b7280' }]}
        total={60}
      />
    );
    const segments = container.querySelectorAll('[data-testid^="tier-dist-segment-"]');
    expect(segments.length).toBe(1);
    expect(container.querySelector('[data-testid="tier-dist-chart"]')).toBeTruthy();
  });

  it('accepts custom data-testid', () => {
    const { container } = render(
      <TierDistributionChart {...defaultProps} data-testid="my-chart" />
    );
    expect(container.querySelector('[data-testid="my-chart"]')).toBeTruthy();
  });
});
