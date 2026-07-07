import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  NotificationBell,
  type NotificationItem,
  type NotificationBellProps,
} from './NotificationBell';

// ==================== 工厂函数 ====================

function createItems(overrides?: Partial<NotificationItem>[]): NotificationItem[] {
  return [
    {
      id: 'n1',
      title: '新订单 #1024',
      description: '客人已下单，请准备。',
      read: false,
      type: 'info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分钟前
      ...(overrides?.[0] ?? {}),
    },
    {
      id: 'n2',
      title: '库存预警',
      description: '可乐库存不足，剩余3瓶。',
      read: false,
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分钟前
      ...(overrides?.[1] ?? {}),
    },
    {
      id: 'n3',
      title: '设备离线',
      description: '3号机台已离线。',
      read: true,
      type: 'error',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2小时前
      ...(overrides?.[2] ?? {}),
    },
    {
      id: 'n4',
      title: '系统更新完成',
      read: true,
      type: 'success',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1天前
      ...(overrides?.[3] ?? {}),
    },
  ];
}

function renderBell(props?: Partial<NotificationBellProps>) {
  const items = props?.items ?? createItems();
  return render(<NotificationBell items={items} {...props} />);
}

// ==================== 测试用例 ====================

describe('NotificationBell', () => {
  // ---------- 渲染 ----------

  it('渲染铃铛图标', () => {
    renderBell();
    expect(screen.getByLabelText('通知')).toBeInTheDocument();
  });

  it('渲染未读数徽章', () => {
    renderBell();
    const badge = screen.getByTestId('bell-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2'); // n1, n2 未读
  });

  it('没有未读时不显示徽章', () => {
    const items = createItems().map((i) => ({ ...i, read: true }));
    renderBell({ items });
    expect(screen.queryByTestId('bell-badge')).not.toBeInTheDocument();
  });

  it('超过 maxBadgeCount 显示 N+', () => {
    const items = Array.from({ length: 150 }, (_, i) => ({
      id: `n-${i}`,
      title: `通知 ${i}`,
      read: false,
      type: 'info' as const,
      timestamp: new Date().toISOString(),
    }));
    renderBell({ items, maxBadgeCount: 99 });
    const badge = screen.getByTestId('bell-badge');
    expect(badge).toHaveTextContent('99+');
  });

  // ---------- 下拉面板 ----------

  it('点击铃铛打开下拉面板', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('打开面板后显示未读数', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByText('(2条未读)')).toBeInTheDocument();
  });

  it('打开面板后显示通知列表', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-item-n1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-n2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-n3')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-n4')).toBeInTheDocument();
  });

  it('通知数量受 maxListCount 限制', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `n-${i}`,
      title: `通知 ${i}`,
      read: false,
      type: 'info' as const,
      timestamp: new Date().toISOString(),
    }));
    renderBell({ items, maxListCount: 3 });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-item-n-0')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-item-n-3')).not.toBeInTheDocument();
  });

  it('空列表显示空状态提示', () => {
    renderBell({ items: [] });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-empty')).toHaveTextContent('暂无新通知');
  });

  it('支持自定义空状态文字', () => {
    renderBell({ items: [], emptyText: '没有新消息' });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-empty')).toHaveTextContent('没有新消息');
  });

  // ---------- 交互 ----------

  it('点击未读通知触发 onMarkRead 并调用 item.onClick', () => {
    const onMarkRead = vi.fn();
    const onClickItem = vi.fn();
    const items = createItems([
      { onClick: onClickItem },
      undefined,
      undefined,
      undefined,
    ]);
    renderBell({ items, onMarkRead });
    fireEvent.click(screen.getByLabelText('通知'));
    fireEvent.click(screen.getByTestId('notification-item-n1'));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
    expect(onClickItem).toHaveBeenCalled();
  });

  it('点击已读通知不触发 onMarkRead 但触发 onClick', () => {
    const onMarkRead = vi.fn();
    const onClickItem = vi.fn();
    const items = createItems([undefined, undefined, { onClick: onClickItem }, undefined]);
    renderBell({ items, onMarkRead });
    fireEvent.click(screen.getByLabelText('通知'));
    fireEvent.click(screen.getByTestId('notification-item-n3'));
    expect(onMarkRead).not.toHaveBeenCalled();
    expect(onClickItem).toHaveBeenCalled();
  });

  it('点击"全部已读"触发 onMarkAllRead', () => {
    const onMarkAllRead = vi.fn();
    renderBell({ onMarkAllRead });
    fireEvent.click(screen.getByLabelText('通知'));
    fireEvent.click(screen.getByTestId('mark-all-read-btn'));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('没有未读时不显示"全部已读"按钮', () => {
    const items = createItems().map((i) => ({ ...i, read: true }));
    renderBell({ items, onMarkAllRead: vi.fn() });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.queryByTestId('mark-all-read-btn')).not.toBeInTheDocument();
  });

  it('点击"查看全部"触发 onViewAll', () => {
    const onViewAll = vi.fn();
    renderBell({ onViewAll });
    fireEvent.click(screen.getByLabelText('通知'));
    fireEvent.click(screen.getByTestId('view-all-btn'));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('列表为空时底部不显示"查看全部"', () => {
    renderBell({ items: [], onViewAll: vi.fn() });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.queryByTestId('view-all-btn')).not.toBeInTheDocument();
  });

  // ---------- 关闭面板 ----------

  it('点击外部关闭面板', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('点击下拉面板内部不关闭', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    const dropdown = screen.getByTestId('notification-dropdown');
    fireEvent.click(dropdown);
    expect(dropdown).toBeInTheDocument();
  });

  // ---------- 时间格式化 ----------

  it('格式化时间 — 刚刚', () => {
    const items = createItems([
      { timestamp: new Date().toISOString() },
      undefined,
      undefined,
      undefined,
    ]);
    renderBell({ items });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(within(screen.getByTestId('notification-item-n1')).getByText('刚刚')).toBeInTheDocument();
  });

  it('格式化时间 — 分钟前', () => {
    const items = createItems([
      { timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      undefined,
      undefined,
      undefined,
    ]);
    renderBell({ items });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(within(screen.getByTestId('notification-item-n1')).getByText('10分钟前')).toBeInTheDocument();
  });

  it('格式化时间 — 小时前', () => {
    const items = createItems([
      { timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
      undefined,
      undefined,
      undefined,
    ]);
    renderBell({ items });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(within(screen.getByTestId('notification-item-n1')).getByText('5小时前')).toBeInTheDocument();
  });

  it('格式化时间 — 天前', () => {
    const items = createItems([
      { timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      undefined,
      undefined,
      undefined,
    ]);
    renderBell({ items });
    fireEvent.click(screen.getByLabelText('通知'));
    expect(within(screen.getByTestId('notification-item-n1')).getByText('3天前')).toBeInTheDocument();
  });

  // ---------- 未读指示点 ----------

  it('未读通知显示指示点，已读不显示', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    const itemN1 = screen.getByTestId('notification-item-n1');
    const itemN3 = screen.getByTestId('notification-item-n3');
    expect(within(itemN1).getByTestId('unread-dot')).toBeInTheDocument();
    expect(within(itemN3).queryByTestId('unread-dot')).not.toBeInTheDocument();
  });

  // ---------- 类型色条 ----------

  it('通知类型对应正确颜色', () => {
    renderBell();
    fireEvent.click(screen.getByLabelText('通知'));
    const item = screen.getByTestId('notification-item-n2'); // warning
    const colorBar = item.querySelector('span:last-child');
    expect(colorBar).toBeInTheDocument();
    expect(colorBar).toHaveStyle('background: #f59e0b');
  });

  // ---------- 尺寸 ----------

  it('不同 size 不报错', () => {
    const { rerender } = render(
      <NotificationBell items={createItems()} size="sm" />
    );
    expect(screen.getByLabelText('通知')).toBeInTheDocument();
    rerender(<NotificationBell items={createItems()} size="lg" />);
    expect(screen.getByLabelText('通知')).toBeInTheDocument();
  });
});
