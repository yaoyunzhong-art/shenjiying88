/**
 * insights/page.vitest.tsx — 数据洞察 DataInsights L2 组件测试
 * 覆盖: 概览渲染 · 分区切换 · 会员分布 · 设备状态 · 告警面板 · AI分析 · 日志 · 统计
 * 角色: 👤会员 / 👔店长
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('@m5/ui', () => ({
  PageShell: vi.fn(({ children, title }: any) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  )),
  AnomalyAlertPanel: vi.fn(({ alerts }: any) => (
    <div data-testid="anomaly-panel" data-alert-count={alerts?.length || 0}>AnomalyPanel</div>
  )),
  DeviceStatusPanel: vi.fn(({ devices }: any) => (
    <div data-testid="device-status-panel" data-device-count={devices?.length || 0}>DeviceStatus</div>
  )),
  GaugeChart: vi.fn(({ segments, value, size, label }: any) => (
    <div data-testid="gauge-chart" data-value={value} data-label={label}>Gauge:{value}</div>
  )),
  HeatmapChart: vi.fn(({ data, rowLabels, colLabels }: any) => (
    <div data-testid="heatmap-chart" data-rows={(rowLabels || []).join(',')} data-cols={(colLabels || []).join(',')}>
      Heatmap ({data?.length || 0} cells)
    </div>
  )),
  MemberLevelDistribution: vi.fn(({ data }: any) => (
    <div data-testid="member-level-dist" data-count={data?.length || 0}>MemberLevelDist</div>
  )),
}));

// ── Test Subject ──

import DataInsights from './page';

describe('DataInsights — 数据洞察', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: 页面渲染 ======

  test('renders page title', () => {
    render(<DataInsights />);
    expect(screen.getByText('📊 数据洞察')).toBeInTheDocument();
  });

  test('renders page subtitle', () => {
    render(<DataInsights />);
    expect(screen.getByText(/门店运营数据总览/)).toBeInTheDocument();
  });

  test('renders all 4 stat cards', () => {
    render(<DataInsights />);
    expect(screen.getByText('会员总数')).toBeInTheDocument();
    expect(screen.getByText('设备在线率')).toBeInTheDocument();
    expect(screen.getByText('异常告警')).toBeInTheDocument();
    expect(screen.getByText('高价值占比')).toBeInTheDocument();
  });

  // ====== 2. 正例: 分区导航 ======

  test('renders all section tabs', () => {
    render(<DataInsights />);
    expect(screen.getByText('📊 概览')).toBeInTheDocument();
    expect(screen.getByText('👥 会员')).toBeInTheDocument();
    expect(screen.getByText('🖥️ 设备')).toBeInTheDocument();
    expect(screen.getByText('🔔 告警')).toBeInTheDocument();
  });

  test('default section is overview', () => {
    render(<DataInsights />);
    expect(screen.getByText('设备运行状态')).toBeInTheDocument();
  });

  test('clicking members tab shows member section', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('👥 会员'));
    expect(screen.getByText('📊 会员等级分布')).toBeInTheDocument();
  });

  test('clicking devices tab shows device section', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🖥️ 设备'));
    expect(screen.getByText('🖥️ 设备在线状态')).toBeInTheDocument();
  });

  test('clicking alerts tab shows alert section', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🔔 告警'));
    expect(screen.getByText('🔔 异常告警')).toBeInTheDocument();
  });

  // ====== 3. 正例: GaugeChart 渲染 ======

  test('overview section renders gauge charts', () => {
    render(<DataInsights />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBeGreaterThan(0);
  });

  // ====== 4. 正例: HeatmapChart 渲染 ======

  test('renders heatmap chart in overview', () => {
    render(<DataInsights />);
    expect(screen.getByText(/Heatmap/)).toBeInTheDocument();
  });

  // ====== 5. 正例: 会员区 ======

  test('members section shows MemberLevelDistribution', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('👥 会员'));
    expect(screen.getByTestId('member-level-dist')).toBeInTheDocument();
  });

  test('members section shows level count cards', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('👥 会员'));
    expect(screen.getByText('钻石会员')).toBeInTheDocument();
    expect(screen.getByText('黄金会员')).toBeInTheDocument();
    expect(screen.getByText('银卡会员')).toBeInTheDocument();
    expect(screen.getByText('铜卡会员')).toBeInTheDocument();
    expect(screen.getByText('普通会员')).toBeInTheDocument();
  });

  // ====== 6. 正例: 设备区 ======

  test('devices section shows filter buttons', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🖥️ 设备'));
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('在线')).toBeInTheDocument();
    expect(screen.getByText('注意')).toBeInTheDocument();
    expect(screen.getByText('离线')).toBeInTheDocument();
    expect(screen.getByText('维护')).toBeInTheDocument();
  });

  test('devices section shows DeviceStatusPanel', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🖥️ 设备'));
    expect(screen.getByTestId('device-status-panel')).toBeInTheDocument();
  });

  test('devices section renders table with device data', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🖥️ 设备'));
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('类型')).toBeInTheDocument();
    expect(screen.getByText('位置')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  // ====== 7. 正例: 告警区 ======

  test('alerts section shows AnomalyAlertPanel', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🔔 告警'));
    expect(screen.getByTestId('anomaly-panel')).toBeInTheDocument();
  });

  test('alerts section shows unprocessed count', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🔔 告警'));
    expect(screen.getByText(/条未处理/)).toBeInTheDocument();
  });

  test('alerts section shows severity breakdown', () => {
    render(<DataInsights />);
    fireEvent.click(screen.getByText('🔔 告警'));
    expect(screen.getByText(/高危/)).toBeInTheDocument();
  });

  // ====== 8. 正例: AI分析面板 ======

  test('renders AI analysis panel', () => {
    render(<DataInsights />);
    expect(screen.getByText('🤖 AI 智能分析')).toBeInTheDocument();
  });

  test('AI panel shows member growth prediction', () => {
    render(<DataInsights />);
    expect(screen.getByText('📈 会员增长预测')).toBeInTheDocument();
  });

  test('AI panel shows device risk reminder', () => {
    render(<DataInsights />);
    expect(screen.getByText('⚠️ 设备风险提醒')).toBeInTheDocument();
  });

  test('AI panel shows operation optimization suggestion', () => {
    render(<DataInsights />);
    expect(screen.getByText('💡 运营优化建议')).toBeInTheDocument();
  });

  test('AI panel shows peak hour warning', () => {
    render(<DataInsights />);
    expect(screen.getByText('⏰ 峰值时段预警')).toBeInTheDocument();
  });

  // ====== 9. 正例: 其它统计面板 ======

  test('renders device failure frequency distribution', () => {
    render(<DataInsights />);
    expect(screen.getByText('🔧 设备故障频率分布')).toBeInTheDocument();
  });

  test('renders quick summary statistics', () => {
    render(<DataInsights />);
    expect(screen.getByText('设备在线率')).toBeInTheDocument();
    expect(screen.getByText('高价值会员占比')).toBeInTheDocument();
    expect(screen.getByText('未处理告警')).toBeInTheDocument();
  });

  test('renders activity log section', () => {
    render(<DataInsights />);
    expect(screen.getByText('📋 实时活动日志')).toBeInTheDocument();
  });

  test('renders activity log entries', () => {
    render(<DataInsights />);
    expect(screen.getByText(/会员 张伟 充值/)).toBeInTheDocument();
    expect(screen.getByText(/新会员注册: 李明/)).toBeInTheDocument();
  });

  test('renders device type distribution', () => {
    render(<DataInsights />);
    expect(screen.getByText('📊 设备类型分布')).toBeInTheDocument();
  });

  test('renders member activity panel', () => {
    render(<DataInsights />);
    expect(screen.getByText('👥 会员活跃度')).toBeInTheDocument();
  });

  test('renders device running trend', () => {
    render(<DataInsights />);
    expect(screen.getByText('🕒 设备运行趋势（近7天）')).toBeInTheDocument();
  });

  test('renders sales time distribution', () => {
    render(<DataInsights />);
    expect(screen.getByText('⏱ 销售时段热点')).toBeInTheDocument();
  });

  test('renders footer with data update info', () => {
    render(<DataInsights />);
    expect(screen.getByText(/数据洞察系统/)).toBeInTheDocument();
  });
});
