import React, { useState } from 'react';
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
import { submitNativeAppOrderRefund } from '../../market-bootstrap';

type RefundParams = {
  Refund: {
    orderId?: string;
    orderNo?: string;
    amount?: number;
    reason?: string;
  };
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

  const { orderId, orderNo, amount: initialAmount, reason: initialReason } = routeParams ?? {};

  const [refundAmount, setRefundAmount] = useState(initialAmount?.toString() ?? '');
  const [refundReason, setRefundReason] = useState(initialReason ?? '');
  const [loading, setLoading] = useState(false);
  const trimmedRefundAmount = refundAmount.trim();
  const trimmedRefundReason = refundReason.trim();
  const numAmount = Number(trimmedRefundAmount);
  const hasValidAmountFormat = /^\d+(\.\d{1,2})?$/.test(trimmedRefundAmount);
  const canSubmitRefund =
    hasValidAmountFormat &&
    Number.isFinite(numAmount) &&
    numAmount > 0 &&
    (typeof initialAmount !== 'number' || numAmount <= initialAmount) &&
    trimmedRefundReason.length > 0;
  const isFullRefund = typeof initialAmount === 'number' && Math.abs(numAmount - initialAmount) < 0.00001;

  const handleRefund = async () => {
    if (!hasValidAmountFormat || !Number.isFinite(numAmount) || numAmount <= 0) {
      Alert.alert('提示', '请输入有效的退款金额');
      return;
    }
    if (!trimmedRefundReason) {
      Alert.alert('提示', '请输入退款原因');
      return;
    }
    if (!orderId) {
      Alert.alert('提示', '缺少订单信息，无法提交退款');
      return;
    }
    if (typeof initialAmount === 'number' && numAmount > initialAmount) {
      Alert.alert('提示', '退款金额不能超过原订单金额');
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
                    orderNo: aggregate.order.orderNo ?? orderNo,
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
            <Text style={styles.orderValue}>{orderNo ?? 'N/A'}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>订单ID</Text>
            <Text style={styles.orderValue}>{orderId ?? 'N/A'}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderKey}>原订单金额</Text>
            <Text style={styles.orderValue}>
              ¥{initialAmount?.toFixed(2) ?? '0.00'}
            </Text>
          </View>
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
          <Text style={styles.noticeText}>• 退款金额不能超过原订单金额</Text>
          <Text style={styles.noticeText}>• 金额最多支持 2 位小数，最小退款金额为 0.01</Text>
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
