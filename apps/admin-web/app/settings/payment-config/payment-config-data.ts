export interface PaymentChannelSnapshot {
  id: string
  name: string
  provider: string
  status: 'normal' | 'degraded' | 'offline'
  feeRate: string
  settlementCycle: string
  dailyLimit: string
  enabled: boolean
}

export interface SettlementRule {
  key: string
  value: string
}

export interface PaymentConfigSnapshotDelivery {
  deliveryMode: 'mock'
  sourceLabel: 'local-payment-config-snapshot'
  channels: PaymentChannelSnapshot[]
  settlementRules: SettlementRule[]
  generatedAt: string
}

export const defaultPaymentChannels: PaymentChannelSnapshot[] = [
  {
    id: 'wechat-pay',
    name: '微信支付',
    provider: 'wechat',
    status: 'normal',
    feeRate: '0.60% + 0.30元',
    settlementCycle: 'T+1',
    dailyLimit: '¥500,000',
    enabled: true,
  },
  {
    id: 'alipay',
    name: '支付宝',
    provider: 'alipay',
    status: 'normal',
    feeRate: '0.60% + 0.30元',
    settlementCycle: 'T+1',
    dailyLimit: '¥500,000',
    enabled: true,
  },
  {
    id: 'cash',
    name: '现金',
    provider: 'cash',
    status: 'normal',
    feeRate: '免费',
    settlementCycle: '实时入账',
    dailyLimit: '门店自定义',
    enabled: true,
  },
  {
    id: 'unionpay-card',
    name: '银联刷卡',
    provider: 'unionpay',
    status: 'degraded',
    feeRate: '0.55%',
    settlementCycle: 'T+1',
    dailyLimit: '¥300,000',
    enabled: true,
  },
]

export const defaultSettlementRules: SettlementRule[] = [
  { key: '默认结算周期', value: 'T+1（次日到账）' },
  { key: '结算延迟天数', value: '0 ~ 3 天（按通道）' },
  { key: '最大单笔金额', value: '¥500,000' },
  { key: '支持币种', value: 'CNY, USD, EUR' },
]

export async function loadPaymentConfigSnapshot(): Promise<PaymentConfigSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'local-payment-config-snapshot',
    channels: defaultPaymentChannels,
    settlementRules: defaultSettlementRules,
    generatedAt: new Date().toISOString(),
  }
}
