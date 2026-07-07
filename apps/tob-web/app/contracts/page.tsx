/**
 * contracts/page.tsx — 合同管理列表页 (ToB 合同管理)
 */
'use client';

import React, { useMemo, useState } from 'react';
import {
  DataTable,
  StatusBadge,
  SearchFilterInput,
  Pagination,
  StatCard,
  LoadingSkeleton,
} from '@m5/ui';

import type { DataTableColumn } from '@m5/ui';
import {
  MOCK_CONTRACTS,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  fmtAmount,
  daysUntil,
  type ContractItem,
  type ContractStatus,
  type ContractType,
} from '../contracts-data';

const ITEMS_PER_PAGE = 10;

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // simulate loading flash
  useMemo(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  // ---- filter ----
  const filtered = useMemo(() => {
    let items = MOCK_CONTRACTS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof ContractItem)[] = ['title', 'contractNo', 'companyName', 'signatory'];
      items = items.filter((c) =>
        fields.some((f) => String(c[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((c) => c.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      items = items.filter((c) => c.type === typeFilter);
    }

    // sort: active / expiring_soon first, then by updatedAt desc
    const priorityOrder: Record<string, number> = {
      active: 0,
      expiring_soon: 1,
      pending_approval: 2,
      draft: 3,
      suspended: 4,
      terminated: 5,
    };
    items.sort((a, b) => {
      const pa = priorityOrder[a.status] ?? 99;
      const pb = priorityOrder[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return items;
  }, [searchTerm, statusFilter, typeFilter]);

  const paged = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // ---- stats ----
  const stats = useMemo(() => {
    const active = MOCK_CONTRACTS.filter((c) => c.status === 'active').length;
    const totalAmount = MOCK_CONTRACTS.reduce((s, c) => s + c.amount, 0);
    const totalPaid = MOCK_CONTRACTS.reduce((s, c) => s + c.paid, 0);
    const expiring = MOCK_CONTRACTS.filter(
      (c) => c.status === 'expiring_soon',
    ).length;
    return {
      total: MOCK_CONTRACTS.length,
      active,
      totalAmount,
      totalPaid,
      expiring,
    };
  }, []);

  // ---- columns ----
  const columns: DataTableColumn<ContractItem>[] = [
    {
      key: 'contractNo',
      header: '合同编号',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>
          {item.contractNo}
        </span>
      ),
    },
    {
      key: 'title',
      header: '合同名称',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: 13 }}>
            {item.title}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {item.companyName}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {CONTRACT_TYPE_MAP[item.type]}
        </span>
      ),
    },
    {
      key: 'amount',
      header: '合同金额',
      render: (item) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
            {fmtAmount(item.amount)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: item.paid >= item.amount ? '#4ade80' : '#64748b',
            }}
          >
            已付 {((item.paid / item.amount) * 100).toFixed(0)}%
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = CONTRACT_STATUS_MAP[item.status];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StatusBadge label={info.label} variant={info.variant} size="sm" />
            {item.status === 'expiring_soon' && (
              <span
                style={{
                  fontSize: 10,
                  color: '#fbbf24',
                  background: 'rgba(251,191,36,0.1)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                剩 {Math.max(0, daysUntil(item.endDate))} 天
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'endDate',
      header: '截止日期',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.endDate}</span>
      ),
    },
    {
      key: 'signatory',
      header: '签约人',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.signatory}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        合同管理
      </h1>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="合同总数" value={stats.total.toString()} />
        <StatCard label="执行中" value={stats.active.toString()} />
        <StatCard
          label="合同总金额"
          value={fmtAmount(stats.totalAmount)}
        />
        <StatCard
          label="即将到期"
          value={stats.expiring.toString()}
          variant={stats.expiring > 0 ? 'warning' : 'default'}
        />
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
          placeholder="搜索合同编号/名称/公司/签约人..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ContractStatus | 'all');
            setPage(0);
          }}
          style={selectStyle}
        >
          <option value="all">全部状态</option>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTRACT_STATUS_MAP[s].label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as ContractType | 'all');
            setPage(0);
          }}
          style={selectStyle}
        >
          <option value="all">全部类型</option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTRACT_TYPE_MAP[t]}
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
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(c: ContractItem) => c.id}
        />
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

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
};
