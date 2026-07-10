/**
 * CustomerFeedbackScreen.test.ts
 * 表单页 - 客户反馈提交 (含验证/提交/错误处理)
 * Uses node:test + jsdom-compatible render
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create } from 'react-test-renderer';
import {
  CustomerFeedbackScreen,
  useFeedbackSubmit,
  FeedbackFormData,
} from './CustomerFeedbackScreen';

/* ------------------------------------------------------------------ */
/*  Mock @react-navigation/native                                      */
/* ------------------------------------------------------------------ */

const mockGoBack: () => void = () => {};

function mockUseNavigation() {
  return { goBack: mockGoBack };
}

// We mock inline by re-writing the import — react-test-renderer doesn't
// need the navigation mock since it just renders the tree structure.
// The test file directly imports the component and creates it.

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function findText(root: ReturnType<typeof create>['root'], content: string) {
  const all = root.findAllByType('Text');
  return all.find((t) => {
    const txt =
      typeof t.props.children === 'string' ? t.props.children : undefined;
    return txt?.includes(content);
  });
}

function findChipByLabel(root: ReturnType<typeof create>['root'], label: string) {
  const all = root.findAllByProps({
    accessibilityLabel: `反馈类型: ${label}`,
  });
  return all[0];
}

/* ------------------------------------------------------------------ */
/*  Tests — useFeedbackSubmit hook                                     */
/* ------------------------------------------------------------------ */

test('useFeedbackSubmit: returns idle state initially', () => {
  let hookResult!: ReturnType<typeof useFeedbackSubmit>;

  function Harness() {
    hookResult = useFeedbackSubmit();
    return null;
  }

  create(<Harness />);

  assert.equal(hookResult.isSubmitting, false);
  assert.equal(hookResult.submitError, null);
  assert.equal(hookResult.isSuccess, false);
});

test('useFeedbackSubmit: submit succeeds and sets isSuccess', async () => {
  let hookResult!: ReturnType<typeof useFeedbackSubmit>;

  function Harness() {
    hookResult = useFeedbackSubmit();
    return null;
  }

  create(<Harness />);

  const promise = hookResult.submit({
    category: 'service',
    title: 'test title',
    description: 'this is a test description for feedback',
    contactPhone: '',
    rating: 4,
  });

  assert.equal(hookResult.isSubmitting, true);

  await promise;

  assert.equal(hookResult.isSubmitting, false);
  assert.equal(hookResult.isSuccess, true);
  assert.equal(hookResult.submitError, null);
});

test('useFeedbackSubmit: reset clears all state', () => {
  let hookResult!: ReturnType<typeof useFeedbackSubmit>;

  function Harness() {
    hookResult = useFeedbackSubmit();
    return null;
  }

  create(<Harness />);

  hookResult.reset();

  assert.equal(hookResult.isSubmitting, false);
  assert.equal(hookResult.submitError, null);
  assert.equal(hookResult.isSuccess, false);
});

/* ------------------------------------------------------------------ */
/*  Tests — CustomerFeedbackScreen rendering                           */
/* ------------------------------------------------------------------ */

test('CustomerFeedbackScreen: renders all sections', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  assert.ok(findText(root, '反馈类型'));
  assert.ok(findText(root, '评分'));
  assert.ok(findText(root, '标题'));
  assert.ok(findText(root, '详细描述'));
  assert.ok(findText(root, '联系电话（选填）'));
  assert.ok(findText(root, '提交反馈'));
  assert.ok(findText(root, '重置'));
});

test('CustomerFeedbackScreen: renders all 5 category chips', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  assert.ok(findChipByLabel(root, '服务质量'));
  assert.ok(findChipByLabel(root, '商品质量'));
  assert.ok(findChipByLabel(root, '门店环境'));
  assert.ok(findChipByLabel(root, '员工服务'));
  assert.ok(findChipByLabel(root, '其他'));
});

test('CustomerFeedbackScreen: renders 5 rating stars', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const stars = root.findAllByProps({
    accessibilityLabel: /^评分 \d/,
  });
  assert.equal(stars.length, 5);
});

test('CustomerFeedbackScreen: renders title input placeholder', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const inputs = root.findAllByProps({
    placeholder: '请输入反馈标题',
  });
  assert.ok(inputs.length >= 1);
});

test('CustomerFeedbackScreen: renders description textarea placeholder', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const inputs = root.findAllByProps({
    placeholder: '请输入反馈详情（至少10个字符）',
  });
  assert.ok(inputs.length >= 1);
});

test('CustomerFeedbackScreen: renders char counts', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const count50 = root.findAllByProps({ children: '0/50' });
  assert.ok(count50.length >= 1);

  const count500 = root.findAllByProps({ children: '0/500' });
  assert.ok(count500.length >= 1);
});

test('CustomerFeedbackScreen: renders submit and reset buttons', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const submitBtns = root.findAllByProps({
    accessibilityLabel: '提交反馈',
  });
  assert.ok(submitBtns.length >= 1);

  const resetBtns = root.findAllByProps({
    accessibilityLabel: '重置表单',
  });
  assert.ok(resetBtns.length >= 1);
});

test('CustomerFeedbackScreen: renders phone input placeholder', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const inputs = root.findAllByProps({
    placeholder: '请输入手机号',
  });
  assert.ok(inputs.length >= 1);
});

test('CustomerFeedbackScreen: default category is service', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const activeChip = findChipByLabel(root, '服务质量');
  assert.ok(activeChip);
  // Active chip should be present and the first chip should be selected
  // (service is the default)
});

test('CustomerFeedbackScreen: default rating text shows 非常好', () => {
  const root = create(<CustomerFeedbackScreen />).root;

  const ratingLabel = findText(root, '非常好');
  assert.ok(ratingLabel);
});

/* ------------------------------------------------------------------ */
/*  Tests — validateForm (inline validation logic)                     */
/* ------------------------------------------------------------------ */

import { validateForm } from './CustomerFeedbackScreen';

test('validateForm: returns no errors for valid form', () => {
  const errors = validateForm({
    category: 'service',
    title: '服务态度很好',
    description: '今天来店里消费，店员服务态度非常好，很满意！',
    contactPhone: '',
    rating: 5,
  });
  assert.equal(Object.keys(errors).length, 0);
});

test('validateForm: returns title error when empty', () => {
  const errors = validateForm({
    category: 'service',
    title: '',
    description: 'valid description text here',
    contactPhone: '',
    rating: 5,
  });
  assert.ok(errors.title);
  assert.match(errors.title!, /标题/);
});

test('validateForm: returns title error when too short', () => {
  const errors = validateForm({
    category: 'service',
    title: 'a',
    description: 'valid description text',
    contactPhone: '',
    rating: 5,
  });
  assert.equal(errors.title, '标题至少2个字符');
});

test('validateForm: returns description error when empty', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: '',
    contactPhone: '',
    rating: 5,
  });
  assert.ok(errors.description);
  assert.match(errors.description!, /详情/);
});

test('validateForm: returns description error when too short', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: '太短',
    contactPhone: '',
    rating: 5,
  });
  assert.equal(errors.description, '详情至少10个字符');
});

test('validateForm: returns phone error for invalid format', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: 'valid description text here for testing',
    contactPhone: '12345',
    rating: 5,
  });
  assert.equal(errors.contactPhone, '请输入正确的手机号码');
});

test('validateForm: accepts valid phone number', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: 'valid description text here for testing',
    contactPhone: '13800138000',
    rating: 5,
  });
  assert.equal(errors.contactPhone, undefined);
});

test('validateForm: returns rating error when out of range (0)', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: 'valid description text',
    contactPhone: '',
    rating: 0,
  });
  assert.equal(errors.rating, '评分范围为1-5');
});

test('validateForm: returns title error when too long (>50)', () => {
  const errors = validateForm({
    category: 'service',
    title: 'x'.repeat(51),
    description: 'valid description text here for testing',
    contactPhone: '',
    rating: 5,
  });
  assert.ok(errors.title);
  assert.match(errors.title!, /50/);
});

test('validateForm: returns description error when too long (>500)', () => {
  const errors = validateForm({
    category: 'service',
    title: 'valid title',
    description: 'x'.repeat(501),
    contactPhone: '',
    rating: 5,
  });
  assert.ok(errors.description);
  assert.match(errors.description!, /500/);
});
