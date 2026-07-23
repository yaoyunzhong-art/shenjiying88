/**
 * ops-manager/page.vitest.tsx — 运营管理 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载状态 · 渲染 · 统计卡片 · 进度条 · 分类筛选 · 日期分组 · 空状态 · 边界
 * 注意: 多个文本重复出现，使用 getAllByText / body text
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import OpsManagerPage from './page';

function allText(): string {
  return document.body.textContent ?? '';
}

async function waitForData() {
  await screen.findByText('📋 运营任务', {}, { timeout: 5000 });
}

describe('OpsManagerPage — 运营任务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态 ======

  test('renders without crashing', () => {
    expect(() => render(<OpsManagerPage />)).not.toThrow();
  });

  test('shows skeleton during loading phase', () => {
    render(<OpsManagerPage />);
    expect(screen.queryByText('📋 运营任务')).not.toBeInTheDocument();
  });

  // ====== 渲染 ======

  test('renders page title after load', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('📋 运营任务')).toBeInTheDocument();
  });

  test('renders summary with correct counts', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('今日共计 8 项任务');
  });

  test('renders stat card labels', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('总任务')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  test('renders progress bar label', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('完成进度')).toBeInTheDocument();
  });

  test('renders category distribution section', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('类别分布')).toBeInTheDocument();
    const body = allText();
    expect(body).toContain('巡检');
    expect(body).toContain('财务');
    expect(body).toContain('安全');
    expect(body).toContain('人事');
  });

  test('renders filter buttons', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('全部');
    expect(body).toContain('待完成');
    expect(body).toContain('已完成');
  });

  // ====== 筛选交互 ======

  test('clicking 待完成 filter shows pending tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    // Use the full button text with count to get the exact button
    const pendingBtn = screen.getByText('待完成 (4)');
    fireEvent.click(pendingBtn);
    await waitFor(() => {
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument();
      expect(screen.getByText('库存确认')).toBeInTheDocument();
    });
  });

  test('clicking 已完成 filter shows done tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const doneBtn = screen.getByText('已完成 (4)');
    fireEvent.click(doneBtn);
    await waitFor(() => {
      expect(screen.getByText('早间巡检')).toBeInTheDocument();
      expect(screen.queryByText('库存确认')).not.toBeInTheDocument();
    });
  });

  test('resetting filter shows all tasks', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const pendingBtn = screen.getByText('待完成 (4)');
    fireEvent.click(pendingBtn);
    await waitFor(() => {
      expect(screen.queryByText('早间巡检')).not.toBeInTheDocument();
    });
    const allBtn = screen.getByText('全部 (8)');
    fireEvent.click(allBtn);
    await waitFor(() => {
      expect(screen.getByText('早间巡检')).toBeInTheDocument();
    });
  });

  test('empty filter removes date section', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const doneBtn = screen.getByText('已完成 (4)');
    fireEvent.click(doneBtn);
    await waitFor(() => {
      expect(screen.queryByText('📅 前天')).not.toBeInTheDocument();
    });
  });

  test('maintains filter state on re-render', async () => {
    const { rerender } = render(<OpsManagerPage />);
    await waitForData();
    const doneBtn = screen.getByText('已完成 (4)');
    fireEvent.click(doneBtn);
    await waitFor(() => {
      expect(screen.queryByText('库存确认')).not.toBeInTheDocument();
    });
    rerender(<OpsManagerPage />);
    await waitFor(() => {
      expect(screen.queryByText('库存确认')).not.toBeInTheDocument();
    });
  });

  // ====== 任务列表 ======

  test('renders all task titles', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('早间巡检');
    expect(body).toContain('设备检查');
    expect(body).toContain('库存确认');
    expect(body).toContain('日终结算');
    expect(body).toContain('消防安全检查');
    expect(body).toContain('员工排班确认');
    expect(body).toContain('设备清洁保养');
    expect(body).toContain('促销物料更新');
  });

  test('shows task times', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
  });

  test('done tasks show checkmark', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getAllByText('✅').length).toBeGreaterThanOrEqual(4);
  });

  test('pending tasks show pending icon', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getAllByText('⬜').length).toBeGreaterThanOrEqual(4);
  });

  // ====== 日期分组 ======

  test('groups tasks by date', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    expect(screen.getByText('📅 今天')).toBeInTheDocument();
    expect(screen.getByText('📅 昨天')).toBeInTheDocument();
    expect(screen.getByText('📅 前天')).toBeInTheDocument();
  });

  // ====== 边界 ======

  test('dark theme background', async () => {
    const { container } = render(<OpsManagerPage />);
    await waitForData();
    const main = container.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('renders progress percentage in text', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('50%');
  });

  test('renders category done/total counts', async () => {
    render(<OpsManagerPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('1/1');
    expect(body).toContain('2/2');
    expect(body).toContain('0/1');
  });
});
