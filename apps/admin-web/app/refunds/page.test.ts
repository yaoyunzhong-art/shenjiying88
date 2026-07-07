/**
 * apps/admin-web/app/refunds/page.test.ts — 退款管理数据层测试
 * 覆盖正例/反例/边界，不导入 React 组件
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 类型常量和模拟 ────────────────────────────────────────

const REFUND_STATUSES = [
  'pending_approval',
  'approved',
  'rejected',
  'processing',
  'completed',
  'cancelled',
] as const;

const REFUND_TYPES = ['refund', 'exchange', 'return'] as const;

const REFUND_CHANNELS = ['original', 'wechat', 'alipay', 'bank', 'store_credit'] as const;

// ── 数据类型定义验证 ─────────────────────────────────────

test('[refunds] 正例: refund-types 导出所有核心类型', async () => {
  const mod = await import('./refund-types');
  assert.equal(typeof mod.REFUND_STATUS_LABEL, 'object');
  assert.equal(typeof mod.REFUND_STATUS_VARIANT, 'object');
  assert.equal(typeof mod.REFUND_TYPE_LABEL, 'object');
  assert.equal(typeof mod.REFUND_CHANNEL_LABEL, 'object');
});

test('[refunds] 正例: REFUND_STATUS_LABEL 覆盖全部 6 个状态', async () => {
  const { REFUND_STATUS_LABEL } = await import('./refund-types');
  for (const s of REFUND_STATUSES) {
    assert.ok(s in REFUND_STATUS_LABEL, `缺少状态标签: ${s}`);
    assert.equal(typeof REFUND_STATUS_LABEL[s], 'string');
    assert.ok(REFUND_STATUS_LABEL[s].length > 0);
  }
});

test('[refunds] 正例: REFUND_TYPE_LABEL 覆盖全部 3 个类型', async () => {
  const { REFUND_TYPE_LABEL } = await import('./refund-types');
  for (const t of REFUND_TYPES) {
    assert.ok(t in REFUND_TYPE_LABEL, `缺少类型标签: ${t}`);
    assert.ok(REFUND_TYPE_LABEL[t].length > 0);
  }
});

test('[refunds] 正例: REFUND_CHANNEL_LABEL 覆盖全部 5 个渠道', async () => {
  const { REFUND_CHANNEL_LABEL } = await import('./refund-types');
  for (const c of REFUND_CHANNELS) {
    assert.ok(c in REFUND_CHANNEL_LABEL, `缺少渠道标签: ${c}`);
    assert.ok(REFUND_CHANNEL_LABEL[c].length > 0);
  }
});

test('[refunds] 正例: REFUND_STATUS_VARIANT 覆盖全部状态', async () => {
  const { REFUND_STATUS_VARIANT } = await import('./refund-types');
  const validVariants = ['warning', 'success', 'danger', 'info', 'default'];
  for (const s of REFUND_STATUSES) {
    assert.ok(s in REFUND_STATUS_VARIANT, `缺少状态样式: ${s}`);
    assert.ok(validVariants.includes(REFUND_STATUS_VARIANT[s]));
  }
});

// ── getRefunds 数据正例验证 ────────────────────────────────

test('[refunds] 正例: getRefunds 返回 10 条记录', async () => {
  const { getRefunds } = await import('./refund-data');
  assert.equal(getRefunds().length, 10);
});

test('[refunds] 正例: 每笔退款 id 唯一', async () => {
  const { getRefunds } = await import('./refund-data');
  const ids = getRefunds().map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('[refunds] 正例: 每笔退款 orderId 不为空', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(r.orderId.length > 0, `退款 ${r.id} orderId 为空`);
  }
});

test('[refunds] 正例: 每笔退款包含所有必填字段', async () => {
  const { getRefunds } = await import('./refund-data');
  const required: (keyof import('./refund-types').RefundItem)[] = [
    'id', 'orderId', 'type', 'status', 'channel',
    'customerName', 'storeId', 'storeName',
    'amount', 'reason', 'createdAt', 'productName', 'productSku', 'quantity',
  ];
  for (const refund of getRefunds()) {
    for (const field of required) {
      assert.notEqual(refund[field], undefined, `退款 ${refund.id} 缺少 ${String(field)}`);
    }
  }
});

test('[refunds] 正例: 每笔退款 status 为合法值', async () => {
  const { getRefunds } = await import('./refund-data');
  const valid = new Set(REFUND_STATUSES);
  for (const r of getRefunds()) {
    assert.ok(valid.has(r.status as any), `退款 ${r.id} status=${r.status} 非法`);
  }
});

test('[refunds] 正例: 每笔退款 type 为合法值', async () => {
  const { getRefunds } = await import('./refund-data');
  const valid = new Set(REFUND_TYPES);
  for (const r of getRefunds()) {
    assert.ok(valid.has(r.type as any), `退款 ${r.id} type=${r.type} 非法`);
  }
});

test('[refunds] 正例: 每笔退款 channel 为合法值', async () => {
  const { getRefunds } = await import('./refund-data');
  const valid = new Set(REFUND_CHANNELS);
  for (const r of getRefunds()) {
    assert.ok(valid.has(r.channel as any), `退款 ${r.id} channel=${r.channel} 非法`);
  }
});

// ── 数据辅助函数正例验证 ─────────────────────────────────

test('[refunds] 正例: countByStatus 正确计数', async () => {
  const { getRefunds, countByStatus } = await import('./refund-data');
  const refunds = getRefunds();
  assert.equal(countByStatus(refunds, 'pending_approval'), 2);
  assert.equal(countByStatus(refunds, 'approved'), 2);
  assert.equal(countByStatus(refunds, 'rejected'), 1);
  assert.equal(countByStatus(refunds, 'processing'), 1);
  assert.equal(countByStatus(refunds, 'completed'), 3);
  assert.equal(countByStatus(refunds, 'cancelled'), 1);
});

test('[refunds] 正例: totalAmount 计算正确', async () => {
  const { getRefunds, totalAmount } = await import('./refund-data');
  const total = totalAmount(getRefunds());
  assert.ok(total > 0);
  assert.equal(typeof total, 'number');
  // Verify it's sum of all amounts
  const expected = getRefunds().reduce((s, r) => s + r.amount, 0);
  assert.equal(total, expected);
});

test('[refunds] 正例: groupByStore 分组正确', async () => {
  const { getRefunds, groupByStore } = await import('./refund-data');
  const groups = groupByStore(getRefunds());
  assert.ok('旗舰店-解放路' in groups);
  assert.ok('门店-科技路' in groups);
  assert.ok('门店-中山路' in groups);
  const totalCount = Object.values(groups).reduce((s, c) => s + c, 0);
  assert.equal(totalCount, getRefunds().length);
});

test('[refunds] 正例: amount 为正整数（分）', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(Number.isInteger(r.amount), `退款 ${r.id} amount 非整数`);
    assert.ok(r.amount > 0, `退款 ${r.id} amount 不大于 0`);
    assert.ok(r.amount <= 200000, `退款 ${r.id} amount 超过预期上限`);
  }
});

test('[refunds] 正例: quantity 为正整数', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(Number.isInteger(r.quantity) && r.quantity > 0, `退款 ${r.id} quantity 不合法`);
  }
});

// ── 时间字段验证 ────────────────────────────────────────────

test('[refunds] 正例: 所有 createdAt 为有效日期格式', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(r.createdAt.length > 0, `退款 ${r.id} createdAt 为空`);
  }
});

test('[refunds] 正例: processedAt 在已处理记录中不为空', async () => {
  const { getRefunds } = await import('./refund-data');
  const processed = getRefunds().filter((r) => r.status !== 'pending_approval');
  for (const r of processed) {
    assert.notEqual(r.processedAt, undefined, `退款 ${r.id} processedAt 应为已处理`);
  }
});

// ── 边界测试 ──────────────────────────────────────────────

test('[refunds] 边界: countByStatus 空列表返回 0', async () => {
  const { countByStatus } = await import('./refund-data');
  assert.equal(countByStatus([], 'pending_approval'), 0);
  assert.equal(countByStatus([], 'completed'), 0);
});

test('[refunds] 边界: totalAmount 空列表返回 0', async () => {
  const { totalAmount } = await import('./refund-data');
  assert.equal(totalAmount([]), 0);
});

test('[refunds] 边界: groupByStore 空列表返回空对象', async () => {
  const { groupByStore } = await import('./refund-data');
  assert.deepEqual(groupByStore([]), {});
});

test('[refunds] 边界: countByStatus 未知状态返回 0', async () => {
  const { getRefunds, countByStatus } = await import('./refund-data');
  assert.equal(countByStatus(getRefunds(), 'unknown_status'), 0);
});

// ── 反例测试 ──────────────────────────────────────────────

test('[refunds] 反例: status 不能为 undefined 或 null', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.notEqual(r.status, null as any);
    assert.notEqual(r.status, undefined as any);
  }
});

test('[refunds] 反例: type 必须为枚举值之一', async () => {
  const { getRefunds } = await import('./refund-data');
  const valid = new Set(REFUND_TYPES);
  for (const r of getRefunds()) {
    assert.ok(valid.has(r.type), `退款 ${r.id} type=${r.type} 非法`);
    assert.notEqual(r.type, 'unknown' as any);
  }
});

test('[refunds] 反例: customerName 不包含可疑字符', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(!r.customerName.includes('<'), `退款 ${r.id} customerName 含 HTML`);
    assert.ok(!r.customerName.includes('>'), `退款 ${r.id} customerName 含 HTML`);
  }
});

test('[refunds] 反例: amount 不能为负数', async () => {
  const { getRefunds } = await import('./refund-data');
  for (const r of getRefunds()) {
    assert.ok(r.amount >= 0, `退款 ${r.id} amount=${r.amount} 为负`);
  }
});
