/**
 * TobStockDetailPage — node:test 单元测试
 * 验证：
 * - 模块导出/类型定义
 * - 常量完整性（STATUS_LABELS, STATUS_COLORS, STATUS_FLOW, NEXT_STATUS, PREV_STATUS）
 * - Mock 数据完整性
 * - 辅助函数逻辑（formatCurrency, calcMarginPercent）
 * - 状态流转逻辑闭环
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 从 page.tsx 导入（仅 default 导出）──
import TobStockDetailPage from './page';

// ── 从 constants.ts 导入数据与辅助函数 ──
import {
  type TobStockStatus,
  type TobStockItem,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_FLOW,
  NEXT_STATUS,
  PREV_STATUS,
  formatCurrency,
  calcMarginPercent,
  MOCK_ITEMS,
} from './constants';

// ── 页面组件 ──
describe('TobStockDetailPage exports', () => {
  it('should export default as a function', () => {
    assert.equal(typeof TobStockDetailPage, 'function');
  });
});

// ── 常量 ──
describe('STATUS_LABELS', () => {
  const expected: Record<TobStockStatus, string> = {
    normal: '正常',
    low: '偏低',
    critical: '告急',
    out_of_stock: '缺货',
    overstocked: '过剩',
  };

  for (const [key, label] of Object.entries(expected)) {
    it(`should map ${key} to "${label}"`, () => {
      assert.equal(STATUS_LABELS[key as TobStockStatus], label);
    });
  }
});

describe('STATUS_COLORS', () => {
  const expected: Record<TobStockStatus, string> = {
    normal: '#059669',
    low: '#d97706',
    critical: '#dc2626',
    out_of_stock: '#991b1b',
    overstocked: '#7c3aed',
  };

  for (const [key, color] of Object.entries(expected)) {
    it(`should map ${key} to "${color}"`, () => {
      assert.equal(STATUS_COLORS[key as TobStockStatus], color);
    });
  }
});

describe('STATUS_FLOW', () => {
  it('should have 5 statuses in order', () => {
    assert.deepEqual(STATUS_FLOW, ['out_of_stock', 'critical', 'low', 'normal', 'overstocked']);
  });

  it('should cover all possible statuses', () => {
    assert.equal(STATUS_FLOW.length, Object.keys(STATUS_LABELS).length);
  });
});

// ── 状态流转映射 ──
describe('NEXT_STATUS', () => {
  it('should map out_of_stock → critical', () => {
    assert.equal(NEXT_STATUS.out_of_stock, 'critical');
  });
  it('should map critical → low', () => {
    assert.equal(NEXT_STATUS.critical, 'low');
  });
  it('should map low → normal', () => {
    assert.equal(NEXT_STATUS.low, 'normal');
  });
  it('should map normal → overstocked', () => {
    assert.equal(NEXT_STATUS.normal, 'overstocked');
  });
  it('should not map overstocked further', () => {
    assert.equal(NEXT_STATUS.overstocked, undefined);
  });
});

describe('PREV_STATUS', () => {
  it('should map overstocked → normal', () => {
    assert.equal(PREV_STATUS.overstocked, 'normal');
  });
  it('should map normal → low', () => {
    assert.equal(PREV_STATUS.normal, 'low');
  });
  it('should map low → critical', () => {
    assert.equal(PREV_STATUS.low, 'critical');
  });
  it('should map critical → out_of_stock', () => {
    assert.equal(PREV_STATUS.critical, 'out_of_stock');
  });
  it('should not map out_of_stock further', () => {
    assert.equal(PREV_STATUS.out_of_stock, undefined);
  });
});

// ── 循环一致性 ──
describe('Status flow consistency', () => {
  it('NEXT_STATUS and PREV_STATUS should be inverses', () => {
    const traversable = STATUS_FLOW.filter(s => s !== 'overstocked');
    for (const status of traversable) {
      const next = NEXT_STATUS[status]!;
      assert.equal(PREV_STATUS[next], status, `${status} → ${next} → ${status} 不闭环`);
    }
  });

  it('every status should appear in at least one mapping', () => {
    const mapped = new Set<TobStockStatus>();
    for (const v of Object.values(NEXT_STATUS)) if (v) mapped.add(v);
    for (const v of Object.values(PREV_STATUS)) if (v) mapped.add(v);
    for (const s of STATUS_FLOW) {
      assert.ok(mapped.has(s) || NEXT_STATUS[s] !== undefined || PREV_STATUS[s] !== undefined, `${s} 不在任何映射中`);
    }
  });
});

// ── 辅助函数 ──
describe('formatCurrency', () => {
  it('should format amounts < 10000 with commas', () => {
    assert.equal(formatCurrency(9800), '¥9,800.00');
  });

  it('should format amounts >= 10000 in 万', () => {
    assert.equal(formatCurrency(12800), '¥1.28万');
  });

  it('should format zero', () => {
    assert.equal(formatCurrency(0), '¥0.00');
  });

  it('should format amounts >= 10000 in 万', () => {
    assert.equal(formatCurrency(10000), '¥1.00万');
  });

  it('should format large amounts in 万', () => {
    assert.equal(formatCurrency(1280000), '¥128.00万');
  });
});

describe('calcMarginPercent', () => {
  it('should calculate correct margin percentage', () => {
    assert.equal(calcMarginPercent({ price: 12800, costPrice: 7800 }), 39.0625);
  });

  it('should return 0 when price is 0', () => {
    assert.equal(calcMarginPercent({ price: 0, costPrice: 100 }), 0);
  });

  it('should return negative margin when cost > price', () => {
    const result = calcMarginPercent({ price: 100, costPrice: 150 });
    assert.ok(result < 0);
  });

  it('should return 100 when cost is 0', () => {
    assert.equal(calcMarginPercent({ price: 200, costPrice: 0 }), 100);
  });
});

// ── Mock 数据完整性 ──
describe('Mock data validation', () => {
  const keys = Object.keys(MOCK_ITEMS);

  it('should have at least 3 mock items', () => {
    assert.ok(keys.length >= 3);
  });

  for (const id of keys) {
    const item: TobStockItem = MOCK_ITEMS[id];
    it(`mock item "${item.name}" (${id}) should have valid fields`, () => {
      assert.ok(item.id);
      assert.ok(item.sku);
      assert.ok(item.name);
      assert.ok(item.category);
      assert.equal(typeof item.quantity, 'number');
      assert.ok(item.quantity >= 0);
      assert.equal(typeof item.price, 'number');
      assert.ok(item.price > 0);
      assert.equal(typeof item.costPrice, 'number');
      assert.ok(item.costPrice >= 0);
      assert.ok(STATUS_LABELS[item.status] !== undefined, `Unknown status: ${item.status}`);
    });
  }
});
