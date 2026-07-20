import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderListFilterBar } from '../../components/OrderListFilterBar';
import { OrderListItemCard } from '../../components/OrderListItemCard';
import { OrderListLoadMoreFooter } from '../../components/OrderListLoadMoreFooter';
import { OrderListStatePanel } from '../../components/OrderListStatePanel';
import {
  listNativeAppOrdersPage,
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
import {
  buildOrderListQuery,
  filterOrderListByStatus,
  mergePagedOrders,
  mockOrderListSummaries,
  orderDateRangeFilters,
  orderStatusFilters,
  type OrderDateRange,
  type OrderStatus,
} from '../../utils/order-list-state';
import type { NativeAppOrderListQuery } from '../../market-bootstrap';

type OrderStackParamList = {
  OrderList: OrderRuntimeRouteParams | undefined;
  OrderDetail: OrderDetailRouteParams;
};

type OrderListNavigationProp = NativeStackNavigationProp<OrderStackParamList, 'OrderList'>;

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

  const orders = apiOrders ?? mockOrderListSummaries;
  const routeRuntimeOrder = routeParams?.orderId && !orders.some((order) => order.orderId === routeParams.orderId)
    ? buildRuntimeFallbackOrderSummary(routeParams)
    : undefined;
  const ordersWithRuntimeFallback = routeRuntimeOrder ? [...orders, routeRuntimeOrder] : orders;
  const ordersWithRuntimeState = ordersWithRuntimeFallback.map((order) => (
    mergeRuntimeOrderIntoTarget(order, routeParams)
  ));

  const filteredOrders = filterOrderListByStatus(ordersWithRuntimeState, selectedFilter);

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

  const renderOrder = ({ item }: { item: OrderSummaryViewModel }) => (
    <OrderListItemCard
      order={item}
      onPress={() => handleOrderPress(item.orderId)}
    />
  );

  const renderListFooter = () => {
    return (
      <OrderListLoadMoreFooter
        visible={Boolean(shouldFetchOrders && apiOrders?.length && hasMore)}
        loading={loadingMore}
        onPress={handleLoadMore}
      />
    );
  };

  return (
    <View style={styles.container}>
      <OrderListFilterBar
        options={orderStatusFilters}
        activeOption={selectedFilter}
        onChange={handleFilterChange}
      />
      <OrderListFilterBar
        options={orderDateRangeFilters}
        activeOption={selectedDateRange}
        onChange={handleDateRangeChange}
        variant="chip"
      />
      {fetchError && shouldFetchOrders ? (
        <OrderListStatePanel
          icon="⚠️"
          title="加载失败"
          message={fetchError}
          actionLabel="重试"
          onActionPress={handleRetryFetch}
        />
      ) : (
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={(
          <OrderListStatePanel
            icon="📋"
            message="暂无订单"
          />
        )}
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
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
});
