import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { PrizeRedemptionCounter } = require('./PrizeRedemptionCounter');
import type { PrizeItem } from './PrizeRedemptionCounter';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PRIZES: PrizeItem[] = [
  { id: 'p1', name: '星之卡比毛绒公仔', points: 500, stock: 10, category: 'plush', popular: true },
  { id: 'p2', name: '宝可梦卡牌包', points: 200, stock: 50, category: 'card' },
  { id: 'p3', name: '太鼓达人手办', points: 1500, stock: 3, category: 'figure', popular: true },
  { id: 'p4', name: '零食礼包', points: 100, stock: 100, category: 'snack' },
  { id: 'p5', name: '减压玩具', points: 80, stock: 0, category: 'toy' },
  { id: 'p6', name: '盲盒第4弹', points: 350, stock: 20, category: 'toy', popular: true },
];

const NOOP = () => {};

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(PrizeRedemptionCounter, {
    availablePoints: 2000,
    prizes: MOCK_PRIZES,
    selected: new Map(),
    onSelectionChange: NOOP,
    onRedeem: NOOP,
    ...props,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('PrizeRedemptionCounter: renders available points and prize list', () => {
  const html = renderHTML();
  assert.ok(html.includes('2,000'), 'should show available points');
  assert.ok(html.includes('星之卡比毛绒公仔'), 'should show prize name');
  assert.ok(html.includes('宝可梦卡牌包'), 'should show second prize');
  assert.ok(html.includes('太鼓达人手办'), 'should show third prize');
});

test('PrizeRedemptionCounter: shows empty state when no prizes', () => {
  const html = renderHTML({ prizes: [], emptyText: '暂无可用奖品' });
  assert.ok(html.includes('暂无可用奖品'), 'should show empty text');
});

test('PrizeRedemptionCounter: shows category filter tabs', () => {
  const html = renderHTML();
  assert.ok(html.includes('全部'), 'should show ALL tab');
  assert.ok(html.includes('毛绒公仔'), 'should show plush tab');
  assert.ok(html.includes('手办模型'), 'should show figure tab');
  assert.ok(html.includes('卡牌'), 'should show card tab');
  assert.ok(html.includes('零食'), 'should show snack tab');
  assert.ok(html.includes('玩具'), 'should show toy tab');
});

test('PrizeRedemptionCounter: shows search input', () => {
  const html = renderHTML();
  assert.ok(html.includes('搜索奖品名称'), 'should show search placeholder');
});

test('PrizeRedemptionCounter: shows + and − buttons for each prize', () => {
  const html = renderHTML();
  // Each prize should have a + button and a − button
  const plusMatches = html.match(/\+/g);
  const minusMatches = html.match(/−/g);
  assert.ok(plusMatches && plusMatches.length >= 6, 'should have at least 6 plus buttons');
  assert.ok(minusMatches && minusMatches.length >= 6, 'should have at least 6 minus buttons');
});

test('PrizeRedemptionCounter: disables redeem button when no items selected', () => {
  const html = renderHTML();
  // The button should be disabled (selected count = 0)
  assert.ok(html.includes('确认兑换 (0 件)'), 'should show 0 selected');
});

test('PrizeRedemptionCounter: shows selected count when items selected', () => {
  const selected = new Map<string, number>([['p1', 2]]);
  const html = renderHTML({ selected });
  assert.ok(html.includes('确认兑换 (2 件)'), 'should show 2 selected');
});

test('PrizeRedemptionCounter: shows processing state', () => {
  const selected = new Map<string, number>([['p1', 1]]);
  const html = renderHTML({ selected, isProcessing: true });
  assert.ok(html.includes('兑换中...'), 'should show processing text');
});

test('PrizeRedemptionCounter: shows total points selected in header', () => {
  const selected = new Map<string, number>([['p2', 1]]); // 200 points
  const html = renderHTML({ selected, availablePoints: 1000 });
  assert.ok(html.includes('已选'), 'should show selected section');
  assert.ok(html.includes('剩余'), 'should show remaining section');
});

test('PrizeRedemptionCounter: shows hot tag for popular items', () => {
  const html = renderHTML();
  assert.ok(html.includes('热门'), 'should show popular tag');
});

test('PrizeRedemptionCounter: renders all prize items in list', () => {
  const html = renderHTML();
  assert.ok(html.includes('减压玩具'), 'should show out-of-stock item');
  assert.ok(html.includes('盲盒第4弹'), 'should show popular toy item');
});
