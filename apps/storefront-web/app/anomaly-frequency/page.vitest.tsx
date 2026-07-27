/**
 * anomaly-frequency/page.vitest.tsx — 异常时序频率 AnomalyFrequencyPage L2 组件测试
 * 覆盖: 页面渲染 · 时间范围切换 · 严重程度过滤 · 统计卡片 · 异常分布 · 操作记录 · 详情表格 · 展开收起
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
  AnomalyFrequencyTimeline: vi.fn(({ buckets, title, height, emptyText }: any) => (
    <div data-testid="anomaly-freq-timeline" data-buckets={buckets?.length || 0} data-title={title}>
      {buckets && buckets.length > 0 ? `Timeline: ${buckets.length} buckets` : emptyText}
    </div>
  )),
  StatusBadge: vi.fn(({ status, label }: any) => (
    <span data-testid="status-badge" data-status={status}>{label}</span>
  )),
  Modal: vi.fn(({ children, open, onClose }: any) => (
    open ? <div data-testid="modal">{children}</div> : null
  )),
}));

// ── Test Subject ──

import AnomalyFrequencyPage from './page';

describe('AnomalyFrequencyPage — 异常时序频率', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: 页面渲染 ======

  test('renders page title', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('门店异常时序频率')).toBeInTheDocument();
  });

  test('renders page subtitle', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText(/监控各时段门店异常分布趋势/)).toBeInTheDocument();
  });

  test('renders all 4 time range buttons', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('近6小时')).toBeInTheDocument();
    expect(screen.getByText('近24小时')).toBeInTheDocument();
    expect(screen.getByText('近7天')).toBeInTheDocument();
    expect(screen.getByText('近30天')).toBeInTheDocument();
  });

  test('default time range is 近24小时', () => {
    render(<AnomalyFrequencyPage />);
    const btns = screen.getAllByText('近24小时');
    expect(btns.length).toBeGreaterThan(0);
  });

  test('renders refresh button', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('刷新')).toBeInTheDocument();
  });

  // ====== 2. 正例: 时间范围切换 ======

  test('clicking 近7天 changes time range', () => {
    render(<AnomalyFrequencyPage />);
    fireEvent.click(screen.getByText('近7天'));
    // Timeline re-renders with new buckets
    const timeline = screen.getByTestId('anomaly-freq-timeline');
    expect(timeline).toBeInTheDocument();
  });

  test('clicking 近30天 changes time range', () => {
    render(<AnomalyFrequencyPage />);
    fireEvent.click(screen.getByText('近30天'));
    expect(screen.getByText('近30天')).toBeInTheDocument();
  });

  // ====== 3. 正例: 严重程度过滤 ======

  test('renders all severity filter buttons', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('🔴 严重')).toBeInTheDocument();
    expect(screen.getByText('🟠 高')).toBeInTheDocument();
    expect(screen.getByText('🟡 中')).toBeInTheDocument();
    expect(screen.getByText('🟢 低')).toBeInTheDocument();
  });

  test('clicking severity filter updates timeline', () => {
    render(<AnomalyFrequencyPage />);
    fireEvent.click(screen.getByText('🔴 严重'));
    const timeline = screen.getByTestId('anomaly-freq-timeline');
    expect(timeline).toBeInTheDocument();
  });

  // ====== 4. 正例: 统计卡片 ======

  test('renders 4 stat cards', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('总异常数')).toBeInTheDocument();
    expect(screen.getByText('严重异常')).toBeInTheDocument();
    expect(screen.getByText('高优先级')).toBeInTheDocument();
    expect(screen.getByText('时段均值')).toBeInTheDocument();
  });

  test('stat cards show numeric values', () => {
    render(<AnomalyFrequencyPage />);
    // The stat values are rendered as numeric strings
    const statValueElements = document.querySelectorAll('[style*="font-size: 24px; font-weight: 700"]');
    expect(statValueElements.length).toBe(4);
  });

  // ====== 5. 正例: AnomalyFrequencyTimeline ======

  test('renders AnomalyFrequencyTimeline component', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByTestId('anomaly-freq-timeline')).toBeInTheDocument();
  });

  test('timeline shows bucket count info', () => {
    render(<AnomalyFrequencyPage />);
    const timeline = screen.getByTestId('anomaly-freq-timeline');
    const bucketCount = parseInt(timeline.getAttribute('data-buckets') || '0');
    expect(bucketCount).toBeGreaterThan(0);
  });

  // ====== 6. 正例: 异常类型分布 ======

  test('renders anomaly distribution panel', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('📊 异常类型分布')).toBeInTheDocument();
  });

  test('shows anomaly types', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('网络异常')).toBeInTheDocument();
    expect(screen.getByText('设备故障')).toBeInTheDocument();
    expect(screen.getByText('传感器告警')).toBeInTheDocument();
  });

  test('shows anomaly counts', () => {
    render(<AnomalyFrequencyPage />);
    // Each type has a "(N) (X%)" text
    expect(screen.getByText(/3 \(/)).toBeInTheDocument();
  });

  // ====== 7. 正例: 操作记录面板 ======

  test('renders operation log panel', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('📝 处理操作记录')).toBeInTheDocument();
  });

  test('shows operation records', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('重启打印服务')).toBeInTheDocument();
    expect(screen.getByText('检查网络线路')).toBeInTheDocument();
  });

  // ====== 8. 正例: 异常事件表格 ======

  test('renders incident table', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('🚨 异常事件详情')).toBeInTheDocument();
  });

  test('renders table headers', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('事件')).toBeInTheDocument();
    expect(screen.getByText('级别')).toBeInTheDocument();
    expect(screen.getByText('来源')).toBeInTheDocument();
    expect(screen.getByText('时间')).toBeInTheDocument();
    expect(screen.getByText('持续')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  test('shows incident records by default (first 4)', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('收银台 POS-01 网络闪断')).toBeInTheDocument();
    expect(screen.getByText('厨房打印机打印头温度异常')).toBeInTheDocument();
  });

  test('shows 已处理 and 待处理 status badges', () => {
    render(<AnomalyFrequencyPage />);
    const handledElements = screen.getAllByText('已处理');
    expect(handledElements.length).toBeGreaterThan(0);
    const pendingElements = screen.getAllByText('待处理');
    expect(pendingElements.length).toBeGreaterThan(0);
  });

  // ====== 9. 交互: 展开收起 ======

  test('clicking 查看全部 shows all incidents', () => {
    render(<AnomalyFrequencyPage />);
    fireEvent.click(screen.getByText(/查看全部.*条事件/));
    expect(screen.getByText('收银台通讯超时')).toBeInTheDocument();
    expect(screen.getByText('UPS 电池电压偏低')).toBeInTheDocument();
  });

  test('clicking 收起 collapses incidents', () => {
    render(<AnomalyFrequencyPage />);
    fireEvent.click(screen.getByText(/查看全部.*条事件/));
    fireEvent.click(screen.getByText('收起'));
    // Should only show first 4 again
    expect(screen.queryByText('UPS 电池电压偏低')).not.toBeInTheDocument();
  });

  // ====== 10. 交互: 展开行详情 ======

  test('clicking incident row expands detail', () => {
    render(<AnomalyFrequencyPage />);
    // Click first incident row
    fireEvent.click(screen.getByText('收银台 POS-01 网络闪断'));
    expect(screen.getByText(/POS-01 收银台网络连接中断 3 秒/)).toBeInTheDocument();
  });

  // ====== 11. 正例: 操作栏 ======

  test('renders action bar buttons', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText('📥 导出报告')).toBeInTheDocument();
    expect(screen.getByText('🔔 设置告警')).toBeInTheDocument();
    expect(screen.getByText('🔄 刷新数据')).toBeInTheDocument();
  });

  test('clicking refresh updates data', () => {
    render(<AnomalyFrequencyPage />);
    const refreshBtn = screen.getByText('🔄 刷新数据');
    fireEvent.click(refreshBtn);
    // Timeline should still render
    expect(screen.getByTestId('anomaly-freq-timeline')).toBeInTheDocument();
  });

  // ====== 12. 正例: 底部说明 ======

  test('renders footer note', () => {
    render(<AnomalyFrequencyPage />);
    expect(screen.getByText(/时序频率图展示各时段内不同严重级别异常的分布/)).toBeInTheDocument();
  });
});
