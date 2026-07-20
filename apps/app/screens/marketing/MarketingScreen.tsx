import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const categories = ['优惠券', '盲盒', '赛事', '团建'] as const;
type Category = typeof categories[number];

const mockActivities = {
  '优惠券': [
    { id: '1', title: '新人100元礼包', status: 'active', claimed: 1256, used: 856 },
    { id: '2', title: '端午满减券', status: 'active', claimed: 2340, used: 1200 },
    { id: '3', title: '会员日8折券', status: 'upcoming', claimed: 0, used: 0 },
  ],
  '盲盒': [
    { id: '4', title: '618限定盲盒', status: 'active', sold: 456, remaining: 44 },
    { id: '5', title: '新品体验盲盒', status: 'active', sold: 234, remaining: 166 },
  ],
  '赛事': [
    { id: '6', title: '周冠军赛', status: 'active', participants: 128, checkIn: 98 },
    { id: '7', title: '月度大师赛', status: 'upcoming', participants: 0, checkIn: 0 },
  ],
  '团建': [
    { id: '8', title: '企业团建定制', status: 'active', booked: 12, completed: 8 },
  ],
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '进行中', color: '#10B981', bg: '#ECFDF5' },
  upcoming: { label: '即将开始', color: '#3B82F6', bg: '#EFF6FF' },
  ended: { label: '已结束', color: '#64748B', bg: '#F1F5F9' },
};

export function MarketingScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('优惠券');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setError(null)}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>营销活动</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ 创建活动</Text>
        </TouchableOpacity>
      </View>

      {/* 分类导航 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryNav}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat === '优惠券' ? '🎫' : cat === '盲盒' ? '🎁' : cat === '赛事' ? '🏆' : '🎮'} {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 快捷操作 */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#10B981' }]}>
          <Text style={styles.quickActionEmoji}>🎫</Text>
          <Text style={styles.quickActionText}>核销优惠券</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.quickActionEmoji}>🎁</Text>
          <Text style={styles.quickActionText}>核销盲盒</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.quickActionEmoji}>📋</Text>
          <Text style={styles.quickActionText}>赛事签到</Text>
        </TouchableOpacity>
      </View>

      {/* 活动列表 */}
      <Text style={styles.sectionTitle}>{activeCategory}活动</Text>
      {(mockActivities[activeCategory] || []).map(activity => {
        const config = statusConfig[activity.status] ?? statusConfig.ended;
        if (!config) return null;
        return (
          <TouchableOpacity key={activity.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <View style={[styles.activityStatus, { backgroundColor: config.bg }]}>
                <Text style={[styles.activityStatusText, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
            <View style={styles.activityStats}>
              {'claimed' in activity && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activity.claimed.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>已领取</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{activity.used.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>已使用</Text>
                  </View>
                </>
              )}
              {'sold' in activity && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activity.sold}</Text>
                    <Text style={styles.statLabel}>已售出</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>{activity.remaining}</Text>
                    <Text style={styles.statLabel}>剩余</Text>
                  </View>
                </>
              )}
              {'participants' in activity && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activity.participants}</Text>
                    <Text style={styles.statLabel}>报名人数</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{activity.checkIn}</Text>
                    <Text style={styles.statLabel}>已签到</Text>
                  </View>
                </>
              )}
              {'booked' in activity && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activity.booked}</Text>
                    <Text style={styles.statLabel}>已预约</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{activity.completed}</Text>
                    <Text style={styles.statLabel}>已完成</Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1E40AF', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  createBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: '#1E40AF', fontSize: 14, fontWeight: '600' },
  categoryNav: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff' },
  categoryTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 12 },
  categoryTabActive: { backgroundColor: '#1E40AF' },
  categoryText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickAction: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  quickActionEmoji: { fontSize: 24 },
  quickActionText: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  activityCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  activityStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activityStatusText: { fontSize: 12, fontWeight: '600' },
  activityStats: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { fontSize: 15, color: '#64748B', marginTop: 12 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 17, fontWeight: '600', color: '#333333', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#1E40AF', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
