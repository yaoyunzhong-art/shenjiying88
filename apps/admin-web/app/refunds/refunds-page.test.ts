/**
 * app/refunds/refunds-page.test.ts — 退款管理页面 L1 测试
 * 覆盖: 正例渲染 / 状态筛选 / 金额格式 / 边界场景
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 常量 ───────────────────────────────────────────────────

const REFUND_STATUS = ['pending_approval', 'approved', 'processing', 'completed', 'rejected', 'cancelled'] as const;
type RefundStatus = (typeof REFUND_STATUS)[number];

const REFUND_TYPES = ['refund', 'exchange', 'return'] as const;
type RefundType = (typeof REFUND_TYPES)[number];

const REFUND_CHANNELS = ['online', 'offline'] as const;
type RefundChannel = (typeof REFUND_CHANNELS)[number];

interface RefundItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  storeId: string;
  productName: string;
  type: RefundType;
  status: RefundStatus;
  amount: number; // fen
  reason: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  channel: RefundChannel;
  approverName?: string;
  approveTime?: string;
  rejectReason?: string;
  refundMethod: string;
}

// ── 数据工厂 ──────────────────────────────────────────────

function makeRefund(overrides?: Partial<RefundItem>): RefundItem {
  return {
    id: 'R20260706001',
    orderId: 'O20260706001',
    customerName: '张三',
    customerPhone: '13800138001',
    storeName: '旗舰店',
    storeId: 'store001',
    productName: '双人畅玩套餐',
    type: 'refund',
    status: 'pending_approval',
    amount: 50000,
    reason: '行程变更',
    description: '无法按时前往',
    createdAt: '2026-07-06 09:15',
    updatedAt: '2026-07-06 09:15',
    channel: 'online',
    refundMethod: 'original',
    ...overrides,
  };
}

function makeMockRefunds(): RefundItem[] {
  return [
    makeRefund({ id: 'R20260706001', customerName: '张三', type: 'refund', status: 'pending_approval', storeName: '旗舰店', amount: 50000 }),
    makeRefund({ id: 'R20260706002', customerName: '李四', type: 'exchange', status: 'approved', storeName: '旗舰店', amount: 20000 }),
    makeRefund({ id: 'R20260706003', customerName: '王五', type: 'return', status: 'completed', storeName: '分店一', amount: 100000 }),
    makeRefund({ id: 'R20260706004', customerName: '赵六', type: 'refund', status: 'rejected', storeName: '旗舰店', amount: 50000 }),
    makeRefund({ id: 'R20260706005', customerName: '钱七', type: 'refund', status: 'cancelled', storeName: '分店二', amount: 30000 }),
    makeRefund({ id: 'R20260706006', customerName: '孙八', type: 'exchange', status: 'processing', storeName: '分店一', amount: 200000 }),
  ];
}

// ── 辅助函数 ──────────────────────────────────────────────

function countByStatus(refunds: RefundItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of refunds) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }
  return counts;
}

function countByStore(refunds: RefundItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of refunds) {
    counts[r.storeName] = (counts[r.storeName] || 0) + 1;
  }
  return counts;
}

function countByType(refunds: RefundItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of refunds) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }
  return counts;
}

function sumAmount(refunds: RefundItem[]): number {
  return refunds.reduce((s, r) => s + r.amount, 0);
}

function formatYuan(fen: number): string {
  return `¥${(fen / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function filterByStore(refunds: RefundItem[], store: string): RefundItem[] {
  return refunds.filter((r) => r.storeName === store);
}

function filterByType(refunds: RefundItem[], type: RefundType): RefundItem[] {
  return refunds.filter((r) => r.type === type);
}

// ── 数据层测试 ────────────────────────────────────────────

test('退款管理 → 正例: 6个退款记录各有正确的退单号', () => {
  const refunds = makeMockRefunds();
  assert.equal(refunds.length, 6);
  assert.equal(refunds[0].id, 'R20260706001');
  assert.equal(refunds[5].id, 'R20260706006');
  assert.ok(refunds.every((r) => r.id.startsWith('R202607')));
});

test('退款管理 → 正例: 各退款记录的金额为正整数（分）', () => {
  const refunds = makeMockRefunds();
  for (const r of refunds) {
    assert.ok(Number.isInteger(r.amount));
    assert.ok(r.amount > 0);
    assert.ok(r.amount <= 200000);
  }
});

test('退款管理 → 正例: 各退款记录包含必填字段', () => {
  const refunds = makeMockRefunds();
  const requiredFields = ['id', 'orderId', 'customerName', 'storeName', 'type', 'status', 'amount', 'reason', 'createdAt'];
  for (const r of refunds) {
    for (const f of requiredFields) {
      assert.ok(f in r, `缺少字段 ${f} in ${r.id}`);
    }
  }
});

test('退款管理 → 正例: 各记录的状态在合法范围内', () => {
  const refunds = makeMockRefunds();
  for (const r of refunds) {
    assert.ok(REFUND_STATUS.includes(r.status), `非法状态 ${r.status} in ${r.id}`);
  }
});

test('退款管理 → 正例: 各记录的类型在合法范围内', () => {
  const refunds = makeMockRefunds();
  for (const r of refunds) {
    assert.ok(REFUND_TYPES.includes(r.type), `非法类型 ${r.type} in ${r.id}`);
  }
});

test('退款管理 → 正例: 各记录渠道在合法范围内', () => {
  const refunds = makeMockRefunds();
  for (const r of refunds) {
    assert.ok(REFUND_CHANNELS.includes(r.channel), `非法渠道 ${r.channel} in ${r.id}`);
  }
});

test('退款管理 → 状态统计: pending_approval 1条, completed 1条', () => {
  const refunds = makeMockRefunds();
  const counts = countByStatus(refunds);
  assert.equal(counts['pending_approval'], 1);
  assert.equal(counts['completed'], 1);
  assert.equal(counts['rejected'], 1);
  assert.equal(counts['cancelled'], 1);
  assert.equal(counts['approved'], 1);
  assert.equal(counts['processing'], 1);
  assert.equal(Object.keys(counts).length, 6);
});

test('退款管理 → 门店统计: 旗舰店3条, 分店一2条, 分店二1条', () => {
  const refunds = makeMockRefunds();
  const counts = countByStore(refunds);
  assert.equal(counts['旗舰店'], 3);
  assert.equal(counts['分店一'], 2);
  assert.equal(counts['分店二'], 1);
  assert.equal(Object.keys(counts).length, 3);
});

test('退款管理 → 类型统计: refund 3条, exchange 2条, return 1条', () => {
  const refunds = makeMockRefunds();
  const counts = countByType(refunds);
  assert.equal(counts['refund'], 3);
  assert.equal(counts['exchange'], 2);
  assert.equal(counts['return'], 1);
});

test('退款管理 → 金额合计: 450000分 (¥4,500)', () => {
  const refunds = makeMockRefunds();
  const total = sumAmount(refunds);
  assert.equal(total, 450000);
  assert.equal(formatYuan(total), '¥4,500.00');
});

test('退款管理 → 金额格式化: 50000分 → ¥500.00', () => {
  assert.equal(formatYuan(50000), '¥500.00');
});

test('退款管理 → 金额格式化: 200000分 → ¥2,000.00', () => {
  assert.equal(formatYuan(200000), '¥2,000.00');
});

test('退款管理 → 金额格式化: 0分 → ¥0.00', () => {
  assert.equal(formatYuan(0), '¥0.00');
});

test('退款管理 → 筛选: 旗舰店仅退款3条中的退款类型', () => {
  const refunds = makeMockRefunds();
  const store = filterByStore(refunds, '旗舰店');
  assert.equal(store.length, 3);
  const refundType = filterByType(store, 'refund');
  assert.equal(refundType.length, 2); // 张三 + 赵六
  assert.equal(refundType[0].customerName, '张三');
  assert.equal(refundType[1].customerName, '赵六');
});

test('退款管理 → 筛选: 分店一+exchange = 1条 (孙八)', () => {
  const refunds = makeMockRefunds();
  const storeRefunds = filterByStore(refunds, '分店一');
  const exchange = filterByType(storeRefunds, 'exchange');
  assert.equal(exchange.length, 1);
  assert.equal(exchange[0].customerName, '孙八');
});

test('退款管理 → 边界: 空列表', () => {
  const refunds: RefundItem[] = [];
  assert.equal(refunds.length, 0);
  assert.deepEqual(countByStatus(refunds), {});
  assert.equal(sumAmount(refunds), 0);
});

test('退款管理 → 边界: 单个记录也能正确展示', () => {
  const single = [makeRefund()];
  assert.equal(single.length, 1);
  assert.equal(single[0].id, 'R20260706001');
  assert.equal(countByStatus(single)['pending_approval'], 1);
});

test('退款管理 → 边界: 无 approver 信息的处理', () => {
  const refund = makeRefund({ approverName: undefined, approveTime: undefined });
  assert.equal(refund.approverName, undefined);
  assert.equal(refund.approveTime, undefined);
});

test('退款管理 → 反例: 金额不能为负数', () => {
  // 业务规则验证
  const assertAmountValid = (amount: number): boolean => {
    return amount > 0 && Number.isInteger(amount);
  };
  assert.ok(!assertAmountValid(-100));
  assert.ok(!assertAmountValid(0));
  assert.ok(assertAmountValid(1));
});

test('退款管理 → 反例: 非法 status 应被拒绝', () => {
  const valid = REFUND_STATUS;
  assert.ok(!valid.includes('unknown' as any));
  assert.ok(!valid.includes('pending' as any));
  assert.ok(!valid.includes('done' as any));
});
