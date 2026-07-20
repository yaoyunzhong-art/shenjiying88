import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getNativeAppOrderTransaction, type NativeAppTransactionAggregate } from '../../market-bootstrap';
import type { OrderDetailRouteParams } from '../../utils/order-route';
import {
  getPaymentChannelLabel,
  normalizePaymentChannel,
  type PaymentChannel,
} from '../../utils/payment-channel';

type OrderDetailParams = {
  OrderDetail: OrderDetailRouteParams;
};

type OrderStatus = 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';

type MockOrderDetail = {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  totalAmount: number;
  currency: string;
  paymentChannel: PaymentChannel;
  memberId: string;
  memberNickname: string;
  items: Array<{ skuId: string; title: string; quantity: number; price: number }>;
  pointsEarned: number;
};

const mockOrderDetails: Record<string, MockOrderDetail> = {
  'order-001': {
    orderId: 'order-001',
    orderNo: 'ORD20260612001',
    status: 'PAID',
    createdAt: '2026-06-12T10:30:00.000Z',
    paidAt: '2026-06-12T10:35:00.000Z',
    totalAmount: 156.00,
    currency: 'CNY',
    paymentChannel: 'WECHAT_PAY',
    memberId: 'member-001',
    memberNickname: '张三',
    items: [
      { skuId: 'SKU001', title: '拿铁咖啡', quantity: 2, price: 32.00 },
      { skuId: 'SKU002', title: '提拉米苏', quantity: 1, price: 48.00 },
      { skuId: 'SKU003', title: '鲜榨橙汁', quantity: 1, price: 44.00 },
    ],
    pointsEarned: 156,
  },
  'order-002': {
    orderId: 'order-002',
    orderNo: 'ORD20260612002',
    status: 'PENDING',
    createdAt: '2026-06-12T11:15:00.000Z',
    totalAmount: 89.50,
    currency: 'CNY',
    paymentChannel: 'WECHAT_PAY',
    memberId: 'member-002',
    memberNickname: '李四',
    items: [
      { skuId: 'SKU101', title: '美式咖啡', quantity: 1, price: 26.00 },
      { skuId: 'SKU102', title: '牛角包', quantity: 2, price: 31.75 },
    ],
    pointsEarned: 0,
  },
  'order-003': {
    orderId: 'order-003',
    orderNo: 'ORD20260611001',
    status: 'REFUNDED',
    createdAt: '2026-06-11T14:20:00.000Z',
    paidAt: '2026-06-11T14:25:00.000Z',
    totalAmount: 320.00,
    currency: 'CNY',
    paymentChannel: 'ALIPAY',
    memberId: 'member-003',
    memberNickname: '王五',
    items: [
      { skuId: 'SKU201', title: '蛋白棒', quantity: 4, price: 35.00 },
      { skuId: 'SKU202', title: '运动饮料', quantity: 3, price: 60.00 },
    ],
    pointsEarned: 320,
  },
  'order-004': {
    orderId: 'order-004',
    orderNo: 'ORD20260610001',
    status: 'PAID',
    createdAt: '2026-06-10T09:45:00.000Z',
    paidAt: '2026-06-10T09:47:00.000Z',
    totalAmount: 68.00,
    currency: 'CNY',
    paymentChannel: 'CASH',
    memberId: 'member-004',
    memberNickname: '赵六',
    items: [
      { skuId: 'SKU301', title: '矿泉水', quantity: 1, price: 8.00 },
      { skuId: 'SKU302', title: '能量胶', quantity: 2, price: 30.00 },
    ],
    pointsEarned: 68,
  },
};

const defaultMockOrderDetail = mockOrderDetails['order-001']!;

const statusLabels: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已完成',
  REFUND_PENDING: '退款审核中',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
};

function createFallbackOrderDetail(params?: OrderDetailParams['OrderDetail']): MockOrderDetail {
  const matchedMockOrder = params?.orderId ? mockOrderDetails[params.orderId] : undefined;
  if (matchedMockOrder) {
    return matchedMockOrder;
  }

  const fallbackStatus: OrderStatus = params?.refundStatus === 'REFUNDED'
    ? 'REFUNDED'
    : params?.refundStatus === 'PENDING'
      ? 'REFUND_PENDING'
      : params?.paymentStatus === 'PAID'
        ? 'PAID'
        : 'PENDING';

  return {
    orderId: params?.orderId ?? defaultMockOrderDetail.orderId,
    orderNo: params?.orderNo ?? '',
    status: fallbackStatus,
    createdAt: params?.refundRequestedAt ?? params?.paymentPaidAt ?? '1970-01-01T00:00:00.000Z',
    paidAt: params?.paymentPaidAt,
    totalAmount: params?.paymentAmount ?? params?.refundRequestedAmount ?? 0,
    currency: 'CNY',
    paymentChannel: params?.paymentChannel ?? 'WECHAT_PAY',
    memberId: 'member-unknown',
    memberNickname: '未知会员',
    items: [],
    pointsEarned: params?.paymentAmount ? Math.round(params.paymentAmount) : 0,
  };
}

function resolveOrderStatus(status?: string): OrderStatus | undefined {
  switch (status) {
    case 'PAID':
      return 'PAID';
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return 'PENDING';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'REFUNDING':
      return 'REFUND_PENDING';
    case 'CANCELLED':
    case 'CLOSED':
      return 'CANCELLED';
    default:
      return undefined;
  }
}

export function OrderDetailScreen() {
  const fallbackNavigation = (globalThis as {
    __mockNavigation?: {
      goBack: () => void;
      navigate?: (route: string, params?: Record<string, unknown>) => void;
    };
  }).__mockNavigation ?? { goBack: () => {}, navigate: () => {} };
  const fallbackRouteParams = (globalThis as {
    __mockRoute?: OrderDetailParams['OrderDetail'];
  }).__mockRoute ?? { orderId: defaultMockOrderDetail.orderId };

  let navigation = fallbackNavigation;
  try {
    navigation = useNavigation();
  } catch {
    navigation = fallbackNavigation;
  }

  let route = { params: fallbackRouteParams } as RouteProp<OrderDetailParams, 'OrderDetail'>;
  try {
    route = useRoute<RouteProp<OrderDetailParams, 'OrderDetail'>>();
  } catch {
    route = { params: fallbackRouteParams } as RouteProp<OrderDetailParams, 'OrderDetail'>;
  }
  const routeParams = route.params && Object.keys(route.params).length > 0
    ? route.params
    : fallbackRouteParams;
  const shouldFetchAggregate = (() => {
    const globals = globalThis as {
      __mockRoute?: OrderDetailParams['OrderDetail'];
      __mockOrderFetchEnabled?: boolean;
    };
    return !globals.__mockRoute || globals.__mockOrderFetchEnabled === true;
  })();
  const [aggregate, setAggregate] = useState<NativeAppTransactionAggregate | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [aggregateError, setAggregateError] = useState<string | null>(null);

  const fetchAggregate = useCallback(() => {
    const orderId = routeParams?.orderId;

    if (!orderId || !shouldFetchAggregate) {
      return;
    }

    setAggregateLoading(true);
    setAggregateError(null);

    getNativeAppOrderTransaction(orderId)
      .then((result) => {
        setAggregate(result);
        setAggregateLoading(false);
      })
      .catch((err: unknown) => {
        setAggregate(null);
        setAggregateError(err instanceof Error ? err.message : '订单加载失败，请重试');
        setAggregateLoading(false);
      });
  }, [routeParams?.orderId, shouldFetchAggregate]);

  useEffect(() => {
    fetchAggregate();
  }, [fetchAggregate]);
  const baseOrder = createFallbackOrderDetail(routeParams);
  const latestAggregateRefund = aggregate?.refunds?.length
    ? [...aggregate.refunds].sort((left, right) =>
        new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime(),
      )[0]
    : undefined;
  const effectiveRefundStatus = routeParams?.refundStatus
    ?? (latestAggregateRefund
      ? (['REFUNDED', 'COMPLETED', 'SUCCEEDED'].includes(latestAggregateRefund.status) ? 'REFUNDED' : 'PENDING')
      : undefined);
  const effectiveRefundAmount = routeParams?.refundRequestedAmount ?? latestAggregateRefund?.refundAmount;
  const effectiveRefundReason = routeParams?.refundReason ?? latestAggregateRefund?.reason;
  const effectiveRefundRequestedAt = routeParams?.refundRequestedAt ?? latestAggregateRefund?.requestedAt;
  const effectiveRefundCompletedAt = routeParams?.refundCompletedAt ?? latestAggregateRefund?.completedAt;
  const hasSuccessfulPayment =
    (routeParams?.paymentStatus === 'PAID' && typeof routeParams?.paymentAmount === 'number')
    || aggregate?.order.status === 'PAID';
  const hasCompletedRefund =
    effectiveRefundStatus === 'REFUNDED' &&
    typeof effectiveRefundAmount === 'number';
  const hasPendingRefund =
    effectiveRefundStatus === 'PENDING' &&
    typeof effectiveRefundAmount === 'number';
  const order = {
    ...baseOrder,
    orderId: aggregate?.order.orderId ?? routeParams?.orderId ?? baseOrder.orderId,
    orderNo: aggregate?.order.orderNo ?? routeParams?.orderNo ?? baseOrder.orderNo,
    createdAt: aggregate?.order.createdAt ?? baseOrder.createdAt,
    memberId: aggregate?.order.memberId ?? baseOrder.memberId,
    memberNickname: aggregate?.memberNickname ?? baseOrder.memberNickname,
    items: aggregate?.order.items?.length ? aggregate.order.items : baseOrder.items,
    currency: aggregate?.order.currency ?? baseOrder.currency,
    totalAmount: routeParams?.paymentAmount ?? aggregate?.payment?.amount ?? aggregate?.order.totalAmount ?? baseOrder.totalAmount,
    paymentChannel: routeParams?.paymentChannel ?? normalizePaymentChannel(aggregate?.payment?.channel) ?? baseOrder.paymentChannel,
    paidAt: routeParams?.paymentPaidAt ?? aggregate?.order.paidAt ?? aggregate?.payment?.completedAt ?? baseOrder.paidAt,
    pointsEarned: aggregate?.settlement?.pointsEarned
      ?? (routeParams?.paymentAmount ? Math.round(routeParams.paymentAmount) : baseOrder.pointsEarned),
    status: hasCompletedRefund
      ? 'REFUNDED'
      : hasPendingRefund
        ? 'REFUND_PENDING'
        : hasSuccessfulPayment
          ? 'PAID'
          : (resolveOrderStatus(aggregate?.order.status) ?? baseOrder.status),
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefund = () => {
    navigation.navigate!('Refund' as never, {
      orderId: order.orderId,
      orderNo: order.orderNo,
      amount: order.totalAmount,
      reason: routeParams?.refundReason,
      paymentChannel: order.paymentChannel,
    } as never);
  };

  const handleConfirmPayment = () => {
    navigation.navigate!('Payment' as never, {
      orderId: order.orderId,
      orderNo: order.orderNo,
      amount: order.totalAmount,
      paymentChannel: order.paymentChannel,
    } as never);
  };

  const handleBackToOrders = () => {
    if (routeParams?.refundStatus) {
      navigation.navigate!('Orders' as never, {
        orderId: order.orderId,
        orderNo: order.orderNo,
        refundStatus: routeParams.refundStatus,
        refundRequestedAmount: routeParams.refundRequestedAmount,
        refundReason: routeParams.refundReason,
        refundRequestedAt: routeParams.refundRequestedAt,
        refundCompletedAt: routeParams.refundCompletedAt,
      } as never);
      return;
    }
    if (routeParams?.paymentStatus === 'PAID') {
      navigation.navigate!('Orders' as never, {
        orderId: order.orderId,
        orderNo: order.orderNo,
        paymentStatus: 'PAID',
        paymentAmount: routeParams.paymentAmount,
        paymentPaidAt: routeParams.paymentPaidAt,
        paymentChannel: routeParams.paymentChannel,
      } as never);
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {shouldFetchAggregate && aggregateLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : shouldFetchAggregate && aggregateError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>加载失败</Text>
          <Text style={styles.errorMessage}>{aggregateError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAggregate}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>订单状态</Text>
            <View
              style={[
                styles.statusBadge,
                order.status === 'PAID' && styles.statusBadgeSuccess,
                order.status === 'PENDING' && styles.statusBadgeWarning,
                (order.status === 'REFUNDED' || order.status === 'REFUND_PENDING') && styles.statusBadgeInfo,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  order.status === 'PAID' && styles.statusTextSuccess,
                  order.status === 'PENDING' && styles.statusTextWarning,
                  (order.status === 'REFUNDED' || order.status === 'REFUND_PENDING') && styles.statusTextInfo,
                ]}
              >
                {statusLabels[order.status]}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusKey}>订单号</Text>
            <Text style={styles.statusValue}>{order.orderNo}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusKey}>下单时间</Text>
            <Text style={styles.statusValue}>{formatDate(order.createdAt)}</Text>
          </View>
          {order.paidAt && (
            <View style={styles.statusRow}>
              <Text style={styles.statusKey}>支付时间</Text>
              <Text style={styles.statusValue}>{formatDate(order.paidAt)}</Text>
            </View>
          )}
        </Card>

        {(hasPendingRefund || hasCompletedRefund) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{hasCompletedRefund ? '退款结果' : '退款进度'}</Text>
            <Card style={styles.refundCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>退款状态</Text>
                <Text style={hasCompletedRefund ? styles.refundCompletedValue : styles.refundPendingValue}>
                  {hasCompletedRefund ? '已退款' : '退款审核中'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>{hasCompletedRefund ? '退款金额' : '申请金额'}</Text>
                <Text style={styles.statusValue}>¥{effectiveRefundAmount!.toFixed(2)}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>退款原因</Text>
                <Text style={styles.statusValue}>{effectiveRefundReason ?? '未填写'}</Text>
              </View>
              {effectiveRefundRequestedAt ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusKey}>{hasCompletedRefund ? '申请时间' : '申请时间'}</Text>
                  <Text style={styles.statusValue}>{formatDate(effectiveRefundRequestedAt)}</Text>
                </View>
              ) : null}
              {hasCompletedRefund && effectiveRefundCompletedAt ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusKey}>完成时间</Text>
                  <Text style={styles.statusValue}>{formatDate(effectiveRefundCompletedAt)}</Text>
                </View>
              ) : null}
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品明细</Text>
          <Card style={styles.itemsCard}>
            {order.items.map((item, index) => (
              <View key={item.skuId}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSku}>SKU: {item.skuId}</Text>
                  </View>
                  <View style={styles.itemPrice}>
                    <Text style={styles.itemPriceText}>
                      ¥{item.price.toFixed(2)}
                    </Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                </View>
                {index < order.items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支付信息</Text>
          <Card style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentKey}>支付方式</Text>
              <Text style={styles.paymentValue}>
                {getPaymentChannelLabel(order.paymentChannel) ?? '未知渠道'}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentKey}>支付金额</Text>
              <Text style={styles.paymentValue}>
                ¥{order.totalAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentKey}>获得积分</Text>
              <Text style={styles.pointsValue}>+{order.pointsEarned}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>会员信息</Text>
          <Card style={styles.memberCard}>
            <View style={styles.memberRow}>
              <Text style={styles.memberKey}>会员ID</Text>
              <Text style={styles.memberValue}>{order.memberId}</Text>
            </View>
            <View style={styles.memberRow}>
              <Text style={styles.memberKey}>会员昵称</Text>
              <Text style={styles.memberValue}>{order.memberNickname}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
      )}

      <View style={styles.footer}>
        {order.status === 'PENDING' && (
          <Button
            title="去收款"
            onPress={handleConfirmPayment}
            style={styles.fullWidthButton}
          />
        )}
        {order.status === 'PAID' && (
          <View style={styles.footerActions}>
            <Button
              title="返回"
              onPress={handleBackToOrders}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title="申请退款"
              onPress={handleRefund}
              variant="outline"
              style={styles.footerButton}
            />
          </View>
        )}
        {(order.status === 'REFUNDED' || order.status === 'CANCELLED' || order.status === 'REFUND_PENDING') && (
          <Button
            title="返回"
            onPress={handleBackToOrders}
            variant="outline"
            style={styles.fullWidthButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    paddingVertical: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#34C75920',
  },
  statusBadgeWarning: {
    backgroundColor: '#FF950020',
  },
  statusBadgeInfo: {
    backgroundColor: '#5856D620',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#34C759',
  },
  statusTextWarning: {
    color: '#FF9500',
  },
  statusTextInfo: {
    color: '#5856D6',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusKey: {
    fontSize: 14,
    color: '#666666',
  },
  statusValue: {
    fontSize: 14,
    color: '#333333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  itemsCard: {
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#999999',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  paymentCard: {
    paddingVertical: 8,
  },
  refundCard: {
    paddingVertical: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentKey: {
    fontSize: 14,
    color: '#666666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333333',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  refundPendingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5856D6',
  },
  refundCompletedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  memberCard: {
    paddingVertical: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberKey: {
    fontSize: 14,
    color: '#666666',
  },
  memberValue: {
    fontSize: 14,
    color: '#333333',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  footerActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  loadingText: {
    fontSize: 15,
    color: '#666666',
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
