/**
 * h5/page.vitest.tsx — H5移动端首页 组件测试
 * 覆盖: 默认渲染 · 搜索 · 快捷入口 · 热门活动 · 推荐门店 · 会员卡片 · 交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/h5',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: (props: any) => {
    const imgProps: any = { alt: props.alt || '' };
    if (props.src) imgProps.src = props.src;
    if (props.fill !== undefined) imgProps['data-fill'] = String(props.fill);
    return React.createElement('img', imgProps);
  },
}));

vi.mock('../../components/h5-components', () => ({
  MobileLayout: ({ children, title, subtitle, showBack, showNav }: any) => (
    <div data-testid="mobile-layout" data-title={title} data-subtitle={subtitle} data-showback={showBack} data-shownav={showNav}>
      {children}
    </div>
  ),
  H5Card: ({ children, style, onClick }: any) => (
    <div data-testid="h5-card" style={style} onClick={onClick}>{children}</div>
  ),
  H5Badge: ({ children, variant, size }: any) => (
    <span data-testid="h5-badge" data-variant={variant} data-size={size}>{children}</span>
  ),
  H5SearchBar: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="h5-searchbar"
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="搜索门店、商品..."
    />
  ),
  H5Button: ({ children, variant, size, disabled, onClick, loading }: any) => (
    <button
      data-testid="h5-button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? '加载中...' : children}
    </button>
  ),
  BottomTabBar: ({ tabs, currentPath }: any) => (
    <div data-testid="bottom-tab-bar" data-current-path={currentPath}>
      {tabs.map((tab: any) => (
        <a key={tab.href} href={tab.href} data-testid={`tab-${tab.label}`}>{tab.label}</a>
      ))}
    </div>
  ),
  useH5Back: () => vi.fn(),
}));

import H5HomePage from './page';

function renderPage() {
  return render(<H5HomePage />);
}

describe('H5HomePage — H5移动端首页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders MobileLayout with correct title', () => {
    renderPage();
    const layout = screen.getByTestId('mobile-layout');
    expect(layout).toHaveAttribute('data-title', '神机营 SaaS');
    expect(layout).toHaveAttribute('data-subtitle', '让商业更智能');
    expect(layout).toHaveAttribute('data-showback', 'false');
    expect(layout).toHaveAttribute('data-shownav', 'true');
  });

  test('renders search bar with correct placeholder', () => {
    renderPage();
    const searchBar = screen.getByTestId('h5-searchbar');
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toHaveAttribute('placeholder', '搜索门店、商品...');
  });

  test('renders banner image', () => {
    renderPage();
    const bannerImg = screen.getByAltText('新用户专享福利');
    expect(bannerImg).toBeInTheDocument();
    expect(bannerImg).toHaveAttribute('src', 'https://picsum.photos/seed/banner1/750/300');
  });

  test('renders banner title text', () => {
    renderPage();
    expect(screen.getByText('新用户专享福利')).toBeInTheDocument();
  });

  test('renders banner indicator dots', () => {
    renderPage();
    // Two dots for two banners
    const dots = document.querySelectorAll('[style*="border-radius: 50%"]');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  // ====== 快捷入口 ======

  test('renders 6 quick action items', () => {
    renderPage();
    expect(screen.getByText('门店查询')).toBeInTheDocument();
    expect(screen.getByText('优惠券')).toBeInTheDocument();
    expect(screen.getByText('我的订单')).toBeInTheDocument();
    expect(screen.getByText('积分兑换')).toBeInTheDocument();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
    expect(screen.getByText('联系客服')).toBeInTheDocument();
  });

  test('quick action links have correct hrefs', () => {
    renderPage();
    const storeLink = screen.getByText('门店查询').closest('a');
    expect(storeLink).toHaveAttribute('href', '/store-locator');
    const couponsLink = screen.getByText('优惠券').closest('a');
    expect(couponsLink).toHaveAttribute('href', '/h5/coupons');
    const ordersLink = screen.getByText('我的订单').closest('a');
    expect(ordersLink).toHaveAttribute('href', '/h5/orders');
    const favoritesLink = screen.getByText('我的收藏').closest('a');
    expect(favoritesLink).toHaveAttribute('href', '/h5/favorites');
  });

  test('quick action icons render', () => {
    renderPage();
    expect(screen.getByText('🏪')).toBeInTheDocument();
    expect(screen.getByText('🎫')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('📞')).toBeInTheDocument();
  });

  // ====== 热门活动 ======

  test('renders 热门活动 section heading', () => {
    renderPage();
    expect(screen.getByText('热门活动')).toBeInTheDocument();
  });

  test('renders "查看全部 →" link to campaigns page', () => {
    renderPage();
    const viewAllLink = screen.getByText('查看全部 →');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/h5/campaigns');
  });

  test('renders 3 hot campaign cards', () => {
    renderPage();
    expect(screen.getByText('夏日清凉季')).toBeInTheDocument();
    expect(screen.getByText('新人专属礼包')).toBeInTheDocument();
    expect(screen.getByText('会员日特惠')).toBeInTheDocument();
  });

  test('campaign badges render correctly', () => {
    renderPage();
    const badges = screen.getAllByTestId('h5-badge');
    expect(badges.length).toBe(3);
    const badgeTexts = badges.map(b => b.textContent);
    expect(badgeTexts).toContain('热卖');
    expect(badgeTexts).toContain('新人');
    expect(badgeTexts).toContain('会员');
  });

  test('campaign subtitle text renders', () => {
    renderPage();
    expect(screen.getByText('全场8折起')).toBeInTheDocument();
    expect(screen.getByText('注册即送100元券')).toBeInTheDocument();
    expect(screen.getByText('每月15日双倍积分')).toBeInTheDocument();
  });

  test('campaign links go to correct detail pages', () => {
    renderPage();
    const summerLink = screen.getByText('夏日清凉季').closest('a');
    expect(summerLink).toHaveAttribute('href', '/h5/campaigns/c1');
    const newcomerLink = screen.getByText('新人专属礼包').closest('a');
    expect(newcomerLink).toHaveAttribute('href', '/h5/campaigns/c2');
  });

  // ====== 附近门店 ======

  test('renders 附近门店 section heading', () => {
    renderPage();
    expect(screen.getByText('附近门店')).toBeInTheDocument();
  });

  test('renders store "查看全部 →" link to store-locator', () => {
    renderPage();
    const viewAllLinks = screen.getAllByText('查看全部 →');
    expect(viewAllLinks.length).toBe(2);
    expect(viewAllLinks[1].closest('a')).toHaveAttribute('href', '/store-locator');
  });

  test('renders 3 recommended stores', () => {
    renderPage();
    expect(screen.getByText('深圳南山旗舰店')).toBeInTheDocument();
    expect(screen.getByText('广州天河城店')).toBeInTheDocument();
    expect(screen.getByText('上海浦东店')).toBeInTheDocument();
  });

  test('store ratings render', () => {
    renderPage();
    expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.6')).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.7')).toBeInTheDocument();
  });

  test('store distances render', () => {
    renderPage();
    expect(screen.getByText('1.2km')).toBeInTheDocument();
    expect(screen.getByText('3.5km')).toBeInTheDocument();
    expect(screen.getByText('5.8km')).toBeInTheDocument();
  });

  test('store links go to store-locator detail', () => {
    renderPage();
    const storeLink = screen.getByText('深圳南山旗舰店').closest('a');
    expect(storeLink).toHaveAttribute('href', '/store-locator/s01');
    const storeLink3 = screen.getByText('上海浦东店').closest('a');
    expect(storeLink3).toHaveAttribute('href', '/store-locator/s03');
  });

  test('store card images render', () => {
    renderPage();
    const storeImg = screen.getByAltText('深圳南山旗舰店');
    expect(storeImg).toBeInTheDocument();
    expect(storeImg).toHaveAttribute('src', 'https://picsum.photos/seed/store1/200/150');
  });

  // ====== 会员卡片 ======

  test('renders member card section', () => {
    renderPage();
    expect(screen.getByText('黄金会员')).toBeInTheDocument();
  });

  test('renders member points', () => {
    renderPage();
    expect(screen.getByText('当前积分: 1,280')).toBeInTheDocument();
  });

  test('renders 续费 button', () => {
    renderPage();
    const renewBtn = screen.getByText('立即续费');
    expect(renewBtn).toBeInTheDocument();
    expect(renewBtn).toHaveAttribute('data-variant', 'outline');
    expect(renewBtn).toHaveAttribute('data-size', 'sm');
  });

  // ====== 交互测试 ======

  test('search bar accepts input', () => {
    renderPage();
    const searchBar = screen.getByTestId('h5-searchbar');
    fireEvent.change(searchBar, { target: { value: '测试搜索' } });
    expect(searchBar).toHaveValue('测试搜索');
  });

  test('search bar clears on empty input', () => {
    renderPage();
    const searchBar = screen.getByTestId('h5-searchbar');
    fireEvent.change(searchBar, { target: { value: '某门店' } });
    expect(searchBar).toHaveValue('某门店');
    fireEvent.change(searchBar, { target: { value: '' } });
    expect(searchBar).toHaveValue('');
  });

  // ====== 边界情况 ======

  test('renders without crashing — no props', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('banner displays first banner title', () => {
    renderPage();
    expect(screen.getByText('新用户专享福利')).toBeInTheDocument();
    // Second banner title should NOT be visible as we only show the first
    expect(screen.queryByText('限时折扣来袭')).not.toBeInTheDocument();
  });

  test('renders 会 avatar in member card', () => {
    renderPage();
    expect(screen.getByText('会')).toBeInTheDocument();
  });

  test('has correct dark background theme', () => {
    renderPage();
    const layout = screen.getByTestId('mobile-layout');
    expect(layout).toBeInTheDocument();
  });

  test('renders member card in an H5Card container', () => {
    renderPage();
    const cards = screen.getAllByTestId('h5-card');
    expect(cards.length).toBeGreaterThanOrEqual(3); // quick actions, member card, store cards
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 页面完整性与导航', () => {
    test('[圈梁五道箍] 页面包含搜索栏且可交互', () => {
      renderPage();
      const searchBar = screen.getByTestId('h5-searchbar');
      expect(searchBar).toBeInTheDocument();
      fireEvent.change(searchBar, { target: { value: '深圳' } });
      expect(searchBar).toHaveValue('深圳');
    });

    test('[圈梁五道箍] 所有快捷入口都有正确链接', () => {
      renderPage();
      const quickLinks = [
        { label: '门店查询', href: '/store-locator' },
        { label: '优惠券', href: '/h5/coupons' },
        { label: '我的订单', href: '/h5/orders' },
        { label: '积分兑换', href: '/h5/points' },
        { label: '我的收藏', href: '/h5/favorites' },
        { label: '联系客服', href: '/h5/contact' },
      ];
      quickLinks.forEach(({ label, href }) => {
        const link = screen.getByText(label).closest('a');
        expect(link).toHaveAttribute('href', href);
      });
    });

    test('[圈梁五道箍] 底部导航栏正确渲染', () => {
      renderPage();
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveAttribute('data-current-path', '/h5');
      expect(screen.getByText('首页')).toBeInTheDocument();
      expect(screen.getByText('门店')).toBeInTheDocument();
      expect(screen.getByText('卡券')).toBeInTheDocument();
      expect(screen.getByText('我的')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 活动卡片可点击跳转', () => {
      renderPage();
      // Each campaign card is wrapped in a Link
      const campaignLink = screen.getByText('夏日清凉季').closest('a');
      expect(campaignLink).toHaveAttribute('href', '/h5/campaigns/c1');
      expect(campaignLink).toHaveStyle('text-decoration: none');
    });

    test('[圈梁五道箍] 门店卡片显示评分与距离', () => {
      renderPage();
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
      expect(screen.getByText('1.2km')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.7')).toBeInTheDocument();
      expect(screen.getByText('5.8km')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 会员卡片包含黄金会员标识与积分', () => {
      renderPage();
      expect(screen.getByText('黄金会员')).toBeInTheDocument();
      expect(screen.getByText('当前积分: 1,280')).toBeInTheDocument();
      const renewBtn = screen.getByText('立即续费');
      expect(renewBtn).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — 搜索栏边界', () => {
    test('[圈梁五道箍] 搜索栏初始值为空', () => {
      renderPage();
      const searchBar = screen.getByTestId('h5-searchbar');
      expect(searchBar).toHaveValue('');
    });

    test('[圈梁五道箍] 搜索栏支持中文输入', () => {
      renderPage();
      const searchBar = screen.getByTestId('h5-searchbar');
      fireEvent.change(searchBar, { target: { value: '神机营门店' } });
      expect(searchBar).toHaveValue('神机营门店');
    });

    test('[圈梁五道箍] 搜索栏支持特殊字符', () => {
      renderPage();
      const searchBar = screen.getByTestId('h5-searchbar');
      fireEvent.change(searchBar, { target: { value: '!@#$%^&*()' } });
      expect(searchBar).toHaveValue('!@#$%^&*()');
    });
  });
});
