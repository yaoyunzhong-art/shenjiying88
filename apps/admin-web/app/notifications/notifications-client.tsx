'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import {
  Button,
  DataTable,
  EmptyState,
  PageShell,
  Pagination,
  StatCard,
  StatusBadge,
  Tabs,
  usePagination,
  type DataTableColumn,
} from '@m5/ui'
import type {
  Notification,
  NotificationsSnapshotDelivery,
} from './notifications-data'
import {
  calcSuccessRate,
  countByStatus,
  countSnapshotMonth,
  DS_LABEL,
  DS_VARIANT,
  formatDate,
  NT_LABEL,
  NT_VARIANT,
} from './notifications-data'

function buildColumns(): DataTableColumn<Notification>[] {
  return [
    { key: 'title', title: '标题', dataKey: 'title', sortable: true },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item) => NT_LABEL[item.type],
      render: (item) => (
        <StatusBadge label={NT_LABEL[item.type]} variant={NT_VARIANT[item.type]} size="sm" />
      ),
    },
    {
      key: 'recipientScope',
      title: '发送对象',
      sortable: true,
      sortValue: (item) => item.recipientLabel,
      render: (item) => <span>{item.recipientLabel}</span>,
    },
    {
      key: 'sentAt',
      title: '发送时间',
      sortable: true,
      sortValue: (item) => item.sentAt || '',
      render: (item) => <span>{formatDate(item.sentAt)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item) => DS_LABEL[item.status],
      render: (item) => (
        <StatusBadge label={DS_LABEL[item.status]} variant={DS_VARIANT[item.status]} size="sm" />
      ),
    },
  ]
}

export default function NotificationsClient({
  snapshot,
}: {
  snapshot: NotificationsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabKey, setTabKey] = useState<'ALL' | 'sent' | 'pending'>('ALL')
  const notifications = snapshot.notifications
  const columns = useMemo(() => buildColumns(), [])
  const pagination = usePagination({ initialPageSize: 10 })

  const filtered = useMemo(() => {
    if (tabKey === 'sent') return notifications.filter((item) => item.status === 'sent')
    if (tabKey === 'pending') return notifications.filter((item) => item.status === 'pending')
    return notifications
  }, [notifications, tabKey])

  const stats = useMemo(
    () => ({
      total: notifications.length,
      thisMonth: countSnapshotMonth(notifications, snapshot.generatedAt),
      successRate: calcSuccessRate(notifications),
    }),
    [notifications, snapshot.generatedAt]
  )

  const pageItems = pagination.paginate(filtered)
  const tabItems = [
    { key: 'ALL', label: '全部', count: notifications.length },
    { key: 'sent', label: '已发送', count: countByStatus(notifications, 'sent') },
    { key: 'pending', label: '待发送', count: countByStatus(notifications, 'pending') },
  ]

  return (
    <main style={{ maxWidth: 1060, margin: '0 auto', padding: 32 }}>
      <PageShell title="通知管理" subtitle="管理和查看系统通知的发送记录">
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <StatCard label="总通知数" value={stats.total} />
          <StatCard label="本月发送" value={stats.thisMonth} />
          <StatCard label="成功率" value={`${stats.successRate}%`} />
        </div>

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
            onChange={(key) => setTabKey(key as 'ALL' | 'sent' | 'pending')}
            variant="pills"
            size="sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRefresh()}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
        </div>

        {snapshot.error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              color: '#92400e',
              fontSize: 12,
            }}
          >
            {snapshot.error}
          </div>
        )}

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
              rowKey={(item) => item.id}
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
  )
}
