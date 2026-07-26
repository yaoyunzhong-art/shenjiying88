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
import type { CustomersSnapshotDelivery, CustomerItem, CustomerStatus, CustomerTier, CustomerIndustry } from '../customers-data';
import {
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
} from '../customers-data';

const CUSTOMERS_PER_PAGE = 10;

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

export default function CustomersClient({
  snapshot,
}: {
  snapshot: CustomersSnapshotDelivery;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<CustomerTier | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<CustomerIndustry | 'all'>('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let items = snapshot.customers;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof CustomerItem)[] = ['companyName', 'contactName', 'contactEmail', 'city'];
      items = items.filter((customer) =>
        fields.some((field) => String(customer[field]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((customer) => customer.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      items = items.filter((customer) => customer.tier === tierFilter);
    }

    if (industryFilter !== 'all') {
      items = items.filter((customer) => customer.industry === industryFilter);
    }

    return items;
  }, [industryFilter, searchTerm, snapshot.customers, statusFilter, tierFilter]);

  const paged = useMemo(() => {
    const start = page * CUSTOMERS_PER_PAGE;
    return filtered.slice(start, start + CUSTOMERS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / CUSTOMERS_PER_PAGE);

  const stats = useMemo(() => {
    const active = snapshot.customers.filter((customer) => customer.status === 'active').length;
    const totalMonthly = snapshot.customers.reduce((sum, customer) => sum + customer.monthlySpend, 0);
    const platinum = snapshot.customers.filter((customer) => customer.tier === 'platinum').length;
    return { total: snapshot.customers.length, active, totalMonthly, platinum };
  }, [snapshot.customers]);

  const columns: DataTableColumn<CustomerItem>[] = [
    {
      key: 'companyName',
      header: '公司名称',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.companyName}</span>
      ),
    },
    { key: 'contactName', header: '联系人' },
    { key: 'city', header: '城市' },
    {
      key: 'tier',
      header: '等级',
      render: (item) => {
        const info = CUSTOMER_TIER_MAP[item.tier];
        return <Badge variant={info.variant}>{info.label}</Badge>;
      },
    },
    {
      key: 'industry',
      header: '行业',
      render: (item) => CUSTOMER_INDUSTRY_MAP[item.industry],
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = CUSTOMER_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'activeContracts',
      header: '进行中合同',
      render: (item) => `${item.activeContracts}/${item.totalContracts}`,
    },
    {
      key: 'monthlySpend',
      header: '月消费',
      render: (item) => formatCurrency(item.monthlySpend),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>企业客户管理</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            透传服务端企业客户快照，支持状态、等级和行业的组合筛选。
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
        <StatCard label="总客户数" value={stats.total.toString()} />
        <StatCard label="合作中客户" value={stats.active.toString()} />
        <StatCard label="月均消费总额" value={formatCurrency(stats.totalMonthly)} />
        <StatCard label="铂金客户" value={stats.platinum.toString()} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchFilterInput
          placeholder="搜索公司/联系人/城市..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as CustomerStatus | 'all');
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
          {CUSTOMER_STATUSES.map((status) => (
            <option key={status} value={status}>{CUSTOMER_STATUS_MAP[status].label}</option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(event) => {
            setTierFilter(event.target.value as CustomerTier | 'all');
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
          <option value="all">全部等级</option>
          {CUSTOMER_TIERS.map((tier) => (
            <option key={tier} value={tier}>{CUSTOMER_TIER_MAP[tier].label}</option>
          ))}
        </select>

        <select
          value={industryFilter}
          onChange={(event) => {
            setIndustryFilter(event.target.value as CustomerIndustry | 'all');
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
          <option value="all">全部行业</option>
          {Object.entries(CUSTOMER_INDUSTRY_MAP).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条结果
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          {searchTerm || statusFilter !== 'all' || tierFilter !== 'all' || industryFilter !== 'all'
            ? '当前筛选条件下没有企业客户记录'
            : '当前快照暂无企业客户数据'}
        </div>
      )}

      {filtered.length > 0 ? (
        <DataTable columns={columns} rows={paged} rowKey={(customer: CustomerItem) => customer.id} />
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
