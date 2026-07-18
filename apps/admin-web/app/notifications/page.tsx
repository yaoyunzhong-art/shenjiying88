'use client';

/**
 * 通知管理页 — 圈梁四道箍·永久铁律
 *
 * 功能:
 *   - 通知列表（标题/内容/类型/发送对象/发送时间/状态）
 *   - 通知类型: 系统公告/营销推送/告警通知/活动提醒
 *   - 接收对象: 全部门店/指定门店/指定角色
 *   - 状态: 已发送/待发送/发送中
 *   - Tab筛选: 全部/已发送/待发送
 *   - 概览统计: 总通知数/本月发送/成功率
 *   - 默认样本数据（7条通知记录）
 *   - 空态增强
 *   - 刷新按钮
 */

import { useState, useMemo, useCallback } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  DataTable,
  Pagination,
  usePagination,
  EmptyState,
  Button,
  Spinner,
} from '@m5/ui';
import type { DataTableColumn } from '@m5/ui';

/* ── 类型定义 ── */

type NotifType = 'announcement' | 'marketing' | 'alert' | 'activity';
type RecipientScope = 'all' | 'specific_store' | 'specific_role';
type NotifDeliveryStatus = 'sent' | 'pending' | 'sending';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotifType;
  recipientScope: RecipientScope;
  recipientLabel: string;
  status: NotifDeliveryStatus;
  sentAt: string;
  successRate: number;
}

/* ── 类型映射表 ── */

const NT_LABEL: Record<NotifType, string> = {
  announcement: '系统公告',
  marketing: '营销推送',
  alert: '告警通知',
  activity: '活动提醒',
};

const NT_VARIANT: Record<NotifType, 'success' | 'warning' | 'danger' | 'info'> = {
  announcement: 'success',
  marketing: 'warning',
  alert: 'danger',
  activity: 'info',
};

const RS_LABEL: Record<RecipientScope, string> = {
  all: '全部门店',
  specific_store: '指定门店',
  specific_role: '指定角色',
};

const DS_LABEL: Record<NotifDeliveryStatus, string> = {
  sent: '已发送',
  pending: '待发送',
  sending: '发送中',
};

const DS_VARIANT: Record<NotifDeliveryStatus, 'success' | 'warning' | 'info'> = {
  sent: 'success',
  pending: 'warning',
  sending: 'info',
};

/* ── 样本数据（7条） ── */

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'N001',
    title: '系统升级通知 2026-07',
    content: '系统将于2026年7月25日凌晨02:00-06:00进行例行升级维护，届时部分功能将暂停使用。',
    type: 'announcement',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'sent',
    sentAt: '2026-07-18 10:00:00',
    successRate: 100,
  },
  {
    id: 'N002',
    title: '暑期会员营销活动',
    content: '暑期大促活动即将上线，请各门店提前准备宣传物料，活动时间7月20日-8月20日。',
    type: 'marketing',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'sent',
    sentAt: '2026-07-17 14:30:00',
    successRate: 98.5,
  },
  {
    id: 'N003',
    title: '门店设备温度异常告警',
    content: 'A区3号游戏机温度超过安全阈值（85°C），请立即安排维护人员检查。',
    type: 'alert',
    recipientScope: 'specific_role',
    recipientLabel: '设备管理员',
    status: 'sending',
    sentAt: '2026-07-18 20:15:00',
    successRate: 72.3,
  },
  {
    id: 'N004',
    title: '新游戏上线体验活动',
    content: '《极速赛车》新版本将于7月22日上线，诚邀各门店组织客户体验。',
    type: 'activity',
    recipientScope: 'specific_store',
    recipientLabel: '旗舰店·A/B/C区',
    status: 'sent',
    sentAt: '2026-07-16 09:00:00',
    successRate: 100,
  },
  {
    id: 'N005',
    title: '月度消防安全培训通知',
    content: '7月25日下午14:00将举行月度消防安全线上培训，请各门店安全员准时参加。',
    type: 'announcement',
    recipientScope: 'specific_role',
    recipientLabel: '安全员',
    status: 'pending',
    sentAt: '',
    successRate: 0,
  },
  {
    id: 'N006',
    title: '积分兑换促销活动',
    content: '会员积分双倍兑换活动即将开始，请各门店在收银台放置活动展架。',
    type: 'marketing',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'pending',
    sentAt: '',
    successRate: 0,
  },
  {
    id: 'N007',
    title: '库存预警：热门配件缺货',
    content: '手柄充电底座库存不足（仅剩5件），建议立即补货以避免断货。',
    type: 'alert',
    recipientScope: 'specific_store',
    recipientLabel: 'A区门店',
    status: 'sent',
    sentAt: '2026-07-18 08:45:00',
    successRate: 95.0,
  },
];

/* ── 辅助函数 ── */

function formatDate(iso: string): string {
  if (!iso) return '—';
  return iso;
}

function countByStatus(items: Notification[], status: NotifDeliveryStatus): number {
  return items.filter(n => n.status === status).length;
}

function calcSuccessRate(items: Notification[]): number {
  const sentItems = items.filter(n => n.status === 'sent' && n.successRate > 0);
  if (sentItems.length === 0) return 0;
  const total = sentItems.reduce((sum, n) => sum + n.successRate, 0);
  return Math.round(total / sentItems.length);
}

function countThisMonth(items: Notification[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return items.filter(n => {
    if (!n.sentAt) return false;
    return n.sentAt.startsWith(`${year}-${month}`);
  }).length;
}

/* ── 构建表格列 ── */

function buildColumns(): DataTableColumn<Notification>[] {
  return [
    { key: 'title', title: '标题', dataKey: 'title', sortable: true },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: n => NT_LABEL[n.type],
      render: n => <StatusBadge label={NT_LABEL[n.type]} variant={NT_VARIANT[n.type]} size="sm" />,
    },
    {
      key: 'recipientScope',
      title: '发送对象',
      sortable: true,
      sortValue: n => n.recipientLabel,
      render: n => <span>{n.recipientLabel}</span>,
    },
    { key: 'sentAt', title: '发送时间', sortable: true, sortValue: n => n.sentAt || '', render: n => <span>{formatDate(n.sentAt)}</span> },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: n => DS_LABEL[n.status],
      render: n => <StatusBadge label={DS_LABEL[n.status]} variant={DS_VARIANT[n.status]} size="sm" />,
    },
  ];
}

/* ── 页面组件 ── */

export default function NotificationsPage() {
  const [tabKey, setTabKey] = useState<string>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const filtered = useMemo(() => {
    let items = MOCK_NOTIFICATIONS;
    if (tabKey === 'sent') items = items.filter(n => n.status === 'sent');
    else if (tabKey === 'pending') items = items.filter(n => n.status === 'pending');
    return items;
  }, [tabKey, refreshKey]);

  const stats = useMemo(() => ({
    total: MOCK_NOTIFICATIONS.length,
    thisMonth: countThisMonth(MOCK_NOTIFICATIONS),
    successRate: calcSuccessRate(MOCK_NOTIFICATIONS),
  }), []);

  const columns = useMemo(() => buildColumns(), []);
  const pagination = usePagination({ initialPageSize: 10 });
  const pageItems = pagination.paginate(filtered);

  const tabItems = [
    { key: 'ALL', label: '全部', count: MOCK_NOTIFICATIONS.length },
    { key: 'sent', label: '已发送', count: countByStatus(MOCK_NOTIFICATIONS, 'sent') },
    { key: 'pending', label: '待发送', count: countByStatus(MOCK_NOTIFICATIONS, 'pending') },
  ];

  return (
    <main style={{ maxWidth: 1060, margin: '0 auto', padding: 32 }}>
      <PageShell title="📢 通知管理" subtitle="管理和查看系统通知的发送记录">
        {/* 概览统计 */}
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(3, 1fr)',
            marginBottom: 24,
          }}
        >
          <StatCard label="总通知数" value={stats.total} />
          <StatCard label="本月发送" value={stats.thisMonth} />
          <StatCard label="成功率" value={`${stats.successRate}%`} />
        </div>

        {/* 操作栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Tabs
            items={tabItems}
            activeKey={tabKey}
            onChange={setTabKey}
            variant="pills"
            size="sm"
          />
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            🔄 刷新
          </Button>
        </div>

        {/* 数据列表 */}
        {filtered.length === 0 ? (
          <EmptyState
            title="暂无通知"
            description="当前筛选条件下没有通知记录，调整筛选条件或等待新通知。"
          />
        ) : (
          <>
            <DataTable
              title={`通知 (${filtered.length})`}
              columns={columns}
              items={pageItems}
              rowKey={n => n.id}
              striped
              compact
            />
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={filtered.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </PageShell>
    </main>
  );
}
