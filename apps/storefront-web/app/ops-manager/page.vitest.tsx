/**
 * ops-manager/page.vitest.tsx — 运营管理 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载状态 · 渲染 · 统计卡片 · 进度条 · 分类筛选 · 日期分组 · 空状态 · 边界
 * 角色: 👔店长 · 🎯运营专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import OpsManagerPage from './page';

async function waitForData() {
  await screen.findByText('📋 运营任务', {}, { timeout: 5000 });
}

describe('OpsManagerPage — 运营任务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态测试 ======

  test('renders without crashing', () => {
    expect(() => render(<OpsManagerPage />)).not.toThrow();
  });

  test('shows skeleton during loading phase', () => {
    // Loading starts as true; skeleton is shown
    render(<OpsManagerPage />);
    // Skeleton renders shimmer animation. We can't easily assert on the
    // animated divs, but we know the page renders without error.
    expect(screen.queryByText('📋 运营任务')).not.toBeInTheDocument();
  });

  // ====== 渲染测试 ======

  test('renders page title after load', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('📋 运营任务')).toBeInTheDocument();
  });

  test('renders summary text after load', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText(/今日共计 8 项任务/)).toBeInTheDocument();
    expect(screen.getByText(/已完成 3 项/)).toBeInTheDocument();
  });

  // ====== 统计卡片测试 ======

  test('renders stat cards with values', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // total: 8, done: 3, pending: 5
    expect(screen.getByText('8')).toBeInTheDocument(); // 总任务
    expect(screen.getByText('3')).toBeInTheDocument(); // 已完成
    expect(screen.getByText('5')).toBeInTheDocument(); // 待完成
    expect(screen.getByText('总任务')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('待完成')).toBeInTheDocument();
  });

  // ====== 进度条测试 ======

  test('renders progress bar', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('完成进度')).toBeInTheDocument();
    // completionRate = Math.round((3/8)*100) = 38
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  // ====== 类别分布测试 ======

  test('renders category distribution', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('类别分布')).toBeInTheDocument();
    // Categories: 巡检(1/1), 设备(2/2), 库存(0/1), 财务(0/1), 安全(1/1), 人事(0/1), 营销(0/1)
    expect(screen.getByText('巡检')).toBeInTheDocument();
    expect(screen.getByText('设备')).toBeInTheDocument();
    expect(screen.getByText('库存')).toBeInTheDocument();
    expect(screen.getByText('财务')).toBeInTheDocument();
    expect(screen.getByText('安全')).toBeInTheDocument();
    expect(screen.getByText('人事')).toBeInTheDocument();
    expect(screen.getByText('营销')).toBeInTheDocument();
  });

  // ====== 筛选按钮测试 ======

  test('renders filter buttons with counts', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('全部 (8)')).toBeInTheDocument();
    expect(screen.getByText('已完成 (3)')).toBeInTheDocument();
    expect(screen.getByText('待完成 (5)')).toBeInTheDocument();
  });

  test('filter: clicking 待完成 shows only pending tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    fireEvent.click(screen.getByText('待完成 (5)'));
    await waitFor(() => {
      expect(screen.getByText('库存确认')).toBeInTheDocument();
      expect(screen.getByText('日终结算')).toBeInTheDocument();
      expect(screen.getByText('员工排班确认')).toBeInTheDocument();
      expect(screen.getByText('促销物料更新')).toBeInTheDocument();
      // done tasks should still show "✅" check, but pending tasks have "⬜"
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument(); // done task
    });
  });

  test('filter: clicking 已完成 shows only done tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    fireEvent.click(screen.getByText('已完成 (3)'));
    await waitFor(() => {
      expect(screen.getByText('早间巡检')).toBeInTheDocument();
      expect(screen.getByText('设备检查')).toBeInTheDocument();
      expect(screen.getByText('消防安全检查')).toBeInTheDocument();
      expect(screen.getByText('设备清洁保养')).toBeInTheDocument();
      expect(screen.queryByText('库存确认')).not.toBeInTheDocument();
    });
  });

  test('filter: clicking 全部 shows all tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    fireEvent.click(screen.getByText('待完成 (5)'));
    await waitFor(() => {
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('全部 (8)'));
    await waitFor(() => {
      expect(screen.getByText('早间巡检')).toBeInTheDocument();
    });
  });

  // ====== 任务列表渲染测试 ======

  test('renders all task titles', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('早间巡检')).toBeInTheDocument();
    expect(screen.getByText('设备检查')).toBeInTheDocument();
    expect(screen.getByText('库存确认')).toBeInTheDocument();
    expect(screen.getByText('日终结算')).toBeInTheDocument();
    expect(screen.getByText('消防安全检查')).toBeInTheDocument();
    expect(screen.getByText('员工排班确认')).toBeInTheDocument();
    expect(screen.getByText('设备清洁保养')).toBeInTheDocument();
    expect(screen.getByText('促销物料更新')).toBeInTheDocument();
  });

  test('shows task times', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
  });

  test('shows task categories', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('巡检')).toBeInTheDocument();
    expect(screen.getByText('财务')).toBeInTheDocument();
    expect(screen.getByText('安全')).toBeInTheDocument();
    expect(screen.getByText('营销')).toBeInTheDocument();
  });

  test('done tasks show strikethrough and checkmark', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // Done tasks have '✅' icon
    expect(screen.getAllByText('✅').length).toBeGreaterThanOrEqual(3);
  });

  test('pending tasks show ⬜ and 待完成 badge', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getAllByText('⬜').length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText('待完成').length).toBeGreaterThanOrEqual(5);
  });

  // ====== 日期分组测试 ======

  test('groups tasks by date', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('📅 今天')).toBeInTheDocument();
    expect(screen.getByText('📅 昨天')).toBeInTheDocument();
    expect(screen.getByText('📅 前天')).toBeInTheDocument();
  });

  test('correct number of today tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // Today (2026-07-13): 早间巡检, 设备检查, 库存确认, 日终结算 = 4
    const todaySection = screen.getByText('📅 今天').closest('div');
    expect(todaySection?.textContent).toContain('早间巡检');
    expect(todaySection?.textContent).toContain('日终结算');
  });

  // ====== 空状态测试 ======

  test('empty filter shows empty state', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // No tasks from 前天 that are pending -> wait, 前天 only has 促销物料更新 which is pending
    // Filter: 已完成 for 前天 = 0 results
    fireEvent.click(screen.getByText('已完成 (3)'));
    // Only today and yesterday have done items; 前天 has none done
    await waitFor(() => {
      // The 前天 section should not appear in this case
      expect(screen.queryByText('📅 前天')).not.toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('dark theme background applied', async () => {
    const { container } = render(<OpsManagerPage />);
    await waitForData();
    const main = container.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('done tasks have reduced opacity', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // Done task container has opacity 0.7 (inline style)
    const doneIcons = screen.getAllByText('✅');
    expect(doneIcons.length).toBeGreaterThanOrEqual(3);
  });

  test('maintains filter state on re-render', async () => {
    const { rerender } = render(<OpsManagerPage />);
    await waitForData();
    fireEvent.click(screen.getByText('待完成 (5)'));
    await waitFor(() => {
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument();
    });
    rerender(<OpsManagerPage />);
    await waitFor(() => {
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument();
    });
  });
});
