import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { buildDomainGovernanceDisplayModel } from '@m5/types';
import { DomainGovernanceCard } from '../../components/DomainGovernanceCard';
import { useBootstrap } from '../../context/AppContext';

// 模拟数据
const mockStats = {
  todayRevenue: 12580.5,
  orderCount: 86,
  memberCount: 42,
  pendingTasks: 5,
};

const mockTasks = [
  { id: '1', title: '待处理退款 (3)', priority: 'high' },
  { id: '2', title: '库存预警 (2)', priority: 'medium' },
  { id: '3', title: '员工排班待确认', priority: 'low' },
];

const mockAnnouncements = [
  { id: '1', title: '端午活动即将开始', time: '2小时前' },
  { id: '2', title: '系统升级通知', time: '昨天' },
];

// 角色配置
type Role = 'shop_manager' | 'cashier' | 'sales';
const roleConfig: Record<Role, { title: string; greeting: string; showStats: string[] }> = {
  shop_manager: {
    title: '张店长',
    greeting: '下午好，张店长',
    showStats: ['revenue', 'orders', 'members', 'tasks'],
  },
  cashier: {
    title: '收银员',
    greeting: '下午好，收银员',
    showStats: ['revenue', 'orders', 'members', 'tasks'],
  },
  sales: {
    title: '导购',
    greeting: '下午好，导购',
    showStats: ['orders', 'members', 'tasks'],
  },
};

// 快捷操作配置
const quickActions: Record<Role, { id: string; title: string; icon: string; route: string; color: string }[]> = {
  shop_manager: [
    { id: '1', title: '收银', icon: '💰', route: 'PaymentTab', color: '#10B981' },
    { id: '2', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '3', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '4', title: '库存', icon: '📦', route: 'InventoryTab', color: '#F59E0B' },
    { id: '5', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
    { id: '6', title: '报表', icon: '📊', route: 'Report', color: '#EF4444' },
  ],
  cashier: [
    { id: '1', title: '收银', icon: '💰', route: 'PaymentTab', color: '#10B981' },
    { id: '2', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '3', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '4', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
  ],
  sales: [
    { id: '1', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '2', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '3', title: '库存', icon: '📦', route: 'InventoryTab', color: '#F59E0B' },
    { id: '4', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
  ],
};

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const bootstrap = useBootstrap();
  
  // 模拟当前角色，实际应从全局状态或API获取
  const currentRole: Role = 'shop_manager';
  const role = roleConfig[currentRole];
  const actions = quickActions[currentRole];
  const domainGovernanceDisplayModel = buildDomainGovernanceDisplayModel(
    bootstrap.domainSource,
    bootstrap.domainGovernance,
    bootstrap.domainGovernanceWorkspaceHref,
  );

  const getStatConfig = (type: string) => {
    const configs: Record<string, { value: string | number; label: string; bgColor: string }> = {
      revenue: { value: `¥${mockStats.todayRevenue.toLocaleString()}`, label: '今日营收', bgColor: '#10B981' },
      orders: { value: mockStats.orderCount, label: '订单数', bgColor: '#3B82F6' },
      members: { value: mockStats.memberCount, label: '新会员', bgColor: '#8B5CF6' },
      tasks: { value: mockStats.pendingTasks, label: '待办任务', bgColor: '#F59E0B' },
    };
    return configs[type];
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{role.greeting}</Text>
          <Text style={styles.storeName}>神机营体育·城西店</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>{role.title.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* 实时数据卡片 */}
      <View style={styles.statsRow}>
        {role.showStats.map((statType) => {
          const stat = getStatConfig(statType);
          if (!stat) return null;
          return (
            <View key={statType} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>

      <DomainGovernanceCard model={domainGovernanceDisplayModel} />

      {/* 快捷操作 */}
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.quickActions}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <Text style={styles.actionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 待办任务 */}
      <Text style={styles.sectionTitle}>
        待办任务 {mockStats.pendingTasks > 0 && <Text style={styles.badge}>{mockStats.pendingTasks}</Text>}
      </Text>
      {mockTasks.map((task) => (
        <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => console.log('Task pressed:', task.id)}>
          <View
            style={[
              styles.taskDot,
              {
                backgroundColor:
                  task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981',
              },
            ]}
          />
          <Text style={styles.taskText}>{task.title}</Text>
          <Text style={styles.taskArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* 公告 */}
      <Text style={styles.sectionTitle}>门店公告</Text>
      {mockAnnouncements.map((item) => (
        <View key={item.id} style={styles.announcement}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementTime}>{item.time}</Text>
        </View>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1E40AF',
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  storeName: { fontSize: 14, color: '#93C5FD', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#1E40AF' },
  statsRow: { flexDirection: 'row', padding: 16, marginTop: -20, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#EF4444',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  actionItem: { width: '28%', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 24 },
  actionText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  taskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  taskText: { flex: 1, fontSize: 15, color: '#1E293B' },
  taskArrow: { fontSize: 20, color: '#94A3B8' },
  announcement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  announcementTitle: { fontSize: 15, color: '#1E293B', flex: 1 },
  announcementTime: { fontSize: 13, color: '#94A3B8' },
  bottomPadding: { height: 100 },
});
