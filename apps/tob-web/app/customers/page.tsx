/**
 * customers/page.tsx — 企业客户列表页 (ToB 客户管理)
 */
'use client';

import React, { useMemo, useState } from 'react';
import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  Pagination,
  StatCard,
  LoadingSkeleton,
} from '@m5/ui';

import type { DataTableColumn } from '@m5/ui';
import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  type CustomerItem,
  type CustomerStatus,
  type CustomerTier,
  type CustomerIndustry,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
} from '../customers-data';

const CUSTOMERS_PER_PAGE = 10;

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<CustomerTier | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<CustomerIndustry | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // simulate data loading
  useMemo(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let items = MOCK_CUSTOMERS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof CustomerItem)[] = ['companyName', 'contactName', 'contactEmail', 'city'];
      items = items.filter((c) =>
        fields.some((f) => String(c[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((c) => c.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      items = items.filter((c) => c.tier === tierFilter);
    }

    if (industryFilter !== 'all') {
      items = items.filter((c) => c.industry === industryFilter);
    }

    return items;
  }, [searchTerm, statusFilter, tierFilter, industryFilter]);

  const paged = useMemo(() => {
    const start = page * CUSTOMERS_PER_PAGE;
    return filtered.slice(start, start + CUSTOMERS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / CUSTOMERS_PER_PAGE);

  // stats
  const stats = useMemo(() => {
    const active = MOCK_CUSTOMERS.filter((c) => c.status === 'active').length;
    const totalMonthly = MOCK_CUSTOMERS.reduce((s, c) => s + c.monthlySpend, 0);
    const platinum = MOCK_CUSTOMERS.filter((c) => c.tier === 'platinum').length;
    return { total: MOCK_CUSTOMERS.length, active, totalMonthly, platinum };
  }, []);

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
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>企业客户管理</h1>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="总客户数"
          value={stats.total.toString()}
        />
        <StatCard
          label="合作中客户"
          value={stats.active.toString()}
        />
        <StatCard
          label="月均消费总额"
          value={formatCurrency(stats.totalMonthly)}
        />
        <StatCard
          label="铂金客户"
          value={stats.platinum.toString()}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchFilterInput
          placeholder="搜索公司/联系人/城市..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as CustomerStatus | 'all');
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
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s} value={s}>{CUSTOMER_STATUS_MAP[s].label}</option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as CustomerTier | 'all');
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
          {CUSTOMER_TIERS.map((t) => (
            <option key={t} value={t}>{CUSTOMER_TIER_MAP[t].label}</option>
          ))}
        </select>

        <select
          value={industryFilter}
          onChange={(e) => {
            setIndustryFilter(e.target.value as CustomerIndustry | 'all');
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
          {Object.entries(CUSTOMER_INDUSTRY_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条结果
        </span>
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          暂无数据
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length > 0 ? (
        <DataTable columns={columns} rows={paged} rowKey={(c: CustomerItem) => c.id} />
      ) : null}

      {/* Pagination */}
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
