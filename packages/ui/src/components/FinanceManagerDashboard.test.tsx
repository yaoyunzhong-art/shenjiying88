/**
 * FinanceManagerDashboard 组件测试 · D-角色操作界面
 *
 * 覆盖:
 *   正例: 基础渲染、快速指标、流水表格、预算概览、格式化函数
 *   反例: 空数据、极端值、加载状态
 *   边界: 超高预算使用率、负数金额、零值
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { FinanceManagerDashboard } = require('./FinanceManagerDashboard');

// ==================== Mock 数据工厂 ====================

function makeSummary(overrides: Record<string, any> = {}) {
  return {
    dailyRevenue: 128_500,
    revenueQoQ: 12.5,
    monthlyExpense: 320_000,
    expenseQoQ: -3.2,
    profitMargin: 18.3,
    profitMarginQoQ: 2.1,
    accountsReceivable: 865_200,
    receivableQoQ: -5.8,
    pendingInvoices: 8,
    ...overrides,
  };
}

function makeTransactions(count = 6) {
  const types = ['revenue', 'expense', 'transfer', 'refund'] as const;
  const statuses = ['pending', 'cleared', 'flagged', 'reconciled'] as const;
  const categories = ['营销费', '采购成本', '人员工资', '租金', '水电', '办公用品'];
  const departments = ['A门店', 'B门店', '总部', '仓储中心'];
  const handlers = ['张三', '李四', '王五', '赵六'];

  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    department: departments[i % departments.length],
    type: types[i % types.length],
    amount: [15_000, -3_200, 8_500, -1_200, 50_000, -25_000][i],
    category: categories[i % categories.length],
    description: `交易描述-${i + 1}`,
    time: `2026-07-0${(i % 7) + 1}`,
    status: statuses[i % statuses.length],
    handler: handlers[i % handlers.length],
  }));
}

function makeBudget(overrides: Record<string, any> = {}) {
  const items = [
    { category: '营销费用', budget: 500_000, used: 320_000, remaining: 180_000, usageRate: 64, warningThreshold: 80 },
    { category: '人力成本', budget: 800_000, used: 750_000, remaining: 50_000, usageRate: 93.8, warningThreshold: 85 },
    { category: '运营支出', budget: 300_000, used: 180_000, remaining: 120_000, usageRate: 60, warningThreshold: 80 },
    { category: '技术投入', budget: 200_000, used: 45_000, remaining: 155_000, usageRate: 22.5, warningThreshold: 85 },
  ];
  const totalBudget = items.reduce((s, i) => s + i.budget, 0);
  const totalUsed = items.reduce((s, i) => s + i.used, 0);
  return { items, totalBudget, totalUsed, ...overrides };
}

// ==================== 正例 ====================

describe('FinanceManagerDashboard: 正例 (positive cases)', () => {
  it('renders dashboard with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('data-testid="finance-manager-dashboard"'));
  });

  it('renders 4 QuickStats items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    const matches = html.match(/class="[^"]*"[^>]*style="[^"]*grid[^"]*gap[^"]*"/g);
    // QuickStats grid should be present
    assert.ok(html.includes('今日营收'));
    assert.ok(html.includes('月度支出'));
    assert.ok(html.includes('净利润率'));
    assert.ok(html.includes('应收账款'));
  });

  it('formats revenue amounts correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary({ dailyRevenue: 1_280_000 }),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('128.00万'));
  });

  it('shows pending invoice count', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary({ pendingInvoices: 12 }),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('data-testid="pending-invoice-count"'));
    assert.ok(html.includes('12'));
  });

  it('renders transaction table with transaction rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    // DataTable renders transaction data inside the '近期流水' section
    assert.ok(html.includes('交易描述-1'));
    assert.ok(html.includes('交易描述-2'));
    assert.ok(html.includes('tx-1'));
    assert.ok(html.includes('tx-2'));
  });

  it('renders budget overview items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('data-testid="budget-item-营销费用"'));
    assert.ok(html.includes('data-testid="budget-item-人力成本"'));
    assert.ok(html.includes('data-testid="budget-item-运营支出"'));
    assert.ok(html.includes('data-testid="budget-item-技术投入"'));
  });

  it('renders budget progress bars', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('data-testid="budget-overall-bar"'));
    assert.ok(html.includes('data-testid="budget-bar-营销费用"'));
    assert.ok(html.includes('data-testid="budget-bar-人力成本"'));
  });

  it('shows budget item warning for over-threshold items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('data-warning="true"'));
    assert.ok(html.includes('93.8%'));
  });

  it('renders transaction status badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    for (let i = 1; i <= 6; i++) {
      assert.ok(html.includes(`data-testid="tx-status-tx-${i}"`));
    }
  });

  it('calculates total budget usage percentage', () => {
    const budget = makeBudget();
    const expectedPct = ((budget.totalUsed / budget.totalBudget) * 100).toFixed(1);
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: budget,
      }),
    );
    assert.ok(html.includes(`${expectedPct}%`));
  });
});

// ==================== 反例 ====================

describe('FinanceManagerDashboard: 反例 (negative cases)', () => {
  it('shows loading skeleton when isLoading', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
        isLoading: true,
      }),
    );
    assert.ok(html.includes('data-testid="finance-dashboard-loading"'));
    assert.ok(!html.includes('data-testid="finance-manager-dashboard"'));
  });

  it('handles empty transactions gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: [],
        budgetOverview: makeBudget(),
      }),
    );
    // Dashboard still renders with empty data
    assert.ok(html.includes('data-testid="finance-manager-dashboard"'));
    assert.ok(html.includes('近期流水'));
  });
});

// ==================== 边界 ====================

describe('FinanceManagerDashboard: 边界 (boundary cases)', () => {
  it('handles zero revenue', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary({ dailyRevenue: 0, revenueQoQ: -100 }),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('¥0'));
  });

  it('handles large numbers (亿元)', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary({ dailyRevenue: 3_5000_0000 }),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('3.50亿'));
  });

  it('handles negative profit margin', () => {
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary({ profitMargin: -5.2, profitMarginQoQ: -3.1 }),
        recentTransactions: makeTransactions(),
        budgetOverview: makeBudget(),
      }),
    );
    assert.ok(html.includes('-5.2%'));
  });

  it('handles 100% budget usage rate', () => {
    const items = [
      { category: '全部用尽', budget: 100_000, used: 100_000, remaining: 0, usageRate: 100, warningThreshold: 80 },
    ];
    const budget = { items, totalBudget: 100_000, totalUsed: 100_000 };
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: budget,
      }),
    );
    assert.ok(html.includes('100.0%'));
  });

  it('handles over 100% usage rate', () => {
    const items = [
      { category: '超额使用', budget: 100_000, used: 120_000, remaining: -20_000, usageRate: 120, warningThreshold: 80 },
    ];
    const budget = { items, totalBudget: 100_000, totalUsed: 120_000 };
    const html = renderToStaticMarkup(
      React.createElement(FinanceManagerDashboard, {
        summary: makeSummary(),
        recentTransactions: makeTransactions(),
        budgetOverview: budget,
      }),
    );
    assert.ok(html.includes('120.0%'));
    // Bar should be capped at 100% width
    assert.ok(html.includes('width:100%') || html.includes('width: 100%'));
  });
});
