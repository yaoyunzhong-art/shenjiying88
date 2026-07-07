'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 财务报表摘要 */
export interface FinanceSummary {
  /** 今日营收 */
  dailyRevenue: number;
  /** 营收环比 */
  revenueQoQ: number;
  /** 月度支出 */
  monthlyExpense: number;
  /** 支出环比 */
  expenseQoQ: number;
  /** 净利润率 */
  profitMargin: number;
  /** 利润率环比 */
  profitMarginQoQ: number;
  /** 应收账款 */
  accountsReceivable: number;
  /** 应收环比 */
  receivableQoQ: number;
  /** 待处理发票数 */
  pendingInvoices: number;
}

/** 财务流水条目 */
export interface FinanceTransaction {
  id: string;
  /** 门店/部门 */
  department: string;
  /** 交易类型 */
  type: 'revenue' | 'expense' | 'transfer' | 'refund';
  /** 金额 */
  amount: number;
  /** 分类 */
  category: string;
  /** 描述 */
  description: string;
  /** 交易时间 */
  time: string;
  /** 状态 */
  status: 'pending' | 'cleared' | 'flagged' | 'reconciled';
  /** 经办人 */
  handler?: string;
}

/** 预算概览项 */
export interface BudgetOverviewItem {
  /** 预算类别 */
  category: string;
  /** 预算总额 */
  budget: number;
  /** 已使用 */
  used: number;
  /** 剩余 */
  remaining: number;
  /** 使用率 (0-100) */
  usageRate: number;
  /** 预警阈值 */
  warningThreshold: number;
}

/** 预算概览 */
export interface BudgetOverview {
  items: BudgetOverviewItem[];
  totalBudget: number;
  totalUsed: number;
}

export interface FinanceManagerDashboardProps {
  /** 财务摘要 */
  summary: FinanceSummary;
  /** 近期流水 */
  recentTransactions: FinanceTransaction[];
  /** 预算概览 */
  budgetOverview: BudgetOverview;
  /** 加载状态 */
  isLoading?: boolean;
}

// ---- 辅助函数 ----

const FORMATTER = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatMoney(val: number): string {
  if (val >= 1_0000_0000) return `${(val / 1_0000_0000).toFixed(2)}亿`;
  if (val >= 1_0000) return `${(val / 1_0000).toFixed(2)}万`;
  return FORMATTER.format(val);
}

const TRANSACTION_TYPE_LABEL: Record<FinanceTransaction['type'], string> = {
  revenue: '收入',
  expense: '支出',
  transfer: '调拨',
  refund: '退款',
};

const TRANSACTION_STATUS_LABEL: Record<FinanceTransaction['status'], string> = {
  pending: '待审核',
  cleared: '已结算',
  flagged: '异常',
  reconciled: '已对账',
};

const TRANSACTION_STATUS_COLOR: Record<FinanceTransaction['status'], string> = {
  pending: '#fa8c16',
  cleared: '#52c41a',
  flagged: '#f5222d',
  reconciled: '#1677ff',
};

// ---- 组件 ----

export function FinanceManagerDashboard({
  summary,
  recentTransactions,
  budgetOverview,
  isLoading = false,
}: FinanceManagerDashboardProps) {
  if (isLoading) {
    return (
      <div data-testid="finance-dashboard-loading" role="status">
        <div className="skeleton" style={{ height: 140, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  // 快速指标
  const quickStats: QuickStatItem[] = [
    {
      label: '今日营收',
      value: formatMoney(summary.dailyRevenue),
      trend: summary.revenueQoQ,
      valueColor: summary.revenueQoQ >= 0 ? '#22c55e' : '#ef4444',
    },
    {
      label: '月度支出',
      value: formatMoney(summary.monthlyExpense),
      trend: summary.expenseQoQ,
      valueColor: summary.expenseQoQ <= 0 ? '#22c55e' : '#ef4444',
    },
    {
      label: '净利润率',
      value: `${summary.profitMargin.toFixed(1)}%`,
      trend: summary.profitMarginQoQ,
      valueColor: summary.profitMargin >= 0 ? '#22c55e' : '#ef4444',
    },
    {
      label: '应收账款',
      value: formatMoney(summary.accountsReceivable),
      trend: summary.receivableQoQ,
      valueColor: summary.receivableQoQ <= 0 ? '#22c55e' : '#ef4444',
    },
  ];

  // 流水表格列
  const transactionColumns: DataTableColumn<FinanceTransaction>[] = [
    { key: 'department', header: '部门', dataKey: 'department', sortable: true },
    {
      key: 'type',
      header: '类型',
      render: (row) => (
        <span style={{ color: row.type === 'revenue' ? '#22c55e' : row.type === 'expense' ? '#ef4444' : '#8c8c8c' }}>
          {TRANSACTION_TYPE_LABEL[row.type]}
        </span>
      ),
    },
    {
      key: 'amount',
      header: '金额',
      sortable: true,
      render: (row) => (
        <span style={{
          fontWeight: 600,
          color: row.type === 'revenue' ? '#22c55e' : row.type === 'expense' ? '#ef4444' : '#333',
        }}>
          {row.type === 'expense' || row.type === 'refund' ? '-' : '+'}{formatMoney(row.amount)}
        </span>
      ),
    },
    { key: 'category', header: '分类', dataKey: 'category', sortable: true },
    { key: 'description', header: '描述', dataKey: 'description' },
    { key: 'time', header: '时间', dataKey: 'time', sortable: true },
    {
      key: 'status',
      header: '状态',
      render: (row) => (
        <span
          data-testid={`tx-status-${row.id}`}
          style={{
            padding: '1px 8px',
            fontSize: 11,
            borderRadius: 10,
            background: `${TRANSACTION_STATUS_COLOR[row.status]}20`,
            color: TRANSACTION_STATUS_COLOR[row.status],
          }}
        >
          {TRANSACTION_STATUS_LABEL[row.status]}
        </span>
      ),
    },
    { key: 'handler', header: '经办人', dataKey: 'handler' },
  ];

  return (
    <div data-testid="finance-manager-dashboard" style={{ padding: 20 }}>
      {/* 快速指标 */}
      <QuickStats items={quickStats} columns={4} />

      {/* 流水概览 */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>近期流水</h3>
          <span data-testid="pending-invoice-count" style={{
            padding: '2px 12px',
            fontSize: 12,
            borderRadius: 12,
            background: summary.pendingInvoices > 0 ? '#fa8c1620' : '#52c41a20',
            color: summary.pendingInvoices > 0 ? '#fa8c16' : '#52c41a',
          }}>
            待处理发票: {summary.pendingInvoices}
          </span>
        </div>
        <DataTable
          data={recentTransactions}
          columns={transactionColumns}
          rowKey={(row: FinanceTransaction) => row.id}
        />
      </div>

      {/* 预算概览 */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>预算执行概览</h3>
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>
            总计使用: <strong>{((budgetOverview.totalUsed / budgetOverview.totalBudget) * 100).toFixed(1)}%</strong>
          </span>
        </div>

        {/* 总预算进度条 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 8,
            borderRadius: 4,
            background: '#f0f0f0',
            overflow: 'hidden',
          }}>
            <div
              data-testid="budget-overall-bar"
              style={{
                height: '100%',
                width: `${Math.min((budgetOverview.totalUsed / budgetOverview.totalBudget) * 100, 100)}%`,
                borderRadius: 4,
                background: (budgetOverview.totalUsed / budgetOverview.totalBudget) > 0.85
                  ? '#f5222d'
                  : (budgetOverview.totalUsed / budgetOverview.totalBudget) > 0.7
                    ? '#fa8c16'
                    : '#1677ff',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* 单项预算 */}
        {budgetOverview.items.map((item) => {
          const isOverThreshold = item.usageRate >= item.warningThreshold;
          const barColor = item.usageRate >= 100
            ? '#f5222d'
            : item.usageRate >= item.warningThreshold
              ? '#fa8c16'
              : '#1677ff';

          return (
            <div
              key={item.category}
              data-testid={`budget-item-${item.category.replace(/\s+/g, '-')}`}
              data-warning={isOverThreshold}
              style={{ marginBottom: 14 }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 4,
              }}>
                <span style={{ fontWeight: 500 }}>{item.category}</span>
                <span style={{ color: barColor, fontWeight: 600 }}>
                  {item.usageRate.toFixed(1)}%
                </span>
              </div>
              <div style={{
                height: 6,
                borderRadius: 3,
                background: '#f0f0f0',
                overflow: 'hidden',
              }}>
                <div
                  data-testid={`budget-bar-${item.category.replace(/\s+/g, '-')}`}
                  style={{
                    height: '100%',
                    width: `${Math.min(item.usageRate, 100)}%`,
                    borderRadius: 3,
                    background: barColor,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#8c8c8c',
                marginTop: 2,
              }}>
                <span>已用: {formatMoney(item.used)}</span>
                <span>剩余: {formatMoney(item.remaining)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
