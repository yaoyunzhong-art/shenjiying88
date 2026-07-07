/**
 * NotificationsScreen.tsx - Phase-21 T53
 * 通知列表页 - 展示系统通知、告警、营销消息
 *
 * 功能:
 * - FlatList 展示通知列表
 * - 不同类型通知不同图标/颜色
 * - 未读标记
 * - 空状态处理
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'system' | 'alert' | 'marketing' | 'order';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface NotificationsScreenProps {
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  Notification['type'],
  { label: string; color: string; bg: string }
> = {
  system: { label: '系统', color: '#1890ff', bg: '#e6f7ff' },
  alert: { label: '告警', color: '#ff4d4f', bg: '#fff2f0' },
  marketing: { label: '营销', color: '#52c41a', bg: '#f6ffed' },
  order: { label: '订单', color: '#faad14', bg: '#fffbe6' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── NotificationCard component ──────────────────────────────────────────────

const NotificationCard: React.FC<{
  item: Notification;
  onPress?: () => void;
}> = ({ item, onPress }) => {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[styles.card, item.read && styles.cardRead]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>🔔</Text>
    <Text style={styles.emptyTitle}>暂无通知</Text>
    <Text style={styles.emptySubtitle}>当有新的系统通知或告警时，将显示在此处</Text>
  </View>
);

// ── Main component ──────────────────────────────────────────────────────────

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications = MOCK_NOTIFICATIONS,
  onMarkRead,
  onRefresh,
  refreshing = false,
}) => {
  const sorted = useMemo(
    () => [...notifications].sort((a, b) => {
      // 未读优先，再按时间倒序
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [notifications],
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
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={onMarkRead ? () => onMarkRead(item.id) : undefined}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRead: {
    opacity: 0.65,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1890ff',
    marginLeft: 6,
  },
  body: {
    fontSize: 13,
    color: '#8c8c8c',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    color: '#bfbfbf',
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
