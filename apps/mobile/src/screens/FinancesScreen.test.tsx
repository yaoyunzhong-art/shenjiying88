/**
 * FinancesScreen.test.tsx - 财务统计页面单元测试
 *
 * 注意: react-test-renderer 会将 Text 的 children 包装为数组,
 * 如 children: ["¥50000.00"] 而非 children: "¥50000.00",
 * 因此匹配文本内容需要通过 findAllByType('Text') 然后检查数组内容.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { FinancesScreen } from './FinancesScreen';

/** 辅助: 提取所有 Text 节点的文本内容为一个字符串 */
function getAllText(root: ReturnType<typeof create>['root']): string {
  return root
    .findAllByType('Text')
    .map((t) => {
      const c = t.props.children;
      if (Array.isArray(c)) return c.filter((x: unknown) => typeof x === 'string').join('');
      return String(c);
    })
    .join(' ');
}

describe('FinancesScreen', () => {
  it('renders empty state when no data', () => {
    const root = create(<FinancesScreen />).root;
    const emptyText = root.findByProps({ children: '暂无财务数据' });
    expect(emptyText).toBeDefined();
  });

  it('renders summary cards with provided data', () => {
    const root = create(
      <FinancesScreen
        summary={{
          totalRevenue: 50000,
          totalExpense: 30000,
          netProfit: 20000,
          orderCount: 120,
          refundCount: 3,
        }}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('¥50000.00');
    expect(text).toContain('¥30000.00');
    expect(text).toContain('¥20000.00');
    expect(text).toContain('120');
    expect(text).toContain('总收入');
    expect(text).toContain('总支出');
    expect(text).toContain('净利润');
    expect(text).toContain('订单数');
    expect(text).toContain('退款笔数');
  });

  it('renders a list of transactions', () => {
    const transactions = [
      {
        id: '1',
        type: 'income' as const,
        amount: 128.0,
        category: '会员充值',
        description: '张三 - 银卡充值',
        createdAt: '10:30',
        status: 'completed' as const,
      },
      {
        id: '2',
        type: 'expense' as const,
        amount: 45.5,
        category: '采购',
        description: '打印纸采购',
        createdAt: '09:15',
        status: 'completed' as const,
      },
    ];

    const root = create(
      <FinancesScreen
        summary={{
          totalRevenue: 50000,
          totalExpense: 30000,
          netProfit: 20000,
          orderCount: 120,
          refundCount: 1,
        }}
        transactions={transactions}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('张三 - 银卡充值');
    expect(text).toContain('打印纸采购');
    expect(text).toContain('+¥128.00');
    expect(text).toContain('-¥45.50');
  });

  it('renders all three transaction types', () => {
    const transactions = [
      { id: '1', type: 'income' as const, amount: 100, category: '销售', description: '收入描述', createdAt: '12:00', status: 'completed' as const },
      { id: '2', type: 'expense' as const, amount: 50, category: '采购', description: '支出描述', createdAt: '12:01', status: 'completed' as const },
      { id: '3', type: 'refund' as const, amount: 20, category: '退款', description: '退款描述', createdAt: '12:02', status: 'completed' as const },
    ];

    const root = create(
      <FinancesScreen
        summary={{ totalRevenue: 100, totalExpense: 50, netProfit: 50, orderCount: 1, refundCount: 1 }}
        transactions={transactions}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('收入描述');
    expect(text).toContain('支出描述');
    expect(text).toContain('退款描述');
    // Type badge labels
    expect(text).toContain('收入');
    expect(text).toContain('支出');
    expect(text).toContain('退款');
  });

  it('renders pending status', () => {
    const transactions = [
      { id: '1', type: 'income' as const, amount: 200, category: '充值', description: '在线充值', createdAt: '11:00', status: 'pending' as const },
    ];

    const root = create(
      <FinancesScreen
        summary={{ totalRevenue: 200, totalExpense: 0, netProfit: 200, orderCount: 1, refundCount: 0 }}
        transactions={transactions}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('在线充值');
    expect(text).toContain('处理中');
  });

  it('renders negative net profit', () => {
    const root = create(
      <FinancesScreen
        summary={{
          totalRevenue: 10000,
          totalExpense: 15000,
          netProfit: -5000,
          orderCount: 50,
          refundCount: 5,
        }}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('-¥5000.00');
  });

  it('renders section header 近期交易', () => {
    const transactions = [
      { id: '1', type: 'income' as const, amount: 100, category: '测试', description: '测试交易', createdAt: '10:00', status: 'completed' as const },
    ];
    const root = create(
      <FinancesScreen
        summary={{ totalRevenue: 100, totalExpense: 0, netProfit: 100, orderCount: 1, refundCount: 0 }}
        transactions={transactions}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('近期交易');
  });

  it('renders transaction dates', () => {
    const transactions = [
      { id: '1', type: 'income' as const, amount: 300, category: '销售', description: '销售单', createdAt: '2026-07-07', status: 'completed' as const },
    ];
    const root = create(
      <FinancesScreen
        summary={{ totalRevenue: 300, totalExpense: 0, netProfit: 300, orderCount: 1, refundCount: 0 }}
        transactions={transactions}
      />
    ).root;

    const text = getAllText(root);
    expect(text).toContain('销售 · 2026-07-07');
  });

  it('renders ScrollView container', () => {
    const root = create(
      <FinancesScreen
        summary={{ totalRevenue: 100, totalExpense: 0, netProfit: 100, orderCount: 1, refundCount: 0 }}
      />
    ).root;

    const scrollView = root.findByType('RCTScrollView');
    expect(scrollView).toBeDefined();
  });
});
