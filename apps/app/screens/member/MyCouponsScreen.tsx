import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const mockCoupons = {
  available: [
    { id: '1', title: '新人100元礼包', desc: '满500可用', expire: '2026-07-31', discount: 100 },
    { id: '2', title: '端午满减券', desc: '满200减50', expire: '2026-07-10', discount: 50 },
    { id: '3', title: '会员日8折券', desc: '无门槛', expire: '2026-07-15', discount: 0.2 },
  ],
  used: [
    { id: '4', title: '开业庆典券', desc: '满300减80', expire: '2026-06-01', discount: 80 },
  ],
  expired: [
    { id: '5', title: '五一特惠券', desc: '满100减30', expire: '2026-05-05', discount: 30 },
  ],
};

export function MyCouponsScreen() {
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'expired'>('available');
  const coupons = mockCoupons[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.header}>
        <Text style={styles.title}>我的优惠券</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['available', 'used', 'expired'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'available' ? '可用' : tab === 'used' ? '已使用' : '已过期'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {coupons.map(coupon => (
          <View key={coupon.id} style={[styles.couponCard, activeTab !== 'available' && styles.couponCardDisabled]}>
            <View style={styles.couponLeft}>
              <Text style={styles.discountAmount}>
                {typeof coupon.discount === 'number' && coupon.discount < 1
                  ? `${Math.round(coupon.discount * 10)}折`
                  : `¥${coupon.discount}`}
              </Text>
              <Text style={styles.couponDesc}>{coupon.desc}</Text>
            </View>
            <View style={styles.couponRight}>
              <Text style={styles.couponTitle}>{coupon.title}</Text>
              <Text style={styles.couponExpire}>有效期至 {coupon.expire}</Text>
              {activeTab === 'available' && (
                <TouchableOpacity style={styles.useBtn}>
                  <Text style={styles.useBtnText}>立即使用</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#8B5CF6', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  tabActive: { backgroundColor: '#8B5CF6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  couponCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  couponCardDisabled: { opacity: 0.6 },
  couponLeft: { width: 100, backgroundColor: '#8B5CF6', padding: 16, alignItems: 'center', justifyContent: 'center' },
  discountAmount: { fontSize: 22, fontWeight: '700', color: '#fff' },
  couponDesc: { fontSize: 12, color: '#DDD6FE', marginTop: 4 },
  couponRight: { flex: 1, padding: 16, justifyContent: 'center' },
  couponTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  couponExpire: { fontSize: 12, color: '#64748B', marginTop: 4 },
  useBtn: { backgroundColor: '#8B5CF6', paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 16 },
  useBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
