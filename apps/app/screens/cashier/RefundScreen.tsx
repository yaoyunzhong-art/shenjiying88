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

type RefundParams = {
  Refund: {
    orderId?: string;
    orderNo?: string;
    amount?: number;
    reason?: string;
  };
};

export function RefundScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RefundParams, 'Refund'>>();
  const { orderId, orderNo, amount: initialAmount, reason: initialReason } = route.params ?? {};

  const [refundAmount, setRefundAmount] = useState(initialAmount?.toString() ?? '');
  const [refundReason, setRefundReason] = useState(initialReason ?? '');
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('提示', '请输入有效的退款金额');
      return;
    }
    if (!refundReason.trim()) {
      Alert.alert('提示', '请输入退款原因');
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
              await new Promise((resolve) => setTimeout(resolve, 1500));
              Alert.alert('提示', '退款成功', [
                {
                  text: '确定',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch {
              Alert.alert('错误', '退款失败，请重试');
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
          <Text style={styles.noticeText}>• 部分退款后订单状态变更为已退款</Text>
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
