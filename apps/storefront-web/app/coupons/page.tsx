'use client';

import React, { useMemo, useState } from 'react';

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

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
type CouponStatus = 'active' | 'expired' | 'disabled';

interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  totalIssued: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  storeName: string;
  status: CouponStatus;
}

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const TYPE_VARIANTS: Record<CouponType, 'success' | 'warning' | 'default' | 'danger'> = {
  discount: 'success',
  cash: 'warning',
  free_shipping: 'default',
  voucher: 'danger',
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: '进行中',
  expired: '已过期',
  disabled: '已停用',
};

const STATUS_VARIANTS: Record<CouponStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  expired: 'neutral',
  disabled: 'warning',
};

// ---- Mock 数据 ----

const MOCK_COUPONS: Coupon[] = [
  { id: 'cp1', name: '新客首单8折', type: 'discount', value: '8折', minAmount: '满0元可用', totalIssued: 500, usedCount: 187, validFrom: '2026-06-01', validTo: '2026-07-31', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp2', name: '满300减50', type: 'cash', value: '¥50', minAmount: '满300元', totalIssued: 300, usedCount: 89, validFrom: '2026-06-01', validTo: '2026-06-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp3', name: '会员专享免运费', type: 'free_shipping', value: '免运费', minAmount: '满99元', totalIssued: 1000, usedCount: 412, validFrom: '2026-06-01', validTo: '2026-12-31', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp4', name: '夏季狂欢9折', type: 'discount', value: '9折', minAmount: '满0元可用', totalIssued: 200, usedCount: 34, validFrom: '2026-06-15', validTo: '2026-08-15', storeName: 'Demo Store 社区店', status: 'active' },
  { id: 'cp5', name: '端午节礼券', type: 'voucher', value: '¥100', minAmount: '满200元', totalIssued: 150, usedCount: 98, validFrom: '2026-06-01', validTo: '2026-06-15', storeName: 'Demo Store 社区店', status: 'expired' },
  { id: 'cp6', name: '满500减80', type: 'cash', value: '¥80', minAmount: '满500元', totalIssued: 100, usedCount: 22, validFrom: '2026-05-01', validTo: '2026-06-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp7', name: '年终特惠8.5折', type: 'discount', value: '8.5折', minAmount: '满0元可用', totalIssued: 800, usedCount: 621, validFrom: '2026-01-01', validTo: '2026-03-31', storeName: 'Demo Store 旗舰店', status: 'expired' },
  { id: 'cp8', name: '开业庆代价券', type: 'cash', value: '¥30', minAmount: '满150元', totalIssued: 400, usedCount: 15, validFrom: '2026-05-20', validTo: '2026-07-20', storeName: 'Demo Store 社区店', status: 'disabled' },
  { id: 'cp9', name: '复购有礼', type: 'discount', value: '7折', minAmount: '满200元', totalIssued: 250, usedCount: 73, validFrom: '2026-06-10', validTo: '2026-07-10', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp10', name: '好友邀请券', type: 'voucher', value: '¥50', minAmount: '满100元', totalIssued: 600, usedCount: 245, validFrom: '2026-06-01', validTo: '2026-09-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp11', name: '周末促销', type: 'cash', value: '¥20', minAmount: '满100元', totalIssued: 350, usedCount: 167, validFrom: '2026-06-01', validTo: '2026-08-31', storeName: 'Demo Store 社区店', status: 'active' },
  { id: 'cp12', name: '超值套餐券', type: 'voucher', value: '¥200', minAmount: '满600元', totalIssued: 80, usedCount: 12, validFrom: '2026-06-01', validTo: '2026-07-01', storeName: 'Demo Store 旗舰店', status: 'disabled' },
];

// ---- 统计子组件 ----

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

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Coupon>[] = [
  {
    key: 'name',
    header: '券名称',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.id}
        </span>
      </div>
    ),
  },
  {
    key: 'type',
    header: '类型',
    render: (item) => (
      <StatusBadge
        label={TYPE_LABELS[item.type]}
        variant={TYPE_VARIANTS[item.type]}
        size="sm"
      />
    ),
  },
  {
    key: 'value',
    header: '面值',
    render: (item) => (
      <span style={{ fontWeight: 500 }}>{item.value}</span>
    ),
  },
  {
    key: 'minAmount',
    header: '使用门槛',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.minAmount}</span>
    ),
  },
  {
    key: 'usage',
    header: '核销',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {item.usedCount}/{item.totalIssued}
        <span style={{ color: '#64748b', marginLeft: 4 }}>
          ({Math.round((item.usedCount / item.totalIssued) * 100)}%)
        </span>
      </span>
    ),
  },
  {
    key: 'validTo',
    header: '有效期至',
    align: 'right',
    render: (item) => (
      <div style={{ fontSize: 13 }}>
        <span style={{ color: '#cbd5e1' }}>{item.validFrom}</span>
        <span style={{ color: '#64748b', margin: '0 4px' }}>→</span>
        <span style={{ color: '#94a3b8' }}>{item.validTo}</span>
      </div>
    ),
  },
  {
    key: 'storeName',
    header: '所属门店',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.storeName}</span>
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
];

// ---- 页面 ----

export default function CouponsListPage() {
  const searchFields = useMemo<(keyof Coupon)[]>(
    () => ['name', 'type', 'storeName', 'value'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_COUPONS,
    searchFields,
  );

  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'ALL'>('ALL');
  const finalFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  const stats = useMemo(() => {
    const active = MOCK_COUPONS.filter((c) => c.status === 'active').length;
    const activeCoupons = MOCK_COUPONS.filter((c) => c.status === 'active');
    const totalUsed = activeCoupons.reduce((s, c) => s + c.usedCount, 0);
    const totalIssued = MOCK_COUPONS.reduce((s, c) => s + c.totalIssued, 0);
    const activeCashCoupons = activeCoupons.filter((c) => c.type === 'cash');
    const largestValue = activeCashCoupons.reduce(
      (max, c) => Math.max(max, parseInt(c.value.replace(/[^0-9]/g, ''), 10) || 0),
      0,
    );
    return {
      total: MOCK_COUPONS.length,
      active,
      totalIssued,
      totalUsed,
      largestValue,
    };
  }, []);

  return (
    <PageShell
      title="优惠券管理"
      description="查看和管理门店优惠券活动，跟踪核销情况。"
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
        <StatBadge label="优惠券总数" value={String(stats.total)} accent="#60a5fa" />
        <StatBadge label="进行中" value={String(stats.active)} accent="#4ade80" />
        <StatBadge label="总发放" value={stats.totalIssued.toLocaleString()} accent="#a78bfa" />
        <StatBadge label="已核销" value={stats.totalUsed.toLocaleString()} accent="#facc15" />
        {stats.largestValue > 0 && (
          <StatBadge label="最高代金券" value={`¥${stats.largestValue}`} accent="#fb923c" />
        )}
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索券名称、类型、门店..."
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
            { key: 'active', label: '进行中', count: (filteredItems ?? []).filter((c) => c.status === 'active').length },
            { key: 'expired', label: '已过期', count: (filteredItems ?? []).filter((c) => c.status === 'expired').length },
            { key: 'disabled', label: '已停用', count: (filteredItems ?? []).filter((c) => c.status === 'disabled').length },
          ]}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as CouponStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
      />

      {/* 空状态 */}
      {finalFiltered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: '#64748b',
            fontSize: 14,
            borderRadius: 12,
            border: '1px dashed rgba(148,163,184,0.18)',
            marginTop: 16,
          }}
        >
          未找到匹配的优惠券
        </div>
      )}

      {/* 分页 */}
      {finalFiltered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </PageShell>
  );
}
