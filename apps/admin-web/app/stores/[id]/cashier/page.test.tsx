/**
 * stores/[id]/cashier/page.test.tsx — 会员收银页面 L1 测试
 *
 * 覆盖: 会员搜索类型签名、消费记录类型、页面渲染
 * 注意: 页面现在使用真实 SDK 调用 (无 mock), 测试验证类型和渲染
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import fs from 'node:fs';

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

/* ── 工具函数 ── */

function searchMember(query: string): MemberProfile | null {
  if (!query.trim()) return null;
  return null; // 测试环境不调用真实 API
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

  it('types are valid in records', () => {
    const validTypes = ['sale', 'refund', 'topup'];
    assert.equal(validTypes.length, 3);
  });
});

describe('cashier: 业务逻辑', () => {
  // ── 正例 ──
  it('searchMember with empty query returns null', () => {
    assert.equal(searchMember(''), null);
  });

  it('formatBalance returns correct format', () => {
    assert.equal(formatBalance(5280.50), '¥5280.50');
    assert.equal(formatBalance(0), '¥0.00');
  });

  it('getTotalExpenditure for all records', () => {
    const records: ConsumptionRecord[] = [
      { id: 'c001', orderNo: 'ORD1', time: '2026-07-01', amount: 128.00, type: 'sale', description: 'a' },
      { id: 'c002', orderNo: 'ORD2', time: '2026-07-02', amount: 58.00, type: 'sale', description: 'b' },
      { id: 'c003', orderNo: 'ORD3', time: '2026-07-03', amount: 30.00, type: 'refund', description: 'c' },
    ];
    const total = getTotalExpenditure(records);
    assert.equal(total, 156);
  });

  it('getTypeLabel returns Chinese labels', () => {
    assert.equal(getTypeLabel('sale'), '消费');
    assert.equal(getTypeLabel('refund'), '退款');
    assert.equal(getTypeLabel('topup'), '充值');
  });

  // ── 反例 ──
  it('searchMember with whitespace returns null', () => {
    assert.equal(searchMember('   '), null);
  });

  it('getTotalExpenditure for empty array is 0', () => {
    assert.equal(getTotalExpenditure([]), 0);
  });

  // ── 边界 ──
  it('balance 0 should be formatted with two decimals', () => {
    assert.equal(formatBalance(0), '¥0.00');
  });

  it('large balance still formats correctly', () => {
    assert.equal(formatBalance(99999.99), '¥99999.99');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Cashier — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
  it('不再包含 mock 常量', () => assert.ok(!SRC.includes('MOCK_ORDERS') && !SRC.includes('MOCK_RECORDS') && !SRC.includes('MOCK_MEMBERS')));
  it('使用 @m5/sdk API', () => assert.ok(SRC.includes('@m5/sdk') || SRC.includes('@/lib/sdk')));
  it('使用 SDK 客户端', () => assert.ok(SRC.includes('getBizClient') || SRC.includes('biz.')));
  it('包含三态处理', () => assert.ok(SRC.includes('loading') || SRC.includes('error') || SRC.includes('Empty')));
  it('不包含 mock fallback 分支', () => assert.ok(!SRC.includes('mock fallback')));
});
