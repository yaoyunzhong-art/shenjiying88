'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  Pagination,
  StatCard,
} from '@m5/ui';

import type { DataTableColumn } from '@m5/ui';
import type {
  CustomersSnapshotDelivery,
  CustomerListItem,
  CustomerListStatus,
} from '../customers-data';
import {
  CUSTOMER_LIST_STATUS_MAP,
  CUSTOMER_LIST_STATUSES,
} from '../customers-data';

const CUSTOMERS_PER_PAGE = 10;

function formatCurrency(cents: number): string {
  const yuan = cents / 100;
  if (yuan >= 10_000) return `¥${(yuan / 10_000).toFixed(1)}万`;
  return `¥${Math.round(yuan).toLocaleString('zh-CN')}`;
}

export default function CustomersClient({
  snapshot,
}: {
  snapshot: CustomersSnapshotDelivery;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerListStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let items = snapshot.customers;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter((customer) =>
        customer.companyName.toLowerCase().includes(lower) ||
        customer.contactEmail.toLowerCase().includes(lower) ||
        customer.contactPhone.toLowerCase().includes(lower) ||
        customer.tags.some((tag) => tag.toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((customer) => customer.status === statusFilter);
    }

    return items;
  }, [searchTerm, snapshot.customers, statusFilter]);

  const paged = useMemo(() => {
    const start = page * CUSTOMERS_PER_PAGE;
    return filtered.slice(start, start + CUSTOMERS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / CUSTOMERS_PER_PAGE);

  const columns: DataTableColumn<CustomerListItem>[] = [
    {
      key: 'companyName',
      header: '企业',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.companyName}</span>
      ),
    },
    {
      key: 'contactEmail',
      header: '联系方式',
      render: (item) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>{item.contactEmail}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.contactPhone}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = CUSTOMER_LIST_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'engagementScore',
      header: '互动分',
      render: (item) => `${item.engagementScore}`,
    },
    {
      key: 'visitCount',
      header: '互动次数',
      render: (item) => `${item.visitCount}`,
    },
    {
      key: 'totalSpentCents',
      header: '累计消费',
      render: (item) => formatCurrency(item.totalSpentCents),
    },
    {
      key: 'tags',
      header: '标签',
      render: (item) =>
        item.tags.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="neutral">{tag}</Badge>
            ))}
          </div>
        ) : (
          <span style={{ color: '#64748b' }}>-</span>
        ),
    },
    {
      key: 'lastActivity',
      header: '最近活跃',
      render: (item) => item.lastActivity || '—',
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>企业客户管理</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            优先透传 CRM 列表与统计快照；当上游缺失字段时收缩为企业、状态、互动与消费最小视图。
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.24)',
            background: 'rgba(15,23,42,0.55)',
            color: '#e2e8f0',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            opacity: isRefreshing ? 0.65 : 1,
          }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(250,204,21,0.28)',
            background: 'rgba(250,204,21,0.08)',
            color: '#fde68a',
          }}
        >
          {snapshot.error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="总客户数" value={snapshot.stats.total.toString()} />
        <StatCard label="活跃客户" value={snapshot.stats.byStatus.active.toString()} />
        <StatCard label="平均互动分" value={snapshot.stats.avgScore.toString()} />
        <StatCard label="累计消费" value={formatCurrency(snapshot.stats.totalSpentCents)} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchFilterInput
          placeholder="搜索企业/邮箱/手机号/标签..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as CustomerListStatus | 'all');
            setPage(0);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部状态</option>
          {CUSTOMER_LIST_STATUSES.map((status) => (
            <option key={status} value={status}>{CUSTOMER_LIST_STATUS_MAP[status].label}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条结果
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          {searchTerm || statusFilter !== 'all'
            ? '当前筛选条件下没有企业客户记录'
            : '当前快照暂无企业客户数据'}
        </div>
      )}

      {filtered.length > 0 ? (
        <DataTable columns={columns} rows={paged} rowKey={(customer: CustomerListItem) => customer.id} />
      ) : null}

      {totalPages > 1 && (
        <Pagination
          page={page}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
