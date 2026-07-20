export type PaymentChannel = 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  WECHAT_PAY: '微信支付',
  ALIPAY: '支付宝',
  CASH: '现金',
  MEMBER_CARD: '会员卡',
};

export const PAYMENT_CHANNEL_OPTIONS: Array<{
  id: PaymentChannel;
  name: string;
  icon: string;
}> = [
  { id: 'WECHAT_PAY', name: '微信支付', icon: '💚' },
  { id: 'ALIPAY', name: '支付宝', icon: '💙' },
  { id: 'CASH', name: '现金', icon: '💵' },
  { id: 'MEMBER_CARD', name: '会员卡', icon: '💳' },
];

export function normalizePaymentChannel(channel?: string): PaymentChannel | undefined {
  switch (channel) {
    case 'WECHAT_PAY':
    case 'wechat':
    case 'wechat-pay':
      return 'WECHAT_PAY';
    case 'ALIPAY':
    case 'alipay':
    case 'ali-pay':
      return 'ALIPAY';
    case 'CASH':
    case 'cash':
      return 'CASH';
    case 'MEMBER_CARD':
    case 'member-card':
    case 'member_card':
      return 'MEMBER_CARD';
    default:
      return undefined;
  }
}

export function getPaymentChannelLabel(channel?: string) {
  const normalizedChannel = normalizePaymentChannel(channel);
  return normalizedChannel ? PAYMENT_CHANNEL_LABELS[normalizedChannel] : undefined;
}
