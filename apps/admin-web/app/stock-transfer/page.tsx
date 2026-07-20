/**
 * 库存调拨审核列表页 — Stock Transfer Approval List (Next.js App Router Page)
 * 角色视角: 👔运营主管 / 📦仓储经理 / 💰财务
 * 功能: 搜索、调拨类型/状态筛选、分页排序
 */
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  QuickStats,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useDetailActions } from '../components/use-detail-actions';

// ---- 共享类型/数据 ----

import {
  MOCK_TRANSFERS,
  TYPE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  URGENCY_LABEL,
  URGENCY_VARIANT,
  type StockTransferItem,
  type TransferStatus,
  type TransferType,
  type UrgencyLevel,
} from './stock-transfer-data';

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: StockTransferItem) => void,
): DataTableColumn<StockTransferItem>[] {
  return [
    {
      key: 'transferNo',
      title: '调拨单号',
      dataKey: 'transferNo',
      sortable: true,
      render: (item: StockTransferItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
        >
          {item.transferNo}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      render: (item: StockTransferItem) => (
        <StatusBadge label={STATUS_LABEL[item.status]} variant={STATUS_STYLE[item.status]} size="sm" dot />
      ),
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      render: (item: StockTransferItem) => <StatusBadge label={TYPE_LABEL[item.type]} variant="neutral" size="sm" />,
    },
    {
      key: 'urgency',
      title: '紧急度',
      sortable: true,
      sortValue: (item: StockTransferItem) => ['normal', 'urgent', 'critical'].indexOf(item.urgency),
      render: (item: StockTransferItem) => (
        <StatusBadge label={URGENCY_LABEL[item.urgency]} variant={URGENCY_VARIANT[item.urgency]} size="sm" />
      ),
    },
    {
      key: 'sourceStoreName',
      title: '调出门店',
      dataKey: 'sourceStoreName',
      sortable: true,
      render: (item: StockTransferItem) => (
        <div>
          <div style={{ fontSize: 13 }}>{item.sourceStoreName}</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{item.sourceStore}</div>
        </div>
      ),
    },
    {
      key: 'targetStoreName',
      title: '调入门店',
      dataKey: 'targetStoreName',
      sortable: true,
      render: (item: StockTransferItem) => (
        <div>
          <div style={{ fontSize: 13 }}>{item.targetStoreName}</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{item.targetStore}</div>
        </div>
      ),
    },
    {
      key: 'productName',
      title: '商品',
      sortable: true,
      render: (item: StockTransferItem) => (
        <div>
          <div style={{ fontSize: 13 }}>{item.productName}</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{item.productSku} × {item.quantity}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataKey: 'createdAt',
      sortable: true,
    },
    {
      key: 'createdBy',
      title: '创建人',
      dataKey: 'createdBy',
      sortable: true,
    },
  ];
}

// ---- 页面组件 ----

const STATUS_FILTERS: Array<TransferStatus | 'ALL'> = ['ALL', 'pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
const TYPE_FILTERS: Array<TransferType | 'ALL'> = ['ALL', 'supply', 'return', 'move', 'emergency'];
const URGENCY_FILTERS: Array<UrgencyLevel | 'ALL'> = ['ALL', 'normal', 'urgent', 'critical'];

export default function StockTransferListPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockTransferItem[] | null>(null);

  useEffect(() => {
    try {
      setData(MOCK_TRANSFERS);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></main>;
  if (error) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></main>;
  if (!data || data.length === 0) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></main>;

  const router = useRouter();

  // 搜索
  const searchFields = useMemo<(keyof StockTransferItem)[]>(
    () => ['transferNo', 'sourceStoreName', 'targetStoreName', 'productName', 'productSku', 'createdBy', 'remark'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_TRANSFERS, searchFields);

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((i) => i.status === statusFilter)),
    [filteredItems, statusFilter],
  );

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<TransferType | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () => (typeFilter === 'ALL' ? statusFiltered : statusFiltered.filter((i) => i.type === typeFilter)),
    [statusFiltered, typeFilter],
  );

  // 紧急度筛选
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'ALL'>('ALL');
  const urgencyFiltered = useMemo(
    () => (urgencyFilter === 'ALL' ? typeFiltered : typeFiltered.filter((i) => i.urgency === urgencyFilter)),
    [typeFiltered, urgencyFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' });
  const handleRowClick = useCallback(
    (item: StockTransferItem) => router.push(`/stock-transfer/${item.id}`),
    [router],
  );
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(urgencyFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10 });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, typeFilter, urgencyFilter]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_TRANSFERS.length,
    pending: MOCK_TRANSFERS.filter((i) => i.status === 'pending').length,
    critical: MOCK_TRANSFERS.filter((i) => i.urgency === 'critical').length,
    shipped: MOCK_TRANSFERS.filter((i) => i.status === 'shipped').length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'stock-transfer',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, typeFilter, urgencyFilter, stats },
    shareTitle: '库存调拨审核列表',
    shareText: '查看调拨单 / 状态 / 类型 / 紧急度筛选结果',
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="库存调拨审核"
        subtitle="管理跨门店/跨仓库的库存调拨申请。支持按状态、类型和紧急度筛选，快速处理待审核调拨单。"
      >
        {/* 统计卡片 */}
        <QuickStats
          items={[
            { label: '调拨单总数', value: stats.total, helper: `其中 ${stats.pending} 单待审核` },
            { label: '待审核', value: stats.pending, valueColor: '#fbbf24', helper: `${((stats.pending / stats.total) * 100).toFixed(0)}% 待处理` },
            { label: '特急调拨', value: stats.critical, valueColor: '#f87171', helper: '需优先处理' },
            { label: '已发货', value: stats.shipped, valueColor: '#86efac', helper: '等待门店确认收货' },
          ]}
        />

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索调拨单号 / 门店名称 / 商品名 / SKU / 创建人 / 备注..."
          />
        </div>

        {/* 状态过滤 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={STATUS_FILTERS.map((s) => ({
              key: s,
              label: s === 'ALL' ? '全部' : STATUS_LABEL[s],
              count: s === 'ALL'
                ? MOCK_TRANSFERS.length
                : MOCK_TRANSFERS.filter((i) => i.status === s).length,
            }))}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as TransferStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 类型 + 紧急度筛选 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>调拨类型</div>
            <Tabs
              items={TYPE_FILTERS.map((t) => ({
                key: t,
                label: t === 'ALL' ? '全部' : TYPE_LABEL[t],
                count: t === 'ALL'
                  ? statusFiltered.length
                  : statusFiltered.filter((i) => i.type === t).length,
              }))}
              activeKey={typeFilter}
              onChange={(key) => setTypeFilter(key as TransferType | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>紧急度</div>
            <Tabs
              items={URGENCY_FILTERS.map((u) => ({
                key: u,
                label: u === 'ALL' ? '全部' : URGENCY_LABEL[u],
                count: u === 'ALL'
                  ? typeFiltered.length
                  : typeFiltered.filter((i) => i.urgency === u).length,
              }))}
              activeKey={urgencyFilter}
              onChange={(key) => setUrgencyFilter(key as UrgencyLevel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃筛选条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status' as const, label: STATUS_LABEL[statusFilter], tone: (STATUS_STYLE[statusFilter] === 'danger' ? 'danger' : STATUS_STYLE[statusFilter] === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: MOCK_TRANSFERS.filter((i) => i.status === statusFilter).length }]
              : []),
            ...(typeFilter !== 'ALL'
              ? [{ key: 'type' as const, label: TYPE_LABEL[typeFilter], tone: 'neutral' as FilterChip['tone'], count: statusFiltered.filter((i) => i.type === typeFilter).length }]
              : []),
            ...(urgencyFilter !== 'ALL'
              ? [{ key: 'urgency' as const, label: URGENCY_LABEL[urgencyFilter], tone: (URGENCY_VARIANT[urgencyFilter] === 'danger' ? 'danger' : URGENCY_VARIANT[urgencyFilter] === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: typeFiltered.filter((i) => i.urgency === urgencyFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            if (key === 'status') setStatusFilter('ALL');
            if (key === 'type') setTypeFilter('ALL');
            if (key === 'urgency') setUrgencyFilter('ALL');
          }}
          onClearAll={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); setUrgencyFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表 */}
        <DataTable
          title={`调拨单列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前调拨审核筛选结果"
        />
      </PageShell>
    </main>
  );
}
