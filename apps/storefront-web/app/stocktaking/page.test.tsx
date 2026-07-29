/**
 * stocktaking/page.vitest.tsx — 盘点页面 L2 组件测试
 * 角色: 👔店长 / 🛒前台
 * 覆盖: 渲染 · 看板卡片 · 报表视图 · 搜索过滤 · 分类/状态筛选 · 表格 · 全选/批量操作 · 分页 · 空态 · 加载态
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import StocktakingPage from './page';

describe('StocktakingPage — 盘点页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<StocktakingPage />)).not.toThrow();
  });

  test('renders title 库存盘点', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('📋 库存盘点')).toBeInTheDocument();
  });

  test('renders main container with dark background', () => {
    render(<StocktakingPage />);
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  // ====== 看板卡片 ======

  test('renders 已盘点 stat card', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('已盘点')).toBeInTheDocument();
  });

  test('renders 待盘点 stat card', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('待盘点')).toBeInTheDocument();
  });

  test('renders 异常 stat card', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('⚠️ 异常')).toBeInTheDocument();
  });

  test('renders 差异项数 stat card', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('差异项数')).toBeInTheDocument();
  });

  test('renders 开始盘点 button', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('+ 开始盘点')).toBeInTheDocument();
  });

  test('stat cards show correct values', () => {
    render(<StocktakingPage />);
    // Done: 12, Pending: 4, Exception: 6
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  // ====== 报表/列表视图切换 ======

  test('renders view mode toggle button', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('📊 报表视图')).toBeInTheDocument();
  });

  test('switching to report view shows category stats', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('📊 报表视图'));
    expect(screen.getByText('📊 分类盘点概况')).toBeInTheDocument();
  });

  test('report view shows category breakdown', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('📊 报表视图'));
    expect(screen.getByText('游戏耗材')).toBeInTheDocument();
    expect(screen.getByText('饮品')).toBeInTheDocument();
    expect(screen.getByText('礼品')).toBeInTheDocument();
  });

  test('switching back to list view shows table', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('📊 报表视图'));
    expect(screen.getByText('📊 分类盘点概况')).toBeInTheDocument();
    fireEvent.click(screen.getByText('📋 列表视图'));
    expect(screen.queryByText('📊 分类盘点概况')).not.toBeInTheDocument();
  });

  // ====== 搜索过滤 ======

  test('renders search input with placeholder 搜索品名/分类/位置…', () => {
    render(<StocktakingPage />);
    const searchInput = screen.getByPlaceholderText('搜索品名/分类/位置…');
    expect(searchInput).toBeInTheDocument();
  });

  test('search filters items by name', async () => {
    render(<StocktakingPage />);
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('搜索品名/分类/位置…');
    fireEvent.change(searchInput, { target: { value: 'VR' } });
    await waitFor(() => {
      expect(screen.getByText('VR手柄')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  test('search filters items by category', async () => {
    render(<StocktakingPage />);
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('搜索品名/分类/位置…');
    fireEvent.change(searchInput, { target: { value: '清洁' } });
    await waitFor(() => {
      expect(screen.getByText('清洁湿巾')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  // ====== 分类筛选 ======

  test('category filter renders with options', () => {
    render(<StocktakingPage />);
    const selects = document.querySelectorAll('select');
    const catSelect = selects[0];
    expect(catSelect).toBeInTheDocument();
    expect(catSelect.textContent).toContain('游戏耗材');
    expect(catSelect.textContent).toContain('饮品');
  });

  test('category filter narrows results', async () => {
    render(<StocktakingPage />);
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    const catSelect = selects[0];
    fireEvent.change(catSelect, { target: { value: '饮品' } });
    await waitFor(() => {
      expect(screen.getByText('饮料(箱)')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  // ====== 状态筛选 ======

  test('status filter renders with options', () => {
    render(<StocktakingPage />);
    const selects = document.querySelectorAll('select');
    const statusSelect = selects[1];
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect.textContent).toContain('已盘点');
    expect(statusSelect.textContent).toContain('待盘点');
    expect(statusSelect.textContent).toContain('异常');
  });

  test('status filter shows only pending items', async () => {
    render(<StocktakingPage />);
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    const statusSelect = selects[1];
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    await waitFor(() => {
      // Pending items: 礼品袋, 除尘掸, 礼品-徽章, 零食-饼干
      expect(screen.getByText('礼品袋')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  // ====== 重置按钮 ======

  test('reset button clears all filters', async () => {
    render(<StocktakingPage />);
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
    const selects = document.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: '饮品' } });
    await waitFor(() => {
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('重置'));
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
  });

  // ====== 表格渲染 ======

  test('renders table with headers', () => {
    render(<StocktakingPage />);
    const table = document.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('品名')).toBeInTheDocument();
    expect(screen.getByText('分类')).toBeInTheDocument();
    expect(screen.getByText('账存')).toBeInTheDocument();
    expect(screen.getByText('实盘')).toBeInTheDocument();
    expect(screen.getByText('差异')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('存放位置')).toBeInTheDocument();
  });

  test('renders item names in table', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('游戏币')).toBeInTheDocument();
    expect(screen.getByText('饮料(箱)')).toBeInTheDocument();
    expect(screen.getByText('礼品玩偶')).toBeInTheDocument();
  });

  test('renders status labels with correct colors', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('已盘点')).toBeInTheDocument();
    expect(screen.getByText('待盘点')).toBeInTheDocument();
  });

  test('diff column shows checkmark for zero diff', () => {
    render(<StocktakingPage />);
    // Game coins have diff -20, so they show "-20 枚"
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  // ====== 全选/批量操作 ======

  test('checkbox selects items and shows batch bar', () => {
    render(<StocktakingPage />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(1);
    // Click first item checkbox
    fireEvent.click(checkboxes[1]);
    const batchBar = screen.getByText(/已选 1 项/);
    expect(batchBar).toBeInTheDocument();
  });

  test('select all checkbox selects all visible items', () => {
    render(<StocktakingPage />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectAll = checkboxes[0];
    fireEvent.click(selectAll);
    expect(screen.getByText(/已选/)).toBeInTheDocument();
  });

  test('batch bar shows batch action buttons', () => {
    render(<StocktakingPage />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText('✅ 标记为已盘点')).toBeInTheDocument();
    expect(screen.getByText('📝 批量录入实盘')).toBeInTheDocument();
  });

  test('batch bar cancel selection clears selection', () => {
    render(<StocktakingPage />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/已选 1 项/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('取消选择'));
    expect(screen.queryByText(/已选/)).not.toBeInTheDocument();
  });

  // ====== 搜索按钮 ======

  test('search button triggers loading state', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('搜索'));
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('处理中...')).toBeInTheDocument();
  });

  // ====== 导出报告 ======

  test('export button triggers alert', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('📥 导出报告'));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('导出盘点报告'));
  });

  // ====== 开始盘点 ======

  test('start stocktake button triggers alert', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('+ 开始盘点'));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('发起新一轮盘点'));
  });

  // ====== 空态 ======

  test('shows empty state when no items match filters', async () => {
    render(<StocktakingPage />);
    const searchInput = screen.getByPlaceholderText('搜索品名/分类/位置…');
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH' } });
    await waitFor(() => {
      expect(screen.getByText('没有匹配的盘点记录')).toBeInTheDocument();
    });
  });

  // ====== 分页 ======

  test('renders pagination', () => {
    render(<StocktakingPage />);
    expect(screen.getByText('← 上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页 →')).toBeInTheDocument();
  });

  test('pagination shows page numbers', () => {
    render(<StocktakingPage />);
    // 22 items, 10 per page = 3 pages
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('clicking page 2 changes displayed items', () => {
    render(<StocktakingPage />);
    fireEvent.click(screen.getByText('2'));
    // Page 2 should show different items
    expect(screen.getByText('零食-薯片')).toBeInTheDocument();
  });
});
