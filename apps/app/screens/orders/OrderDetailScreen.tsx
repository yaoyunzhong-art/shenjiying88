import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

type OrderDetailParams = {
  OrderDetail: { orderId: string };
};

const mockOrderDetail = {
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
};

const statusLabels: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已完成',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
};

const channelLabels: Record<string, string> = {
  WECHAT_PAY: '微信支付',
  ALIPAY: '支付宝',
  CASH: '现金',
  MEMBER_CARD: '会员卡',
};

export function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OrderDetailParams, 'OrderDetail'>>();

  const order = mockOrderDetail;

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
    Alert.alert(
      '申请退款',
      `确定要退款订单 ${order.orderNo} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('提示', '退款申请已提交', [
              { text: '确定', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const handleConfirmPayment = () => {
    Alert.alert('提示', '支付成功');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>订单状态</Text>
            <View
              style={[
                styles.statusBadge,
                order.status === 'PAID' && styles.statusBadgeSuccess,
                order.status === 'PENDING' && styles.statusBadgeWarning,
                order.status === 'REFUNDED' && styles.statusBadgeInfo,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  order.status === 'PAID' && styles.statusTextSuccess,
                  order.status === 'PENDING' && styles.statusTextWarning,
                  order.status === 'REFUNDED' && styles.statusTextInfo,
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
                {channelLabels[order.paymentChannel]}
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

      <View style={styles.footer}>
        {order.status === 'PENDING' && (
          <>
            <Button
              title="确认收款"
              onPress={handleConfirmPayment}
              style={styles.footerButton}
            />
            <Button
              title="申请退款"
              onPress={handleRefund}
              variant="outline"
              style={styles.footerButton}
            />
          </>
        )}
        {order.status === 'PAID' && (
          <Button
            title="申请退款"
            onPress={handleRefund}
            variant="outline"
            style={styles.fullWidthButton}
          />
        )}
        {(order.status === 'REFUNDED' || order.status === 'CANCELLED') && (
          <Button
            title="返回"
            onPress={() => navigation.goBack()}
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
  fullWidthButton: {
    flex: 1,
  },
});
