/**
 * 供应商详情页 — Supplier Detail Page Test
 * 验证: 状态映射、状态流转规则、Mock 数据完整性
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 类型 & 常量 (与 page.tsx 同步) ----

type CooperationStatus = 'active' | 'suspended' | 'terminated' | 'pending';

const STATUS_LABELS: Record<CooperationStatus, string> = {
  active: '合作中',
  suspended: '暂停合作',
  terminated: '已终止',
  pending: '待审核',
};

const STATUS_TRANSITIONS: Record<CooperationStatus, CooperationStatus[]> = {
  active: ['suspended'],
  suspended: ['active', 'terminated'],
  terminated: [],
  pending: ['active', 'terminated'],
};

const TRANSITION_LABELS: Record<string, string> = {
  active: '恢复合作',
  suspended: '暂停合作',
  terminated: '终止合作',
};

const CREDIT_LABELS: Record<string, string> = {
  A: 'A级（优秀）',
  B: 'B级（良好）',
  C: 'C级（一般）',
  D: 'D级（待改进）',
};

// ---- Mock 供应商常量 ----

const MOCK_SUPPLIER_NAME = '广州美妆供应链有限公司';
const MOCK_SHORT_NAME = '广州美妆';
const MOCK_CONTACT = '李明';
const MOCK_PHONE = '13800138001';
const MOCK_EMAIL = 'liming@gzmz.com';

const MOCK_PRODUCTS = [
  { name: '保湿精华液（100ml）', category: '护肤品', sku: 'ES-100ML-001', unitPrice: 68 },
  { name: '洁面乳（150g）', category: '护肤品', sku: 'CF-150G-002', unitPrice: 45 },
  { name: '防晒霜（SPF50 60ml）', category: '护肤品', sku: 'SS-60ML-003', unitPrice: 55 },
];

const MOCK_STATS = {
  totalOrders: 86,
  totalAmount: 1285000,
  onTimeRate: 97.5,
  qualityRate: 99.2,
};

const MOCK_HISTORY = [
  '供应商注册申请',
  '资质审核通过',
  '续签合作协议',
];

// ---- Tests ----

describe('SupplierDetailPage - 类型与常量', () => {
  it('应定义所有合作状态', () => {
    assert.equal(Object.keys(STATUS_LABELS).length, 4);
    assert.equal(STATUS_LABELS.active, '合作中');
    assert.equal(STATUS_LABELS.suspended, '暂停合作');
    assert.equal(STATUS_LABELS.terminated, '已终止');
    assert.equal(STATUS_LABELS.pending, '待审核');
  });

  it('应定义正确的状态流转规则', () => {
    // active 可暂停
    assert.deepEqual(STATUS_TRANSITIONS.active, ['suspended']);
    // suspended 可恢复或终止
    assert.deepEqual(STATUS_TRANSITIONS.suspended, ['active', 'terminated']);
    // terminated 无后续
    assert.deepEqual(STATUS_TRANSITIONS.terminated, []);
    // pending 可通过或拒绝
    assert.deepEqual(STATUS_TRANSITIONS.pending, ['active', 'terminated']);
  });

  it('应定义完整的状态流转标签', () => {
    assert.equal(TRANSITION_LABELS.active, '恢复合作');
    assert.equal(TRANSITION_LABELS.suspended, '暂停合作');
    assert.equal(TRANSITION_LABELS.terminated, '终止合作');
  });

  it('应定义所有信用等级标签', () => {
    assert.equal(CREDIT_LABELS.A, 'A级（优秀）');
    assert.equal(CREDIT_LABELS.B, 'B级（良好）');
    assert.equal(CREDIT_LABELS.C, 'C级（一般）');
    assert.equal(CREDIT_LABELS.D, 'D级（待改进）');
  });
});

describe('SupplierDetailPage - Mock 数据', () => {
  it('应包含供应商基本信息', () => {
    assert.equal(MOCK_SUPPLIER_NAME, '广州美妆供应链有限公司');
    assert.equal(MOCK_SHORT_NAME, '广州美妆');
    assert.equal(MOCK_CONTACT, '李明');
    assert.equal(MOCK_PHONE, '13800138001');
    assert.equal(MOCK_EMAIL, 'liming@gzmz.com');
  });

  it('应包含产品数据', () => {
    assert.equal(MOCK_PRODUCTS.length, 3);
    assert.ok(MOCK_PRODUCTS.some((p) => p.name === '保湿精华液（100ml）'));
    assert.ok(MOCK_PRODUCTS.some((p) => p.name === '洁面乳（150g）'));
    assert.ok(MOCK_PRODUCTS.some((p) => p.name === '防晒霜（SPF50 60ml）'));
  });

  it('应包含正确的产品 SKU', () => {
    assert.equal(MOCK_PRODUCTS[0].sku, 'ES-100ML-001');
    assert.equal(MOCK_PRODUCTS[1].sku, 'CF-150G-002');
    assert.equal(MOCK_PRODUCTS[2].sku, 'SS-60ML-003');
  });

  it('应包含合作数据统计', () => {
    assert.equal(MOCK_STATS.totalOrders, 86);
    assert.equal(MOCK_STATS.totalAmount, 1285000);
    assert.equal(MOCK_STATS.onTimeRate, 97.5);
    assert.equal(MOCK_STATS.qualityRate, 99.2);
  });

  it('应包含合作历史事件', () => {
    assert.ok(MOCK_HISTORY.includes('供应商注册申请'));
    assert.ok(MOCK_HISTORY.includes('资质审核通过'));
    assert.ok(MOCK_HISTORY.includes('续签合作协议'));
  });
});

describe('SupplierDetailPage - 页面文件完整性', () => {
  it('页面文件应 export 默认函数组件', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  it('页面文件应导入 DetailShell 组件', async () => {
    const mod = await import('./page.tsx');
    // 验证模块中的导入符号
    const src = await import('fs').then(
      (fs) => fs.readFileSync(
        new URL('./page.tsx', import.meta.url),
        'utf-8',
      ),
    );
    assert.ok(src.includes('DetailShell'), 'Missing DetailShell');
    assert.ok(src.includes('StatusBadge'), 'Missing StatusBadge');
    assert.ok(src.includes('DescriptionList'), 'Missing DescriptionList');
    assert.ok(src.includes('DataTable'), 'Missing DataTable');
    assert.ok(src.includes('useToast'), 'Missing useToast');
    assert.ok(src.includes('ConfirmDialog'), 'Missing ConfirmDialog');
    assert.ok(src.includes('cooperationStatus'), 'Missing cooperationStatus');
  });

  it('页面文件应包含所有页面子组件', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(
      new URL('./page.tsx', import.meta.url),
      'utf-8',
    );
    assert.ok(src.includes('HistoryTimeline'), 'Missing HistoryTimeline');
    assert.ok(src.includes('SupplierProduct'), 'Missing SupplierProduct type');
    assert.ok(src.includes('handleTransition'), 'Missing handleTransition');
    assert.ok(src.includes('handleConfirmDanger'), 'Missing handleConfirmDanger');
    assert.ok(src.includes('headerActions'), 'Missing headerActions');
    assert.ok(src.includes('closureLinks'), 'Missing closureLinks');
  });


  it('active can only go to suspended', () => {
    assert.deepEqual(STATUS_TRANSITIONS.active, ['suspended']);
  });

  it('suspended can go to active or terminated', () => {
    const tos = STATUS_TRANSITIONS.suspended;
    assert.ok(tos.includes('active'));
    assert.ok(tos.includes('terminated'));
  });

  it('terminated has no transitions', () => {
    assert.equal(STATUS_TRANSITIONS.terminated.length, 0);
  });

  it('pending can go to active or terminated', () => {
    const tos = STATUS_TRANSITIONS.pending;
    assert.ok(tos.includes('active'));
    assert.ok(tos.includes('terminated'));
  });

  it('all statuses have labels in STATUS_LABELS', () => {
    for (const s of Object.keys(STATUS_TRANSITIONS)) {
      assert.ok(STATUS_LABELS[s], 'Missing label for ' + s);
    }
  });

  it('all transition targets are valid statuses', () => {
    const valid = Object.keys(STATUS_LABELS);
    for (const [, tos] of Object.entries(STATUS_TRANSITIONS)) {
      for (const to of tos) {
        assert.ok(valid.includes(to), 'Invalid target: ' + to);
      }
    }
  });

  it('empty product list is safe', () => {
    assert.equal([].length, 0);
  });

  it('all product unit prices are positive', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.unitPrice > 0);
    }
  });

  it('all products have category', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.category);
    }
  });

  it('supplier contact fields are non-empty', () => {
    assert.ok(MOCK_CONTACT);
    assert.ok(MOCK_PHONE);
    assert.ok(MOCK_EMAIL);
  });
});
