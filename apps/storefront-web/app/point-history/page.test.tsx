/**
 * point-history/page.vitest.tsx — 积分历史 PointHistoryPage L2 组件测试
 * 覆盖: 页面渲染 · 积分摘要 · 类型筛选 · 分类筛选 · 搜索 · 分页 · 统计面板 · 错误态
 * 角色: 👤会员 / 👔店长
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('@m5/ui', () => ({
  PageShell: vi.fn(({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  )),
  StatusBadge: vi.fn(({ status, label }: any) => (
    <span data-testid="status-badge" data-status={status}>{label}</span>
  )),
}));

// ── Test Subject ──

import PointHistoryPage from './page';

describe('PointHistoryPage — 积分历史', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: 页面渲染 ======

  test('renders page shell with correct title', () => {
    render(<PointHistoryPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '积分历史');
  });

  test('renders page heading', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText('🎯 积分历史')).toBeInTheDocument();
  });

  test('renders record count info text', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText(/共.*条记录/)).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<PointHistoryPage />);
    expect(screen.getByPlaceholderText(/搜索描述或订单号/)).toBeInTheDocument();
  });

  test('renders type filter dropdown', () => {
    render(<PointHistoryPage />);
    expect(screen.getByDisplayValue('全部类型')).toBeInTheDocument();
  });

  test('renders category filter dropdown', () => {
    render(<PointHistoryPage />);
    expect(screen.getByDisplayValue('全部')).toBeInTheDocument();
  });

  test('renders "统计" and "模拟错误" buttons', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText('📊 统计')).toBeInTheDocument();
    expect(screen.getByText('模拟错误')).toBeInTheDocument();
  });

  // ====== 2. 正例: 积分摘要 ======

  test('renders point summary section', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText('当前积分')).toBeInTheDocument();
    expect(screen.getByText('累计获得')).toBeInTheDocument();
    expect(screen.getByText('累计支出')).toBeInTheDocument();
    expect(screen.getByText('总记录')).toBeInTheDocument();
  });

  test('summary shows balance value', () => {
    render(<PointHistoryPage />);
    // The balance is earned - spent from ALL_RECORDS (38 records)
    const balanceElement = screen.getAllByText(/^\d[\d,]*$/);
    expect(balanceElement.length).toBeGreaterThan(0);
  });

  // ====== 3. 正例: 记录列表 ======

  test('renders record rows by default', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText('消费获得')).toBeInTheDocument();
  });

  test('renders pagination when more than PAGE_SIZE records', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText('← 上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页 →')).toBeInTheDocument();
  });

  // ====== 4. 正例: 类型筛选 ======

  test('filters by type — earn shows earned records', async () => {
    render(<PointHistoryPage />);
    const typeSelect = screen.getByDisplayValue('全部类型');
    fireEvent.change(typeSelect, { target: { value: 'earn' } });
    await waitFor(() => {
      // Earn type has green "+" color
      const points = screen.getAllByText(/^\+/);
      expect(points.length).toBeGreaterThan(0);
    });
  });

  test('filters by type — spend shows spent records', async () => {
    render(<PointHistoryPage />);
    const typeSelect = screen.getByDisplayValue('全部类型');
    fireEvent.change(typeSelect, { target: { value: 'spend' } });
    await waitFor(() => {
      const typeLabels = screen.getAllByText('支出');
      expect(typeLabels.length).toBeGreaterThan(0);
    });
  });

  test('filters by type — expire shows expired records', async () => {
    render(<PointHistoryPage />);
    const typeSelect = screen.getByDisplayValue('全部类型');
    fireEvent.change(typeSelect, { target: { value: 'expire' } });
    await waitFor(() => {
      expect(screen.getByText('积过期')).toBeInTheDocument();
    });
  });

  // ====== 5. 正例: 分类筛选 ======

  test('filters by category', async () => {
    render(<PointHistoryPage />);
    const catSelect = screen.getByDisplayValue('全部');
    fireEvent.change(catSelect, { target: { value: '活动' } });
    await waitFor(() => {
      expect(screen.getByText('生日双倍积分')).toBeInTheDocument();
    });
  });

  // ====== 6. 正例: 搜索 ======

  test('search filters records by description', async () => {
    render(<PointHistoryPage />);
    const searchInput = screen.getByPlaceholderText(/搜索描述或订单号/);
    fireEvent.change(searchInput, { target: { value: '签到' } });
    await waitFor(() => {
      expect(screen.getByText('签到奖励')).toBeInTheDocument();
    });
  });

  test('search with non-matching keyword shows empty state', async () => {
    render(<PointHistoryPage />);
    const searchInput = screen.getByPlaceholderText(/搜索描述或订单号/);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NONEXISTENT' } });
    await waitFor(() => {
      expect(screen.getByText('暂无积分记录')).toBeInTheDocument();
    });
  });

  // ====== 7. 正例: 分页交互 ======

  test('clicking next page changes page indicator', async () => {
    render(<PointHistoryPage />);
    const nextBtn = screen.getByText('下一页 →');
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText(/页/)).toBeInTheDocument();
    });
  });

  test('prev button disabled on first page', () => {
    render(<PointHistoryPage />);
    const prevBtn = screen.getByText('← 上一页');
    expect(prevBtn).toBeDisabled();
  });

  // ====== 8. 边界: 错误态 ======

  test('shows error state when simulate error button clicked', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('⚠️ 加载失败')).toBeInTheDocument();
  });

  test('error state has retry button', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  test('error state clears when retry clicked', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('⚠️ 加载失败')).toBeInTheDocument();
    fireEvent.click(screen.getByText('重试'));
    expect(screen.queryByText('⚠️ 加载失败')).not.toBeInTheDocument();
  });

  // ====== 9. 交互: 统计面板 ======

  test('clicking 统计 toggles stats panel', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('📊 统计'));
    expect(screen.getByText('📊 分类统计')).toBeInTheDocument();
  });

  test('stats panel shows category breakdown', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('📊 统计'));
    expect(screen.getByText('消费')).toBeInTheDocument();
  });

  test('clicking 隐藏统计 hides panel', () => {
    render(<PointHistoryPage />);
    fireEvent.click(screen.getByText('📊 统计'));
    expect(screen.getByText('📊 分类统计')).toBeInTheDocument();
    fireEvent.click(screen.getByText('隐藏统计'));
    expect(screen.queryByText('📊 分类统计')).not.toBeInTheDocument();
  });

  // ====== 10. 正例: 底部统计 ======

  test('renders bottom info bar', () => {
    render(<PointHistoryPage />);
    expect(screen.getByText(/共.*条记录/)).toBeInTheDocument();
    expect(screen.getByText(/本页.*条/)).toBeInTheDocument();
    expect(screen.getByText(/页码/)).toBeInTheDocument();
  });
});
