/**
 * member-card/page.vitest.tsx — 会员卡页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 会员卡展示 · 等级权益 · 优惠券列表 · 筛选 · 操作交互 · 加载态 · 空状态 · 边界
 * 角色: 👤 会员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ====== Mock next/navigation ======
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ====== Mock localStorage ======
const localStorageStore: Record<string, string | null> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; }); }),
});

// ====== Mock member-card-service ======
const mockGetMemberCard = vi.fn();
const mockGetMemberCoupons = vi.fn();

vi.mock('../../lib/member-card-service', () => ({
  memberCardService: {
    getMemberCard: (...args: unknown[]) => mockGetMemberCard(...args),
    getMemberCoupons: (...args: unknown[]) => mockGetMemberCoupons(...args),
  },
  TIER_CONFIG: {
    diamond: { name: '钻石会员', color: '#a78bfa', minPoints: 50000 },
    gold: { name: '黄金会员', color: '#fbbf24', minPoints: 20000 },
    silver: { name: '银卡会员', color: '#94a3b8', minPoints: 5000 },
    bronze: { name: '铜卡会员', color: '#d97706', minPoints: 1000 },
    basic: { name: '普通会员', color: '#64748b', minPoints: 0 },
  },
}));

// ====== Test Subject ======
import MemberCardPage from './page';

const MOCK_CARD = {
  id: 'card-001',
  memberId: 'mem-001',
  cardNumber: '8888 8888 8888 0001',
  tier: 'gold' as const,
  tierName: '黄金会员',
  tierColor: '#fbbf24',
  points: 15000,
  pointsToNextTier: 5000,
  nextTierName: '钻石会员',
  issuedAt: '2026-01-01',
  expiresAt: '2027-12-31',
  status: 'active' as const,
  benefits: ['折扣升级 8.5折', '每月2张满减券', '专属客服', '免运费'],
};

const MOCK_COUPONS = [
  { id: 'c1', couponId: 'cp1', name: '满100减20', type: 'cash' as const, typeName: '代金券', value: '¥20', minAmount: '满100可用', validFrom: '2026-07-01', validTo: '2026-07-31', status: 'unused' as const, storeName: 'Demo Store' },
  { id: 'c2', couponId: 'cp2', name: '8折优惠券', type: 'discount' as const, typeName: '打折券', value: '8折', minAmount: '满50可用', validFrom: '2026-07-01', validTo: '2026-08-31', status: 'unused' as const, storeName: 'Demo Store' },
  { id: 'c3', couponId: 'cp3', name: '免运费券', type: 'free_shipping' as const, typeName: '免运费券', value: '免运费', minAmount: '全场通用', validFrom: '2026-06-01', validTo: '2026-07-15', status: 'used' as const, storeName: 'Demo Store' },
  { id: 'c4', couponId: 'cp4', name: '礼品券', type: 'voucher' as const, typeName: '礼品券', value: '¥50', minAmount: '满200可用', validFrom: '2026-05-01', validTo: '2026-06-30', status: 'expired' as const, storeName: 'Demo Store' },
];

const MOCK_COUPON_RESPONSE = {
  success: true,
  data: {
    coupons: MOCK_COUPONS,
    total: 4,
    unusedCount: 2,
    usedCount: 1,
    expiredCount: 1,
  },
};

const MOCK_CARD_RESPONSE = { success: true, data: MOCK_CARD };

describe('MemberCardPage — 会员卡页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; });
    localStorageStore['member_access_token'] = 'test-token';
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001', nickname: '测试用户', mobile: '13800138000' });
    mockPush.mockReset();
    mockGetMemberCard.mockResolvedValue(MOCK_CARD_RESPONSE);
    mockGetMemberCoupons.mockResolvedValue(MOCK_COUPON_RESPONSE);
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', async () => {
    const { container } = render(<MemberCardPage />);
    await waitFor(() => { expect(container).toBeTruthy(); });
  });

  test('redirects to login when no token present', async () => {
    delete localStorageStore['member_access_token'];
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/member-login');
    });
  });

  test('renders page title after loading', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('我的会员卡')).toBeInTheDocument();
    });
  });

  test('renders page subtitle', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('查看会员权益和优惠券')).toBeInTheDocument();
    });
  });

  test('renders card number', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('8888 8888 8888 0001')).toBeInTheDocument();
    });
  });

  test('renders tier name', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('黄金会员')).toBeInTheDocument();
    });
  });

  test('renders member points', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('15,000 积分')).toBeInTheDocument();
    });
  });

  test('renders expiry date', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('有效期至 2027-12-31')).toBeInTheDocument();
    });
  });

  test('renders benefits section', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText(/黄金会员专属权益/)).toBeInTheDocument();
    });
  });

  // ====== 优惠券区域 ======

  test('renders coupon section title', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('我的优惠券')).toBeInTheDocument();
    });
  });

  test('renders total coupon count', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 4 张/)).toBeInTheDocument();
    });
  });

  test('renders unused coupon count', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // unusedCount
      expect(screen.getByText('可用')).toBeInTheDocument();
    });
  });

  test('renders used coupon count', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('已用')).toBeInTheDocument();
    });
  });

  test('renders expired coupon count', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('过期')).toBeInTheDocument();
    });
  });

  test('renders coupon names', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('满100减20')).toBeInTheDocument();
      expect(screen.getByText('8折优惠券')).toBeInTheDocument();
    });
  });

  // ====== 筛选测试 ======

  test('renders filter tabs', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('可用')).toBeInTheDocument();
      expect(screen.getByText('已用')).toBeInTheDocument();
      expect(screen.getByText('过期')).toBeInTheDocument();
    });
  });

  test('clicking "已用" filter shows used coupons only', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('8折优惠券')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('已用'));
    await waitFor(() => {
      expect(screen.queryByText('满100减20')).not.toBeInTheDocument();
      expect(screen.getByText('免运费券')).toBeInTheDocument();
    });
  });

  test('clicking "过期" filter shows expired coupons', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('满100减20')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('过期'));
    await waitFor(() => {
      expect(screen.getByText('礼品券')).toBeInTheDocument();
      expect(screen.queryByText('满100减20')).not.toBeInTheDocument();
    });
  });

  test('clicking "全部" shows all coupons after filtering', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('满100减20')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('已用'));
    await waitFor(() => {
      expect(screen.queryByText('满100减20')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('全部'));
    await waitFor(() => {
      expect(screen.getByText('满100减20')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('renders "立即使用" button for unused coupons', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      const useButtons = screen.getAllByText('立即使用');
      expect(useButtons.length).toBeGreaterThan(0);
    });
  });

  test('clicking "立即使用" redirects to stores', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      const useBtn = screen.getAllByText('立即使用')[0];
      fireEvent.click(useBtn);
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });
  });

  test('used coupons do not show "立即使用" button', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('已使用')).toBeInTheDocument();
    });
    const usedCouponSection = screen.getByText('已使用').closest('[style*="padding"]');
    expect(usedCouponSection?.querySelector('button')).toBeFalsy();
  });

  test('expired coupons show expiry badge', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      const expiredBadges = screen.getAllByText('已过期');
      expect(expiredBadges.length).toBeGreaterThan(0);
    });
  });

  test('used coupons show used badge', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('已使用')).toBeInTheDocument();
    });
  });

  // ====== 底部导航 ======

  test('renders bottom navigation bar', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('首页')).toBeInTheDocument();
      expect(screen.getByText('会员卡')).toBeInTheDocument();
    });
  });

  test('bottom nav "会员卡" is highlighted as active', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      const cardNav = screen.getByText('会员卡').closest('a');
      expect(cardNav).toHaveStyle({ color: '#f59e0b' });
    });
  });

  // ====== 加载态 ======

  test('shows loading indicator initially', () => {
    // Keep promises pending so loading stays true
    mockGetMemberCard.mockReturnValue(new Promise(() => {}));
    mockGetMemberCoupons.mockReturnValue(new Promise(() => {}));
    render(<MemberCardPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  // ====== 错误态/边界 ======

  test('shows error message when card fetch fails', async () => {
    mockGetMemberCard.mockResolvedValue({ success: false, error: { code: 'ERROR', message: 'Failed' } });
    mockGetMemberCoupons.mockResolvedValue(MOCK_COUPON_RESPONSE);
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('无法获取会员信息')).toBeInTheDocument();
    });
  });

  test('shows error message when both fetches fail', async () => {
    mockGetMemberCard.mockResolvedValue({ success: false, error: { code: 'ERROR', message: 'Failed' } });
    mockGetMemberCoupons.mockResolvedValue({ success: false, error: { code: 'ERROR', message: 'Failed' } });
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('无法获取会员信息')).toBeInTheDocument();
    });
  });

  test('shows empty coupon message when no coupons match filter', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText('满100减20')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('已用'));
    await waitFor(() => {
      expect(screen.getByText('免运费券')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('可用'));
    await waitFor(() => {
      expect(screen.queryByText('免运费券')).not.toBeInTheDocument();
    });
  });

  test('handles service exception gracefully', async () => {
    mockGetMemberCard.mockRejectedValue(new Error('Network error'));
    mockGetMemberCoupons.mockRejectedValue(new Error('Network error'));
    render(<MemberCardPage />);
    await waitFor(() => {
      // Should eventually stop loading, card will be null so "无法获取会员信息" shows
      expect(screen.getByText('无法获取会员信息')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows upgrade progress when pointsToNextTier > 0', async () => {
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.getByText(/还需/)).toBeInTheDocument();
      expect(screen.getByText(/5,000 积分/)).toBeInTheDocument();
    });
  });

  test('does not show upgrade progress when pointsToNextTier is 0', async () => {
    const cardNoUpgrade = { ...MOCK_CARD, pointsToNextTier: 0, nextTierName: '' };
    mockGetMemberCard.mockResolvedValue({ success: true, data: cardNoUpgrade });
    render(<MemberCardPage />);
    await waitFor(() => {
      expect(screen.queryByText(/距离/)).not.toBeInTheDocument();
      expect(screen.queryByText(/还需/)).not.toBeInTheDocument();
    });
  });
});
