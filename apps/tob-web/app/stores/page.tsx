/**
 * stores/page.tsx — 门店管理列表页 (ToB 门店管理)
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
  MOCK_STORES,
  STORE_STATUS_MAP,
  REGIONS,
  type StoreItem,
  type StoreStatus,
  formatCurrency,
} from '../stores-data';

const STORES_PER_PAGE = 10;

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useMemo(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let items = MOCK_STORES;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof StoreItem)[] = ['storeName', 'storeCode', 'managerName', 'city', 'address'];
      items = items.filter((s) =>
        fields.some((f) => String(s[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((s) => s.status === statusFilter);
    }

    if (regionFilter !== 'all') {
      items = items.filter((s) => s.region === regionFilter);
    }

    return items;
  }, [searchTerm, statusFilter, regionFilter]);

  const paged = useMemo(() => {
    const start = page * STORES_PER_PAGE;
    return filtered.slice(start, start + STORES_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / STORES_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const total = MOCK_STORES.length;
    const active = MOCK_STORES.filter((s) => s.status === 'active').length;
    const totalRevenue = MOCK_STORES.reduce((s, c) => s + c.monthlyRevenue, 0);
    const totalTraffic = MOCK_STORES.reduce((s, c) => s + c.dailyTraffic, 0);
    return { total, active, totalRevenue, totalTraffic };
  }, []);

  const columns: DataTableColumn<StoreItem>[] = [
    {
      key: 'storeName',
      header: '门店名称',
      render: (item) => (
        <div>
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.storeName}</span>
          <div style={{ fontSize: 12, color: '#64748b' }}>{item.storeCode}</div>
        </div>
      ),
    },
    { key: 'city', header: '城市' },
    { key: 'managerName', header: '店长' },
    {
      key: 'employeeCount',
      header: '员工数',
      render: (item) => `${item.employeeCount}人`,
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = STORE_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'monthlyRevenue',
      header: '月营收',
      render: (item) =>
        item.status === 'active' ? (
          <span style={{ color: '#4ade80' }}>{formatCurrency(item.monthlyRevenue)}</span>
        ) : (
          <span style={{ color: '#64748b' }}>--</span>
        ),
    },
    {
      key: 'dailyTraffic',
      header: '日客流',
      render: (item) =>
        item.status === 'active' ? (
          <span>{item.dailyTraffic.toLocaleString()}人</span>
        ) : (
          <span style={{ color: '#64748b' }}>--</span>
        ),
    },
    {
      key: 'lastInspection',
      header: '最近巡检',
      render: (item) => item.lastInspection,
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>门店管理</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="总门店数" value={stats.total.toString()} />
        <StatCard label="营业中" value={stats.active.toString()} />
        <StatCard label="月总营收" value={formatCurrency(stats.totalRevenue)} />
        <StatCard label="日总客流" value={`${(stats.totalTraffic / 1000).toFixed(1)}K`} />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <SearchFilterInput
          placeholder="搜索门店名称/编号/店长..."
          value={searchTerm}
          onChange={(v) => { setSearchTerm(v); setPage(0); }}
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StoreStatus | 'all'); setPage(0); }}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
          }}
        >
          <option value="all">全部状态</option>
          {(['active', 'inactive', 'maintenance'] as const).map((s) => (
            <option key={s} value={s}>{STORE_STATUS_MAP[s].label}</option>
          ))}
        </select>

        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)', color: '#e2e8f0', fontSize: 14,
          }}
        >
          <option value="all">全部区域</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条结果
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <DataTable columns={columns} rows={paged} rowKey={(s: StoreItem) => s.id} />
      )}

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
