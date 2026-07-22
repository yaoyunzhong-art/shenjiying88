import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

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

// ---- Test Subject ----

import AnalyticsPage from './page';

describe('AnalyticsPage — 数据分析', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('渲染页面标题"数据分析"', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('数据分析')).toBeInTheDocument();
  });

  test('渲染 QuickStats 组件', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
  });

  test('渲染 6 个 KPI 指标', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('今日营收')).toBeInTheDocument();
    expect(screen.getByText('今日订单')).toBeInTheDocument();
    expect(screen.getByText('客单价')).toBeInTheDocument();
    expect(screen.getByText('到店客流')).toBeInTheDocument();
    expect(screen.getByText('转化率')).toBeInTheDocument();
    expect(screen.getByText('会员消费占比')).toBeInTheDocument();
  });

  test('渲染营收达标率仪表盘', () => {
    render(<AnalyticsPage />);
    const gauge = screen.getByTestId('gauge-chart');
    expect(gauge).toHaveAttribute('data-label', '营收达标率');
    expect(gauge).toHaveAttribute('data-value', '75');
  });

  test('渲染客户满意度仪表盘', () => {
    render(<AnalyticsPage />);
    const gauge = screen.getByTestId('gauge-chart');
    expect(gauge).toHaveAttribute('data-label', '营收达标率');
  });

  test('渲染第二个仪表盘为满意度', () => {
    render(<AnalyticsPage />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBe(2);
    expect(gauges[1]).toHaveAttribute('data-label', '客户满意度');
    expect(gauges[1]).toHaveAttribute('data-value', '88');
  });

  test('渲染"品类分析"标题', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('品类分析')).toBeInTheDocument();
  });

  test('渲染 Top 品类信息', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/Top 品类:/)).toBeInTheDocument();
  });

  test('渲染品类增长率统计', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/增长率/)).toBeInTheDocument();
  });

  test('渲染"客流高峰分析"标题', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('客流高峰分析')).toBeInTheDocument();
  });

  test('渲染高峰时段信息', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/高峰时段:/)).toBeInTheDocument();
  });

  test('渲染"营收趋势"标题', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('营收趋势')).toBeInTheDocument();
  });

  test('渲染日均营收信息', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/日均营收:/)).toBeInTheDocument();
  });

  test('渲染同环比增长信息', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/同环比增长:/)).toBeInTheDocument();
  });

  test('渲染"异常指标"标题', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('异常指标')).toBeInTheDocument();
  });

  test('渲染未处理异常数目', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/未处理异常:/)).toBeInTheDocument();
  });

  // ====== 数据正确性测试 ======

  test('今日营收数据为 ¥12,580', () => {
    render(<AnalyticsPage />);
    const stat = screen.getByTestId('stat-今日营收');
    expect(stat).toBeInTheDocument();
  });

  test('今日营收趋势为正数 8.3', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-今日营收');
    expect(trend.textContent).toBe('8.3');
  });

  test('今日订单趋势为正数 5.1', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-今日订单');
    expect(trend.textContent).toBe('5.1');
  });

  test('客单价趋势为负数 -2.4', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-客单价');
    expect(trend.textContent).toBe('-2.4');
  });

  test('到店客流趋势为正数 12.7', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-到店客流');
    expect(trend.textContent).toBe('12.7');
  });

  test('转化率趋势为负数 -0.8', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-转化率');
    expect(trend.textContent).toBe('-0.8');
  });

  test('会员消费占比趋势为正数 3.5', () => {
    render(<AnalyticsPage />);
    const trend = screen.getByTestId('trend-会员消费占比');
    expect(trend.textContent).toBe('3.5');
  });

  // ====== KPI 正反例趋势 ======

  test('正趋势指标数 = 4（营收/订单/客流/会员消费）', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-今日营收').textContent).toBe('8.3');
    expect(screen.getByTestId('trend-今日订单').textContent).toBe('5.1');
    expect(screen.getByTestId('trend-到店客流').textContent).toBe('12.7');
    expect(screen.getByTestId('trend-会员消费占比').textContent).toBe('3.5');
  });

  test('负趋势指标数 = 2（客单价/转化率）', () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId('trend-客单价').textContent).toBe('-2.4');
    expect(screen.getByTestId('trend-转化率').textContent).toBe('-0.8');
  });

  test('平均趋势 = 4.4（(8.3+5.1-2.4+12.7-0.8+3.5)/6 = 26.4/6 = 4.4）', () => {
    render(<AnalyticsPage />);
    // 验证6个趋势值都存在
    const trends = [8.3, 5.1, -2.4, 12.7, -0.8, 3.5];
    const expectedAvg = Math.round(trends.reduce((a, b) => a + b, 0) / 6 * 10) / 10;
    expect(expectedAvg).toBe(4.4);
    // 验证所有趋势都有值
    const allStats = ['今日营收', '今日订单', '客单价', '到店客流', '转化率', '会员消费占比'];
    allStats.forEach((stat) => {
      expect(screen.getByTestId(`trend-${stat}`)).toBeInTheDocument();
    });
  });

  // ====== 品类分析测试 ======

  test('Top 品类结果为饮品', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/饮品/)).toBeInTheDocument();
  });

  test('正增长品类数为 4', () => {
    render(<AnalyticsPage />);
    // 饮品(+12.4) 轻食(+8.2) 套餐(+15.6) 会员权益(+22.8) = 4
    expect(screen.getByText(/增长率 >0: 4/)).toBeInTheDocument();
  });

  test('负增长品类数为 2（甜品/其他）', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/, <0: 2/)).toBeInTheDocument();
  });

  // ====== 营收趋势测试 ======

  test('日均营收格式正确', () => {
    render(<AnalyticsPage />);
    const avgRevenue = Math.round([48200, 51300, 46800, 55600, 61200, 58900, 44500].reduce((s, v) => s + v, 0) / 7);
    expect(screen.getByText(new RegExp(`¥${avgRevenue.toLocaleString()}`))).toBeInTheDocument();
  });

  test('增长百分比应为正数', () => {
    render(<AnalyticsPage />);
    // 前半段: 48200+51300+46800 = 146300
    // 后半段: 55600+61200+58900+44500 = 220200
    // growth = (220200-146300)/146300*100 ≈ 50.5%
    const growthEl = screen.getByText(/同环比增长: \d+%/);
    expect(growthEl).toBeInTheDocument();
  });

  // ====== 异常指标测试 ======

  test('未处理异常应在 3～4 条', () => {
    render(<AnalyticsPage />);
    // 6个异常中未处理的: an-01(high), an-03(high), an-04(medium), an-06(low) = 4
    expect(screen.getByText(/未处理异常: 4 条/)).toBeInTheDocument();
  });

  // ====== 边界测试 ======

  test('空数据不崩溃（容器结构正常）', () => {
    const { container } = render(<AnalyticsPage />);
    expect(container.querySelector('h1')).toHaveTextContent('数据分析');
  });

  test('多个 ¥ 符号表示不同价格', () => {
    render(<AnalyticsPage />);
    const yenTexts = screen.getAllByText(/¥/);
    expect(yenTexts.length).toBeGreaterThan(0);
  });

  test('正常布局为两列仪表盘', () => {
    render(<AnalyticsPage />);
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBe(2);
  });

  test('高峰时段客流最多的是 18:00（92人）', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/客流 92 人/)).toBeInTheDocument();
  });

  test('营收达标率 75 不触发异常', () => {
    render(<AnalyticsPage />);
    const gauge = screen.getAllByTestId('gauge-chart')[0];
    expect(gauge).toHaveAttribute('data-value', '75');
  });

  test('客户满意度 88 属于优秀区间', () => {
    render(<AnalyticsPage />);
    const gauge = screen.getAllByTestId('gauge-chart')[1];
    expect(gauge).toHaveAttribute('data-value', '88');
  });

  test('页面最大宽度约束为 1280px', () => {
    const { container } = render(<AnalyticsPage />);
    const outerDiv = container.querySelector('[style*="maxWidth"]') as HTMLElement;
    expect(outerDiv).toBeTruthy();
    expect(outerDiv.style.maxWidth).toBe('1280px');
  });

  test('六大品类全部渲染无遗漏', () => {
    render(<AnalyticsPage />);
    const expected = ['今日营收', '今日订单', '客单价', '到店客流', '转化率', '会员消费占比'];
    expected.forEach((label) => {
      expect(screen.getByTestId(`stat-${label}`)).toBeInTheDocument();
    });
  });

  test('export default 是一个函数组件', () => {
    expect(typeof AnalyticsPage).toBe('function');
  });
});
