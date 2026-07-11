'use client';

/**
 * 门店库存管理 - Store Inventory Page
 * 角色: 📦仓库管理 / 👔店长
 * 功能: 库存查询、入库出库、盘点管理、预警设置、供应商管理
 */

import { useState, useMemo, useCallback, use } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  InfoRow,
  StatCard,
  CopyToClipboard,
  DetailClosureBar,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

// ---- 类型定义 ----

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' | 'damaged' | 'expired';
type StockMovementType = 'purchase_in' | 'transfer_in' | 'return_in' | 'sale_out' | 'transfer_out' | 'damage_out' | 'expired_out' | 'adjustment';
type SupplierStatus = 'active' | 'inactive' | 'blacklisted' | 'pending_review';
type StockCheckStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'discrepancy';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  status: InventoryStatus;
  location: string;
  supplier: string;
  batchNo: string;
  expiryDate: string | null;
  lastStockTake: string;
  turnoverDays: number;
  warehouseRack: string;
  image: string;
}

interface StockMovement {
  id: string;
  date: string;
  sku: string;
  name: string;
  type: StockMovementType;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  operator: string;
  referenceNo: string;
  reason: string;
  cost: number;
  status: 'completed' | 'pending' | 'cancelled';
}

interface StockCheck {
  id: string;
  date: string;
  checker: string;
  area: string;
  itemCount: number;
  expectedCount: number;
  actualCount: number;
  discrepancyCount: number;
  discrepancyValue: number;
  status: StockCheckStatus;
  notes: string;
}

interface SupplierInfo {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: SupplierStatus;
  rating: number;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string;
  paymentTerms: string;
  deliveryDays: number;
  notes: string;
}

// ---- 常量 ----

const CATEGORIES = ['游戏币/代币', '娃娃/礼品', '零食饮料', '清洁用品', '办公用品', '设备配件', '促销物料', '会员礼品', '其他'];
const SUPPLIER_NAMES = ['广州礼品总汇', '上海游乐设备', '深圳电子配件', '北京保洁用品', '义乌小商品', '本地食品批发', '美泰玩具', '孩之宝中国', '官方配件商', '活动物料公司'];

const INVENTORY_STATUS_MAP: Record<InventoryStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  in_stock: { label: '库存充足', variant: 'success' },
  low_stock: { label: '库存偏低', variant: 'warning' },
  out_of_stock: { label: '缺货', variant: 'danger' },
  overstock: { label: '库存过多', variant: 'neutral' },
  damaged: { label: '已损坏', variant: 'danger' },
  expired: { label: '已过期', variant: 'neutral' },
};

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  purchase_in: '采购入库',
  transfer_in: '调拨入库',
  return_in: '退货入库',
  sale_out: '销售出库',
  transfer_out: '调拨出库',
  damage_out: '损耗出库',
  expired_out: '过期出库',
  adjustment: '盘点调整',
};

const MOVEMENT_TYPE_VARIANTS: Record<StockMovementType, 'success' | 'danger' | 'warning' | 'neutral'> = {
  purchase_in: 'success',
  transfer_in: 'success',
  return_in: 'success',
  sale_out: 'danger',
  transfer_out: 'danger',
  damage_out: 'danger',
  expired_out: 'danger',
  adjustment: 'warning',
};

const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  active: { label: '合作中', variant: 'success' },
  inactive: { label: '已停止', variant: 'neutral' },
  blacklisted: { label: '黑名单', variant: 'danger' },
  pending_review: { label: '待审核', variant: 'warning' },
};

const CHECK_STATUS_MAP: Record<StockCheckStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  pending: { label: '待盘点', variant: 'neutral' },
  in_progress: { label: '盘点中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  verified: { label: '已核验', variant: 'info' },
  discrepancy: { label: '有差异', variant: 'danger' },
};

// ---- Mock 数据 ----

function generateInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const names = [
    '经典游戏币', '大号娃娃-熊', '中号娃娃-兔', '小号娃娃-猫', '盲盒-动漫',
    '可乐(罐装)', '矿泉水', '薯片', '巧克力', '棒棒糖',
    '清洁剂', '垃圾袋', '卫生纸', '消毒液', '手套',
    '收银纸卷', '笔', '文件夹', '胶带', '便签纸',
    '电源适配器', 'USB数据线', '按键模组', '保险管', '螺丝套装',
    '促销单页', '展架海报', '气球', '礼品袋', '优惠券印刷',
    'VIP会员卡', '积分兑换礼品', '生日礼品', '纪念徽章', '钥匙扣',
  ];

  const categories = ['游戏币/代币', '娃娃/礼品', '零食饮料', '清洁用品', '办公用品', '设备配件', '促销物料', '会员礼品'];

  names.forEach((name, idx) => {
    const batch = Math.random() > 0.5 ? `BATCH-${2026}-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}` : '';
    const max = 100 + Math.floor(Math.random() * 900);
    const min = 10 + Math.floor(Math.random() * 40);
    const current = Math.floor(Math.random() * max);
    const sellingP = 5 + Math.random() * 100;
    const costP = sellingP * (0.3 + Math.random() * 0.3);

    items.push({
      id: `INV-${String(idx + 1).padStart(4, '0')}`,
      sku: `SKU-${String(1000 + idx)}`,
      name,
      category: categories[idx % categories.length]!,
      brand: ['自有', '可口可乐', '乐事', '德芙', '3M', '得力', '小米'][Math.floor(Math.random() * 7)],
      unit: ['个', '箱', '袋', '瓶', '卷', '盒', '套'][Math.floor(Math.random() * 7)],
      totalQty: current,
      availableQty: Math.max(0, current - Math.floor(Math.random() * Math.min(current, 20))),
      reservedQty: Math.floor(Math.random() * Math.min(current, 15)),
      minStock: min,
      maxStock: max,
      reorderPoint: min + Math.floor(Math.random() * 30),
      costPrice: Math.round(costP * 100) / 100,
      sellingPrice: Math.round(sellingP * 100) / 100,
      margin: Math.round(((sellingP - costP) / sellingP) * 100 * 10) / 10,
      status: current === 0 ? 'out_of_stock' :
              current < min ? 'low_stock' :
              current > max * 0.9 ? 'overstock' : 'in_stock',
      location: ['A区', 'B区', 'C区', 'D区', '仓库A', '仓库B', '前厅'][Math.floor(Math.random() * 7)],
      supplier: SUPPLIER_NAMES[Math.floor(Math.random() * SUPPLIER_NAMES.length)]!,
      batchNo: batch,
      expiryDate: Math.random() > 0.7 ? new Date(Date.now() + Math.floor(Math.random() * 365) * 86400000).toISOString().split('T')[0] : null,
      lastStockTake: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
      turnoverDays: 3 + Math.floor(Math.random() * 30),
      warehouseRack: `RACK-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${String(Math.floor(Math.random() * 20)).padStart(2, '0')}`,
      image: '',
    });
  });
  return items;
}

function generateMovements(inventory: InventoryItem[]): StockMovement[] {
  const moves: StockMovement[] = [];
  const types: StockMovementType[] = ['purchase_in', 'sale_out', 'transfer_in', 'transfer_out', 'damage_out', 'adjustment'];
  const startDate = new Date(2026, 4, 1);
  const endDate = new Date(2026, 6, 11);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const count = 2 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const item = inventory[Math.floor(Math.random() * inventory.length)]!;
      const type = types[Math.floor(Math.random() * types.length)];
      const qty = type.includes('in') ? 5 + Math.floor(Math.random() * 50) : 1 + Math.floor(Math.random() * 10);
      moves.push({
        id: `MOV-${d.toISOString().split('T')[0].replace(/-/g, '')}-${String(i).padStart(2, '0')}`,
        date: d.toISOString().split('T')[0],
        sku: item.sku,
        name: item.name,
        type,
        quantity: qty,
        beforeQty: item.totalQty,
        afterQty: type.includes('in') ? item.totalQty + qty : item.totalQty - qty,
        operator: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)]!,
        referenceNo: `REF-${d.toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        reason: type === 'purchase_in' ? '供应商补货' :
                type === 'sale_out' ? '顾客购买' :
                type === 'transfer_in' ? '其他门店调拨' :
                type === 'transfer_out' ? '调拨至其他门店' :
                type === 'damage_out' ? '运输损耗' : '盘点调整',
        cost: Math.round(item.costPrice * qty * 100) / 100,
        status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'cancelled',
      });
    }
  }
  return moves.sort((a, b) => b.date.localeCompare(a.date));
}

function generateStockChecks(): StockCheck[] {
  const areas = ['A区', 'B区', 'C区', 'D区', '仓库A', '仓库B', '全部货架'];
  const checks: StockCheck[] = [];
  const startDate = new Date(2026, 3, 1);

  for (let i = 0; i < 20; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 5);
    const itemCount = 10 + Math.floor(Math.random() * 40);
    const expected = itemCount;
    const actual = expected - Math.floor(Math.random() * 3) + Math.floor(Math.random() * 2);
    const disc = Math.abs(expected - actual);

    checks.push({
      id: `CHK-${String(i + 1).padStart(3, '0')}`,
      date: date.toISOString().split('T')[0],
      checker: ['王五', '赵六', '张三', '李四'][Math.floor(Math.random() * 4)]!,
      area: areas[Math.floor(Math.random() * areas.length)]!,
      itemCount,
      expectedCount: expected,
      actualCount: actual,
      discrepancyCount: disc,
      discrepancyValue: Math.round(disc * (5 + Math.random() * 50) * 100) / 100,
      status: disc > 0 ? 'discrepancy' : 'completed',
      notes: disc > 0 ? '发现差异，需二次核验' : '盘点正常',
    });
  }
  return checks.sort((a, b) => b.date.localeCompare(a.date));
}

function generateSuppliers(): SupplierInfo[] {
  return SUPPLIER_NAMES.map((name, idx) => ({
    id: `SUP-${String(idx + 1).padStart(3, '0')}`,
    name,
    contactPerson: ['张经理', '李总', '王总监', '赵主管', '陈先生', '林老板', '黄总', '刘经理', '周女士', '吴经理'][idx]!,
    phone: `1${3 + Math.floor(Math.random() * 7)}8${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    email: `supplier${idx + 1}@example.com`,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!,
    status: Math.random() > 0.15 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'pending_review',
    rating: 3 + Math.floor(Math.random() * 3),
    totalOrders: 5 + Math.floor(Math.random() * 50),
    totalAmount: Math.round((5000 + Math.random() * 95000) * 100) / 100,
    lastOrderDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000).toISOString().split('T')[0],
    paymentTerms: ['月结30天', '月结60天', '货到付款', '预付30%', '周结'][Math.floor(Math.random() * 5)]!,
    deliveryDays: 1 + Math.floor(Math.random() * 7),
    notes: '',
  }));
}

let inventoryCache: InventoryItem[] | null = null;
let movementCache: StockMovement[] | null = null;
let checkCache: StockCheck[] | null = null;
let supplierCache: SupplierInfo[] | null = null;

function getInventory(): InventoryItem[] {
  if (!inventoryCache) inventoryCache = generateInventory();
  return inventoryCache;
}

function getMovements(): StockMovement[] {
  if (!movementCache) movementCache = generateMovements(getInventory());
  return movementCache;
}

function getChecks(): StockCheck[] {
  if (!checkCache) checkCache = generateStockChecks();
  return checkCache;
}

function getSuppliers(): SupplierInfo[] {
  if (!supplierCache) supplierCache = generateSuppliers();
  return supplierCache;
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- 列定义 ----

function buildInventoryColumns(onRowClick: (item: InventoryItem) => void): DataTableColumn<InventoryItem>[] {
  return [
    {
      key: 'name', title: '商品名称', dataKey: 'name', sortable: true,
      render: (i) => (
        <span onClick={(e) => { e.stopPropagation(); onRowClick(i); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}>
          {i.name}
        </span>
      ),
    },
    { key: 'sku', title: 'SKU', dataKey: 'sku', sortable: true },
    { key: 'category', title: '分类', dataKey: 'category', sortable: true },
    { key: 'unit', title: '单位', dataKey: 'unit', sortable: true },
    { key: 'availableQty', title: '可用库存', dataKey: 'availableQty', sortable: true, align: 'right',
      render: (i) => {
        const color = i.status === 'out_of_stock' ? '#ef4444' : i.status === 'low_stock' ? '#eab308' : i.status === 'overstock' ? '#8b5cf6' : '#22c55e';
        return <span style={{ color, fontWeight: 700 }}>{i.availableQty}</span>;
      }
    },
    { key: 'status', title: '状态', sortable: true, sortValue: (i) => i.status,
      render: (i) => <StatusBadge label={INVENTORY_STATUS_MAP[i.status].label} variant={INVENTORY_STATUS_MAP[i.status].variant} size="sm" dot /> },
    { key: 'sellingPrice', title: '售价', dataKey: 'sellingPrice', sortable: true, align: 'right',
      render: (i) => formatMoney(i.sellingPrice) },
    { key: 'margin', title: '利润率', dataKey: 'margin', sortable: true, align: 'right',
      render: (i) => <span style={{ color: i.margin > 50 ? '#22c55e' : i.margin > 30 ? '#3b82f6' : '#eab308' }}>{i.margin}%</span> },
    { key: 'turnoverDays', title: '周转天数', dataKey: 'turnoverDays', sortable: true, align: 'right' },
    { key: 'supplier', title: '供应商', dataKey: 'supplier', sortable: true },
    { key: 'location', title: '位置', dataKey: 'location', sortable: true },
  ];
}

// ---- 主页面 ----

export default function StoreInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const inventory = useMemo(() => getInventory(), []);
  const movements = useMemo(() => getMovements(), []);
  const checks = useMemo(() => getChecks(), []);
  const suppliers = useMemo(() => getSuppliers(), []);
  const [tab, setTab] = useState<'inventory' | 'movements' | 'checks' | 'suppliers'>('inventory');

  const stats = useMemo(() => ({
    total: inventory.length,
    totalValue: inventory.reduce((s, i) => s + i.availableQty * i.costPrice, 0),
    lowStock: inventory.filter(i => i.status === 'low_stock').length,
    outOfStock: inventory.filter(i => i.status === 'out_of_stock').length,
    overstock: inventory.filter(i => i.status === 'overstock').length,
    avgTurnover: Math.round(inventory.reduce((s, i) => s + i.turnoverDays, 0) / inventory.length),
    totalCost: inventory.reduce((s, i) => s + i.totalQty * i.costPrice, 0),
  }), [inventory]);

  const searchFields = useMemo<(keyof InventoryItem)[]>(() => ['name', 'sku', 'category', 'brand', 'supplier', 'location'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(inventory, searchFields);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [catFilter, setCatFilter] = useState<string>('ALL');

  const catFiltered = useMemo(() => catFilter === 'ALL' ? filteredItems : filteredItems.filter(i => i.category === catFilter), [filteredItems, catFilter]);
  const statusFiltered = useMemo(() => statusFilter === 'ALL' ? catFiltered : catFiltered.filter(i => i.status === statusFilter), [catFiltered, statusFilter]);

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const handleRowClick = useCallback((item: InventoryItem) => setSelectedItem(item), []);
  const columns = useMemo(() => buildInventoryColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 15 });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, catFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  const categories = useMemo(() => [...new Set(inventory.map(i => i.category))], [inventory]);
  const pendingCheck = checks.filter(c => c.status === 'pending' || c.status === 'in_progress' || c.status === 'discrepancy');
  const recentMoves = movements.slice(0, 10);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '库存管理' })} />
      <PageShell title="库存管理" subtitle="商品管理 · 出入库 · 盘点 · 供应商 · 预警">
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>库存商品总数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>总成本: {formatMoney(stats.totalCost)}</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>库存预警</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.lowStock + stats.outOfStock}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>
              缺货: {stats.outOfStock} · 偏低: {stats.lowStock}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>库存价值</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{formatMoney(stats.totalValue)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>可用库存</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均周转</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: stats.avgTurnover < 15 ? '#22c55e' : '#eab308' }}>
              {stats.avgTurnover} 天
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>周转越快利润越高</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'inventory', label: `📦 库存清单 (${inventory.length})` },
              { key: 'movements', label: `🔄 出入记录 (${movements.length})` },
              { key: 'checks', label: `🔍 盘点管理 (${checks.length})` },
              { key: 'suppliers', label: `🏭 供应商 (${suppliers.length})` },
            ]}
            activeKey={tab} onChange={(t) => setTab(t as typeof tab)}
            variant="pills"
          />
        </div>

        {tab === 'inventory' && (
          <>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索商品名称/SKU/分类/供应商..." />
            <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>分类</div>
                <Tabs items={[{ key: 'ALL', label: '全部', count: filteredItems.length }, ...categories.map(c => ({ key: c, label: c, count: filteredItems.filter(i => i.category === c).length }))]}
                  activeKey={catFilter} onChange={setCatFilter} variant="pills" size="sm" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>状态</div>
                <Tabs items={[
                  { key: 'ALL', label: '全部', count: catFiltered.length },
                  ...(['in_stock', 'low_stock', 'out_of_stock', 'overstock', 'damaged'] as InventoryStatus[]).map(s => ({
                    key: s, label: INVENTORY_STATUS_MAP[s].label, count: catFiltered.filter(i => i.status === s).length,
                  })),
                ]} activeKey={statusFilter} onChange={setStatusFilter} variant="pills" size="sm" />
              </div>
            </div>

            <DataTable title={`库存清单（${sortedItems.length} 条）`} columns={columns} items={pageItems} rowKey={(i) => i.id}
              sort={sortConfig} onSortChange={setSortConfig} striped compact />
            <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sortedItems.length}
              onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
          </>
        )}

        {tab === 'movements' && (
          <>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>出库总笔数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                  {movements.filter(m => m.type.includes('out')).length}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>入库总笔数</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {movements.filter(m => m.type.includes('in')).length}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>总变动成本</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {formatMoney(movements.reduce((s, m) => s + (m.type.includes('in') ? m.cost : -m.cost), 0))}
                </div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>日期</th>
                  <th style={thStyle}>商品</th>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>类型</th>
                  <th style={thStyle}>数量</th>
                  <th style={thStyle}>变动前</th>
                  <th style={thStyle}>变动后</th>
                  <th style={thStyle}>成本</th>
                  <th style={thStyle}>操作人</th>
                  <th style={thStyle}>参考号</th>
                </tr>
              </thead>
              <tbody>
                {recentMoves.map(m => (
                  <tr key={m.id}>
                    <td style={tdStyle}>{m.date}</td>
                    <td style={tdStyle}>{m.name}</td>
                    <td style={tdStyle}>{m.sku}</td>
                    <td style={tdStyle}>
                      <StatusBadge label={MOVEMENT_TYPE_LABELS[m.type]} variant={MOVEMENT_TYPE_VARIANTS[m.type]} size="sm" />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: m.type.includes('in') ? '#22c55e' : '#ef4444' }}>
                      {m.type.includes('in') ? '+': '-'}{m.quantity}
                    </td>
                    <td style={tdStyle}>{m.beforeQty}</td>
                    <td style={tdStyle}>{m.afterQty}</td>
                    <td style={tdStyle}>{formatMoney(m.cost)}</td>
                    <td style={tdStyle}>{m.operator}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{m.referenceNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'checks' && (
          <>
            {pendingCheck.length > 0 && (
              <section style={panelStyle}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>待处理盘点</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {pendingCheck.slice(0, 5).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.area} · {c.date}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{c.checker} · {c.itemCount}项 · 差异¥{c.discrepancyValue}</div>
                      </div>
                      <StatusBadge label={CHECK_STATUS_MAP[c.status].label} variant={CHECK_STATUS_MAP[c.status].variant} size="sm" dot />
                    </div>
                  ))}
                </div>
              </section>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>盘点编号</th>
                  <th style={thStyle}>日期</th>
                  <th style={thStyle}>盘点人</th>
                  <th style={thStyle}>区域</th>
                  <th style={thStyle}>品项数</th>
                  <th style={thStyle}>应盘</th>
                  <th style={thStyle}>实盘</th>
                  <th style={thStyle}>差异数</th>
                  <th style={thStyle}>差异金额</th>
                  <th style={thStyle}>状态</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 15).map(c => (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.id}</td>
                    <td style={tdStyle}>{c.date}</td>
                    <td style={tdStyle}>{c.checker}</td>
                    <td style={tdStyle}>{c.area}</td>
                    <td style={tdStyle}>{c.itemCount}</td>
                    <td style={tdStyle}>{c.expectedCount}</td>
                    <td style={tdStyle}>{c.actualCount}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: c.discrepancyCount > 0 ? '#ef4444' : '#22c55e' }}>{c.discrepancyCount}</td>
                    <td style={tdStyle}>{formatMoney(c.discrepancyValue)}</td>
                    <td style={tdStyle}><StatusBadge label={CHECK_STATUS_MAP[c.status].label} variant={CHECK_STATUS_MAP[c.status].variant} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'suppliers' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {suppliers.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.contactPerson} · {s.phone}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.category} · {s.paymentTerms} · 发货{s.deliveryDays}天</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{formatMoney(s.totalAmount)}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.totalOrders} 笔订单</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.rating >= 4 ? '#22c55e' : s.rating >= 3 ? '#eab308' : '#ef4444' }}>
                    {'⭐'.repeat(s.rating)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>评分</div>
                </div>
                <div>
                  {['active', 'inactive', 'pending_review', 'blacklisted'].map(st => {
                    if (s.status !== st) return null;
                    return <StatusBadge key={st} label={SUPPLIER_STATUS_MAP[s.status].label}
                      variant={SUPPLIER_STATUS_MAP[s.status].variant} size="sm" dot />;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 16, padding: 24,
  background: 'rgba(15,23,42,0.35)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 24,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16, padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  color: '#94a3b8', fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#e2e8f0', fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
};
