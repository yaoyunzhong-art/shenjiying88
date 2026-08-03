/**
 * PromotionsScreen.test.tsx - 促销活动管理页面测试
 * node:test + react-test-renderer
 * 三态覆盖: 正常渲染 / 空数据 / 边界过滤 + 交互
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { PromotionsScreen, type Promotion } from './PromotionsScreen';

/* ------------------------------------------------------------------ */
/*  Test fixtures                                                      */
/* ------------------------------------------------------------------ */

const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    title: '国庆全场8折',
    type: 'discount',
    status: 'active',
    discountRate: 0.8,
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    usageCount: 128,
    budget: 50000,
    spent: 18200,
  },
  {
    id: 'p2',
    title: '新人优惠券',
    type: 'coupon',
    status: 'draft',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    usageCount: 0,
    budget: 20000,
    spent: 0,
  },
  {
    id: 'p3',
    title: '已结束活动',
    type: 'gift',
    status: 'ended',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    usageCount: 50,
    budget: 10000,
    spent: 10000,
  },
  {
    id: 'p4',
    title: '会员日双倍积分',
    type: 'coupon',
    status: 'paused',
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    usageCount: 89,
    budget: 15000,
    spent: 4450,
  },
  {
    id: 'p5',
    title: '双十一秒杀',
    type: 'flash',
    status: 'active',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
    usageCount: 0,
    budget: 30000,
    spent: 0,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectTexts(node: unknown, chunks: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    chunks.push(String(node));
    return chunks;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectTexts(item, chunks));
    return chunks;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj.props && typeof obj.props === 'object') {
      const p = obj.props as Record<string, unknown>;
      if ('children' in p) {
        collectTexts(p.children, chunks);
      }
    }
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((c: unknown) => collectTexts(c, chunks));
    }
  }
  return chunks;
}

function getRenderedText(root: ReturnType<typeof create>): string {
  const texts = collectTexts(root.toJSON());
  return texts.join('');
}

function pressFilterByLabel(root: ReturnType<typeof create>, label: string): boolean {
  const json = root.toJSON();
  let pressed = false;

  function walk(node: unknown): boolean {
    if (!node || pressed) return false;
    const n = node as Record<string, unknown>;
    if (n.props && typeof n.props === 'object') {
      const p = n.props as Record<string, unknown>;
      if (typeof p.onPress === 'function') {
        const texts = collectTexts(node);
        if (texts.some((t) => t.includes(label))) {
          act(() => (p.onPress as () => void)());
          pressed = true;
          return true;
        }
      }
    }
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        if (walk(child)) return true;
      }
    }
    return false;
  }

  walk(json);
  return pressed;
}

function pressCardByTitle(root: ReturnType<typeof create>, title: string): boolean {
  const json = root.toJSON();
  let pressed = false;

  function walk(node: unknown): boolean {
    if (!node || pressed) return false;
    const n = node as Record<string, unknown>;
    if (n.props && typeof n.props === 'object') {
      const p = n.props as Record<string, unknown>;
      if (typeof p.onPress === 'function') {
        const texts = collectTexts(node);
        if (texts.some((t) => t.includes(title))) {
          act(() => (p.onPress as () => void)());
          pressed = true;
          return true;
        }
      }
    }
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        if (walk(child)) return true;
      }
    }
    return false;
  }

  walk(json);
  return pressed;
}

/* ================================================================== */
/*  正例: 正常渲染 + 核心数据                                          */
/* ================================================================== */

test('PromotionsScreen: renders all promotions when filter is "all"', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('国庆全场8折'));
  assert.ok(text.includes('新人优惠券'));
  assert.ok(text.includes('已结束活动'));
  assert.ok(text.includes('会员日双倍积分'));
  assert.ok(text.includes('双十一秒杀'));
});

test('PromotionsScreen: displays promotion type labels', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('折扣'));
  assert.ok(text.includes('优惠券'));
  assert.ok(text.includes('赠品'));
  assert.ok(text.includes('限时秒杀'));
});

test('PromotionsScreen: displays status labels', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('进行中'));
  assert.ok(text.includes('草稿'));
  assert.ok(text.includes('已结束'));
  assert.ok(text.includes('已暂停'));
});

test('PromotionsScreen: displays date ranges', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('2026-10-01'));
  assert.ok(text.includes('2026-10-07'));
});

test('PromotionsScreen: displays usage count on active promotion', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('128'));
});

test('PromotionsScreen: displays budget and spent amounts', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('¥18,200'));
  assert.ok(text.includes('¥50,000'));
});

test('PromotionsScreen: renders all filter chip labels', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('全部'));
  assert.ok(text.includes('进行中'));
  assert.ok(text.includes('草稿'));
  assert.ok(text.includes('已暂停'));
  assert.ok(text.includes('已结束'));
});

test('PromotionsScreen: renders budget progress percentage', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  // 18200/50000 = 36%
  assert.ok(text.includes('36'));
  assert.ok(text.includes('%'));
});

test('PromotionsScreen: renders 100% progress for fully spent promotion', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[2]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('100%'));
});

test('PromotionsScreen: renders 0% progress for zero budget edge case', () => {
  const zeroBudget: Promotion = { ...MOCK_PROMOTIONS[2], budget: 0, spent: 0 };
  const root = create(<PromotionsScreen promotions={[zeroBudget]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('0'));
  assert.ok(text.includes('%'));
});

test('PromotionsScreen: renders promotion card stats labels', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('使用次数'));
  assert.ok(text.includes('已消耗'));
  assert.ok(text.includes('总预算'));
});

test('PromotionsScreen: renders empty state text for empty promotions', () => {
  const root = create(<PromotionsScreen promotions={[]} />);
  assert.ok(getRenderedText(root).includes('暂无促销活动'));
});

test('PromotionsScreen: renders card title with numberOfLines=1', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />).root;
  const titleTexts = root.findAllByProps({ numberOfLines: 1 });
  assert.ok(titleTexts.length > 0);
  const titles = titleTexts.map((t) => String(t.props.children));
  assert.ok(titles.some((t) => t.includes('国庆全场8折')));
});

/* ================================================================== */
/*  交互: 过滤切换                                                     */
/* ================================================================== */

test('PromotionsScreen: filters by active status', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  assert.ok(pressFilterByLabel(root, '进行中'));

  const text = getRenderedText(root);
  assert.ok(text.includes('国庆全场8折'));
  assert.ok(text.includes('双十一秒杀'));
  assert.ok(!text.includes('新人优惠券'));
  assert.ok(!text.includes('已结束活动'));
  assert.ok(!text.includes('会员日双倍积分'));
});

test('PromotionsScreen: filters by draft status', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  assert.ok(pressFilterByLabel(root, '草稿'));

  const text = getRenderedText(root);
  assert.ok(text.includes('新人优惠券'));
  assert.ok(!text.includes('国庆全场8折'));
  assert.ok(!text.includes('已结束活动'));
});

test('PromotionsScreen: filters by ended status', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  assert.ok(pressFilterByLabel(root, '已结束'));

  const text = getRenderedText(root);
  assert.ok(text.includes('已结束活动'));
  assert.ok(!text.includes('国庆全场8折'));
  assert.ok(!text.includes('新人优惠券'));
});

test('PromotionsScreen: filters by paused status', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  assert.ok(pressFilterByLabel(root, '已暂停'));

  const text = getRenderedText(root);
  assert.ok(text.includes('会员日双倍积分'));
  assert.ok(!text.includes('国庆全场8折'));
  assert.ok(!text.includes('新人优惠券'));
  assert.ok(!text.includes('双十一秒杀'));
});

test('PromotionsScreen: returns to all after switching filter back', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);

  pressFilterByLabel(root, '草稿');
  let text = getRenderedText(root);
  assert.ok(!text.includes('国庆全场8折'));

  pressFilterByLabel(root, '全部');
  text = getRenderedText(root);
  assert.ok(text.includes('国庆全场8折'));
  assert.ok(text.includes('新人优惠券'));
  assert.ok(text.includes('已结束活动'));
});

test('PromotionsScreen: switches filters multiple times safely', () => {
  const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);

  pressFilterByLabel(root, '进行中');
  let text = getRenderedText(root);
  assert.ok(text.includes('国庆全场8折'));

  pressFilterByLabel(root, '已暂停');
  text = getRenderedText(root);
  assert.ok(text.includes('会员日双倍积分'));
  assert.ok(!text.includes('国庆全场8折'));

  pressFilterByLabel(root, '已结束');
  text = getRenderedText(root);
  assert.ok(text.includes('已结束活动'));
  assert.ok(!text.includes('会员日双倍积分'));
});

test('PromotionsScreen: each create gives fresh component with default "all" filter', () => {
  const root1 = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
  const root2 = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);

  pressFilterByLabel(root1, '草稿');
  const text1 = getRenderedText(root1);
  assert.ok(text1.includes('新人优惠券'));
  assert.ok(!text1.includes('国庆全场8折'));

  // root2 is a fresh component with default "all" filter
  const text2 = getRenderedText(root2);
  assert.ok(text2.includes('国庆全场8折'));
});

/* ================================================================== */
/*  交互: 促销卡片点击                                                  */
/* ================================================================== */

test('PromotionsScreen: calls onPromotionPress when card is tapped', () => {
  const calls: Promotion[] = [];
  const onPress = (p: Promotion) => { calls.push(p); };
  const root = create(
    <PromotionsScreen promotions={MOCK_PROMOTIONS} onPromotionPress={onPress} />,
  );

  assert.ok(pressCardByTitle(root, '国庆全场8折'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'p1');
});

test('PromotionsScreen: onPromotionPress called with correct promotion data', () => {
  const calls: Promotion[] = [];
  const onPress = (p: Promotion) => { calls.push(p); };
  const root = create(
    <PromotionsScreen promotions={MOCK_PROMOTIONS} onPromotionPress={onPress} />,
  );

  assert.ok(pressCardByTitle(root, '双十一秒杀'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'p5');
  assert.equal(calls[0].type, 'flash');
});

test('PromotionsScreen: onPromotionPress fires only for tapped card', () => {
  const calls: Promotion[] = [];
  const onPress = (p: Promotion) => { calls.push(p); };
  const root = create(
    <PromotionsScreen promotions={MOCK_PROMOTIONS} onPromotionPress={onPress} />,
  );

  assert.ok(pressCardByTitle(root, '新人优惠券'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].title, '新人优惠券');
});

/* ================================================================== */
/*  边界: 空数据 / 默认 prop                                           */
/* ================================================================== */

test('PromotionsScreen: shows empty state when filter matches nothing', () => {
  // Use only active promotions - filtering by 草稿 (draft) should show empty
  const onlyActive = MOCK_PROMOTIONS.filter((p) => p.status === 'active');
  const root = create(<PromotionsScreen promotions={onlyActive} />);
  // Before filter: active items shown
  assert.ok(getRenderedText(root).includes('国庆全场8折'));
  // After filter by draft: empty state
  pressFilterByLabel(root, '草稿');
  assert.ok(getRenderedText(root).includes('暂无促销活动'));
});

test('PromotionsScreen: empty promotions stays empty with any filter', () => {
  const root = create(<PromotionsScreen promotions={[]} />);
  assert.ok(getRenderedText(root).includes('暂无促销活动'));

  pressFilterByLabel(root, '进行中');
  assert.ok(getRenderedText(root).includes('暂无促销活动'));

  pressFilterByLabel(root, '草稿');
  assert.ok(getRenderedText(root).includes('暂无促销活动'));
});

test('PromotionsScreen: uses default promotions when no prop provided', () => {
  const root = create(<PromotionsScreen />);
  const text = getRenderedText(root);
  // The source internal MOCK_PROMOTIONS
  assert.ok(text.includes('国庆全场8折'));
  assert.ok(text.includes('新人满100减20'));
  assert.ok(text.includes('买一送一特惠'));
});

test('PromotionsScreen: renders with default props without crashing', () => {
  assert.doesNotThrow(() => {
    create(<PromotionsScreen />);
  });
});

/* ================================================================== */
/*  边界: 全状态 / 全类型渲染验证                                        */
/* ================================================================== */

test('PromotionsScreen: renders discount type label correctly', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('折扣'));
});

test('PromotionsScreen: renders flash sale type correctly', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[4]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('限时秒杀'));
  assert.ok(text.includes('双十一秒杀'));
});

test('PromotionsScreen: renders single promotion card without issues', () => {
  const single: Promotion[] = [MOCK_PROMOTIONS[0]];
  const root = create(<PromotionsScreen promotions={single} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('国庆全场8折'));
  assert.ok(text.includes('进行中'));
});

test('PromotionsScreen: renders paused promotion card structure', () => {
  const root = create(<PromotionsScreen promotions={[MOCK_PROMOTIONS[3]]} />);
  const text = getRenderedText(root);
  assert.ok(text.includes('会员日双倍积分'));
  assert.ok(text.includes('已暂停'));
  assert.ok(text.includes('89'));
});
