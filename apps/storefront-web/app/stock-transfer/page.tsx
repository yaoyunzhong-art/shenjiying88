/**
 * 库存调拨列表页 — Stock Transfer List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 * 功能: 搜索、状态筛选、类型筛选、分页浏览调拨单
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  PageShell,
  SearchFilterInput,
  useSearchFilter,
  DataTable,
  StatusBadge,
  Button,
  Pagination,
  usePagination,
  EmptyState,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface StockTransfer {
  id: string;
  transferNo: string;
  type: TransferType;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  itemsCount: number;
  totalQuantity: number;
  applicant: string;
  approver: string;
  reason: string;
  appliedAt: string;
  completedAt: string | null;
  createdAt: string;
}

const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  in_transit: '调拨中',
  completed: '已完成',
  cancelled: '已取消',
};

const TRANSFER_STATUS_VARIANTS: Record<TransferStatus, 'warning' | 'pending' | 'success' | 'info' | 'default' | 'neutral'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  in_transit: 'pending',
  completed: 'success',
  cancelled: 'default',
};

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇉门店',
  warehouse_to_store: '仓库⇉门店',
  store_to_warehouse: '门店⇉仓库',
};

const ALL_TYPES: TransferType[] = ['store_to_store', 'warehouse_to_store', 'store_to_warehouse'];
const ALL_STATUSES: TransferStatus[] = ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'];

// ---- Mock 数据 ----

const MOCK_TRANSFERS: StockTransfer[] = [
  { id: '1', transferNo: 'DB-20260628-001', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '旗舰店(天河城)', status: 'in_transit', itemsCount: 8, totalQuantity: 120, applicant: '张经理', approver: '陈主管', reason: '门店补货-洁面系列', appliedAt: '2026-06-28 08:30', completedAt: null, createdAt: '2026-06-28 08:30' },
  { id: '2', transferNo: 'DB-20260628-002', type: 'store_to_store', fromLocation: '旗舰店(天河城)', toLocation: '分店(体育西)', status: 'pending', itemsCount: 3, totalQuantity: 15, applicant: '李店长', approver: '', reason: '调拨热销口红品', appliedAt: '2026-06-28 09:00', completedAt: null, createdAt: '2026-06-28 09:00' },
  { id: '3', transferNo: 'DB-20260627-003', type: 'store_to_warehouse', fromLocation: '分店(体育西)', toLocation: '中央仓库', status: 'completed', itemsCount: 5, totalQuantity: 48, applicant: '王店长', approver: '陈主管', reason: '临期品退回', appliedAt: '2026-06-27 14:00', completedAt: '2026-06-27 16:30', createdAt: '2026-06-27 14:00' },
  { id: '4', transferNo: 'DB-20260627-004', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '分店(体育西)', status: 'approved', itemsCount: 12, totalQuantity: 200, applicant: '刘主管', approver: '陈主管', reason: '新品铺货-防晒系列', appliedAt: '2026-06-27 10:00', completedAt: null, createdAt: '2026-06-27 10:00' },
  { id: '5', transferNo: 'DB-20260626-005', type: 'store_to_store', fromLocation: '旗舰店(天河城)', toLocation: '精品店(太古汇)', status: 'completed', itemsCount: 2, totalQuantity: 6, applicant: '李店长', approver: '陈主管', reason: 'VIP预定取货调拨', appliedAt: '2026-06-26 11:00', completedAt: '2026-06-26 13:00', createdAt: '2026-06-26 11:00' },
  { id: '6', transferNo: 'DB-20260626-006', type: 'store_to_warehouse', fromLocation: '精品店(太古汇)', toLocation: '中央仓库', status: 'cancelled', itemsCount: 4, totalQuantity: 35, applicant: '赵店长', approver: '', reason: '季节性商品退仓', appliedAt: '2026-06-26 09:30', completedAt: null, createdAt: '2026-06-26 09:30' },
  { id: '7', transferNo: 'DB-20260625-007', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '旗舰店(天河城)', status: 'draft', itemsCount: 6, totalQuantity: 90, applicant: '张经理', approver: '', reason: '月度补货计划', appliedAt: '2026-06-25 16:00', completedAt: null, createdAt: '2026-06-25 16:00' },
  { id: '8', transferNo: 'DB-20260625-008', type: 'store_to_store', fromLocation: '分店(体育西)', toLocation: '精品店(太古汇)', status: 'in_transit', itemsCount: 1, totalQuantity: 10, applicant: '王店长', approver: '陈主管', reason: '调拨爆款面膜', appliedAt: '2026-06-25 15:00', completedAt: null, createdAt: '2026-06-25 15:00' },
  { id: '9', transferNo: 'DB-20260624-009', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '精品店(太古汇)', status: 'completed', itemsCount: 10, totalQuantity: 180, applicant: '刘主管', approver: '陈主管', reason: '店内陈列更新', appliedAt: '2026-06-24 10:00', completedAt: '2026-06-24 14:20', createdAt: '2026-06-24 10:00' },
  { id: '10', transferNo: 'DB-20260624-010', type: 'store_to_store', fromLocation: '精品店(太古汇)', toLocation: '分店(体育西)', status: 'completed', itemsCount: 3, totalQuantity: 24, applicant: '赵店长', approver: '陈主管', reason: '会员活动特别调拨', appliedAt: '2026-06-24 09:00', completedAt: '2026-06-24 11:00', createdAt: '2026-06-24 09:00' },
];

// ---- Helpers ----

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ---- 列定义 ----

const COLUMNS: DataTableColumn<StockTransfer>[] = [
  { key: 'transferNo', header: '调拨单号', sortable: true },
  {
    key: 'type',
    header: '类型',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{TRANSFER_TYPE_LABELS[row.type]}</span>
    ),
  },
  { key: 'fromLocation', header: '调出地', sortable: true },
  { key: 'toLocation', header: '调入地', sortable: true },
  {
    key: 'totalQuantity',
    header: '数量',
    sortable: true,
    render: (row) => <span style={{ fontWeight: 600 }}>{row.totalQuantity}</span>,
  },
  {
    key: 'status',
    header: '状态',
    render: (row) => (
      <StatusBadge variant={TRANSFER_STATUS_VARIANTS[row.status]} label={TRANSFER_STATUS_LABELS[row.status]} />
    ),
  },
  { key: 'applicant', header: '申请人' },
  {
    key: 'appliedAt',
    header: '申请时间',
    sortable: true,
    render: (row) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{formatDate(row.appliedAt)}</span>,
  },
];

// ---- 页面组件 ----

export default function StockTransferListPage(): React.ReactElement {
  const [typeFilter, setTypeFilter] = useState<TransferType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const search = useSearchFilter() as { value: string; debouncedValue: string; setValue: (v: string) => void };
  const pagination = usePagination({ initialPageSize: 8 });

  const filtered = useMemo(() => {
    const items = MOCK_TRANSFERS;
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search.debouncedValue) {
        const q = search.debouncedValue.toLowerCase();
        return (
          item.transferNo.toLowerCase().includes(q) ||
          item.fromLocation.toLowerCase().includes(q) ||
          item.toLocation.toLowerCase().includes(q) ||
          item.applicant.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, (search as { debouncedValue: string }).debouncedValue]);

  const paginated = useMemo(
    () => filtered.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize),
    [filtered, pagination.page, pagination.pageSize] as const,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));

  return (
    <PageShell
      title="库存调拨管理"
      description="查看和管理门店之间的库存调拨单据。"
    >
      {/* ---- 页面标题 ---- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📦 库存调拨</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            管理门店间、仓库与门店之间的商品调拨 · 共 {filtered.length} 条记录
          </p>
        </div>
        <Link href="/stock-transfer/new" style={{ textDecoration: 'none' }}>
          <Button variant="primary">新建调拨单</Button>
        </Link>
      </div>

      {/* ---- 搜索 & 筛选 ---- */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ width: 240 }}>
          <SearchFilterInput
            placeholder="搜索单号/地点/申请人..."
            value={search.value}
            onChange={search.setValue}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', ...ALL_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: typeFilter === t ? '1px solid #6366f1' : '1px solid rgba(148,163,184,0.2)',
                background: typeFilter === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: typeFilter === t ? '#a5b4fc' : '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {t === 'all' ? '全部类型' : TRANSFER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: statusFilter === s ? '1px solid #6366f1' : '1px solid rgba(148,163,184,0.2)',
                background: statusFilter === s ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: statusFilter === s ? '#a5b4fc' : '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {s === 'all' ? '全部状态' : TRANSFER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ---- 统计摘要 ---- */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: '待审批', value: MOCK_TRANSFERS.filter(i => i.status === 'pending').length, color: '#f59e0b' },
          { label: '调拨中', value: MOCK_TRANSFERS.filter(i => i.status === 'in_transit').length, color: '#60a5fa' },
          { label: '本月已完成', value: MOCK_TRANSFERS.filter(i => i.status === 'completed').length, color: '#4ade80' },
          { label: '总调拨量', value: MOCK_TRANSFERS.reduce((s, i) => s + i.totalQuantity, 0), color: '#a78bfa', unit: '件' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: 10,
              padding: '10px 18px',
              background: 'rgba(15,23,42,0.3)',
              border: '1px solid rgba(148,163,184,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>
              {stat.value}
              {stat.unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>{stat.unit}</span>}
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ---- 数据表格 ---- */}
      {paginated.length > 0 ? (
        <DataTable columns={COLUMNS} rows={paginated} rowKey={(r) => r.id} />
      ) : (
        <EmptyState
          title="没有匹配的调拨单"
          description={search.debouncedValue ? '尝试修改搜索条件' : '暂无调拨记录'}
        />
      )}

      {/* ---- 分页 ---- */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            total={filtered.length}
            onPageChange={(p: number) => pagination.setPage(p)}
          />
        </div>
      )}
    </PageShell>
  );
}
