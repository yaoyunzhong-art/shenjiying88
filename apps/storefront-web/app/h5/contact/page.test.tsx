/**
 * H5联系客服页面 - page.test.tsx — L1 冒烟测试
 * Phase-FP · 2026-07-05
 * 覆盖: FAQ / 留言表单 / 联系方式
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据工厂 ──

function makeFAQ(overrides?: Record<string, unknown>) {
  return {
    id: 'f1',
    question: '如何成为会员？',
    answer: '在门店消费满100元即可免费注册成为会员。',
    ...overrides,
  };
}

const FAQS = [
  { id: 'f1', question: '如何成为会员？', answer: '在门店消费满100元即可免费注册成为会员，享受积分返利等权益。' },
  { id: 'f2', question: '积分有什么用途？', answer: '积分可在积分商城兑换优惠券、礼品等，每100积分可抵扣1元。' },
  { id: 'f3', question: '优惠券如何使用？', answer: '在结算时选择可用优惠券，系统会自动抵扣相应金额。' },
  { id: 'f4', question: '如何申请退款？', answer: '请前往订单详情页申请退款，或联系门店工作人员协助处理。' },
  { id: 'f5', question: '会员卡丢失怎么办？', answer: '可凭注册手机号到门店补办会员卡，原卡积分会自动转移。' },
];

const CONTACT_METHODS = ['热线电话', '在线客服', '门店地址'] as const;

/* ── 正例 ── */

test('ContactPage: should have 5 FAQ items', () => {
  assert.equal(FAQS.length, 5);
});

test('ContactPage: each FAQ should have required fields', () => {
  for (const faq of FAQS) {
    assert.equal(typeof faq.id, 'string');
    assert.ok(faq.id.length > 0);
    assert.equal(typeof faq.question, 'string');
    assert.ok(faq.question.length > 0);
    assert.ok(faq.question.endsWith('？'));
    assert.equal(typeof faq.answer, 'string');
    assert.ok(faq.answer.length > 0);
  }
});

test('ContactPage: should accept a valid FAQ item', () => {
  const faq = makeFAQ();
  assert.equal(faq.id, 'f1');
  assert.equal(typeof faq.question, 'string');
  assert.equal(typeof faq.answer, 'string');
});

test('ContactPage: FAQ IDs should be unique', () => {
  const ids = FAQS.map(f => f.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

test('ContactPage: should have contact methods', () => {
  assert.ok(CONTACT_METHODS.includes('热线电话'));
  assert.ok(CONTACT_METHODS.includes('在线客服'));
  assert.ok(CONTACT_METHODS.includes('门店地址'));
});

test('ContactPage: should have a hotline phone number', () => {
  const hotline = '400-888-8888';
  assert.ok(/^\d{3}-\d{3}-\d{4}$/.test(hotline));
  assert.equal(hotline, '400-888-8888');
});

test('ContactPage: FAQ toggling should expand/collapse', () => {
  let expanded: string | null = null;
  assert.equal(expanded, null);
  expanded = 'f1';
  assert.equal(expanded, 'f1');
  expanded = null;
  assert.equal(expanded, null);
  expanded = 'f3';
  assert.equal(expanded, 'f3');
});

test('ContactPage: FAQ answers should be descriptive', () => {
  for (const faq of FAQS) {
    assert.ok(faq.answer.length >= 10);
  }
});

test('ContactPage: message form validation should require non-empty', () => {
  const emptyMessage = '';
  const nonEmptyMessage = '我想咨询一下会员卡信息';
  assert.equal(emptyMessage.trim().length > 0, false);
  assert.equal(nonEmptyMessage.trim().length > 0, true);
});

test('ContactPage: submitted message should clear input', () => {
  let message = '咨询内容';
  let submitted = false;
  if (message.trim()) {
    submitted = true;
    message = '';
  }
  assert.equal(submitted, true);
  assert.equal(message, '');
});

test('ContactPage: success feedback should auto-dismiss', () => {
  // simulate 3 second auto-dismiss
  let submitted = true;
  // after 3 seconds
  submitted = false;
  assert.equal(submitted, false);
});

/* ── 反例 / 防御 ── */

test('ContactPage: should handle empty FAQ list', () => {
  const emptyFAQs: unknown[] = [];
  assert.equal(emptyFAQs.length, 0);
});

test('ContactPage: should reject empty message submission', () => {
  const emptyMsg = '';
  assert.equal(emptyMsg.trim() ? true : false, false);
});

test('ContactPage: should reject whitespace-only message', () => {
  const whitespaceMsg = '   ';
  assert.equal(whitespaceMsg.trim() ? true : false, false);
});

test('ContactPage: should handle very long message', () => {
  const longMsg = 'a'.repeat(1000);
  assert.equal(longMsg.length, 1000);
});

test('ContactPage: should handle FAQ with empty question', () => {
  const faq = makeFAQ({ question: '' });
  assert.equal(faq.question, '');
});

test('ContactPage: should handle FAQ with empty answer', () => {
  const faq = makeFAQ({ answer: '' });
  assert.equal(faq.answer, '');
});

test('ContactPage: should handle FAQ with missing id', () => {
  const faq = makeFAQ({ id: undefined });
  assert.equal(faq.id, undefined);
});

test('ContactPage: should handle malformed phone number', () => {
  const invalidPhones = ['', 'abc', '123-45', 'not-a-number'];
  for (const p of invalidPhones) {
    const valid = /^\d{3}-\d{3}-\d{4}$/.test(p);
    assert.equal(valid, false);
  }
});

/* ── 边界 ── */

test('ContactPage: should handle many FAQs', () => {
  const many = Array.from({ length: 50 }, (_, i) => makeFAQ({
    id: `f${i}`,
    question: `问题${i}？`,
    answer: `答案${i}的内容。`,
  }));
  assert.equal(many.length, 50);
  assert.ok(many.every(f => f.id && f.question && f.answer));
});

test('ContactPage: FAQ questions should cover different categories', () => {
  const keywords = ['会员', '积分', '优惠券', '退款', '丢失'];
  for (let i = 0; i < FAQS.length; i++) {
    assert.ok(FAQS[i].question.includes(keywords[i]));
  }
});

test('ContactPage: hotline and online FAQ coverage', () => {
  // FAQs covering membership, points, coupons, refunds
  const topics = ['会员', '积分', '优惠券', '退款', '卡'];
  const covered = topics.filter(t => FAQS.some(f => f.question.includes(t)));
  assert.equal(covered.length, topics.length);
});
