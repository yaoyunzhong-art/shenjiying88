'use client';

import React, { useMemo, useState, useEffect } from 'react';

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
import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

// ---- 类型 ----

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
type InventoryCategory = 'equipment' | 'consumable' | 'merchandise' | 'accessory';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  unitPrice: number;
  totalValue: number;
  storageLocation: string;
  supplier: string;
  lastRestocked: string;
  status: InventoryStatus;
}

const STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: '库存充足',
  low_stock: '库存偏低',
  out_of_stock: '缺货',
  overstocked: '库存过剩',
};

const STATUS_VARIANTS: Record<InventoryStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
  overstocked: 'info',
};

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  equipment: '设备',
  consumable: '耗材',
  merchandise: '商品',
  accessory: '配件',
};

// ---- Mock 数据 ----

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-001', sku: 'EQ-001', name: '咖啡机', category: 'equipment', quantity: 5, minThreshold: 2, maxThreshold: 10, unitPrice: 3500, totalValue: 17500, storageLocation: '仓库A-01', supplier: '广州咖啡设备有限公司', lastRestocked: '2026-06-15', status: 'in_stock' },
  { id: 'inv-002', sku: 'CS-001', name: '咖啡豆（哥伦比亚）', category: 'consumable', quantity: 200, minThreshold: 50, maxThreshold: 500, unitPrice: 45, totalValue: 9000, storageLocation: '仓库B-03', supplier: '云南咖啡基地', lastRestocked: '2026-07-10', status: 'in_stock' },
  { id: 'inv-003', sku: 'CS-002', name: '牛奶', category: 'consumable', quantity: 12, minThreshold: 20, maxThreshold: 100, unitPrice: 18, totalValue: 216, storageLocation: '冷柜-01', supplier: '本地鲜奶供应商', lastRestocked: '2026-07-18', status: 'low_stock' },
  { id: 'inv-004', sku: 'MD-001', name: '品牌马克杯', category: 'merchandise', quantity: 0, minThreshold: 10, maxThreshold: 200, unitPrice: 25, totalValue: 0, storageLocation: '仓库C-02', supplier: '景德镇陶瓷厂', lastRestocked: '2026-05-20', status: 'out_of_stock' },
  { id: 'inv-005', sku: 'AC-001', name: '杯盖', category: 'accessory', quantity: 1500, minThreshold: 100, maxThreshold: 500, unitPrice: 0.5, totalValue: 750, storageLocation: '仓库D-01', supplier: '深圳包装有限公司', lastRestocked: '2026-07-01', status: 'overstocked' },
  { id: 'inv-006', sku: 'EQ-002', name: '磨豆机', category: 'equipment', quantity: 3, minThreshold: 1, maxThreshold: 5, unitPrice: 2800, totalValue: 8400, storageLocation: '仓库A-02', supplier: '广州咖啡设备有限公司', lastRestocked: '2026-06-20', status: 'in_stock' },
  { id: 'inv-007', sku: 'CS-003', name: '抹茶粉', category: 'consumable', quantity: 8, minThreshold: 10, maxThreshold: 50, unitPrice: 35, totalValue: 280, storageLocation: '仓库B-01', supplier: '日本抹茶株式会社', lastRestocked: '2026-07-05', status: 'low_stock' },
  { id: 'inv-008', sku: 'MD-002', name: '环保购物袋', category: 'merchandise', quantity: 300, minThreshold: 50, maxThreshold: 500, unitPrice: 3, totalValue: 900, storageLocation: '仓库C-01', supplier: '环保制品有限公司', lastRestocked: '2026-07-12', status: 'in_stock' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<InventoryItem>[] = [
  {
    key: 'name',
    header: '商品',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.sku}
        </span>
      </div>
    ),
  },
  {
    key: 'category',
    header: '分类',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{CATEGORY_LABELS[item.category]}</span>
    ),
  },
  {
    key: 'quantity',
    header: '库存数量',
    align: 'right',
    render: (item) => (
      <span style={{
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500,
        color: item.status === 'out_of_stock' ? '#f87171' : item.status === 'low_stock' ? '#facc15' : '#e2e8f0',
      }}>
        {item.quantity.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'unitPrice',
    header: '单价',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
        ¥{item.unitPrice.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'totalValue',
    header: '总价值',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        ¥{item.totalValue.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'storageLocation',
    header: '存放位置',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.storageLocation}</span>
    ),
  },
  {
    key: 'lastRestocked',
    header: '最近补货',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.lastRestocked}</span>
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

// ---- 页面 ----

export default function InventoryListPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<InventoryItem[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<InventoryItem[]>((resolve) => {
        setTimeout(() => resolve(MOCK_INVENTORY), 300);
      }),
    ).then((data) => {
      if (data) setPageData(data);
      setPageReady(true);
    });
  }, []);

  // 搜索
  const searchFields = useMemo<(keyof InventoryItem)[]>(
    () => ['name', 'sku', 'category', 'supplier', 'storageLocation'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    pageData.length > 0 ? pageData : MOCK_INVENTORY,
    searchFields,
  );

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(statusFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  // 统计
  const stats = useMemo(() => {
    const totalValue = pageData.reduce((sum, m) => sum + m.totalValue, 0);
    const lowStock = pageData.filter((m) => m.status === 'low_stock' || m.status === 'out_of_stock').length;
    const categories = new Set(pageData.map((m) => m.category));
    return {
      total: pageData.length,
      totalValue,
      lowStock,
      categories: categories.size,
    };
  }, [pageData]);

  return (
    <PageShell
      title="库存管理"
      description="查看库存商品信息，监控库存状态与价值。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<InventoryItem[]>((resolve) => {
              setTimeout(() => resolve(MOCK_INVENTORY), 300);
            }),
          ).then((data) => {
            if (data) setPageData(data);
            setPageReady(true);
          })
        }
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
          <StatBadge label="商品总数" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="库存总价值" value={`¥${stats.totalValue.toLocaleString()}`} accent="#4ade80" />
          <StatBadge label="低库存/缺货" value={String(stats.lowStock)} accent="#f87171" />
          <StatBadge label="商品分类数" value={String(stats.categories)} accent="#a78bfa" />
        </div>

        {/* 搜索与过滤 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索商品名称、SKU、分类或供应商..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
              ...(['in_stock', 'low_stock', 'out_of_stock', 'overstocked'] as const).map(
                (status) => ({
                  key: status,
                  label: STATUS_LABELS[status],
                  count: (filteredItems ?? []).filter((item) => item.status === status).length,
                }),
              ),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as InventoryStatus | 'ALL')}
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
        {statusFiltered.length === 0 && (
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
            未找到匹配的库存记录
          </div>
        )}

        {/* 分页 */}
        {statusFiltered.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
            />
          </div>
        )}
      </TriStateRenderer>
    </PageShell>
  );
}
