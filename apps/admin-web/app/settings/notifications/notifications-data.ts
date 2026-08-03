export interface NotificationRuleSnapshot {
  id: string
  category: string
  channels: string[]
  maxPerHour: number
  quietPeriod: string
  enabled: boolean
  severity: 'critical' | 'standard'
}

export interface NotificationChannelSnapshot {
  key: string
  name: string
  description: string
  coverage: string
}

export interface NotificationsSettingsSnapshotDelivery {
  deliveryMode: 'mock'
  sourceLabel: 'local-notification-rules-snapshot'
  rules: NotificationRuleSnapshot[]
  channels: NotificationChannelSnapshot[]
  generatedAt: string
}

export const defaultNotificationRules: NotificationRuleSnapshot[] = [
  {
    id: 'rule-order',
    category: '订单通知',
    channels: ['Push', 'App内'],
    maxPerHour: 10,
    quietPeriod: '22:00-08:00',
    enabled: true,
    severity: 'standard',
  },
  {
    id: 'rule-payment',
    category: '支付通知',
    channels: ['短信', '邮件', 'Push'],
    maxPerHour: 5,
    quietPeriod: '22:00-08:00',
    enabled: true,
    severity: 'critical',
  },
  {
    id: 'rule-promotion',
    category: '促销推送',
    channels: ['邮件'],
    maxPerHour: 1,
    quietPeriod: '22:00-08:00',
    enabled: true,
    severity: 'standard',
  },
  {
    id: 'rule-system',
    category: '系统告警',
    channels: ['短信', '邮件', 'App内'],
    maxPerHour: 100,
    quietPeriod: '无',
    enabled: true,
    severity: 'critical',
  },
  {
    id: 'rule-security',
    category: '安全通知',
    channels: ['短信', '邮件', 'App内'],
    maxPerHour: 5,
    quietPeriod: '无',
    enabled: true,
    severity: 'critical',
  },
]

export const defaultNotificationChannels: NotificationChannelSnapshot[] = [
  {
    key: 'push',
    name: 'Push 推送',
    description: 'App 设备推送，用于订单、营销和活动提醒。',
    coverage: '门店设备 / 用户 App',
  },
  {
    key: 'sms',
    name: '短信',
    description: '短信通道用于验证码、安全告警和关键支付通知。',
    coverage: '手机号',
  },
  {
    key: 'email',
    name: '邮件',
    description: '邮件通道用于模板化营销、系统报告和人工审批通知。',
    coverage: '邮箱地址',
  },
  {
    key: 'in-app',
    name: 'App内',
    description: '应用内消息中心，适合低时效但需留痕的通知。',
    coverage: '站内消息中心',
  },
]

export async function loadNotificationsSettingsSnapshot(): Promise<NotificationsSettingsSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'local-notification-rules-snapshot',
    rules: defaultNotificationRules,
    channels: defaultNotificationChannels,
    generatedAt: new Date().toISOString(),
  }
}
