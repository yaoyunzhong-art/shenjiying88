/**
 * FinancesScreen.tsx - 财务统计页面
 * 展示门店收支概览、近期交易流水
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// ---- 类型定义 ----

interface FinanceSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  orderCount: number;
  refundCount: number;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'refund';
  amount: number;
  category: string;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

// ---- 默认 Props ----

const DEFAULT_SUMMARY: FinanceSummary = {
  totalRevenue: 0,
  totalExpense: 0,
  netProfit: 0,
  orderCount: 0,
  refundCount: 0,
};

interface FinancesScreenProps {
  summary?: FinanceSummary;
  transactions?: Transaction[];
  onTransactionPress?: (tx: Transaction) => void;
  onRefresh?: () => void;
}

// ---- 格式化 ----

function formatCurrency(amount: number): string {
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}¥${Math.abs(amount).toFixed(2)}`;
}

const TYPE_LABELS: Record<Transaction['type'], string> = {
  income: '收入',
  expense: '支出',
  refund: '退款',
};

const TYPE_STYLES: Record<Transaction['type'], { color: string; bg: string }> = {
  income: { color: '#16a34a', bg: '#f0fdf4' },
  expense: { color: '#dc2626', bg: '#fef2f2' },
  refund: { color: '#ea580c', bg: '#fff7ed' },
};

const STATUS_LABELS: Record<Transaction['status'], string> = {
  completed: '已完成',
  pending: '处理中',
  failed: '失败',
};

// ---- 子组件 ----

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

/** 单笔交易行 */
function TransactionRow({
  tx,
  onPress,
}: {
  tx: Transaction;
  onPress?: (tx: Transaction) => void;
}) {
  const style = TYPE_STYLES[tx.type];
  return (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => onPress?.(tx)}
      activeOpacity={0.7}
      testID={`tx-row-${tx.id}`}
    >
      <View style={[styles.txTypeBadge, { backgroundColor: style.bg }]}>
        <Text style={[styles.txTypeText, { color: style.color }]}>
          {TYPE_LABELS[tx.type]}
        </Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDescription}>{tx.description}</Text>
        <Text style={styles.txMeta}>
          {tx.category} · {tx.createdAt}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: style.color }]}>
          {tx.type === 'income' ? '+' : '-'}
          {formatCurrency(tx.amount)}
        </Text>
        <Text style={styles.txStatus}>{STATUS_LABELS[tx.status]}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---- 主组件 ----

export const FinancesScreen: React.FC<FinancesScreenProps> = ({
  summary = DEFAULT_SUMMARY,
  transactions = [],
  onTransactionPress,
  onRefresh,
}) => {
  const isEmpty = summary.totalRevenue === 0 && summary.totalExpense === 0 && transactions.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyText}>暂无财务数据</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={undefined}
      onRefresh={onRefresh}
    >
      {/* 概览区域 */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <SummaryCard
            label="总收入"
            value={formatCurrency(summary.totalRevenue)}
            color="#16a34a"
          />
          <SummaryCard
            label="总支出"
            value={formatCurrency(summary.totalExpense)}
            color="#dc2626"
          />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard
            label="净利润"
            value={formatCurrency(summary.netProfit)}
            color={summary.netProfit >= 0 ? '#2563eb' : '#dc2626'}
          />
          <SummaryCard
            label="订单数"
            value={`${summary.orderCount}`}
            color="#6b7280"
          />
        </View>
        <View style={styles.refundRow}>
          <Text style={styles.refundLabel}>退款笔数</Text>
          <Text style={[styles.refundValue, summary.refundCount > 0 && { color: '#ea580c' }]}>
            {summary.refundCount}
          </Text>
        </View>
      </View>

      {/* 交易列表 */}
      {transactions.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>近期交易</Text>
          </View>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onPress={onTransactionPress} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// ---- 样式 ----

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refundLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  refundValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txTypeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  txTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  txMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default FinancesScreen;
