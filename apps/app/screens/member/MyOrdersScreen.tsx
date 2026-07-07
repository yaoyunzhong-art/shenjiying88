import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const tabs = ['全部', '待支付', '进行中', '已完成', '已退款'] as const;
type Tab = typeof tabs[number];

const mockOrders = [
  { id: '1', store: '神机营体育·城西店', time: '2026-07-04 14:30', amount: 580, status: 'completed', items: '羽毛球私教课 × 1' },
  { id: '2', store: '神机营体育·城西店', time: '2026-07-03 10:20', amount: 128, status: 'completed', items: '运动饮料 × 2' },
  { id: '3', store: '神机营体育·城西店', time: '2026-07-04 09:00', amount: 1999, status: 'pending', items: '年度会员卡 × 1' },
  { id: '4', store: '神机营体育·旗舰店', time: '2026-07-01 16:45', amount: 320, status: 'refunded', items: '团建套餐 × 1' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: '已完成', color: '#10B981' },
  pending: { label: '待支付', color: '#F59E0B' },
  processing: { label: '进行中', color: '#3B82F6' },
  refunded: { label: '已退款', color: '#64748B' },
};

export function MyOrdersScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('全部');

  const filtered = activeTab === '全部'
    ? mockOrders
    : mockOrders.filter(o => {
        if (activeTab === '待支付') return o.status === 'pending';
        if (activeTab === '已完成') return o.status === 'completed';
        if (activeTab === '已退款') return o.status === 'refunded';
        return true;
      });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>我的订单</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Order List */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {filtered.map(order => {
          const config = statusConfig[order.status];
          if (!config) return null;
          return (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.storeName}>{order.store}</Text>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>
              <Text style={styles.items}>{order.items}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.time}>{order.time}</Text>
                <Text style={styles.amount}>¥{order.amount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#8B5CF6', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  tabs: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: '#8B5CF6' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  items: { fontSize: 14, color: '#64748B', marginTop: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  time: { fontSize: 13, color: '#94A3B8' },
  amount: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
});
