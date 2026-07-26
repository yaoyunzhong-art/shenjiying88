export interface SystemInfoSnapshot {
  name: string
  version: string
  build: string
  environment: 'production' | 'staging' | 'testing'
  copyright: string
  timezone: string
  language: string
  logoHint: string
}

export interface SmsProviderSnapshot {
  id: string
  name: string
  enabled: boolean
  balance: number
  dailyCap: number
  dailyUsed: number
  endpoint: string
  apiKey: string
  priority: number
}

export interface MailProviderSnapshot {
  id: string
  name: string
  enabled: boolean
  host: string
  port: number
  username: string
  encryption: 'SSL' | 'TLS' | 'None'
  dailyLimit: number
  dailySent: number
}

export interface PaymentChannelSnapshot {
  id: string
  name: string
  enabled: boolean
  provider: string
  feeRate: number
  settleCycle: string
  status: 'normal' | 'degraded' | 'down'
  dailyVolume: number
}

export interface SecurityPolicySnapshot {
  id: string
  label: string
  enabled: boolean
  description: string
  category: 'auth' | 'access' | 'audit' | 'data'
}

export interface AdminSettingsSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'admin-settings-fallback'
  generatedAt: string
  systemInfo: SystemInfoSnapshot
  smsProviders: SmsProviderSnapshot[]
  mailProviders: MailProviderSnapshot[]
  paymentChannels: PaymentChannelSnapshot[]
  securityPolicies: SecurityPolicySnapshot[]
  governanceNotes: string[]
  stats: {
    smsEnabled: number
    mailEnabled: number
    paymentEnabled: number
    securityEnabled: number
  }
  error?: string
}

export const DEFAULT_SYSTEM_INFO: SystemInfoSnapshot = {
  name: '神机营·运营管理系统',
  version: 'v3.8.2',
  build: '20260711.01',
  environment: 'production',
  copyright: '© 2026 ShenJiYing All Rights Reserved',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  logoHint: '推荐 240x80 PNG/SVG，当前仅展示 fallback 样本。',
}

export const DEFAULT_SMS_PROVIDERS: SmsProviderSnapshot[] = [
  {
    id: 'aliyun',
    name: '阿里云短信',
    enabled: true,
    balance: 48520,
    dailyCap: 50000,
    dailyUsed: 18230,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiKey: 'LTAI5t******示例',
    priority: 1,
  },
  {
    id: 'tencent',
    name: '腾讯云短信',
    enabled: true,
    balance: 32100,
    dailyCap: 30000,
    dailyUsed: 7560,
    endpoint: 'https://sms.tencentcloudapi.com',
    apiKey: 'AKID******示例',
    priority: 2,
  },
  {
    id: 'twilio',
    name: 'Twilio（国际）',
    enabled: false,
    balance: 1500,
    dailyCap: 10000,
    dailyUsed: 0,
    endpoint: 'https://api.twilio.com',
    apiKey: 'AC******示例',
    priority: 3,
  },
]

export const DEFAULT_MAIL_PROVIDERS: MailProviderSnapshot[] = [
  {
    id: 'sendcloud',
    name: 'SendCloud',
    enabled: true,
    host: 'smtp.sendcloud.net',
    port: 465,
    username: 'shenjiying_api',
    encryption: 'SSL',
    dailyLimit: 50000,
    dailySent: 12450,
  },
  {
    id: 'aliyun-mail',
    name: '阿里云邮件推送',
    enabled: true,
    host: 'smtpdm.aliyun.com',
    port: 465,
    username: 'noreply@shenjiying.com',
    encryption: 'TLS',
    dailyLimit: 20000,
    dailySent: 3800,
  },
]

export const DEFAULT_PAYMENT_CHANNELS: PaymentChannelSnapshot[] = [
  {
    id: 'wechat',
    name: '微信支付',
    enabled: true,
    provider: '财付通',
    feeRate: 0.6,
    settleCycle: 'T+1',
    status: 'normal',
    dailyVolume: 384000,
  },
  {
    id: 'alipay',
    name: '支付宝',
    enabled: true,
    provider: '蚂蚁金服',
    feeRate: 0.55,
    settleCycle: 'T+1',
    status: 'normal',
    dailyVolume: 296000,
  },
  {
    id: 'unionpay',
    name: '银联支付',
    enabled: false,
    provider: '中国银联',
    feeRate: 0.8,
    settleCycle: 'T+3',
    status: 'degraded',
    dailyVolume: 0,
  },
  {
    id: 'stripe',
    name: 'Stripe（国际）',
    enabled: false,
    provider: 'Stripe Inc.',
    feeRate: 2.9,
    settleCycle: 'T+7',
    status: 'down',
    dailyVolume: 0,
  },
]

export const DEFAULT_SECURITY_POLICIES: SecurityPolicySnapshot[] = [
  {
    id: 'mfa',
    label: '强制多因素认证',
    enabled: true,
    description: '管理员登录需短信验证码和密码双重认证。',
    category: 'auth',
  },
  {
    id: 'ip_whitelist',
    label: 'IP 白名单',
    enabled: true,
    description: '仅允许白名单 IP 访问管理后台。',
    category: 'access',
  },
  {
    id: 'audit_log',
    label: '完整审计日志',
    enabled: true,
    description: '记录所有管理操作的详细日志并保留 180 天。',
    category: 'audit',
  },
  {
    id: 'data_mask',
    label: '数据脱敏展示',
    enabled: true,
    description: '手机号和邮箱默认按审计规则脱敏。',
    category: 'data',
  },
  {
    id: 'geofence',
    label: '地理围栏登录',
    enabled: false,
    description: '限制仅限中国大陆 IP 登录。',
    category: 'auth',
  },
]

export const DEFAULT_GOVERNANCE_NOTES = [
  '当前页面展示的是全局设置治理 fallback 样本，不是实时配置中心回读。',
  '短信、邮件、支付和安全策略后续应切换到 configuration-governance 快照。',
  '刷新按钮只通过 router.refresh() 触发服务端重新生成快照，不在客户端伪造 loading。',
]

export async function loadAdminSettingsSnapshot(): Promise<AdminSettingsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'admin-settings-fallback',
    generatedAt: '2026-07-26T12:00:00.000Z',
    systemInfo: { ...DEFAULT_SYSTEM_INFO },
    smsProviders: DEFAULT_SMS_PROVIDERS.map((item) => ({ ...item })),
    mailProviders: DEFAULT_MAIL_PROVIDERS.map((item) => ({ ...item })),
    paymentChannels: DEFAULT_PAYMENT_CHANNELS.map((item) => ({ ...item })),
    securityPolicies: DEFAULT_SECURITY_POLICIES.map((item) => ({ ...item })),
    governanceNotes: [...DEFAULT_GOVERNANCE_NOTES],
    stats: {
      smsEnabled: DEFAULT_SMS_PROVIDERS.filter((item) => item.enabled).length,
      mailEnabled: DEFAULT_MAIL_PROVIDERS.filter((item) => item.enabled).length,
      paymentEnabled: DEFAULT_PAYMENT_CHANNELS.filter((item) => item.enabled).length,
      securityEnabled: DEFAULT_SECURITY_POLICIES.filter((item) => item.enabled).length,
    },
    error: '全局设置实时治理接口尚未接入，当前展示 fallback 样本，不可作为闭环复签证据。',
  }
}
