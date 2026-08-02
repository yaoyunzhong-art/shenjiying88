/**
 * member-center/__tests__/page.vitest.tsx — 会员中心页 L2 组件测试
 * 圈梁五道箍 🌲 树哥C
 *
 * 覆盖: 未登录重定向 · 渲染 · 积分/余额 · 进度条 · 权益差异化 · 订单 · 快捷功能 · 底部导航 · 交互 · 加载态 · 边界
 *
 * NOTE: This test file mocks antd components to avoid jsdom matchMedia/responsiveObserver issues.
 * If tests hang, try running with --pool=forks or reducing test parallelism.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks (function-declaration style) ──

const mockPush = vi.fn();
const mockMsgSuccess = vi.fn();
const mockMsgLoading = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('next/link', () => ({ default: (p: any) => React.createElement('a', { href: p.href, 'data-testid': 'nl' }, p.children) }));

const LS: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => LS[k] ?? null,
  setItem: (k: string, v: string) => { LS[k] = v; },
  removeItem: (k: string) => { delete LS[k]; },
  clear: () => { Object.keys(LS).forEach(k => delete LS[k]); },
});

vi.mock('antd', () => {
  function CardC({ children }: any) { return React.createElement('div', { 'data-testid': 'card' }, children); }
  function Btn({ children, onClick, disabled, loading }: any) { return React.createElement('button', { 'data-testid': 'btn', onClick, disabled: disabled || !!loading }, children); }
  Btn.displayName = 'Button';
  function TagC({ children, color }: any) { return React.createElement('span', { 'data-testid': 'tag', 'data-c': color ?? '' }, children); }
  function Prog(p: any) { return React.createElement('div', { 'data-testid': 'prog', 'data-pct': String(p.percent ?? '') }); }
  function Stat({ title, value, prefix, precision }: any) {
    const v = typeof value === 'number' && precision != null ? value.toFixed(precision) : String(value ?? '');
    return React.createElement('div', { 'data-testid': 'stat' }, title, React.createElement('span', null, prefix, v));
  }
  function DescC({ children }: any) { return React.createElement('div', { 'data-testid': 'desc' }, children); }
  DescC.Item = (p: any) => React.createElement('p', null, p.label, ': ', p.children);
  function ListC({ dataSource, renderItem }: any) {
    if (!dataSource?.length) return null;
    return React.createElement('div', null, dataSource.map((i: any, idx: number) => React.createElement('div', { key: idx }, renderItem(i, idx))));
  }
  function SkeletonC() { return React.createElement('div', { 'data-testid': 'skel' }); }
  function EmptyC({ description }: any) { return React.createElement('div', { 'data-testid': 'empty' }, React.createElement('span', null, description ?? '')); }
  function RowC({ children }: any) { return React.createElement('div', null, children); }
  function ColC({ children }: any) { return React.createElement('div', null, children); }
  function TitleC({ children }: any) { return React.createElement('h4', null, children); }
  return {
    Card: CardC, Button: Btn, Tag: TagC, Progress: Prog, Statistic: Stat,
    Descriptions: DescC, List: ListC, Skeleton: SkeletonC, Empty: EmptyC,
    Row: RowC, Col: ColC, Typography: { Title: TitleC },
    message: { success: (...a: any[]) => mockMsgSuccess(...a), loading: (...a: any[]) => mockMsgLoading(...a) },
  };
});

vi.mock('@ant-design/icons', () => {
  function I(p: any) { return React.createElement('span', { 'data-testid': 'icon' }, '🔸'); }
  return {
    GiftOutlined: I, CreditCardOutlined: I, ShoppingCartOutlined: I, StarOutlined: I,
    ShopOutlined: I, LogoutOutlined: I, EnvironmentOutlined: I, CalendarOutlined: I, PercentageOutlined: I,
  };
});

const mockOrders = [
  { id: 'o1', orderNo: 'ORD-MC01', totalAmount: 128, status: 'COMPLETED', createdAt: '2026-07-01T10:00:00Z', itemCount: 3 },
  { id: 'o2', orderNo: 'ORD-MC02', totalAmount: 56.5, status: 'COMPLETED', createdAt: '2026-06-28T14:30:00Z', itemCount: 1 },
  { id: 'o3', orderNo: 'ORD-MC03', totalAmount: 399, status: 'PAID', createdAt: '2026-06-25T09:15:00Z', itemCount: 5 },
];

vi.mock('@m5/sdk', () => ({
  createBusinessClient: () => ({ orders: { list: vi.fn().mockResolvedValue(mockOrders) } }),
  getDefaultApiBaseUrl: () => '',
}));

// ── Subject ──

import MemberCenterPage from '../page';

// ── Helpers ──

function makeMember(ov: Record<string, any> = {}) {
  return JSON.stringify({ memberId: 'm-1', mobile: '13800138000', nickname: '测User', tier: 'gold', points: 15000, storeName: 'Demo店', ...ov });
}

function r(ov: Record<string, any> = {}) {
  vi.clearAllMocks();
  Object.keys(LS).forEach(k => delete LS[k]);
  LS['member_access_token'] = 'tok';
  LS['member_info'] = makeMember(ov);
  return render(React.createElement(MemberCenterPage));
}

async function wl() { await screen.findByText('会员中心', {}, { timeout: 8000 }); }

// =========================================================

describe('MemberCenterPage — 会员中心', () => {
  beforeEach(() => { vi.clearAllMocks(); Object.keys(LS).forEach(k => delete LS[k]); });

  // ── 登录 ──
  test('无 token 跳转登录', async () => {
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 8000 });
  });
  test('JSON 解析失败重定向', async () => {
    LS['member_access_token'] = 'tok'; LS['member_info'] = 'bad';
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 8000 });
  });
  test('字段缺失重定向', async () => {
    LS['member_access_token'] = 'tok'; LS['member_info'] = '{"memberId":"x"}';
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 8000 });
  });

  // ── 渲染 ──
  test('标题 会员中心', async () => { r(); await wl(); expect(screen.getByText('会员中心')).toBeInTheDocument(); });
  test('昵称 测User', async () => { r(); await wl(); expect(screen.getByText('测User')).toBeInTheDocument(); });
  test('等级标签 黄金会员', async () => { r(); await wl(); const t = document.querySelector('[data-testid="tag"]'); expect(t?.textContent).toBe('黄金会员'); });
  test('diamond 等级标签', async () => { r({ tier: 'diamond' }); await wl(); const t = document.querySelector('[data-testid="tag"]'); expect(t?.textContent).toBe('钻石会员'); });
  test('手机号', async () => { r(); await wl(); expect(screen.getByText('13800138000')).toBeInTheDocument(); });
  test('会员ID', async () => { r(); await wl(); expect(screen.getByText('m-1')).toBeInTheDocument(); });
  test('门店名', async () => { r(); await wl(); expect(screen.getByText(/Demo店/)).toBeInTheDocument(); });
  test('无门店显示 暂无关联门店', async () => { r({ storeName: '' }); await wl(); expect(screen.getByText('暂无关联门店')).toBeInTheDocument(); });

  // ── 积分/余额 ──
  test('积分卡片', async () => { r(); await wl(); expect(screen.getByText('我的积分')).toBeInTheDocument(); });
  test('积分值', async () => { r(); await wl(); expect(screen.getByText('15000')).toBeInTheDocument(); });
  test('积分可兑换文案', async () => { r(); await wl(); expect(screen.getByText('可兑换优惠券及礼品')).toBeInTheDocument(); });
  test('余额卡片', async () => { r(); await wl(); expect(screen.getByText('账户余额')).toBeInTheDocument(); });
  test('积分充值按钮', async () => { r(); await wl(); expect(screen.getByText('积分充值')).toBeInTheDocument(); });

  // ── 进度条 ──
  test('等级进度条存在', async () => { r(); await wl(); expect(document.querySelector('[data-testid="prog"]')).not.toBeNull(); });
  test('diamond 已达最高等级', async () => { r({ tier: 'diamond', points: 80000 }); await wl(); expect(screen.getByText(/已达最高等级/)).toBeInTheDocument(); });

  // ── 权益 ──
  test('gold 四项权益', async () => { r(); await wl(); for (const t of ['会员权益', '积分倍率', '生日礼遇', '专属折扣', '生日特权']) expect(screen.getByText(t)).toBeInTheDocument(); });
  test('gold 2x/10%', async () => { r(); await wl(); expect(screen.getByText('2x')).toBeInTheDocument(); expect(screen.getByText('10%')).toBeInTheDocument(); });
  test('gold 生日', async () => { r(); await wl(); expect(screen.getByText('精致礼品+双倍积分')).toBeInTheDocument(); expect(screen.getByText('双倍积分+礼品')).toBeInTheDocument(); });
  test('diamond 3x/15%/高端礼品', async () => { r({ tier: 'diamond', points: 80000 }); await wl(); expect(screen.getByText('3x')).toBeInTheDocument(); expect(screen.getByText('15%')).toBeInTheDocument(); expect(screen.getByText('高端礼品+双倍积分')).toBeInTheDocument(); });
  test('basic 1x/0%/积分/无生日特权', async () => { r({ tier: 'basic', points: 100 }); await wl(); expect(screen.getByText('1x')).toBeInTheDocument(); expect(screen.getByText('0%')).toBeInTheDocument(); expect(screen.getByText('积分')).toBeInTheDocument(); expect(screen.queryByText('生日特权')).toBeNull(); });
  test('silver 1.5x/8%/优惠券+积分/无生日特权', async () => { r({ tier: 'silver', points: 5000 }); await wl(); expect(screen.getByText('1.5x')).toBeInTheDocument(); expect(screen.getByText('8%')).toBeInTheDocument(); expect(screen.getByText('优惠券+积分')).toBeInTheDocument(); expect(screen.queryByText('生日特权')).toBeNull(); });
  test('bronze 1.2x/5%/优惠券', async () => { r({ tier: 'bronze', points: 3000 }); await wl(); expect(screen.getByText('1.2x')).toBeInTheDocument(); expect(screen.getByText('5%')).toBeInTheDocument(); expect(screen.getByText('优惠券')).toBeInTheDocument(); });

  // ── 订单 ──
  test('最近消费记录标题', async () => { r(); await wl(); expect(screen.getByText('最近消费记录')).toBeInTheDocument(); });
  test('订单编号', async () => { r(); await wl(); await screen.findByText('ORD-MC01', {}, { timeout: 8000 }); });
  test('已完成标签', async () => { r(); await wl(); const d = await screen.findAllByText('已完成', {}, { timeout: 8000 }); expect(d.length).toBeGreaterThanOrEqual(1); });

  // ── 快捷功能 ──
  test('菜单项完整', async () => { r(); await wl(); for (const t of ['快捷功能', '我的订单', '我的优惠券', '会员卡', '我的收藏', '所属门店']) expect(screen.getByText(t)).toBeInTheDocument(); });
  test('链接正确', async () => { r(); await wl(); expect(screen.getByText('我的订单').closest('a')).toHaveAttribute('href', '/orders'); });

  // ── 底部导航 ──
  test('三项导航', async () => { r(); await wl(); for (const t of ['首页', '门店', '我的']) expect(screen.getByText(t)).toBeInTheDocument(); });
  test('首页链接', async () => { r(); await wl(); expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/'); });
  test('门店链接', async () => { r(); await wl(); expect(screen.getByText('门店').closest('a')).toHaveAttribute('href', '/stores'); });
  test('我的高亮激活色', async () => { r(); await wl(); expect(screen.getByText('我的').closest('a')).toHaveStyle({ color: '#f59e0b' }); });
  test('首页非激活色', async () => { r(); await wl(); expect(screen.getByText('首页').closest('a')).toHaveStyle({ color: '#64748b' }); });

  // ── 交互 ──
  test('退出清除 localStorage 并跳转', async () => {
    r(); await wl();
    fireEvent.click(screen.getByText('退出'));
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_info');
    expect(mockMsgSuccess).toHaveBeenCalledWith('已安全退出');
    expect(mockPush).toHaveBeenCalledWith('/member-login');
  });
  test('充值触发 loading', async () => { r(); await wl(); fireEvent.click(screen.getByText('积分充值')); expect(mockMsgLoading).toHaveBeenCalled(); });

  // ── 加载态 ──
  test('骨架屏初始显示', () => { const { container } = r(); expect(container.querySelector('[data-testid="skel"]')).not.toBeNull(); });
  test('骨架屏加载后消失', async () => { const { container } = r(); await wl(); expect(container.querySelector('[data-testid="skel"]')).toBeNull(); });

  // ── 边界 ──
  test('mount 安全不抛异常', () => { expect(() => r()).not.toThrow(); });
  test('头像显示昵称首字', async () => { r(); await wl(); expect(screen.getByText('测')).toBeInTheDocument(); });
  test('空昵称头像显示 会', async () => { r({ nickname: '' }); await wl(); expect(screen.getByText('会')).toBeInTheDocument(); });
  test('五个等级均不抛异常', async () => {
    for (const tier of ['diamond', 'gold', 'silver', 'bronze', 'basic']) {
      const { unmount } = r({ tier, points: 5000 });
      await screen.findByText('会员中心', {}, { timeout: 8000 });
      unmount();
    }
  });
});
