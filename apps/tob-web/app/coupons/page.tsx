/**
 * coupons/page.tsx — ToB 优惠券管理列表页
 *
 * 展示租户级 / 品牌级优惠券活动，支持搜索、类型筛选、状态筛选、分页
 */
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
  maxAmount: string;
  totalIssued: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  marketCode: string;
  brandCode: string;
  status: CouponStatus;
  createdBy: string;
}

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const TYPE_VARIANTS: Record<CouponType, 'success' | 'warning' | 'info' | 'danger'> = {
  discount: 'success',
  cash: 'warning',
  free_shipping: 'info',
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

const MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];
const BRANDS = ['M5', 'M5-PRO', 'M5-LITE'];
const SALESPERSONS = ['张三', '李四', '王五', '赵六'];

// ---- Mock 数据 ----

function createMockCoupons(): Coupon[] {
  const now = new Date('2026-06-26');
  const names = [
    '新客首单8折', '满300减50', '会员专享免运费', '夏季狂欢9折',
    '端午节礼券', '满500减80', '年终特惠8.5折', '开业庆代价券',
    '复购有礼', '好友邀请券', '周末促销', '超值套餐券',
    '店庆大促', '跨店满减', '会员日专享', '批量采购优惠',
    '新品首发折扣', '积分兑换券', '老客回馈', '季度满减',
  ];
  const types: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];
  const statuses: CouponStatus[] = ['active', 'active', 'active', 'expired', 'disabled'];

  return names.map((name, i) => {
    const type = types[i % types.length]!;
    const status = statuses[i % statuses.length]!;
    const totalIssued = Math.floor(Math.random() * 2000) + 100;
    const usedCount = Math.floor(Math.random() * totalIssued);
    const startDays = Math.floor(Math.random() * 60) + 1;
    const endDays = Math.floor(Math.random() * 180) + 30;

    const valueMap: Record<CouponType, string> = {
      discount: `${[8, 8.5, 9, 7, 6.5][i % 5]}折`,
      cash: `¥${[20, 30, 50, 80, 100, 200][i % 6]}`,
      free_shipping: '免运费',
      voucher: `¥${[30, 50, 100, 200][i % 4]}`,
    };
    const minAmount = (() => {
      switch(type) {
        case 'discount': return ['满0元', '满200元', '满0元'][i % 3];
        case 'cash': return ['满100元', '满300元', '满500元', '满600元'][i % 4];
        case 'free_shipping': return ['满99元', '满0元'][i % 2];
        case 'voucher': return ['满100元', '满200元'][i % 2];
      }
    })();

    return {
      id: `tob-cpn-${String(i + 1).padStart(3, '0')}`,
      name,
      type,
      value: valueMap[type],
      minAmount: minAmount as string,
      maxAmount: type === 'discount' || type === 'cash' ? `¥200` : '',
      totalIssued,
      usedCount,
      validFrom: new Date(now.getTime() - startDays * 86400000).toISOString().slice(0, 10),
      validTo: new Date(now.getTime() + endDays * 86400000).toISOString().slice(0, 10),
      marketCode: MARKETS[i % MARKETS.length]!,
      brandCode: BRANDS[i % BRANDS.length]!,
      status,
      createdBy: SALESPERSONS[i % SALESPERSONS.length]!,
    };
  });
}

const MOCK_COUPONS = createMockCoupons();

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
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>
        {value}
      </div>
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
          {item.id} · {item.brandCode}
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    key: 'type',
    header: '类型',
    render: (item) => (
      <StatusBadge label={TYPE_LABELS[item.type]} variant={TYPE_VARIANTS[item.type]} size="sm" />
    ),
  },
  {
    key: 'value',
    header: '面值',
    render: (item) => <span style={{ fontWeight: 500 }}>{item.value}</span>,
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
    header: '有效期',
    render: (item) => (
      <div style={{ fontSize: 13 }}>
        <span style={{ color: '#cbd5e1' }}>{item.validFrom}</span>
        <span style={{ color: '#64748b', margin: '0 4px' }}>→</span>
        <span style={{ color: '#94a3b8' }}>{item.validTo}</span>
      </div>
    ),
  },
  {
    key: 'marketCode',
    header: '市场',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.marketCode}</span>,
    sortable: true,
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" dot />
    ),
  },
  {
    key: 'createdBy',
    header: '创建人',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.createdBy}</span>,
  },
];

// ---- 页面 ----

export default function CouponsListPage() {
  const searchFields = useMemo<(keyof Coupon)[]>(
    () => ['name', 'type', 'marketCode', 'brandCode', 'createdBy', 'value'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_COUPONS,
    searchFields,
  );

  const [typeFilter, setTypeFilter] = useState<CouponType | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () =>
      typeFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.type === typeFilter),
    [filteredItems, typeFilter],
  );

  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? typeFiltered
        : typeFiltered.filter((item) => item.status === statusFilter),
    [typeFiltered, statusFilter],
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(statusFiltered, COLUMNS, sortConfig);

  const pagination = usePagination(sortedItems.length, 10);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize,
  );

  const stats = useMemo(() => {
    const active = MOCK_COUPONS.filter((c) => c.status === 'active').length;
    const totalUsed = MOCK_COUPONS.reduce((s, c) => s + c.usedCount, 0);
    const totalIssued = MOCK_COUPONS.reduce((s, c) => s + c.totalIssued, 0);
    return { total: MOCK_COUPONS.length, active, totalIssued, totalUsed };
  }, []);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="优惠券管理"
        subtitle="ToB 管理端 — 管理租户级品牌级优惠券活动，跟踪核销情况和有效期。"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatBadge label="优惠券总数" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="进行中" value={String(stats.active)} accent="#4ade80" />
          <StatBadge label="总发放" value={stats.totalIssued.toLocaleString()} accent="#a78bfa" />
          <StatBadge label="已核销" value={stats.totalUsed.toLocaleString()} accent="#facc15" />
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索券名称、类型、市场、品牌、创建人..."
          />
        </div>

        {/* 类型过滤 */}
        <div style={{ marginBottom: 8 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部类型', count: filteredItems.length },
              ...(['discount', 'cash', 'free_shipping', 'voucher'] as CouponType[]).map((t) => ({
                key: t,
                label: TYPE_LABELS[t],
                count: filteredItems.filter((item) => item.type === t).length,
              })),
            ]}
            activeKey={typeFilter}
            onChange={(key) => setTypeFilter(key as CouponType | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态过滤 */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态', count: typeFiltered.length },
              ...(['active', 'expired', 'disabled'] as CouponStatus[]).map((s) => ({
                key: s,
                label: STATUS_LABELS[s],
                count: typeFiltered.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as CouponStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 数据表格 */}
        <DataTable
          title={`优惠券列表（匹配 ${sortedItems.length} 条）`}
          columns={COLUMNS}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 空状态 */}
        {sortedItems.length === 0 && (
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
        {sortedItems.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </PageShell>
    </main>
  );
}
