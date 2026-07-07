/**
 * NotificationsScreen.test.tsx - Phase-21 T53
 * 通知列表页单元测试
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { NotificationsScreen, type Notification } from './NotificationsScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────

const SAMPLE: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: '设备离线告警',
    body: '门店 A 的主终端设备已离线超过 15 分钟，请及时检查。',
    read: false,
    createdAt: '2026-06-28T02:30:00Z',
  },
  {
    id: '2',
    type: 'system',
    title: '系统维护通知',
    body: '今晚 02:00-04:00 进行数据库升级，期间部分功能不可用。',
    read: true,
    createdAt: '2026-06-27T10:00:00Z',
  },
  {
    id: '3',
    type: 'marketing',
    title: '会员日促销',
    body: '本周五会员日，全场消费双倍积分，速来参与！',
    read: false,
    createdAt: '2026-06-27T08:00:00Z',
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationsScreen', () => {
  it('renders empty state when no notifications', () => {
    const root = create(<NotificationsScreen notifications={[]} />).root;
    const emptyText = root.findByProps({ children: '暂无通知' });
    expect(emptyText).toBeDefined();
  });

  it('renders empty state when no notifications (default prop)', () => {
    const root = create(<NotificationsScreen />).root;
    const emptyText = root.findByProps({ children: '暂无通知' });
    expect(emptyText).toBeDefined();
  });

  it('renders FlatList with notification data when provided', () => {
    const root = create(<NotificationsScreen notifications={SAMPLE} />).root;
    // FlatList receives data via props — verify it's passed correctly
    const flatList = root.findByType('FlatList');
    expect(flatList).toBeDefined();
    expect(flatList.props.data).toHaveLength(3);
    // Should be sorted: unread first
    expect(flatList.props.data[0].id).toBe('1'); // alert - unread
    expect(flatList.props.data[1].id).toBe('3'); // marketing - unread
    expect(flatList.props.data[2].id).toBe('2'); // system - read
  });

  it('passes correct keyExtractor to FlatList', () => {
    const root = create(<NotificationsScreen notifications={SAMPLE} />).root;
    const flatList = root.findByType('FlatList');
    expect(flatList.props.keyExtractor(SAMPLE[0])).toBe('1');
  });

  it('renders without crashing (smoke test)', () => {
    expect(() =>
      create(<NotificationsScreen notifications={SAMPLE} />).toJSON(),
    ).not.toThrow();
  });

  it('handles onRefresh callback', () => {
    const onRefresh = vi.fn();
    const root = create(
      <NotificationsScreen notifications={SAMPLE} refreshing={true} onRefresh={onRefresh} />,
    ).root;
    const flatList = root.findByType('FlatList');
    expect(flatList.props.refreshControl).toBeDefined();
    // Simulate refresh
    flatList.props.refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalled();
  });
});
