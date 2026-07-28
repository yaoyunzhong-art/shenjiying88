/**
 * member-center/__tests__/page.vitest.tsx — 会员中心页 L2 组件测试
 * 圈梁五道箍 🌲 树哥C
 *
 * 覆盖: 未登录、渲染、积分/余额、进度条、权益差异化、订单、快捷功能、底部导航、交互、加载态、边界
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

const mockPush = vi.fn();
const mockMsgSuccess = vi.fn();
const mockMsgLoading = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) =>
    React.createElement('a', { href, 'data-testid': 'nl', ...rest }, children),
}));

const LS: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem:   (k: string) => LS[k] ?? null,
  setItem:   (k: string, v: string) => { LS[k] = v; },
  removeItem: (k: string) => { delete LS[k]; },
  clear:     () => { Object.keys(LS).forEach(k => delete LS[k]); },
});

// Flat mock — no importActual, no antd dependency
vi.mock('antd', () => ({
  Card:       ({ children }: any) => React.createElement('div', { 'data-testid': 'card' }, children),
  Button:     Object.assign(
    ({ children, onClick, disabled, loading }: any) =>
      React.createElement('button', { 'data-testid': 'btn', onClick, disabled: disabled || !!loading }, children),
    { displayName: 'Button' }),
  Tag:        ({ children, color }: any) => React.createElement('span', { 'data-testid': 'tag', 'data-c': color }, children),
  Progress:   (p: any) => React.createElement('div', { 'data-testid': 'prog', 'data-pct': String(p.percent ?? '') }),
  Statistic:  ({ title, value, prefix, precision }: any) => {
    const v = typeof value === 'number' && precision != null ? value.toFixed(precision) : String(value ?? '');
    return React.createElement('div', { 'data-testid': 'stat' }, title, React.createElement('span', null, prefix, v));
  },
  Descriptions: Object.assign(
    ({ children }: any) => React.createElement('div', { 'data-testid': 'desc' }, children),
    { Item: ({ children, label }: any) => React.createElement('p', null, label, ': ', children) }),
  List: ({ dataSource, renderItem }: any) =>
    dataSource?.length ? React.createElement('div', null, dataSource.map((i: any, idx: number) => React.createElement('div', { key: idx }, renderItem(i, idx)))) : null,
  Skeleton:   () => React.createElement('div', { 'data-testid': 'skel' }),
  Empty:      ({ description }: any) => React.createElement('div', { 'data-testid': 'empty' }, React.createElement('span', null, description ?? '')),
  Row:        ({ children }: any) => React.createElement('div', null, children),
  Col:        ({ children }: any) => React.createElement('div', null, children),
  Typography: { Title: ({ children }: any) => React.createElement('h4', null, children) },
  message:    { success: (...a: any[]) => mockMsgSuccess(...a), loading: (...a: any[]) => mockMsgLoading(...a) },
}));

vi.mock('@ant-design/icons', () => {
  const II = (props: any) => React.createElement('span', { 'data-testid': 'icon' }, '🔸');
  return {
    GiftOutlined: II, CreditCardOutlined: II, ShoppingCartOutlined: II,
    StarOutlined: II, ShopOutlined: II, LogoutOutlined: II,
    EnvironmentOutlined: II, CalendarOutlined: II, PercentageOutlined: II,
  };
});

const mockOrders = [
  { id: 'o1', orderNo: 'ORD-001', totalAmount: 128, status: 'COMPLETED', createdAt: '2026-07-01T10:00:00Z', itemCount: 3 },
  { id: 'o2', orderNo: 'ORD-002', totalAmount: 56.5, status: 'COMPLETED', createdAt: '2026-06-28T14:30:00Z', itemCount: 1 },
];

vi.mock('@m5/sdk', () => ({
  createBusinessClient: () => ({ orders: { list: vi.fn().mockResolvedValue(mockOrders) } }),
  getDefaultApiBaseUrl: () => '',
}));

// ── Subject ──

import MemberCenterPage from '../page';

// ── Helpers ──

function makeMember(ov: Record<string, any> = {}) {
  return JSON.stringify({ memberId: 'm-1', mobile: '13800138000', nickname: '测User',
    tier: 'gold', points: 15000, storeName: 'Demo店', ...ov });
}

function r(ov: Record<string, any> = {}) {
  vi.clearAllMocks();
  Object.keys(LS).forEach(k => delete LS[k]);
  LS['member_access_token'] = 'tok';
  LS['member_info'] = makeMember(ov);
  return render(React.createElement(MemberCenterPage));
}

async function waitLoaded() {
  await screen.findByText('会员中心', {}, { timeout: 5000 });
}

// =====================================================
//  Tests
// =====================================================

describe('MemberCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(LS).forEach(k => delete LS[k]);
  });

  // === 登录 ===

  test('无 token 跳转登录', async () => {
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 5000 });
  });

  test('JSON 解析失败重定向', async () => {
    LS['member_access_token'] = 'tok';
    LS['member_info'] = 'bad';
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 5000 });
  });

  test('字段缺失重定向', async () => {
    LS['member_access_token'] = 'tok';
    LS['member_info'] = '{"memberId":"x"}';
    render(React.createElement(MemberCenterPage));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'), { timeout: 5000 });
  });

  // === 渲染 ===

  test('标题 会员中心', async () => { r(); await waitLoaded(); expect(screen.getByText('会员中心')).toBeInTheDocument(); });
  test('昵称 测User', async () => { r(); await waitLoaded(); expect(screen.getByText('测User')).toBeInTheDocument(); });
  test('等级标签 黄金会员', async () => { r(); await waitLoaded(); expect(document.querySelector('[data-testid="tag"]')?.textContent).toBe('黄金会员'); });
  test('手机号', async () => { r(); await waitLoaded(); expect(screen.getByText('13800138000')).toBeInTheDocument(); });
  test('会员ID', async () => { r(); await waitLoaded(); expect(screen.getByText('m-1')).toBeInTheDocument(); });
  test('门店名', async () => { r(); await waitLoaded(); expect(screen.getByText(/Demo店/)).toBeInTheDocument(); });
  test('无门店显示 暂无关联门店', async () => { r({ storeName: '' }); await waitLoaded(); expect(screen.getByText('暂无关联门店')).toBeInTheDocument(); });

  // === 积分/余额 ===

  test('积分卡片', async () => { r(); await waitLoaded(); expect(screen.getByText('我的积分')).toBeInTheDocument(); });
  test('积分值', async () => { r(); await waitLoaded(); expect(screen.getByText('15000')).toBeInTheDocument(); });
  test('积分文案', async () => { r(); await waitLoaded(); expect(screen.getByText('可兑换优惠券及礼品')).toBeInTheDocument(); });
  test('余额卡片', async () => { r(); await waitLoaded(); expect(screen.getByText('账户余额')).toBeInTheDocument(); });
  test('充值按钮', async () => { r(); await waitLoaded(); expect(screen.getByText('积分充值')).toBeInTheDocument(); });

  // === 进度条 ===

  test('进度条存在', async () => { r(); await waitLoaded(); expect(document.querySelector('[data-testid="prog"]')).not.toBeNull(); });
  test('diamond 最高等级', async () => { r({ tier: 'diamond', points: 80000 }); await waitLoaded(); expect(screen.getByText(/已达最高等级/)).toBeInTheDocument(); });

  // === 权益 ===

  test('gold 四项权益', async () => {
    r(); await waitLoaded();
    expect(screen.getByText('会员权益')).toBeInTheDocument();
    for (const t of ['积分倍率', '生日礼遇', '专属折扣', '生日特权']) expect(screen.getByText(t)).toBeInTheDocument();
  });
  test('gold 2x/10%', async () => { r(); await waitLoaded(); expect(screen.getByText('2x')).toBeInTheDocument(); expect(screen.getByText('10%')).toBeInTheDocument(); });
  test('gold 生日礼遇/特权', async () => { r(); await waitLoaded(); expect(screen.getByText('精致礼品+双倍积分')).toBeInTheDocument(); expect(screen.getByText('双倍积分+礼品')).toBeInTheDocument(); });
  test('diamond 3x/15%/高端礼品', async () => { r({ tier: 'diamond', points: 80000 }); await waitLoaded(); expect(screen.getByText('3x')).toBeInTheDocument(); expect(screen.getByText('15%')).toBeInTheDocument(); expect(screen.getByText('高端礼品+双倍积分')).toBeInTheDocument(); });
  test('basic 1x/0%/积分/无生日特权', async () => { r({ tier: 'basic', points: 100 }); await waitLoaded(); expect(screen.getByText('1x')).toBeInTheDocument(); expect(screen.getByText('0%')).toBeInTheDocument(); expect(screen.getByText('积分')).toBeInTheDocument(); expect(screen.queryByText('生日特权')).toBeNull(); });
  test('silver 1.5x/8%/优惠券+积分/无生日特权', async () => { r({ tier: 'silver', points: 5000 }); await waitLoaded(); expect(screen.getByText('1.5x')).toBeInTheDocument(); expect(screen.getByText('8%')).toBeInTheDocument(); expect(screen.getByText('优惠券+积分')).toBeInTheDocument(); expect(screen.queryByText('生日特权')).toBeNull(); });
  test('bronze 1.2x/5%/优惠券', async () => { r({ tier: 'bronze', points: 3000 }); await waitLoaded(); expect(screen.getByText('1.2x')).toBeInTheDocument(); expect(screen.getByText('5%')).toBeInTheDocument(); expect(screen.getByText('优惠券')).toBeInTheDocument(); });

  // === 订单 ===

  test('订单区块', async () => { r(); await waitLoaded(); expect(screen.getByText('最近消费记录')).toBeInTheDocument(); });
  test('订单编号', async () => { r(); await waitLoaded(); await screen.findByText('ORD-001', {}, { timeout: 5000 }); });
  test('已完成标签', async () => { r(); await waitLoaded(); const d = await screen.findAllByText('已完成', {}, { timeout: 5000 }); expect(d.length).toBeGreaterThanOrEqual(1); });

  // === 快捷功能 ===

  test('菜单项', async () => {
    r(); await waitLoaded();
    expect(screen.getByText('快捷功能')).toBeInTheDocument();
    for (const t of ['我的订单', '我的优惠券', '会员卡', '我的收藏', '所属门店']) expect(screen.getByText(t)).toBeInTheDocument();
  });
  test('链接', async () => { r(); await waitLoaded(); expect(screen.getByText('我的订单').closest('a')).toHaveAttribute('href', '/orders'); });

  // === 底部导航 ===

  test('三项', async () => { r(); await waitLoaded(); for (const t of ['首页', '门店', '我的']) expect(screen.getByText(t)).toBeInTheDocument(); });
  test('链接', async () => { r(); await waitLoaded(); expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/'); });
  test('我的激活色', async () => { r(); await waitLoaded(); expect(screen.getByText('我的').closest('a')).toHaveStyle({ color: '#f59e0b' }); });
  test('首页非激活色', async () => { r(); await waitLoaded(); expect(screen.getByText('首页').closest('a')).toHaveStyle({ color: '#64748b' }); });

  // === 交互 ===

  test('退出登录', async () => {
    r(); await waitLoaded();
    fireEvent.click(screen.getByText('退出'));
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_info');
    expect(mockMsgSuccess).toHaveBeenCalledWith('已安全退出');
    expect(mockPush).toHaveBeenCalledWith('/member-login');
  });
  test('充值 loading', async () => { r(); await waitLoaded(); fireEvent.click(screen.getByText('积分充值')); expect(mockMsgLoading).toHaveBeenCalled(); });

  // === 加载态 ===

  test('骨架屏', () => { const { container } = r(); expect(container.querySelector('[data-testid="skel"]')).not.toBeNull(); });
  test('骨架消失', async () => { const { container } = r(); await waitLoaded(); expect(container.querySelector('[data-testid="skel"]')).toBeNull(); });

  // === 边界 ===

  test('mount 安全', () => { expect(() => r()).not.toThrow(); });
  test('头像', async () => { r(); await waitLoaded(); expect(screen.getByText('测')).toBeInTheDocument(); });
  test('空昵称头像 会', async () => { r({ nickname: '' }); await waitLoaded(); expect(screen.getByText('会')).toBeInTheDocument(); });
  test('各等级不抛异常', async () => {
    for (const tier of ['diamond', 'gold', 'silver', 'bronze', 'basic']) {
      const { unmount } = r({ tier, points: 5000 });
      await screen.findByText('会员中心', {}, { timeout: 5000 });
      unmount();
    }
  });
});
