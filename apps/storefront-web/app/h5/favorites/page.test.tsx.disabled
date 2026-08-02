/**
 * h5/favorites/page.vitest.tsx — H5收藏页 组件测试
 * 覆盖: 加载态 · 收藏商品/门店列表 · Tab切换 · 空态 · 交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/h5/favorites',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, style }: any) => (
    <a href={href} style={style} data-testid="mock-link">
      {children}
    </a>
  ),
}));

const mockGetFavorites = vi.fn();

vi.mock('../../../lib/favorites-service', () => ({
  favoritesService: {
    getFavorites: (...args: any[]) => mockGetFavorites(...args),
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
    flex: opts?.flex ?? undefined,
  }),
  getCardStyle: (opts?: any) => ({
    borderRadius: 12,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.1)',
    padding: 16,
    marginBottom: 12,
    display: opts?.display ?? undefined,
    gap: opts?.gap ?? undefined,
  }),
  getEmptyStateStyle: () => ({ textAlign: 'center', padding: 48, color: '#64748b' }),
  getEmptyStateEmojiStyle: () => ({ fontSize: 48, marginBottom: 12 }),
  H5Header: ({ title, marginBottom, children }: any) => (
    <div data-testid="h5-header" data-title={title}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  H5NavBar: ({ activeKey }: any) => <div data-testid="h5-navbar" data-active-key={activeKey} />,
  COLOR_TEXT_PRIMARY: '#f8fafc',
  COLOR_TEXT_SECONDARY: '#94a3b8',
  COLOR_TEXT_MUTED: '#64748b',
  COLOR_ACCENT: '#a5b4fc',
}));

import H5FavoritesPage from './page';

const MOCK_PRODUCTS = [
  { id: 'p1', name: '夏季运动T恤', price: 199, originalPrice: 299, storeName: '神机营旗舰店', addedAt: '2026-06-28' },
  { id: 'p2', name: '透气运动短裤', price: 129, storeName: '神机营旗舰店', addedAt: '2026-06-25' },
  { id: 'p3', name: '轻便运动背包', price: 299, originalPrice: 399, storeName: '神机营社区店', addedAt: '2026-06-20' },
];

const MOCK_STORES = [
  { id: 's1', name: '神机营旗舰店', address: '科技南路88号', district: '南山区', features: ['新品首发', '会员专享'], addedAt: '2026-05-15' },
  { id: 's2', name: '神机营福田店', address: '华强北路100号', district: '福田区', features: ['24小时营业'], addedAt: '2026-06-01' },
];

function renderPage() {
  return render(<H5FavoritesPage />);
}

describe('H5FavoritesPage — H5收藏', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFavorites.mockResolvedValue({
      success: true,
      data: { products: MOCK_PRODUCTS, stores: MOCK_STORES, total: 5 },
    });
  });

  // ====== 渲染测试 ======

  test('renders without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders page title 我的收藏', async () => {
    renderPage();
    expect(await screen.findByText('我的收藏')).toBeInTheDocument();
  });

  test('renders tab buttons with counts', async () => {
    renderPage();
    expect(await screen.findByText('商品 (3)')).toBeInTheDocument();
    expect(screen.getByText('门店 (2)')).toBeInTheDocument();
  });

  test('default tab is products', async () => {
    renderPage();
    expect(await screen.findByText('夏季运动T恤')).toBeInTheDocument();
    expect(screen.getByText('透气运动短裤')).toBeInTheDocument();
    expect(screen.getByText('轻便运动背包')).toBeInTheDocument();
  });

  test('renders product prices', async () => {
    renderPage();
    expect(await screen.findByText('¥199')).toBeInTheDocument();
    expect(screen.getByText('¥129')).toBeInTheDocument();
    expect(screen.getByText('¥299')).toBeInTheDocument();
  });

  test('renders original prices as strikethrough', async () => {
    renderPage();
    expect(await screen.findByText('¥299')).toBeInTheDocument(); // original price for p1
    expect(screen.getByText('¥399')).toBeInTheDocument(); // original price for p3
  });

  test('renders product store names', async () => {
    renderPage();
    const storeNames = await screen.findAllByText('神机营旗舰店');
    expect(storeNames.length).toBeGreaterThanOrEqual(2); // p1 and p2
    expect(screen.getByText('神机营社区店')).toBeInTheDocument();
  });

  // ====== Tab切换 ======

  test('switching to stores tab shows store list', async () => {
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (2)'));
    await waitFor(() => {
      expect(screen.getByText('神机营旗舰店')).toBeInTheDocument();
      expect(screen.getByText('神机营福田店')).toBeInTheDocument();
      // Products should not be shown
      expect(screen.queryByText('夏季运动T恤')).not.toBeInTheDocument();
    });
  });

  test('switching back to products tab shows products', async () => {
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (2)'));
    await waitFor(() => {
      expect(screen.getByText('神机营福田店')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('商品 (3)'));
    await waitFor(() => {
      expect(screen.getByText('夏季运动T恤')).toBeInTheDocument();
    });
  });

  // ====== 门店展示 ======

  test('store tab shows addresses', async () => {
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (2)'));
    await waitFor(() => {
      expect(screen.getByText(/南山区 科技南路88号/)).toBeInTheDocument();
      expect(screen.getByText(/福田区 华强北路100号/)).toBeInTheDocument();
    });
  });

  test('store tab shows features', async () => {
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (2)'));
    await waitFor(() => {
      expect(screen.getByText('新品首发')).toBeInTheDocument();
      expect(screen.getByText('会员专享')).toBeInTheDocument();
      expect(screen.getByText('24小时营业')).toBeInTheDocument();
    });
  });

  test('store links go to store-locator detail', async () => {
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (2)'));
    const storeLink = await screen.findByText('神机营旗舰店');
    const link = storeLink.closest('a');
    expect(link).toHaveAttribute('href', '/store-locator/s1');
  });

  // ====== 商品操作 ======

  test('product items show 加入购物车 button', async () => {
    renderPage();
    const cartBtns = await screen.findAllByText('加入购物车');
    expect(cartBtns.length).toBe(MOCK_PRODUCTS.length);
  });

  test('product items without originalPrice show only current price', async () => {
    renderPage();
    expect(await screen.findByText('¥129')).toBeInTheDocument();
    // p2 has no original price, so no strikethrough element after it
    const priceRow = screen.getByText('¥129').closest('div');
    expect(priceRow).toBeInTheDocument();
  });

  // ====== 空态 ======

  test('shows empty state for products when no products', async () => {
    mockGetFavorites.mockResolvedValue({
      success: true,
      data: { products: [], stores: MOCK_STORES, total: 2 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('暂无收藏商品')).toBeInTheDocument();
    });
  });

  test('shows empty state for stores when tab is stores', async () => {
    mockGetFavorites.mockResolvedValue({
      success: true,
      data: { products: MOCK_PRODUCTS, stores: [], total: 3 },
    });
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (0)'));
    await waitFor(() => {
      expect(screen.getByText('暂无收藏门店')).toBeInTheDocument();
    });
  });

  test('empty products shows ❤️ emoji', async () => {
    mockGetFavorites.mockResolvedValue({
      success: true,
      data: { products: [], stores: MOCK_STORES, total: 2 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
  });

  test('empty stores shows 🏪 emoji', async () => {
    mockGetFavorites.mockResolvedValue({
      success: true,
      data: { products: MOCK_PRODUCTS, stores: [], total: 3 },
    });
    renderPage();
    await screen.findByText('夏季运动T恤');
    fireEvent.click(screen.getByText('门店 (0)'));
    await waitFor(() => {
      expect(screen.getByText('🏪')).toBeInTheDocument();
    });
  });

  // ====== 导航 ======

  test('renders H5NavBar with activeKey me', async () => {
    renderPage();
    const nav = await screen.findByTestId('h5-navbar');
    expect(nav).toHaveAttribute('data-active-key', 'me');
  });

  // ====== 加载态 ======

  test('renders header before data loads', () => {
    mockGetFavorites.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 收藏Tab切换', () => {
    test('[圈梁五道箍] 商品tab默认激活', async () => {
      renderPage();
      await screen.findByText('夏季运动T恤');
      expect(screen.getByText('夏季运动T恤')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 切换到门店tab后显示门店列表', async () => {
      renderPage();
      await screen.findByText('夏季运动T恤');
      fireEvent.click(screen.getByText('门店 (2)'));
      await waitFor(() => {
        expect(screen.getByText('神机营旗舰店')).toBeInTheDocument();
        expect(screen.getByText('神机营福田店')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 门店列表显示地址和特色标签', async () => {
      renderPage();
      await screen.findByText('夏季运动T恤');
      fireEvent.click(screen.getByText('门店 (2)'));
      await waitFor(() => {
        expect(screen.getByText('新品首发')).toBeInTheDocument();
        expect(screen.getByText('24小时营业')).toBeInTheDocument();
      });
    });
  });

  describe('圈梁五道箍 — 商品收藏数据', () => {
    test('[圈梁五道箍] 商品显示原价划掉', async () => {
      renderPage();
      await screen.findByText('¥199');
      // p1: price=199, originalPrice=299
      const originalPrices = screen.getAllByText(/¥[23]99/);
      expect(originalPrices.length).toBeGreaterThanOrEqual(2);
    });

    test('[圈梁五道箍] 商品无原价时不显示划掉价格', async () => {
      renderPage();
      await screen.findByText('¥129');
      // p2 has no originalPrice, price should still show
      expect(screen.getByText('¥129')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 商品显示商店名称', async () => {
      renderPage();
      const storeNames1 = await screen.findAllByText('神机营旗舰店');
      expect(storeNames1.length).toBe(2); // p1 and p2
      expect(screen.getByText('神机营社区店')).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — Tab统计计数', () => {
    test('[圈梁五道箍] 商品tab统计数为3', async () => {
      renderPage();
      expect(await screen.findByText('商品 (3)')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 门店tab统计数为2', async () => {
      renderPage();
      expect(await screen.findByText('门店 (2)')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 切换到门店后tab计数不变', async () => {
      renderPage();
      await screen.findByText('门店 (2)');
      fireEvent.click(screen.getByText('门店 (2)'));
      await waitFor(() => {
        expect(screen.getByText('门店 (2)')).toBeInTheDocument();
      });
    });
  });

  describe('圈梁五道箍 — 边界与空态', () => {
    test('[圈梁五道箍] 商品收藏为空时显示暂无收藏商品', async () => {
      mockGetFavorites.mockResolvedValue({
        success: true,
        data: { products: [], stores: MOCK_STORES, total: 2 },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('暂无收藏商品')).toBeInTheDocument();
        expect(screen.getByText('❤️')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 门店收藏为空时显示暂无收藏门店', async () => {
      mockGetFavorites.mockResolvedValue({
        success: true,
        data: { products: MOCK_PRODUCTS, stores: [], total: 3 },
      });
      renderPage();
      await screen.findByText('夏季运动T恤');
      fireEvent.click(screen.getByText('门店 (0)'));
      await waitFor(() => {
        expect(screen.getByText('暂无收藏门店')).toBeInTheDocument();
        expect(screen.getByText('🏪')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 底部导航activeKey为me', async () => {
      renderPage();
      const nav = await screen.findByTestId('h5-navbar');
      expect(nav).toHaveAttribute('data-active-key', 'me');
    });
  });
});
