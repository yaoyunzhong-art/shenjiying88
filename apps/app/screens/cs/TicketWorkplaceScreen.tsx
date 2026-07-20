import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';

interface Ticket {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customerName: string;
  storeName: string;
  createdAt: string;
  updatedAt: string;
  unread: number;
}

const mockTickets: Ticket[] = [
  {
    id: 'TK2024001',
    title: '会员积分异常扣减',
    status: 'pending',
    priority: 'high',
    category: '会员服务',
    customerName: '张明',
    storeName: '城西银泰店',
    createdAt: '2024-01-15 09:30',
    updatedAt: '2024-01-15 09:30',
    unread: 2,
  },
  {
    id: 'TK2024002',
    title: 'POS机打印故障',
    status: 'processing',
    priority: 'urgent',
    category: '设备问题',
    customerName: '收银员-李华',
    storeName: '西湖银泰店',
    createdAt: '2024-01-15 08:45',
    updatedAt: '2024-01-15 10:15',
    unread: 0,
  },
  {
    id: 'TK2024003',
    title: '优惠券无法核销',
    status: 'pending',
    priority: 'medium',
    category: '营销问题',
    customerName: '王芳',
    storeName: '城西银泰店',
    createdAt: '2024-01-15 10:20',
    updatedAt: '2024-01-15 10:20',
    unread: 1,
  },
  {
    id: 'TK2024004',
    title: '会员退款申请',
    status: 'resolved',
    priority: 'medium',
    category: '退款处理',
    customerName: '赵雷',
    storeName: '武林银泰店',
    createdAt: '2024-01-14 16:30',
    updatedAt: '2024-01-15 09:00',
    unread: 0,
  },
  {
    id: 'TK2024005',
    title: '系统登录异常',
    status: 'closed',
    priority: 'low',
    category: '系统问题',
    customerName: '收银员-周婷',
    storeName: '城西银泰店',
    createdAt: '2024-01-13 14:00',
    updatedAt: '2024-01-14 10:00',
    unread: 0,
  },
];

const statusMap = {
  pending: { label: '待处理', color: '#EF4444', bg: '#FEE2E2' },
  processing: { label: '处理中', color: '#F59E0B', bg: '#FEF3C7' },
  resolved: { label: '已解决', color: '#10B981', bg: '#D1FAE5' },
  closed: { label: '已关闭', color: '#6B7280', bg: '#F3F4F6' },
};

const priorityMap = {
  low: { label: '低', color: '#6B7280' },
  medium: { label: '中', color: '#F59E0B' },
  high: { label: '高', color: '#EF4444' },
  urgent: { label: '紧急', color: '#DC2626' },
};

export function TicketWorkplaceScreen() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing'>('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === 'pending') return ticket.status === 'pending';
    if (activeTab === 'processing') return ticket.status === 'processing';
    return true;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    processing: tickets.filter((t) => t.status === 'processing').length,
    urgent: tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed').length,
  };

  const handleTicketPress = (ticket: Ticket) => {
    console.log('Navigate to ticket detail:', ticket.id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>工单加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>工单工作台</Text>
        <Text style={styles.headerSubtitle}>客服管理系统</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardUrgent]}>
          <Text style={styles.statNumber}>{stats.urgent}</Text>
          <Text style={styles.statLabel}>紧急</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPending]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>待处理</Text>
        </View>
        <View style={[styles.statCard, styles.statCardProcessing]}>
          <Text style={styles.statNumber}>{stats.processing}</Text>
          <Text style={styles.statLabel}>处理中</Text>
        </View>
        <View style={[styles.statCard, styles.statCardTotal]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>总计</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索工单号 / 标题 / 客户名"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: '全部工单' },
          { key: 'pending', label: '待处理' },
          { key: 'processing', label: '处理中' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List */}
      <ScrollView style={styles.ticketList} showsVerticalScrollIndicator={false}>
        {filteredTickets.map((ticket) => {
          const status = statusMap[ticket.status];
          const priority = priorityMap[ticket.priority];
          return (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => handleTicketPress(ticket)}
            >
              {/* Header Row */}
              <View style={styles.ticketHeader}>
                <View style={styles.ticketIdRow}>
                  <Text style={styles.ticketId}>{ticket.id}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
                    <Text style={[styles.priorityText, { color: priority.color }]}>
                      {priority.label}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.ticketTitle}>{ticket.title}</Text>

              {/* Category */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{ticket.category}</Text>
              </View>

              {/* Footer Row */}
              <View style={styles.ticketFooter}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketInfoText}>
                    <Text style={styles.ticketInfoLabel}>客户: </Text>
                    {ticket.customerName}
                  </Text>
                  <Text style={styles.ticketInfoText}>
                    <Text style={styles.ticketInfoLabel}>门店: </Text>
                    {ticket.storeName}
                  </Text>
                </View>
                <View style={styles.ticketTime}>
                  <Text style={styles.timeText}>{ticket.updatedAt}</Text>
                  {ticket.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{ticket.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredTickets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>暂无工单</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>新建工单</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>数据报表</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>设置</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#7C3AED',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C4B5FD',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardUrgent: {
    backgroundColor: '#FEE2E2',
  },
  statCardPending: {
    backgroundColor: '#FEF3C7',
  },
  statCardProcessing: {
    backgroundColor: '#DBEAFE',
  },
  statCardTotal: {
    backgroundColor: '#E0E7FF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ticketList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ticketInfo: {
    gap: 4,
  },
  ticketInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
  ticketInfoLabel: {
    color: '#94A3B8',
  },
  ticketTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#64748B',
  },
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
  errorText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
