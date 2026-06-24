/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import InsightsPage from './page';

// ============================================================
// Mock @m5/ui components — just verify they render title text
// ============================================================
jest.mock('@m5/ui', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MockMemberDistribution = (_props: Record<string, unknown>) => (
    <div data-testid="member-level-distribution">会员等级分布</div>
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MockHeatmapChart = (_props: Record<string, unknown>) => (
    <div data-testid="heatmap-chart">设备活跃时段热力图</div>
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MockGaugeChart = (props: Record<string, unknown>) => (
    <div data-testid="gauge-chart">
      {String(props.suffix)} - {String(props.value)}
    </div>
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MockAnomalyAlertPanel = (_props: Record<string, unknown>) => (
    <div data-testid="anomaly-panel">{String(_props.title)}</div>
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MockDevicePanel = (_props: Record<string, unknown>) => (
    <div data-testid="device-panel">{String(_props.title)}</div>
  );

  return {
    MemberLevelDistribution: MockMemberDistribution,
    HeatmapChart: MockHeatmapChart,
    GaugeChart: MockGaugeChart,
    AnomalyAlertPanel: MockAnomalyAlertPanel,
    DeviceStatusPanel: MockDevicePanel,
  };
});

describe('InsightsPage', () => {
  it('renders page title and section labels', () => {
    render(<InsightsPage />);
    expect(screen.getByText('📊 数据洞察')).toBeTruthy();
    expect(screen.getByText('门店运营数据实时看板')).toBeTruthy();
  });

  it('renders all six metric cards', () => {
    render(<InsightsPage />);
    expect(screen.getByText('门店设备总数')).toBeTruthy();
    expect(screen.getByText('设备在线率')).toBeTruthy();
    expect(screen.getByText('警告/故障')).toBeTruthy();
    expect(screen.getByText('平均运行时长')).toBeTruthy();
    expect(screen.getByText('会员总数')).toBeTruthy();
    expect(screen.getByText('高价值会员率')).toBeTruthy();
  });

  it('renders AI visualization components', () => {
    render(<InsightsPage />);
    expect(screen.getByTestId('member-level-distribution')).toBeTruthy();
    expect(screen.getByTestId('heatmap-chart')).toBeTruthy();
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges).toHaveLength(3);
  });

  it('renders anomaly alert panel and device panel', () => {
    render(<InsightsPage />);
    expect(screen.getByTestId('anomaly-panel')).toBeTruthy();
    expect(screen.getByTestId('device-panel')).toBeTruthy();
  });

  it('shows mock member count in metric cards', () => {
    render(<InsightsPage />);
    expect(screen.getByText('560')).toBeTruthy();
  });

  it('renders section labels', () => {
    render(<InsightsPage />);
    expect(screen.getByText(/会员.*设备分析/)).toBeTruthy();
    expect(screen.getByText(/运行状况.*告警/)).toBeTruthy();
    expect(screen.getByText(/设备.*告警详情/)).toBeTruthy();
  });
});
