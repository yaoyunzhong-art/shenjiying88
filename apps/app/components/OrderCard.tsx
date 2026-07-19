import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './common/Card';

interface OrderCardProps {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
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
  currency,
  status,
  createdAt,
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
        </View>
        <View style={styles.footer}>
          <Text style={styles.amountLabel}>实付金额</Text>
          <Text style={styles.amountValue}>
            {formatAmount(totalAmount, currency)}
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
