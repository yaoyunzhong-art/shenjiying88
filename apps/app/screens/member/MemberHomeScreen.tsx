import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export function MemberHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>下午好，李会员</Text>
          <Text style={styles.level}>🌟 金卡会员</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>李</Text>
        </TouchableOpacity>
      </View>

      {/* 会员码 */}
      <View style={styles.qrSection}>
        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrEmoji}>📱</Text>
            <Text style={styles.qrText}>会员码</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>李会员</Text>
            <Text style={styles.memberId}>ID: 888888</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>12,580 积分</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 会员权益 */}
      <View style={styles.benefits}>
        <Text style={styles.sectionTitle}>会员权益</Text>
        <View style={styles.benefitsGrid}>
          {[
            { icon: '🎁', label: '生日礼遇', desc: '本月可用' },
            { icon: '🏆', label: '专属折扣', desc: '金卡8.8折' },
            { icon: '🚗', label: '免费停车', desc: '每月2小时' },
            { icon: '☕', label: '积分兑换', desc: '100+商品' },
          ].map((item, idx) => (
            <View key={idx} style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>{item.icon}</Text>
              <Text style={styles.benefitLabel}>{item.label}</Text>
              <Text style={styles.benefitDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 快捷操作 */}
      <Text style={styles.sectionTitle}>我的服务</Text>
      <View style={styles.quickActions}>
        {[
          { icon: '📋', label: '我的订单', color: '#3B82F6' },
          { icon: '🎫', label: '优惠券', color: '#10B981' },
          { icon: '📍', label: '附近门店', color: '#8B5CF6' },
          { icon: '⭐', label: '我的收藏', color: '#F59E0B' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.quickAction}>
            <View style={[styles.quickIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.quickEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#8B5CF6' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  level: { fontSize: 14, color: '#DDD6FE', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#8B5CF6' },
  qrSection: { padding: 16, marginTop: -20 },
  qrCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  qrPlaceholder: { width: 100, height: 100, backgroundColor: '#F8FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  qrEmoji: { fontSize: 32 },
  qrText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  memberInfo: { flex: 1, marginLeft: 16 },
  memberName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  memberId: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  pointsBadge: { backgroundColor: '#8B5CF6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 8 },
  pointsText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  benefits: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitItem: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  benefitIcon: { fontSize: 28 },
  benefitLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginTop: 8 },
  benefitDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickAction: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
});
