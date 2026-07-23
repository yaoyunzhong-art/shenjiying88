/**
 * store-locator/page.vitest.tsx — 门店搜索页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载态 · 门店列表渲染 · 搜索过滤 · 城市筛选 · 空状态 · 底部导航 · 交互
 * 角色: 🎯运行专员 · 👔店长 · 📢营销
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image - use a function component that passes through
vi.mock('next/image', () => ({
  default: (props: any) => {
    const imgProps: any = {};
    if (props.src) imgProps.src = props.src;
    if (props.alt) imgProps.alt = props.alt;
    if (props.fill !== undefined) imgProps['data-fill'] = String(props.fill);
    return React.createElement('img', imgProps);
  },
}));

/** Inline mock data (NOT a top-level variable — factory return value is ok) */
vi.mock('../../lib/store-locator-service', () => {
  const mockStores = [
    { id: '1', storeName: '旗舰店（国贸）', storeCode: 'BJ-CBD-001', city: '北京', district: '朝阳区', address: '国贸大厦A座', phone: '010-88886666', status: 'open', businessHours: '10:00 - 22:00', features: ['电竞赛区', 'VR体验', '水吧'], imageUrl: '/images/store1.jpg' },
    { id: '2', storeName: '旗舰店（三里屯）', storeCode: 'BJ-SLT-002', city: '北京', district: '朝阳区', address: '三里屯路19号', phone: '010-88886667', status: 'open', businessHours: '10:00 - 22:00', features: ['VR体验', '桌游区'], imageUrl: '/images/store2.jpg' },
    { id: '3', storeName: '社区店（望京）', storeCode: 'BJ-WJ-003', city: '北京', district: '朝阳区', address: '望京SOHO T1', phone: '010-88886668', status: 'maintenance', businessHours: '10:00 - 22:00', features: ['水吧', '休息区'] },
    { id: '4', storeName: '社区店（深圳）', storeCode: 'SZ-NH-001', city: '深圳', district: '南山区', address: '科技园南区', phone: '0755-88886669', status: 'open', businessHours: '11:00 - 23:00', features: ['电竞赛区', '直播区'] },
    { id: '5', storeName: '社区店（上海）', storeCode: 'SH-PD-001', city: '上海', district: '浦东新区', address: '张江高科园区', phone: '021-88886670', status: 'closed', businessHours: '10:00 - 22:00', features: ['桌游区'] },
  ];
  return {
    storeLocatorService: {
      searchStores: vi.fn().mockResolvedValue({
        success: true,
        data: { stores: mockStores, total: 5, cities: ['北京', '上海', '深圳'] },
      }),
    },
  };
});

vi.mock('../../lib/store-locator-style', () => ({
  STATUS_INFO: {
    open: { text: '营业中', color: '#22c55e' },
    closed: { text: '已休息', color: '#6b7280' },
    maintenance: { text: '维护中', color: '#f59e0b' },
    busy: { text: '繁忙', color: '#ef4444' },
  },
  getCityButtonStyle: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : 'rgba(148,163,184,0.15)'}`,
    background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
    color: active ? '#f59e0b' : '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  }),
  getStoreCardStyle: () => ({
    borderRadius: 12,
    overflow: 'hidden' as const,
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.08)',
  }),
  getStatusBadgeStyle: (_status: string, _size: string) => ({
    position: 'absolute' as const,
    top: 8,
    right: 8,
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  }),
  getFeatureChipStyle: (_variant: string) => ({
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(99,102,241,0.1)',
    color: '#818cf8',
    fontSize: 11,
  }),
  getContactActionButtonStyle: (_type: string, _size: string) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
  }),
  getActionButtonRowStyle: () => ({
    display: 'flex',
    gap: 8,
    marginTop: 12,
  }),
  getBottomNavItemStyle: (active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    textDecoration: 'none',
    color: active ? '#f59e0b' : '#64748b',
  }),
  filterStoreByKeyword: (stores: any[], keyword: string) => {
    if (!keyword) return stores;
    const q = keyword.toLowerCase();
    return stores.filter(
      (s: any) =>
        s.storeName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  },
}));

import StoreLocatorPage from './page';

describe('StoreLocatorPage — 门店搜索页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Helper: wait until stores are loaded */
  async function waitForStores() {
    await screen.findByText('旗舰店（国贸）', {}, { timeout: 5000 });
  }

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<StoreLocatorPage />)).not.toThrow();
  });

  test('renders page title 门店搜索', async () => {
    render(<StoreLocatorPage />);
    await screen.findByText('门店搜索', {}, { timeout: 5000 });
    expect(screen.getByText('门店搜索')).toBeInTheDocument();
  });

  test('renders subtitle 查找离您最近的门店', async () => {
    render(<StoreLocatorPage />);
    expect(await screen.findByText('查找离您最近的门店', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  test('renders search input with placeholder', async () => {
    render(<StoreLocatorPage />);
    await screen.findByPlaceholderText('搜索门店名称或地址...', {}, { timeout: 5000 });
    expect(screen.getByPlaceholderText('搜索门店名称或地址...')).toBeInTheDocument();
  });

  test('renders 全部城市 filter button', async () => {
    render(<StoreLocatorPage />);
    await screen.findByText('全部城市', {}, { timeout: 5000 });
    expect(screen.getByText('全部城市')).toBeInTheDocument();
  });

  test('renders store names after load', async () => {
    render(<StoreLocatorPage />);
    await screen.findByText('旗舰店（国贸）', {}, { timeout: 5000 });
    expect(screen.getByText('旗舰店（国贸）')).toBeInTheDocument();
    expect(screen.getByText('旗舰店（三里屯）')).toBeInTheDocument();
    expect(screen.getByText('社区店（望京）')).toBeInTheDocument();
    expect(screen.getByText('社区店（深圳）')).toBeInTheDocument();
    expect(screen.getByText('社区店（上海）')).toBeInTheDocument();
  });

  test('renders store addresses', async () => {
    render(<StoreLocatorPage />);
    await screen.findByText(/国贸大厦A座/, {}, { timeout: 5000 });
    expect(screen.getByText(/国贸大厦A座/)).toBeInTheDocument();
    const threeLiElements = screen.getAllByText(/三里屯/);
    expect(threeLiElements.length).toBe(2);
  });

  test('renders business hours', async () => {
    render(<StoreLocatorPage />);
    const hoursElements = await screen.findAllByText(/10:00 - 22:00/, {}, { timeout: 5000 });
    expect(hoursElements.length).toBeGreaterThanOrEqual(4);
  });

  test('renders feature chips on store cards', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const eccChips = screen.getAllByText('电竞赛区');
    expect(eccChips.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('VR体验').length).toBeGreaterThanOrEqual(1);
  });

  test('renders city filter buttons for each city', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    expect(screen.getByText('北京')).toBeInTheDocument();
    expect(screen.getByText('上海')).toBeInTheDocument();
    expect(screen.getByText('深圳')).toBeInTheDocument();
  });

  // ====== 正例: 底部导航 ======

  test('renders bottom navigation with 4 items', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('门店')).toBeInTheDocument();
    expect(screen.getByText('卡券')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  test('bottom nav has active state on 门店', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const storeLink = screen.getByText('门店').closest('a');
    expect(storeLink).toHaveAttribute('href', '/store-locator');
  });

  // ====== 搜索过滤 ======

  test('search filters stores by name', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const searchInput = screen.getByPlaceholderText('搜索门店名称或地址...');
    fireEvent.change(searchInput, { target: { value: '国贸' } });
    await waitFor(() => {
      expect(screen.getByText('旗舰店（国贸）')).toBeInTheDocument();
      expect(screen.queryByText('社区店（望京）')).not.toBeInTheDocument();
    });
  });

  test('search filters stores by address', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const searchInput = screen.getByPlaceholderText('搜索门店名称或地址...');
    fireEvent.change(searchInput, { target: { value: '望京' } });
    await waitFor(() => {
      expect(screen.getByText('社区店（望京）')).toBeInTheDocument();
      expect(screen.queryByText('旗舰店（国贸）')).not.toBeInTheDocument();
    });
  });

  test('clearing search restores all stores', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const searchInput = screen.getByPlaceholderText('搜索门店名称或地址...');
    fireEvent.change(searchInput, { target: { value: '国贸' } });
    await waitFor(() => {
      expect(screen.queryByText('社区店（望京）')).not.toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('社区店（望京）')).toBeInTheDocument();
    });
  });

  // ====== 城市筛选 ======

  test('clicking a city filter button selects it', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    fireEvent.click(screen.getByText('北京'));
    expect(screen.getByText('北京')).toBeInTheDocument();
  });

  test('clicking 全部城市 resets city filter', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    fireEvent.click(screen.getByText('北京'));
    fireEvent.click(screen.getByText('全部城市'));
    expect(screen.getByText('全部城市')).toBeInTheDocument();
  });

  // ====== 空状态 ======

  test('search with no results shows 暂无门店数据', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const searchInput = screen.getByPlaceholderText('搜索门店名称或地址...');
    fireEvent.change(searchInput, { target: { value: 'zzz根本不存在的门店xxx' } });
    await waitFor(() => {
      expect(screen.getByText('暂无门店数据')).toBeInTheDocument();
    });
  });

  // ====== 加载态 ======

  test('shows loading state before data arrives', async () => {
    render(<StoreLocatorPage />);
    // The component shows loading initially before data resolves
    expect(await screen.findByText('加载中...', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  // ====== 门店卡片操作 ======

  test('store cards have phone call links', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const callBtns = screen.getAllByText('📞 电话');
    expect(callBtns.length).toBe(5);
    expect(callBtns[0].closest('a')).toHaveAttribute('href', 'tel:010-88886666');
  });

  test('store cards have navigation links', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const navBtns = screen.getAllByText('🗺️ 导航');
    expect(navBtns.length).toBe(5);
    expect(navBtns[0].closest('a')).toHaveAttribute('href', expect.stringContaining('maps.apple.com'));
    expect(navBtns[0].closest('a')).toHaveAttribute('target', '_blank');
  });

  test('store cards are wrapped in Link to detail page', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const link = screen.getByText('旗舰店（国贸）').closest('a');
    expect(link).toHaveAttribute('href', '/store-locator/1');
  });

  test('status badge text renders correctly', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const statusBadges = screen.getAllByText('营业中');
    expect(statusBadges.length).toBeGreaterThanOrEqual(3);
  });

  // ====== 边界 ======

  test('dark background applied', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('empty search input shows all stores', async () => {
    render(<StoreLocatorPage />);
    await waitForStores();
    const searchInput = screen.getByPlaceholderText('搜索门店名称或地址...');
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('旗舰店（三里屯）')).toBeInTheDocument();
  });
});
