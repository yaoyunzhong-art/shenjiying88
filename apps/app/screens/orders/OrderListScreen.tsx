import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderCard } from '../../components/OrderCard';

type OrderStackParamList = {
  OrderList: {
    orderId?: string;
    paymentStatus?: 'PAID';
    paymentAmount?: number;
    paymentPaidAt?: string;
    paymentChannel?: 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';
    refundStatus?: 'PENDING' | 'REFUNDED';
    refundRequestedAmount?: number;
    refundReason?: string;
    refundRequestedAt?: string;
    refundCompletedAt?: string;
  } | undefined;
  OrderDetail: { orderId: string };
};

type OrderListNavigationProp = NativeStackNavigationProp<OrderStackParamList, 'OrderList'>;

type OrderStatus = 'ALL' | 'PENDING' | 'PAID' | 'REFUNDED';

interface OrderItem {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
  paymentChannel?: 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';
  itemCount: number;
}

const mockOrders: OrderItem[] = [
  {
    orderId: 'order-001',
    orderNo: 'ORD20260612001',
    totalAmount: 156.00,
    currency: 'CNY',
    status: 'PAID',
    createdAt: '2026-06-12T10:30:00.000Z',
    paidAt: '2026-06-12T10:35:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    itemCount: 3,
  },
  {
    orderId: 'order-002',
    orderNo: 'ORD20260612002',
    totalAmount: 89.50,
    currency: 'CNY',
    status: 'PENDING',
    createdAt: '2026-06-12T11:15:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    itemCount: 2,
  },
  {
    orderId: 'order-003',
    orderNo: 'ORD20260611001',
    totalAmount: 320.00,
    currency: 'CNY',
    status: 'REFUNDED',
    createdAt: '2026-06-11T14:20:00.000Z',
    paidAt: '2026-06-11T14:25:00.000Z',
    paymentChannel: 'ALIPAY',
    itemCount: 5,
  },
  {
    orderId: 'order-004',
    orderNo: 'ORD20260610001',
    totalAmount: 68.00,
    currency: 'CNY',
    status: 'PAID',
    createdAt: '2026-06-10T09:45:00.000Z',
    paidAt: '2026-06-10T09:47:00.000Z',
    paymentChannel: 'CASH',
    itemCount: 1,
  },
];

const statusFilters: { id: OrderStatus; label: string }[] = [
  { id: 'ALL', label: '全部' },
  { id: 'PENDING', label: '待支付' },
  { id: 'PAID', label: '已完成' },
  { id: 'REFUNDED', label: '已退款' },
];

export function OrderListScreen() {
  const fallbackNavigation = (globalThis as {
    __mockNavigation?: OrderListNavigationProp;
  }).__mockNavigation;
  const fallbackRouteParams = (globalThis as {
    __mockRoute?: OrderStackParamList['OrderList'];
  }).__mockRoute;
  let navigation = fallbackNavigation as OrderListNavigationProp;
  try {
    navigation = useNavigation<OrderListNavigationProp>();
  } catch {
    navigation = fallbackNavigation as OrderListNavigationProp;
  }
  let route = { params: fallbackRouteParams } as RouteProp<OrderStackParamList, 'OrderList'>;
  try {
    route = useRoute<RouteProp<OrderStackParamList, 'OrderList'>>();
  } catch {
    route = { params: fallbackRouteParams } as RouteProp<OrderStackParamList, 'OrderList'>;
  }
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [orders] = useState<OrderItem[]>(mockOrders);

  const ordersWithRuntimeState = orders.map((order) => {
    if (order.orderId !== route.params?.orderId) {
      return order;
    }

    if (route.params?.paymentStatus === 'PAID') {
      return {
        ...order,
        status: 'PAID' as const,
        totalAmount: route.params.paymentAmount ?? order.totalAmount,
        paidAt: route.params.paymentPaidAt ?? order.paidAt,
        paymentChannel: route.params.paymentChannel ?? order.paymentChannel,
      };
    }

    if (route.params?.refundStatus === 'PENDING') {
      return {
        ...order,
        status: 'REFUND_PENDING' as const,
      };
    }

    if (route.params?.refundStatus === 'REFUNDED') {
      return {
        ...order,
        status: 'REFUNDED' as const,
      };
    }

    return order;
  });

  const filteredOrders = selectedFilter === 'ALL'
    ? ordersWithRuntimeState
    : ordersWithRuntimeState.filter((order) => {
      if (selectedFilter === 'REFUNDED') {
        return order.status === 'REFUNDED' || order.status === 'REFUND_PENDING';
      }
      return order.status === selectedFilter;
    });

  const handleOrderPress = (orderId: string) => {
    const matchedOrder = ordersWithRuntimeState.find((item) => item.orderId === orderId);
    navigation.navigate('OrderDetail', {
      orderId,
      ...(matchedOrder?.status === 'PAID' ? {
        paymentStatus: 'PAID' as const,
        paymentAmount: matchedOrder.totalAmount,
        paymentPaidAt: matchedOrder.paidAt,
        paymentChannel: matchedOrder.paymentChannel,
      } : {}),
      ...(matchedOrder?.status === 'REFUND_PENDING' ? {
        refundStatus: 'PENDING' as const,
      } : {}),
      ...(matchedOrder?.status === 'REFUNDED' ? {
        refundStatus: 'REFUNDED' as const,
      } : {}),
    });
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderFilterTab = ({ id, label }: { id: OrderStatus; label: string }) => (
    <TouchableOpacity
      key={id}
      style={[styles.filterTab, selectedFilter === id && styles.filterTabActive]}
      onPress={() => setSelectedFilter(id)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterTabText,
          selectedFilter === id && styles.filterTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: OrderItem }) => (
    <OrderCard
      orderId={item.orderId}
      orderNo={item.orderNo}
      totalAmount={item.totalAmount}
      currency={item.currency}
      status={item.status}
      createdAt={item.createdAt}
      itemCount={item.itemCount}
      onPress={() => handleOrderPress(item.orderId)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>暂无订单</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {statusFilters.map(renderFilterTab)}
      </View>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666666',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
