import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { InventoryCard } from '../../components/InventoryCard';

type InventoryStackParamList = {
  Inventory: undefined;
  InventoryScan: undefined;
};

type InventoryNavigationProp = NativeStackNavigationProp<InventoryStackParamList, 'Inventory'>;

interface InventoryItem {
  skuId: string;
  title: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  location: string;
}

const mockInventory: InventoryItem[] = [
  {
    skuId: 'SKU-COF-001',
    title: '阿拉比卡咖啡豆 500g',
    quantity: 156,
    lowStockThreshold: 50,
    unit: '袋',
    location: 'A区-01-03',
  },
  {
    skuId: 'SKU-MILK-001',
    title: '鲜牛奶 1L',
    quantity: 8,
    lowStockThreshold: 20,
    unit: '盒',
    location: '冷藏区-02-01',
  },
  {
    skuId: 'SKU-CUP-001',
    title: '一次性纸杯 100只装',
    quantity: 0,
    lowStockThreshold: 30,
    unit: '包',
    location: 'B区-03-05',
  },
  {
    skuId: 'SKU-SYRUP-001',
    title: '焦糖糖浆 700ml',
    quantity: 45,
    lowStockThreshold: 15,
    unit: '瓶',
    location: 'C区-01-02',
  },
  {
    skuId: 'SKU-CAKE-001',
    title: '提拉米苏蛋糕',
    quantity: 12,
    lowStockThreshold: 10,
    unit: '块',
    location: '冷藏区-01-03',
  },
];

export function InventoryScreen() {
  const navigation = useNavigation<InventoryNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [inventory] = useState<InventoryItem[]>(mockInventory);

  const filteredInventory = searchText
    ? inventory.filter(
        (item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.skuId.toLowerCase().includes(searchText.toLowerCase())
      )
    : inventory;

  const handleScan = () => {
    navigation.navigate('InventoryScan');
  };

  const handleItemPress = (skuId: string) => {
    console.log('Item pressed:', skuId);
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <InventoryCard
      skuId={item.skuId}
      title={item.title}
      quantity={item.quantity}
      lowStockThreshold={item.lowStockThreshold}
      unit={item.unit}
      location={item.location}
      onPress={() => handleItemPress(item.skuId)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>未找到相关商品</Text>
    </View>
  );

  const lowStockCount = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.lowStockThreshold
  ).length;
  const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索商品名称或SKU"
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <Text style={styles.scanButtonText}>扫码</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statItem, styles.totalItem]}>
          <Text style={styles.statValue}>{inventory.length}</Text>
          <Text style={styles.statLabel}>商品总数</Text>
        </View>
        <View style={[styles.statItem, styles.warningItem]}>
          <Text style={[styles.statValue, styles.warningValue]}>{lowStockCount}</Text>
          <Text style={styles.statLabel}>库存预警</Text>
        </View>
        <View style={[styles.statItem, styles.dangerItem]}>
          <Text style={[styles.statValue, styles.dangerValue]}>{outOfStockCount}</Text>
          <Text style={styles.statLabel}>缺货</Text>
        </View>
      </View>

      <FlatList
        data={filteredInventory}
        renderItem={renderItem}
        keyExtractor={(item) => item.skuId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    height: '100%',
  },
  scanButton: {
    marginLeft: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  totalItem: {},
  warningItem: {},
  dangerItem: {},
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  warningValue: {
    color: '#FF9500',
  },
  dangerValue: {
    color: '#FF3B30',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
});
