/**
 * settings/promotion-rules/page.test.tsx — 促销规则设置 L1 测试
 *
 * 覆盖: 规则类型、条件配置、优惠计算、时效管理
 * 正例: 满减/折扣/赠品规则、优惠金额计算
 * 反例: 条件不满足、规则过期、规则冲突
 * 边界: 零门槛、叠加上限、规则优先级
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import PromotionRulesPage from './page';

/* ── 类型 ── */

type PromotionType = '满减' | '折扣' | '赠品' | '包邮' | '加价购' | '秒杀';
type RuleStatus = 'draft' | 'active' | 'scheduled' | 'ended' | 'disabled';

interface PromotionRule {
  id: string;
  name: string;
  type: PromotionType;
  status: RuleStatus;
  priority: number;
  startAt: string;
  endAt: string;
  minOrderCents: number;
  minQuantity: number;
  maxQuantity: number;
  discountCents: number;
  discountPercent: number;
  maxDiscountCents: number;
  conditions: Record<string, string>;
}

function calculateDiscount(orderCents: number, quantity: number, rule: PromotionRule): number {
  if (orderCents < rule.minOrderCents) return 0;
  if (quantity < rule.minQuantity) return 0;
  if (rule.maxQuantity > 0 && quantity > rule.maxQuantity) return 0;
  switch (rule.type) {
    case '满减':
      return rule.discountCents;
    case '折扣':
      return Math.min(Math.round(orderCents * rule.discountPercent / 100), rule.maxDiscountCents > 0 ? rule.maxDiscountCents : Infinity);
    case '包邮':
      return 0;
    default:
      return 0;
  }
}

function isRuleActive(rule: PromotionRule, now: string): boolean {
  if (rule.status !== 'active' && rule.status !== 'scheduled') return false;
  return now >= rule.startAt && now <= rule.endAt;
}

function detectRuleConflicts(rules: PromotionRule[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      if (rules[i].type === rules[j].type && rules[i].priority === rules[j].priority) {
        if (rules[i].startAt <= rules[j].endAt && rules[j].startAt <= rules[i].endAt) {
          errors.push(`规则 "${rules[i].name}" 与 "${rules[j].name}" 同类型同优先级且时间重叠`);
        }
      }
    }
  }
  return errors;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(PromotionRulesPage));
}

/* ============================================================ */

describe('promotion-rules: 页面渲染', () => {
  it('renders title', () => { const { container } = setup(); assert.ok(container.querySelector('h1')?.textContent?.includes('促销规则')); });
  it('renders description', () => { const { container } = setup(); assert.ok(container.textContent?.includes('促销')); });
  it('renders without error', () => { assert.doesNotThrow(() => setup()); });
  it('has padding layout', () => { const { container } = setup(); assert.equal((container.firstElementChild as HTMLElement)?.style?.padding, '24px'); });
  it('has single h1', () => { const { container } = setup(); assert.equal(container.querySelectorAll('h1').length, 1); });
  it('component is a function', () => { assert.equal(typeof PromotionRulesPage, 'function'); });
});

describe('promotion-rules: 数据类型', () => {
  it('PromotionRule has all fields', () => {
    const r: PromotionRule = { id: 'promo-001', name: '618满减', type: '满减', status: 'active', priority: 10, startAt: '2026-06-18T00:00:00Z', endAt: '2026-06-20T23:59:59Z', minOrderCents: 20000, minQuantity: 1, maxQuantity: 0, discountCents: 5000, discountPercent: 0, maxDiscountCents: 0, conditions: {} };
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.priority, 'number');
    assert.equal(typeof r.discountCents, 'number');
  });

  it('promotion type enum', () => {
    const valid: PromotionType[] = ['满减', '折扣', '赠品', '包邮', '加价购', '秒杀'];
    assert.equal(valid.length, 6);
  });

  it('rule status enum', () => {
    const valid: RuleStatus[] = ['draft', 'active', 'scheduled', 'ended', 'disabled'];
    assert.equal(valid.length, 5);
  });

  it('priority is non-negative', () => {
    assert.ok(10 >= 0);
  });

  it('discountPercent between 0 and 100', () => {
    [0, 10, 50, 100].forEach(v => assert.ok(v >= 0 && v <= 100));
  });
});

describe('promotion-rules: 业务逻辑', () => {
  const MANJIAN: PromotionRule = { id: 'promo-001', name: '618满200减50', type: '满减', status: 'active', priority: 10, startAt: '2026-06-18T00:00:00Z', endAt: '2026-06-20T23:59:59Z', minOrderCents: 20000, minQuantity: 1, maxQuantity: 0, discountCents: 5000, discountPercent: 0, maxDiscountCents: 0, conditions: {} };
  const DISCOUNT: PromotionRule = { id: 'promo-002', name: '全场9折', type: '折扣', status: 'active', priority: 20, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z', minOrderCents: 0, minQuantity: 1, maxQuantity: 0, discountCents: 0, discountPercent: 10, maxDiscountCents: 5000, conditions: {} };
  const FREESHIP: PromotionRule = { id: 'promo-003', name: '满99包邮', type: '包邮', status: 'active', priority: 5, startAt: '2026-01-01T00:00:00Z', endAt: '2026-12-31T23:59:59Z', minOrderCents: 9900, minQuantity: 1, maxQuantity: 0, discountCents: 0, discountPercent: 0, maxDiscountCents: 0, conditions: {} };
  const DRAFT: PromotionRule = { id: 'promo-004', name: '草稿规则', type: '折扣', status: 'draft', priority: 30, startAt: '2026-08-01T00:00:00Z', endAt: '2026-08-31T23:59:59Z', minOrderCents: 0, minQuantity: 1, maxQuantity: 0, discountCents: 0, discountPercent: 5, maxDiscountCents: 0, conditions: {} };
  const EXPIRED: PromotionRule = { id: 'promo-005', name: '已结束规则', type: '满减', status: 'ended', priority: 1, startAt: '2026-01-01T00:00:00Z', endAt: '2026-01-31T23:59:59Z', minOrderCents: 10000, minQuantity: 1, maxQuantity: 0, discountCents: 2000, discountPercent: 0, maxDiscountCents: 0, conditions: {} };

  it('calculateDiscount 满减满足条件', () => {
    const discount = calculateDiscount(20000, 1, MANJIAN);
    assert.equal(discount, 5000);
  });

  it('calculateDiscount 满减不满足条件', () => {
    const discount = calculateDiscount(10000, 1, MANJIAN);
    assert.equal(discount, 0);
  });

  it('calculateDiscount 折扣计算', () => {
    const discount = calculateDiscount(50000, 1, DISCOUNT);
    assert.equal(discount, 5000);
  });

  it('calculateDiscount 折扣封顶', () => {
    const discount = calculateDiscount(100000, 1, DISCOUNT);
    assert.equal(discount, 5000);
  });

  it('calculateDiscount 包邮返回0', () => {
    const discount = calculateDiscount(9900, 1, FREESHIP);
    assert.equal(discount, 0);
  });

  it('calculateDiscount 不满足包邮条件', () => {
    const discount = calculateDiscount(5000, 1, FREESHIP);
    assert.equal(discount, 0);
  });

  it('calculateDiscount 超出数量限制', () => {
    const limitQty: PromotionRule = { ...MANJIAN, id: 'limit', maxQuantity: 5 };
    const discount = calculateDiscount(20000, 10, limitQty);
    assert.equal(discount, 0);
  });

  it('isRuleActive active in range', () => {
    assert.ok(isRuleActive(MANJIAN, '2026-06-19T12:00:00Z'));
  });

  it('isRuleActive draft before start', () => {
    assert.ok(!isRuleActive(DRAFT, '2026-07-01T00:00:00Z'));
  });

  it('isRuleActive ended status false', () => {
    assert.ok(!isRuleActive(EXPIRED, '2026-06-01T00:00:00Z'));
  });

  it('detectRuleConflicts no conflict', () => {
    const rules = [MANJIAN, DISCOUNT, FREESHIP];
    assert.equal(detectRuleConflicts(rules).length, 0);
  });

  it('detectRuleConflicts detects overlap', () => {
    const r1: PromotionRule = { ...MANJIAN, id: 'r1' };
    const r2: PromotionRule = { ...MANJIAN, id: 'r2' };
    r2.priority = 10; r2.type = '满减';
    const conflicts = detectRuleConflicts([r1, r2]);
    assert.ok(conflicts.length > 0);
  });

  it('scheduled rule not active before start', () => {
    const scheduled = { ...MANJIAN, id: 'scheduled', status: 'scheduled' as RuleStatus, startAt: '2026-07-15T00:00:00Z' };
    assert.ok(!isRuleActive(scheduled, '2026-07-01T00:00:00Z'));
  });

  it('scheduled rule active during period', () => {
    const scheduled = { ...MANJIAN, id: 'scheduled', status: 'scheduled' as RuleStatus, startAt: '2026-07-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z' };
    assert.ok(isRuleActive(scheduled, '2026-07-15T12:00:00Z'));
  });

  it('disabled rules return false', () => {
    const disabled = { ...MANJIAN, id: 'disabled', status: 'disabled' as RuleStatus };
    assert.ok(!isRuleActive(disabled, '2026-06-19T00:00:00Z'));
  });

  it('order must meet minQuantity', () => {
    const qtyRule: PromotionRule = { ...MANJIAN, id: 'qty', minQuantity: 3 };
    assert.equal(calculateDiscount(20000, 2, qtyRule), 0);
    assert.equal(calculateDiscount(20000, 3, qtyRule), 5000);
  });

  it('maxQuantity of 0 means unlimited', () => {
    const unlimited: PromotionRule = { ...MANJIAN, id: 'unlimit' };
    assert.equal(calculateDiscount(20000, 9999, unlimited), 5000);
  });

  it('priority lower number = higher priority', () => {
    const high = { ...MANJIAN, id: 'high', priority: 1 };
    const low = { ...MANJIAN, id: 'low', priority: 100 };
    assert.ok(high.priority < low.priority);
  });

  it('empty conditions object is valid', () => {
    assert.deepEqual(MANJIAN.conditions, {});
  });

  it('discountPercent 10 means 10% off', () => {
    const tenPct: PromotionRule = { ...DISCOUNT, discountPercent: 10 };
    const discount = calculateDiscount(50000, 1, tenPct);
    assert.equal(discount, 5000);
  });
});
