import { useState, useCallback, useEffect, useMemo } from 'react';
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
import {
  listNativeAppOrdersPage,
  type NativeAppOrderListQuery,
} from '../../market-bootstrap';
import type {
  OrderDetailRouteParams,
  OrderRuntimeRouteParams,
} from '../../utils/order-route';
import {
  buildOrderDetailRouteParams,
} from '../../utils/order-finance';
import {
  mergeRuntimeOrderIntoTarget,
} from '../../utils/order-runtime';
import {
  buildRuntimeFallbackOrderSummary,
  mapApiOrderToSummaryView,
  type OrderSummaryViewModel,
} from '../../utils/order-view';

type OrderStackParamList = {
  OrderList: OrderRuntimeRouteParams | undefined;
  OrderDetail: OrderDetailRouteParams;
};

type OrderListNavigationProp = NativeStackNavigationProp<OrderStackParamList, 'OrderList'>;

type OrderStatus = 'ALL' | 'PENDING' | 'PAID' | 'REFUNDED';
type OrderDateRange = 'ALL_TIME' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

const mockOrders: OrderSummaryViewModel[] = [
  {
    orderId: 'order-001',
    orderNo: 'ORD20260612001',
    totalAmount: 156.00,
    paidAmount: 156.00,
    refundedAmount: 0,
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
    paidAmount: 0,
    refundedAmount: 0,
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
    paidAmount: 320.00,
    refundedAmount: 320.00,
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
    paidAmount: 68.00,
    refundedAmount: 0,
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

const dateRangeFilters: { id: OrderDateRange; label: string }[] = [
  { id: 'ALL_TIME', label: '全部时间' },
  { id: 'LAST_7_DAYS', label: '近7天' },
  { id: 'LAST_30_DAYS', label: '近30天' },
];

const ORDER_LIST_PAGE_SIZE = 10;

function getOrderListNow(): Date {
  const mockedNow = (globalThis as {
    __mockOrderListNow?: string | number | Date;
  }).__mockOrderListNow;

  if (!mockedNow) {
    return new Date();
  }

  return mockedNow instanceof Date ? mockedNow : new Date(mockedNow);
}

function buildOrderListQuery(
  filter: OrderStatus,
  range: OrderDateRange,
  page = 1,
  pageSize = ORDER_LIST_PAGE_SIZE,
): NativeAppOrderListQuery {
  const query: NativeAppOrderListQuery = {
    page,
    pageSize,
  };

  switch (filter) {
    case 'PENDING':
      query.status = 'PENDING_PAYMENT';
      break;
    case 'PAID':
      query.status = 'PAID';
      break;
    case 'REFUNDED':
      query.status = 'REFUNDED';
      break;
    default:
      break;
  }

  if (range !== 'ALL_TIME') {
    const now = getOrderListNow();
    const fromDate = new Date(now);
    const offsetDays = range === 'LAST_7_DAYS' ? 6 : 29;
    fromDate.setDate(fromDate.getDate() - offsetDays);
    query.fromDate = fromDate.toISOString();
    query.toDate = now.toISOString();
  }

  return query;
}

function mergePagedOrders(previous: OrderSummaryViewModel[] | null, next: OrderSummaryViewModel[]): OrderSummaryViewModel[] {
  const merged = [...(previous ?? [])];

  next.forEach((item) => {
    const existingIndex = merged.findIndex((order) => order.orderId === item.orderId);
    if (existingIndex >= 0) {
      merged[existingIndex] = item;
      return;
    }
    merged.push(item);
  });

  return merged;
}

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
  const routeParams = route.params && Object.keys(route.params).length > 0
    ? route.params
    : fallbackRouteParams;
  const shouldFetchOrders = (() => {
    const globals = globalThis as {
      __mockRoute?: OrderStackParamList['OrderList'];
      __mockOrderListFetchEnabled?: boolean;
    };
    return !globals.__mockRoute || globals.__mockOrderListFetchEnabled === true;
  })();
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<OrderDateRange>('ALL_TIME');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [apiOrders, setApiOrders] = useState<OrderSummaryViewModel[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const baseQuery = useMemo(
    () => buildOrderListQuery(selectedFilter, selectedDateRange),
    [selectedFilter, selectedDateRange],
  );

  const loadOrders = useCallback(async (
    query: NativeAppOrderListQuery = baseQuery,
    mode: 'replace' | 'append' = 'replace',
  ) => {
    const result = await listNativeAppOrdersPage(query);
    const mappedOrders = result.items.map(mapApiOrderToSummaryView);
    setApiOrders((previousOrders) => (
      mode === 'append' ? mergePagedOrders(previousOrders, mappedOrders) : mappedOrders
    ));
    setHasMore(result.page * result.pageSize < result.total);
    setFetchError(null);
    return result;
  }, [baseQuery]);

  const handleRetryFetch = useCallback(() => {
    setCurrentPage(1);
    setFetchError(null);
    setApiOrders(null);
    listNativeAppOrdersPage(buildOrderListQuery(selectedFilter, selectedDateRange))
      .then((result) => {
        setApiOrders(result.items.map(mapApiOrderToSummaryView));
        setHasMore(result.page * result.pageSize < result.total);
      })
      .catch(() => {
        setFetchError('订单加载失败，请重试');
      });
  }, [selectedFilter, selectedDateRange]);

  useEffect(() => {
    let cancelled = false;

    if (!shouldFetchOrders) {
      setApiOrders(null);
      setHasMore(false);
      return;
    }

    setCurrentPage(1);
    listNativeAppOrdersPage(baseQuery)
      .then((result) => {
        if (!cancelled) {
          setApiOrders(result.items.map(mapApiOrderToSummaryView));
          setHasMore(result.page * result.pageSize < result.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiOrders(null);
          setFetchError('订单加载失败');
          setHasMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseQuery, shouldFetchOrders]);

  const orders = apiOrders ?? mockOrders;
  const routeRuntimeOrder = routeParams?.orderId && !orders.some((order) => order.orderId === routeParams.orderId)
    ? buildRuntimeFallbackOrderSummary(routeParams)
    : undefined;
  const ordersWithRuntimeFallback = routeRuntimeOrder ? [...orders, routeRuntimeOrder] : orders;
  const ordersWithRuntimeState = ordersWithRuntimeFallback.map((order) => (
    mergeRuntimeOrderIntoTarget(order, routeParams)
  ));

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
    navigation.navigate(
      'OrderDetail',
      matchedOrder
        ? buildOrderDetailRouteParams({ order: matchedOrder })
        : { orderId },
    );
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (!shouldFetchOrders) {
      setTimeout(() => setRefreshing(false), 1000);
      return;
    }

    const refreshQuery = buildOrderListQuery(selectedFilter, selectedDateRange);
    setCurrentPage(1);
    loadOrders(refreshQuery, 'replace')
      .catch(() => {
        setApiOrders(null);
        setFetchError('订单刷新失败');
        setHasMore(false);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [loadOrders, selectedDateRange, selectedFilter, shouldFetchOrders]);

  const handleLoadMore = useCallback(() => {
    if (!shouldFetchOrders || loadingMore || !hasMore) {
      return;
    }

    const nextPage = currentPage + 1;
    const nextQuery = buildOrderListQuery(selectedFilter, selectedDateRange, nextPage);
    setLoadingMore(true);

    loadOrders(nextQuery, 'append')
      .then((result) => {
        setCurrentPage(nextPage);
        setHasMore(result.page * result.pageSize < result.total);
      })
      .catch(() => {
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [currentPage, hasMore, loadOrders, loadingMore, selectedDateRange, selectedFilter, shouldFetchOrders]);

  const handleFilterChange = useCallback((nextFilter: OrderStatus) => {
    setSelectedFilter(nextFilter);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((nextRange: OrderDateRange) => {
    setSelectedDateRange(nextRange);
    setCurrentPage(1);
  }, []);

  const renderFilterTab = ({ id, label }: { id: OrderStatus; label: string }) => (
    <TouchableOpacity
      key={id}
      style={[styles.filterTab, selectedFilter === id && styles.filterTabActive]}
      onPress={() => handleFilterChange(id)}
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

  const renderDateRangeTab = ({ id, label }: { id: OrderDateRange; label: string }) => (
    <TouchableOpacity
      key={id}
      style={[styles.dateRangeTab, selectedDateRange === id && styles.dateRangeTabActive]}
      onPress={() => handleDateRangeChange(id)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.dateRangeTabText,
          selectedDateRange === id && styles.dateRangeTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: OrderSummaryViewModel }) => (
    <OrderCard
      orderId={item.orderId}
      orderNo={item.orderNo}
      totalAmount={item.totalAmount}
      paidAmount={item.paidAmount}
      refundedAmount={item.refundedAmount}
      currency={item.currency}
      status={item.status}
      createdAt={item.createdAt}
      paidAt={item.paidAt}
      refundRequestedAt={item.refundRequestedAt}
      refundCompletedAt={item.refundCompletedAt}
      paymentChannel={item.paymentChannel}
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

  const renderListFooter = () => {
    if (!shouldFetchOrders || !apiOrders?.length || !hasMore) {
      return <View style={styles.listFooterSpacer} />;
    }

    return (
      <View style={styles.listFooter}>
        <TouchableOpacity
          style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
          onPress={handleLoadMore}
          activeOpacity={0.7}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreButtonText}>
            {loadingMore ? '加载中...' : '加载更多'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>加载失败</Text>
      <Text style={styles.errorMessage}>{fetchError}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetryFetch}>
        <Text style={styles.retryText}>重试</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {statusFilters.map(renderFilterTab)}
      </View>
      <View style={styles.dateRangeContainer}>
        {dateRangeFilters.map(renderDateRangeTab)}
      </View>
      {fetchError && shouldFetchOrders ? (
        renderErrorState()
      ) : (
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderListFooter}
        showsVerticalScrollIndicator={false}
      />
      )}
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
  dateRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dateRangeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
  },
  dateRangeTabActive: {
    backgroundColor: '#E8F1FF',
  },
  dateRangeTabText: {
    fontSize: 12,
    color: '#667085',
  },
  dateRangeTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  listFooter: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  listFooterSpacer: {
    height: 12,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreButtonText: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '600',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
