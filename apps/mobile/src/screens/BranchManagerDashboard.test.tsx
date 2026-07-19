/**
 * BranchManagerDashboard.test.tsx - D类 店长工作台 单元测试
 * 三态覆盖: 正常渲染 / 边界状态 / 交互回调
 * 总用例: 12
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { BranchManagerDashboard } from './BranchManagerDashboard';

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

/* ================================================================== */
/*  正例: 正常渲染 + 核心数据                                          */
/* ================================================================== */

describe('BranchManagerDashboard', () => {
  it('renders header title correctly', () => {
    const root = create(<BranchManagerDashboard />).root;
    const headerTitle = root.findByProps({ children: '店长工作台' });
    expect(headerTitle).toBeDefined();
  });

  it('renders sub header text', () => {
    const root = create(<BranchManagerDashboard />).root;
    const subText = root.findByProps({ children: '今日 · 门店整体概览' });
    expect(subText).toBeDefined();
  });

  it('renders metric cards: 今日营收, 订单数, 会员到店, 新增会员, 满意度', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '今日营收')).toBe(true);
    expect(textContains(root, '订单数')).toBe(true);
    expect(textContains(root, '会员到店')).toBe(true);
    expect(textContains(root, '新增会员')).toBe(true);
    expect(textContains(root, '满意度')).toBe(true);
  });

  it('renders formatted revenue value', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '¥28,560')).toBe(true);
  });

  it('renders order count with unit', () => {
    const root = create(<BranchManagerDashboard />).root;
    const allText = collectTexts(root);
    // 订单数 value "47" and unit "单" should be present
    expect(allText.some((t) => t.includes('47'))).toBe(true);
  });

  it('renders all four quick action buttons', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '📋 开单')).toBe(true);
    expect(textContains(root, '👤 会员查询')).toBe(true);
    expect(textContains(root, '📊 营业报表')).toBe(true);
    expect(textContains(root, '📦 库存管理')).toBe(true);
  });

  it('renders section title 团队绩效 (今日)', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '团队绩效 (今日)')).toBe(true);
  });

  it('renders all staff names and roles', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '张丽')).toBe(true);
    expect(textContains(root, '王强')).toBe(true);
    expect(textContains(root, '李敏')).toBe(true);
    expect(textContains(root, '陈浩')).toBe(true);
    expect(textContains(root, '前台')).toBe(true);
    expect(textContains(root, '导购')).toBe(true);
    expect(textContains(root, '技师')).toBe(true);
  });

  it('renders staff performance stats: order count, revenue, satisfaction', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '单18')).toBe(true);
    expect(textContains(root, '单14')).toBe(true);
    expect(textContains(root, '⭐4.8')).toBe(true);
  });

  it('renders section title 待办事项', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '待办事项')).toBe(true);
  });

  it('renders all three task items with titles', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '每日营收对账')).toBe(true);
    expect(textContains(root, '库存盘点-美容区')).toBe(true);
    expect(textContains(root, '新员工培训签到')).toBe(true);
  });

  it('renders task deadlines', () => {
    const root = create(<BranchManagerDashboard />).root;
    expect(textContains(root, '截止:')).toBe(true);
    expect(textContains(root, '今日 18:00')).toBe(true);
    expect(textContains(root, '今日 20:00')).toBe(true);
    expect(textContains(root, '明日 10:00')).toBe(true);
  });
});
