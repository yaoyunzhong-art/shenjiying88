/**
 * BranchSelectorScreen.test.tsx - 门店选择器单元测试
 *
 * 覆盖:
 * 1. 正例: 正常渲染全部门店
 * 2. 反例: 搜索无结果空状态
 * 3. 边界: 选中门店高亮、store 交互
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';

/* ------------------------------------------------------------------ */
/*  Mock Zustand store (hoisted by vitest)                             */
/* ------------------------------------------------------------------ */
const mockSetCurrentBranch = vi.fn();
const mockSetAvailableBranches = vi.fn();

vi.mock('../store/branchStore', () => ({
  useBranchStore: Object.assign(
    (selector?: any) => {
      // Default initial state (overridden by setMockState before each test)
      const state = {
        currentBranch: null,
        availableBranches: [],
        isHydrated: true,
        setCurrentBranch: mockSetCurrentBranch,
        setAvailableBranches: mockSetAvailableBranches,
        restoreSession: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        currentBranch: null,
        availableBranches: [],
        isHydrated: true,
        setCurrentBranch: mockSetCurrentBranch,
        setAvailableBranches: mockSetAvailableBranches,
        restoreSession: vi.fn(),
      }),
      subscribe: vi.fn(() => () => {}),
      setState: vi.fn(),
      destroy: vi.fn(),
    },
  ),
}));

import { BranchSelectorScreen } from './BranchSelectorScreen';

/* ------------------------------------------------------------------ */
/*  Dynamic mock state override                                        */
/* ------------------------------------------------------------------ */
let mockStateOverrides: Record<string, unknown> = {};

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function collectTexts(root: ReturnType<typeof create>['root']): string[] {
  const allText = root.findAllByType('Text');
  return allText.map((t) => {
    const c = t.props.children;
    return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : String(c ?? '');
  });
}

function textContains(root: ReturnType<typeof create>['root'], substr: string): boolean {
  return collectTexts(root).some((t) => t.includes(substr));
}

beforeEach(() => {
  mockSetCurrentBranch.mockClear();
  mockSetAvailableBranches.mockClear();
  mockStateOverrides = {};
});

/* ================================================================== */
/*  正例: 正常渲染 + 门店数据                                          */
/* ================================================================== */

describe('BranchSelectorScreen', () => {
  it('renders search bar with placeholder', () => {
    const root = create(<BranchSelectorScreen />).root;
    const inputs = root.findAllByType('TextInput');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    const searchInput = inputs[0];
    expect(searchInput.props.placeholder).toContain('搜索');
  });

  it('renders filter chips: 全部, 营业中, 已歇业, 维护中', () => {
    const root = create(<BranchSelectorScreen />).root;
    const buttons = root.findAllByType('TouchableOpacity');
    const chipTexts = buttons
      .map((b) => b.findAllByType('Text'))
      .flat()
      .map((t) => t.props.children)
      .filter(Boolean);

    expect(chipTexts).toContain('全部');
    expect(chipTexts).toContain('营业中');
    expect(chipTexts).toContain('已歇业');
    expect(chipTexts).toContain('维护中');
  });

  it('renders all five branch cards from mock data', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '神机营·旗舰店')).toBe(true);
    expect(textContains(root, '神机营·徐汇店')).toBe(true);
    expect(textContains(root, '神机营·静安店')).toBe(true);
    expect(textContains(root, '神机营·杭州店')).toBe(true);
    expect(textContains(root, '神机营·南京店')).toBe(true);
  });

  it('renders branch addresses', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '上海市浦东新区陆家嘴环路1000号')).toBe(true);
    expect(textContains(root, '杭州市西湖区教工路88号')).toBe(true);
  });

  it('renders manager names for all five branches', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '张经理')).toBe(true);
    expect(textContains(root, '李店长')).toBe(true);
    expect(textContains(root, '王经理')).toBe(true);
    expect(textContains(root, '陈店长')).toBe(true);
    expect(textContains(root, '刘经理')).toBe(true);
  });

  it('renders today revenue for active branches', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '¥ 28,650')).toBe(true);
    expect(textContains(root, '¥ 19,230')).toBe(true);
    expect(textContains(root, '¥ 15,320')).toBe(true);
  });

  it('renders section labels: 今日营收, 今日订单, 店长', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '今日营收')).toBe(true);
    expect(textContains(root, '今日订单')).toBe(true);
    expect(textContains(root, '店长')).toBe(true);
  });

  /* ============================================================== */
  /*  反例: 空搜索结果                                                */
  /* ============================================================== */

  it('shows empty state when search has no matches', () => {
    const root = create(<BranchSelectorScreen />).root;
    const inputs = root.findAllByType('TextInput');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    act(() => inputs[0].props.onChangeText?.('不存在门店xyz'));
    expect(textContains(root, '未找到门店')).toBe(true);
    expect(textContains(root, '请尝试调整筛选或搜索条件')).toBe(true);
  });

  /* ============================================================== */
  /*  边界: 选中状态 + store 交互                                     */
  /* ============================================================== */

  it('calls setCurrentBranch when a branch card is pressed', () => {
    const root = create(<BranchSelectorScreen />).root;
    const buttons = root.findAllByType('TouchableOpacity');

    // Find the 旗舰店 branch card button
    const flagBtn = buttons.find(
      (b) =>
        typeof b.props.onPress === 'function' &&
        b.findAllByType('Text').some((t) => {
          const c = t.props.children;
          return typeof c === 'string' && c.includes('神机营·旗舰店');
        }),
    );

    expect(flagBtn).toBeDefined();
    act(() => flagBtn!.props.onPress());
    // Component also calls setCurrentBranch during init (auto-select first active branch)
    // So we check that it was called at least with the pressed branch
    expect(mockSetCurrentBranch).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'b001', name: '神机营·旗舰店' }),
    );
  });

  it('renders status pills with correct labels: 营业中, 已歇业, 维护中', () => {
    const root = create(<BranchSelectorScreen />).root;
    expect(textContains(root, '营业中')).toBe(true);
    expect(textContains(root, '已歇业')).toBe(true);
    expect(textContains(root, '维护中')).toBe(true);
  });

  it('renders manager info for all branches regardless of status', () => {
    const root = create(<BranchSelectorScreen />).root;
    // inactive 静安店 still shows manager
    expect(textContains(root, '王经理')).toBe(true);
    // maintenance 杭州店 still shows manager
    expect(textContains(root, '陈店长')).toBe(true);
  });

  it('calls setAvailableBranches during initialization', () => {
    create(<BranchSelectorScreen />).root;
    // The component calls setAvailableBranches(MOCK_BRANCHES) during init
    expect(mockSetAvailableBranches).toHaveBeenCalledTimes(1);
    expect(mockSetAvailableBranches).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'b001' }),
        expect.objectContaining({ id: 'b005' }),
      ]),
    );
  });
});
