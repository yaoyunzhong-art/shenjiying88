// @ts-nocheck
'use client'

/**
 * 库存管理 — Inventory
 *
 * 商品库存管理与预警配置：
 * - 库存概览：总库存/低库存/预警/缺货
 * - 库存列表：SKU/品类/库存量/预警阈值
 * - 库存操作：入库/出库/盘点
 */

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  DataTable,
  StatCard,
  StatusBadge,
  SearchFilterInput,
  useSearchFilter,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reserved: number;
  available: number;
  minThreshold: number;
  maxThreshold: number;
  status: InventoryStatus;
  unit: string;
  location: string;
  updatedAt: string;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'INV-001', sku: 'SKU-1001', name: '游戏币(100枚)', category: '游戏币', quantity: 15000, reserved: 2300, available: 12700, minThreshold: 5000, maxThreshold: 30000, status: 'in_stock', unit: '枚', location: 'A-01-01', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-002', sku: 'SKU-1002', name: '会员卡(月卡)', category: '会员卡', quantity: 500, reserved: 80, available: 420, minThreshold: 200, maxThreshold: 1000, status: 'in_stock', unit: '张', location: 'B-03-02', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-003', sku: 'SKU-1003', name: '会员卡(季卡)', category: '会员卡', quantity: 120, reserved: 15, available: 105, minThreshold: 50, maxThreshold: 500, status: 'in_stock', unit: '张', location: 'B-03-03', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-004', sku: 'SKU-1004', name: '会员卡(年卡)', category: '会员卡', quantity: 45, reserved: 5, available: 40, minThreshold: 30, maxThreshold: 200, status: 'in_stock', unit: '张', location: 'B-03-04', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-005', sku: 'SKU-2001', name: '抓娃娃币', category: '游戏币', quantity: 8000, reserved: 1200, available: 6800, minThreshold: 3000, maxThreshold: 20000, status: 'in_stock', unit: '枚', location: 'A-01-02', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-006', sku: 'SKU-3001', name: '扭蛋(小)', category: '奖品', quantity: 300, reserved: 50, available: 250, minThreshold: 100, maxThreshold: 600, status: 'in_stock', unit: '个', location: 'C-01-01', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-007', sku: 'SKU-3002', name: '扭蛋(大)', category: '奖品', quantity: 80, reserved: 20, available: 60, minThreshold: 50, maxThreshold: 200, status: 'in_stock', unit: '个', location: 'C-01-02', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-008', sku: 'SKU-4001', name: '娃娃(中号)', category: '毛绒玩具', quantity: 35, reserved: 10, available: 25, minThreshold: 50, maxThreshold: 200, status: 'low_stock', unit: '只', location: 'D-02-01', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-009', sku: 'SKU-4002', name: '娃娃(大号)', category: '毛绒玩具', quantity: 12, reserved: 8, available: 4, minThreshold: 30, maxThreshold: 150, status: 'low_stock', unit: '只', location: 'D-02-02', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-010', sku: 'SKU-5001', name: '限定手办A', category: '限定商品', quantity: 0, reserved: 0, available: 0, minThreshold: 10, maxThreshold: 50, status: 'out_of_stock', unit: '个', location: 'E-01-01', updatedAt: '2026-07-15 18:00' },
  { id: 'INV-011', sku: 'SKU-6001', name: '饮料(可乐)', category: '饮品', quantity: 240, reserved: 20, available: 220, minThreshold: 50, maxThreshold: 300, status: 'in_stock', unit: '瓶', location: 'F-01-01', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-012', sku: 'SKU-6002', name: '饮料(矿泉水)', category: '饮品', quantity: 180, reserved: 15, available: 165, minThreshold: 50, maxThreshold: 200, status: 'in_stock', unit: '瓶', location: 'F-01-02', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-013', sku: 'SKU-7001', name: '维修配件包', category: '配件', quantity: 25, reserved: 5, available: 20, minThreshold: 20, maxThreshold: 100, status: 'low_stock', unit: '套', location: 'G-01-01', updatedAt: '2026-07-15 14:00' },
  { id: 'INV-014', sku: 'SKU-8001', name: '优惠券(5元)', category: '优惠券', quantity: 2000, reserved: 800, available: 1200, minThreshold: 500, maxThreshold: 5000, status: 'in_stock', unit: '张', location: 'H-01-01', updatedAt: '2026-07-16 10:30' },
  { id: 'INV-015', sku: 'SKU-8002', name: '优惠券(10元)', category: '优惠券', quantity: 1000, reserved: 350, available: 650, minThreshold: 300, maxThreshold: 3000, status: 'in_stock', unit: '张', location: 'H-01-02', updatedAt: '2026-07-16 10:30' },
];

// ============================================================
// CSS & 常量
// ============================================================

const STATUS_MAP: Record<InventoryStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  in_stock: { label: '正常', variant: 'success' },
  low_stock: { label: '低库存', variant: 'warning' },
  out_of_stock: { label: '缺货', variant: 'danger' },
  overstocked: { label: '过剩', variant: 'info' },
};

const CARD_STYLE: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 20,
};

// ============================================================
// 主页面
// ============================================================

export default function InventoryPage() {
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig>({ key: 'name', dir: 'asc' });

  // 统计
  const stats = useMemo(() => {
    const total = MOCK_INVENTORY.length;
    const lowStock = MOCK_INVENTORY.filter(i => i.status === 'low_stock').length;
    const outOfStock = MOCK_INVENTORY.filter(i => i.status === 'out_of_stock').length;
    const totalQty = MOCK_INVENTORY.reduce((s, i) => s + i.quantity, 0);
    const totalAvailable = MOCK_INVENTORY.reduce((s, i) => s + i.available, 0);
    return { total, lowStock, outOfStock, totalQty, totalAvailable, inStock: MOCK_INVENTORY.filter(i => i.status === 'in_stock').length };
  }, []);

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_INVENTORY, ['name', 'sku', 'category']);
  const sorted = useSortedItems(filteredItems, ['id'], sortConfig);
  const { page, setPage, totalPages, pageItems } = usePagination(sorted, 10);

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: 'name', title: '商品名称', sortable: true, render: i => <><span style={{ color: '#94a3b8', fontSize: 11, marginRight: 6 }}>{i.sku}</span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{i.name}</span></> },
    { key: 'category', title: '品类', sortable: true, render: i => <StatusBadge label={i.category} variant="info" size="sm" /> },
    { key: 'quantity', title: '库存量', sortable: true, render: i => `${i.quantity} ${i.unit}` },
    { key: 'available', title: '可用', sortable: true, render: i => `${i.available} ${i.unit}` },
    { key: 'minThreshold', title: '预警阈值', render: i => `${i.minThreshold}/${i.maxThreshold}` },
    { key: 'status', title: '库存状态', sortable: true, render: i => <StatusBadge {...STATUS_MAP[i.status]} size="sm" dot /> },
    { key: 'location', title: '库位', render: i => <span style={{ color: '#64748b', fontSize: 12 }}>{i.location}</span> },
    { key: 'updatedAt', title: '更新时间', sortable: true, render: i => <span style={{ color: '#64748b', fontSize: 12 }}>{i.updatedAt}</span> },
  ];

  return (
    <PageShell title="库存管理" subtitle="商品库存管理与预警配置">
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="总SKU数" value={stats.total.toString()} variant="default" />
        <StatCard label="正常" value={stats.inStock.toString()} variant="success" />
        <StatCard label="低库存" value={stats.lowStock.toString()} variant="warning" helper="需及时补货" />
        <StatCard label="缺货" value={stats.outOfStock.toString()} variant="danger" helper="已售罄" />
      </div>

      {/* 库存列表 */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            总库存: <strong style={{ color: '#e2e8f0' }}>{stats.totalQty.toLocaleString()}</strong> {MOCK_INVENTORY[0]?.unit ?? '件'}
            <span style={{ margin: '0 12px', color: 'rgba(148,163,184,0.2)' }}>|</span>
            可用: <strong style={{ color: '#22c55e' }}>{stats.totalAvailable.toLocaleString()}</strong>
          </div>
          <div style={{ width: 250 }}>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索商品/SKU..." />
          </div>
        </div>

        <DataTable
          data={pageItems}
          columns={columns}
          sortable
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          emptyText="暂无库存数据"
        />

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: page === i + 1 ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: page === i + 1 ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部预警 */}
      {stats.lowStock > 0 || stats.outOfStock > 0 ? (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: `rgba(234,179,8,0.08)`, border: '1px solid rgba(234,179,8,0.2)', fontSize: 12, color: '#eab308', lineHeight: 1.6 }}>
          ⚠️ 温馨提示：有 <strong>{stats.lowStock}</strong> 个商品处于低库存状态，<strong>{stats.outOfStock}</strong> 个商品已缺货。建议及时安排补货。
        </div>
      ) : null}
    </PageShell>
  );
}
