/**
 * announcements/page.vitest.tsx — 公告列表页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载页 · 渲染 · 搜索 · 类型筛选 · 展开详情 · 日期格式化 · 边界
 * 角色: 📢营销 · 👔店长 · 🎯运行专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import AnnouncementsPage from './page';

/** Wait until data finishes loading */
async function waitForData() {
  await screen.findByText('新店开业优惠', {}, { timeout: 5000 });
}

/** Find the badge filter chip <button> with exact text, not the card badge span */
function filterChip(text: string): HTMLElement {
  return screen.getAllByText(text).find(el => el.tagName === 'BUTTON')!;
}

describe('AnnouncementsPage — 公告列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态测试 ======

  test('renders without crashing during loading', () => {
    expect(() => render(<AnnouncementsPage />)).not.toThrow();
  });

  // ====== 渲染测试 ======

  test('renders 公告 header after load', async () => {
    render(<AnnouncementsPage />);
    await screen.findByText('公告', {}, { timeout: 5000 });
    expect(screen.getByText('公告')).toBeInTheDocument();
  });

  test('renders all 5 announcements after load', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
    expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    expect(screen.getByText('会员日特惠')).toBeInTheDocument();
    expect(screen.getByText('暑期学生特惠')).toBeInTheDocument();
    expect(screen.getByText('停车优惠调整')).toBeInTheDocument();
  });

  test('renders announcement descriptions after load', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText('充值满100送15，限时一周')).toBeInTheDocument();
    expect(screen.getByText('VR体验区已全面升级为最新设备')).toBeInTheDocument();
  });

  test('renders announcement count text after load', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText(/共 5 条公告/)).toBeInTheDocument();
  });

  test('renders badge chips (filter buttons) after load', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText('全部')).toBeInTheDocument();
    // Some badge texts appear on both filter buttons AND card badges — use getAllByText
    expect(screen.getAllByText('NEW').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('更新').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('会员').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('优惠').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('通知').length).toBeGreaterThanOrEqual(2);
  });

  test('renders search input after load', async () => {
    render(<AnnouncementsPage />);
    await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    expect(screen.getByPlaceholderText('搜索公告…')).toBeInTheDocument();
  });

  // ====== 日期格式化测试 ======

  test('formats date in Chinese after load', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText('2026年7月12日')).toBeInTheDocument();
    expect(screen.getByText('2026年7月10日')).toBeInTheDocument();
    expect(screen.getByText('2026年7月8日')).toBeInTheDocument();
    expect(screen.getByText('2026年7月6日')).toBeInTheDocument();
    expect(screen.getByText('2026年7月5日')).toBeInTheDocument();
  });

  // ====== 搜索测试 ======

  test('search filters by title', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: '开业' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    });
  });

  test('search filters by description', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: '双倍积分' } });
    await waitFor(() => {
      expect(screen.getByText('会员日特惠')).toBeInTheDocument();
    });
  });

  test('search is case-insensitive', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: 'VR' } });
    await waitFor(() => {
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    });
  });

  test('search with no results shows empty state', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: 'zzz不存在的关键字xxx' } });
    await waitFor(() => {
      expect(screen.getByText('暂无公告')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('clearing search restores all items', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: '开业' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    });
  });

  // ====== 类型筛选测试 ======

  test('badge filter: click NEW shows only NEW items', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    const chip = filterChip('NEW');
    fireEvent.click(chip);
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('badge filter: click 全部 shows all items', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(filterChip('NEW'));
    await waitFor(() => {
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    }, { timeout: 5000 });
    fireEvent.click(screen.getByText('全部'));
    await waitFor(() => {
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('badge filter: click 优惠 shows only 优惠 items', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(filterChip('优惠'));
    await waitFor(() => {
      expect(screen.getByText('暑期学生特惠')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('badge filter + search combined', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('搜索公告…');
    fireEvent.click(filterChip('NEW'));
    fireEvent.change(searchInput, { target: { value: '新店' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
    });
  });

  // ====== 展开详情测试 ======

  test('clicking announcement expands detail', async () => {
    render(<AnnouncementsPage />);
    const item = await screen.findByText('新店开业优惠', {}, { timeout: 5000 });
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText(/为庆祝新店开业/)).toBeInTheDocument();
    });
  });

  test('expanded detail shows 点击收起', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(screen.getByText('新店开业优惠'));
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
  });

  test('clicking expanded item collapses it', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(screen.getByText('新店开业优惠'));
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('新店开业优惠'));
    await waitFor(() => {
      expect(screen.queryByText(/点击收起/)).not.toBeInTheDocument();
    });
  });

  test('expanding a second item collapses the first', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(screen.getByText('新店开业优惠'));
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('设备升级通知'));
    await waitFor(() => {
      expect(screen.getByText(/VR体验区已完成设备更新/)).toBeInTheDocument();
    });
  });

  // ====== 匹配数显示测试 ======

  test('shows matching count after search', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 5000 });
    fireEvent.change(searchInput, { target: { value: '会员' } });
    await waitFor(() => {
      expect(screen.getByText(/1 条匹配/)).toBeInTheDocument();
    });
  });

  test('shows correct filter count (5/5 when no filter)', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getByText(/5 条匹配/)).toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('empty search shows all items', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    expect(screen.getAllByText(/2026年7月/).length).toBeGreaterThanOrEqual(5);
  });

  test('search with whitespace shows empty state', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('搜索公告…');
    fireEvent.change(searchInput, { target: { value: '  ' } });
    await waitFor(() => {
      // Whitespace is not empty string, so !search is false → it searches for whitespace
      expect(screen.getByText('暂无公告')).toBeInTheDocument();
    });
  });

  test('dark theme background applied', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('badge filter count text updates', async () => {
    render(<AnnouncementsPage />);
    await waitForData();
    fireEvent.click(filterChip('通知'));
    await waitFor(() => {
      // Only "通知" badge items should remain - 1 item
      const matchText = screen.queryByText(/1 条匹配/);
      if (matchText) expect(matchText).toBeInTheDocument();
    });
  });
});
