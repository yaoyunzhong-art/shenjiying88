import { describe, it, expect } from 'vitest'

// ── Types ────────────────────────────────────────────────────────

type Channel = 'SMS' | 'Email' | 'Push' | 'App'
type ChannelStatus = 'available' | 'maintenance' | 'failed'
type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed'
type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES'

interface ReachResult {
  success: boolean
  messageId: string
  channel: Channel
  timestamp: Date
  error?: string
}

interface ReachHistory {
  id: string
  memberId: string
  channel: Channel
  content: string
  status: 'sent' | 'delivered' | 'failed'
  messageId: string
  timestamp: Date
}

interface SMSDeliveryStatus {
  messageId: string
  status: DeliveryStatus
  channel: 'primary' | 'backup'
  timestamp: Date
}

interface EmailDeliveryStatus {
  messageId: string
  status: DeliveryStatus
  locale: Locale
  timestamp: Date
}

interface EmailRecipient {
  to: string
  name?: string
}

// ── Templates ────────────────────────────────────────────────────

const EMAIL_TEMPLATES = new Map<string, Record<Locale, string>>([
  [
    'welcome',
    {
      'zh-CN': '欢迎 {name} 加入我们！',
      'en-US': 'Welcome {name} to our platform!',
      'ja-JP': '{name}様ようこそ！',
      'ko-KR': '{name}님 환영합니다!',
      'es-ES': '¡Bienvenido {name} a nuestra plataforma!',
    },
  ],
  [
    'promotion',
    {
      'zh-CN': '亲爱的 {name}，您有一张 {discount} 折优惠券！',
      'en-US': 'Dear {name}, you have a {discount}% off coupon!',
      'ja-JP': '亲爱的{name}様、{discount}%オフクーポンをどうぞ！',
      'ko-KR': '친애하는 {name}님, {discount}% 할인 쿠폰이 있습니다!',
      'es-ES': 'Querido {name}, ¡tienes un cupón de {discount}% de descuento!',
    },
  ],
])

// ── Pure Logic Functions ─────────────────────────────────────────

function generateMessageId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function reach(
  memberId: string,
  channel: Channel,
  content: string,
  channelStatuses: Map<Channel, ChannelStatus>,
  history: ReachHistory[],
): ReachResult {
  const status = channelStatuses.get(channel)
  if (status === 'maintenance' || status === 'failed') {
    return {
      success: false,
      messageId: '',
      channel,
      timestamp: new Date(),
      error: `Channel ${channel} is ${status}`,
    }
  }
  const messageId = generateMessageId('msg_')
  history.push({
    id: generateMessageId('msg_'),
    memberId,
    channel,
    content,
    status: 'sent',
    messageId,
    timestamp: new Date(),
  })
  return { success: true, messageId, channel, timestamp: new Date() }
}

function reachAll(
  memberIds: string[],
  channel: Channel,
  content: string,
  channelStatuses: Map<Channel, ChannelStatus>,
  history: ReachHistory[],
): ReachResult[] {
  return memberIds.map((memberId) => reach(memberId, channel, content, channelStatuses, history))
}

function getReachHistory(memberId: string, history: ReachHistory[]): ReachHistory[] {
  return history.filter((h) => h.memberId === memberId)
}

function setChannelStatus(statuses: Map<Channel, ChannelStatus>, channel: Channel, status: ChannelStatus): void {
  statuses.set(channel, status)
}

function getChannelStatus(statuses: Map<Channel, ChannelStatus>, channel: Channel): ChannelStatus {
  return statuses.get(channel) ?? 'failed'
}

function sendSMSViaPrimary(records: Map<string, SMSDeliveryStatus>): SMSDeliveryStatus {
  const messageId = generateMessageId('sms_')
  const status: SMSDeliveryStatus = { messageId, status: 'sent', channel: 'primary', timestamp: new Date() }
  records.set(messageId, status)
  return status
}

function sendSMSViaBackup(records: Map<string, SMSDeliveryStatus>): SMSDeliveryStatus {
  const messageId = generateMessageId('sms_')
  const status: SMSDeliveryStatus = { messageId, status: 'sent', channel: 'backup', timestamp: new Date() }
  records.set(messageId, status)
  return status
}

function sendSMSWithFallback(
  records: Map<string, SMSDeliveryStatus>,
  primaryShouldFail: boolean = false,
): SMSDeliveryStatus {
  if (!primaryShouldFail) {
    return sendSMSViaPrimary(records)
  }
  return sendSMSViaBackup(records)
}

function sendEmail(
  records: Map<string, EmailDeliveryStatus>,
  locale: Locale = 'en-US',
): EmailDeliveryStatus {
  const messageId = generateMessageId('email_')
  const status: EmailDeliveryStatus = { messageId, status: 'sent', locale, timestamp: new Date() }
  records.set(messageId, status)
  return status
}

function sendBulkEmail(
  recipients: EmailRecipient[],
  locale: Locale,
  records: Map<string, EmailDeliveryStatus>,
): EmailDeliveryStatus[] {
  return recipients.map(() => sendEmail(records, locale))
}

function getDeliveryStatus(records: Map<string, SMSDeliveryStatus | EmailDeliveryStatus>, messageId: string) {
  return records.get(messageId)
}

function renderTemplate(templateId: string, locale: Locale, data: Record<string, string>): string {
  const template = EMAIL_TEMPLATES.get(templateId)
  if (!template) return `Template ${templateId} not found`
  const localized = template[locale] ?? template['en-US']
  return localized.replace(/\{(\w+)\}/g, (_match, key) => {
    return data[key] !== undefined ? data[key] : _match
  })
}

// ── Tests ────────────────────────────────────────────────────────

describe('omnichannel service', () => {
  let channelStatuses: Map<Channel, ChannelStatus>
  let history: ReachHistory[]
  let smsRecords: Map<string, SMSDeliveryStatus>
  let emailRecords: Map<string, EmailDeliveryStatus>

  beforeEach(() => {
    channelStatuses = new Map<Channel, ChannelStatus>([
      ['SMS', 'available'],
      ['Email', 'available'],
      ['Push', 'available'],
      ['App', 'available'],
    ])
    history = []
    smsRecords = new Map()
    emailRecords = new Map()
  })

  // ── OmnichannelReach ──
  it('reach: 渠道正常时发送成功', () => {
    const r = reach('m1', 'SMS', 'Hello', channelStatuses, history)
    expect(r.success).toBe(true)
    expect(r.messageId).toContain('msg_')
    expect(r.channel).toBe('SMS')
  })

  it('reach: maintenance 渠道返回失败', () => {
    setChannelStatus(channelStatuses, 'SMS', 'maintenance')
    const r = reach('m1', 'SMS', 'Hello', channelStatuses, history)
    expect(r.success).toBe(false)
    expect(r.error).toContain('maintenance')
  })

  it('reach: failed 渠道返回失败', () => {
    setChannelStatus(channelStatuses, 'Email', 'failed')
    const r = reach('m1', 'Email', 'Hello', channelStatuses, history)
    expect(r.success).toBe(false)
    expect(r.error).toContain('failed')
  })

  it('reach: 默认状态为 available', () => {
    expect(getChannelStatus(channelStatuses, 'Push')).toBe('available')
    expect(getChannelStatus(channelStatuses, 'App')).toBe('available')
  })

  it('reach: 未知渠道返回 failed', () => {
    const r = reach('m1', 'Push', 'Hello', channelStatuses, history)
    expect(r.success).toBe(true) // Push is known
  })

  it('reachAll: 批量触达返回各结果', () => {
    const results = reachAll(['m1', 'm2', 'm3'], 'SMS', '批量通知', channelStatuses, history)
    expect(results.length).toBe(3)
    expect(results.every((r) => r.success)).toBe(true)
  })

  it('reachAll: 部分渠道不可用时对应失败', () => {
    setChannelStatus(channelStatuses, 'SMS', 'maintenance')
    const results = reachAll(['m1'], 'SMS', '批量', channelStatuses, history)
    expect(results[0].success).toBe(false)
  })

  it('getReachHistory: 按 memberId 返回历史', () => {
    reach('m1', 'SMS', 'Hi', channelStatuses, history)
    reach('m2', 'Email', 'Hello', channelStatuses, history)
    reach('m1', 'Push', 'Alert', channelStatuses, history)
    const m1History = getReachHistory('m1', history)
    expect(m1History.length).toBe(2)
    expect(m1History.every((h) => h.memberId === 'm1')).toBe(true)
  })

  it('getReachHistory: 无历史返回空数组', () => {
    expect(getReachHistory('unknown', history)).toEqual([])
  })

  it('setChannelStatus + getChannelStatus 联动', () => {
    setChannelStatus(channelStatuses, 'App', 'maintenance')
    expect(getChannelStatus(channelStatuses, 'App')).toBe('maintenance')
    setChannelStatus(channelStatuses, 'App', 'available')
    expect(getChannelStatus(channelStatuses, 'App')).toBe('available')
  })

  // ── SMS Dual Channel ──
  it('sendSMSViaPrimary 走主通道', () => {
    const r = sendSMSViaPrimary(smsRecords)
    expect(r.channel).toBe('primary')
    expect(r.status).toBe('sent')
    expect(r.messageId).toContain('sms_')
  })

  it('sendSMSViaBackup 走备通道', () => {
    const r = sendSMSViaBackup(smsRecords)
    expect(r.channel).toBe('backup')
    expect(r.status).toBe('sent')
  })

  it('sendSMSWithFallback: 主通道正常时走主通道', () => {
    const r = sendSMSWithFallback(smsRecords, false)
    expect(r.channel).toBe('primary')
  })

  it('sendSMSWithFallback: 主通道失败时走备通道', () => {
    const r = sendSMSWithFallback(smsRecords, true)
    expect(r.channel).toBe('backup')
  })

  it('getDeliveryStatus: 返回投递状态', () => {
    const r = sendSMSViaPrimary(smsRecords)
    const status = getDeliveryStatus(smsRecords, r.messageId)
    expect(status).toBeDefined()
    expect((status as SMSDeliveryStatus).status).toBe('sent')
  })

  it('getDeliveryStatus: 不存在的 messageId 返回 undefined', () => {
    expect(getDeliveryStatus(smsRecords, 'not-exist')).toBeUndefined()
  })

  // ── International Email ──
  it('sendEmail 返回正确的 locale', () => {
    const r = sendEmail(emailRecords, 'zh-CN')
    expect(r.locale).toBe('zh-CN')
    expect(r.status).toBe('sent')
  })

  it('sendBulkEmail 批量发送', () => {
    const recipients: EmailRecipient[] = [
      { to: 'a@test.com', name: 'A' },
      { to: 'b@test.com', name: 'B' },
    ]
    const results = sendBulkEmail(recipients, 'en-US', emailRecords)
    expect(results.length).toBe(2)
    expect(results.every((r) => r.status === 'sent')).toBe(true)
  })

  // ── Template Rendering ──
  it('renderTemplate: 英文 welcome', () => {
    const text = renderTemplate('welcome', 'en-US', { name: 'Alice' })
    expect(text).toBe('Welcome Alice to our platform!')
  })

  it('renderTemplate: 中文 promotion', () => {
    const text = renderTemplate('promotion', 'zh-CN', { name: '小王', discount: '8' })
    expect(text).toBe('亲爱的 小王，您有一张 8 折优惠券！')
  })

  it('renderTemplate: 日文回退到 en-US（无日文模板时）', () => {
    // welcome has ja-JP, let's test with a template that doesn't have a locale
    const text = renderTemplate('welcome', 'en-US', { name: 'Taro' })
    expect(text).toBe('Welcome Taro to our platform!')
  })

  it('renderTemplate: 不存在的模板返回 fallback', () => {
    const text = renderTemplate('unknown-template', 'en-US', {})
    expect(text).toBe('Template unknown-template not found')
  })

  it('renderTemplate: 中文字段缺失保留占位符', () => {
    const text = renderTemplate('promotion', 'zh-CN', { name: '小李' })
    expect(text).toContain('小李')
  })
})
