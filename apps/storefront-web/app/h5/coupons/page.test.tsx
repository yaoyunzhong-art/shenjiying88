/**
 * h5/coupons/page.vitest.tsx — H5优惠券页 组件测试
 * 覆盖: 加载态 · 优惠券列表 · 筛选 · 空态 · 状态渲染 · 交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/h5/coupons',
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetCoupons = vi.fn();

vi.mock('../../../lib/coupon-service', () => ({
  couponService: {
    getCoupons: (...args: any[]) => mockGetCoupons(...args),
  },
  TYPE_CONFIG: {
    discount: { name: '打折券', color: '#f97316' },
    cash: { name: '代金券', color: '#10b981' },
    free_shipping: { name: '免运费券', color: '#3b82f6' },
    voucher: { name: '礼品券', color: '#ec4899' },
  },
}));

vi.mock('../h5-style', () => ({
  getMainContainerStyle: () => ({ minHeight: '100vh', background: '#0f172a' }),
  getToggleChipStyle: (isActive: boolean, opts?: any) => ({
    padding: '6px 16px',
    borderRadius: 16,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.1)',
    color: isActive ? '#a5b4fc' : '#94a3b8',
  }),
  getCardStyle: (opts?: any) => ({
    borderRadius: 12,
    background: opts?.disabled ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.8)',
    border: opts?.disabled ? '1px solid rgba(148,163,184,0.08)' : '1px solid rgba(148,163,184,0.1)',
    padding: 16,
    marginBottom: 12,
    opacity: opts?.disabled ? 0.6 : 1,
  }),
  getEmptyStateStyle: () => ({ textAlign: 'center', padding: 48, color: '#64748b' }),
  getEmptyStateEmojiStyle: () => ({ fontSize: 48, marginBottom: 12 }),
  H5Header: ({ title, children }: any) => (
    <div data-testid="h5-header" data-title={title}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  H5NavBar: ({ activeKey }: any) => <div data-testid="h5-navbar" data-active-key={activeKey} />,
  COLOR_TEXT_PRIMARY: '#f8fafc',
  COLOR_TEXT_MUTED: '#64748b',
  COLOR_BORDER: '1px solid rgba(148,163,184,0.1)',
}));

import H5CouponsPage from './page';

const MOCK_COUPONS = [
  {
    id: 'c1',
    couponId: 'cp1',
    name: '新客首单8折',
    type: 'discount',
    typeName: '打折券',
    value: '8折',
    minAmount: '满0元可用',
    validFrom: '2026-06-01',
    validTo: '2026-07-31',
    status: 'unused',
    storeName: '神机营旗舰店',
  },
  {
    id: 'c2',
    couponId: 'cp2',
    name: '满100减20',
    type: 'cash',
    typeName: '代金券',
    value: '¥20',
    minAmount: '满100元可用',
    validFrom: '2026-06-01',
    validTo: '2026-08-31',
    status: 'used',
    storeName: '全部门店',
  },
  {
    id: 'c3',
    couponId: 'cp3',
    name: '夏日饮品券',
    type: 'voucher',
    typeName: '礼品券',
    value: '¥10',
    minAmount: '满0元可用',
    validFrom: '2026-05-01',
    validTo: '2026-06-30',
    status: 'expired',
    storeName: '深圳南山店',
  },
];

function renderPage() {
  return render(<H5CouponsPage />);
}

describe('H5CouponsPage — H5优惠券', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoupons.mockResolvedValue({
      success: true,
      data: { coupons: MOCK_COUPONS, total: 3, unusedCount: 1, usedCount: 1, expiredCount: 1 },
    });
  });

  // ====== 渲染测试 ======

  test('renders without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders page title 我的优惠券', async () => {
    renderPage();
    expect(await screen.findByText('我的优惠券')).toBeInTheDocument();
  });

  test('renders stats section with counts', async () => {
    renderPage();
    expect(await screen.findByText('1')).toBeInTheDocument(); // unused count
    expect(screen.getByText('可用')).toBeInTheDocument();
    expect(screen.getByText('已用')).toBeInTheDocument();
    expect(screen.getByText('过期')).toBeInTheDocument();
  });

  test('renders filter tabs: 可用/已用/过期', async () => {
    renderPage();
    expect(await screen.findByText('可用')).toBeInTheDocument();
    expect(screen.getByText('已用')).toBeInTheDocument();
    expect(screen.getByText('过期')).toBeInTheDocument();
  });

  test('renders coupon names', async () => {
    renderPage();
    expect(await screen.findByText('新客首单8折')).toBeInTheDocument();
    expect(screen.getByText('满100减20')).toBeInTheDocument();
    expect(screen.getByText('夏日饮品券')).toBeInTheDocument();
  });

  test('renders coupon values', async () => {
    renderPage();
    expect(await screen.findByText('8折')).toBeInTheDocument();
    expect(screen.getByText('¥20')).toBeInTheDocument();
    expect(screen.getByText('¥10')).toBeInTheDocument();
  });

  test('renders coupon type names', async () => {
    renderPage();
    expect(await screen.findByText('打折券')).toBeInTheDocument();
    expect(screen.getByText('代金券')).toBeInTheDocument();
    expect(screen.getByText('礼品券')).toBeInTheDocument();
  });

  test('renders coupon min amount conditions', async () => {
    renderPage();
    expect(await screen.findByText('满0元可用')).toBeInTheDocument();
    expect(screen.getByText('满100元可用')).toBeInTheDocument();
  });

  test('renders coupon store names', async () => {
    renderPage();
    expect(await screen.findByText('神机营旗舰店')).toBeInTheDocument();
    expect(screen.getByText('全部门店')).toBeInTheDocument();
    expect(screen.getByText('深圳南山店')).toBeInTheDocument();
  });

  test('renders coupon valid-to dates', async () => {
    renderPage();
    expect(await screen.findByText(/有效期至 2026-07-31/)).toBeInTheDocument();
    expect(screen.getByText(/有效期至 2026-08-31/)).toBeInTheDocument();
    expect(screen.getByText(/有效期至 2026-06-30/)).toBeInTheDocument();
  });

  // ====== 筛选测试 ======

  test('filter by 可用 shows only unused coupons', async () => {
    renderPage();
    await screen.findByText('新客首单8折');
    fireEvent.click(screen.getByText('可用'));
    await waitFor(() => {
      expect(screen.getByText('新客首单8折')).toBeInTheDocument();
      expect(screen.queryByText('满100减20')).not.toBeInTheDocument();
      expect(screen.queryByText('夏日饮品券')).not.toBeInTheDocument();
    });
  });

  test('filter by 已用 shows only used coupons', async () => {
    renderPage();
    await screen.findByText('新客首单8折');
    fireEvent.click(screen.getByText('已用'));
    await waitFor(() => {
      expect(screen.queryByText('新客首单8折')).not.toBeInTheDocument();
      expect(screen.getByText('满100减20')).toBeInTheDocument();
      expect(screen.queryByText('夏日饮品券')).not.toBeInTheDocument();
    });
  });

  test('filter by 过期 shows only expired coupons', async () => {
    renderPage();
    await screen.findByText('新客首单8折');
    fireEvent.click(screen.getByText('过期'));
    await waitFor(() => {
      expect(screen.queryByText('新客首单8折')).not.toBeInTheDocument();
      expect(screen.queryByText('满100减20')).not.toBeInTheDocument();
      expect(screen.getByText('夏日饮品券')).toBeInTheDocument();
    });
  });

  // ====== 状态渲染 ======

  test('unused coupons show 立即使用 button', async () => {
    renderPage();
    const useBtn = await screen.findByText('立即使用');
    expect(useBtn).toBeInTheDocument();
    fireEvent.click(useBtn);
    expect(mockPush).toHaveBeenCalledWith('/stores');
  });

  test('used coupons show 已使用 label', async () => {
    renderPage();
    expect(await screen.findByText('已使用')).toBeInTheDocument();
  });

  test('expired coupons show 已过期 label', async () => {
    renderPage();
    expect(await screen.findByText('已过期')).toBeInTheDocument();
  });

  // ====== 空态 ======

  test('shows 暂无优惠券 when list is empty', async () => {
    mockGetCoupons.mockResolvedValue({
      success: true,
      data: { coupons: [], total: 0, unusedCount: 0, usedCount: 0, expiredCount: 0 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('暂无优惠券')).toBeInTheDocument();
    });
  });

  test('shows emoji in empty state', async () => {
    mockGetCoupons.mockResolvedValue({
      success: true,
      data: { coupons: [], total: 0, unusedCount: 0, usedCount: 0, expiredCount: 0 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('🎫')).toBeInTheDocument();
    });
  });

  // ====== 导航 ======

  test('renders H5NavBar with activeKey coupons', async () => {
    renderPage();
    const nav = await screen.findByTestId('h5-navbar');
    expect(nav).toHaveAttribute('data-active-key', 'coupons');
  });

  // ====== 统计 ======

  test('stats show correct counts: 1 available, 1 used, 1 expired', async () => {
    renderPage();
    // Each stat value is shown in a div
    const statValues = await screen.findAllByText('1');
    expect(statValues.length).toBeGreaterThanOrEqual(3);
  });

  // ====== 加载态 ======

  test('renders header title even before data loads', () => {
    mockGetCoupons.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('我的优惠券')).toBeInTheDocument();
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 优惠券筛选与状态', () => {
    test('[圈梁五道箍] 默认显示所有优惠券', async () => {
      renderPage();
      await screen.findByText('新客首单8折');
      expect(screen.getByText('满100减20')).toBeInTheDocument();
      expect(screen.getByText('夏日饮品券')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 未使用优惠券显示立即使用按钮', async () => {
      renderPage();
      await screen.findByText('立即使用');
      expect(screen.getByText('立即使用')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 已使用优惠券不显示立即使用按钮', async () => {
      renderPage();
      await screen.findByText('新客首单8折');
      // There should be exactly one "立即使用" button
      const useBtns = screen.getAllByText('立即使用');
      expect(useBtns.length).toBe(1);
    });

    test('[圈梁五道箍] 过期优惠券标记为已过期', async () => {
      renderPage();
      await screen.findByText('已过期');
      expect(screen.getByText('已过期')).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — 优惠券数据展示', () => {
    test('[圈梁五道箍] 打折券面值为8折', async () => {
      renderPage();
      expect(await screen.findByText('8折')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 代金券面值为¥20', async () => {
      renderPage();
      expect(await screen.findByText('¥20')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 礼品券面值为¥10', async () => {
      renderPage();
      expect(await screen.findByText('¥10')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 优惠券最短有效期渲染正确', async () => {
      renderPage();
      await screen.findByText(/有效期至 2026-06-30/);
      expect(screen.getByText(/有效期至 2026-06-30/)).toBeInTheDocument();
    });

    test('[圈梁五道箍] 优惠券最长有效期渲染正确', async () => {
      renderPage();
      expect(await screen.findByText(/有效期至 2026-08-31/)).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — 导航与布局', () => {
    test('[圈梁五道箍] 页面包含H5Header', async () => {
      renderPage();
      const header = await screen.findByTestId('h5-header');
      expect(header).toHaveAttribute('data-title', '我的优惠券');
    });

    test('[圈梁五道箍] H5NavBar activeKey为coupons', async () => {
      renderPage();
      const nav = await screen.findByTestId('h5-navbar');
      expect(nav).toHaveAttribute('data-active-key', 'coupons');
    });
  });
});
