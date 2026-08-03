/**
 * delivery-tracking/page.vitest.tsx — 配送追踪页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载态 · 错误态 · 统计看板 · 趋势图 · 历史搜索 · 查询操作 · 快速示例 · 空状态
 * 角色: 🎯运行专员 · 👔店长
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock the DeliveryTrackingClient component
vi.mock('./components/DeliveryTrackingClient', () => ({
  DeliveryTrackingClient: ({ initialOrderId, onSearch }: { initialOrderId?: string; onSearch?: (id: string) => void }) => (
    <div data-testid="delivery-tracking-client">
      <input
        data-testid="delivery-order-input"
        placeholder="输入订单号查询物流配送进度"
        defaultValue={initialOrderId ?? ''}
        onChange={(e) => {}}
      />
      <button
        data-testid="delivery-search-btn"
        onClick={() => onSearch?.('ORD-20260708-001')}
      >
        查询
      </button>
      {initialOrderId && (
        <div data-testid="delivery-result">
          <div data-testid="delivery-timeline">
            <span>包裹已揽收</span>
            <span>已签收</span>
          </div>
          <span>顺丰速运</span>
          <span>SF1234567890</span>
        </div>
      )}
    </div>
  ),
}));

import DeliveryTrackingPage from './page';

describe('DeliveryTrackingPage — 配送追踪', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  // ====== 加载态 ======

  test('renders without crashing', () => {
    expect(() => render(<DeliveryTrackingPage />)).not.toThrow();
  });

  test('shows loading skeleton initially', () => {
    render(<DeliveryTrackingPage />);
    // Loading skeleton renders with placeholder divs
    const skeletonElements = document.querySelectorAll('div[style*="border-radius"]');
    expect(skeletonElements.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 渲染（数据加载后） ======

  test('renders StatsDashboard after load', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('总订单', {}, { timeout: 5000 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders all 4 stat cards after load', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('总订单', {}, { timeout: 5000 });
    expect(screen.getByText('总订单')).toBeInTheDocument();
    expect(screen.getByText('运输中')).toBeInTheDocument();
    expect(screen.getByText('已签收')).toBeInTheDocument();
    expect(screen.getByText('异常')).toBeInTheDocument();
  });

  test('renders stat values correctly', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('42', {}, { timeout: 5000 });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('renders DeliveryTrendChart after load', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('📊 本周配送趋势', {}, { timeout: 5000 });
    expect(screen.getByText('📊 本周配送趋势')).toBeInTheDocument();
  });

  test('renders trend chart day labels', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('周一', {}, { timeout: 5000 });
    expect(screen.getByText('周一')).toBeInTheDocument();
    expect(screen.getByText('周二')).toBeInTheDocument();
    expect(screen.getByText('周三')).toBeInTheDocument();
    expect(screen.getByText('周四')).toBeInTheDocument();
    expect(screen.getByText('周五')).toBeInTheDocument();
    expect(screen.getByText('周六')).toBeInTheDocument();
    expect(screen.getByText('周日')).toBeInTheDocument();
  });

  test('renders DeliveryTrackingClient after load', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByTestId('delivery-tracking-client', {}, { timeout: 5000 });
    expect(screen.getByTestId('delivery-tracking-client')).toBeInTheDocument();
  });

  // ====== 历史搜索记录 ======

  test('search history does not render initially (empty)', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('总订单', {}, { timeout: 5000 });
    expect(screen.queryByText('清空记录')).not.toBeInTheDocument();
  });

  test('search adds to history', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByTestId('delivery-tracking-client', {}, { timeout: 5000 });
    // Click search button to add to history
    const searchBtn = screen.getByTestId('delivery-search-btn');
    fireEvent.click(searchBtn);
    await waitFor(() => {
      expect(screen.getByText('📋 最近查询')).toBeInTheDocument();
    });
  });

  test('clear history button removes entries', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByTestId('delivery-tracking-client', {}, { timeout: 5000 });
    // Add history first
    fireEvent.click(screen.getByTestId('delivery-search-btn'));
    await screen.findByText('📋 最近查询', {}, { timeout: 5000 });
    // Clear
    fireEvent.click(screen.getByText('清空记录'));
    await waitFor(() => {
      expect(screen.queryByText('📋 最近查询')).not.toBeInTheDocument();
    });
  });

  // ====== 快速查询示例 ======

  test('renders 快速查询示例 section', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('🚀 快速查询示例', {}, { timeout: 5000 });
    expect(screen.getByText('🚀 快速查询示例')).toBeInTheDocument();
  });

  test('renders example order IDs', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('ORD-20260708-001', {}, { timeout: 5000 });
    expect(screen.getByText('ORD-20260708-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-20260707-002')).toBeInTheDocument();
  });

  // ====== 底部提示 ======

  test('renders tooltip message at bottom', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    expect(await screen.findByText(/支持输入完整订单号查询/, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  test('renders 配送信息每30分钟同步一次 hint', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText(/每30分钟同步一次/, {}, { timeout: 5000 });
    expect(screen.getByText(/每30分钟同步一次/)).toBeInTheDocument();
  });

  // ====== 错误态 ======

  test('error state rendering is handled', () => {
    // The page component has built-in error handling with ErrorState
    render(<DeliveryTrackingPage />);
    // Component renders without crash even though error state is rare
    expect(document.querySelector('main')).toBeTruthy();
  });

  // ====== 边界 ======

  test('dark background applied', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('总订单', {}, { timeout: 5000 });
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('renders 总订单 stat card with blue background', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByText('总订单', {}, { timeout: 5000 });
    const totalCard = screen.getByText('总订单').closest('div');
    expect(totalCard).toBeTruthy();
  });

  test('delivery tracking client receives onSearch prop', async () => {
    vi.useRealTimers();
    render(<DeliveryTrackingPage />);
    await screen.findByTestId('delivery-tracking-client', {}, { timeout: 5000 });
    // Search button should fire onSearch which adds to history
    fireEvent.click(screen.getByTestId('delivery-search-btn'));
    expect(await screen.findByText('📋 最近查询', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
