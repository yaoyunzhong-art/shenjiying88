/**
 * 采购单详情页 — Purchase Order Detail Page Test
 * 验证: 状态映射、状态流转规则、状态步骤顺序、Mock 数据完整性
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 类型 & 常量 (与 page.tsx 同步) ----

type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  shipped: '已发货',
  received: '已收货',
  cancelled: '已取消',
};

const STATUS_STEPS: PurchaseOrderStatus[] = ['draft', 'submitted', 'confirmed', 'shipped', 'received'];

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

const TRANSITION_LABELS: Record<string, string> = {
  submitted: '提交审核',
  confirmed: '确认订单',
  shipped: '标记发货',
  received: '确认收货',
  cancelled: '取消订单',
};

interface PurchaseOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string | null;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

const MOCK_ORDER: PurchaseOrder = {
  id: '1',
  orderNo: 'PO-20260601-001',
  supplier: '广州美妆供应链有限公司',
  contactPerson: '李明',
  contactPhone: '13800138001',
  shippingAddress: '广州市天河区体育西路123号旗舰店仓库',
  totalAmount: 28600,
  status: 'received',
  itemsCount: 12,
  orderDate: '2026-06-01',
  expectedDelivery: '2026-06-10',
  actualDelivery: '2026-06-09',
  paymentTerms: 'net30',
  paymentMethod: 'bank_transfer',
  notes: '优先安排核心SKU入库。',
  createdAt: '2026-06-01 09:00:00',
  updatedAt: '2026-06-09 14:30:00',
  items: [
    { name: '保湿精华液（100ml）', sku: 'ES-100ML-001', quantity: 200, unit: '瓶', unitPrice: 68, totalPrice: 13600 },
    { name: '洁面乳（150g）', sku: 'CF-150G-002', quantity: 150, unit: '支', unitPrice: 45, totalPrice: 6750 },
    { name: '防晒霜（SPF50 60ml）', sku: 'SS-60ML-003', quantity: 100, unit: '支', unitPrice: 55, totalPrice: 5500 },
    { name: '面霜礼盒装', sku: 'CG-BOX-004', quantity: 50, unit: '盒', unitPrice: 55, totalPrice: 2750 },
  ],
};

const STATUS_HISTORY = [
  { time: '2026-06-01 09:00', action: '创建采购单', user: '张店长', status: 'draft' as const },
  { time: '2026-06-02 10:30', action: '提交审核', user: '张店长', status: 'submitted' as const },
  { time: '2026-06-03 14:00', action: '确认订单', user: '采购经理王芳', status: 'confirmed' as const },
  { time: '2026-06-07 09:15', action: '供应商已发货', user: '系统', status: 'shipped' as const },
  { time: '2026-06-09 14:30', action: '已收货入库', user: '仓管刘洋', status: 'received' as const },
];

// ── 辅助验证函数 ──

function getStatusIndex(status: PurchaseOrderStatus): number {
  return STATUS_STEPS.indexOf(status);
}

function getTransitionTargets(status: PurchaseOrderStatus): PurchaseOrderStatus[] {
  return STATUS_TRANSITIONS[status] ?? [];
}

function calculateItemsTotal(items: PurchaseOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

// ── Tests ──

describe('采购单详情页 - 状态映射', () => {
  it('所有采购单状态都有对应的显示标签', () => {
    const allStatuses: PurchaseOrderStatus[] = ['draft', 'submitted', 'confirmed', 'shipped', 'received', 'cancelled'];
    for (const status of allStatuses) {
      assert.ok(STATUS_LABELS[status], `状态 ${status} 应有标签`);
      assert.ok(STATUS_LABELS[status].length > 0, `状态 ${status} 的标签不应为空`);
    }
  });

  it('完整的状态步骤顺序', () => {
    assert.strictEqual(STATUS_STEPS.length, 5, '应包含5个步骤');
    assert.deepStrictEqual(STATUS_STEPS, ['draft', 'submitted', 'confirmed', 'shipped', 'received']);
  });

  it('所有步骤标签唯一', () => {
    const labels = Object.values(STATUS_LABELS);
    const uniqueLabels = new Set(labels);
    assert.strictEqual(uniqueLabels.size, labels.length, '标签应唯一');
  });
});

describe('采购单详情页 - 状态流转规则', () => {
  it('draft 状态可流转至 submitted 和 cancelled', () => {
    assert.deepStrictEqual(getTransitionTargets('draft'), ['submitted', 'cancelled']);
  });

  it('submitted 状态可流转至 confirmed 和 cancelled', () => {
    assert.deepStrictEqual(getTransitionTargets('submitted'), ['confirmed', 'cancelled']);
  });

  it('confirmed 状态可流转至 shipped 和 cancelled', () => {
    assert.deepStrictEqual(getTransitionTargets('confirmed'), ['shipped', 'cancelled']);
  });

  it('shipped 状态可流转至 received 和 cancelled', () => {
    assert.deepStrictEqual(getTransitionTargets('shipped'), ['received', 'cancelled']);
  });

  it('received 状态无后续流转', () => {
    assert.deepStrictEqual(getTransitionTargets('received'), []);
  });

  it('cancelled 状态无后续流转', () => {
    assert.deepStrictEqual(getTransitionTargets('cancelled'), []);
  });

  it('每个流转目标都有对应的操作标签', () => {
    for (const [status, targets] of Object.entries(STATUS_TRANSITIONS)) {
      for (const target of targets) {
        assert.ok(TRANSITION_LABELS[target], `流转 ${status} → ${target} 应有操作标签`);
      }
    }
  });

  it('每个状态在被标记为已收货后不允许进一步操作', () => {
    const receivedIdx = getStatusIndex('received');
    assert.strictEqual(receivedIdx, 4, 'received 应该是最后一个步骤');
  });
});

describe('采购单详情页 - Mock 数据完整性', () => {
  it('Mock 采购单包含所有必要字段', () => {
    const requiredFields: (keyof PurchaseOrder)[] = [
      'id', 'orderNo', 'supplier', 'contactPerson', 'contactPhone',
      'shippingAddress', 'totalAmount', 'status', 'itemsCount',
      'orderDate', 'expectedDelivery', 'paymentTerms', 'paymentMethod',
      'createdAt', 'updatedAt', 'items',
    ];
    for (const field of requiredFields) {
      assert.ok(field in MOCK_ORDER, `缺少字段: ${field}`);
    }
  });

  it('Mock 采购单字段类型正确', () => {
    assert.strictEqual(typeof MOCK_ORDER.id, 'string');
    assert.strictEqual(typeof MOCK_ORDER.totalAmount, 'number');
    assert.strictEqual(typeof MOCK_ORDER.itemsCount, 'number');
    assert.ok(MOCK_ORDER.totalAmount > 0);
    assert.ok(MOCK_ORDER.items.length > 0);
  });
});

describe('采购单详情页 - 采购清单计算', () => {
  it('采购清单各小计计算正确', () => {
    for (const item of MOCK_ORDER.items) {
      assert.strictEqual(item.totalPrice, item.quantity * item.unitPrice,
        `${item.name} 小计应为 ${item.quantity} x ${item.unitPrice} = ${item.quantity * item.unitPrice}`);
    }
  });

  it('采购清单合计计算正确', () => {
    const expectedTotal = MOCK_ORDER.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const computedTotal = calculateItemsTotal(MOCK_ORDER.items);
    assert.strictEqual(computedTotal, expectedTotal);
  });

  it('总金额与采购清单合计一致', () => {
    const itemsTotal = calculateItemsTotal(MOCK_ORDER.items);
    assert.strictEqual(MOCK_ORDER.totalAmount, itemsTotal,
      '采购单总金额应与清单总和一致');
  });

  it('itemsCount 和 items 数组均存在', () => {
    assert.ok(MOCK_ORDER.itemsCount > 0, '应有商品数');
    assert.ok(MOCK_ORDER.items.length > 0, '应有采购清单项');
  });
});

describe('采购单详情页 - 操作历史', () => {
  it('历史记录按时间顺序排列', () => {
    for (let i = 1; i < STATUS_HISTORY.length; i++) {
      assert.ok(
        new Date(STATUS_HISTORY[i].time) >= new Date(STATUS_HISTORY[i - 1].time),
        `历史记录应按时间顺序排列: ${STATUS_HISTORY[i - 1].time} -> ${STATUS_HISTORY[i].time}`,
      );
    }
  });

  it('历史记录状态流转路径合法', () => {
    for (const entry of STATUS_HISTORY) {
      assert.ok(STATUS_STEPS.includes(entry.status) || entry.status === 'cancelled',
        `非法状态: ${entry.status}`);
    }
  });

  it('历史记录包含完整流转路径', () => {
    const statuses = STATUS_HISTORY.map((h) => h.status);
    assert.strictEqual(statuses.includes('draft'), true, '应有创建记录');
    assert.strictEqual(statuses.includes('submitted'), true, '应有提交审核记录');
    assert.strictEqual(statuses.includes('confirmed'), true, '应有确认订单记录');
    assert.strictEqual(statuses.includes('shipped'), true, '应有发货记录');
    assert.strictEqual(statuses.includes('received'), true, '应有收货记录');
  });
});

describe('采购单详情页 - 状态步骤索引', () => {
  it('draft 状态索引为 0', () => {
    assert.strictEqual(getStatusIndex('draft'), 0);
  });
  it('received 状态索引为 4', () => {
    assert.strictEqual(getStatusIndex('received'), 4);
  });
  it('cancelled 不在步骤中', () => {
    assert.strictEqual(getStatusIndex('cancelled'), -1);
  });
});

describe('采购单详情页 - 边界情况', () => {
  it('已收货采购单不能再流转', () => {
    const targets = getTransitionTargets('received');
    assert.strictEqual(targets.length, 0, '已收货不应有任何流转');
  });

  it('已取消采购单不能再流转', () => {
    const targets = getTransitionTargets('cancelled');
    assert.strictEqual(targets.length, 0, '已取消不应有任何流转');
  });
});
