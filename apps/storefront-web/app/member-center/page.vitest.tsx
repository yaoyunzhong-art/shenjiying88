/**
 * member-center/page.vitest.tsx — 会员中心页 L2 组件测试 (vitest + @testing-library/react)
 * 圈梁五道箍 🌲 树哥C
 *
 * 覆盖:
 *   - 未登录重定向
 *   - 会员信息渲染 (昵称/等级/手机号/门店)
 *   - 积分 & 余额展示
 *   - 等级升级进度条 (各等级)
 *   - 会员权益 (各等级差异化)
 *   - 最近消费记录
 *   - 快捷功能菜单
 *   - 底部导航
 *   - 退出登录交互
 *   - 充值交互
 *   - 加载态骨架屏
 *   - 各等级边界值 (diamond/gold/silver/bronze/basic)
 *   - 权益独占/排除逻辑
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Globals ──

const mockPush = vi.fn();
const mockMsgSuccess = vi.fn();
const mockMsgLoading = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) =>
    React.createElement('a', { href, 'data-testid': 'next-link', ...rest }, children),
}));

// ── localStorage proxy ──

const _store: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem:   vi.fn((k: string) => _store[k] ?? null),
  setItem:   vi.fn((k: string, v: string) => { _store[k] = v; }),
  removeItem: vi.fn((k: string) => { delete _store[k]; }),
  clear:     vi.fn(() => { Object.keys(_store).forEach(k => delete _store[k]); }),
});

// ── antd mock (flat, no importActual) ──

function IconMock() { return React.createElement('span', { 'data-testid': 'ant-icon' }, '🔸'); }

vi.mock('antd', () => ({
  Card:       ({ children, size }: any) => React.createElement('div', { 'data-testid': 'card' }, children),
  Button:     Object.assign(({ children, onClick, disabled, loading, ...rest }: any) =>
    React.createElement('button', { 'data-testid': 'ant-btn', onClick, disabled: disabled || loading, ...rest }, children),
    { displayName: 'Button' }),
  Tag:        ({ children, color }: any) => React.createElement('span', { 'data-testid': 'tag', 'data-color': color }, children),
  Progress:   ({ percent, strokeColor }: any) =>
    React.createElement('div', { 'data-testid': 'progress', 'data-pct': String(percent ?? 0), 'data-color': strokeColor ?? '' }),
  Statistic:  ({ title, value, prefix, precision }: any) => {
    const display = typeof value === 'number' && precision != null ? Number(value).toFixed(precision) : String(value ?? '');
    return React.createElement('div', { 'data-testid': 'stat' },
      title,
      React.createElement('span', null, prefix ?? '', display));
  },
  Descriptions: Object.assign(
    ({ children }: any) => React.createElement('div', { 'data-testid': 'desc' }, children),
    { Item: ({ children, label }: any) =>
      React.createElement('div', { 'data-testid': 'desc-item' },
        React.createElement('span', null, label), React.createElement('span', null, children)) }),
  List:       ({ dataSource, renderItem }: any) =>
    dataSource?.length
      ? React.createElement('div', { 'data-testid': 'list' },
          dataSource.map((item: any, i: number) => React.createElement('div', { key: i, 'data-testid': 'list-item' }, renderItem(item, i))))
      : null,
  Skeleton:   ({ active }: any) => React.createElement('div', { 'data-testid': 'skel', 'data-active': String(!!active) }),
  Empty:      ({ description }: any) => React.createElement('div', { 'data-testid': 'empty' },
    React.createElement('span', null, description ?? '')),
  Row:        ({ children }: any) => React.createElement('div', { 'data-testid': 'row' }, children),
  Col:        ({ children, xs, lg }: any) => React.createElement('div', { 'data-testid': 'col', 'data-xs': String(xs), 'data-lg': String(lg) }, children),
  Typography: { Title: ({ children, level }: any) => React.createElement(`h${level ?? 4}`, null, children) },
  message:    { success: (...a: any[]) => mockMsgSuccess(...a), loading: (...a: any[]) => mockMsgLoading(...a) },
}));

vi.mock('@ant-design/icons', () => ({
  GiftOutlined:          IconMock,
  CreditCardOutlined:    IconMock,
  ShoppingCartOutlined:  IconMock,
  StarOutlined:          IconMock,
  ShopOutlined:          IconMock,
  LogoutOutlined:        IconMock,
  EnvironmentOutlined:   IconMock,
  CalendarOutlined:      IconMock,
  PercentageOutlined:    IconMock,
}));

vi.mock('@m5/sdk', () => ({
  createBusinessClient: () => ({
    orders: { list: vi.fn().mockResolvedValue([
      { id: 'o1', orderNo: 'ORD-A01', totalAmount: 128, status: 'COMPLETED', createdAt: '2026-07-01T10:00:00Z', itemCount: 3 },
      { id: 'o2', orderNo: 'ORD-A02', totalAmount: 56.5, status: 'COMPLETED', createdAt: '2026-06-28T14:30:00Z', itemCount: 1 },
      { id: 'o3', orderNo: 'ORD-A03', totalAmount: 399, status: 'PAID', createdAt: '2026-06-25T09:15:00Z', itemCount: 5 },
    ]) },
  }),
  getDefaultApiBaseUrl: () => 'http://localhost:3000',
}));

// ── Test Subject ──

import MemberCenterPage from './page';

const MEMBER_GOLD = JSON.stringify({
  memberId: 'mem-001', mobile: '13800138000', nickname: '测试用户',
  tier: 'gold', points: 15000, storeName: 'Demo Store 旗舰店',
});

const MEMBER_DIAMOND = JSON.stringify({
  memberId: 'mem-002', mobile: '13900139000', nickname: '钻石王老五',
  tier: 'diamond', points: 80000, storeName: 'VIP 专属店',
});

const MEMBER_BASIC = JSON.stringify({
  memberId: 'mem-003', mobile: '13700137000', nickname: '新人小白',
  tier: 'basic', points: 100, storeName: '',
});

const MEMBER_SILVER = JSON.stringify({
  memberId: 'mem-004', mobile: '13600136000', nickname: '银卡用户',
  tier: 'silver', points: 5000, storeName: '社区店',
});

const MEMBER_BRONZE = JSON.stringify({
  memberId: 'mem-005', mobile: '13500135000', nickname: '铜卡用户',
  tier: 'bronze', points: 3000, storeName: '社区店',
});

function setupStorage(infoJson: string) {
  _store['member_access_token'] = 'tok-1';
  _store['member_info'] = infoJson;
}

// ── Tests ──

describe('MemberCenterPage — 会员中心', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(_store).forEach(k => delete _store[k]);
  });

  async function wl() {
    await screen.findByText('会员中心', {}, { timeout: 5000 });
  }

  // ======================== 登录/未登录 ========================

  test('无 token 时重定向到登录页', async () => {
    render(<MemberCenterPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'));
  });

  test('member_info JSON 解析失败时重定向', async () => {
    _store['member_access_token'] = 'tok';
    _store['member_info'] = 'bad-json{doh';
    render(<MemberCenterPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'));
  });

  // ======================== 页面渲染 ========================

  test('渲染页面标题 会员中心', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('会员中心')).toBeInTheDocument();
  });

  test('渲染会员昵称', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('测试用户')).toBeInTheDocument();
  });

  test('渲染会员等级标签', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    // gold → '黄金会员'
    const tag = screen.getByTestId('tag');
    expect(tag.textContent).toBe('黄金会员');
  });

  test('不同等级渲染不同标签', async () => {
    setupStorage(MEMBER_DIAMOND);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('钻石会员')).toBeInTheDocument();
  });

  test('渲染会员手机号', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('13800138000')).toBeInTheDocument();
  });

  test('渲染会员 ID', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('mem-001')).toBeInTheDocument();
  });

  test('渲染关联门店名称', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText(/Demo Store 旗舰店/)).toBeInTheDocument();
  });

  test('无门店名时显示 暂无关联门店', async () => {
    setupStorage(MEMBER_BASIC);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('暂无关联门店')).toBeInTheDocument();
  });

  // ======================== 积分 & 余额 ========================

  test('渲染积分卡片', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('我的积分')).toBeInTheDocument();
  });

  test('显示积分数值 15000', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('15000')).toBeInTheDocument();
  });

  test('显示积分可兑换文案', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('可兑换优惠券及礼品')).toBeInTheDocument();
  });

  test('渲染余额卡片', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('账户余额')).toBeInTheDocument();
  });

  test('渲染积分充值按钮', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('积分充值')).toBeInTheDocument();
  });

  // ======================== 升级进度条 ========================

  test('gold 等级显示进度条', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    const p = document.querySelector('[data-testid="progress"]');
    expect(p).not.toBeNull();
  });

  test('diamond 等级显示 已达最高等级', async () => {
    setupStorage(MEMBER_DIAMOND);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText(/已达最高等级/)).toBeInTheDocument();
  });

  // ======================== 权益 ========================

  test('gold 会员显示权益区块', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('会员权益')).toBeInTheDocument();
  });

  test('gold 会员显示 积分倍率/生日礼遇/专属折扣/生日特权', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('积分倍率')).toBeInTheDocument();
    expect(screen.getByText('生日礼遇')).toBeInTheDocument();
    expect(screen.getByText('专属折扣')).toBeInTheDocument();
    expect(screen.getByText('生日特权')).toBeInTheDocument();
  });

  test('gold 会员积分倍率 = 2x', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  test('gold 会员折扣 = 10%', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  test('gold 会员生日礼遇 = 精致礼品+双倍积分', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('精致礼品+双倍积分')).toBeInTheDocument();
  });

  test('gold 会员生日特权 = 双倍积分+礼品', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('双倍积分+礼品')).toBeInTheDocument();
  });

  // ======================== 各等级差异化 ========================

  test('diamond 会员 3x / 15% / 高端礼品+双倍积分', async () => {
    setupStorage(MEMBER_DIAMOND);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('高端礼品+双倍积分')).toBeInTheDocument();
    expect(screen.getByText('双倍积分+礼品')).toBeInTheDocument();
  });

  test('basic 会员 1x / 0% / 积分', async () => {
    setupStorage(MEMBER_BASIC);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('积分')).toBeInTheDocument();
  });

  test('basic 会员无 生日特权', async () => {
    setupStorage(MEMBER_BASIC);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.queryByText('生日特权')).not.toBeInTheDocument();
  });

  test('silver 会员 1.5x / 8% / 优惠券+积分', async () => {
    setupStorage(MEMBER_SILVER);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText('优惠券+积分')).toBeInTheDocument();
    expect(screen.queryByText('生日特权')).not.toBeInTheDocument();
  });

  test('bronze 会员 1.2x / 5% / 优惠券', async () => {
    setupStorage(MEMBER_BRONZE);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('1.2x')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('优惠券')).toBeInTheDocument();
  });

  // ======================== 最近消费记录 ========================

  test('显示 最近消费记录 区块', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    await screen.findByText('最近消费记录', {}, { timeout: 3000 });
  });

  test('显示订单编号', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    await screen.findByText('ORD-A01', {}, { timeout: 3000 });
  });

  test('显示订单金额', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    await screen.findByText(/128|56\.5|399/, {}, { timeout: 3000 });
  });

  test('显示已完成状态标签', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    const completed = await screen.findAllByText('已完成', {}, { timeout: 3000 });
    expect(completed.length).toBeGreaterThanOrEqual(2);
  });

  // ======================== 快捷功能菜单 ========================

  test('显示 快捷功能 区块', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('快捷功能')).toBeInTheDocument();
  });

  test('功能菜单含 我的订单/我的优惠券/会员卡/我的收藏/所属门店', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('我的订单')).toBeInTheDocument();
    expect(screen.getByText('我的优惠券')).toBeInTheDocument();
    expect(screen.getByText('会员卡')).toBeInTheDocument();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
    expect(screen.getByText('所属门店')).toBeInTheDocument();
  });

  test('功能菜单链接 href 正确', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    const orderLink = screen.getByText('我的订单').closest('a');
    expect(orderLink).toHaveAttribute('href', '/orders');
    const collectLink = screen.getByText('我的收藏').closest('a');
    expect(collectLink).toHaveAttribute('href', '/favorites');
  });

  // ======================== 底部导航 ========================

  test('底部导航 首页/门店/我的', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('门店')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  test('底部导航 我的 高亮', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    const me = screen.getByText('我的').closest('a');
    expect(me).toHaveStyle({ color: '#f59e0b' });
  });

  test('底部导航链接 href 正确', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('门店').closest('a')).toHaveAttribute('href', '/stores');
    expect(screen.getByText('我的').closest('a')).toHaveAttribute('href', '/member-center');
  });

  // ======================== 交互 ========================

  test('点击退出清除 localStorage 并跳转', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    fireEvent.click(screen.getByText('退出'));
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('member_info');
    expect(mockMsgSuccess).toHaveBeenCalledWith('已安全退出');
    expect(mockPush).toHaveBeenCalledWith('/member-login');
  });

  test('充值按钮触发 loading', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    fireEvent.click(screen.getByText('积分充值'));
    expect(mockMsgLoading).toHaveBeenCalledWith(
      expect.objectContaining({ content: '正在跳转充值页面...' }));
  });

  // ======================== 加载态 ========================

  test('初始渲染显示骨架屏', () => {
    setupStorage(MEMBER_GOLD);
    const { container } = render(<MemberCenterPage />);
    expect(container.querySelector('[data-testid="skel"]')).not.toBeNull();
  });

  test('加载完成后骨架屏消失', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(document.querySelector('[data-testid="skel"]')).toBeNull();
  });

  // ======================== 边界 ========================

  test('mount 不抛异常', () => {
    setupStorage(MEMBER_GOLD);
    expect(() => render(<MemberCenterPage />)).not.toThrow();
  });

  test('昵称为空头像显示 会', async () => {
    setupStorage(JSON.stringify({
      memberId: 'mem-x', mobile: '13800138000', nickname: '',
      tier: 'basic', points: 0, storeName: '',
    }));
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('会')).toBeInTheDocument();
  });

  test('头像显示昵称首字', async () => {
    setupStorage(MEMBER_GOLD);
    render(<MemberCenterPage />);
    await wl();
    expect(screen.getByText('测')).toBeInTheDocument();
  });

  test('member_info 字段缺失时安全重定向', async () => {
    _store['member_access_token'] = 'tok';
    _store['member_info'] = '{"memberId":"x"}';
    render(<MemberCenterPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/member-login'));
  });
});
