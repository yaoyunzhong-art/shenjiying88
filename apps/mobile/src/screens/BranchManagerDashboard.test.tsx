/**
 * BranchManagerDashboard.test.tsx - D类 店长工作台 单元测试
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { BranchManagerDashboard } from './BranchManagerDashboard';

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

  it('renders metric cards with revenue', () => {
    const root = create(<BranchManagerDashboard />).root;
    // Revenue should be rendered
    const revenueElements = root.findAllByProps({ children: '今日营收' });
    expect(revenueElements.length).toBeGreaterThan(0);
  });

  it('renders metric cards with order count', () => {
    const root = create(<BranchManagerDashboard />).root;
    const orderElements = root.findAllByProps({ children: '订单数' });
    expect(orderElements.length).toBeGreaterThan(0);
  });

  it('renders section title for staff performance', () => {
    const root = create(<BranchManagerDashboard />).root;
    const staffTitle = root.findByProps({ children: '团队绩效 (今日)' });
    expect(staffTitle).toBeDefined();
  });

  it('renders section title for pending tasks', () => {
    const root = create(<BranchManagerDashboard />).root;
    const taskTitle = root.findByProps({ children: '待办事项' });
    expect(taskTitle).toBeDefined();
  });

  it('renders quick action buttons', () => {
    const root = create(<BranchManagerDashboard />).root;
    const openOrderBtn = root.findByProps({ children: '📋 开单' });
    expect(openOrderBtn).toBeDefined();
    const memberSearchBtn = root.findByProps({ children: '👤 会员查询' });
    expect(memberSearchBtn).toBeDefined();
  });

  it('renders staff rows with names', () => {
    const root = create(<BranchManagerDashboard />).root;
    const staffNames = ['张丽', '王强', '李敏'];
    staffNames.forEach((name) => {
      const nameEl = root.findByProps({ children: name });
      expect(nameEl).toBeDefined();
    });
  });

  it('renders task items', () => {
    const root = create(<BranchManagerDashboard />).root;
    const taskTitle = root.findByProps({ children: '每日营收对账' });
    expect(taskTitle).toBeDefined();
  });

  it('renders task items with priority indicators', () => {
    const root = create(<BranchManagerDashboard />).root;
    const taskTitle = root.findByProps({ children: '每日营收对账' });
    expect(taskTitle).toBeDefined();
    const task2 = root.findByProps({ children: '库存盘点-美容区' });
    expect(task2).toBeDefined();
    const task3 = root.findByProps({ children: '新员工培训签到' });
    expect(task3).toBeDefined();
  });
});
