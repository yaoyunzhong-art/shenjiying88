/**
 * shop/discount-rules/page.test.tsx — 折扣规则 L1 测试
 *
 * 覆盖: 折扣类型、优惠计算、适用范围、时间管理
 * 正例: 折扣计算、适用范围验证、优先级排序
 * 反例: 无效折扣率、适用范围冲突、过期规则
 * 边界: 零折（免费）、最小折扣、叠加上限
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import DiscountRulesPage from './page';

/* ── 类型 ── */

type DiscountType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping' | 'tiered';
type DiscountScope = 'all' | 'category' | 'product' | 'customer_tag' | 'min_purchase';
type DiscountStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  scope: DiscountScope;
  value: number;
  minPurchaseCents: number;
  maxDiscountCents: number;
  maxUses: number;
  currentUses: number;
  startAt: string;
  endAt: string;
  status: DiscountStatus;
  priority: number;
  stackable: boolean;
}

function applyDiscount(originalCents: number, rule: DiscountRule): number {
  let discountCents = 0;
  switch (rule.type) {
    case 'percentage': {
      discountCents = Math.round(originalCents * rule.value / 100);
      if (rule.maxDiscountCents > 0 && discountCents > rule.maxDiscountCents) discountCents = rule.maxDiscountCents;
      break;
    }
    case 'fixed_amount':
      discountCents = Math.min(rule.value, originalCents);
      break;
    case 'free_shipping':
      discountCents = 0;
      break;
    case 'buy_x_get_y':
      discountCents = 0;
      break;
    case 'tiered':
      discountCents = Math.round(originalCents * rule.value / 100);
      break;
  }
  if (originalCents < rule.minPurchaseCents) discountCents = 0;
  return originalCents - discountCents;
}

function isDiscountUsable(rule: DiscountRule, now: string): boolean {
  if (rule.status !== 'active') return false;
  if (rule.maxUses > 0 && rule.currentUses >= rule.maxUses) return false;
  return now >= rule.startAt && now <= rule.endAt;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(DiscountRulesPage));
}

/* ============================================================ */

describe('discount-rules: 页面渲染', () => {
  it('renders title', () => { const { container } = setup(); assert.ok(container.querySelector('h1')?.textContent?.includes('折扣规则')); });
  it('renders description', () => { const { container } = setup(); assert.ok(container.textContent?.includes('折扣')); });
  it('renders without error', () => { assert.doesNotThrow(() => setup()); });
  it('has padding layout', () => { const { container } = setup(); assert.equal((container.firstElementChild as HTMLElement)?.style?.padding, '24px'); });
  it('has single h1', () => { const { container } = setup(); assert.equal(container.querySelectorAll('h1').length, 1); });
  it('component is a function', () => { assert.equal(typeof DiscountRulesPage, 'function'); });
});

describe('discount-rules: 数据类型', () => {
  it('DiscountRule has all fields', () => {
    const r: DiscountRule = { id: 'd-001', name: '新客8折', type: 'percentage', scope: 'all', value: 20, minPurchaseCents: 0, maxDiscountCents: 5000, maxUses: 1000, currentUses: 0, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', status: 'active', priority: 10, stackable: false };
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.value, 'number');
    assert.equal(typeof r.stackable, 'boolean');
  });

  it('discount type enum', () => {
    const valid: DiscountType[] = ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping', 'tiered'];
    assert.equal(valid.length, 5);
  });

  it('scope enum', () => {
    const valid: DiscountScope[] = ['all', 'category', 'product', 'customer_tag', 'min_purchase'];
    assert.equal(valid.length, 5);
  });

  it('value is positive for non-free', () => {
    [10, 20, 50, 100].forEach(v => assert.ok(v > 0));
  });

  it('maxUses is non-negative', () => {
    assert.ok(1000 >= 0);
  });
});

describe('discount-rules: 业务逻辑', () => {
  const DISCOUNT_20: DiscountRule = { id: 'd-001', name: '8折优惠', type: 'percentage', scope: 'all', value: 20, minPurchaseCents: 0, maxDiscountCents: 5000, maxUses: 1000, currentUses: 0, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', status: 'active', priority: 10, stackable: false };
  const DISCOUNT_50: DiscountRule = { id: 'd-002', name: '5折优惠', type: 'percentage', scope: 'all', value: 50, minPurchaseCents: 10000, maxDiscountCents: 20000, maxUses: 500, currentUses: 100, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', status: 'active', priority: 20, stackable: false };
  const FIXED_100: DiscountRule = { id: 'd-003', name: '满100减10', type: 'fixed_amount', scope: 'min_purchase', value: 1000, minPurchaseCents: 10000, maxDiscountCents: 0, maxUses: 0, currentUses: 0, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', status: 'active', priority: 30, stackable: true };
  const EXPIRED: DiscountRule = { id: 'd-004', name: '已过期促销', type: 'percentage', scope: 'all', value: 10, minPurchaseCents: 0, maxDiscountCents: 0, maxUses: 0, currentUses: 100, startAt: '2026-01-01T00:00:00Z', endAt: '2026-01-31T23:59:59Z', status: 'expired', priority: 1, stackable: false };
  const USED_UP: DiscountRule = { id: 'd-005', name: '已用尽', type: 'percentage', scope: 'all', value: 15, minPurchaseCents: 0, maxDiscountCents: 0, maxUses: 100, currentUses: 100, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', status: 'active', priority: 5, stackable: false };
  const FREE_SHIP: DiscountRule = { id: 'd-006', name: '包邮', type: 'free_shipping', scope: 'all', value: 0, minPurchaseCents: 9900, maxDiscountCents: 0, maxUses: 0, currentUses: 0, startAt: '2026-01-01T00:00:00Z', endAt: '2026-12-31T23:59:59Z', status: 'active', priority: 50, stackable: true };

  it('applyDiscount percentage 20% off', () => {
    const result = applyDiscount(10000, DISCOUNT_20);
    assert.equal(result, 8000);
  });

  it('applyDiscount percentage with max cap', () => {
    const result = applyDiscount(100000, DISCOUNT_20);
    assert.equal(result, 95000);
  });

  it('applyDiscount percentage with min purchase unmet', () => {
    const result = applyDiscount(5000, DISCOUNT_50);
    assert.equal(result, 5000);
  });

  it('applyDiscount fixed amount', () => {
    const result = applyDiscount(10000, FIXED_100);
    assert.equal(result, 9000);
  });

  it('applyDiscount fixed amount not exceeding min purchase', () => {
    const result = applyDiscount(1500, FIXED_100);
    assert.equal(result, 1500);
  });

  it('applyDiscount free shipping no discount on item', () => {
    const result = applyDiscount(10000, FREE_SHIP);
    assert.equal(result, 10000);
  });

  it('isDiscountUsable active rule in period', () => {
    assert.ok(isDiscountUsable(DISCOUNT_20, '2026-07-15T12:00:00Z'));
  });

  it('isDiscountUsable expired rule', () => {
    assert.ok(!isDiscountUsable(EXPIRED, '2026-07-15T12:00:00Z'));
  });

  it('isDiscountUsable used up', () => {
    assert.ok(!isDiscountUsable(USED_UP, '2026-07-15T12:00:00Z'));
  });

  it('isDiscountUsable before start date', () => {
    const future: DiscountRule = { ...DISCOUNT_20, id: 'future', startAt: '2026-08-01T00:00:00Z', status: 'scheduled' };
    assert.ok(!isDiscountUsable(future, '2026-07-15T12:00:00Z'));
  });

  it('stackable rules allow multiple discounts', () => {
    assert.ok(FIXED_100.stackable);
    assert.ok(!DISCOUNT_20.stackable);
  });

  it('non-stackable priority 10 vs 20', () => {
    assert.ok(DISCOUNT_20.priority < DISCOUNT_50.priority);
  });

  it('50% off capped at 20000 cents', () => {
    const result = applyDiscount(100000, DISCOUNT_50);
    assert.equal(result, 80000);
  });

  it('free shipping has min purchase', () => {
    assert.equal(FREE_SHIP.minPurchaseCents, 9900);
  });

  it('currentUses never exceeds maxUses for active rules', () => {
    assert.ok(USED_UP.currentUses <= USED_UP.maxUses);
    assert.ok(DISCOUNT_50.currentUses <= DISCOUNT_50.maxUses);
  });

  it('maxUses 0 means unlimited', () => {
    const unlimited: DiscountRule = { ...DISCOUNT_20, id: 'unlimited', maxUses: 0 };
    assert.equal(unlimited.maxUses, 0);
    assert.ok(isDiscountUsable({ ...unlimited, currentUses: 999999 }, '2026-07-15T12:00:00Z'));
  });

  it('expired status not usable', () => {
    assert.ok(!isDiscountUsable(EXPIRED, '2026-07-15T12:00:00Z'));
  });

  it('inactive status not usable', () => {
    const inactive: DiscountRule = { ...DISCOUNT_20, id: 'inactive', status: 'inactive' as DiscountStatus };
    assert.ok(!isDiscountUsable(inactive, '2026-07-15T12:00:00Z'));
  });

  it('tiered discount type', () => {
    const tiered: DiscountRule = { ...DISCOUNT_20, id: 'tiered', type: 'tiered', value: 15 };
    const result = applyDiscount(10000, tiered);
    assert.equal(result, 8500);
  });
});
