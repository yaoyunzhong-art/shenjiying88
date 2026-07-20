import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import type { RefundRouteParams } from '../../utils/order-route';
import {
  getNativeAppOrderTransaction,
  submitNativeAppOrderRefund,
  type NativeAppTransactionAggregate,
} from '../../market-bootstrap';
import {
  getPaymentChannelLabel,
  normalizePaymentChannel,
  type PaymentChannel,
} from '../../utils/payment-channel';

type RefundParams = {
  Refund: RefundRouteParams;
};

export function RefundScreen() {
  const fallbackNavigation = (globalThis as {
    __mockNavigation?: {
      goBack: () => void;
      navigate?: (route: string, params?: Record<string, unknown>) => void;
    };
  }).__mockNavigation ?? { goBack: () => {}, navigate: () => {} };
  const fallbackRouteParams = (globalThis as {
    __mockRoute?: RefundParams['Refund'];
  }).__mockRoute ?? {};

  let navigation = fallbackNavigation;
  try {
    navigation = useNavigation();
  } catch {
    navigation = fallbackNavigation;
  }

  let route = { params: fallbackRouteParams } as RouteProp<RefundParams, 'Refund'>;
  try {
    route = useRoute<RouteProp<RefundParams, 'Refund'>>();
  } catch {
    route = { params: fallbackRouteParams } as RouteProp<RefundParams, 'Refund'>;
  }
  const routeParams = route.params && Object.keys(route.params).length > 0
    ? route.params
    : fallbackRouteParams;
  const shouldFetchOrder = (() => {
    const globals = globalThis as {
      __mockRoute?: RefundParams['Refund'];
      __mockOrderFetchEnabled?: boolean;
    };
    return Boolean(routeParams?.orderId) && (!globals.__mockRoute || globals.__mockOrderFetchEnabled === true);
  })();

  const {
    orderId,
    orderNo,
    amount: initialAmount,
    reason: initialReason,
    paymentChannel: initialPaymentChannel,
  } = routeParams ?? {};

  const [refundAmount, setRefundAmount] = useState(initialAmount?.toString() ?? '');
  const [refundReason, setRefundReason] = useState(initialReason ?? '');
  const [loading, setLoading] = useState(false);
  const [orderAggregate, setOrderAggregate] = useState<NativeAppTransactionAggregate | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderFetchError, setOrderFetchError] = useState<string | null>(null);
  const trimmedRefundAmount = refundAmount.trim();
  const trimmedRefundReason = refundReason.trim();
  const numAmount = Number(trimmedRefundAmount);
  const hasOrderContext = Boolean(orderAggregate?.order.orderId ?? orderId);
  const hasHydratedAggregate = Boolean(orderAggregate);
  const resolvedOriginalAmount = orderAggregate?.payment?.amount
    ?? orderAggregate?.order.totalAmount
    ?? initialAmount
    ?? 0;
  const reservedRefundAmount = hasHydratedAggregate
    ? orderAggregate!.refunds
      .filter((refund) => refund.status !== 'REJECTED')
      .reduce((sum, refund) => sum + refund.refundAmount, 0)
    : 0;
  const resolvedRefundableAmount = Math.max(
    0,
    hasHydratedAggregate
      ? resolvedOriginalAmount - reservedRefundAmount
      : resolvedOriginalAmount,
  );
  const resolvedOrderNo = orderAggregate?.order.orderNo ?? orderNo ?? 'N/A';
  const resolvedOrderId = orderAggregate?.order.orderId ?? orderId ?? 'N/A';
  const resolvedPaymentChannel = normalizePaymentChannel(
    orderAggregate?.payment?.channel ?? initialPaymentChannel,
  );
  const resolvedPaymentChannelLabel = getPaymentChannelLabel(resolvedPaymentChannel);
  const hasValidAmountFormat = /^\d+(\.\d{1,2})?$/.test(trimmedRefundAmount);
  const missingResolvedRefundAmount =
    hasOrderContext &&
    !orderLoading &&
    resolvedOriginalAmount <= 0;
  const exceedsRefundableBalance =
    hasValidAmountFormat &&
    Number.isFinite(numAmount) &&
    numAmount > resolvedRefundableAmount;
  const noRefundableBalance =
    hasOrderContext &&
    !orderLoading &&
    hasHydratedAggregate &&
    resolvedRefundableAmount <= 0;
  const canSubmitRefund =
    hasOrderContext &&
    hasValidAmountFormat &&
    Number.isFinite(numAmount) &&
    numAmount > 0 &&
    resolvedRefundableAmount > 0 &&
    !exceedsRefundableBalance &&
    trimmedRefundReason.length > 0 &&
    (!shouldFetchOrder || !orderLoading) &&
    !missingResolvedRefundAmount;
  const isFullRefund = resolvedRefundableAmount > 0 && Math.abs(numAmount - resolvedRefundableAmount) < 0.00001;

  const fetchOrder = useCallback(() => {
    if (!orderId || !shouldFetchOrder) {
      setOrderAggregate(null);
      setOrderFetchError(null);
      setOrderLoading(false);
      return () => {};
    }

    let cancelled = false;
    setOrderLoading(true);
    setOrderFetchError(null);

    getNativeAppOrderTransaction(orderId)
      .then((aggregate) => {
        if (cancelled) {
          return;
        }

        setOrderAggregate(aggregate);
        setRefundAmount((previousAmount) => (
          previousAmount.trim().length === 0
            ? String(aggregate.payment?.amount ?? aggregate.order.totalAmount)
            : previousAmount
        ));
        setOrderLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setOrderAggregate(null);
        setOrderFetchError(
          error instanceof Error && error.message
            ? error.message
            : '订单信息加载失败，请重试',
        );
        setOrderLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, shouldFetchOrder]);

  useEffect(() => fetchOrder(), [fetchOrder]);

  const handleRefund = async () => {
    if (orderLoading) {
      Alert.alert('提示', '订单信息同步中，请稍后再试');
      return;
    }
    if (!hasValidAmountFormat || !Number.isFinite(numAmount) || numAmount <= 0) {
      Alert.alert('提示', '请输入有效的退款金额');
      return;
    }
    if (!trimmedRefundReason) {
      Alert.alert('提示', '请输入退款原因');
      return;
    }
    if (!hasOrderContext || !orderId) {
      Alert.alert('提示', '缺少订单信息，无法提交退款');
      return;
    }
    if (missingResolvedRefundAmount) {
      Alert.alert('提示', '订单可退金额尚未同步成功，请先重试加载真实订单');
      return;
    }
    if (noRefundableBalance) {
      Alert.alert('提示', '当前订单已无可退余额');
      return;
    }
    if (exceedsRefundableBalance) {
      Alert.alert('提示', `退款金额不能超过可退余额 ¥${resolvedRefundableAmount.toFixed(2)}`);
      return;
    }
    if (!canSubmitRefund) {
      Alert.alert('提示', '请补全退款信息后再提交');
      return;
    }

    Alert.alert(
      '确认退款',
      `确定要退款 ¥${numAmount.toFixed(2)} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const aggregate = await submitNativeAppOrderRefund(orderId, {
                refundAmount: numAmount,
                reason: trimmedRefundReason,
                operator: 'app-cashier',
              });
              const latestRefund = [...aggregate.refunds].sort((left, right) =>
                new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime(),
              )[0];
              const completedStatuses = new Set(['REFUNDED', 'COMPLETED', 'SUCCEEDED']);
              const refundStatus = completedStatuses.has(latestRefund?.status ?? '') ? 'REFUNDED' : 'PENDING';
              const refundRequestedAt = latestRefund?.requestedAt ?? new Date().toISOString();
              const refundCompletedAt = latestRefund?.completedAt;
              const successMessage = refundStatus === 'REFUNDED'
                ? '退款已完成，订单状态已更新'
                : '退款申请已提交，请等待审核处理';
              Alert.alert('提示', successMessage, [
                {
                  text: '确定',
                  onPress: () => navigation.navigate?.('OrderDetail', {
                    orderId,
                    orderNo: aggregate.order.orderNo ?? orderAggregate?.order.orderNo ?? orderNo,
                    paymentChannel: normalizePaymentChannel(aggregate.payment?.channel) ?? resolvedPaymentChannel,
                    refundStatus,
                    refundRequestedAmount: numAmount,
                    refundReason: trimmedRefundReason,
                    refundRequestedAt,
                    refundCompletedAt,
                  }),
                },
              ]);
            } catch (error) {
              const message = error instanceof Error && error.message
                ? error.message
                : '退款失败，请重试';
              Alert.alert('错误', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.orderCard}>
          <Text style={styles.orderLabel}>订单信息</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>订单号</Text>
            <Text style={styles.orderValue}>{resolvedOrderNo}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>订单ID</Text>
            <Text style={styles.orderValue}>{resolvedOrderId}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>原订单金额</Text>
            <Text style={styles.orderValue}>
              ¥{resolvedOriginalAmount.toFixed(2)}
            </Text>
          </View>
          {hasHydratedAggregate ? (
            <>
              <View style={styles.orderRow}>
                <Text style={styles.orderKey}>已占用退款</Text>
                <Text style={styles.orderValue}>
                  ¥{reservedRefundAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderKey}>可退余额</Text>
                <Text style={styles.orderValue}>
                  ¥{resolvedRefundableAmount.toFixed(2)}
                </Text>
              </View>
            </>
          ) : null}
          {resolvedPaymentChannelLabel && (
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>原支付渠道</Text>
              <Text style={styles.orderValue}>{resolvedPaymentChannelLabel}</Text>
            </View>
          )}
          {orderLoading && (
            <Text style={styles.orderStatusText}>正在同步真实订单信息...</Text>
          )}
          {orderFetchError && (
            <>
              <Text style={styles.orderStatusText}>订单信息加载失败，可重试或按当前信息继续退款</Text>
              <Text style={styles.orderErrorText}>{orderFetchError}</Text>
              {missingResolvedRefundAmount ? (
                <Text style={styles.orderGuardText}>当前未拿到真实可退金额，请先重试加载后再退款</Text>
              ) : null}
              <Button
                title="重试加载"
                onPress={fetchOrder}
                variant="outline"
                size="small"
                style={styles.retryButton}
              />
            </>
          )}
          {!hasOrderContext && (
            <Text style={styles.orderHint}>缺少订单信息，请返回订单详情后重试</Text>
          )}
          {noRefundableBalance ? (
            <Text style={styles.orderGuardText}>当前订单已无可退余额，不能重复退款</Text>
          ) : null}
          {!noRefundableBalance && exceedsRefundableBalance ? (
            <Text style={styles.orderGuardText}>
              当前退款金额超过可退余额 ¥{resolvedRefundableAmount.toFixed(2)}，请调整后再提交
            </Text>
          ) : null}
        </Card>

        <View style={styles.section}>
          <Input
            label="退款金额"
            placeholder="请输入退款金额"
            value={refundAmount}
            onChangeText={setRefundAmount}
            keyboardType="decimal-pad"
          />
          <Input
            label="退款原因"
            placeholder="请输入退款原因"
            value={refundReason}
            onChangeText={setRefundReason}
            multiline
            numberOfLines={4}
            style={styles.reasonInput}
          />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>退款须知</Text>
          <Text style={styles.noticeText}>• 退款金额不能超过当前可退余额</Text>
          <Text style={styles.noticeText}>• 金额最多支持 2 位小数，最小退款金额为 0.01</Text>
          <Text style={styles.noticeText}>• 已退款/审核中的金额会占用余额，`REJECTED` 不占用</Text>
          <Text style={styles.noticeText}>• {isFullRefund ? '当前为全额退款' : '当前为部分退款'}，状态以接口返回结果为准</Text>
          <Text style={styles.noticeText}>• 退款将按原支付渠道返回</Text>
          <Text style={styles.noticeText}>• 如有疑问请联系客服</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="确认退款"
          onPress={handleRefund}
          loading={loading}
          style={styles.submitButton}
          disabled={!canSubmitRefund}
        />
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
  orderCard: {
    margin: 16,
    paddingVertical: 8,
  },
  orderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  orderKey: {
    fontSize: 14,
    color: '#666666',
  },
  orderValue: {
    fontSize: 14,
    color: '#333333',
  },
  orderHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#FF3B30',
  },
  orderStatusText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666666',
  },
  orderErrorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#FF3B30',
  },
  orderGuardText: {
    marginTop: 8,
    fontSize: 13,
    color: '#FF9500',
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  section: {
    paddingHorizontal: 16,
  },
  reasonInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  notice: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {},
});
