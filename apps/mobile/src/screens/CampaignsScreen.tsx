/**
 * CampaignsScreen.tsx - Phase-21 T53
 * 营销活动列表页 - 展示当前可参与/查看的营销活动
 *
 * 角色视角: 门店导购/店长
 * 功能:
 * - FlatList 展示活动卡片
 * - 不同活动状态（进行中/即将开始/已结束）不同样式
 * - 快速操作: 查看详情 / 参与活动
 * - 空状态处理
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'upcoming' | 'ended';
  type: 'promotion' | 'points' | 'coupon' | 'event';
  startDate: string;
  endDate: string;
  enrolled?: boolean;
  metrics?: {
    participants: number;
    redeemed: number;
  };
}

// ── Props ───────────────────────────────────────────────────────────────────

interface CampaignsScreenProps {
  campaigns?: Campaign[];
  onEnroll?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Campaign['status'],
  { label: string; color: string; bg: string }
> = {
  active: { label: '进行中', color: '#52c41a', bg: '#f6ffed' },
  upcoming: { label: '即将开始', color: '#1890ff', bg: '#e6f7ff' },
  ended: { label: '已结束', color: '#8c8c8c', bg: '#fafafa' },
};

const TYPE_LABEL: Record<Campaign['type'], string> = {
  promotion: '促销',
  points: '积分',
  coupon: '优惠券',
  event: '活动',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── CampaignCard component ──────────────────────────────────────────────────

const CampaignCard: React.FC<{
  item: Campaign;
  onEnroll?: () => void;
  onViewDetail?: () => void;
}> = ({ item, onEnroll, onViewDetail }) => {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.ended;
  const remaining = item.status === 'active' ? daysRemaining(item.endDate) : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewDetail}
      activeOpacity={0.7}
    >
      {/* 顶栏: 类型 + 状态 */}
      <View style={styles.cardHeader}>
        <Text style={styles.typeLabel}>{TYPE_LABEL[item.type] ?? '活动'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* 标题 */}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>

      {/* 描述 */}
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      {/* 日期 */}
      <Text style={styles.dateText}>
        {formatDate(item.startDate)} ~ {formatDate(item.endDate)}
        {remaining > 0 && ` · 剩余${remaining}天`}
      </Text>

      {/* 底部: 指标 + 操作 */}
      <View style={styles.cardFooter}>
        <View style={styles.metrics}>
          {item.metrics && (
            <>
              <Text style={styles.metricText}>
                参与 {item.metrics.participants}人
              </Text>
              <Text style={styles.metricDivider}>|</Text>
              <Text style={styles.metricText}>
                核销 {item.metrics.redeemed}次
              </Text>
            </>
          )}
        </View>

        {item.status === 'active' && !item.enrolled && (
          <TouchableOpacity
            style={styles.enrollBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onEnroll?.();
            }}
          >
            <Text style={styles.enrollBtnText}>参与活动</Text>
          </TouchableOpacity>
        )}
        {item.enrolled && (
          <View style={styles.enrolledBadge}>
            <Text style={styles.enrolledText}>已参与</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>📢</Text>
    <Text style={styles.emptyTitle}>暂无营销活动</Text>
    <Text style={styles.emptySubtitle}>
      当有新的促销、积分或优惠券活动时，将显示在此处
    </Text>
  </View>
);

// ── Main component ──────────────────────────────────────────────────────────

export const CampaignsScreen: React.FC<CampaignsScreenProps> = ({
  campaigns = MOCK_CAMPAIGNS,
  onEnroll,
  onViewDetail,
  onRefresh,
  refreshing = false,
}) => {
  const sorted = useMemo(
    () =>
      [...campaigns].sort((a, b) => {
        // 状态优先级: active > upcoming > ended
        const order = { active: 0, upcoming: 1, ended: 2 };
        const diff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
        if (diff !== 0) return diff;
        // 同状态按开始时间倒序
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }),
    [campaigns],
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={sorted}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CampaignCard
            item={item}
            onEnroll={onEnroll ? () => onEnroll(item.id) : undefined}
            onViewDetail={onViewDetail ? () => onViewDetail(item.id) : undefined}
          />
        )}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#8c8c8c',
    lineHeight: 19,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#bfbfbf',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  metricDivider: {
    fontSize: 12,
    color: '#e8e8e8',
    marginHorizontal: 6,
  },
  enrollBtn: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  enrollBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  enrolledBadge: {
    backgroundColor: '#f6ffed',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  enrolledText: {
    color: '#52c41a',
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#595959',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8c8c8c',
    textAlign: 'center',
    lineHeight: 20,
  },
});
