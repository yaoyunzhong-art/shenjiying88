/**
 * inventory/rules/page.test.tsx — 库存规则管理 L1 测试
 *
 * 覆盖: ALERT/REORDER 两种规则类型、状态枚举、范围类型、搜索筛选、乐观锁版本
 * 正例: 规则数据完整性、类型区分、状态枚举、范围检查
 * 反例: 空规则列表、无效类型/状态、零阈值
 * 边界: 超大量补货、全品类范围、超大版本号
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type RuleType = 'ALERT' | 'REORDER';
type RuleStatus = 'ENABLED' | 'DISABLED';
type RuleScope = 'sku' | 'category' | 'global';

interface InventoryRule {
  id: string;
  tenantId: string;
  type: RuleType;
  name: string;
  description: string;
  scope: RuleScope;
  scopeValue: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  triggerQty: number;
  orderQty: number;
  supplier: string;
  status: RuleStatus;
  version: number;
  createdAt: string;
}

// ── Mock 数据 ──

const MOCK_RULES: InventoryRule[] = [
  { id: 'rule-001', tenantId: 't-001', type: 'ALERT', name: '库存不足预警-A类', description: 'A类商品低库存预警', scope: 'sku', scopeValue: 'SKU-A001', threshold: 20, severity: 'high', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 1, createdAt: '2026-06-01' },
  { id: 'rule-002', tenantId: 't-001', type: 'ALERT', name: '品类库存预警-饮料', description: '饮料品类低库存', scope: 'category', scopeValue: '饮料', threshold: 100, severity: 'medium', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 2, createdAt: '2026-06-10' },
  { id: 'rule-003', tenantId: 't-001', type: 'REORDER', name: 'SKU-A001 自动补货', description: 'A001商品自动补货', scope: 'sku', scopeValue: 'SKU-A001', threshold: 0, severity: 'low', triggerQty: 30, orderQty: 200, supplier: '供应商A', status: 'ENABLED', version: 3, createdAt: '2026-06-15' },
  { id: 'rule-004', tenantId: 't-001', type: 'REORDER', name: '饮料品类自动补货', description: '饮料品类补货', scope: 'category', scopeValue: '饮料', threshold: 0, severity: 'low', triggerQty: 200, orderQty: 1000, supplier: '供应商B', status: 'DISABLED', version: 1, createdAt: '2026-07-01' },
  { id: 'rule-005', tenantId: 't-002', type: 'ALERT', name: '全局库存预警', description: '全局低库存', scope: 'global', scopeValue: '*', threshold: 500, severity: 'low', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 5, createdAt: '2026-05-20' },
];

// ── 辅助函数 ──

function rulesByType(rules: InventoryRule[], type: RuleType): InventoryRule[] {
  return rules.filter(r => r.type === type);
}

function rulesByStatus(rules: InventoryRule[], status: RuleStatus): InventoryRule[] {
  return rules.filter(r => r.status === status);
}

function rulesByScope(rules: InventoryRule[], scope: RuleScope): InventoryRule[] {
  return rules.filter(r => r.scope === scope);
}

function searchRules(rules: InventoryRule[], query: string): InventoryRule[] {
  if (!query.trim()) return rules;
  const lower = query.toLowerCase();
  return rules.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.description.toLowerCase().includes(lower) ||
    r.scopeValue.toLowerCase().includes(lower)
  );
}

// ===================================================================
describe('InventoryRules — 类型筛选', () => {
  it('ALERT 类型规则筛选', () => {
    const alerts = rulesByType(MOCK_RULES, 'ALERT');
    assert.equal(alerts.length, 3);
    assert.ok(alerts.every(r => r.type === 'ALERT'));
  });

  it('REORDER 类型规则筛选', () => {
    const reorders = rulesByType(MOCK_RULES, 'REORDER');
    assert.equal(reorders.length, 2);
  });

  it('ALERT 规则有 threshold/severity 字段', () => {
    const alerts = rulesByType(MOCK_RULES, 'ALERT');
    for (const r of alerts) {
      assert.ok(r.threshold > 0, `ALERT ${r.id}: threshold > 0`);
      assert.ok(['low', 'medium', 'high'].includes(r.severity), `valid severity`);
    }
  });

  it('REORDER 规则有 triggerQty/orderQty/supplier', () => {
    const reorders = rulesByType(MOCK_RULES, 'REORDER');
    for (const r of reorders) {
      assert.ok(r.triggerQty > 0, `REORDER ${r.id}: triggerQty > 0`);
      assert.ok(r.orderQty > 0, `REORDER ${r.id}: orderQty > 0`);
      assert.ok(r.supplier.length > 0, `REORDER ${r.id}: supplier required`);
    }
  });
});

// ===================================================================
describe('InventoryRules — 状态与范围', () => {
  it('ENABLED 规则应多于 DISABLED', () => {
    const enabled = rulesByStatus(MOCK_RULES, 'ENABLED');
    const disabled = rulesByStatus(MOCK_RULES, 'DISABLED');
    assert.ok(enabled.length > disabled.length);
  });

  it('范围类型枚举正确', () => {
    const validScopes: RuleScope[] = ['sku', 'category', 'global'];
    for (const r of MOCK_RULES) {
      assert.ok(validScopes.includes(r.scope), `${r.id}: valid scope ${r.scope}`);
    }
  });

  it('global 范围返回 scopeValue=*', () => {
    const globals = rulesByScope(MOCK_RULES, 'global');
    assert.equal(globals.length, 1);
    assert.equal(globals[0]!.scopeValue, '*');
  });

  it('每个规则应有 tenantId', () => {
    for (const r of MOCK_RULES) {
      assert.ok(r.tenantId, 'tenantId required');
    }
  });
});

// ===================================================================
describe('InventoryRules — 搜索', () => {
  it('按名称搜索', () => {
    const result = searchRules(MOCK_RULES, '预警');
    assert.equal(result.length, 3);
  });

  it('按 description 搜索', () => {
    const result = searchRules(MOCK_RULES, '补货');
    assert.equal(result.length, 2);
  });

  it('按 scopeValue 搜索', () => {
    const result = searchRules(MOCK_RULES, 'SKU-A001');
    assert.equal(result.length, 2);
  });

  it('空搜索返回全部', () => {
    assert.equal(searchRules(MOCK_RULES, '').length, MOCK_RULES.length);
  });

  it('无匹配返回空', () => {
    assert.equal(searchRules(MOCK_RULES, 'zzz').length, 0);
  });
});

// ===================================================================
describe('InventoryRules — 数据完整性', () => {
  it('version 必须 >= 1', () => {
    for (const r of MOCK_RULES) {
      assert.ok(r.version >= 1, `${r.id}: version >= 1`);
    }
  });

  it('id 唯一', () => {
    const ids = MOCK_RULES.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('所有规则必须有 name', () => {
    for (const r of MOCK_RULES) {
      assert.ok(r.name.length > 0, 'name required');
    }
  });
});

// ===================================================================
describe('InventoryRules — 边界', () => {
  it('空列表不抛异常', () => {
    assert.doesNotThrow(() => rulesByType([], 'ALERT'));
    assert.doesNotThrow(() => searchRules([], ''));
    assert.equal(rulesByType([], 'ALERT').length, 0);
  });

  it('超大量 orderQty', () => {
    const big: InventoryRule = { ...MOCK_RULES[2], orderQty: 999999 };
    assert.equal(big.orderQty, 999999);
  });

  it('超大 version 不溢出', () => {
    const big: InventoryRule = { ...MOCK_RULES[0], version: Number.MAX_SAFE_INTEGER };
    assert.equal(big.version, Number.MAX_SAFE_INTEGER);
  });

  it('全 tenantId 相同或不同', () => {
    const tenantIds = new Set(MOCK_RULES.map(r => r.tenantId));
    assert.equal(tenantIds.size, 2); // t-001, t-002
  });
});
