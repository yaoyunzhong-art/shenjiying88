'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type ReturnStatus = 'pending' | 'inspecting' | 'approved' | 'rejected' | 'refunded' | 'exchanged' | 'closed';

interface ReturnOrderItem {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdDate: string;
  storeName: string;
}

const STATUS_OPTIONS = [
  { key: 'ALL' as const, label: '全部' },
  { key: 'pending' as const, label: '待处理' },
  { key: 'inspecting' as const, label: '质检中' },
  { key: 'approved' as const, label: '已通过' },
  { key: 'rejected' as const, label: '已拒绝' },
  { key: 'refunded' as const, label: '已退款' },
  { key: 'exchanged' as const, label: '已换货' },
  { key: 'closed' as const, label: '已关闭' },
];

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待处理',
  inspecting: '质检中',
  approved: '已通过',
  rejected: '已拒绝',
  refunded: '已退款',
  exchanged: '已换货',
  closed: '已关闭',
};

const STATUS_VARIANTS: Record<ReturnStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral' | 'purple' | 'cyan'> = {
  pending: 'warning',
  inspecting: 'info',
  approved: 'success',
  rejected: 'danger',
  refunded: 'purple',
  exchanged: 'cyan',
  closed: 'neutral',
};

// ---- Mock 数据 ----

const MOCK_RETURNS: ReturnOrderItem[] = [
  { id: 'r1', returnNo: 'RT20260701-001', customerName: '张三', phone: '138****0001', productName: '瑜伽初级课', reason: '课程时间冲突无法参加', amount: 199, status: 'pending', createdDate: '2026-07-01', storeName: 'Demo Store 旗舰店' },
  { id: 'r2', returnNo: 'RT20260701-002', customerName: '李四', phone: '138****0002', productName: '蛋白粉（乳清）', reason: '产品质量问题包装破损', amount: 299, status: 'inspecting', createdDate: '2026-07-01', storeName: 'Demo Store 旗舰店' },
  { id: 'r3', returnNo: 'RT20260630-001', customerName: '王五', phone: '139****0003', productName: '运动毛巾套装', reason: '颜色与描述不符', amount: 89, status: 'approved', createdDate: '2026-06-30', storeName: 'Demo Store 社区店' },
  { id: 'r4', returnNo: 'RT20260630-002', customerName: '赵六', phone: '137****0004', productName: '游泳季卡', reason: '门店搬迁不方便继续使用', amount: 1999, status: 'rejected', createdDate: '2026-06-30', storeName: 'Demo Store 旗舰店' },
  { id: 'r5', returnNo: 'RT20260629-001', customerName: '孙七', phone: '136****0005', productName: '私教一对一', reason: '教练离职更换', amount: 499, status: 'refunded', createdDate: '2026-06-29', storeName: 'Demo Store 旗舰店' },
  { id: 'r6', returnNo: 'RT20260629-002', customerName: '周八', phone: '135****0006', productName: '运动背包（防水）', reason: '拉链损坏', amount: 249, status: 'exchanged', createdDate: '2026-06-29', storeName: 'Demo Store 旗舰店' },
  { id: 'r7', returnNo: 'RT20260628-001', customerName: '吴九', phone: '134****0007', productName: '瑜伽垫（加厚）', reason: '尺寸不合适', amount: 159, status: 'closed', createdDate: '2026-06-28', storeName: 'Demo Store 社区店' },
  { id: 'r8', returnNo: 'RT20260628-002', customerName: '郑十', phone: '133****0008', productName: '减脂训练营', reason: '健康原因无法参加', amount: 3999, status: 'pending', createdDate: '2026-06-28', storeName: 'Demo Store 社区店' },
  { id: 'r9', returnNo: 'RT20260627-001', customerName: '陈晓', phone: '132****0009', productName: 'HIIT 高强度间歇训练', reason: '工作调动无法继续', amount: 149, status: 'inspecting', createdDate: '2026-06-27', storeName: 'Demo Store 旗舰店' },
  { id: 'r10', returnNo: 'RT20260627-002', customerName: '林立', phone: '131****0010', productName: '普拉提中级课', reason: '课程难度与描述不符', amount: 229, status: 'approved', createdDate: '2026-06-27', storeName: 'Demo Store 旗舰店' },
  { id: 'r11', returnNo: 'RT20260626-001', customerName: '黄海', phone: '130****0011', productName: '体测评估服务', reason: '重复下单', amount: 99, status: 'refunded', createdDate: '2026-06-26', storeName: 'Demo Store 旗舰店' },
  { id: 'r12', returnNo: 'RT20260626-002', customerName: '马飞', phone: '159****0012', productName: '游泳季卡', reason: '临时出差无法使用', amount: 1999, status: 'rejected', createdDate: '2026-06-26', storeName: 'Demo Store 社区店' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<ReturnOrderItem>[] = [
  {
    key: 'returnNo',
    header: '退货单号',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.returnNo}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.storeName}
        </span>
      </div>
    ),
  },
  {
    key: 'customerName',
    header: '客户',
    render: (item) => (
      <div>
        <span style={{ fontSize: 14, color: '#e2e8f0' }}>{item.customerName}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>{item.phone}</span>
      </div>
    ),
  },
  {
    key: 'productName',
    header: '商品',
    render: (item) => <span style={{ color: '#cbd5e1' }}>{item.productName}</span>,
  },
  {
    key: 'reason',
    header: '退货原因',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8', maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.reason}
      </span>
    ),
  },
  {
    key: 'amount',
    header: '金额',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        ¥{item.amount.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
  {
    key: 'createdDate',
    header: '创建日期',
    align: 'right',
    render: (item) => <span style={{ fontSize: 13, color: '#64748b' }}>{item.createdDate}</span>,
  },
];

// ---- 统计卡片 ----

function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
    </article>
  );
}

// ---- 页面 ----

export default function ReturnOrdersListPage() {
  const router = useRouter();

  // 搜索
  const searchFields = useMemo<(keyof ReturnOrderItem)[]>(
    () => ['returnNo', 'customerName', 'phone', 'productName', 'reason', 'storeName'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_RETURNS,
    searchFields,
  );

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  // 排序
  const [sortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(statusFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 10);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 10,
    pagination.page * 10,
  );

  // 统计
  const stats = useMemo(() => {
    const pending = MOCK_RETURNS.filter((o) => o.status === 'pending' || o.status === 'inspecting').length;
    const approved = MOCK_RETURNS.filter((o) => o.status === 'approved' || o.status === 'refunded' || o.status === 'exchanged').length;
    const rejected = MOCK_RETURNS.filter((o) => o.status === 'rejected' || o.status === 'closed').length;
    return { total: MOCK_RETURNS.length, pending, approved, rejected };
  }, []);

  return (
    <PageShell
      title="退货管理"
      description="客户退货单列表，支持搜索、状态筛选与详情查看。"
    >
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatBadge label="总退货单" value={String(stats.total)} accent="#60a5fa" />
        <StatBadge label="待处理" value={String(stats.pending)} accent="#f97316" />
        <StatBadge label="已完成" value={String(stats.approved)} accent="#4ade80" />
        <StatBadge label="已关闭/拒绝" value={String(stats.rejected)} accent="#ef4444" />
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索退货单号、客户名称、商品..."
        />
      </div>

      {/* 状态过滤栏 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={STATUS_OPTIONS.map((opt) => ({
            key: opt.key,
            label: opt.label,
            count: opt.key === 'ALL'
              ? (filteredItems ?? []).length
              : (filteredItems ?? []).filter((item) => item.status === opt.key).length,
          }))}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as ReturnStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
        onRowClick={(item) => router.push(`/return-orders/${item.id}`)}
      />

      {/* 分页 */}
      <div style={{ marginTop: 12 }}>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
        />
      </div>
    </PageShell>
  );
}
