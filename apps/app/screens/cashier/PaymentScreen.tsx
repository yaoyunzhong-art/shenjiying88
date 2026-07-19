import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { submitNativeAppOrderPayment } from '../../market-bootstrap';

type PaymentChannel = 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';

type PaymentParams = {
  Payment: {
    orderId?: string;
    orderNo?: string;
    amount?: number;
    paymentChannel?: PaymentChannel;
  };
};

const paymentChannels: { id: PaymentChannel; name: string; icon: string }[] = [
  { id: 'WECHAT_PAY', name: '微信支付', icon: '💚' },
  { id: 'ALIPAY', name: '支付宝', icon: '💙' },
  { id: 'CASH', name: '现金', icon: '💵' },
  { id: 'MEMBER_CARD', name: '会员卡', icon: '💳' },
];

const MAX_PAYMENT_AMOUNT = 999999.99;

export function PaymentScreen() {
  const fallbackNavigation = (globalThis as {
    __mockNavigation?: {
      goBack: () => void;
      navigate?: (route: string, params?: Record<string, unknown>) => void;
    };
  }).__mockNavigation ?? { goBack: () => {}, navigate: () => {} };
  const fallbackRouteParams = (globalThis as {
    __mockRoute?: PaymentParams['Payment'];
  }).__mockRoute ?? {};

  let navigation = fallbackNavigation;
  try {
    navigation = useNavigation();
  } catch {
    navigation = fallbackNavigation;
  }

  let route = { params: fallbackRouteParams } as RouteProp<PaymentParams, 'Payment'>;
  try {
    route = useRoute<RouteProp<PaymentParams, 'Payment'>>();
  } catch {
    route = { params: fallbackRouteParams } as RouteProp<PaymentParams, 'Payment'>;
  }

  const initialAmount = route.params?.amount;
  const initialChannel = route.params?.paymentChannel ?? 'WECHAT_PAY';
  const [amount, setAmount] = useState(initialAmount?.toString() ?? '');
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>(initialChannel);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMemberInput, setShowMemberInput] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const numericAmount = Number(amount);
  const memberPhoneValid = /^1\d{10}$/.test(memberPhone.trim());
  const canSubmitAmount =
    amount.trim().length > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= MAX_PAYMENT_AMOUNT;
  const canSubmit =
    canSubmitAmount &&
    (selectedChannel !== 'MEMBER_CARD' || memberPhoneValid);

  const handleNumberPress = (num: string) => {
    if (num === 'C') {
      setAmount('');
    } else if (num === '⌫') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (num === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => (prev.length === 0 ? '0.' : `${prev}.`));
      }
    } else {
      if (amount.includes('.') && (amount.split('.')[1]?.length ?? 0) >= 2) {
        return;
      }
      setAmount((prev) => {
        if (prev === '0' && num === '0') {
          return prev;
        }
        if (prev === '0') {
          return num;
        }
        return prev + num;
      });
    }
  };

  const handleChannelSelect = (channel: PaymentChannel) => {
    setSelectedChannel(channel);
    if (channel === 'MEMBER_CARD') {
      setShowMemberInput(true);
    } else {
      setShowMemberInput(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmitAmount) {
      const invalidAmountMessage =
        numericAmount > MAX_PAYMENT_AMOUNT
          ? `收款金额不能超过 ¥${MAX_PAYMENT_AMOUNT.toFixed(2)}`
          : '请输入有效金额';
      Alert.alert('提示', invalidAmountMessage);
      return;
    }
    if (selectedChannel === 'MEMBER_CARD' && !memberPhoneValid) {
      Alert.alert('提示', '请输入正确的会员手机号');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const paymentPaidAt = new Date().toISOString();
      const aggregate = route.params?.orderId
        ? await submitNativeAppOrderPayment(route.params.orderId, {
            amount: numericAmount,
            paymentChannel: selectedChannel,
            externalPaymentId: `app-pos-${route.params.orderId}`,
            paidAt: paymentPaidAt,
            source: 'app-cashier',
          })
        : undefined;
      setShowConfirmModal(false);
      Alert.alert('提示', '收款成功，订单状态已更新', [
        {
          text: '确定',
          onPress: () => {
            if (route.params?.orderId) {
              navigation.navigate?.('OrderDetail', {
                orderId: route.params.orderId,
                paymentStatus: 'PAID',
                paymentAmount: aggregate?.payment?.amount ?? numericAmount,
                paymentPaidAt: aggregate?.order.paidAt ?? aggregate?.payment?.completedAt ?? paymentPaidAt,
                paymentChannel: (aggregate?.payment?.channel as PaymentChannel | undefined) ?? selectedChannel,
              });
              return;
            }
            setAmount('');
          },
        },
      ]);
    } catch {
      Alert.alert('错误', '支付失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderNumberPad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
    return (
      <View style={styles.numberPad}>
        {keys.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.numberKey}
            onPress={() => handleNumberPress(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.numberKeyText}>{key}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.numberKey, styles.clearKey]}
          onPress={() => handleNumberPress('C')}
          activeOpacity={0.7}
        >
          <Text style={[styles.numberKeyText, styles.clearKeyText]}>C</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(route.params?.orderId || route.params?.orderNo) && (
          <Card style={styles.orderCard}>
            <Text style={styles.orderTitle}>待支付订单</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>订单号</Text>
              <Text style={styles.orderValue}>{route.params?.orderNo ?? 'N/A'}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>订单ID</Text>
              <Text style={styles.orderValue}>{route.params?.orderId ?? 'N/A'}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderKey}>待收金额</Text>
              <Text style={styles.orderValue}>¥{(route.params?.amount ?? 0).toFixed(2)}</Text>
            </View>
          </Card>
        )}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>收款金额</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>¥</Text>
            <Text style={styles.amountValue}>
              {amount || '0.00'}
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支付方式</Text>
          <View style={styles.channelsGrid}>
            {paymentChannels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelItem,
                  selectedChannel === channel.id && styles.channelItemSelected,
                ]}
                onPress={() => handleChannelSelect(channel.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.channelIcon}>{channel.icon}</Text>
                <Text
                  style={[
                    styles.channelName,
                    selectedChannel === channel.id && styles.channelNameSelected,
                  ]}
                >
                  {channel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {showMemberInput && (
        <Card style={styles.memberInputCard}>
          <Input
            label="会员手机号"
            placeholder="请输入会员手机号"
            value={memberPhone}
            onChangeText={setMemberPhone}
            keyboardType="phone-pad"
          />
        </Card>
      )}

      <View style={styles.footer}>
        {renderNumberPad()}
        <Button
          title="确认收款"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={!canSubmit}
        />
      </View>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>确认收款</Text>
            <Text style={styles.modalAmount}>
              ¥{parseFloat(amount || '0').toFixed(2)}
            </Text>
            <Text style={styles.modalChannel}>
              支付方式：{paymentChannels.find((c) => c.id === selectedChannel)?.name}
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowConfirmModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="确认"
                onPress={handleConfirmPayment}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  amountCard: {
    margin: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
  orderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 8,
  },
  orderTitle: {
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
  amountLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginRight: 4,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#333333',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  channelItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF08',
  },
  channelIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  channelName: {
    fontSize: 14,
    color: '#333333',
  },
  channelNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  memberInputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberKey: {
    width: '30%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  numberKeyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333333',
  },
  clearKey: {
    backgroundColor: '#F5F5F5',
  },
  clearKeyText: {
    color: '#FF3B30',
  },
  submitButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 8,
  },
  modalChannel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
});
