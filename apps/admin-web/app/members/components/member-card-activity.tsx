'use client';

import React, { useState, useMemo, useCallback } from 'react';

import {
  DataTable,
  StatusBadge,
  Pagination,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 卡片活动记录类型 ----

export interface CardActivity {
  id: string;
  cardId: string;
  cardNumber: string;
  memberName: string;
  type: 'consume' | 'recharge' | 'refund' | 'points_award' | 'points_deduct' | 'status_change' | 'expire' | 'renew';
  amount: number;
  pointsDelta: number;
  description: string;
  operator: string;
  createdAt: string;
  balanceAfter: number;
}

// ---- 活动类型映射 ----

const ACTIVITY_TYPE_MAP: Record<CardActivity['type'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  consume: { label: '消费', variant: 'info' },
  recharge: { label: '充值', variant: 'success' },
  refund: { label: '退款', variant: 'warning' },
  points_award: { label: '加分', variant: 'success' },
  points_deduct: { label: '扣分', variant: 'danger' },
  status_change: { label: '状态变更', variant: 'neutral' },
  expire: { label: '过期', variant: 'danger' },
  renew: { label: '续期', variant: 'success' },
};

// ---- 模拟数据 ----

export const MOCK_CARD_ACTIVITIES: CardActivity[] = [
  { id: 'act-001', cardId: 'card-001', cardNumber: 'VIP-8888-0001', memberName: '张伟', type: 'consume', amount: 12800, pointsDelta: 2560, description: '购买数码相机', operator: '系统', createdAt: '2026-06-13T14:30:00Z', balanceAfter: 12500 },
  { id: 'act-002', cardId: 'card-001', cardNumber: 'VIP-8888-0001', memberName: '张伟', type: 'recharge', amount: 50000, pointsDelta: 0, description: '柜面充值', operator: 'admin@example.com', createdAt: '2026-06-10T10:00:00Z', balanceAfter: 25300 },
  { id: 'act-003', cardId: 'card-002', cardNumber: 'VIP-8888-0002', memberName: '赵敏', type: 'consume', amount: 25000, pointsDelta: 7500, description: '购买珠宝首饰', operator: '系统', createdAt: '2026-06-14T16:20:00Z', balanceAfter: 35000 },
  { id: 'act-004', cardId: 'card-002', cardNumber: 'VIP-8888-0002', memberName: '赵敏', type: 'points_award', amount: 0, pointsDelta: 5000, description: '生日赠送积分', operator: 'system', createdAt: '2026-06-09T09:00:00Z', balanceAfter: 60000 },
  { id: 'act-005', cardId: 'card-003', cardNumber: 'VIP-US-0001', memberName: '郑丽', type: 'consume', amount: 32000, pointsDelta: 9600, description: '购买LV包袋', operator: '系统', createdAt: '2026-06-14T11:45:00Z', balanceAfter: 42000 },
  { id: 'act-006', cardId: 'card-001', cardNumber: 'VIP-8888-0001', memberName: '张伟', type: 'refund', amount: -8000, pointsDelta: -1600, description: '退还商品', operator: 'ops@example.com', createdAt: '2026-06-12T09:30:00Z', balanceAfter: 4500 },
  { id: 'act-007', cardId: 'card-004', cardNumber: 'GOLD-0001', memberName: '李娜', type: 'consume', amount: 6500, pointsDelta: 975, description: '购买护肤品套装', operator: '系统', createdAt: '2026-06-12T15:00:00Z', balanceAfter: 5800 },
  { id: 'act-008', cardId: 'card-005', cardNumber: 'GOLD-0002', memberName: '陈静', type: 'points_deduct', amount: 0, pointsDelta: -2000, description: '兑换商品', operator: 'system', createdAt: '2026-06-11T13:00:00Z', balanceAfter: 3200 },
  { id: 'act-009', cardId: 'card-006', cardNumber: 'STD-0001', memberName: '刘洋', type: 'expire', amount: 0, pointsDelta: 0, description: '卡片已过期', operator: '系统', createdAt: '2026-06-01T00:00:00Z', balanceAfter: 200 },
  { id: 'act-010', cardId: 'card-007', cardNumber: 'VIP-8888-0003', memberName: '马超', type: 'recharge', amount: 20000, pointsDelta: 0, description: '线上充值', operator: 'system', createdAt: '2026-06-08T10:30:00Z', balanceAfter: 18800 },
  { id: 'act-011', cardId: 'card-002', cardNumber: 'VIP-8888-0002', memberName: '赵敏', type: 'status_change', amount: 0, pointsDelta: 0, description: '卡片状态从"正常"变更为"已冻结"', operator: 'ops@example.com', createdAt: '2026-05-20T08:00:00Z', balanceAfter: 60000 },
  { id: 'act-012', cardId: 'card-003', cardNumber: 'VIP-US-0001', memberName: '郑丽', type: 'renew', amount: 0, pointsDelta: 0, description: '会员卡续期至2027年', operator: 'system', createdAt: '2026-05-15T00:00:00Z', balanceAfter: 42000 },
];

// ---- 辅助函数 ----

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function activityColor(type: CardActivity['type']): string {
  const colors: Record<string, string> = {
    consume: '#93c5fd',
    recharge: '#86efac',
    refund: '#fde68a',
    points_award: '#c4b5fd',
    points_deduct: '#fca5a5',
    status_change: '#94a3b8',
    expire: '#fca5a5',
    renew: '#86efac',
  };
  return colors[type] ?? '#94a3b8';
}

// ---- 卡片活动表格组件 ----

export function CardActivityTable({
  activities,
  compact,
}: {
  activities?: CardActivity[];
  compact?: boolean;
}) {
  const data = activities ?? MOCK_CARD_ACTIVITIES;
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const columns: DataTableColumn<CardActivity>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        title: '时间',
        dataKey: 'createdAt',
        sortable: true,
        width: '160px',
        render: (item) => (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(item.createdAt)}</span>
        ),
      },
      ...(!compact
        ? [
            {
              key: 'cardNumber' as const,
              title: '卡号' as const,
              dataKey: 'cardNumber' as const,
              sortable: true,
              render: (item: CardActivity) => (
                <code style={{ color: '#93c5fd', fontSize: 12 }}>{item.cardNumber}</code>
              ),
            } as DataTableColumn<CardActivity>,
            {
              key: 'memberName' as const,
              title: '会员' as const,
              dataKey: 'memberName' as const,
              sortable: true,
            } as DataTableColumn<CardActivity>,
          ]
        : []),
      {
        key: 'type',
        title: '类型',
        sortable: true,
        sortValue: (item) => item.type,
        render: (item) => (
          <StatusBadge
            label={ACTIVITY_TYPE_MAP[item.type].label}
            variant={ACTIVITY_TYPE_MAP[item.type].variant as 'success' | 'warning' | 'danger' | 'neutral'}
            size="sm"
          />
        ),
      },
      {
        key: 'amount',
        title: '金额',
        dataKey: 'amount',
        sortable: true,
        align: 'right',
        render: (item) =>
          item.amount !== 0 ? (
            <span
              style={{
                fontWeight: 600,
                color: item.amount > 0 ? '#fbbf24' : '#fca5a5',
              }}
            >
              {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>—</span>
          ),
      },
      {
        key: 'pointsDelta',
        title: '积分变动',
        dataKey: 'pointsDelta',
        sortable: true,
        align: 'right',
        render: (item) =>
          item.pointsDelta !== 0 ? (
            <span
              style={{
                fontWeight: 600,
                color: item.pointsDelta > 0 ? '#a78bfa' : '#fca5a5',
              }}
            >
              {item.pointsDelta > 0 ? '+' : ''}{item.pointsDelta.toLocaleString()}
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>—</span>
          ),
      },
      {
        key: 'description',
        title: '描述',
        dataKey: 'description',
        sortable: false,
      },
      ...(!compact
        ? [
            {
              key: 'operator' as const,
              title: '操作人' as const,
              dataKey: 'operator' as const,
              sortable: true,
            } as DataTableColumn<CardActivity>,
          ]
        : []),
      ...(!compact
        ? [
            {
              key: 'balanceAfter' as const,
              title: '余额后' as const,
              dataKey: 'balanceAfter' as const,
              sortable: true,
              align: 'right' as const,
              render: (item: CardActivity) => (
                <span style={{ fontWeight: 500 }}>{formatCurrency(item.balanceAfter)}</span>
              ),
            } as DataTableColumn<CardActivity>,
          ]
        : []),
    ],
    [compact]
  );

  const pagination = usePagination({
    initialPageSize: compact ? 5 : 10,
    pageSizeOptions: [5, 10, 20],
  });

  const sortedItems = useSortedItems(data, columns, sortConfig);
  const pageItems = pagination.paginate(sortedItems);

  return (
    <div>
      <DataTable
        title={`卡片活动记录（共 ${data.length} 条）`}
        columns={columns}
        items={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact={compact}
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={sortedItems.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

// ---- 活动摘要统计 ----

export function CardActivityStats({ activities }: { activities?: CardActivity[] }) {
  const data = activities ?? MOCK_CARD_ACTIVITIES;

  const stats = useMemo(
    () => ({
      totalActivities: data.length,
      totalConsume: data.filter((a) => a.type === 'consume').reduce((s, a) => s + a.amount, 0),
      totalRecharge: data.filter((a) => a.type === 'recharge').reduce((s, a) => s + a.amount, 0),
      totalRefund: data.filter((a) => a.type === 'refund').reduce((s, a) => s + Math.abs(a.amount), 0),
      totalPointsAward: data.filter((a) => a.type === 'points_award' || a.type === 'recharge').reduce((s, a) => s + a.pointsDelta, 0),
    }),
    [data]
  );

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(5, 1fr)',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>总活动数</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
          {stats.totalActivities}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>条记录</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(147, 197, 253, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>消费总额</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#93c5fd' }}>
          {formatCurrency(stats.totalConsume)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>元</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>充值总额</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
          {formatCurrency(stats.totalRecharge)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>元</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>退款总额</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>
          {formatCurrency(stats.totalRefund)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>元</div>
      </div>
      <div
        style={{
          borderRadius: 12,
          padding: 14,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(196, 181, 253, 0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>积分发放</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>
          {stats.totalPointsAward.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>分</div>
      </div>
    </div>
  );
}
