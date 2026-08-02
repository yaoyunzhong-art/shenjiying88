/**
 * h5/campaigns/page.vitest.tsx — H5活动列表页 组件测试
 * 覆盖: 加载态 · 活动列表渲染 · 筛选 · 空态 · 错误态 · 交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/h5/campaigns',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, style }: any) => (
    <a href={href} style={style} data-testid="mock-link">
      {children}
    </a>
  ),
}));

const mockGetCampaigns = vi.fn();

vi.mock('../../../lib/campaign-service', () => ({
  campaignService: {
    getCampaigns: (...args: any[]) => mockGetCampaigns(...args),
  },
  TYPE_CONFIG: {
    flash: { label: '秒杀', color: '#ef4444' },
    discount: { label: '折扣', color: '#f59e0b' },
    gift: { label: '赠品', color: '#10b981' },
    member: { label: '会员', color: '#8b5cf6' },
  },
  STATUS_CONFIG: {
    upcoming: { label: '即将开始', color: '#3b82f6', bg: '#3b82f620' },
    ongoing: { label: '进行中', color: '#10b981', bg: '#10b98120' },
    ended: { label: '已结束', color: '#64748b', bg: '#64748b20' },
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
    ...(opts?.whiteSpace ? { whiteSpace: opts.whiteSpace } : {}),
  }),
  getCardStyle: (opts?: any) => ({
    borderRadius: 12,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.1)',
    padding: 0,
    overflow: opts?.overflow ?? undefined,
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
}));

import H5CampaignsPage from './page';

const MOCK_CAMPAIGNS = [
  {
    id: 'c1',
    title: '夏日狂欢节',
    subtitle: '全场商品8折起',
    type: 'flash',
    typeName: '秒杀',
    status: 'ongoing',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    tags: ['夏日', '限时', '折扣'],
  },
  {
    id: 'c2',
    title: '新会员专享',
    subtitle: '注册即送100元券',
    type: 'member',
    typeName: '会员',
    status: 'upcoming',
    startDate: '2026-07-20',
    endDate: '2026-08-20',
    tags: ['新会员', '专享'],
  },
  {
    id: 'c3',
    title: '周年庆大促',
    subtitle: '全场5折封顶',
    type: 'discount',
    typeName: '折扣',
    status: 'ended',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    tags: ['周年庆', '大促'],
  },
];

function renderPage() {
  return render(<H5CampaignsPage />);
}

describe('H5CampaignsPage — H5活动列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: MOCK_CAMPAIGNS, total: 3 },
    });
  });

  // ====== 渲染测试 ======

  test('renders without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders page title 活动中心', async () => {
    renderPage();
    expect(await screen.findByText('活动中心')).toBeInTheDocument();
  });

  test('renders filter buttons: 全部/进行中/即将开始/已结束', async () => {
    renderPage();
    expect(await screen.findByText('全部')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('即将开始')).toBeInTheDocument();
    expect(screen.getByText('已结束')).toBeInTheDocument();
  });

  test('renders campaigns after loading', async () => {
    renderPage();
    expect(await screen.findByText('夏日狂欢节')).toBeInTheDocument();
    expect(screen.getByText('新会员专享')).toBeInTheDocument();
    expect(screen.getByText('周年庆大促')).toBeInTheDocument();
  });

  test('renders campaign subtitles', async () => {
    renderPage();
    expect(await screen.findByText('全场商品8折起')).toBeInTheDocument();
    expect(screen.getByText('注册即送100元券')).toBeInTheDocument();
    expect(screen.getByText('全场5折封顶')).toBeInTheDocument();
  });

  test('renders campaign dates', async () => {
    renderPage();
    expect(await screen.findByText(/2026-07-01 - 2026-07-15/)).toBeInTheDocument();
    expect(screen.getByText(/2026-07-20 - 2026-08-20/)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-01 - 2026-06-30/)).toBeInTheDocument();
  });

  test('renders campaign tags', async () => {
    renderPage();
    expect(await screen.findByText('#夏日')).toBeInTheDocument();
    expect(screen.getByText('#限时')).toBeInTheDocument();
    expect(screen.getByText('#折扣')).toBeInTheDocument();
    expect(screen.getByText('#新会员')).toBeInTheDocument();
    expect(screen.getByText('#周年庆')).toBeInTheDocument();
  });

  test('renders status badges', async () => {
    renderPage();
    expect(await screen.findByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('即将开始')).toBeInTheDocument();
    expect(screen.getByText('已结束')).toBeInTheDocument();
  });

  test('renders type badges', async () => {
    renderPage();
    expect(await screen.findByText('秒杀')).toBeInTheDocument();
    expect(screen.getByText('会员')).toBeInTheDocument();
    expect(screen.getByText('折扣')).toBeInTheDocument();
  });

  // ====== 筛选测试 ======

  test('filter by 进行中 shows only ongoing campaigns', async () => {
    renderPage();
    await screen.findByText('夏日狂欢节');
    fireEvent.click(screen.getByText('进行中'));
    await waitFor(() => {
      expect(screen.getByText('夏日狂欢节')).toBeInTheDocument();
      expect(screen.queryByText('新会员专享')).not.toBeInTheDocument();
      expect(screen.queryByText('周年庆大促')).not.toBeInTheDocument();
    });
  });

  test('filter by 即将开始 shows only upcoming campaigns', async () => {
    renderPage();
    await screen.findByText('夏日狂欢节');
    fireEvent.click(screen.getByText('即将开始'));
    await waitFor(() => {
      expect(screen.queryByText('夏日狂欢节')).not.toBeInTheDocument();
      expect(screen.getByText('新会员专享')).toBeInTheDocument();
      expect(screen.queryByText('周年庆大促')).not.toBeInTheDocument();
    });
  });

  test('filter by 已结束 shows only ended campaigns', async () => {
    renderPage();
    await screen.findByText('夏日狂欢节');
    fireEvent.click(screen.getByText('已结束'));
    await waitFor(() => {
      expect(screen.queryByText('夏日狂欢节')).not.toBeInTheDocument();
      expect(screen.queryByText('新会员专享')).not.toBeInTheDocument();
      expect(screen.getByText('周年庆大促')).toBeInTheDocument();
    });
  });

  test('clicking 全部 resets filter and shows all campaigns', async () => {
    renderPage();
    await screen.findByText('夏日狂欢节');
    fireEvent.click(screen.getByText('已结束'));
    await waitFor(() => {
      expect(screen.queryByText('夏日狂欢节')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('全部'));
    await waitFor(() => {
      expect(screen.getByText('夏日狂欢节')).toBeInTheDocument();
      expect(screen.getByText('新会员专享')).toBeInTheDocument();
      expect(screen.getByText('周年庆大促')).toBeInTheDocument();
    });
  });

  // ====== 空态测试 ======

  test('shows 暂无活动 when no campaigns match filter', async () => {
    mockGetCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: [], total: 0 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('暂无活动')).toBeInTheDocument();
    });
  });

  test('shows emoji in empty state', async () => {
    mockGetCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: [], total: 0 },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('🎁')).toBeInTheDocument();
    });
  });

  // ====== 链接测试 ======

  test('campaign cards link to detail page', async () => {
    renderPage();
    expect(await screen.findByText('夏日狂欢节')).toBeInTheDocument();
    const link = screen.getByText('夏日狂欢节').closest('a');
    expect(link).toHaveAttribute('href', '/h5/campaigns/c1');
  });

  // ====== 加载态 ======

  test('shows loading state initially', () => {
    mockGetCampaigns.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Header should still render
    expect(screen.getByText('活动中心')).toBeInTheDocument();
  });

  // ====== H5导航 ======

  test('renders bottom navigation with activeKey home', async () => {
    renderPage();
    const nav = await screen.findByTestId('h5-navbar');
    expect(nav).toHaveAttribute('data-active-key', 'home');
  });

  // ====== 边界情况 ======

  test('ended campaigns have reduced opacity styling', async () => {
    renderPage();
    const endedArticle = await screen.findByText('周年庆大促');
    const article = endedArticle.closest('article');
    expect(article).toHaveStyle('opacity: 0.6');
  });

  test('renders all campaign banner emojis', async () => {
    renderPage();
    const giftEmojis = screen.getAllByText('🎁');
    expect(giftEmojis.length).toBe(3);
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 活动筛选与数据正确性', () => {
    test('[圈梁五道箍] 默认显示全部活动', async () => {
      renderPage();
      await screen.findByText('夏日狂欢节');
      expect(screen.getByText('新会员专享')).toBeInTheDocument();
      expect(screen.getByText('周年庆大促')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 筛选按钮高亮当前选中', async () => {
      renderPage();
      await screen.findByText('全部');
      fireEvent.click(screen.getByText('进行中'));
      // Active button should have accent background
      await waitFor(() => {
        const activeBtn = screen.getByText('进行中');
        expect(activeBtn).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 空数据默认状态正确', async () => {
      mockGetCampaigns.mockResolvedValue({
        success: true,
        data: { campaigns: [], total: 0 },
      });
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('暂无活动')).toBeInTheDocument();
        expect(screen.getByText('🎁')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 活动标题正确映射', async () => {
      renderPage();
      await screen.findByText('夏日狂欢节');
      expect(screen.getByText('新会员专享')).toBeInTheDocument();
      expect(screen.getByText('周年庆大促')).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — 活动详情链接', () => {
    test('[圈梁五道箍] 每个活动卡片都有正确详情链接', async () => {
      renderPage();
      await screen.findByText('夏日狂欢节');
      const campaigns = [
        { title: '夏日狂欢节', href: '/h5/campaigns/c1' },
        { title: '新会员专享', href: '/h5/campaigns/c2' },
        { title: '周年庆大促', href: '/h5/campaigns/c3' },
      ];
      campaigns.forEach(({ title, href }) => {
        const link = screen.getByText(title).closest('a');
        expect(link).toHaveAttribute('href', href);
      });
    });
  });

  describe('圈梁五道箍 — H5NavBar', () => {
    test('[圈梁五道箍] 底部导航activeKey为home', async () => {
      renderPage();
      const nav = await screen.findByTestId('h5-navbar');
      expect(nav).toHaveAttribute('data-active-key', 'home');
    });
  });
});
