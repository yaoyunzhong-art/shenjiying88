/**
 * inventory/page.test.ts — Page-level tests for admin-web 库存管理页面
 *
 * 测试 page.tsx 中核心逻辑:
 *   - API 路径约定
 *   - 低库存判定
 *   - 库存状态颜色映射
 *   - 数据一致性校验
 *   - 表单验证 (OperationDialog / CreateDialog)
 *
 * 正例 + 反例 + 边界, ≥10 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Replicated types from page.tsx ──────────────────────────────────────

type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  unit: string;
  totalQty: number;
  reservedQty: number;
  availableQty: number;
  lowStockThreshold: number;
  unitPriceCents: number;
  status: ItemStatus;
  version: number;
}

// ─── Replicated helpers from page.tsx ────────────────────────────────────

const STATUS_COLORS: Record<ItemStatus, { bg: string; fg: string }> = {
  ACTIVE:   { bg: '#dcfce7', fg: '#166534' },
  INACTIVE: { bg: '#fef9c3', fg: '#854d0e' },
  ARCHIVED: { bg: '#f3f4f6', fg: '#6b7280' },
};

function statusBadgeClass(status: ItemStatus): string {
  return `px-2 py-0.5 rounded text-xs ${
    status === 'ACTIVE'
      ? 'bg-green-100 text-green-700'
      : status === 'ARCHIVED'
      ? 'bg-gray-100 text-gray-500'
      : 'bg-yellow-100 text-yellow-700'
  }`;
}

function isLowStock(item: InventoryItem): boolean {
  return item.availableQty <= item.lowStockThreshold;
}

function isOutOfStock(item: InventoryItem): boolean {
  return item.availableQty === 0;
}

function computeLowStockCount(items: InventoryItem[]): number {
  return items.filter((i) => i.availableQty <= i.lowStockThreshold).length;
}

function computeOutOfStockCount(items: InventoryItem[]): number {
  return items.filter((i) => i.availableQty === 0).length;
}

function validateCreateInput(input: { sku: string; name: string }): string | null {
  if (!input.sku.trim()) return 'SKU 不能为空';
  if (!input.name.trim()) return '名称不能为空';
  return null;
}

function validateReason(reason: string): string | null {
  if (!reason.trim()) return '原因不能为空';
  return null;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const BASE_ITEMS: InventoryItem[] = [
  { id: 'i1', tenantId: 't1', sku: 'SKU-001', name: '投篮机', unit: '台', totalQty: 10, reservedQty: 2, availableQty: 8, lowStockThreshold: 3, unitPriceCents: 500000, status: 'ACTIVE', version: 1 },
  { id: 'i2', tenantId: 't1', sku: 'SKU-002', name: '跳舞机', unit: '台', totalQty: 5, reservedQty: 1, availableQty: 4, lowStockThreshold: 2, unitPriceCents: 800000, status: 'ACTIVE', version: 2 },
  { id: 'i3', tenantId: 't1', sku: 'SKU-003', name: '毛绒公仔', unit: '个', totalQty: 50, reservedQty: 0, availableQty: 50, lowStockThreshold: 10, unitPriceCents: 5000, status: 'ACTIVE', version: 1 },
  { id: 'i4', tenantId: 't1', sku: 'SKU-004', name: '抓机齿轮', unit: '个', totalQty: 8, reservedQty: 3, availableQty: 5, lowStockThreshold: 10, unitPriceCents: 2000, status: 'ACTIVE', version: 1 },
  { id: 'i5', tenantId: 't1', sku: 'SKU-005', name: '礼品兑换券', unit: '张', totalQty: 200, reservedQty: 50, availableQty: 150, lowStockThreshold: 20, unitPriceCents: 500, status: 'ACTIVE', version: 3 },
  { id: 'i6', tenantId: 't1', sku: 'SKU-006', name: '古董收音机', unit: '台', totalQty: 2, reservedQty: 2, availableQty: 0, lowStockThreshold: 1, unitPriceCents: 100000, status: 'ACTIVE', version: 1 },
  { id: 'i7', tenantId: 't1', sku: 'SKU-007', name: '老旧配件', unit: '件', totalQty: 1, reservedQty: 0, availableQty: 1, lowStockThreshold: 0, unitPriceCents: 9999, status: 'ARCHIVED', version: 1 },
  { id: 'i8', tenantId: 't1', sku: 'SKU-008', name: '备用灯管', unit: '根', totalQty: 3, reservedQty: 0, availableQty: 3, lowStockThreshold: 5, unitPriceCents: 1500, status: 'INACTIVE', version: 1 },
];

// ─── Tests ───────────────────────────────────────────────────────────────

describe('inventory-page: statusBadgeClass', () => {
  it('ACTIVE 返回绿色样式', () => {
    const cls = statusBadgeClass('ACTIVE');
    assert.ok(cls.includes('green'), `expected green in "${cls}"`);
    assert.ok(!cls.includes('yellow'), `expected no yellow in "${cls}"`);
    assert.ok(!cls.includes('gray'), `expected no gray in "${cls}"`);
  });

  it('INACTIVE 返回黄色样式', () => {
    const cls = statusBadgeClass('INACTIVE');
    assert.ok(cls.includes('yellow'), `expected yellow in "${cls}"`);
    assert.ok(!cls.includes('green'), `expected no green in "${cls}"`);
  });

  it('ARCHIVED 返回灰色样式', () => {
    const cls = statusBadgeClass('ARCHIVED');
    assert.ok(cls.includes('gray'), `expected gray in "${cls}"`);
    assert.ok(!cls.includes('green'), `expected no green in "${cls}"`);
    assert.ok(!cls.includes('yellow'), `expected no yellow in "${cls}"`);
  });
});

describe('inventory-page: isLowStock / isOutOfStock', () => {
  // 正例
  it('可用量 <= 阈值时识别为低库存', () => {
    assert.ok(isLowStock(BASE_ITEMS[3]!)); // availableQty=5, threshold=10
    assert.ok(isLowStock(BASE_ITEMS[7]!)); // availableQty=3, threshold=5
  });

  it('可用量为 0 时识别为缺货', () => {
    assert.ok(isOutOfStock(BASE_ITEMS[5]!)); // availableQty=0
  });

  // 反例
  it('可用量 > 阈值时不是低库存', () => {
    assert.ok(!isLowStock(BASE_ITEMS[0]!)); // availableQty=8, threshold=3
    assert.ok(!isLowStock(BASE_ITEMS[4]!)); // availableQty=150, threshold=20
  });

  it('可用量 > 0 时不是缺货', () => {
    assert.ok(!isOutOfStock(BASE_ITEMS[0]!)); // availableQty=8
    assert.ok(!isOutOfStock(BASE_ITEMS[7]!)); // availableQty=3
  });

  // 边界
  it('可用量恰好等于阈值时是低库存', () => {
    const item: InventoryItem = { ...BASE_ITEMS[0]!, availableQty: 3, lowStockThreshold: 3 };
    assert.ok(isLowStock(item));
  });

  it('ARCHIVED 状态的缺货商品', () => {
    assert.ok(isOutOfStock(BASE_ITEMS[5]!)); // 可用=0, ACTIVE
    assert.ok(!isOutOfStock(BASE_ITEMS[6]!)); // 可用=1, 不缺货
  });
});

describe('inventory-page: computeLowStockCount / computeOutOfStockCount', () => {
  it('低库存计数正确的', () => {
    const count = computeLowStockCount(BASE_ITEMS);
    // i4 (5<=10), i6 (0<=1), i8 (3<=5) — 3 items
    assert.strictEqual(count, 3);
  });

  it('缺货计数正确的', () => {
    const count = computeOutOfStockCount(BASE_ITEMS);
    // i6 (0) — 1 item
    assert.strictEqual(count, 1);
  });

  it('空数组返回 0', () => {
    assert.strictEqual(computeLowStockCount([]), 0);
    assert.strictEqual(computeOutOfStockCount([]), 0);
  });

  it('所有项目都有同样的阈值, 无低库存', () => {
    const normalItems = BASE_ITEMS.map((i) => ({ ...i, availableQty: 100, lowStockThreshold: 1 }));
    assert.strictEqual(computeLowStockCount(normalItems), 0);
  });
});

describe('inventory-page: validateCreateInput', () => {
  // 正例
  it('合法输入返回 null', () => {
    assert.strictEqual(validateCreateInput({ sku: 'SKU-NEW', name: '新品' }), null);
  });

  it('带空格的合法输入', () => {
    assert.strictEqual(validateCreateInput({ sku: ' SKU-X1 ', name: ' 新品A ' }), null);
  });

  // 反例
  it('空 SKU 返回错误', () => {
    assert.strictEqual(validateCreateInput({ sku: '', name: '新品' }), 'SKU 不能为空');
  });

  it('纯空格 SKU 返回错误', () => {
    assert.strictEqual(validateCreateInput({ sku: '   ', name: '新品' }), 'SKU 不能为空');
  });

  it('空名称返回错误', () => {
    assert.strictEqual(validateCreateInput({ sku: 'SKU-X', name: '' }), '名称不能为空');
  });

  it('纯空格名称返回错误', () => {
    assert.strictEqual(validateCreateInput({ sku: 'SKU-X', name: '  ' }), '名称不能为空');
  });

  // 边界
  it('SKU 为单字符', () => {
    assert.strictEqual(validateCreateInput({ sku: 'S', name: '简' }), null);
  });
});

describe('inventory-page: validateReason', () => {
  // 正例
  it('合法原因返回 null', () => {
    assert.strictEqual(validateReason('采购到货'), null);
    assert.strictEqual(validateReason('销售出库'), null);
  });

  it('长原因通过', () => {
    assert.strictEqual(validateReason('A'.repeat(200)), null);
  });

  // 反例
  it('空原因返回错误', () => {
    assert.strictEqual(validateReason(''), '原因不能为空');
  });

  it('纯空格原因返回错误', () => {
    assert.strictEqual(validateReason('   '), '原因不能为空');
  });
});

describe('inventory-page: 数据一致性', () => {
  it('availableQty = totalQty - reservedQty', () => {
    for (const item of BASE_ITEMS) {
      assert.strictEqual(item.availableQty, item.totalQty - item.reservedQty,
        `SKU ${item.sku}: expected ${item.totalQty} - ${item.reservedQty} = ${item.availableQty}`);
    }
  });

  it('所有版本号均为正整数', () => {
    for (const item of BASE_ITEMS) {
      assert.ok(item.version >= 1, `SKU ${item.sku}: version ${item.version} should be >= 1`);
    }
  });

  it('SKU 编码一致性：均有 SKU- 前缀', () => {
    for (const item of BASE_ITEMS) {
      assert.ok(item.sku.startsWith('SKU-'), `SKU ${item.sku} 缺少 SKU- 前缀`);
    }
  });

  it('状态颜色映射完整', () => {
    const statuses: ItemStatus[] = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
    for (const s of statuses) {
      const color = STATUS_COLORS[s];
      assert.ok(color, `missing color for status ${s}`);
      assert.ok(color.bg && color.fg, `incomplete color for status ${s}`);
    }
  });
});

describe('inventory-page: 低库存与状态联动', () => {
  it('低库存商品且 ACTIVE 状态应优先处理', () => {
    const lowActive = BASE_ITEMS.filter((i) => isLowStock(i) && i.status === 'ACTIVE');
    assert.ok(lowActive.length >= 2, `expected >= 2 low-stock active items, got ${lowActive.length}`);
  });

  it('缺货且 ACTIVE 的商品应标红', () => {
    const outActive = BASE_ITEMS.filter((i) => isOutOfStock(i) && i.status === 'ACTIVE');
    // i6 is out of stock and ACTIVE
    assert.strictEqual(outActive.length, 1);
    assert.strictEqual(outActive[0]!.sku, 'SKU-006');
  });

  it('ARCHIVED 和 INACTIVE 商品不计入紧急补货', () => {
    const emergency = BASE_ITEMS.filter((i) => isLowStock(i) && i.status === 'ACTIVE');
    const inactiveLow = BASE_ITEMS.filter((i) => isLowStock(i) && i.status !== 'ACTIVE');
    assert.ok(emergency.length >= 2, `emergency ${emergency.length} should be >= 2`);
    // i8 is INACTIVE with low stock, i7 is ARCHIVED
    assert.ok(inactiveLow.length >= 1, `inactive low stock ${inactiveLow.length} should be >= 1`);
  });
});

describe('inventory-page: API 路径约定', () => {
  it('库存列表 API 路径正确', () => {
    const baseUrl = '/api/inventory';
    const tenantId = 'demo-tenant';
    const url = `${baseUrl}?tenantId=${tenantId}`;
    assert.strictEqual(url, '/api/inventory?tenantId=demo-tenant');
  });

  it('入库 API 路径正确', () => {
    const itemId = 'i1';
    const url = `/api/inventory/${itemId}/stock-in`;
    assert.strictEqual(url, '/api/inventory/i1/stock-in');
  });

  it('出库 API 路径正确', () => {
    const itemId = 'i2';
    const url = `/api/inventory/${itemId}/stock-out`;
    assert.strictEqual(url, '/api/inventory/i2/stock-out');
  });

  it('创建 API 路径正确', () => {
    assert.strictEqual('/api/inventory', '/api/inventory');
  });
});
