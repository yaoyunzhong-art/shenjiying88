'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import {
  PageShell,
  Card,
  StatCard,
  StatusBadge,
  Button,
  EmptyState,
  Tabs,
  Pagination,
  SearchFilterInput,
  usePagination,
  useSearchFilter,
} from '@m5/ui';

// ---- 类型 ----

type NotificationCategory = 'order' | 'system' | 'promotion' | 'member' | 'inventory' | 'alert';
type NotificationPriority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  title: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  sender: string;
}

// ---- 常量映射 ----

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: '订单通知',
  system: '系统通知',
  promotion: '营销活动',
  member: '会员通知',
  inventory: '库存提醒',
  alert: '告警通知',
};

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  order: '📋',
  system: '⚙️',
  promotion: '🎉',
  member: '👤',
  inventory: '📦',
  alert: '⚠️',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const PRIORITY_VARIANTS: Record<NotificationPriority, 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

const CATEGORIES: NotificationCategory[] = ['order', 'system', 'promotion', 'member', 'inventory', 'alert'];

// ---- Mock 数据生成 ----

function generateNotifications(count: number): Notification[] {
  const titles: Partial<Record<NotificationCategory, string[]>> = {
    order: ['新订单 #ORD-20260715-001 已提交', '订单 #ORD-20260715-002 已完成支付', '订单 #ORD-20260715-003 申请退款', '订单 #ORD-20260714-101 已发货', '有一笔待确认订单即将超时'],
    system: ['系统将于今晚 02:00-04:00 进行维护升级', '门店数据同步完成', '新版本 v2.8.0 已发布', '系统检测到异常登录行为', '数据库备份已完成'],
    promotion: ['618大促活动已开始，请及时上架活动商品', '会员日优惠券已发放', '新活动「夏日狂欢节」审批通过', '限时秒杀活动即将开始', '满减活动配置已生效'],
    member: ['VIP会员张先生本月生日，记得发送祝福', '新注册会员 15 人，昨日新增', '会员积分兑换申请待审批', '会员等级批量调整完成', '高价值会员流失预警'],
    inventory: ['电竞椅-旗舰款库存不足（剩余 3 件）', '显示器-27寸已补货到库', '键鼠套装库存超出安全阈值', '新一批补给品已入库待上架', '清洁湿巾库存为 0，请尽快采购'],
    alert: ['收银台设备异常，请检查网络连接', '门店温度传感器告警：冷库温度偏高', '监控摄像头 #C03 信号丢失', '门禁系统离线，需手动处理', 'UPS 电源电量低于 20%'],
  };

  const senders = ['系统管理员', '运营团队', '门店经理', '供应链系统', '监控系统', '会员中心'];

  return Array.from({ length: count }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length];
    const categoryTitles = titles[category]!;
    const title = categoryTitles[i % categoryTitles.length];
    const priorities: NotificationPriority[] = ['high', 'medium', 'low'];
    const priority = i < 5 ? 'high' : (i < 15 ? 'medium' : 'low');

    return {
      id: `NOTIF-${String(i + 1).padStart(4, '0')}`,
      title,
      content: `这是${CATEGORY_LABELS[category]}的详细内容。请根据通知类型进行相应处理。${i % 3 === 0 ? '如需了解更多信息，请点击查看详情按钮。' : ''}`,
      category,
      priority,
      read: i >= 12,
      createdAt: `2026-07-${String(15 - Math.floor(i / 5)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      actionUrl: i % 3 === 0 ? '/orders' : undefined,
      actionLabel: i % 3 === 0 ? '查看详情' : undefined,
      sender: senders[i % senders.length],
    };
  });
}

const MOCK_NOTIFICATIONS = generateNotifications(24);

// ---- 子组件 ----

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

/** 通知统计概览 */
function NotificationSummaryCards({ items }: { items: Notification[] }) {
  const unread = items.filter((n) => !n.read).length;
  const highPriority = items.filter((n) => n.priority === 'high').length;
  const todayCount = items.filter((n) => {
    const d = new Date(n.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard label="全部通知" value={items.length.toString()} variant="info" />
      <StatCard label="未读通知" value={unread.toString()} variant="warning" />
      <StatCard label="高优先级" value={highPriority.toString()} variant="danger" />
      <StatCard label="今日通知" value={todayCount.toString()} variant="success" />
    </div>
  );
}

/** 通知分类筛选标签 */
function NotificationCategoryTabs({
  activeCategory,
  onChange,
}: {
  activeCategory: NotificationCategory | 'all';
  onChange: (key: NotificationCategory | 'all') => void;
}) {
  const counts: Record<string, number> = {};
  CATEGORIES.forEach((cat) => {
    counts[cat] = MOCK_NOTIFICATIONS.filter((n) => n.category === cat).length;
  });

  const tabs = [
    { key: 'all' as const, label: '全部', count: MOCK_NOTIFICATIONS.length },
    ...CATEGORIES.map((cat) => ({
      key: cat as NotificationCategory | 'all',
      label: `${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`,
      count: counts[cat],
    })),
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: tab.key === activeCategory ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab.key === activeCategory ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.08)'}`,
            color: tab.key === activeCategory ? '#818cf8' : '#cbd5e1',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
            e.currentTarget.style.color = '#818cf8';
          }}
          onMouseLeave={(e) => {
            if (tab.key !== activeCategory) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }
          }}
        >
          {tab.label} <span style={{ color: '#64748b', fontSize: 11 }}>({tab.count})</span>
        </div>
      ))}
    </div>
  );
}

/** 单条通知卡片 */
function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        background: notification.read ? 'rgba(255,255,255,0.02)' : 'rgba(30,41,59,0.5)',
        border: `1px solid ${notification.read ? 'rgba(148,163,184,0.06)' : 'rgba(99,102,241,0.2)'}`,
        marginBottom: 10,
        transition: 'all 0.15s',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(30,41,59,0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.read ? 'rgba(255,255,255,0.02)' : 'rgba(30,41,59,0.5)';
      }}
    >
      {/* 未读标记 */}
      {!notification.read && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#818cf8',
            marginTop: 6,
            flexShrink: 0,
          }}
        />
      )}
      {notification.read && <div style={{ width: 8, flexShrink: 0 }} />}

      {/* 内容区域 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: notification.read ? 400 : 600, color: '#e2e8f0' }}>
            {notification.title}
          </span>
          <StatusBadge
            label={PRIORITY_LABELS[notification.priority]}
            variant={PRIORITY_VARIANTS[notification.priority]}
            size="sm"
          />
          <StatusBadge
            label={CATEGORY_LABELS[notification.category]}
            variant="neutral"
            size="sm"
          />
        </div>

        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>
          {notification.content}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#64748b' }}>
          <span>{CATEGORY_ICONS[notification.category]} {notification.sender}</span>
          <span>{formatTime(notification.createdAt)}</span>
          {notification.actionLabel && (
            <Link
              href={notification.actionUrl || '#'}
              style={{ color: '#818cf8', textDecoration: 'none' }}
            >
              {notification.actionLabel} →
            </Link>
          )}
          {notification.read ? null : (
            <span
              style={{ color: '#818cf8', cursor: 'pointer', marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              标记已读
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** 加载中骨架屏 */
function NotificationsLoadingSkeleton() {
  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 70,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(30,41,59,0.6) 50%, rgba(30,41,59,0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div style={{ height: 40, borderRadius: 10, background: 'rgba(30,41,59,0.3)', marginBottom: 16 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 90,
            borderRadius: 10,
            background: 'rgba(30,41,59,0.3)',
            marginBottom: 10,
          }}
        />
      ))}
    </div>
  );
}

/** 空状态 */
function NotificationsEmptyState() {
  return (
    <EmptyState
      title="暂无通知"
      description="当前没有任何通知消息。新通知产生后会出现在这里。"
      actionLabel="刷新"
      actionHref="/account/notifications"
    />
  );
}

/** "全部标记已读"按钮 */
function MarkAllReadButton({ unreadCount, onMarkAll }: { unreadCount: number; onMarkAll: () => void }) {
  if (unreadCount === 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <Button variant="ghost" size="sm" onClick={onMarkAll}>
        全部标记已读 ({unreadCount})
      </Button>
    </div>
  );
}

// ---- 主组件 ----

export default function AccountNotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const searchFilter = useSearchFilter({ keys: ['title', 'content', 'sender'] });
  const pagination = usePagination({ defaultPageSize: 8 });

  // 过滤
  const filtered = useMemo(() => {
    let result = notifications;

    if (activeCategory !== 'all') {
      result = result.filter((n) => n.category === activeCategory);
    }
    if (searchFilter.query) {
      const q = searchFilter.query.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.sender.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCategory, notifications, searchFilter.query]);

  // 排序：最新在前
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filtered]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // 分页
  const pagedItems = sorted.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sorted.length / pagination.pageSize);

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.setPage(newPage);
    },
    [pagination]
  );

  // 标记单条已读
  const handleMarkRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    []
  );

  // 全部标记已读
  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <PageShell title="消息通知" subtitle="查看所有系统通知、订单提醒和营销活动消息">
      {/* 统计 */}
      <NotificationSummaryCards items={notifications} />

      {/* 标记全部已读 */}
      <MarkAllReadButton unreadCount={unreadCount} onMarkAll={handleMarkAllRead} />

      {/* 搜索 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          placeholder="搜索通知标题、内容、发送人..."
          value={searchFilter.query}
          onChange={searchFilter.setQuery}
        />
      </div>

      {/* 分类筛选 */}
      <NotificationCategoryTabs
        activeCategory={activeCategory}
        onChange={(key) => {
          setActiveCategory(key);
          pagination.setPage(1);
        }}
      />

      {/* 通知列表 */}
      <div>
        {pagedItems.length === 0 ? (
          <NotificationsEmptyState />
        ) : (
          pagedItems.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))
        )}
      </div>

      {/* 分页 */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
            total={sorted.length}
          />
        </div>
      )}
    </PageShell>
  );
}
