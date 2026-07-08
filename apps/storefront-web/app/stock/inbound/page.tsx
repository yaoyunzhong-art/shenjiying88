/**
 * stock/inbound/page.tsx — 入库接收列表页 (Next.js App Router Page)
 * 角色视角: 🏭库房管理员
 * 类型: B-页面创建
 * 功能: 入库单列表 / 搜索 / 状态筛选 / 分页 / 导航到详情
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  PageShell,
  SearchFilterInput,
  FilterChips,
  FilterBar,
  PaginatedDataTableCard,
  QuickStats,
  type DataTableColumn,
  type QuickStatItem,
} from '@m5/ui';

// ── 类型 ──

type InboundListStatus = 'pending' | 'inspecting' | 'shelving' | 'completed' | 'cancelled';

interface InboundOrder {
  id: string;
  orderNo: string;
  poNo: string;
  supplier: string;
  status: InboundListStatus;
  totalExpected: number;
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  itemCount: number;
  operator: string;
  createdAt: string;
  expectedAt: string;
  notes?: string;
}

// ── Mock 数据 ──

const MOCK_ORDERS: InboundOrder[] = [
  {
    id: 'INB001', orderNo: 'IN-2024-001', poNo: 'PO-2024-0689',
    supplier: '云南咖啡基地', status: 'inspecting',
    totalExpected: 800, totalInspected: 510, totalPassed: 495, totalFailed: 15,
    itemCount: 5, operator: '张三', createdAt: '2024-06-30 09:00', expectedAt: '2024-06-30 14:00',
    notes: '抹茶粉包装破损需退回',
  },
  {
    id: 'INB002', orderNo: 'IN-2024-002', poNo: 'PO-2024-0690',
    supplier: '广州日化工厂', status: 'pending',
    totalExpected: 1200, totalInspected: 0, totalPassed: 0, totalFailed: 0,
    itemCount: 8, operator: '李四', createdAt: '2024-07-01 10:30', expectedAt: '2024-07-01 16:00',
  },
  {
    id: 'INB003', orderNo: 'IN-2024-003', poNo: 'PO-2024-0691',
    supplier: '山东粮油供应商', status: 'shelving',
    totalExpected: 500, totalInspected: 500, totalPassed: 490, totalFailed: 10,
    itemCount: 3, operator: '王五', createdAt: '2024-07-02 08:00', expectedAt: '2024-07-02 13:00',
    notes: '部分商品需优先上架',
  },
  {
    id: 'INB004', orderNo: 'IN-2024-004', poNo: 'PO-2024-0692',
    supplier: '深圳电子配件商', status: 'completed',
    totalExpected: 3000, totalInspected: 3000, totalPassed: 2950, totalFailed: 50,
    itemCount: 12, operator: '赵六', createdAt: '2024-06-28 14:00', expectedAt: '2024-06-28 18:00',
  },
  {
    id: 'INB005', orderNo: 'IN-2024-005', poNo: 'PO-2024-0693',
    supplier: '北京食品公司', status: 'pending',
    totalExpected: 600, totalInspected: 0, totalPassed: 0, totalFailed: 0,
    itemCount: 4, operator: '钱七', createdAt: '2024-07-03 11:00', expectedAt: '2024-07-03 15:30',
  },
  {
    id: 'INB006', orderNo: 'IN-2024-006', poNo: 'PO-2024-0694',
    supplier: '上海包装材料厂', status: 'inspecting',
    totalExpected: 1500, totalInspected: 750, totalPassed: 720, totalFailed: 30,
    itemCount: 6, operator: '孙八', createdAt: '2024-07-03 09:00', expectedAt: '2024-07-03 17:00',
  },
  {
    id: 'INB007', orderNo: 'IN-2024-007', poNo: 'PO-2024-0695',
    supplier: '苏州纺织厂', status: 'cancelled',
    totalExpected: 400, totalInspected: 0, totalPassed: 0, totalFailed: 0,
    itemCount: 2, operator: '周九', createdAt: '2024-06-25 08:00', expectedAt: '2024-06-25 14:00',
    notes: '供应商取消订单',
  },
  {
    id: 'INB008', orderNo: 'IN-2024-008', poNo: 'PO-2024-0696',
    supplier: '成都农产品基地', status: 'completed',
    totalExpected: 900, totalInspected: 900, totalPassed: 890, totalFailed: 10,
    itemCount: 7, operator: '吴十', createdAt: '2024-07-01 07:00', expectedAt: '2024-07-01 12:00',
  },
  {
    id: 'INB009', orderNo: 'IN-2024-009', poNo: 'PO-2024-0697',
    supplier: '武汉日用品商行', status: 'shelving',
    totalExpected: 2000, totalInspected: 2000, totalPassed: 1960, totalFailed: 40,
    itemCount: 10, operator: '张三', createdAt: '2024-07-02 10:00', expectedAt: '2024-07-02 16:00',
    notes: '注意核对保质期',
  },
  {
    id: 'INB010', orderNo: 'IN-2024-010', poNo: 'PO-2024-0698',
    supplier: '杭州茶业公司', status: 'pending',
    totalExpected: 350, totalInspected: 0, totalPassed: 0, totalFailed: 0,
    itemCount: 3, operator: '李四', createdAt: '2024-07-04 09:30', expectedAt: '2024-07-04 14:00',
  },
];

// ── 状态映射 ──

const STATUS_LABELS: Record<InboundListStatus, string> = {
  pending: '待验收',
  inspecting: '质检中',
  shelving: '上架中',
  completed: '已完成',
  cancelled: '已取消',
};

function statusBadgeColor(s: InboundListStatus): string {
  switch (s) {
    case 'pending': return '#f1f5f9';
    case 'inspecting': return '#dbeafe';
    case 'shelving': return '#fef3c7';
    case 'completed': return '#dcfce7';
    case 'cancelled': return '#f3f4f6';
  }
}

function statusBadgeTextColor(s: InboundListStatus): string {
  switch (s) {
    case 'pending': return '#64748b';
    case 'inspecting': return '#1e40af';
    case 'shelving': return '#92400e';
    case 'completed': return '#166534';
    case 'cancelled': return '#6b7280';
  }
}

// ── 页面组件 ──

export default function InboundListPage() {
  const router = useRouter();

  /* 搜索 & 筛选 */
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<InboundListStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* 过滤 */
  const filtered = useMemo(() => {
    let list = MOCK_ORDERS;
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(kw) ||
          o.poNo.toLowerCase().includes(kw) ||
          o.supplier.toLowerCase().includes(kw) ||
          o.operator.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [searchKeyword, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* 统计 */
  const stats = useMemo(() => {
    const all = MOCK_ORDERS;
    return {
      total: all.length,
      pending: all.filter((o) => o.status === 'pending').length,
      inProgress: all.filter((o) => o.status === 'inspecting' || o.status === 'shelving').length,
      completed: all.filter((o) => o.status === 'completed').length,
    };
  }, []);

  /* 状态筛选选项 */
  const statusOptions = [
    { value: 'all' as const, label: '全部' },
    { value: 'pending' as const, label: '待验收' },
    { value: 'inspecting' as const, label: '质检中' },
    { value: 'shelving' as const, label: '上架中' },
    { value: 'completed' as const, label: '已完成' },
    { value: 'cancelled' as const, label: '已取消' },
  ];

  /* 列定义 */
  const columns: DataTableColumn<InboundOrder>[] = [
    {
      key: 'orderNo',
      header: '入库单号',
      render: (row) => (
        <a
          href={`/stock/inbound/${row.id}`}
          onClick={(e) => {
            e.preventDefault();
            router.push(`/stock/inbound/${row.id}`);
          }}
          style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
        >
          {row.orderNo}
        </a>
      ),
    },
    { key: 'supplier', header: '供应商' },
    {
      key: 'status',
      header: '状态',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            background: statusBadgeColor(row.status),
            color: statusBadgeTextColor(row.status),
          }}
        >
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'totalExpected',
      header: '总数',
      render: (row) => `${row.totalExpected.toLocaleString()}`,
    },
    {
      key: 'totalInspected',
      header: '已检',
      render: (row) => `${row.totalInspected.toLocaleString()}`,
    },
    {
      key: 'totalPassed',
      header: '合格',
      render: (row) => `${row.totalPassed.toLocaleString()}`,
    },
    {
      key: 'totalFailed',
      header: '不合格',
      render: (row) => (
        <span style={{ color: row.totalFailed > 0 ? '#dc2626' : 'inherit' }}>
          {row.totalFailed.toLocaleString()}
        </span>
      ),
    },
    { key: 'operator', header: '操作人' },
    { key: 'createdAt', header: '创建时间' },
  ];

  /* 行点击 */
  const handleRowClick = (row: InboundOrder) => {
    router.push(`/stock/inbound/${row.id}`);
  };

  /* FilterBar chips builder */
  const filterBarChips = useMemo(() => {
    if (statusFilter === 'all') return [];
    const label = statusOptions.find((o) => o.value === statusFilter)?.label ?? statusFilter;
    return [{
      key: 'status',
      label,
      active: true,
      onClick: () => { setStatusFilter('all'); setPage(1); },
    }];
  }, [statusFilter, statusOptions]);

  /* FilterChips items builder */
  const filterChipsItems = useMemo(() => statusOptions
    .filter((o) => o.value !== 'all')
    .map((o) => ({
      key: o.value,
      label: o.label,
      tone: statusFilter === o.value
        ? (o.value === 'completed' ? 'success' as const : o.value === 'cancelled' ? 'danger' as const : 'neutral' as const)
        : 'neutral' as const,
    })), [statusFilter, statusOptions]);

  return (
    <PageShell title="入库接收">
      {/* 搜索栏 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <SearchFilterInput
          value={searchKeyword}
          onChange={(v) => { setSearchKeyword(v); setPage(1); }}
          placeholder="搜索单号/供应商/操作人..."
        />
      </div>

      {/* 统计卡片 */}
      <QuickStats
        items={[
          { label: '全部单数', value: stats.total },
          { label: '待验收', value: stats.pending, valueColor: '#f59e0b' },
          { label: '进行中', value: stats.inProgress, valueColor: '#3b82f6' },
          { label: '已完成', value: stats.completed, valueColor: '#22c55e' },
        ]}
      />

      {/* 状态筛选 — active filter chip */}
      {filterBarChips.length > 0 ? (
        <FilterBar
          chips={filterBarChips}
          onClearAll={() => { setStatusFilter('all'); setPage(1); }}
          activeCount={1}
        />
      ) : null}

      {/* 状态选项列表 */}
      <FilterChips
        hint="筛选状态"
        chips={filterChipsItems}
        onRemove={(key) => { setStatusFilter('all'); setPage(1); }}
      />

      {/* 分页表格 */}
      <PaginatedDataTableCard
        columns={columns}
        rows={paged}
        rowKey={(row) => row.id}
        emptyTitle="暂无入库记录"
        emptyDescription="当前筛选条件下没有入库单"
        pagination={{
          page,
          totalPages,
          total: filtered.length,
          onPageChange: setPage,
        }}
      />
    </PageShell>
  );
}
