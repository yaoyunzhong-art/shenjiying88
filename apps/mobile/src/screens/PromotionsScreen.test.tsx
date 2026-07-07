/**
 * PromotionsScreen.test.tsx - 促销活动管理页面测试
 * 使用 react-test-renderer 进行渲染测试
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { PromotionsScreen, Promotion } from './PromotionsScreen';

// ---- 测试辅助数据 ----

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
];

/** 遍历渲染树收集所有文本字符串 */
function collectTexts(node: any): string[] {
  const texts: string[] = [];

  function walk(n: any) {
    if (n === null || n === undefined) return;
    if (typeof n === 'string') {
      texts.push(n);
      return;
    }
    if (typeof n === 'number') {
      texts.push(String(n));
      return;
    }
    // React element
    if (n.props?.children) {
      const kids = Array.isArray(n.props.children)
        ? n.props.children
        : [n.props.children];
      kids.forEach(walk);
    }
    // rendered children array
    if (n.children) {
      n.children.forEach(walk);
    }
  }

  walk(node);
  return texts;
}

/** 查找 TouchableOpacity 并触发 onPress */
function pressByText(root: ReturnType<typeof create>, label: string): boolean {
  const json = root.toJSON();
  let pressed = false;

  function findAndPress(node: any): boolean {
    if (!node || pressed) return false;
    // React test renderer renders TouchableOpacity with type and props
    if (node.props?.onPress) {
      const texts = collectTexts(node);
      if (texts.some((t) => t.includes(label))) {
        act(() => node.props.onPress());
        pressed = true;
        return true;
      }
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndPress(child)) return true;
      }
    }
    return false;
  }

  findAndPress(json);
  return pressed;
}

/** 收集渲染后的所有可见文本（不含 React 内部 Fiber 节点） */
function getRenderedTexts(root: ReturnType<typeof create>): string {
  const texts = collectTexts(root.toJSON());
  return texts.join('|');
}

// ---- 测试用例 ----

describe('PromotionsScreen', () => {
  it('renders all promotions when filter is "all"', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    const text = getRenderedTexts(root);

    expect(text).toContain('国庆全场8折');
    expect(text).toContain('新人优惠券');
    expect(text).toContain('已结束活动');
  });

  it('shows empty state when no promotions', () => {
    const root = create(<PromotionsScreen promotions={[]} />);
    expect(getRenderedTexts(root)).toContain('暂无促销活动');
  });

  it('filters promotions by active status', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    expect(pressByText(root, '进行中')).toBe(true);

    const text = getRenderedTexts(root);
    expect(text).toContain('国庆全场8折');
    expect(text).not.toContain('新人优惠券');
    expect(text).not.toContain('已结束活动');
  });

  it('filters promotions by draft status', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    pressByText(root, '草稿');

    const text = getRenderedTexts(root);
    expect(text).not.toContain('国庆全场8折');
    expect(text).toContain('新人优惠券');
    expect(text).not.toContain('已结束活动');
  });

  it('filters promotions by ended status', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    pressByText(root, '已结束');

    const text = getRenderedTexts(root);
    expect(text).not.toContain('国庆全场8折');
    expect(text).not.toContain('新人优惠券');
    expect(text).toContain('已结束活动');
  });

  it('calls onPromotionPress when a card is tapped', () => {
    const onPress = vi.fn();
    const root = create(
      <PromotionsScreen promotions={MOCK_PROMOTIONS} onPromotionPress={onPress} />,
    );

    // 找到包含活动标题的节点并触发其 onPress
    const json = root.toJSON();
    const targetTitle = '国庆全场8折';

    function findPromotionCard(node: any): boolean {
      if (!node) return false;
      if (node.props?.onPress) {
        const texts = collectTexts(node);
        if (texts.some((t) => t.includes(targetTitle))) {
          act(() => node.props.onPress());
          return true;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          if (findPromotionCard(child)) return true;
        }
      }
      return false;
    }

    expect(findPromotionCard(json)).toBe(true);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(MOCK_PROMOTIONS[0]);
  });

  it('displays promotion type labels correctly', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    expect(getRenderedTexts(root)).toContain('折扣');
  });

  it('displays date range correctly', () => {
    const root = create(
      <PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />,
    );
    const text = getRenderedTexts(root);
    expect(text).toContain('2026-10-01');
    expect(text).toContain('2026-10-07');
  });

  it('handles non-existent filter showing empty state', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    pressByText(root, '已暂停');
    expect(getRenderedTexts(root)).toContain('暂无促销活动');
  });

  it('handles empty promotions gracefully in filter', () => {
    const root = create(<PromotionsScreen promotions={[]} />);
    pressByText(root, '进行中');
    expect(getRenderedTexts(root)).toContain('暂无促销活动');
  });

  it('renders budget usage count on active promotion', () => {
    const root = create(
      <PromotionsScreen promotions={[MOCK_PROMOTIONS[0]]} />,
    );
    const text = getRenderedTexts(root);
    expect(text).toContain('128');
    expect(text).toContain('¥18,200');
    expect(text).toContain('¥50,000');
  });

  it('renders 100% progress for fully spent promotion', () => {
    const root = create(
      <PromotionsScreen promotions={[MOCK_PROMOTIONS[2]]} />,
    );
    const texts = getRenderedTexts(root);
    expect(texts).toContain('100');
    expect(texts).toContain('%');
  });

  it('renders all filter chip labels', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);
    const text = getRenderedTexts(root);
    expect(text).toContain('全部');
    expect(text).toContain('进行中');
    expect(text).toContain('草稿');
    expect(text).toContain('已暂停');
    expect(text).toContain('已结束');
  });

  it('switches between filters correctly multiple times', () => {
    const root = create(<PromotionsScreen promotions={MOCK_PROMOTIONS} />);

    // 全部 => 草稿 => 进行中 => 已结束
    pressByText(root, '草稿');
    expect(getRenderedTexts(root)).toContain('新人优惠券');

    pressByText(root, '进行中');
    expect(getRenderedTexts(root)).toContain('国庆全场8折');
    expect(getRenderedTexts(root)).not.toContain('新人优惠券');

    pressByText(root, '已结束');
    expect(getRenderedTexts(root)).toContain('已结束活动');
  });
});
