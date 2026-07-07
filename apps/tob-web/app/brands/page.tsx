/**
 * brands/page.tsx — 品牌管理列表页 (ToB 品牌注册管理)
 * 角色视角: 👔 租户管理员 / 🏢 品牌经理
 * 功能: 品牌列表展示、搜索、状态/分类筛选、营收统计
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
  MOCK_BRANDS,
  BRAND_STATUS_MAP,
  BRAND_CATEGORY_MAP,
  BRAND_STATUSES,
  BRAND_CATEGORIES,
  formatRevenue,
  type BrandItem,
  type BrandStatus,
  type BrandCategory,
} from './brands-data';

const BRANDS_PER_PAGE = 10;

export default function BrandsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BrandStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BrandCategory | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // simulate data loading
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  // filtering
  const filtered = useMemo(() => {
    let items = MOCK_BRANDS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof BrandItem)[] = ['brandName', 'contactEmail', 'contactPhone', 'tenantCode'];
      items = items.filter((b) =>
        fields.some((f) => String(b[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') items = items.filter((b) => b.status === statusFilter);
    if (categoryFilter !== 'all') items = items.filter((b) => b.category === categoryFilter);

    return items;
  }, [searchTerm, statusFilter, categoryFilter]);

  const paged = useMemo(() => {
    const start = page * BRANDS_PER_PAGE;
    return filtered.slice(start, start + BRANDS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / BRANDS_PER_PAGE);

  // stats
  const stats = useMemo(() => {
    const active = MOCK_BRANDS.filter((b) => b.status === 'active').length;
    const totalRevenue = MOCK_BRANDS.reduce((s, b) => s + b.annualRevenue, 0);
    const totalStores = MOCK_BRANDS.reduce((s, b) => s + b.storeCount, 0);
    const pending = MOCK_BRANDS.filter((b) => b.status === 'pending_review').length;
    return { total: MOCK_BRANDS.length, active, totalRevenue, totalStores, pending };
  }, []);

  const columns: DataTableColumn<BrandItem>[] = [
    {
      key: 'brandName',
      header: '品牌名称',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.brandName}</span>
      ),
    },
    { key: 'tenantCode', header: '租户编码' },
    {
      key: 'category',
      header: '行业分类',
      render: (item) => {
        const info = BRAND_CATEGORY_MAP[item.category];
        return <Badge variant="neutral">{info.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = BRAND_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'storeCount',
      header: '门店数',
      render: (item) => String(item.storeCount),
    },
    {
      key: 'annualRevenue',
      header: '年营收',
      render: (item) => formatRevenue(item.annualRevenue),
    },
    {
      key: 'employeeCount',
      header: '员工数',
      render: (item) => String(item.employeeCount),
    },
    {
      key: 'registeredAt',
      header: '注册日期',
      render: (item) => item.registeredAt,
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>品牌管理</h1>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="品牌总数" value={stats.total.toString()} />
        <StatCard label="已开通" value={stats.active.toString()} />
        <StatCard label="审核中" value={stats.pending.toString()} />
        <StatCard label="总门店数" value={stats.totalStores.toString()} />
        <StatCard label="总年营收" value={formatRevenue(stats.totalRevenue)} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchFilterInput
          placeholder="搜索品牌/联系人/租户..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BrandStatus | 'all');
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
          {BRAND_STATUSES.map((s) => (
            <option key={s} value={s}>{BRAND_STATUS_MAP[s].label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as BrandCategory | 'all');
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
          {BRAND_CATEGORIES.map((c) => (
            <option key={c} value={c}>{BRAND_CATEGORY_MAP[c].label}</option>
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
        <DataTable columns={columns} rows={paged} rowKey={(b: BrandItem) => b.id} />
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
