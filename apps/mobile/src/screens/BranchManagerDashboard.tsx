/**
 * BranchManagerDashboard.tsx - D类 店长工作台
 * 店长角色专属仪表盘：门店概览、团队绩效、快速操作
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';

// ── Types ──
interface DailyMetrics {
  revenue: number;
  orderCount: number;
  memberCheckins: number;
  newMembers: number;
  avgRating: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  role: '前台' | '导购' | '技师';
  todayOrders: number;
  todayRevenue: number;
  satisfaction: number;
}

interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
}

// ── Mock Data ──
const MOCK_METRICS: DailyMetrics = {
  revenue: 28560,
  orderCount: 47,
  memberCheckins: 23,
  newMembers: 5,
  avgRating: 4.7,
};

const MOCK_STAFF: StaffPerformance[] = [
  { id: 's1', name: '张丽', role: '前台', todayOrders: 18, todayRevenue: 9600, satisfaction: 4.8 },
  { id: 's2', name: '王强', role: '导购', todayOrders: 14, todayRevenue: 12000, satisfaction: 4.6 },
  { id: 's3', name: '李敏', role: '技师', todayOrders: 9, todayRevenue: 5400, satisfaction: 4.9 },
  { id: 's4', name: '陈浩', role: '导购', todayOrders: 6, todayRevenue: 1560, satisfaction: 4.3 },
];

const MOCK_TASKS: TaskItem[] = [
  { id: 't1', title: '每日营收对账', priority: 'high', deadline: '今日 18:00' },
  { id: 't2', title: '库存盘点-美容区', priority: 'medium', deadline: '今日 20:00' },
  { id: 't3', title: '新员工培训签到', priority: 'low', deadline: '明日 10:00' },
];

// ── Helpers ──
const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString()}`;
};

const priorityColor = (p: TaskItem['priority']): string => {
  switch (p) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#6b7280';
  }
};

const roleColor = (role: StaffPerformance['role']): string => {
  switch (role) {
    case '前台': return '#3b82f6';
    case '导购': return '#10b981';
    case '技师': return '#8b5cf6';
  }
};

// ── Sub-components ──

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, color }) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricValueRow}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {unit && <Text style={styles.metricUnit}>{unit}</Text>}
    </View>
  </View>
);

const StaffRow: React.FC<{ staff: StaffPerformance }> = ({ staff }) => (
  <View style={styles.staffRow}>
    <View style={styles.staffInfo}>
      <Text style={styles.staffName}>{staff.name}</Text>
      <View style={[styles.roleBadge, { backgroundColor: roleColor(staff.role) + '20' }]}>
        <Text style={[styles.roleText, { color: roleColor(staff.role) }]}>{staff.role}</Text>
      </View>
    </View>
    <View style={styles.staffStats}>
      <Text style={styles.staffStat}>单{staff.todayOrders}</Text>
      <Text style={styles.staffStat}>{formatCurrency(staff.todayRevenue)}</Text>
      <Text style={styles.staffStat}>⭐{staff.satisfaction}</Text>
    </View>
  </View>
);

const TaskItem: React.FC<{ task: TaskItem }> = ({ task }) => (
  <View style={styles.taskRow}>
    <View style={[styles.priorityDot, { backgroundColor: priorityColor(task.priority) }]} />
    <View style={styles.taskContent}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDeadline}>截止: {task.deadline}</Text>
    </View>
  </View>
);

// ── Main Component ──

export const BranchManagerDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>店长工作台</Text>
        <Text style={styles.headerSub}>今日 · 门店整体概览</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <MetricCard label="今日营收" value={formatCurrency(MOCK_METRICS.revenue)} color="#059669" />
          <MetricCard label="订单数" value={String(MOCK_METRICS.orderCount)} unit="单" color="#3b82f6" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="会员到店" value={String(MOCK_METRICS.memberCheckins)} unit="人" color="#8b5cf6" />
          <MetricCard label="新增会员" value={String(MOCK_METRICS.newMembers)} unit="人" color="#f59e0b" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="满意度" value={String(MOCK_METRICS.avgRating)} color="#ec4899" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📋 开单</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>👤 会员查询</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📊 营业报表</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📦 库存管理</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Staff Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>团队绩效 (今日)</Text>
        {MOCK_STAFF.map((staff) => (
          <StaffRow key={staff.id} staff={staff} />
        ))}
      </View>

      {/* Pending Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>待办事项</Text>
        {MOCK_TASKS.length === 0 ? (
          <Text style={styles.emptyText}>暂无待办任务</Text>
        ) : (
          MOCK_TASKS.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </View>
    </ScrollView>
  );
};

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#a7f3d0',
    marginTop: 4,
  },
  metricsGrid: {
    padding: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  actionBtnText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  roleBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  staffStats: {
    flexDirection: 'row',
    gap: 10,
  },
  staffStat: {
    fontSize: 13,
    color: '#374151',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
