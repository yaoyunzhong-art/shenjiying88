import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './common/Card';
import {
  getPaymentChannelLabel,
  type PaymentChannel,
} from '../utils/payment-channel';

interface OrderCardProps {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
  paymentChannel?: PaymentChannel;
  itemCount: number;
  onPress?: () => void;
}

const statusLabels: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已完成',
  REFUND_PENDING: '退款审核中',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
};

const statusColors: Record<string, string> = {
  PENDING: '#FF9500',
  PAID: '#34C759',
  REFUND_PENDING: '#5856D6',
  REFUNDED: '#5856D6',
  CANCELLED: '#999999',
};

export function OrderCard({
  orderId,
  orderNo,
  totalAmount,
  paidAmount,
  refundedAmount,
  currency,
  status,
  createdAt,
  paidAt,
  refundRequestedAt,
  refundCompletedAt,
  paymentChannel,
  itemCount,
  onPress,
}: OrderCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, curr: string) => {
    return `${curr === 'CNY' ? '¥' : '$'}${amount.toFixed(2)}`;
  };

  const amountSummary = (() => {
    switch (status) {
      case 'PENDING':
        return {
          label: '应付金额',
          value: totalAmount,
        };
      case 'PAID':
        return {
          label: '实付金额',
          value: paidAmount || totalAmount,
        };
      case 'REFUND_PENDING':
        return {
          label: '申请退款金额',
          value: refundedAmount || paidAmount || totalAmount,
        };
      case 'REFUNDED':
        return {
          label: '已退款金额',
          value: refundedAmount || paidAmount || totalAmount,
        };
      default:
        return {
          label: '订单金额',
          value: totalAmount,
        };
    }
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.orderNo}>{orderNo}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[status] + '20' },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusColors[status] }]}
            >
              {statusLabels[status]}
            </Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>订单号</Text>
            <Text style={styles.infoValue}>{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>商品数量</Text>
            <Text style={styles.infoValue}>{itemCount} 件</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>下单时间</Text>
            <Text style={styles.infoValue}>{formatDate(createdAt)}</Text>
          </View>
          {paidAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>支付时间</Text>
              <Text style={styles.infoValue}>{formatDate(paidAt)}</Text>
            </View>
          ) : null}
          {paymentChannel ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>支付方式</Text>
              <Text style={styles.infoValue}>{getPaymentChannelLabel(paymentChannel)}</Text>
            </View>
          ) : null}
          {status === 'REFUND_PENDING' && refundRequestedAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>申请时间</Text>
              <Text style={styles.infoValue}>{formatDate(refundRequestedAt)}</Text>
            </View>
          ) : null}
          {status === 'REFUNDED' && refundCompletedAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>退款完成时间</Text>
              <Text style={styles.infoValue}>{formatDate(refundCompletedAt)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Text style={styles.amountLabel}>{amountSummary.label}</Text>
          <Text style={styles.amountValue}>
            {formatAmount(amountSummary.value, currency)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666666',
  },
  infoValue: {
    fontSize: 13,
    color: '#333333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666666',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
});
