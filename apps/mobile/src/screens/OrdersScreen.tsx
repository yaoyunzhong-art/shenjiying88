/**
 * OrdersScreen.tsx - Phase-21 T52
 * 订单列表页
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Order {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

// TODO: T54 接 useQuery + api.get('/orders')
const MOCK_ORDERS: Order[] = [];

export const OrdersScreen: React.FC = () => {
  if (MOCK_ORDERS.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无订单</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={MOCK_ORDERS}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.amount}>¥{item.amount.toFixed(2)}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  amount: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 14, color: '#666' },
});