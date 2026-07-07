/**
 * SuppliersPage — ToB 供应商管理列表页组件
 * 角色视角: 👔品牌运营 / 💳采购经理
 * 功能: 搜索、品类筛选、状态筛选、分页
 */
'use client';

import React, { useMemo, useState } from 'react';

import {
  Badge,
  DataTable,
  EmptyState,
  PageShell,
  Pagination,
  SearchFilterInput,
  type BadgeVariant,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  formatCurrency,
  type SupplierItem,
  type SupplierCategory,
  type SupplierStatus,
} from '../../suppliers-data';

/* ── 样式映射 ── */

const CATEGORY_VARIANTS: Record<SupplierCategory, BadgeVariant> = {
  '护肤品': 'info',
  '彩妆': 'warning',
  '香水': 'neutral',
  '包装材料': 'success',
  '美妆工具': 'warning',
  '原料': 'success',
};

/* ── 列配置 ── */

const SUPPLIER_COLUMNS: DataTableColumn<SupplierItem>[] = [
  { key: 'code', header: '编号', width: '120px' },
  { key: 'name', header: '供应商名称', width: '240px' },
  { key: 'contactPerson', header: '联系人', width: '120px' },
  { key: 'phone', header: '联系电话', width: '140px' },
  { key: 'category', header: '品类', width: '100px', render: (row) => <Badge variant={CATEGORY_VARIANTS[row.category]}>{SUPPLIER_CATEGORY_MAP[row.category]}</Badge> },
  {
    key: 'status',
    header: '状态',
    width: '100px',
    render: (row) => {
      const s = SUPPLIER_STATUS_MAP[row.status];
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  { key: 'totalProducts', header: '供应品数', width: '100px', render: (row) => `${row.totalProducts} 种` },
  { key: 'totalAmount', header: '累计金额', width: '140px', render: (row) => formatCurrency(row.totalAmount) },
  { key: 'updatedAt', header: '最后更新', width: '160px' },
];

/* ── 页面组件 ── */

interface SuppliersPageProps {
  items: SupplierItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function SuppliersPage({ items, total, page: initialPage, pageSize }: SuppliersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SupplierCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');
  const [page, setPage] = useState(initialPage);

  /* ── 过滤 ── */
  const filtered = useMemo(() => {
    let list = items;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.code.toLowerCase().includes(lower) ||
          s.contactPerson.toLowerCase().includes(lower) ||
          s.phone.includes(lower)
      );
    }

    if (categoryFilter !== 'all') {
      list = list.filter((s) => s.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    return list;
  }, [items, searchTerm, categoryFilter, statusFilter]);

  /* ── 分页 ── */
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  /* ── 统计卡片 ── */
  const totalAmount = useMemo(() => items.reduce((sum, s) => sum + s.totalAmount, 0), [items]);
  const activeCount = useMemo(() => items.filter((s) => s.status === 'active').length, [items]);
  const pendingCount = useMemo(() => items.filter((s) => s.status === 'pending').length, [items]);

  return (
    <PageShell
      title="供应商管理"
      subtitle={`共 ${items.length} 家供应商 · 累计采购额 ${formatCurrency(totalAmount)}`}
      actions={
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-card">
            <div className="stat-label">合作中</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{activeCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">待审核</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
          </div>
        </div>
      }
    >
      {/* ── 工具栏 ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput
          placeholder="搜索编号 / 名称 / 联系人 …"
          value={searchTerm}
          onChange={setSearchTerm}
          width={280}
        />

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value as SupplierCategory | 'all'); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.3)',
            background: 'rgba(15,23,42,0.4)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部品类</option>
          {SUPPLIER_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as SupplierStatus | 'all'); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.3)',
            background: 'rgba(15,23,42,0.4)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部状态</option>
          {SUPPLIER_STATUSES.map((s) => (
            <option key={s} value={s}>{SUPPLIER_STATUS_MAP[s].label}</option>
          ))}
        </select>
      </div>

      {/* ── 空状态 / 列表 ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="无匹配供应商"
          description="请调整搜索条件或筛选器"
          icon="search"
        />
      ) : (
        <>
          <DataTable columns={SUPPLIER_COLUMNS} data={paged} rowKey={(r) => r.id} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              显示 {filtered.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} / 共 {filtered.length} 条
            </span>
            <Pagination page={page} total={pageCount} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ── 内联样式 ── */}
      <style jsx>{`
        .stat-card {
          background: rgba(15, 23, 42, 0.38);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 12px;
          padding: 10px 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
        }
      `}</style>
    </PageShell>
  );
}
