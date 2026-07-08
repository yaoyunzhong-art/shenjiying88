/**
 * InventoryScreen.tsx - 门店库存管理页面
 * 展示库存列表、支持搜索筛选、库存盘点操作
 */
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  threshold: number;
  unit: string;
  lastCheck: string;
}

const MOCK_ITEMS: InventoryItem[] = [];

type FilterTab = 'all' | 'low' | 'over';

export const InventoryScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = MOCK_ITEMS.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeTab === 'low') return item.stock <= item.threshold;
    if (activeTab === 'over') return item.stock > item.threshold * 3;
    return true;
  });

  const lowStockCount = MOCK_ITEMS.filter((i) => i.stock <= i.threshold).length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'low', label: `低库存 (${lowStockCount})` },
    { key: 'over', label: '高库存' },
  ];

  if (MOCK_ITEMS.length === 0) {
    return (
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索商品名称/SKU..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Filter tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Empty state */}
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>暂无库存数据</Text>
          <Text style={styles.emptySub}>请先同步门店库存信息</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索商品名称/SKU..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          共 {filtered.length} 项
        </Text>
        <TouchableOpacity style={styles.checkBtn}>
          <Text style={styles.checkBtnText}>开始盘点</Text>
        </TouchableOpacity>
      </View>
      {/* Inventory list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.threshold;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSku}>{item.sku}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.stockInfo}>
                  <Text style={[styles.stockQty, isLow && styles.stockLow]}>
                    {item.stock}
                  </Text>
                  <Text style={styles.stockUnit}>{item.unit}</Text>
                  {isLow && <Text style={styles.lowBadge}>补货</Text>}
                </View>
                <View style={styles.metaInfo}>
                  <Text style={styles.metaText}>阈值: {item.threshold}</Text>
                  <Text style={styles.metaText}>最近盘点: {item.lastCheck}</Text>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statsText: { fontSize: 14, color: '#888' },
  checkBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#bbb' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  cardSku: { fontSize: 12, color: '#aaa', marginLeft: 8 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stockInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  stockQty: { fontSize: 24, fontWeight: '700', color: '#2563eb' },
  stockLow: { color: '#ef4444' },
  stockUnit: { fontSize: 14, color: '#666' },
  lowBadge: {
    fontSize: 11,
    color: '#fff',
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    overflow: 'hidden',
  },
  metaInfo: { alignItems: 'flex-end' },
  metaText: { fontSize: 12, color: '#999', marginTop: 2 },
});
