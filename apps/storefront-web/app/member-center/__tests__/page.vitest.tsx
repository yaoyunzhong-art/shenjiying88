import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();
const mockSuccess = vi.fn();
const mockLoading = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, style, ...rest }: any) => (
    <a href={href} style={style} {...rest}>{children}</a>
  ),
}));

let localStorageStore: Record<string, string | null> = {};

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { localStorageStore = {}; }),
});

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn((...args: any[]) => mockSuccess(...args)),
      loading: vi.fn((...args: any[]) => mockLoading(...args)),
    },
    // Let real antd handle Card, Tag, Progress, etc. They render DOM
  };
});

// Mock individual antd sub-components used in page
vi.mock('@ant-design/icons', () => ({
  GiftOutlined: () => <span data-testid="icon-gift">🎁</span>,
  CreditCardOutlined: () => <span data-testid="icon-creditcard">💳</span>,
  ShoppingCartOutlined: () => <span data-testid="icon-cart">🛒</span>,
  StarOutlined: () => <span data-testid="icon-star">⭐</span>,
  ShopOutlined: () => <span data-testid="icon-shop">🏪</span>,
  LogoutOutlined: () => <span data-testid="icon-logout">🚪</span>,
  EnvironmentOutlined: () => <span data-testid="icon-env">📍</span>,
  CalendarOutlined: () => <span data-testid="icon-calendar">📅</span>,
  PercentageOutlined: () => <span data-testid="icon-pct">%</span>,
}));

// ---- Test Subject ----

import MemberCenterPage from '../page';

const MOCK_MEMBER = {
  memberId: 'mem-001',
  mobile: '13800138000',
  nickname: '测试用户',
  tier: 'gold' as const,
  points: 15000,
  storeName: 'Demo Store 旗舰店',
};

describe('MemberCenterPage — 会员中心', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore = {};
    localStorageStore['member_access_token'] = 'test-token';
    localStorageStore['member_info'] = JSON.stringify(MOCK_MEMBER);
    mockPush.mockReset();
    mockSuccess.mockReset();
    mockLoading.mockReset();
  });

  afterEach(() => {
    localStorageStore = {};
  });

  // Helper: wait for loading to complete
  async function waitForLoaded() {
    await waitFor(() => {
      expect(screen.queryByText(/会员中心/)).toBeInTheDocument();
    }, { timeout: 3000 });
  }

  // ====== 渲染测试 ======

  test('redirects to login when no token present', async () => {
    localStorageStore = {};
    render(<MemberCenterPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/member-login');
    });
  });

  test('redirects to login when member_info parsing fails', async () => {
    localStorageStore['member_info'] = 'invalid-json';
    render(<MemberCenterPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/member-login');
    });
  });

  test('renders member center title after loading', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('会员中心')).toBeInTheDocument();
  });

  test('renders member nickname after loading', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('测试用户')).toBeInTheDocument();
  });

  test('renders membership tier badge', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('黄金会员')).toBeInTheDocument();
  });

  test('renders member mobile number', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('13800138000')).toBeInTheDocument();
  });

  test('renders member ID', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('mem-001')).toBeInTheDocument();
  });

  test('renders store name', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText(/Demo Store 旗舰店/)).toBeInTheDocument();
  });

  test('renders points stat card', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('我的积分')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument(); // member.points
  });

  test('renders balance stat card', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('账户余额')).toBeInTheDocument();
  });

  test('renders recharge button', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('积分充值')).toBeInTheDocument();
  });

  test('renders tier upgrade progress section', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    // Gold tier should show progress to diamond
    expect(screen.getByText(/已达最高等级|距离/)).toBeInTheDocument();
  });

  test('renders member benefits section', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('会员权益')).toBeInTheDocument();
  });

  // ====== 会员权益测试 ======

  test('renders benefits for gold member', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    // Gold member gets: 积分倍率, 生日礼遇, 专属折扣, 生日特权
    expect(screen.getByText('积分倍率')).toBeInTheDocument();
    expect(screen.getByText('生日礼遇')).toBeInTheDocument();
    expect(screen.getByText('专属折扣')).toBeInTheDocument();
    expect(screen.getByText('生日特权')).toBeInTheDocument();
  });

  test('gold member has 2x point multiplier', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('2x')).toBeInTheDocument(); // getPointsMultiplier('gold') = 2
  });

  test('gold member has 10% discount', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('10%')).toBeInTheDocument(); // getDiscountRate('gold') = 10
  });

  test('gold member has 精致礼品+双倍积分 birthday', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('精致礼品+双倍积分')).toBeInTheDocument();
  });

  // ====== 最近消费记录测试 ======

  test('renders recent orders section', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('最近消费记录')).toBeInTheDocument();
  });

  test('renders order entries', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('ORD20260701001')).toBeInTheDocument();
    expect(screen.getByText('ORD20260628002')).toBeInTheDocument();
    expect(screen.getByText('ORD20260625003')).toBeInTheDocument();
  });

  test('renders order amounts', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('¥128.00')).toBeInTheDocument();
    expect(screen.getByText('¥56.50')).toBeInTheDocument();
    expect(screen.getByText('¥399.00')).toBeInTheDocument();
  });

  test('renders order status as completed', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    const completedTags = screen.getAllByText('已完成');
    expect(completedTags.length).toBe(5); // all 5 mock orders are completed
  });

  // ====== 快捷功能测试 ======

  test('renders quick action menu section', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('快捷功能')).toBeInTheDocument();
  });

  test('renders 我的订单 quick link', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('我的订单')).toBeInTheDocument();
  });

  test('renders 我的优惠券 quick link', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('我的优惠券')).toBeInTheDocument();
  });

  test('renders 会员卡 quick link', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    const cardLinks = screen.getAllByText('会员卡');
    expect(cardLinks.length).toBeGreaterThan(0);
  });

  test('renders 我的收藏 quick link', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
  });

  test('renders 所属门店 quick link', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('所属门店')).toBeInTheDocument();
  });

  test('quick links have correct hrefs', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    const orderLink = screen.getByText('我的订单').closest('a');
    expect(orderLink).toHaveAttribute('href', '/orders');
    const couponLink = screen.getByText('我的优惠券').closest('a');
    expect(couponLink).toHaveAttribute('href', '/member-card');
  });

  // ====== 底部导航测试 ======

  test('renders bottom navigation bar', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('门店')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  test('bottom nav "我的" is highlighted as active', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    const meLink = screen.getByText('我的').closest('a');
    expect(meLink).toHaveStyle({ color: '#f59e0b' }); // active color
  });

  // ====== 交互测试 ======

  test('logout button clears storage and redirects', async () => {
    render(<MemberCenterPage />);
    await waitForLoaded();
    const logoutBtn = screen.getByText('退出');
    fireEvent.click(logoutBtn);
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_info');
    expect(mockSuccess).toHaveBeenCalledWith('已安全退出');
    expect(mockPush).toHaveBeenCalledWith('/member-login');
  });

  test('recharge button shows loading then success', async () => {
    vi.useFakeTimers();
    render(<MemberCenterPage />);
    await waitForLoaded();
    const rechargeBtn = screen.getByText('积分充值');
    fireEvent.click(rechargeBtn);
    expect(mockLoading).toHaveBeenCalled();
    // Fast forward past the 1500ms timeout
    act(() => { vi.advanceTimersByTime(2000); });
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ content: '充值功能即将上线' }),
      );
    });
    vi.useRealTimers();
  });

  // ====== 边界情况 ======

  test('renders without crashing', () => {
    const { container } = render(<MemberCenterPage />);
    expect(container).toBeTruthy();
  });

  test('handles missing member_info gracefully', async () => {
    localStorageStore['member_info'] = undefined as any;
    render(<MemberCenterPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/member-login');
    });
  });

  test('shows loading skeleton initially', () => {
    // Since loading is true initially, Skeleton should render
    render(<MemberCenterPage />);
    // Skeleton renders active, should be visible
    expect(document.querySelector('.ant-skeleton')).toBeTruthy();
  });

  test('diamond member shows correct benefits', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'diamond',
      points: 80000,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('钻石会员')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument(); // 3x multiplier
    expect(screen.getByText('15%')).toBeInTheDocument(); // 15% discount
  });

  test('progress shows "已达最高等级" for diamond member', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'diamond',
      points: 80000,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText(/已达最高等级/)).toBeInTheDocument();
  });

  test('basic member has 0% discount', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'basic',
      points: 100,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('basic member does not have 生日特权 benefit', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'basic',
      points: 100,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    // Basic member: 积分倍率, 生日礼遇, 专属折扣 — no 生日特权
    expect(screen.getByText('积分倍率')).toBeInTheDocument();
    expect(screen.getByText('生日礼遇')).toBeInTheDocument();
    expect(screen.getByText('专属折扣')).toBeInTheDocument();
    expect(screen.queryByText('生日特权')).not.toBeInTheDocument();
  });

  test('silver member has 8% discount', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'silver',
      points: 5000,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  test('bronze member has 5% discount', async () => {
    localStorageStore['member_info'] = JSON.stringify({
      ...MOCK_MEMBER,
      tier: 'bronze',
      points: 3000,
    });
    render(<MemberCenterPage />);
    await waitForLoaded();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('1.2x')).toBeInTheDocument(); // 1.2x multiplier
  });
});
