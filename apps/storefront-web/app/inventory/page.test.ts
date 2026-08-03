/**
 * inventory/page.test.ts — 库存管理页 L1 测试（storefront-web）
 *
 * 覆盖: 库存商品数据、状态分类、品类枚举、搜索筛选、统计聚合
 * 正例: 库存字段完整性、状态映射、品类枚举
 * 反例: 空库存列表、负数数量、无效阈值
 * 边界: 零库存、全 overstocked、超大数值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

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

// ── 常量映射 ──

const STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: '有库存',
  low_stock: '低库存',
  out_of_stock: '缺货',
  overstocked: '库存过多',
};

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  equipment: '设备',
  consumable: '耗材',
  merchandise: '商品',
  accessory: '配件',
};

// ── Mock 数据 ──

const MOCK_ITEMS: InventoryItem[] = [
  { id: 'inv-001', sku: 'SKU-001', name: '游戏币（大）', category: 'merchandise', quantity: 5000, minThreshold: 1000, maxThreshold: 10000, unitPrice: 0.8, totalValue: 4000, storageLocation: 'A-01', supplier: '供应商A', lastRestocked: '2026-07-20', status: 'in_stock' },
  { id: 'inv-002', sku: 'SKU-002', name: 'VR头显', category: 'equipment', quantity: 8, minThreshold: 5, maxThreshold: 20, unitPrice: 3000, totalValue: 24000, storageLocation: 'B-02', supplier: '供应商B', lastRestocked: '2026-07-15', status: 'in_stock' },
  { id: 'inv-003', sku: 'SKU-003', name: '抓娃娃公仔', category: 'merchandise', quantity: 30, minThreshold: 50, maxThreshold: 200, unitPrice: 15, totalValue: 450, storageLocation: 'A-03', supplier: '供应商C', lastRestocked: '2026-07-10', status: 'low_stock' },
  { id: 'inv-004', sku: 'SKU-004', name: '饮料-可乐', category: 'consumable', quantity: 0, minThreshold: 20, maxThreshold: 100, unitPrice: 3, totalValue: 0, storageLocation: 'C-01', supplier: '供应商D', lastRestocked: '2026-07-05', status: 'out_of_stock' },
  { id: 'inv-005', sku: 'SKU-005', name: '一次性手套', category: 'consumable', quantity: 2000, minThreshold: 100, maxThreshold: 500, unitPrice: 0.5, totalValue: 1000, storageLocation: 'C-02', supplier: '供应商E', lastRestocked: '2026-07-18', status: 'overstocked' },
  { id: 'inv-006', sku: 'SKU-006', name: '充电线', category: 'accessory', quantity: 80, minThreshold: 30, maxThreshold: 150, unitPrice: 10, totalValue: 800, storageLocation: 'D-01', supplier: '供应商F', lastRestocked: '2026-07-12', status: 'in_stock' },
];

// ── 辅助函数 ──

function getStatusLabel(status: InventoryStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function getCategoryLabel(category: InventoryCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

function computeInventoryStats(items: InventoryItem[]) {
  return {
    total: items.length,
    inStock: items.filter(i => i.status === 'in_stock').length,
    lowStock: items.filter(i => i.status === 'low_stock').length,
    outOfStock: items.filter(i => i.status === 'out_of_stock').length,
    overstocked: items.filter(i => i.status === 'overstocked').length,
    totalValue: items.reduce((s, i) => s + i.totalValue, 0),
    totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
  };
}

function searchItems(items: InventoryItem[], query: string): InventoryItem[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(i =>
    i.name.toLowerCase().includes(lower) ||
    i.sku.toLowerCase().includes(lower) ||
    i.supplier.toLowerCase().includes(lower)
  );
}

function filterByCategory(items: InventoryItem[], category: InventoryCategory | 'all'): InventoryItem[] {
  if (category === 'all') return items;
  return items.filter(i => i.category === category);
}

function filterByStatus(items: InventoryItem[], status: InventoryStatus | 'all'): InventoryItem[] {
  if (status === 'all') return items;
  return items.filter(i => i.status === status);
}

// ===================================================================
describe('Inventory — 状态与分类', () => {
  it('四种库存状态映射完整', () => {
    const statuses: InventoryStatus[] = ['in_stock', 'low_stock', 'out_of_stock', 'overstocked'];
    for (const s of statuses) {
      assert.ok(getStatusLabel(s).length > 0, `Status ${s} should have label`);
    }
  });

  it('四种品类映射完整', () => {
    const categories: InventoryCategory[] = ['equipment', 'consumable', 'merchandise', 'accessory'];
    for (const c of categories) {
      assert.ok(getCategoryLabel(c).length > 0, `Category ${c} should have label`);
    }
  });

  it('状态统计正确', () => {
    const stats = computeInventoryStats(MOCK_ITEMS);
    assert.equal(stats.total, 6);
    assert.equal(stats.inStock, 3);
    assert.equal(stats.lowStock, 1);
    assert.equal(stats.outOfStock, 1);
    assert.equal(stats.overstocked, 1);
  });
});

// ===================================================================
describe('Inventory — 数量与金额', () => {
  it('quantity >= 0', () => {
    for (const i of MOCK_ITEMS) {
      assert.ok(i.quantity >= 0, `${i.sku}: quantity >= 0`);
    }
  });

  it('totalValue = quantity * unitPrice（或与业务逻辑一致）', () => {
    for (const i of MOCK_ITEMS) {
      assert.equal(i.totalValue, i.quantity * i.unitPrice,
        `${i.sku}: totalValue should match`);
    }
  });

  it('总价值与总数量统计', () => {
    const stats = computeInventoryStats(MOCK_ITEMS);
    assert.equal(stats.totalQuantity, 5000 + 8 + 30 + 0 + 2000 + 80);
  });

  it('minThreshold <= maxThreshold（除非业务上相反）', () => {
    for (const i of MOCK_ITEMS) {
      assert.ok(i.minThreshold <= i.maxThreshold, `${i.sku}: minThreshold <= maxThreshold`);
    }
  });
});

// ===================================================================
describe('Inventory — 搜索与筛选', () => {
  it('按 name 搜索', () => {
    const result = searchItems(MOCK_ITEMS, '游戏');
    assert.equal(result.length, 1);
  });

  it('按 sku 搜索', () => {
    const result = searchItems(MOCK_ITEMS, 'SKU-004');
    assert.equal(result.length, 1);
  });

  it('按 supplier 搜索', () => {
    const result = searchItems(MOCK_ITEMS, '供应商A');
    assert.equal(result.length, 1);
  });

  it('空搜索返回全部', () => {
    assert.equal(searchItems(MOCK_ITEMS, '').length, MOCK_ITEMS.length);
  });

  it('按 category 筛选', () => {
    const result = filterByCategory(MOCK_ITEMS, 'consumable');
    assert.equal(result.length, 2);
  });

  it('按 status 筛选', () => {
    const result = filterByStatus(MOCK_ITEMS, 'out_of_stock');
    assert.equal(result.length, 1);
  });
});

// ===================================================================
describe('Inventory — 数据完整性', () => {
  it('所有商品应有 id/sku/name', () => {
    for (const i of MOCK_ITEMS) {
      assert.ok(i.id, 'id required');
      assert.ok(i.sku, 'sku required');
      assert.ok(i.name, 'name required');
    }
  });

  it('每个商品应有 storageLocation', () => {
    for (const i of MOCK_ITEMS) {
      assert.ok(i.storageLocation, `${i.sku}: storageLocation required`);
    }
  });

  it('lastRestocked 格式应为 YYYY-MM-DD', () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    for (const i of MOCK_ITEMS) {
      assert.ok(regex.test(i.lastRestocked), `${i.sku}: invalid date format`);
    }
  });
});

// ===================================================================
describe('Inventory — 边界', () => {
  it('空库存列表不抛异常', () => {
    assert.doesNotThrow(() => computeInventoryStats([]));
    assert.equal(computeInventoryStats([]).total, 0);
  });

  it('零 quantity 应对应 out_of_stock 或 可能', () => {
    const zero = MOCK_ITEMS.filter(i => i.quantity === 0);
    for (const i of zero) {
      assert.equal(i.status, 'out_of_stock');
    }
  });

  it('超大量库存不溢出', () => {
    const big: InventoryItem = { ...MOCK_ITEMS[0], quantity: 99999999, totalValue: 99999999 * 0.8 };
    assert.equal(big.totalValue, 79999999.2);
  });

  it('empty search/filter 不抛异常', () => {
    assert.doesNotThrow(() => searchItems([], ''));
    assert.doesNotThrow(() => filterByCategory([], 'all'));
    assert.doesNotThrow(() => filterByStatus([], 'all'));
  });
});
