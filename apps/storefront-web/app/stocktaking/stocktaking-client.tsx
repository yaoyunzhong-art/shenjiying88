'use client';

import React, { useMemo, useState } from 'react';
import {
  PageShell,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  PaginatedDataTableCard,
  DataTableColumn,
} from '@m5/ui';
import type { StocktakingRecord, StocktakingStatus } from './page';

// ============================================================
// 状态标签样式映射
// ============================================================

const STATUS_CONFIG: Record<StocktakingStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  in_progress: { label: '盘点中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
};

// ============================================================
// 统计卡片数据
// ============================================================

interface StocktakingStats {
  total: number;
  inProgress: number;
  completed: number;
  totalDiscrepancy: number;
}

function computeStats(records: StocktakingRecord[]): StocktakingStats {
  return {
    total: records.length,
    inProgress: records.filter((r) => r.status === 'in_progress').length,
    completed: records.filter((r) => r.status === 'completed').length,
    totalDiscrepancy: records.reduce((sum, r) => sum + r.discrepancyCount, 0),
  };
}

// ============================================================
// 表格列定义
// ============================================================

const COLUMNS: DataTableColumn<StocktakingRecord>[] = [
  { key: 'batchNo', header: '盘点批次号', sortable: true },
  { key: 'storeName', header: '门店', sortable: true },
  { key: 'initiator', header: '盘点人', sortable: true },
  {
    key: 'progress',
    header: '进度',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#cbd5e1' }}>
        {row.checkedItems}/{row.totalItems}
        {row.discrepancyCount > 0 && (
          <span style={{ marginLeft: 8, color: '#fbbf24', fontSize: 12 }}>
            (差异{row.discrepancyCount})
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (row) => {
      const cfg = STATUS_CONFIG[row.status];
      return (
        <StatusBadge label={cfg.label} variant={cfg.variant} />
      );
    },
  },
  { key: 'createdAt', header: '创建时间', sortable: true },
  {
    key: 'actions',
    header: '操作',
    render: (row) => (
      <a
        href={`/stocktaking/${row.id}`}
        style={{
          fontSize: 13,
          color: '#60a5fa',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {row.status === 'draft' ? '开始盘点' : '查看详情'}
      </a>
    ),
  },
];

// ============================================================
// 搜索+分页 Hook
// ============================================================

function useStocktakingList(
  records: StocktakingRecord[],
  pageSize: number = 10,
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StocktakingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = records;

    // 搜索
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.batchNo.toLowerCase().includes(q) ||
          r.storeName.toLowerCase().includes(q) ||
          r.initiator.toLowerCase().includes(q),
      );
    }

    // 状态筛选
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [records, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page: safePage,
    setPage,
    filtered,
    paged,
    totalPages,
  };
}

// ============================================================
// 主页面组件
// ============================================================

interface StocktakingPageClientProps {
  records: StocktakingRecord[];
  total: number;
}

export function StocktakingPageClient({ records }: StocktakingPageClientProps) {
  const stats = useMemo(() => computeStats(records), [records]);
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    filtered,
    paged,
    totalPages,
  } = useStocktakingList(records);

  return (
    <PageShell
      title="库存盘点"
      description="管理门店库存盘点任务，跟踪盘点进度与差异"
      actions={
        <a
          href="/stocktaking/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          + 新建盘点
        </a>
      }
    >
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="总盘点单" value={stats.total} />
        <StatCard label="盘点中" value={stats.inProgress} variant="info" />
        <StatCard label="已完成" value={stats.completed} variant="success" />
        <StatCard label="累计差异" value={stats.totalDiscrepancy} variant="warning" />
      </div>

      {/* 搜索 & 筛选条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              setPage(1);
            }}
            placeholder="搜索批次号 / 门店 / 盘点人..."
          />
        </div>

        {/* 状态快速筛选 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'draft', 'in_progress', 'completed', 'cancelled'] as const).map((s) => {
            const label = s === 'ALL' ? '全部' : STATUS_CONFIG[s].label;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  border: active
                    ? '1px solid rgba(96,165,250,0.4)'
                    : '1px solid rgba(148,163,184,0.15)',
                  background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
                  color: active ? '#93c5fd' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
                {s !== 'ALL' && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>
                    ({records.filter((r) => r.status === s).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 表格 */}
      <PaginatedDataTableCard
        columns={COLUMNS}
        rows={paged}
        rowKey={(r) => r.id}
        pagination={{
          page,
          totalPages,
          total: filtered.length,
          onPageChange: setPage,
        }}
        emptyTitle="暂无盘点记录"
        emptyDescription="点击上方「新建盘点」创建第一条盘点任务"
      />

      {/* 说明 */}
      <div
        style={{
          marginTop: 16,
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(96,165,250,0.06)',
          fontSize: 12,
          color: '#64748b',
          lineHeight: 1.6,
        }}
      >
        💡 提示：盘点差异超过 3 项时建议二次复核。完成盘点后系统会自动生成差异报告。
      </div>
    </PageShell>
  );
}
