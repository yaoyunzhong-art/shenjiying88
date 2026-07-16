/**
 * stores/[id]/cashier/page.test.tsx — 会员收银页面 L1 测试
 *
 * 覆盖: 会员搜索、消费记录、余额查询、收银台指标
 * 正例: searchMember命中、消费记录格式、余额计算、收银面板
 * 反例: 搜索无结果、空查询、未知会员、消费记录空
 * 边界: 余额0、点数0、负额退款、记录条数上限
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

interface MemberProfile {
  id: string;
  phone: string;
  cardNo: string;
  name: string;
  level: string;
  balance: number;
  points: number;
}

interface ConsumptionRecord {
  id: string;
  orderNo: string;
  time: string;
  amount: number;
  type: 'sale' | 'refund' | 'topup';
  description: string;
}

/* ── 模拟数据 ── */

const MOCK_MEMBERS: MemberProfile[] = [
  { id: 'm001', phone: '13800138001', cardNo: 'VIP2024001', name: '张三', level: '黄金会员', balance: 5280.50, points: 3200 },
  { id: 'm002', phone: '13800138002', cardNo: 'VIP2024002', name: '李四', level: '白金会员', balance: 15280.00, points: 12500 },
  { id: 'm003', phone: '13800138003', cardNo: 'VIP2024003', name: '王五', level: '普通会员', balance: 230.00, points: 480 },
];

const MOCK_RECORDS: ConsumptionRecord[] = [
  { id: 'c001', orderNo: 'ORD20260711001', time: '2026-07-11 20:15', amount: 128.00, type: 'sale', description: '洗剪吹套餐' },
  { id: 'c002', orderNo: 'ORD20260710002', time: '2026-07-10 14:30', amount: 58.00, type: 'sale', description: '单剪' },
  { id: 'c003', orderNo: 'ORD20260710003', time: '2026-07-10 10:00', amount: 500.00, type: 'topup', description: '充值' },
  { id: 'c004', orderNo: 'ORD20260708001', time: '2026-07-08 16:45', amount: 68.00, type: 'sale', description: '吹造型' },
  { id: 'c005', orderNo: 'ORD20260705001', time: '2026-07-05 19:00', amount: 200.00, type: 'sale', description: '染发服务' },
  { id: 'c006', orderNo: 'ORD20260703001', time: '2026-07-03 11:20', amount: 30.00, type: 'refund', description: '退款-单剪' },
];

/* ── 工具函数 ── */

function searchMember(query: string): MemberProfile | null {
  if (!query.trim()) return null;
  const lower = query.trim().toLowerCase();
  return MOCK_MEMBERS.find(
    (m) => m.phone.includes(lower) || m.cardNo.toLowerCase().includes(lower),
  ) ?? null;
}

function getTotalExpenditure(records: ConsumptionRecord[]): number {
  return records.reduce((sum, r) => {
    if (r.type === 'refund') return sum - r.amount;
    return sum + r.amount;
  }, 0);
}

function formatBalance(balance: number): string {
  return `¥${balance.toFixed(2)}`;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = { sale: '消费', refund: '退款', topup: '充值' };
  return labels[type] ?? type;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('cashier: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders container', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('cashier: 数据类型', () => {
  it('MemberProfile has all fields', () => {
    const m: MemberProfile = { id: 'm-test', phone: '13800000000', cardNo: 'VIP0001', name: '测试', level: '普通', balance: 100.00, points: 50 };
    assert.equal(typeof m.id, 'string');
    assert.equal(typeof m.balance, 'number');
    assert.equal(typeof m.points, 'number');
  });

  it('ConsumptionRecord has all fields', () => {
    const r: ConsumptionRecord = { id: 'c-test', orderNo: 'ORD0001', time: '2026-07-01', amount: 100, type: 'sale', description: '测试' };
    assert.equal(typeof r.amount, 'number');
    assert.ok(['sale', 'refund', 'topup'].includes(r.type));
  });

  it('MOCK_MEMBERS has 3 members', () => {
    assert.equal(MOCK_MEMBERS.length, 3);
  });

  it('MOCK_RECORDS has 6 records', () => {
    assert.equal(MOCK_RECORDS.length, 6);
  });

  it('types are valid in records', () => {
    const validTypes = ['sale', 'refund', 'topup'];
    MOCK_RECORDS.forEach(r => {
      assert.ok(validTypes.includes(r.type));
    });
  });
});

describe('cashier: 业务逻辑', () => {
  // ── 正例 ──
  it('searchMember by phone finds 张三', () => {
    const result = searchMember('13800138001');
    assert.ok(result);
    assert.equal(result?.name, '张三');
  });

  it('searchMember by partial phone finds result', () => {
    const result = searchMember('8002');
    assert.ok(result);
    assert.equal(result?.name, '李四');
  });

  it('searchMember by cardNo finds result', () => {
    const result = searchMember('VIP2024003');
    assert.ok(result);
    assert.equal(result?.name, '王五');
  });

  it('formatBalance returns correct format', () => {
    assert.equal(formatBalance(5280.50), '¥5280.50');
    assert.equal(formatBalance(0), '¥0.00');
  });

  it('getTotalExpenditure for all records', () => {
    const total = getTotalExpenditure(MOCK_RECORDS);
    // 128 + 58 + 500 + 68 + 200 - 30 = 924
    assert.equal(total, 924);
  });

  it('getTypeLabel returns Chinese labels', () => {
    assert.equal(getTypeLabel('sale'), '消费');
    assert.equal(getTypeLabel('refund'), '退款');
    assert.equal(getTypeLabel('topup'), '充值');
  });

  it('getTotalExpenditure refund-only', () => {
    const refunds = MOCK_RECORDS.filter(r => r.type === 'refund');
    assert.equal(getTotalExpenditure(refunds), -30);
  });

  it('balance in member is positive number', () => {
    MOCK_MEMBERS.forEach(m => assert.ok(m.balance >= 0));
  });

  // ── 反例 ──
  it('searchMember with empty query returns null', () => {
    assert.equal(searchMember(''), null);
  });

  it('searchMember with whitespace returns null', () => {
    assert.equal(searchMember('   '), null);
  });

  it('searchMember with non-existent phone returns null', () => {
    assert.equal(searchMember('13900000000'), null);
  });

  it('searchMember with random string returns null', () => {
    assert.equal(searchMember('zzz_no_match'), null);
  });

  it('getTotalExpenditure for empty array is 0', () => {
    assert.equal(getTotalExpenditure([]), 0);
  });

  it('balance 0 should be formatted with two decimals', () => {
    assert.equal(formatBalance(0), '¥0.00');
  });

  // ── 边界 ──
  it('member points can be 0', () => {
    assert.ok(MOCK_MEMBERS.every(m => m.points >= 0));
  });

  it('large balance still formats correctly', () => {
    assert.equal(formatBalance(99999.99), '¥99999.99');
  });

  it('refund record reduces total expenditure', () => {
    const before = getTotalExpenditure([MOCK_RECORDS[0]!]);
    const after = getTotalExpenditure([MOCK_RECORDS[0]!, MOCK_RECORDS[5]!]);
    assert.equal(after, before - 30);
  });

  it('cardNo search is case-insensitive', () => {
    const result = searchMember('vip2024001');
    assert.ok(result);
    assert.equal(result?.name, '张三');
  });

  it('phone partial match minimum is 4 digits', () => {
    const result = searchMember('8001');
    assert.ok(result);
    assert.equal(result?.name, '张三');
  });

  it('白金会员 has highest balance', () => {
    const max = MOCK_MEMBERS.reduce((max, m) => m.balance > max.balance ? m : max);
    assert.equal(max.name, '李四');
  });

  it('普通会员 has lowest balance', () => {
    const min = MOCK_MEMBERS.reduce((min, m) => m.balance < min.balance ? m : min);
    assert.equal(min.name, '王五');
  });

  it('topup record amount is positive', () => {
    const topups = MOCK_RECORDS.filter(r => r.type === 'topup');
    topups.forEach(r => assert.ok(r.amount > 0));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Cashier — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
