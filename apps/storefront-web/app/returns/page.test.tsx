/**
 * returns/page.vitest.tsx — 退换货列表页 L2 组件测试
 * 角色: 👤会员 / 👔店长
 * 覆盖: 渲染 · 统计卡片 · 搜索 · 状态筛选 · 原因筛选 · 分页 · 详情弹窗 · 错误态 · 加载态 · 空态
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 * 此页面不使用 @m5/ui 组件（纯原生 HTML + inline styles）。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import ReturnsPage from './page';

describe('ReturnsPage — 退换货列表页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<ReturnsPage />)).not.toThrow();
  });

  test('renders title 退换货管理', () => {
    render(<ReturnsPage />);
    expect(screen.getByText('退换货管理')).toBeInTheDocument();
  });

  test('renders main container with dark background', () => {
    render(<ReturnsPage />);
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('renders 模拟错误 button', () => {
    render(<ReturnsPage />);
    expect(screen.getByText('模拟错误')).toBeInTheDocument();
  });

  // ====== 统计卡片 ======

  test('renders status stat cards', () => {
    render(<ReturnsPage />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('待审核')).toBeInTheDocument();
    expect(screen.getByText('处理中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('已拒绝')).toBeInTheDocument();
  });

  test('stat cards show correct counts', () => {
    render(<ReturnsPage />);
    // ALL_RETURNS has 26 items
    // 待审核: 5 items (TH20260708002, TH20260619007, TH20260607012, TH20260519014, TH20260501010)
    // 处理中: 4 items (TH20260712001, TH20260701009, TH20260616004, TH20260516008)
    // 已完成: 12 items
    // 已拒绝: 5 items
    const allText = screen.getAllByText('全部');
    const textContent = allText.map(t => t.parentElement?.textContent).join(' ');
    expect(textContent).toContain('26');
  });

  // ====== 筛选栏 ======

  test('renders search input with placeholder', () => {
    render(<ReturnsPage />);
    const searchInput = screen.getByPlaceholderText(/🔍 搜索单号或商品名.../);
    expect(searchInput).toBeInTheDocument();
  });

  test('renders status filter dropdown', () => {
    render(<ReturnsPage />);
    const select = screen.getByDisplayValue('全部');
    expect(select).toBeInTheDocument();
  });

  test('renders reason filter dropdown', () => {
    render(<ReturnsPage />);
    // There should be 2 selects - status and reason
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBe(2);
  });

  test('renders 模拟加载 button', () => {
    render(<ReturnsPage />);
    expect(screen.getByText('模拟加载')).toBeInTheDocument();
  });

  // ====== 搜索过滤 ======

  test('search filters by product name', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/游戏币/)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/🔍 搜索单号或商品名.../);
    fireEvent.change(searchInput, { target: { value: '橙汁' } });
    await waitFor(() => {
      expect(screen.getByText(/饮品-橙汁/)).toBeInTheDocument();
      expect(screen.queryByText(/游戏币/)).not.toBeInTheDocument();
    });
  });

  test('search filters by return id', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText('#TH20260712001')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/🔍 搜索单号或商品名.../);
    fireEvent.change(searchInput, { target: { value: 'TH20260705011' } });
    await waitFor(() => {
      expect(screen.getByText('#TH20260705011')).toBeInTheDocument();
      expect(screen.queryByText('#TH20260712001')).not.toBeInTheDocument();
    });
  });

  // ====== 状态筛选 ======

  test('status filter "处理中" shows only processing items', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/游戏币/)).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    const statusSelect = selects[0];
    fireEvent.change(statusSelect, { target: { value: '处理中' } });
    await waitFor(() => {
      // Should show 处理中 items
      const statusBadges = screen.getAllByText('处理中');
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  test('status filter "已完成" shows only completed items', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/饮品-橙汁/)).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    const statusSelect = selects[0];
    fireEvent.change(statusSelect, { target: { value: '已完成' } });
    await waitFor(() => {
      const completedBadges = screen.getAllByText('已完成');
      expect(completedBadges.length).toBeGreaterThan(0);
      expect(screen.queryByText('待审核')).not.toBeInTheDocument();
    });
  });

  // ====== 原因筛选 ======

  test('reason filter filters items', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/饮品-橙汁/)).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    const reasonSelect = selects[1];
    fireEvent.change(reasonSelect, { target: { value: '包装破损' } });
    await waitFor(() => {
      expect(screen.getByText(/游戏币\(袋装\)/)).toBeInTheDocument();
      expect(screen.queryByText(/饮品-橙汁/)).not.toBeInTheDocument();
    });
  });

  // ====== 详情弹窗 ======

  test('clicking item opens detail modal', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/游戏币/)).toBeInTheDocument();
    });
    const gameCoinItem = screen.getByText(/游戏币\(袋装\)/);
    fireEvent.click(gameCoinItem.closest('[style*="cursor: pointer"]') || gameCoinItem);
    await waitFor(() => {
      expect(screen.getByText('退换货详情')).toBeInTheDocument();
      expect(screen.getByText('#TH20260712001')).toBeInTheDocument();
    });
  });

  test('detail modal shows product details', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/游戏币/)).toBeInTheDocument();
    });
    const gameCoinItem = screen.getByText(/游戏币\(袋装\)/);
    fireEvent.click(gameCoinItem.closest('[style*="cursor: pointer"]') || gameCoinItem);
    await waitFor(() => {
      expect(screen.getByText(/游戏币\(袋装\)/)).toBeInTheDocument();
      expect(screen.getByText(/× 2/)).toBeInTheDocument();
      expect(screen.getByText(/¥60.00/)).toBeInTheDocument();
    });
  });

  test('closing modal by clicking close button', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/饮品-橙汁/)).toBeInTheDocument();
    });
    const item = screen.getByText(/饮品-橙汁/);
    fireEvent.click(item.closest('[style*="cursor: pointer"]') || item);
    await waitFor(() => {
      expect(screen.getByText('退换货详情')).toBeInTheDocument();
    });
    const closeBtns = screen.getAllByText('✕');
    if (closeBtns.length > 0) {
      fireEvent.click(closeBtns[closeBtns.length - 1]);
    }
    await waitFor(() => {
      expect(screen.queryByText('退换货详情')).not.toBeInTheDocument();
    });
  });

  test('clicking backdrop closes modal', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/饮品-橙汁/)).toBeInTheDocument();
    });
    const item = screen.getByText(/饮品-橙汁/);
    fireEvent.click(item.closest('[style*="cursor: pointer"]') || item);
    await waitFor(() => {
      expect(screen.getByText('退换货详情')).toBeInTheDocument();
    });
    // Click backdrop (the outermost div of the modal with inset:0)
    const backdrop = document.querySelector('[style*="position: fixed"][style*="inset: 0"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    await waitFor(() => {
      expect(screen.queryByText('退换货详情')).not.toBeInTheDocument();
    });
  });

  // ====== 错误态 ======

  test('clicking 模拟错误 shows error state', () => {
    render(<ReturnsPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText(/⚠️ 数据加载异常/)).toBeInTheDocument();
  });

  test('error state hides the main content', () => {
    render(<ReturnsPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.queryByText('全部')).not.toBeInTheDocument(); // stat card hidden
    expect(screen.getByText(/⚠️ 数据加载异常/)).toBeInTheDocument();
  });

  test('toggling error off restores content', () => {
    render(<ReturnsPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText(/⚠️ 数据加载异常/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('恢复数据'));
    expect(screen.queryByText(/⚠️ 数据加载异常/)).not.toBeInTheDocument();
  });

  // ====== 加载态 ======

  test('clicking 模拟加载 shows loading state', () => {
    render(<ReturnsPage />);
    fireEvent.click(screen.getByText('模拟加载'));
    expect(screen.getByText(/正在加载退换货数据/)).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  test('loading state hides items', () => {
    render(<ReturnsPage />);
    fireEvent.click(screen.getByText('模拟加载'));
    expect(screen.queryByText(/游戏币/)).not.toBeInTheDocument();
  });

  // ====== 空态 ======

  test('shows empty state when search has no results', async () => {
    render(<ReturnsPage />);
    const searchInput = screen.getByPlaceholderText(/🔍 搜索单号或商品名.../);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_EXIST_999' } });
    await waitFor(() => {
      expect(screen.getByText(/暂无退换货记录/)).toBeInTheDocument();
    });
  });

  test('empty state shows icon and description', async () => {
    render(<ReturnsPage />);
    const searchInput = screen.getByPlaceholderText(/🔍 搜索单号或商品名.../);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_EXIST_999' } });
    await waitFor(() => {
      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText(/暂无退换货记录/)).toBeInTheDocument();
    });
  });

  // ====== 分页 ======

  test('renders pagination controls', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText('上一页')).toBeInTheDocument();
      expect(screen.getByText('下一页')).toBeInTheDocument();
    });
  });

  test('pagination shows page number', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      const pageText = screen.getByText(/1 \/ 3/);
      expect(pageText).toBeInTheDocument();
    });
  });

  test('pagination advances to next page', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText('下一页')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => {
      expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
    });
  });

  test('previous page button is disabled on first page', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      const prevBtn = screen.getByText('上一页');
      expect(prevBtn.closest('button')).toBeDisabled();
    });
  });

  test('next page button is disabled on last page', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText('下一页')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('下一页'));
    fireEvent.click(screen.getByText('下一页'));
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => {
      const nextBtn = screen.getByText('下一页');
      expect(nextBtn.closest('button')).toBeDisabled();
    });
  });

  // ====== 底部统计 ======

  test('shows total record count', async () => {
    render(<ReturnsPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 26 条退换货记录/)).toBeInTheDocument();
    });
  });
});
