/**
 * inventory-service.test.ts — 库存管理 Service 层增强测试
 *
 * 覆盖:
 *   - 库存规则管理 (InventoryRule status toggle, scope labels, severity labels, type labels)
 *   - 库存变动 (stock-in, stock-out, batch operations)
 *   - 库存预警 (low stock threshold, severity levels, reorder logic)
 *   - 批次管理 (version tracking, quantity consistency)
 *   - 边界条件与错误处理
 *
 * 正例 + 反例 + 边界, >= 20 个测试用例
 * Using node:test (same pattern as existing inventory.test.ts)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ============================================================
//  Type definitions (replicated from inventory source)
// ============================================================

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
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  version: number;
}

type RuleType = 'ALERT' | 'REORDER';
type RuleStatus = 'ENABLED' | 'DISABLED';

interface InventoryRule {
  id: string;
  tenantId: string;
  type: RuleType;
  name: string;
  description: string;
  scope: 'sku' | 'category' | 'global';
  scopeValue: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  triggerQty: number;
  orderQty: number;
  supplier: string;
  status: RuleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
//  Replicated helper functions
// ============================================================

// -- Stock counting --
function isLowStock(item: InventoryItem): boolean {
  return item.availableQty <= item.lowStockThreshold;
}

function isOutOfStock(item: InventoryItem): boolean {
  return item.availableQty === 0;
}

function lowStockSeverity(item: InventoryItem): 'critical' | 'warning' | 'normal' {
  if (item.availableQty === 0) return 'critical';
  if (item.availableQty <= item.lowStockThreshold * 0.5) return 'critical';
  if (item.availableQty <= item.lowStockThreshold) return 'warning';
  return 'normal';
}

function computeLowStockCount(items: InventoryItem[]): number {
  return items.filter((i) => i.availableQty <= i.lowStockThreshold).length;
}

function computeOutOfStockCount(items: InventoryItem[]): number {
  return items.filter((i) => i.availableQty === 0).length;
}

function calculateTotalValue(items: InventoryItem[]): number {
  return items.reduce((sum, i) => sum + i.availableQty * i.unitPriceCents, 0);
}

// -- Stock operations --
function stockIn(item: InventoryItem, qty: number): InventoryItem {
  const newTotal = item.totalQty + qty;
  const newAvailable = item.availableQty + qty;
  return {
    ...item,
    totalQty: newTotal,
    availableQty: newAvailable,
    version: item.version + 1,
  };
}

function stockOut(item: InventoryItem, qty: number): InventoryItem | string {
  if (qty <= 0) return '出库数量必须大于 0';
  if (item.availableQty < qty) return `可用库存不足: 当前 ${item.availableQty}, 需要 ${qty}`;
  const newTotal = item.totalQty - qty;
  const newAvailable = item.availableQty - qty;
  return {
    ...item,
    totalQty: newTotal,
    availableQty: newAvailable,
    version: item.version + 1,
  };
}

function toggleItemStatus(item: InventoryItem): InventoryItem {
  const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : item.status === 'INACTIVE' ? 'ACTIVE' : 'ARCHIVED';
  return { ...item, status: newStatus, version: item.version + 1 };
}

// -- Validation --
function validateCreateItem(input: {
  sku: string; name: string; totalQty: number; unitPriceCents: number;
}): string | null {
  if (!input.sku.trim()) return 'SKU 不能为空';
  if (!input.name.trim()) return '商品名称不能为空';
  if (input.totalQty < 0) return '总数量不能为负数';
  if (input.unitPriceCents < 0) return '单价不能为负数';
  if (input.totalQty === 0) return '总数量不能为 0';
  return null;
}

function validateReason(reason: string): string | null {
  if (!reason.trim()) return '原因不能为空';
  return null;
}

// -- Rule helpers --
const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const SCOPE_LABELS: Record<string, string> = {
  sku: 'SKU',
  category: '品类',
  global: '全局',
};

const TYPE_LABELS: Record<string, string> = {
  ALERT: '预警规则',
  REORDER: '补货规则',
};

function toggleRuleStatus(rule: InventoryRule): InventoryRule {
  const newStatus: RuleStatus = rule.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  return { ...rule, status: newStatus, version: rule.version + 1 };
}

// -- Reorder check --
function shouldTriggerReorder(item: InventoryItem, rule: InventoryRule): boolean {
  if (rule.type !== 'REORDER') return false;
  if (rule.status !== 'ENABLED') return false;
  const effectiveQty = rule.scope === 'global' ? item.availableQty : item.availableQty;
  return effectiveQty <= rule.triggerQty;
}

// -- Mock data --
const BASE_ITEMS: InventoryItem[] = [
  { id: 'i1', tenantId: 't1', sku: 'SKU-001', name: '投篮机', unit: '台', totalQty: 10, reservedQty: 2, availableQty: 8, lowStockThreshold: 3, unitPriceCents: 500000, status: 'ACTIVE', version: 1 },
  { id: 'i2', tenantId: 't1', sku: 'SKU-002', name: '跳舞机', unit: '台', totalQty: 5, reservedQty: 1, availableQty: 4, lowStockThreshold: 2, unitPriceCents: 800000, status: 'ACTIVE', version: 2 },
  { id: 'i3', tenantId: 't1', sku: 'SKU-003', name: '毛绒公仔', unit: '个', totalQty: 50, reservedQty: 0, availableQty: 50, lowStockThreshold: 10, unitPriceCents: 5000, status: 'ACTIVE', version: 1 },
  { id: 'i4', tenantId: 't1', sku: 'SKU-004', name: '饮料', unit: '瓶', totalQty: 0, reservedQty: 0, availableQty: 0, lowStockThreshold: 20, unitPriceCents: 800, status: 'ACTIVE', version: 1 },
  { id: 'i5', tenantId: 't1', sku: 'SKU-005', name: 'VR眼镜', unit: '副', totalQty: 3, reservedQty: 1, availableQty: 2, lowStockThreshold: 5, unitPriceCents: 200000, status: 'ACTIVE', version: 1 },
  { id: 'i6', tenantId: 't1', sku: 'SKU-006', name: '零食大礼包', unit: '袋', totalQty: 100, reservedQty: 0, availableQty: 100, lowStockThreshold: 20, unitPriceCents: 3000, status: 'ARCHIVED', version: 3 },
];

const SAMPLE_RULE_ALERT: InventoryRule = {
  id: 'rule-1', tenantId: 't1', type: 'ALERT', name: '通用低库存预警',
  description: '库存低于阈值时告警', scope: 'global', scopeValue: '',
  threshold: 10, severity: 'medium', triggerQty: 0, orderQty: 0, supplier: '',
  status: 'ENABLED', version: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

const SAMPLE_RULE_REORDER: InventoryRule = {
  id: 'rule-2', tenantId: 't1', type: 'REORDER', name: '自动补货',
  description: '库存低于5时触发补货', scope: 'global', scopeValue: '',
  threshold: 0, severity: 'low', triggerQty: 5, orderQty: 50, supplier: '供应商A',
  status: 'ENABLED', version: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

// ============================================================
//  1. 库存变动操作 (stock-in / stock-out)
// ============================================================

describe('inventory-service: 库存变动', () => {
  it('stockIn 入库增加库存量和版本号', () => {
    const result = stockIn(BASE_ITEMS[0]!, 5);
    assert.equal(result.totalQty, 15);
    assert.equal(result.availableQty, 13);
    assert.equal(result.version, 2);
    assert.equal(result.reservedQty, BASE_ITEMS[0]!.reservedQty); // unchanged
  });

  it('stockIn 入库 0 件不做变化', () => {
    const result = stockIn(BASE_ITEMS[0]!, 0);
    assert.equal(result.totalQty, 10);
    assert.equal(result.availableQty, 8);
  });

  it('stockOut 出库减少库存', () => {
    const result = stockOut(BASE_ITEMS[0]!, 3);
    if (typeof result === 'string') {
      assert.fail('Should not error');
    } else {
      assert.equal(result.totalQty, 7);
      assert.equal(result.availableQty, 5);
      assert.equal(result.version, 2);
    }
  });

  it('stockOut 数量不足返回错误信息', () => {
    const result = stockOut(BASE_ITEMS[0]!, 999);
    assert.equal(typeof result, 'string');
    assert.ok((result as string).includes('可用库存不足'));
  });

  it('stockOut 负数量返回错误', () => {
    const result = stockOut(BASE_ITEMS[0]!, -5);
    assert.equal(result, '出库数量必须大于 0');
  });

  it('stockOut 出空库存 (all available)', () => {
    const result = stockOut(BASE_ITEMS[4]!, 2); // VR眼镜: 可用=2
    if (typeof result === 'string') {
      assert.fail('Should not error');
    } else {
      assert.equal(result.availableQty, 0);
      assert.equal(result.totalQty, 1);
      assert.ok(isOutOfStock(result));
    }
  });
});

// ============================================================
//  2. 库存预警
// ============================================================

describe('inventory-service: 库存预警', () => {
  it('lowStockSeverity availableQty == 0 返回 critical', () => {
    assert.equal(lowStockSeverity(BASE_ITEMS[3]!), 'critical'); // 饮料: available=0
  });

  it('lowStockSeverity 阈值一半以下返回 critical', () => {
    // available=2, threshold=5 => 2 <= 5*0.5(2.5) => critical
    assert.equal(lowStockSeverity(BASE_ITEMS[4]!), 'critical');
  });

  it('lowStockSeverity 阈值以内但高于一半返回 warning', () => {
    const edge: InventoryItem = { ...BASE_ITEMS[0]!, availableQty: 3, lowStockThreshold: 3 };
    assert.equal(lowStockSeverity(edge), 'warning'); // exactly at threshold
  });

  it('lowStockSeverity 高于阈值返回 normal', () => {
    assert.equal(lowStockSeverity(BASE_ITEMS[0]!), 'normal'); // 8 > 3
    assert.equal(lowStockSeverity(BASE_ITEMS[2]!), 'normal'); // 50 > 10
  });

  it('computeLowStockCount 正确计数', () => {
    const count = computeLowStockCount(BASE_ITEMS);
    // i4 (0<=20), i5 (2<=5) — should be 2
    assert.equal(count, 2);
  });

  it('computeOutOfStockCount 正确计数', () => {
    const count = computeOutOfStockCount(BASE_ITEMS);
    // i4 (0) — 1
    assert.equal(count, 1);
  });

  // 边界: 阈值设为 0
  it('lowStockThreshold 为 0 时, available > 0 不算低库存', () => {
    const item: InventoryItem = { ...BASE_ITEMS[0]!, availableQty: 1, lowStockThreshold: 0 };
    assert.ok(!isLowStock(item));
  });

  // 边界: 大量库存
  it('大库存不触发预警', () => {
    const item: InventoryItem = { ...BASE_ITEMS[2]!, availableQty: 10000, lowStockThreshold: 10 };
    assert.ok(!isLowStock(item));
    assert.equal(lowStockSeverity(item), 'normal');
  });
});

// ============================================================
//  3. 库存规则管理
// ============================================================

describe('inventory-service: 规则管理', () => {
  it('toggleRuleStatus ENABLED → DISABLED', () => {
    const result = toggleRuleStatus(SAMPLE_RULE_ALERT);
    assert.equal(result.status, 'DISABLED');
    assert.equal(result.version, 2);
  });

  it('toggleRuleStatus DISABLED → ENABLED', () => {
    const disabled = { ...SAMPLE_RULE_ALERT, status: 'DISABLED' as RuleStatus };
    const result = toggleRuleStatus(disabled);
    assert.equal(result.status, 'ENABLED');
  });

  it('SEVERITY_LABELS 完整覆盖', () => {
    assert.equal(SEVERITY_LABELS['low'], '低');
    assert.equal(SEVERITY_LABELS['medium'], '中');
    assert.equal(SEVERITY_LABELS['high'], '高');
  });

  it('SCOPE_LABELS 完整覆盖', () => {
    assert.equal(SCOPE_LABELS['sku'], 'SKU');
    assert.equal(SCOPE_LABELS['category'], '品类');
    assert.equal(SCOPE_LABELS['global'], '全局');
  });

  it('TYPE_LABELS 完整覆盖', () => {
    assert.equal(TYPE_LABELS['ALERT'], '预警规则');
    assert.equal(TYPE_LABELS['REORDER'], '补货规则');
  });
});

// ============================================================
//  4. 补货规则 (reorder)
// ============================================================

describe('inventory-service: 补货触发', () => {
  it('shouldTriggerReorder 可用量 <= 触发值返回 true', () => {
    // i5(VR眼镜): available=2, rule trigger=5 => trigger
    assert.ok(shouldTriggerReorder(BASE_ITEMS[4]!, SAMPLE_RULE_REORDER));
  });

  it('shouldTriggerReorder 可用量 > 触发值返回 false', () => {
    // i0(投篮机): available=8, rule trigger=5 => no trigger
    assert.ok(!shouldTriggerReorder(BASE_ITEMS[0]!, SAMPLE_RULE_REORDER));
  });

  it('shouldTriggerReorder 规则已停用返回 false', () => {
    const disabledRule = { ...SAMPLE_RULE_REORDER, status: 'DISABLED' as RuleStatus };
    assert.ok(!shouldTriggerReorder(BASE_ITEMS[4]!, disabledRule));
  });

  it('shouldTriggerReorder ALERT 规则不触发补货', () => {
    assert.ok(!shouldTriggerReorder(BASE_ITEMS[4]!, SAMPLE_RULE_ALERT));
  });

  it('shouldTriggerReorder 刚刚等于触发值', () => {
    const item: InventoryItem = { ...BASE_ITEMS[0]!, availableQty: 5 };
    assert.ok(shouldTriggerReorder(item, SAMPLE_RULE_REORDER));
  });
});

// ============================================================
//  5. 状态管理
// ============================================================

describe('inventory-service: 状态管理', () => {
  it('toggleItemStatus ACTIVE → INACTIVE', () => {
    const result = toggleItemStatus(BASE_ITEMS[0]!);
    assert.equal(result.status, 'INACTIVE');
    assert.equal(result.version, 2);
  });

  it('toggleItemStatus INACTIVE → ACTIVE', () => {
    const inactive: InventoryItem = { ...BASE_ITEMS[0]!, status: 'INACTIVE' };
    const result = toggleItemStatus(inactive);
    assert.equal(result.status, 'ACTIVE');
  });

  it('toggleItemStatus ARCHIVED stays ARCHIVED', () => {
    const archived: InventoryItem = { ...BASE_ITEMS[5]!, status: 'ARCHIVED' };
    const result = toggleItemStatus(archived);
    assert.equal(result.status, 'ARCHIVED');
  });
});

// ============================================================
//  6. 计算与验证
// ============================================================

describe('inventory-service: 计算与验证', () => {
  it('calculateTotalValue 空数组', () => {
    assert.equal(calculateTotalValue([]), 0);
  });

  it('calculateTotalValue 单个商品', () => {
    const items: InventoryItem[] = [{ ...BASE_ITEMS[0]!, availableQty: 10, unitPriceCents: 1000 }];
    assert.equal(calculateTotalValue(items), 10000);
  });

  it('validateCreateItem 含特殊字符的SKU', () => {
    const err = validateCreateItem({ sku: 'SKU@#$%', name: '特殊商品', totalQty: 10, unitPriceCents: 1000 });
    assert.equal(err, null); // should pass
  });

  it('validateCreateItem 超大数量通过', () => {
    const err = validateCreateItem({ sku: 'SKU-MAX', name: '超大数量', totalQty: 999999999, unitPriceCents: 1 });
    assert.equal(err, null);
  });

  it('validateReason 通过', () => {
    assert.equal(validateReason('采购入库'), null);
    assert.equal(validateReason('销售出库'), null);
  });

  it('validateReason 空值错误', () => {
    assert.equal(validateReason(''), '原因不能为空');
    assert.equal(validateReason('  '), '原因不能为空');
  });

  // batch: 多条入库操作
  it('连续入库出库保持数据一致性', () => {
    let item = { ...BASE_ITEMS[0]! };
    // 入库 10 → 出库 3 → 入库 5
    item = stockIn(item, 10); // total:20, avail:18
    const outResult = stockOut(item, 3);
    if (typeof outResult === 'string') assert.fail(outResult);
    else {
      item = outResult; // total:17, avail:15
      item = stockIn(item, 5); // total:22, avail:20
      assert.equal(item.totalQty, 22);
      assert.equal(item.availableQty, 20);
      assert.equal(item.version, 4);
    }
  });

  it('出库数量刚好等于可用量', () => {
    const item: InventoryItem = { ...BASE_ITEMS[3]!, totalQty: 10, reservedQty: 0, availableQty: 10 };
    const result = stockOut(item, 10);
    if (typeof result === 'string') assert.fail(result);
    else {
      assert.equal(result.availableQty, 0);
      assert.ok(isOutOfStock(result));
    }
  });

  // 边界: version 递增验证
  it('每次操作 version 递增', () => {
    let item = { ...BASE_ITEMS[0]!, version: 1 };
    item = stockIn(item, 1);
    assert.equal(item.version, 2);
    item = toggleItemStatus(item);
    assert.equal(item.version, 3);
    const out = stockOut(item, 1);
    if (typeof out !== 'string') {
      assert.equal(out.version, 4);
    }
  });
});
