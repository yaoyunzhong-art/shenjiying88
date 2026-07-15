'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import {
  PageShell,
  Card,
  StatCard,
  StatusBadge,
  DataTable,
  Pagination,
  SearchFilterInput,
  Button,
  EmptyState,
  Select,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type InventoryCategory = 'equipment' | 'consumable' | 'merchandise' | 'supplement' | 'accessory';
type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' | 'discontinued';

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

// ---- 常量映射 ----

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  equipment: '设备',
  consumable: '耗材',
  merchandise: '商品',
  supplement: '补给品',
  accessory: '配件',
};

const STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: '库存充足',
  low_stock: '库存不足',
  out_of_stock: '缺货',
  overstocked: '库存过剩',
  discontinued: '已停产',
};

const STATUS_VARIANTS: Record<InventoryStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
  overstocked: 'info',
  discontinued: 'neutral',
};

// ---- Mock 数据生成 ----

const STORAGE_LOCATIONS = ['A区-01货架', 'A区-02货架', 'B区-01货架', 'B区-02货架', 'C区-01货架', 'C区-02货架', 'D区-01货架', '仓库-主库', '仓库-冷库', '仓库-附件区'];
const SUPPLIERS = ['神机供应链', '电竞装备有限公司', '鑫达商贸', '嘉华文化', '赛瑞克斯', '腾达科技'];

function randomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInventory(count: number): InventoryItem[] {
  const names: Partial<Record<InventoryCategory, string[]>> = {
    equipment: ['电竞椅-旗舰款', '显示器-27寸', '主机-顶配', '键鼠套装-专业版', '耳机-降噪款', '电竞桌-标准款'],
    consumable: ['清洁湿巾', '鼠标垫-标准', '电源线-3米', '网线-CAT6', '束线带-100根装', '螺丝刀套装'],
    merchandise: ['品牌T恤', '纪念徽章', '限量手办', '联名水杯', '帆布袋', '钥匙扣'],
    supplement: ['能量饮料-箱', '蛋白棒-盒', '即溶咖啡-罐', '矿泉水-箱', '零食礼包', '维生素泡腾片'],
    accessory: ['手机支架', '充电宝', 'HDMI线-2米', 'USB集线器', '耳机架', '线缆收纳盒'],
  };

  return Array.from({ length: count }, (_, i) => {
    const category = (['equipment', 'consumable', 'merchandise', 'supplement', 'accessory'] as InventoryCategory[])[i % 5];
    const categoryNames = names[category]!;
    const name = categoryNames[i % categoryNames.length];
    const quantity = Math.floor(Math.random() * 200);
    const minThreshold = 10 + Math.floor(Math.random() * 20);
    const unitPrice = Math.floor(Math.random() * 5000) + 10;
    let status: InventoryStatus;
    if (quantity === 0) status = 'out_of_stock';
    else if (quantity <= minThreshold) status = 'low_stock';
    else if (quantity > 150) status = 'overstocked';
    else status = 'in_stock';

    return {
      id: `INV-${String(i + 1).padStart(4, '0')}`,
      sku: `SJ-${category.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(4, '0')}`,
      name,
      category,
      quantity,
      minThreshold,
      maxThreshold: minThreshold * 5,
      unitPrice,
      totalValue: quantity * unitPrice,
      storageLocation: randomItem(STORAGE_LOCATIONS),
      supplier: randomItem(SUPPLIERS),
      lastRestocked: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      status,
    };
  });
}

const MOCK_INVENTORY = generateInventory(36);

// ---- 子组件 ----

/** 格式化金额 */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

/** 库存概览统计卡片 */
function InventorySummaryCards({ items }: { items: InventoryItem[] }) {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;
  const overstockedCount = items.filter((i) => i.status === 'overstocked').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard label="库存品类数" value={totalItems.toString()} variant="info" />
      <StatCard label="库存总值" value={formatCurrency(totalValue)} variant="success" />
      <StatCard label="低库存/缺货" value={lowStockCount.toString()} variant="warning" />
      <StatCard label="库存过剩" value={overstockedCount.toString()} variant="info" />
    </div>
  );
}

/** 库存预警提示条 */
function InventoryAlertBanner({ items }: { items: InventoryItem[] }) {
  const outOfStock = items.filter((i) => i.status === 'out_of_stock');
  const lowStock = items.filter((i) => i.status === 'low_stock');

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        background: outOfStock.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
        border: `1px solid ${outOfStock.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
        color: outOfStock.length > 0 ? '#fca5a5' : '#fbbf24',
        fontSize: 13,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span>{outOfStock.length > 0 ? '⚠️' : '⚡'}</span>
      <span>
        {outOfStock.length > 0
          ? `${outOfStock.length} 种商品已缺货，需要立即补货！`
          : `${lowStock.length} 种商品库存不足，建议尽快安排补货。`}
      </span>
      <Button variant="ghost" size="sm" onClick={() => alert('跳转至采购订单页')}>
        查看详情
      </Button>
    </div>
  );
}

/** 库存分类筛选标签 */
function InventoryCategoryTabs({
  categories,
  activeCategory,
  onChange,
}: {
  categories: { key: InventoryCategory | 'all'; label: string; count: number }[];
  activeCategory: InventoryCategory | 'all';
  onChange: (key: InventoryCategory | 'all') => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {categories.map((cat) => (
        <div
          key={cat.key}
          onClick={() => onChange(cat.key)}
          style={{
            padding: '5px 14px',
            borderRadius: 8,
            background: cat.key === activeCategory ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${cat.key === activeCategory ? 'rgba(59,130,246,0.4)' : 'rgba(148,163,184,0.08)'}`,
            color: cat.key === activeCategory ? '#60a5fa' : '#cbd5e1',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={(e) => {
            if (cat.key !== activeCategory) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }
          }}
        >
          {cat.label} <span style={{ color: '#64748b', fontSize: 11 }}>({cat.count})</span>
        </div>
      ))}
    </div>
  );
}

/** 库存状态筛选 */
function InventoryStatusFilter({
  value,
  onChange,
}: {
  value: InventoryStatus | 'all';
  onChange: (v: InventoryStatus | 'all') => void;
}) {
  const options: { value: InventoryStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'in_stock', label: '库存充足' },
    { value: 'low_stock', label: '库存不足' },
    { value: 'out_of_stock', label: '缺货' },
    { value: 'overstocked', label: '库存过剩' },
    { value: 'discontinued', label: '已停产' },
  ];

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {options.map((opt) => (
        <span
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 12,
            background: value === opt.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${value === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.08)'}`,
            color: value === opt.value ? '#818cf8' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </span>
      ))}
    </div>
  );
}

/** 加载中骨架屏 */
function InventoryLoadingSkeleton() {
  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(30,41,59,0.6) 50%, rgba(30,41,59,0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div style={{ height: 300, borderRadius: 10, background: 'rgba(30,41,59,0.3)' }} />
    </div>
  );
}

/** 空状态 */
function InventoryEmptyState() {
  return (
    <EmptyState
      title="暂无库存数据"
      description="当前没有库存记录，请先初始化库存或导入数据。"
      actionLabel="初始化库存"
      actionHref="/dashboard/inventory"
    />
  );
}

// ---- 主组件 ----

const CATEGORIES = ['equipment', 'consumable', 'merchandise', 'supplement', 'accessory'] as InventoryCategory[];

const COLUMNS: DataTableColumn<InventoryItem>[] = [
  { key: 'sku', header: 'SKU', sortable: true, width: 140 },
  { key: 'name', header: '商品名称', sortable: true, width: 180 },
  {
    key: 'category',
    header: '分类',
    sortable: true,
    width: 80,
    render: (item) => CATEGORY_LABELS[item.category],
  },
  {
    key: 'quantity',
    header: '库存数量',
    sortable: true,
    width: 100,
    align: 'right',
  },
  {
    key: 'unitPrice',
    header: '单价',
    sortable: true,
    width: 100,
    align: 'right',
    render: (item) => formatCurrency(item.unitPrice),
  },
  {
    key: 'totalValue',
    header: '总价值',
    sortable: true,
    width: 120,
    align: 'right',
    render: (item) => formatCurrency(item.totalValue),
  },
  {
    key: 'storageLocation',
    header: '存放位置',
    sortable: true,
    width: 120,
  },
  {
    key: 'supplier',
    header: '供应商',
    sortable: true,
    width: 120,
  },
  {
    key: 'status',
    header: '状态',
    sortable: true,
    width: 100,
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" />
    ),
  },
  {
    key: 'actions',
    header: '操作',
    width: 100,
    render: () => <Button variant="ghost" size="sm">补货</Button>,
  },
];

export default function DashboardInventoryPage() {
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'all'>('all');
  const searchFilter = useSearchFilter({ keys: ['name', 'sku', 'supplier', 'storageLocation'] });
  const pagination = usePagination({ defaultPageSize: 10 });

  // 计算分类计数
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      counts[cat] = MOCK_INVENTORY.filter((item) => item.category === cat).length;
    });
    return counts;
  }, []);

  const categoryTabs = useMemo(
    () => [
      { key: 'all' as const, label: '全部', count: MOCK_INVENTORY.length },
      ...CATEGORIES.map((cat) => ({
        key: cat as InventoryCategory | 'all',
        label: CATEGORY_LABELS[cat],
        count: categoryCounts[cat],
      })),
    ],
    [categoryCounts]
  );

  // 多维过滤
  const filtered = useMemo(() => {
    let result = MOCK_INVENTORY;

    if (activeCategory !== 'all') {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchFilter.query) {
      const q = searchFilter.query.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCategory, statusFilter, searchFilter.query]);

  // 排序
  const { sortedItems, sortConfig, handleSort } = useSortedItems(filtered, {
    key: 'quantity',
    direction: 'asc',
  });

  // 分页
  const pagedItems = sortedItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sortedItems.length / pagination.pageSize);

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.setPage(newPage);
    },
    [pagination]
  );

  return (
    <PageShell title="库存管理" subtitle="实时查看各类库存状态，及时补货调度">
      {/* 统计概览 */}
      <InventorySummaryCards items={MOCK_INVENTORY} />

      {/* 预警横幅 */}
      <InventoryAlertBanner items={MOCK_INVENTORY} />

      {/* 筛选区域 */}
      <Card>
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            placeholder="搜索商品名称、SKU、供应商..."
            value={searchFilter.query}
            onChange={searchFilter.setQuery}
          />
        </div>

        <InventoryCategoryTabs
          categories={categoryTabs}
          activeCategory={activeCategory}
          onChange={(key) => {
            setActiveCategory(key);
            pagination.setPage(1);
          }}
        />

        <InventoryStatusFilter
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            pagination.setPage(1);
          }}
        />
      </Card>

      {/* 数据表格 */}
      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={COLUMNS}
          data={pagedItems}
          sortConfig={sortConfig as DataTableSortConfig}
          onSort={handleSort}
          emptyState={
            <InventoryEmptyState />
          }
          loading={false}
        />

        {sortedItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={pagination.setPageSize}
              total={sortedItems.length}
            />
          </div>
        )}
      </div>

      {/* 操作说明 */}
      <div
        style={{
          marginTop: 20,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>库存说明</strong>
        <br />
        库存数据每 30 分钟自动同步一次。低库存阈值可前往「库存设置」页面调整。
        如需批量导入库存数据，请使用 CSV 模板上传。
      </div>
    </PageShell>
  );
}
