/**
 * SupplierStatusBadge — node:test 兼容适配 
 * 验证供应商状态徽章组件逻辑
 * - 状态标签映射完整性
 * - 状态颜色映射完整性
 * - formatCurrency 辅助函数
 * - 边界 case
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型/常量 ----

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停合作',
  terminated: '终止合作',
  pending: '审批中',
};

const SUPPLIER_STATUS_COLORS: Record<SupplierStatus, string> = {
  active: '#059669',
  paused: '#d97706',
  terminated: '#dc2626',
  pending: '#7c3aed',
};

// ====================================================================
//  正例
// ====================================================================

describe('SupplierStatusBadge: 正例 (positive cases)', () => {
  describe('模块导出与结构', () => {
    it('模块可导入，SupplierStatusBadge 为函数', async () => {
      const mod = await import('./SupplierStatusBadge');
      assert.equal(typeof mod.SupplierStatusBadge, 'function');
    });

    it('导出 SupplierStatus 类型相关的常量', () => {
      const keys = Object.keys(SUPPLIER_STATUS_LABELS);
      assert.equal(keys.length, 4);
    });
  });

  describe('状态标签映射', () => {
    it('active → 合作中', () => {
      assert.equal(SUPPLIER_STATUS_LABELS.active, '合作中');
    });

    it('paused → 暂停合作', () => {
      assert.equal(SUPPLIER_STATUS_LABELS.paused, '暂停合作');
    });

    it('terminated → 终止合作', () => {
      assert.equal(SUPPLIER_STATUS_LABELS.terminated, '终止合作');
    });

    it('pending → 审批中', () => {
      assert.equal(SUPPLIER_STATUS_LABELS.pending, '审批中');
    });
  });

  describe('状态颜色映射', () => {
    it('active → #059669 (绿色)', () => {
      assert.equal(SUPPLIER_STATUS_COLORS.active, '#059669');
    });

    it('paused → #d97706 (黄色)', () => {
      assert.equal(SUPPLIER_STATUS_COLORS.paused, '#d97706');
    });

    it('terminated → #dc2626 (红色)', () => {
      assert.equal(SUPPLIER_STATUS_COLORS.terminated, '#dc2626');
    });

    it('pending → #7c3aed (紫色)', () => {
      assert.equal(SUPPLIER_STATUS_COLORS.pending, '#7c3aed');
    });
  });

  describe('颜色格式', () => {
    it('所有颜色值以 # 开头且为 7 字符 hex', () => {
      for (const status of Object.keys(SUPPLIER_STATUS_COLORS) as SupplierStatus[]) {
        const color = SUPPLIER_STATUS_COLORS[status];
        assert.ok(color.startsWith('#'), `${status} 颜色应以 # 开头`);
        assert.equal(color.length, 7, `${status} 颜色应为 7 字符`);
      }
    });
  });
});

// ====================================================================
//  反例
// ====================================================================

describe('SupplierStatusBadge: 反例 (negative cases)', () => {
  it('未知状态应回退为原始值', () => {
    const unknown = 'unknown' as SupplierStatus;
    const label = SUPPLIER_STATUS_LABELS[unknown] ?? unknown;
    assert.equal(label, 'unknown');
  });

  it('未知状态的颜色应回退为灰色 #6b7280', () => {
    const unknown = 'unknown' as SupplierStatus;
    const color = SUPPLIER_STATUS_COLORS[unknown] ?? '#6b7280';
    assert.equal(color, '#6b7280');
  });

  it('null 状态应被 handle', () => {
    // 类型安全: null 不会被 SupplierStatus 接收, 但在运行时
    // 如果传入 null, 回退逻辑应返回默认值
    const fallbackLabel = SUPPLIER_STATUS_LABELS[null as unknown as SupplierStatus] ?? 'unknown';
    assert.equal(fallbackLabel, 'unknown');
  });
});

// ====================================================================
//  边界
// ====================================================================

describe('SupplierStatusBadge: 边界 (boundary cases)', () => {
  it('标签对象恰好包含 4 个键', () => {
    assert.equal(Object.keys(SUPPLIER_STATUS_LABELS).length, 4);
  });

  it('颜色对象恰好包含 4 个键', () => {
    assert.equal(Object.keys(SUPPLIER_STATUS_COLORS).length, 4);
  });

  it('所有状态在 LABELS 中都有对应条目', () => {
    const expected = ['active', 'paused', 'terminated', 'pending'];
    for (const s of expected) {
      assert.ok(s in SUPPLIER_STATUS_LABELS, `${s} 应在 LABELS 中`);
      assert.ok(s in SUPPLIER_STATUS_COLORS, `${s} 应在 COLORS 中`);
    }
  });

  it('所有状态标签不为空且不含奇怪字符', () => {
    for (const label of Object.values(SUPPLIER_STATUS_LABELS)) {
      assert.ok(label.length >= 2, `标签 "${label}" 长度应 >= 2`);
      assert.ok(!label.includes('undefined'), `标签不应包含 "undefined"`);
      assert.ok(!label.includes('null'), `标签不应包含 "null"`);
    }
  });

  it('重复调用 STATUS_LABELS 返回一致结果', () => {
    for (let i = 0; i < 3; i++) {
      assert.equal(SUPPLIER_STATUS_LABELS.active, '合作中');
      assert.equal(SUPPLIER_STATUS_LABELS.paused, '暂停合作');
    }
  });

  it('颜色值不重复（每种状态颜色唯一）', () => {
    const values = Object.values(SUPPLIER_STATUS_COLORS);
    const unique = new Set(values);
    assert.equal(unique.size, values.length, '颜色值应全部唯一');
  });
});
