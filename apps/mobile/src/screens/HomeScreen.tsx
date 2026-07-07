/**
 * HomeScreen.tsx - Phase-21 T52
 * 首页 - Dashboard 入口
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>欢迎, {user?.name ?? '用户'}</Text>
        <Text style={styles.tenant}>{user?.tenantId ?? ''}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="今日订单" value="--" subtitle="加载中..." />
        <StatCard title="活跃会员" value="--" subtitle="加载中..." />
        <StatCard title="待办事项" value="--" subtitle="加载中..." />
        <StatCard title="营收 (今日)" value="--" subtitle="加载中..." />
      </View>

      <Text style={styles.section}>快捷操作</Text>
      <QuickAction label="新建订单" />
      <QuickAction label="会员充值" />
      <QuickAction label="营销活动" />
    </ScrollView>
  );
};

const StatCard: React.FC<{ title: string; value: string; subtitle: string }> = ({
  title,
  value,
  subtitle,
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

const QuickAction: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.quickAction}>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcome: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  tenant: { fontSize: 14, color: '#666', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statTitle: { fontSize: 12, color: '#666' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  statSubtitle: { fontSize: 10, color: '#999', marginTop: 2 },
  section: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickAction: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quickActionLabel: { fontSize: 16, color: '#1a1a1a' },
});