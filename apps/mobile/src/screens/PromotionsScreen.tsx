/**
 * PromotionsScreen.tsx - 促销活动管理页面
 * 展示活动列表，支持按状态筛选
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// ---- 类型定义 ----

export interface Promotion {
  id: string;
  title: string;
  type: 'discount' | 'coupon' | 'gift' | 'flash';
  status: 'draft' | 'active' | 'paused' | 'ended';
  discountRate?: number;
  startDate: string;
  endDate: string;
  usageCount: number;
  budget: number;
  spent: number;
}

type FilterStatus = 'all' | 'draft' | 'active' | 'paused' | 'ended';

// ---- 默认 Props ----

const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: '1',
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
    id: '2',
    title: '新人满100减20',
    type: 'coupon',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    usageCount: 56,
    budget: 20000,
    spent: 5600,
  },
  {
    id: '3',
    title: '买一送一特惠',
    type: 'gift',
    status: 'draft',
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    usageCount: 0,
    budget: 10000,
    spent: 0,
  },
  {
    id: '4',
    title: '双十一限时秒杀',
    type: 'flash',
    status: 'draft',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
    usageCount: 0,
    budget: 30000,
    spent: 0,
  },
  {
    id: '5',
    title: '夏季清凉促销',
    type: 'discount',
    status: 'ended',
    discountRate: 0.85,
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    usageCount: 342,
    budget: 80000,
    spent: 68000,
  },
  {
    id: '6',
    title: '会员日双倍积分',
    type: 'coupon',
    status: 'paused',
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    usageCount: 89,
    budget: 15000,
    spent: 4450,
  },
];

// ---- 辅助函数 ----

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function getStatusLabel(status: Promotion['status']): string {
  const map: Record<Promotion['status'], string> = {
    draft: '草稿',
    active: '进行中',
    paused: '已暂停',
    ended: '已结束',
  };
  return map[status];
}

function getStatusColor(status: Promotion['status']): string {
  const map: Record<Promotion['status'], string> = {
    draft: '#999',
    active: '#52c41a',
    paused: '#faad14',
    ended: '#ccc',
  };
  return map[status];
}

function getTypeLabel(type: Promotion['type']): string {
  const map: Record<Promotion['type'], string> = {
    discount: '折扣',
    coupon: '优惠券',
    gift: '赠品',
    flash: '限时秒杀',
  };
  return map[type];
}

function getBudgetProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(spent / budget, 1);
}

// ---- 状态筛选标签 ----

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'draft', label: '草稿' },
  { key: 'paused', label: '已暂停' },
  { key: 'ended', label: '已结束' },
];

// ---- 组件 ----

interface PromotionsScreenProps {
  promotions?: Promotion[];
  onPromotionPress?: (promotion: Promotion) => void;
  onStatusChange?: (promotionId: string, newStatus: Promotion['status']) => void;
  onRefresh?: () => void;
}

export const PromotionsScreen: React.FC<PromotionsScreenProps> = ({
  promotions = MOCK_PROMOTIONS,
  onPromotionPress,
  onStatusChange,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const filteredPromotions = useMemo(() => {
    if (activeFilter === 'all') return promotions;
    return promotions.filter((p) => p.status === activeFilter);
  }, [promotions, activeFilter]);

  const renderFilterBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterBar}
      contentContainerStyle={styles.filterContent}
    >
      {FILTER_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.filterChip, activeFilter === opt.key && styles.filterChipActive]}
          onPress={() => setActiveFilter(opt.key)}
        >
          <Text
            style={[styles.filterChipText, activeFilter === opt.key && styles.filterChipTextActive]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPromotionCard = ({ item }: { item: Promotion }) => {
    const progress = getBudgetProgress(item.spent, item.budget);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPromotionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.metaLabel}>{getTypeLabel(item.type)}</Text>
          <Text style={styles.metaDivider}>|</Text>
          <Text style={styles.metaText}>
            {item.startDate} ~ {item.endDate}
          </Text>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.usageCount}</Text>
            <Text style={styles.statLabel}>使用次数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(item.spent)}</Text>
            <Text style={styles.statLabel}>已消耗</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(item.budget)}</Text>
            <Text style={styles.statLabel}>总预算</Text>
          </View>
        </View>

        {/* 预算进度条 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderFilterBar()}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.listContent}
      >
        {filteredPromotions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无促销活动</Text>
          </View>
        ) : (
          filteredPromotions.map((item) => (
            <React.Fragment key={item.id}>
              {renderPromotionCard({ item })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// ---- 样式 ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollArea: {
    flex: 1,
  },
  filterBar: {
    maxHeight: 52,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#1890ff',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#1890ff',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: '#1890ff',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metaDivider: {
    fontSize: 12,
    color: '#ddd',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#52c41a',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    width: 32,
    textAlign: 'right',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default PromotionsScreen;
