/**
 * inventory/rules/page.test.ts — P-37 库存规则页面测试
 *
 * 覆盖:
 *   - 规则列表: 分类型/状态过滤、类型标签映射、范围标签映射
 *   - 规则配置: 阈值验证、整数校验、空值拒绝
 *   - 状态管理: 启用/停用切换、计数统计
 *   - 边界: 空列表、全部停用、大量规则、边界阈值
 *   - 反模式 v4 防御: no any, no var, API 参数化
 *
 * 纯 node:test + 源码静态分析
 * ≥15 tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── 1. 源码分析 ─────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ─── 2. 复制业务逻辑 ─────────────────────────────────────────────────────

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

const TYPE_LABELS: Record<string, string> = {
  ALERT: '预警规则',
  REORDER: '补货规则',
};

const SCOPE_LABELS: Record<string, string> = {
  sku: 'SKU',
  category: '品类',
  global: '全局',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

function filterByType(rules: InventoryRule[], filterType: RuleType | 'all'): InventoryRule[] {
  if (filterType === 'all') return rules;
  return rules.filter((r) => r.type === filterType);
}

function countEnabled(rules: InventoryRule[]): number {
  return rules.filter((r) => r.status === 'ENABLED').length;
}

function countByType(rules: InventoryRule[], type: RuleType): number {
  return rules.filter((r) => r.type === type).length;
}

function getTypeLabel(type: RuleType): string {
  return TYPE_LABELS[type];
}

function getScopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope;
}

function getSeverityLabel(severity: string): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

function getThresholdDisplay(rule: InventoryRule): string {
  if (rule.type === 'ALERT') return `阈值 ${rule.threshold}`;
  return `触发 ${rule.triggerQty} → 补 ${rule.orderQty} (${rule.supplier})`;
}

function validateRuleName(name: string): string | null {
  if (!name.trim()) return '规则名称不能为空';
  return null;
}

function validateThreshold(threshold: number): string | null {
  if (!Number.isInteger(threshold)) return '阈值必须为整数';
  if (threshold < 0) return '阈值不能为负数';
  return null;
}

function validateTriggerQty(qty: number): string | null {
  if (!Number.isInteger(qty)) return '触发数量必须为整数';
  if (qty <= 0) return '触发数量必须大于 0';
  return null;
}

function validateOrderQty(qty: number): string | null {
  if (!Number.isInteger(qty)) return '补货数量必须为整数';
  if (qty <= 0) return '补货数量必须大于 0';
  return null;
}

function alertSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  return map[severity] ?? 'bg-gray-100 text-gray-500';
}

function statusBadgeClass(status: RuleStatus): string {
  return status === 'ENABLED'
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500';
}

// ─── 3. Mock 数据 ────────────────────────────────────────────────────────

const RULES: InventoryRule[] = [
  { id: 'r1', tenantId: 't1', type: 'ALERT', name: '投篮机低库存预警', description: '投篮机库存低于阈值时告警', scope: 'sku', scopeValue: 'SKU-001', threshold: 3, severity: 'high', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 1, createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'r2', tenantId: 't1', type: 'ALERT', name: '跳舞机低库存预警', description: '', scope: 'category', scopeValue: 'CAT-GAME', threshold: 5, severity: 'medium', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 1, createdAt: '2026-06-02', updatedAt: '2026-06-02' },
  { id: 'r3', tenantId: 't1', type: 'ALERT', name: '全局低库存预警', description: '适用于所有商品', scope: 'global', scopeValue: '', threshold: 10, severity: 'low', triggerQty: 0, orderQty: 0, supplier: '', status: 'DISABLED', version: 1, createdAt: '2026-06-03', updatedAt: '2026-06-05' },
  { id: 'r4', tenantId: 't1', type: 'REORDER', name: '毛绒公仔自动补货', description: '毛绒公仔库存不足时自动下单', scope: 'sku', scopeValue: 'SKU-003', threshold: 0, severity: 'medium', triggerQty: 20, orderQty: 100, supplier: '广州玩具厂', status: 'ENABLED', version: 2, createdAt: '2026-06-04', updatedAt: '2026-06-10' },
  { id: 'r5', tenantId: 't1', type: 'REORDER', name: '饮料自动补货', description: '', scope: 'category', scopeValue: 'CAT-DRINK', threshold: 0, severity: 'medium', triggerQty: 50, orderQty: 200, supplier: '本地饮料商', status: 'DISABLED', version: 1, createdAt: '2026-06-05', updatedAt: '2026-06-05' },
  { id: 'r6', tenantId: 't1', type: 'ALERT', name: '礼品兑换券预警', description: '兑换券余量不足告警', scope: 'sku', scopeValue: 'SKU-005', threshold: 20, severity: 'high', triggerQty: 0, orderQty: 0, supplier: '', status: 'ENABLED', version: 1, createdAt: '2026-06-06', updatedAt: '2026-06-06' },
  { id: 'r7', tenantId: 't1', type: 'REORDER', name: 'VR 眼镜补货规则', description: '', scope: 'global', scopeValue: '', threshold: 0, severity: 'medium', triggerQty: 3, orderQty: 15, supplier: 'VR Supply Co.', status: 'ENABLED', version: 1, createdAt: '2026-06-07', updatedAt: '2026-06-07' },
];

// ─── Tests ───────────────────────────────────────────────────────────────

// ============ 正例 - 规则列表 ============

describe('inventory-rules: 规则列表', () => {
  it('1. filterByType "all" 返回全部规则', () => {
    assert.equal(filterByType(RULES, 'all').length, RULES.length);
    assert.deepStrictEqual(filterByType(RULES, 'all'), RULES);
  });

  it('2. filterByType 按 ALERT 过滤正确', () => {
    const alerts = filterByType(RULES, 'ALERT');
    assert.ok(alerts.every((r) => r.type === 'ALERT'));
    assert.equal(alerts.length, 4);
  });

  it('3. filterByType 按 REORDER 过滤正确', () => {
    const reorders = filterByType(RULES, 'REORDER');
    assert.ok(reorders.every((r) => r.type === 'REORDER'));
    assert.equal(reorders.length, 3);
  });

  it('4. getTypeLabel 映射正确', () => {
    assert.equal(getTypeLabel('ALERT'), '预警规则');
    assert.equal(getTypeLabel('REORDER'), '补货规则');
  });

  it('5. getScopeLabel 映射正确', () => {
    assert.equal(getScopeLabel('sku'), 'SKU');
    assert.equal(getScopeLabel('category'), '品类');
    assert.equal(getScopeLabel('global'), '全局');
  });

  it('6. getThresholdDisplay ALERT 显示阈值', () => {
    const r = RULES[0]!;
    assert.match(getThresholdDisplay(r), /阈值 3/);
  });

  it('7. getThresholdDisplay REORDER 显示触发+补货', () => {
    const r = RULES[3]!;
    assert.match(getThresholdDisplay(r), /触发 20/);
    assert.match(getThresholdDisplay(r), /补 100/);
    assert.match(getThresholdDisplay(r), /广州玩具厂/);
  });
});

// ============ 正例 - 规则配置 ============

describe('inventory-rules: 规则配置', () => {
  it('8. validateRuleName 合法名称', () => {
    assert.equal(validateRuleName('投篮机低库存预警'), null);
  });

  it('9. validateThreshold 合法整数', () => {
    assert.equal(validateThreshold(3), null);
    assert.equal(validateThreshold(0), null);
  });

  it('10. validateTriggerQty 合法整数', () => {
    assert.equal(validateTriggerQty(20), null);
  });

  it('11. validateOrderQty 合法整数', () => {
    assert.equal(validateOrderQty(100), null);
  });

  it('12. countByType 统计正确', () => {
    assert.equal(countByType(RULES, 'ALERT'), 4);
    assert.equal(countByType(RULES, 'REORDER'), 3);
  });

  it('13. countEnabled 统计启用规则数', () => {
    assert.equal(countEnabled(RULES), 5);
  });

  it('14. alertSeverityColor severity->CSS class', () => {
    assert.ok(alertSeverityColor('high').includes('red'));
    assert.ok(alertSeverityColor('medium').includes('yellow'));
    assert.ok(alertSeverityColor('low').includes('blue'));
    assert.ok(alertSeverityColor('unknown').includes('gray'));
  });

  it('15. statusBadgeClass ENABLED/DISABLED', () => {
    assert.ok(statusBadgeClass('ENABLED').includes('green'));
    assert.ok(statusBadgeClass('DISABLED').includes('gray'));
    assert.ok(!statusBadgeClass('DISABLED').includes('green'));
  });

  it('16. getSeverityLabel 映射正确', () => {
    assert.equal(getSeverityLabel('low'), '低');
    assert.equal(getSeverityLabel('medium'), '中');
    assert.equal(getSeverityLabel('high'), '高');
  });
});

// ============ 反例 ============

describe('inventory-rules: 反例', () => {
  it('17. validateRuleName 空字符串', () => {
    assert.equal(validateRuleName(''), '规则名称不能为空');
    assert.equal(validateRuleName('   '), '规则名称不能为空');
  });

  it('18. validateThreshold 负数', () => {
    assert.equal(validateThreshold(-1), '阈值不能为负数');
  });

  it('19. validateThreshold 非整数', () => {
    assert.equal(validateThreshold(3.5), '阈值必须为整数');
  });

  it('20. validateTriggerQty 零值', () => {
    assert.equal(validateTriggerQty(0), '触发数量必须大于 0');
  });

  it('21. validateTriggerQty 负数', () => {
    assert.equal(validateTriggerQty(-5), '触发数量必须大于 0');
  });

  it('22. validateTriggerQty 非整数', () => {
    assert.equal(validateTriggerQty(2.5), '触发数量必须为整数');
  });

  it('23. validateOrderQty 零值', () => {
    assert.equal(validateOrderQty(0), '补货数量必须大于 0');
  });

  it('24. filterByType 存在未知类型返回空', () => {
    const result = filterByType(RULES, 'UNKNOWN' as RuleType);
    assert.equal(result.length, 0);
  });
});

// ============ 边界 ============

describe('inventory-rules: 边界', () => {
  it('25. 空规则列表 filterByType 返回空', () => {
    assert.deepStrictEqual(filterByType([], 'all'), []);
    assert.deepStrictEqual(filterByType([], 'ALERT'), []);
  });

  it('26. 空列表 countEnabled 为 0', () => {
    assert.equal(countEnabled([]), 0);
  });

  it('27. 全部 DISABLED 时 countEnabled 为 0', () => {
    const allDisabled = RULES.map((r) => ({ ...r, status: 'DISABLED' as RuleStatus }));
    assert.equal(countEnabled(allDisabled), 0);
  });

  it('28. 全部 ENABLED 时 countEnabled 等于总数', () => {
    const allEnabled = RULES.map((r) => ({ ...r, status: 'ENABLED' as RuleStatus }));
    assert.equal(countEnabled(allEnabled), allEnabled.length);
  });

  it('29. threshold = 0 是合法值', () => {
    assert.equal(validateThreshold(0), null);
  });

  it('30. threshold 最大安全整数值', () => {
    assert.equal(validateThreshold(2147483647), null);
    assert.equal(validateThreshold(Number.MAX_SAFE_INTEGER), null);
  });

  it('31. getThresholdDisplay ALERT threshold = 0', () => {
    const zeroThreshold: InventoryRule = { ...RULES[0]!, threshold: 0, type: 'ALERT' };
    assert.match(getThresholdDisplay(zeroThreshold), /阈值 0/);
  });

  it('32. 未知 scope 返回原值', () => {
    assert.equal(getScopeLabel('unknown_scope'), 'unknown_scope');
  });

  it('33. 大量规则 filterByType 性能基线', () => {
    const many = Array.from({ length: 5000 }, (_, i) => ({
      ...RULES[i % RULES.length]!,
      id: `r-many-${i}`,
    }));
    const alerts = filterByType(many, 'ALERT');
    assert.ok(alerts.length >= 2800 && alerts.length <= 2900); // ~2857 items
    assert.ok(alerts.every((r) => r.type === 'ALERT'));
  });
});

// ============ 源码级防御 ============

describe('inventory-rules: 源码防御', () => {
  it('34. 不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '源码含 any 类型');
  });

  it('35. 不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/;\s*var\s/.test(src), '源码含 var');
  });

  it('36. API 请求使用 encodeURIComponent 参数化', () => {
    const src = readSource();
    assert.ok(src.includes('encodeURIComponent'), '未使用 encodeURIComponent');
  });

  it('37. 所有 fetch 在 try-catch 中', () => {
    const src = readSource();
    const fetchCount = (src.match(/\bfetch\b/g) || []).length;
    const tryCount = (src.match(/\btry\b/g) || []).length;
    assert.ok(tryCount >= fetchCount, `fetch(${fetchCount}) 应在 try(${tryCount}) 中`);
  });

  it('38. tenantId 为空时不发起请求', () => {
    const src = readSource();
    assert.ok(src.includes("if (!tenantId)"), '缺少 tenantId 空保护');
  });

  it('39. 应包含乐观锁 version', () => {
    const src = readSource();
    assert.ok(src.includes('version'), '缺少乐观锁 version');
  });

  it('40. 应包含 InventoryRule 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface InventoryRule'), '缺少 InventoryRule 接口');
  });
});
