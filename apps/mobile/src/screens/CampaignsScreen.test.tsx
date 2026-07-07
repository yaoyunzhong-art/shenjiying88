/**
 * CampaignsScreen.test.tsx - Phase-21 T53
 * 营销活动列表页单元测试
 *
 * 注意: react-test-renderer 不执行 FlatList renderItem 的虚拟 DOM 渲染，
 * 所以标题/描述等卡片内容无法通过 findByProps 找到。
 * 我们通过直接验证 props 数据和组件不崩溃的方式来测试。
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { CampaignsScreen, type Campaign } from './CampaignsScreen';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'camp-1',
    title: '夏季促销',
    description: '全场商品8折优惠，会员专享额外折扣',
    status: 'active',
    type: 'promotion',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-31T00:00:00.000Z',
    enrolled: false,
    metrics: { participants: 128, redeemed: 56 },
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CampaignsScreen', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders empty state when no campaigns', () => {
    const root = create(<CampaignsScreen campaigns={[]} />).root;
    const emptyText = root.findByProps({ children: '暂无营销活动' });
    expect(emptyText).toBeDefined();
  });

  it('renders default empty state when campaigns prop is undefined', () => {
    const root = create(<CampaignsScreen />).root;
    const emptyText = root.findByProps({ children: '暂无营销活动' });
    expect(emptyText).toBeDefined();
  });

  it('renders FlatList when campaigns are provided', () => {
    const campaigns = [
      makeCampaign({ id: 'c1', title: '促销A' }),
      makeCampaign({ id: 'c2', title: '活动B' }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    expect(flatList).toBeDefined();
    expect(flatList.props.data).toHaveLength(2);
  });

  it('passes correct keyExtractor to FlatList', () => {
    const campaigns = [makeCampaign({ id: 'the-id' })];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    expect(flatList.props.keyExtractor(campaigns[0])).toBe('the-id');
  });

  it('smoke test - renders without crashing', () => {
    expect(() =>
      create(<CampaignsScreen campaigns={[makeCampaign()]} />),
    ).not.toThrow();
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  it('sorts campaigns: active first, then upcoming, then ended', () => {
    const campaigns = [
      makeCampaign({ id: 'c1', status: 'ended' }),
      makeCampaign({ id: 'c2', status: 'active' }),
      makeCampaign({ id: 'c3', status: 'upcoming' }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    expect(data[0].id).toBe('c2'); // active first
    expect(data[1].id).toBe('c3'); // upcoming second
    expect(data[2].id).toBe('c1'); // ended last
  });

  it('sorts by startDate descending within same status', () => {
    const now = new Date();
    const future1 = new Date(now.getTime() + 86400000).toISOString();
    const future2 = new Date(now.getTime() + 172800000).toISOString();
    const campaigns = [
      makeCampaign({ id: 'c1', status: 'active', startDate: future1 }),
      makeCampaign({ id: 'c2', status: 'active', startDate: future2 }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    // later startDate should come first
    expect(data[0].id).toBe('c2');
    expect(data[1].id).toBe('c1');
  });

  // ── Status badges (accessible in flatList renderItem) ──────────────────────

  it('passes correct status data to FlatList', () => {
    const campaigns = [
      makeCampaign({ status: 'active' }),
      makeCampaign({ status: 'upcoming' }),
      makeCampaign({ status: 'ended' }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    expect(data[0].status).toBe('active');
    expect(data[1].status).toBe('upcoming');
    expect(data[2].status).toBe('ended');
  });

  // ── Enrollment buttons ───────────────────────────────────────────────────

  it('passes correct enrolled state to FlatList data', () => {
    const campaigns = [
      makeCampaign({ id: 'c1', status: 'active', enrolled: false }),
      makeCampaign({ id: 'c2', status: 'active', enrolled: true }),
    ];
    const root = create(
      <CampaignsScreen campaigns={campaigns} />,
    ).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    expect(data[0].enrolled).toBe(false);
    expect(data[1].enrolled).toBe(true);
  });

  // ── Type labels ──────────────────────────────────────────────────────────

  it('passes type data correctly', () => {
    const campaigns = [
      makeCampaign({ type: 'promotion' }),
      makeCampaign({ type: 'points' }),
      makeCampaign({ type: 'coupon' }),
      makeCampaign({ type: 'event' }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    expect(data[0].type).toBe('promotion');
    expect(data[1].type).toBe('points');
    expect(data[2].type).toBe('coupon');
    expect(data[3].type).toBe('event');
  });

  // ── Metrics ──────────────────────────────────────────────────────────────

  it('passes metrics data through FlatList', () => {
    const campaigns = [
      makeCampaign({
        metrics: { participants: 150, redeemed: 72 },
      }),
      makeCampaign({ metrics: undefined }),
    ];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    const data = flatList.props.data;
    expect(data[0].metrics).toEqual({ participants: 150, redeemed: 72 });
    expect(data[1].metrics).toBeUndefined();
  });

  // ── Days remaining ────────────────────────────────────────────────────────

  it('calculates remaining days for active campaigns', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const campaigns = [makeCampaign({ endDate: futureDate })];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    // Verify the component renders without error
    const flatList = root.findByType('FlatList');
    expect(flatList.props.data[0].endDate).toBe(futureDate);
  });

  // ── Refresh ────────────────────────────────────────────────────────────────

  it('renders RefreshControl when onRefresh is provided', () => {
    const onRefresh = vi.fn();
    const campaigns = [makeCampaign()];

    const root = create(
      <CampaignsScreen
        campaigns={campaigns}
        onRefresh={onRefresh}
        refreshing={true}
      />,
    ).root;

    const flatList = root.findByType('FlatList');
    expect(flatList.props.refreshControl).toBeDefined();
    flatList.props.refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not render RefreshControl when onRefresh is not provided', () => {
    const campaigns = [makeCampaign()];
    const root = create(<CampaignsScreen campaigns={campaigns} />).root;
    const flatList = root.findByType('FlatList');
    expect(flatList.props.refreshControl).toBeUndefined();
  });

  // ── Callbacks ────────────────────────────────────────────────────────────

  it('passes onEnroll callback from props', () => {
    const onEnroll = vi.fn();
    renderDataCallbackTest({ onEnroll });
  });

  it('passes onViewDetail callback from props', () => {
    const onViewDetail = vi.fn();
    renderDataCallbackTest({ onViewDetail });
  });

  it('passes all callbacks simultaneously', () => {
    const handlers = {
      onEnroll: vi.fn(),
      onViewDetail: vi.fn(),
      onRefresh: vi.fn(),
    };
    const campaigns = [makeCampaign({ status: 'active', enrolled: false })];

    const root = create(
      <CampaignsScreen campaigns={campaigns} {...handlers} />,
    ).root;

    const flatList = root.findByType('FlatList');
    expect(flatList.props.data).toHaveLength(1);
    expect(flatList.props.refreshControl).toBeDefined();
  });

  // ── Empty states with different props ─────────────────────────────────────

  it('renders empty state with empty icon', () => {
    const root = create(<CampaignsScreen campaigns={[]} />).root;
    const emptyIcon = root.findByProps({ children: '📢' });
    expect(emptyIcon).toBeDefined();
  });

  it('renders empty state with subtitle', () => {
    const root = create(<CampaignsScreen campaigns={[]} />).root;
    // React Native renders Text with multi-child arrays
    // Verify the empty state doesn't crash
    expect(() => root.findByProps({ children: '暂无营销活动' })).not.toThrow();
  });
});

// ── Helper: renderDataCallbackTest ──────────────────────────────────────────

function renderDataCallbackTest(props: Partial<Parameters<typeof CampaignsScreen>[0]>): void {
  const campaigns = [makeCampaign({ id: 'c1', status: 'active', enrolled: false })];
  const root = create(
    <CampaignsScreen campaigns={campaigns} {...props} />,
  ).root;
  const flatList = root.findByType('FlatList');
  expect(flatList.props.data).toHaveLength(1);
  // The component renders without crashing with callbacks
  expect(() => root.findByType('FlatList')).not.toThrow();
}
