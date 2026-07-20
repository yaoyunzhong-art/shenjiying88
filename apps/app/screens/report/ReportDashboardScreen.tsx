import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

const { width } = Dimensions.get('window');

const periods = ['今日', '本周', '本月'] as const;
type Period = typeof periods[number];

export function ReportDashboardScreen() {
  const [period, setPeriod] = useState<Period>('今日');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [period]);
  
  const revenueData = {
    today: 12580.5,
    week: 89500,
    month: 358000,
  };
  
  const orderByChannel = [
    { channel: '微信支付', count: 45, amount: 6820, color: '#07C160' },
    { channel: '支付宝', count: 28, amount: 4200, color: '#1677FF' },
    { channel: '会员卡', count: 12, amount: 1560.5, color: '#8B5CF6' },
    { channel: '现金', count: 5, amount: 380, color: '#F59E0B' },
  ];
  
  const topStaff = [
    { name: '李导购', orders: 23, revenue: 5680, rank: 1 },
    { name: '王收银', orders: 45, revenue: 8920, rank: 2 },
    { name: '张店长', orders: 18, revenue: 3200, rank: 3 },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>报表加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.title}>数据报表</Text>
        <View style={styles.periodTabs}>
          {periods.map(p => (
            <TouchableOpacity 
              key={p} 
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 营收概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>营收概览</Text>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueMain}>¥{revenueData[period.toLowerCase() as keyof typeof revenueData].toLocaleString()}</Text>
          <Text style={styles.revenueLabel}>
            {period === '今日' ? '较昨日' : period === '本周' ? '较上周' : '较上月'}+12.5%
          </Text>
        </View>
        <View style={styles.revenueGrid}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueItemValue}>{period === '今日' ? 86 : period === '本周' ? 580 : 2400}</Text>
            <Text style={styles.revenueItemLabel}>订单数</Text>
          </View>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueItemValue}>¥{period === '今日' ? '146.2' : period === '本周' ? '154.3' : '149.1'}</Text>
            <Text style={styles.revenueItemLabel}>客单价</Text>
          </View>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueItemValue}>{period === '今日' ? '42' : period === '本周' ? '285' : '1180'}</Text>
            <Text style={styles.revenueItemLabel}>新会员</Text>
          </View>
        </View>
      </View>

      {/* 支付方式分布 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支付方式分布</Text>
        {orderByChannel.map(item => (
          <View key={item.channel} style={styles.channelRow}>
            <View style={[styles.channelDot, { backgroundColor: item.color }]} />
            <Text style={styles.channelName}>{item.channel}</Text>
            <Text style={styles.channelCount}>{item.count}笔</Text>
            <Text style={styles.channelAmount}>¥{item.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* 员工业绩 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>员工业绩排行</Text>
        {topStaff.map((staff, idx) => (
          <View key={staff.name} style={styles.staffRow}>
            <Text style={[styles.staffRank, idx === 0 && styles.goldRank]}>{staff.rank}</Text>
            <Text style={styles.staffName}>{staff.name}</Text>
            <Text style={styles.staffOrders}>{staff.orders}单</Text>
            <Text style={styles.staffRevenue}>¥{staff.revenue.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* 销售趋势 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>销售趋势</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>📈 销售趋势图</Text>
          <Text style={styles.chartSubtext}>近{period === '今日' ? '7天' : period === '本周' ? '4周' : '12月'}销售走势</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1E40AF', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  periodTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 4 },
  periodTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  periodTabActive: { backgroundColor: '#fff' },
  periodText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  periodTextActive: { color: '#1E40AF', fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  revenueCard: { backgroundColor: '#1E40AF', borderRadius: 16, padding: 20, alignItems: 'center' },
  revenueMain: { fontSize: 36, fontWeight: '700', color: '#fff' },
  revenueLabel: { fontSize: 14, color: '#93C5FD', marginTop: 8 },
  revenueGrid: { flexDirection: 'row', marginTop: 16 },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueItemValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  revenueItemLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  channelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  channelName: { flex: 1, fontSize: 15, color: '#1E293B' },
  channelCount: { fontSize: 14, color: '#64748B', marginRight: 16 },
  channelAmount: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  staffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  staffRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', textAlign: 'center', lineHeight: 24, fontSize: 14, fontWeight: '600', color: '#64748B', marginRight: 12 },
  goldRank: { backgroundColor: '#F59E0B', color: '#fff' },
  staffName: { flex: 1, fontSize: 15, color: '#1E293B' },
  staffOrders: { fontSize: 14, color: '#64748B', marginRight: 16 },
  staffRevenue: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  chartPlaceholder: { height: 160, backgroundColor: '#F8FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  chartText: { fontSize: 20 },
  chartSubtext: { fontSize: 13, color: '#64748B', marginTop: 8 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
  },
});
