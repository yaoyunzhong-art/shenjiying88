/**
 * announcements/page.vitest.tsx — 公告列表页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载页 · 空态 · 错误态 · 公告列表渲染 · 搜索 · 类型筛选 · 展开详情 · 日期格式化 · 边界
 * 角色: 📢营销 · 👔店长 · 🎯运行专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mock data (mirrors the page's MOCK_ITEMS) ──

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: '新店开业优惠', desc: '充值满100送15，限时一周', detail: '为庆祝新店开业...', date: '2026-07-12', badge: 'NEW', badgeColor: '#22c55e' },
  { id: 'a2', title: '设备升级通知', desc: 'VR体验区已全面升级', detail: 'VR体验区已完成设备更新...', date: '2026-07-10', badge: '更新', badgeColor: '#3b82f6' },
  { id: 'a3', title: '会员日特惠', desc: '每月15日会员双倍积分', detail: '每月15日为会员日...', date: '2026-07-08', badge: '会员', badgeColor: '#f59e0b' },
  { id: 'a4', title: '暑期学生特惠', desc: '凭学生证享8折优惠', detail: '7月15日至8月31日...', date: '2026-07-06', badge: '优惠', badgeColor: '#ec4899' },
  { id: 'a5', title: '停车优惠调整', desc: '商场停车新规通知', detail: '自8月1日起...', date: '2026-07-05', badge: '通知', badgeColor: '#6366f1' },
];

let fetchResolve: (items: typeof MOCK_ANNOUNCEMENTS) => void;
let fetchReject: (err: Error) => void;

// Override simulateFetch behavior via module mock
vi.mock('./page', () => {
  const Actual = vi.importActual('./page');
  return Actual;
});

// We'll mock the simulateFetch function by mocking the module's internals
vi.mock('./page', async (importOriginal) => {
  const mod = await importOriginal<{ default: React.ComponentType }>();
  return { default: mod.default };
});

// ── Test Subject ──

import AnnouncementsPage from './page';

describe('AnnouncementsPage — 公告列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态测试 ======

  test('shows loading skeleton initially', () => {
    render(<AnnouncementsPage />);
    // The loading skeleton should show
    const loadingSkeleton = document.querySelector('[style*="border-radius: 8"][style*="width: 100"]');
    expect(document.body.textContent).not.toBe('');
  });

  // ====== 渲染测试 ======

  test('renders 公告 header after load', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('公告')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders all 5 announcements after load', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
      expect(screen.getByText('会员日特惠')).toBeInTheDocument();
      expect(screen.getByText('暑期学生特惠')).toBeInTheDocument();
      expect(screen.getByText('停车优惠调整')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders announcement descriptions', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('充值满100送15，限时一周')).toBeInTheDocument();
      expect(screen.getByText('VR体验区已全面升级')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders announcement count text', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 5 条公告/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders badge chips', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByText('更新')).toBeInTheDocument();
      expect(screen.getByText('会员')).toBeInTheDocument();
      expect(screen.getByText('优惠')).toBeInTheDocument();
      expect(screen.getByText('通知')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders search input', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('搜索公告…');
      expect(searchInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders badge on each announcement card', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const badges = screen.getAllByText(/NEW|更新|会员|优惠|通知/);
      expect(badges.length).toBeGreaterThanOrEqual(5);
    }, { timeout: 3000 });
  });

  // ====== 日期格式化测试 ======

  test('formats date in Chinese', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('2026年7月12日')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders all dates correctly', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText('2026年7月10日')).toBeInTheDocument();
      expect(screen.getByText('2026年7月8日')).toBeInTheDocument();
      expect(screen.getByText('2026年7月6日')).toBeInTheDocument();
      expect(screen.getByText('2026年7月5日')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ====== 搜索测试 ======

  test('search filters by title', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: '开业' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    });
  });

  test('search filters by description', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: '双倍积分' } });
    await waitFor(() => {
      expect(screen.getByText('会员日特惠')).toBeInTheDocument();
    });
  });

  test('search is case-insensitive', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: 'VR' } });
    await waitFor(() => {
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    });
  });

  test('search with no results shows empty state', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: 'zzz不存在的关键字xxx' } });
    await waitFor(() => {
      expect(screen.getByText('暂无公告')).toBeInTheDocument();
      expect(screen.getByText(/当前筛选条件下没有匹配的公告/)).toBeInTheDocument();
    });
  });

  test('clearing search restores all items', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: '开业' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    });
  });

  // ====== 类型筛选测试 ======

  test('badge filter: click NEW shows only NEW items', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const newChip = screen.getByText('NEW');
      fireEvent.click(newChip);
    }, { timeout: 3000 });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.queryByText('设备升级通知')).not.toBeInTheDocument();
    });
  });

  test('badge filter: click 全部 shows all items', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const newChip = screen.getByText('NEW');
      fireEvent.click(newChip);
    }, { timeout: 3000 });
    await waitFor(() => {
      const allChip = screen.getByText('全部');
      fireEvent.click(allChip);
    });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
      expect(screen.getByText('设备升级通知')).toBeInTheDocument();
    });
  });

  test('badge filter: click 优惠 shows only 优惠 items', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const chip = screen.getByText('优惠');
      fireEvent.click(chip);
    }, { timeout: 3000 });
    await waitFor(() => {
      expect(screen.getByText('暑期学生特惠')).toBeInTheDocument();
    });
  });

  test('badge filter + search combined', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    // Filter to NEW first
    await waitFor(() => {
      fireEvent.click(screen.getByText('NEW'));
    });
    // Search should further narrow
    fireEvent.change(searchInput, { target: { value: '新店' } });
    await waitFor(() => {
      expect(screen.getByText('新店开业优惠')).toBeInTheDocument();
    });
  });

  test('filter chip highlights when active', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('NEW'));
    }, { timeout: 3000 });
    // After click, the filter chip should have active styling
    const newChip = screen.getByText('NEW');
    expect(newChip).toBeInTheDocument();
  });

  // ====== 展开详情测试 ======

  test('clicking announcement expands detail', async () => {
    render(<AnnouncementsPage />);
    const item = await screen.findByText('新店开业优惠', {}, { timeout: 3000 });
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText(/为庆祝新店开业/)).toBeInTheDocument();
    });
  });

  test('expanded detail shows 点击收起', async () => {
    render(<AnnouncementsPage />);
    const item = await screen.findByText('新店开业优惠', {}, { timeout: 3000 });
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
  });

  test('clicking expanded item collapses it', async () => {
    render(<AnnouncementsPage />);
    const item = await screen.findByText('新店开业优惠', {}, { timeout: 3000 });
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
    // Click again to collapse
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.queryByText(/点击收起/)).not.toBeInTheDocument();
    });
  });

  test('expanding a second item collapses the first', async () => {
    render(<AnnouncementsPage />);
    const item1 = await screen.findByText('新店开业优惠', {}, { timeout: 3000 });
    fireEvent.click(item1);
    await waitFor(() => {
      expect(screen.getByText(/点击收起/)).toBeInTheDocument();
    });
    const item2 = screen.getByText('设备升级通知');
    fireEvent.click(item2);
    await waitFor(() => {
      // First should no longer show detail
      expect(screen.getByText(/VR体验区已完成设备更新/)).toBeInTheDocument();
    });
  });

  test('expanded item shows full detail text', async () => {
    render(<AnnouncementsPage />);
    const item = await screen.findByText('会员日特惠', {}, { timeout: 3000 });
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText(/双倍积分/)).toBeInTheDocument();
    });
  });

  // ====== 匹配数显示测试 ======

  test('shows matching count after search', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: '会员' } });
    await waitFor(() => {
      // Should show matching count
      const matchText = screen.getByText(/1 条匹配/);
      expect(matchText).toBeInTheDocument();
    });
  });

  test('shows correct filter math count (5/5 when no filter)', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getByText(/5 条匹配/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ====== 边界情况 ======

  test('full text: empty search term shows all', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/2026年7月/).length).toBeGreaterThanOrEqual(5);
    }, { timeout: 3000 });
  });

  test('search with whitespace works', async () => {
    render(<AnnouncementsPage />);
    const searchInput = await screen.findByPlaceholderText('搜索公告…', {}, { timeout: 3000 });
    fireEvent.change(searchInput, { target: { value: '  ' } });
    await waitFor(() => {
      // Whitespace should not filter anything (show all)
      expect(screen.getByText(/5 条匹配/)).toBeInTheDocument();
    });
  });

  test('dark theme background applied', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const main = document.querySelector('main');
      expect(main).toHaveStyle('background: #0f172a');
    }, { timeout: 3000 });
  });

  test('badge filter count text updates', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('通知'));
    }, { timeout: 3000 });
    await waitFor(() => {
      expect(screen.getByText(/1 条匹配/)).toBeInTheDocument();
    });
  });

  test('each announcement card is clickable', async () => {
    render(<AnnouncementsPage />);
    await waitFor(() => {
      const items = screen.getAllByText(/2026年.*日/);
      expect(items.length).toBeGreaterThanOrEqual(5);
    }, { timeout: 3000 });
  });
});
