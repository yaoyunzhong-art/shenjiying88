/**
 * SalesReportsScreen.tsx - 销售报表页面
 * 展示销售额度统计、时段趋势、品类排行
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

// ---- 类型定义 ----

type Period = 'daily' | 'weekly' | 'monthly';

interface SalesSummary {
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  customerCount: number;
  salesGrowth: number; // 百分比, 如 12.5 表示 +12.5%
}

interface CategoryRank {
  category: string;
  sales: number;
  percentage: number;
}

interface TrendPoint {
  label: string;
  value: number;
}

// ---- 默认 Props ----

const DEFAULT_SUMMARY: SalesSummary = {
  totalSales: 0,
  orderCount: 0,
  avgOrderValue: 0,
  customerCount: 0,
  salesGrowth: 0,
};

interface SalesReportsScreenProps {
  summary?: SalesSummary;
  trends?: TrendPoint[];
  categoryRanks?: CategoryRank[];
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  onSearch?: (keyword: string) => void;
}

// ---- 格式化 ----

function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function formatGrowth(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: '今日',
  weekly: '本周',
  monthly: '本月',
};

// ---- 子组件 ----

/** 概览指标卡片 */
function MetricCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {sub !== undefined && (
        <Text style={[styles.metricSub, subColor ? { color: subColor } : undefined]}>
          {sub}
        </Text>
      )}
    </View>
  );
}

/** 时段趋势条形图（简化版） */
function TrendBarChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return null;
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>销售趋势</Text>
      <View style={styles.barChart}>
        {data.map((point, idx) => (
          <View key={idx} style={styles.barColumn}>
            <Text style={styles.barValue}>{formatCurrency(point.value)}</Text>
            <View
              style={[
                styles.bar,
                { height: maxValue > 0 ? (point.value / maxValue) * 120 : 4 },
              ]}
            />
            <Text style={styles.barLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 品类排行列表 */
function CategoryRankList({ data }: { data: CategoryRank[] }) {
  if (data.length === 0) return null;
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>品类排行</Text>
      {data.map((item, idx) => (
        <View key={idx} style={styles.rankRow}>
          <View style={styles.rankBadge}>
            <Text style={[styles.rankNum, idx < 3 && styles.rankTop]}>{idx + 1}</Text>
          </View>
          <Text style={styles.rankCategory}>{item.category}</Text>
          <View style={styles.rankBarOuter}>
            <View style={[styles.rankBarInner, { width: `${item.percentage}%` }]} />
          </View>
          <Text style={styles.rankSales}>{formatCurrency(item.sales)}</Text>
        </View>
      ))}
    </View>
  );
}

/** 时段筛选标签 */
function PeriodTabs({
  current,
  onChange,
}: {
  current: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <View style={styles.periodTabs}>
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.periodTab, current === p && styles.periodTabActive]}
          onPress={() => onChange(p)}
          testID={`period-tab-${p}`}
        >
          <Text
            style={[styles.periodTabText, current === p && styles.periodTabTextActive]}
          >
            {PERIOD_LABELS[p]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** 搜索栏 */
function SearchBar({ onSearch }: { onSearch?: (keyword: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.searchBar}>
      <TextInput
        style={styles.searchInput}
        placeholder="搜索品类或订单..."
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={setValue}
        onSubmitEditing={() => onSearch?.(value)}
        returnKeyType="search"
        testID="search-input"
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.searchClear}
          onPress={() => {
            setValue('');
            onSearch?.('');
          }}
          testID="search-clear"
        >
          <Text style={styles.searchClearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---- 主组件 ----

export const SalesReportsScreen: React.FC<SalesReportsScreenProps> = ({
  summary = DEFAULT_SUMMARY,
  trends = [],
  categoryRanks = [],
  period: initialPeriod = 'daily',
  onPeriodChange,
  onSearch,
}) => {
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    onPeriodChange?.(p);
  };

  const isEmpty =
    summary.totalSales === 0 &&
    summary.orderCount === 0 &&
    trends.length === 0 &&
    categoryRanks.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={styles.emptyText}>暂无销售数据</Text>
        <Text style={styles.emptyHint}>选择时段查看销售报表</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {/* 时段切换 */}
      <PeriodTabs current={period} onChange={handlePeriodChange} />

      {/* 搜索 */}
      <SearchBar onSearch={onSearch} />

      {/* 指标卡片区 */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <MetricCard
            label="总销售额"
            value={formatCurrency(summary.totalSales)}
            sub={formatGrowth(summary.salesGrowth)}
            subColor={summary.salesGrowth >= 0 ? '#16a34a' : '#dc2626'}
          />
          <MetricCard
            label="订单数"
            value={`${summary.orderCount}`}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            label="平均客单价"
            value={formatCurrency(summary.avgOrderValue)}
          />
          <MetricCard
            label="接待顾客"
            value={`${summary.customerCount}`}
          />
        </View>
      </View>

      {/* 趋势图 */}
      {trends.length > 0 && <TrendBarChart data={trends} />}

      {/* 品类排行 */}
      {categoryRanks.length > 0 && <CategoryRankList data={categoryRanks} />}
    </ScrollView>
  );
};

// ---- 样式 ----

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  searchClear: {
    padding: 6,
  },
  searchClearText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  metricsGrid: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 6,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  rankBadge: {
    width: 24,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  rankTop: {
    color: '#2563eb',
    fontWeight: '700',
  },
  rankCategory: {
    width: 80,
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  rankBarOuter: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  rankBarInner: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  rankSales: {
    width: 80,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});

export default SalesReportsScreen;
