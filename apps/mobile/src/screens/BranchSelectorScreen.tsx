/**
 * BranchSelectorScreen.tsx - 门店选择器
 * 支持搜索、按状态筛选、当前门店高亮、下拉刷新
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useBranchStore, Branch } from '../store/branchStore';

/* ------------------------------------------------------------------ */
/*  Mock 数据:后续对接 /api/branches                                    */
/* ------------------------------------------------------------------ */
const MOCK_BRANCHES: Branch[] = [
  {
    id: 'b001',
    name: '神机营·旗舰店',
    address: '上海市浦东新区陆家嘴环路1000号',
    phone: '021-58880001',
    status: 'active',
    managerName: '张经理',
    todayRevenue: 28650,
    todayOrders: 134,
  },
  {
    id: 'b002',
    name: '神机营·徐汇店',
    address: '上海市徐汇区虹桥路500号',
    phone: '021-64820002',
    status: 'active',
    managerName: '李店长',
    todayRevenue: 19230,
    todayOrders: 98,
  },
  {
    id: 'b003',
    name: '神机营·静安店',
    address: '上海市静安区南京西路1600号',
    phone: '021-62580003',
    status: 'inactive',
    managerName: '王经理',
    todayRevenue: 0,
    todayOrders: 0,
  },
  {
    id: 'b004',
    name: '神机营·杭州店',
    address: '杭州市西湖区教工路88号',
    phone: '0571-88090004',
    status: 'maintenance',
    managerName: '陈店长',
    todayRevenue: 8450,
    todayOrders: 42,
  },
  {
    id: 'b005',
    name: '神机营·南京店',
    address: '南京市鼓楼区汉中路168号',
    phone: '025-84760005',
    status: 'active',
    managerName: '刘经理',
    todayRevenue: 15320,
    todayOrders: 76,
  },
];

/* ------------------------------------------------------------------ */
/*  状态筛选选项                                                       */
/* ------------------------------------------------------------------ */
type StatusFilter = 'all' | 'active' | 'inactive' | 'maintenance';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: '全部',
  active: '营业中',
  inactive: '已歇业',
  maintenance: '维护中',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#9ca3af',
  maintenance: '#f59e0b',
};

/* ------------------------------------------------------------------ */
/*  计价格式化                                                         */
/* ------------------------------------------------------------------ */
const formatCurrency = (n: number): string =>
  `¥ ${n.toLocaleString('zh-CN')}`;

/* ------------------------------------------------------------------ */
/*  组件:门店卡片                                                       */
/* ------------------------------------------------------------------ */
const BranchCard: React.FC<{
  branch: Branch;
  isSelected: boolean;
  onSelect: (b: Branch) => void;
}> = ({ branch, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.card, isSelected && styles.cardSelected]}
    onPress={() => onSelect(branch)}
    activeOpacity={0.7}
  >
    {/* 顶部:名称 + 状态 + 选中标记 */}
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleRow}>
        <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>
          {branch.name}
        </Text>
        {isSelected && <Text style={styles.selectedBadge}>当前</Text>}
      </View>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: STATUS_COLORS[branch.status] + '20' },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: STATUS_COLORS[branch.status] },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            { color: STATUS_COLORS[branch.status] },
          ]}
        >
          {STATUS_LABELS[branch.status]}
        </Text>
      </View>
    </View>

    {/* 地址 */}
    <Text style={styles.address}>{branch.address}</Text>

    {/* 底部数据行 */}
    <View style={styles.cardFooter}>
      {branch.status === 'active' && (
        <>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(branch.todayRevenue)}</Text>
            <Text style={styles.statLabel}>今日营收</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{branch.todayOrders}</Text>
            <Text style={styles.statLabel}>今日订单</Text>
          </View>
          <View style={styles.statDivider} />
        </>
      )}
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{branch.managerName}</Text>
        <Text style={styles.statLabel}>店长</Text>
      </View>
    </View>
  </TouchableOpacity>
);

/* ------------------------------------------------------------------ */
/*  主屏幕                                                             */
/* ------------------------------------------------------------------ */
export const BranchSelectorScreen: React.FC = () => {
  const { currentBranch, setCurrentBranch, setAvailableBranches } =
    useBranchStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  /* 初始化:用 Mock 数据装配到 store (仅首次) */
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setAvailableBranches(MOCK_BRANCHES);
    if (!currentBranch) {
      const defaultBranch = MOCK_BRANCHES.find((b) => b.status === 'active');
      if (defaultBranch) setCurrentBranch(defaultBranch);
    }
    setInitialized(true);
  }

  /* 过滤逻辑 */
  const filtered = useMemo(() => {
    let list = MOCK_BRANCHES;
    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.managerName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, statusFilter]);

  /* 下拉刷新 */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 模拟网络请求
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  /* 选中门店回调 */
  const handleSelect = useCallback(
    (branch: Branch) => {
      setCurrentBranch(branch);
    },
    [setCurrentBranch],
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索门店名称、地址或店长..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 状态筛选标签 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip,
              statusFilter === key && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(key)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === key && styles.filterChipTextActive,
              ]}
            >
              {STATUS_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 门店列表 */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="branch-list-scroll"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>未找到门店</Text>
            <Text style={styles.emptySubtitle}>
              请尝试调整筛选或搜索条件
            </Text>
          </View>
        ) : (
          filtered.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              isSelected={currentBranch?.id === branch.id}
              onSelect={handleSelect}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  /* 搜索栏 */
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },

  /* 筛选行 */
  filterRow: {
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  /* 列表 */
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* 卡片 */
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f8f8ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardNameSelected: {
    color: '#6366f1',
  },
  selectedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#6366f1' + '18',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* 地址 */
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },

  /* 底部数据 */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },

  /* 空状态 */
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
  },
});
