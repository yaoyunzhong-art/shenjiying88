/**
 * feedback/page.vitest.tsx — 意见反馈 FeedbackPage L2 组件测试
 * 覆盖: 页面渲染 · 分类筛选 · 状态筛选 · 搜索 · 分页 · 新建反馈 · 统计面板 · 错误态
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

import FeedbackPage from './page';

describe('FeedbackPage — 意见反馈', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: 页面渲染 ======

  test('renders page shell with correct title', () => {
    render(<FeedbackPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '意见反馈');
  });

  test('renders page heading', () => {
    render(<FeedbackPage />);
    expect(screen.getByText('💬 意见反馈')).toBeInTheDocument();
  });

  test('renders feedback count info text', () => {
    render(<FeedbackPage />);
    expect(screen.getByText(/共.*条反馈/)).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<FeedbackPage />);
    expect(screen.getByPlaceholderText(/搜索反馈内容/)).toBeInTheDocument();
  });

  test('renders category filter dropdown', () => {
    render(<FeedbackPage />);
    expect(screen.getByDisplayValue('全部分类')).toBeInTheDocument();
  });

  test('renders status filter dropdown', () => {
    render(<FeedbackPage />);
    expect(screen.getByDisplayValue('全部状态')).toBeInTheDocument();
  });

  test('renders feedback cards by default', () => {
    render(<FeedbackPage />);
    // At least the first page of 10 records rendered via category labels
    expect(screen.getByText('建议增加更多种类的游戏币套餐，比如月卡季卡年卡')).toBeInTheDocument();
  });

  test('renders pagination when more than PAGE_SIZE records exist', () => {
    render(<FeedbackPage />);
    expect(screen.getByText('← 上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页 →')).toBeInTheDocument();
  });

  test('renders "新反馈" and "统计" toggle buttons', () => {
    render(<FeedbackPage />);
    expect(screen.getByText('✏️ 新反馈')).toBeInTheDocument();
    expect(screen.getByText('📊 统计')).toBeInTheDocument();
  });

  // ====== 2. 正例: 分类筛选 ======

  test('filters by category — shows only complaints', async () => {
    render(<FeedbackPage />);
    const categorySelect = screen.getByDisplayValue('全部分类');
    fireEvent.change(categorySelect, { target: { value: 'complaint' } });
    await waitFor(() => {
      expect(screen.getByText(/抓娃娃机有故障/)).toBeInTheDocument();
    });
  });

  test('filters by category — praise shows praise records', async () => {
    render(<FeedbackPage />);
    const categorySelect = screen.getByDisplayValue('全部分类');
    fireEvent.change(categorySelect, { target: { value: 'praise' } });
    await waitFor(() => {
      expect(screen.getByText(/工作人员态度很好/)).toBeInTheDocument();
    });
  });

  test('filters by status — pending shows only pending', async () => {
    render(<FeedbackPage />);
    const statusSelect = screen.getByDisplayValue('全部状态');
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    await waitFor(() => {
      const labels = screen.getAllByText('待处理');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  test('filters by status — resolved shows resolved items', async () => {
    render(<FeedbackPage />);
    const statusSelect = screen.getByDisplayValue('全部状态');
    fireEvent.change(statusSelect, { target: { value: 'resolved' } });
    await waitFor(() => {
      expect(screen.getByText('已回复')).toBeInTheDocument();
    });
  });

  // ====== 3. 正例: 搜索 ======

  test('search filters feedback by content', async () => {
    render(<FeedbackPage />);
    const searchInput = screen.getByPlaceholderText(/搜索反馈内容/);
    fireEvent.change(searchInput, { target: { value: '游戏币' } });
    await waitFor(() => {
      expect(screen.getByText(/建议增加更多种类的游戏币套餐/)).toBeInTheDocument();
    });
  });

  test('search with non-matching keyword shows empty state', async () => {
    render(<FeedbackPage />);
    const searchInput = screen.getByPlaceholderText(/搜索反馈内容/);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NONEXISTENT_2026' } });
    await waitFor(() => {
      expect(screen.getByText('暂无反馈记录')).toBeInTheDocument();
    });
  });

  // ====== 4. 正例: 分页 ======

  test('clicking next page changes page number', async () => {
    render(<FeedbackPage />);
    const nextBtn = screen.getByText('下一页 →');
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText(/2\/4/)).toBeInTheDocument();
    });
  });

  test('clicking prev page goes back', async () => {
    render(<FeedbackPage />);
    // Go to page 2 first
    fireEvent.click(screen.getByText('下一页 →'));
    await waitFor(() => {
      expect(screen.getByText(/2\/4/)).toBeInTheDocument();
    });
    // Go back
    fireEvent.click(screen.getByText('← 上一页'));
    await waitFor(() => {
      expect(screen.getByText(/1\/4/)).toBeInTheDocument();
    });
  });

  test('prev button disabled on first page', () => {
    render(<FeedbackPage />);
    const prevBtn = screen.getByText('← 上一页');
    expect(prevBtn).toBeDisabled();
  });

  // ====== 5. 边界: 错误态 ======

  test('shows error state when simulate error button clicked', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('⚠️ 加载失败')).toBeInTheDocument();
  });

  test('error state has retry button', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  test('error state clears when retry clicked', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('⚠️ 加载失败')).toBeInTheDocument();
    fireEvent.click(screen.getByText('重试'));
    expect(screen.queryByText('⚠️ 加载失败')).not.toBeInTheDocument();
  });

  // ====== 6. 交互: 统计面板 ======

  test('clicking 统计 toggles stats panel', () => {
    render(<FeedbackPage />);
    const statsBtn = screen.getByText('📊 统计');
    fireEvent.click(statsBtn);
    expect(screen.getByText('总反馈')).toBeInTheDocument();
    expect(screen.getByText('已处理')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
    expect(screen.getByText('平均评分')).toBeInTheDocument();
  });

  test('clicking stats again hides panel', () => {
    render(<FeedbackPage />);
    const statsBtn = screen.getByText('📊 统计');
    fireEvent.click(statsBtn);
    expect(screen.getByText('总反馈')).toBeInTheDocument();
    fireEvent.click(screen.getByText('隐藏统计'));
    expect(screen.queryByText('总反馈')).not.toBeInTheDocument();
  });

  // ====== 7. 交互: 新建反馈 ======

  test('clicking 新反馈 toggles new feedback form', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('✏️ 新反馈'));
    expect(screen.getByText('📝 提交反馈')).toBeInTheDocument();
  });

  test('new feedback form has category select', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('✏️ 新反馈'));
    expect(screen.getByDisplayValue('suggestion')).toBeInTheDocument();
  });

  test('new feedback form has textarea', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('✏️ 新反馈'));
    expect(screen.getByPlaceholderText('请描述您的意见或建议...')).toBeInTheDocument();
  });

  test('new feedback form has submit button', () => {
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText('✏️ 新反馈'));
    expect(screen.getByText('提交反馈')).toBeInTheDocument();
  });

  // ====== 8. 正例: 底部统计 ======

  test('renders bottom stats bar', () => {
    render(<FeedbackPage />);
    expect(screen.getByText(/共.*条反馈/)).toBeInTheDocument();
  });

  test('renders 已处理 count in bottom stats', () => {
    render(<FeedbackPage />);
    // Multiple texts match this; just verify the text appears
    const elements = screen.getAllByText(/已处理/);
    expect(elements.length).toBeGreaterThan(0);
  });

  test('renders 待处理 count in bottom stats', () => {
    render(<FeedbackPage />);
    const elements = screen.getAllByText(/待处理/);
    expect(elements.length).toBeGreaterThan(0);
  });
});
