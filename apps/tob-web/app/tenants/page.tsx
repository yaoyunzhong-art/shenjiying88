/**
 * tenants/page.tsx — 租户管理列表页 (ToB 多租户管理)
 * 角色视角: 👔 超级管理员
 * 功能: 租户列表、搜索、筛选、统计
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
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
  MOCK_TENANTS,
  TENANT_STATUS_MAP,
  TENANT_STATUSES,
  PLAN_LABELS,
  PLAN_COLORS,
  formatNumber,
  type Tenant,
  type TenantStatus,
} from './tenants-data';

const TENANTS_PER_PAGE = 10;

export default function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let items = MOCK_TENANTS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof Tenant)[] = ['tenantName', 'tenantCode', 'contactPerson', 'city'];
      items = items.filter((t) =>
        fields.some((f) => String(t[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') items = items.filter((t) => t.status === statusFilter);

    return items;
  }, [searchTerm, statusFilter]);

  const paged = useMemo(() => {
    const start = page * TENANTS_PER_PAGE;
    return filtered.slice(start, start + TENANTS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / TENANTS_PER_PAGE);

  const stats = useMemo(() => {
    const active = MOCK_TENANTS.filter((t) => t.status === 'active').length;
    const trial = MOCK_TENANTS.filter((t) => t.status === 'trial').length;
    const totalStores = MOCK_TENANTS.reduce((s, t) => s + t.storeCount, 0);
    const totalMembers = MOCK_TENANTS.reduce((s, t) => s + t.memberCount, 0);
    return { total: MOCK_TENANTS.length, active, trial, totalStores, totalMembers };
  }, []);

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'tenantName',
      header: '租户名称',
      render: (item) => (
        <div>
          <Link
            href={`/tenants/${item.id}`}
            style={{ fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}
          >
            {item.tenantName}
          </Link>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
            {item.tenantCode}
          </div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: '联系人',
      render: (item) => (
        <div>
          <div style={{ fontSize: 13 }}>{item.contactPerson}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{item.contactPhone}</div>
        </div>
      ),
    },
    {
      key: 'region',
      header: '地区',
      render: (item) => (
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {item.region} · {item.city}
        </span>
      ),
    },
    {
      key: 'plan',
      header: '套餐',
      render: (item) => (
        <Badge
          variant="neutral"
          style={{ color: PLAN_COLORS[item.plan], borderColor: `${PLAN_COLORS[item.plan]}40` }}
        >
          {PLAN_LABELS[item.plan]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = TENANT_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'storeCount',
      header: '门店数',
      align: 'right',
      render: (item) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.storeCount}</span>,
    },
    {
      key: 'memberCount',
      header: '会员数',
      align: 'right',
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#4ade80' }}>
          {formatNumber(item.memberCount)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '创建日期',
      render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.createdAt}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Link
          href={`/tenants/${item.id}`}
          style={{
            fontSize: 13,
            color: '#60a5fa',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 4,
            background: 'rgba(96, 165, 250, 0.1)',
          }}
        >
          管理
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>租户管理</h1>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + 新建租户
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="租户总数" value={stats.total.toString()} />
        <StatCard label="已开通" value={stats.active.toString()} accent="#4ade80" />
        <StatCard label="试用中" value={stats.trial.toString()} accent="#fbbf24" />
        <StatCard label="总门店数" value={formatNumber(stats.totalStores)} />
        <StatCard label="总会员数" value={formatNumber(stats.totalMembers)} accent="#60a5fa" />
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <SearchFilterInput
          placeholder="搜索租户名称/编码/联系人..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TenantStatus | 'all');
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
          {TENANT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TENANT_STATUS_MAP[s].label}
            </option>
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
        <DataTable columns={columns} rows={paged} rowKey={(t: Tenant) => t.id} />
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
