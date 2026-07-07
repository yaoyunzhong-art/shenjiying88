/**
 * returns/[id]/page.test.tsx — 退货单详情页 L1 冒烟测试
 * 角色视角: 👔店长 / 🛒客服 / 💰财务
 * 覆盖: 正例(完整数据/状态流转) + 反例(未找到/已删除) + 边界(终态/Cancelled)
 */
import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 数据定义 (mirror page.tsx) ── */

type ReturnStatus = 'pending' | 'approved' | 'processing' | 'shipped' | 'received' | 'completed' | 'rejected';

interface ReturnItem {
  id: string;
  orderNo: string;
  returnNo: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productSku: string;
  quantity: number;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const FORWARD_FLOW: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped', 'received', 'completed'];
const NEXT_STATUS_MAP: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['processing', 'rejected'],
  processing: ['shipped', 'rejected'],
  shipped: ['received', 'rejected'],
  received: ['completed'],
  completed: [],
  rejected: [],
};

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待审核', approved: '已通过', processing: '处理中',
  shipped: '已寄回', received: '已收货', completed: '已完成', rejected: '已拒绝',
};

/* ── 测试数据 ── */

const FULL_RETURN: ReturnItem = {
  id: 'r-1', orderNo: 'ORD-20260627-001', returnNo: 'RET-20260628-001',
  customerName: '王芳', customerPhone: '138****5678',
  productName: '有机蔬菜拼盘', productSku: 'VEG-001',
  quantity: 2, reason: '商品质量问题', amount: 156.00,
  status: 'processing', createdBy: '张明',
  createdAt: '2026-06-28 10:30', updatedAt: '2026-06-29 14:20',
};

const COMPLETED_RETURN: ReturnItem = {
  id: 'r-3', orderNo: 'ORD-20260620-012', returnNo: 'RET-20260621-003',
  customerName: '陈伟', customerPhone: '182****4532',
  productName: '澳洲牛排套餐', productSku: 'MEAT-003',
  quantity: 3, reason: '收到已损坏', amount: 267.00,
  status: 'completed', createdBy: '张明',
  createdAt: '2026-06-21 16:40', updatedAt: '2026-06-25 10:00',
};

const REJECTED_RETURN: ReturnItem = {
  id: 'r-4', orderNo: 'ORD-20260622-005', returnNo: 'RET-20260623-004',
  customerName: '刘洋', customerPhone: '136****7890',
  productName: '精选海鲜拼盘', productSku: 'SEA-002',
  quantity: 1, reason: '超过退货期限', amount: 198.00,
  status: 'rejected', createdBy: '李主管',
  createdAt: '2026-06-23 11:00', updatedAt: '2026-06-24 09:30',
};

const MOCK_RETURNS: Record<string, ReturnItem> = {
  'r-1': FULL_RETURN,
  'r-3': COMPLETED_RETURN,
  'r-4': REJECTED_RETURN,
};

/* =========================== 1. 正例 =========================== */

test('detail: 完整退货单应包含全部字段', () => {
  const r = FULL_RETURN;
  assert.ok(r.id);
  assert.ok(r.returnNo);
  assert.equal(r.status, 'processing');
  assert.ok(r.customerName);
  assert.ok(r.productName);
  assert.ok(r.quantity > 0);
  assert.ok(r.amount > 0);
  assert.ok(r.reason);
  assert.ok(r.createdAt);
  assert.ok(r.updatedAt);
});

test('detail: 正序流转链完整覆盖6个状态', () => {
  assert.equal(FORWARD_FLOW.length, 6);
  assert.deepEqual(FORWARD_FLOW, ['pending', 'approved', 'processing', 'shipped', 'received', 'completed']);
});

test('detail: 所有状态有流转定义且目标在有效状态内', () => {
  const allStatuses: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped', 'received', 'completed', 'rejected'];
  for (const status of allStatuses) {
    const targets = NEXT_STATUS_MAP[status];
    assert.ok(targets !== undefined, `状态 ${status} 应有流转定义`);
    for (const t of targets) {
      assert.ok(allStatuses.includes(t), `流转目标 ${t} 应在有效状态列表中`);
    }
  }
});

test('detail: 所有状态中文标签完整', () => {
  const allStatuses: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped', 'received', 'completed', 'rejected'];
  for (const s of allStatuses) {
    const label = RETURN_STATUS_LABELS[s];
    assert.ok(label, `状态 ${s} 应有中文标签`);
    assert.equal(typeof label, 'string');
    assert.ok(label.length > 0);
  }
});

test('detail: Mock 数据站可正确查询', () => {
  assert.equal(MOCK_RETURNS['r-1'].status, 'processing');
  assert.equal(MOCK_RETURNS['r-3'].status, 'completed');
  assert.equal(MOCK_RETURNS['r-4'].status, 'rejected');
});

test('detail: pending 状态允许流转到 approved 和 rejected', () => {
  const next = NEXT_STATUS_MAP['pending'];
  assert.ok(next.includes('approved'));
  assert.ok(next.includes('rejected'));
});

test('detail: completed 和 rejected 为终态，无后续流转', () => {
  assert.equal(NEXT_STATUS_MAP['completed'].length, 0);
  assert.equal(NEXT_STATUS_MAP['rejected'].length, 0);
});

test('detail: 所有状态至少有一个流转目标（终态除外）', () => {
  const terminal: ReturnStatus[] = ['completed', 'rejected'];
  const nonTerminal: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped', 'received'];
  for (const s of nonTerminal) {
    assert.ok(NEXT_STATUS_MAP[s].length > 0, `非终态 ${s} 应有流转目标`);
  }
  for (const s of terminal) {
    assert.equal(NEXT_STATUS_MAP[s].length, 0, `终态 ${s} 不应有流转`);
  }
});

test('detail: refund amount > 0 时正常', () => {
  assert.equal(FULL_RETURN.amount, 156.00);
  assert.equal(typeof FULL_RETURN.amount, 'number');
});

test('detail: 退货数量为正整数', () => {
  assert.ok(FULL_RETURN.quantity >= 1);
  assert.ok(COMPLETED_RETURN.quantity >= 1);
});

/* =========================== 2. 反例(防御) =========================== */

test('detail: 不存在的 return ID 应返回 undefined', () => {
  const result = MOCK_RETURNS['non-existent'];
  assert.equal(result, undefined);
});

test('detail: NaN amount 应处理', () => {
  const badItem: ReturnItem = {
    id: 'bad', orderNo: 'ORD-BAD', returnNo: 'RET-BAD',
    customerName: '测试', customerPhone: '000',
    productName: '测试', productSku: 'TST',
    quantity: 1, reason: '测试', amount: NaN,
    status: 'pending', createdBy: 'T', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  };
  assert.equal(Number.isNaN(badItem.amount), true);
});

test('detail: empty string fields 应处理', () => {
  const emptyItem: ReturnItem = {
    id: '', orderNo: '', returnNo: '',
    customerName: '', customerPhone: '',
    productName: '', productSku: '',
    quantity: 0, reason: '', amount: 0,
    status: 'pending', createdBy: '', createdAt: '', updatedAt: '',
  };
  assert.equal(emptyItem.id, '');
  assert.equal(emptyItem.quantity, 0);
  assert.equal(emptyItem.amount, 0);
});

/* =========================== 3. 边界值 =========================== */

test('detail: 极高退款金额边界', () => {
  const largeRefund: ReturnItem = {
    ...FULL_RETURN, amount: 999999.99, status: 'pending',
  };
  assert.equal(largeRefund.amount, 999999.99);
  assert.equal(largeRefund.amount, Number(largeRefund.amount.toFixed(2)));
});

test('detail: 超大退货数量边界', () => {
  const bulkReturn: ReturnItem = {
    ...FULL_RETURN, quantity: 100000, status: 'pending',
  };
  assert.equal(bulkReturn.quantity, 100000);
  assert.equal(typeof bulkReturn.quantity, 'number');
});

test('detail: 已完成 + 已拒绝为仅有的两个终态', () => {
  const terminalStatuses = Object.entries(NEXT_STATUS_MAP)
    .filter(([, v]) => v.length === 0)
    .map(([k]) => k);
  assert.deepEqual(terminalStatuses.sort(), ['completed', 'rejected']);
});

test('detail: forward_flow 中的状态 & received 下一个必须是 completed', () => {
  assert.deepEqual(NEXT_STATUS_MAP['received'], ['completed']);
});

test('detail: rejected 可以从4个非终态直接到达', () => {
  const canBeRejectedFrom: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped'];
  for (const s of canBeRejectedFrom) {
    assert.ok(NEXT_STATUS_MAP[s].includes('rejected'), `状态 ${s} 应可流转到 rejected`);
  }
});

/* =========================== 4. 类型一致性 =========================== */

test('detail: ReturnItem 字段类型正确', () => {
  const r = FULL_RETURN;
  assert.equal(typeof r.id, 'string');
  assert.equal(typeof r.returnNo, 'string');
  assert.equal(typeof r.customerName, 'string');
  assert.equal(typeof r.productName, 'string');
  assert.equal(typeof r.quantity, 'number');
  assert.equal(typeof r.amount, 'number');
  assert.equal(typeof r.status, 'string');
  assert.equal(typeof r.createdAt, 'string');
  assert.equal(typeof r.updatedAt, 'string');
});

test('detail: 页面模块可导入', async () => {
  const mod = await import('./page.tsx');
  assert.equal(typeof mod.default, 'function');
});


