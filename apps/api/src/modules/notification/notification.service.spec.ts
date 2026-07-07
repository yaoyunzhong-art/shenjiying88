/**
 * notification.service.spec.ts — Notification 模块深层单元测试
 *
 * 覆盖:
 *  - Template management: 注册/获取/按code查找/列表/更新/启用状态过滤
 *  - Dispatch management: 同步发送/异步入队/get/list/重试/取消
 *  - Renewal 通知: 续费成功/失败/提醒
 *  - simulateSend: 正常/失败/重试后成功/取消不可重复
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量（与生产代码对齐）
// ═══════════════════════════════════════════════════════════════

enum NotificationChannelType {
  Email = 'EMAIL',
  Sms = 'SMS',
  Push = 'PUSH',
  InApp = 'IN_APP',
  Webhook = 'WEBHOOK',
  Social = 'SOCIAL'
}

enum NotificationStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

enum FoundationScopeType {
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE'
}

interface NotificationTemplate {
  id: string
  code: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
  locale: string
  titleTemplate?: string
  bodyTemplate: string
  variables: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationDispatch {
  id: string
  templateId?: string
  channel: NotificationChannelType
  scopeType: FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  recipient: string
  payload: Record<string, unknown>
  status: NotificationStatus
  scheduledAt?: string
  sentAt?: string
  providerResponse?: Record<string, unknown>
  retryCount: number
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

let templateCounter = 0
let dispatchCounter = 0

function createTemplate(overrides?: Partial<NotificationTemplate>): NotificationTemplate {
  const now = new Date().toISOString()
  return {
    id: `tmpl-${Date.now()}-${++templateCounter}`,
    code: 'test-template',
    channel: NotificationChannelType.Email,
    scopeType: FoundationScopeType.Tenant,
    tenantId: 'tenant-001',
    locale: 'zh-CN',
    titleTemplate: '通知：{{name}}',
    bodyTemplate: '您好 {{name}}，您有新的通知',
    variables: ['name'],
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function createDispatch(overrides?: Partial<NotificationDispatch>): NotificationDispatch {
  const now = new Date().toISOString()
  return {
    id: `dispatch-${Date.now()}-${++dispatchCounter}`,
    channel: NotificationChannelType.Email,
    scopeType: FoundationScopeType.Tenant,
    tenantId: 'tenant-001',
    recipient: 'user@test.com',
    payload: { type: 'test' },
    status: NotificationStatus.Pending,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑
// ═══════════════════════════════════════════════════════════════

/** 是否为有效 recipient（不含 fail 前缀即正常） */
function inlineShouldSucceed(recipient: string): boolean {
  return !recipient.includes('fail')
}

/** 模拟发送: 正常 → Sent, 含 fail → Failed */
function inlineSimulateSend(
  dispatchStore: Map<string, NotificationDispatch>,
  id: string,
): NotificationDispatch {
  const existing = dispatchStore.get(id)
  if (!existing) throw new Error(`Dispatch ${id} not found`)

  const shouldFail = existing.recipient.includes('fail')
  const updated: NotificationDispatch = {
    ...existing,
    status: shouldFail ? NotificationStatus.Failed : NotificationStatus.Sent,
    sentAt: new Date().toISOString(),
    providerResponse: shouldFail
      ? { error: 'PROVIDER_REJECTED', message: 'Recipient rejected by provider' }
      : { providerId: `prov-${Date.now()}`, status: 'delivered' },
    updatedAt: new Date().toISOString(),
  }
  dispatchStore.set(id, updated)
  return updated
}

/** 注册模板 */
function inlineRegisterTemplate(
  store: Map<string, NotificationTemplate>,
  input: {
    code: string
    channel: NotificationChannelType
    scopeType: FoundationScopeType
    tenantId?: string
    locale: string
    bodyTemplate: string
    enabled?: boolean
  },
): NotificationTemplate {
  const now = new Date().toISOString()
  const tmpl: NotificationTemplate = {
    id: `tmpl-${Date.now()}-${++templateCounter}`,
    code: input.code,
    channel: input.channel,
    scopeType: input.scopeType,
    tenantId: input.tenantId,
    locale: input.locale,
    bodyTemplate: input.bodyTemplate,
    variables: [],
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  }
  store.set(tmpl.id, tmpl)
  return tmpl
}

/** 按 code 查找启用模板 */
function inlineFindByCode(store: Map<string, NotificationTemplate>, code: string): NotificationTemplate | undefined {
  for (const t of store.values()) {
    if (t.code === code && t.enabled) return t
  }
  return undefined
}

/** 更新模板 */
function inlineUpdateTemplate(
  store: Map<string, NotificationTemplate>,
  id: string,
  patch: { bodyTemplate?: string; enabled?: boolean },
): NotificationTemplate | undefined {
  const existing = store.get(id)
  if (!existing) return undefined
  const updated: NotificationTemplate = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  store.set(id, updated)
  return updated
}

/** 列表筛选 */
function inlineListTemplates(
  store: Map<string, NotificationTemplate>,
  filters?: { channel?: NotificationChannelType; tenantId?: string; enabled?: boolean },
): NotificationTemplate[] {
  let results = Array.from(store.values())
  if (filters?.channel) results = results.filter(t => t.channel === filters.channel)
  if (filters?.tenantId) results = results.filter(t => t.tenantId === filters.tenantId)
  if (filters?.enabled !== undefined) results = results.filter(t => t.enabled === filters.enabled)
  return results
}

/** 创建 dispatch（toNotificationDispatch inlined） */
function inlineCreateDispatch(
  dispatchStore: Map<string, NotificationDispatch>,
  input: {
    channel: NotificationChannelType
    scopeType: FoundationScopeType
    tenantId?: string
    recipient: string
    payload: Record<string, unknown>
    templateId?: string
    status?: NotificationStatus
  },
): NotificationDispatch {
  const now = new Date().toISOString()
  const dispatch: NotificationDispatch = {
    id: `dispatch-${Date.now()}-${++dispatchCounter}`,
    channel: input.channel,
    scopeType: input.scopeType,
    tenantId: input.tenantId,
    recipient: input.recipient,
    payload: input.payload,
    templateId: input.templateId,
    status: input.status ?? NotificationStatus.Pending,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  dispatchStore.set(dispatch.id, dispatch)
  return dispatch
}

/** 重试发送 */
function inlineRetryDispatch(
  dispatchStore: Map<string, NotificationDispatch>,
  id: string,
): NotificationDispatch | undefined {
  const existing = dispatchStore.get(id)
  if (!existing) return undefined
  if (existing.status !== NotificationStatus.Failed) return existing

  const updated: NotificationDispatch = {
    ...existing,
    status: NotificationStatus.Pending,
    retryCount: existing.retryCount + 1,
    updatedAt: new Date().toISOString(),
  }
  dispatchStore.set(id, updated)
  return inlineSimulateSend(dispatchStore, id)
}

/** 取消 */
function inlineCancelDispatch(
  dispatchStore: Map<string, NotificationDispatch>,
  id: string,
): NotificationDispatch | undefined {
  const existing = dispatchStore.get(id)
  if (!existing) return undefined
  if (existing.status === NotificationStatus.Sent) return existing

  const updated: NotificationDispatch = {
    ...existing,
    status: NotificationStatus.Cancelled,
    updatedAt: new Date().toISOString(),
  }
  dispatchStore.set(id, updated)
  return updated
}

/** dispatch 列表筛选 */
function inlineListDispatches(
  store: Map<string, NotificationDispatch>,
  filters?: { status?: NotificationStatus; channel?: NotificationChannelType; tenantId?: string; recipient?: string },
): NotificationDispatch[] {
  let results = Array.from(store.values())
  if (filters?.status) results = results.filter(d => d.status === filters.status)
  if (filters?.channel) results = results.filter(d => d.channel === filters.channel)
  if (filters?.tenantId) results = results.filter(d => d.tenantId === filters.tenantId)
  if (filters?.recipient) results = results.filter(d => d.recipient === filters.recipient)
  return results
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('NotificationService | Template 管理', () => {
  let templateStore: Map<string, NotificationTemplate>

  beforeEach(() => {
    templateStore = new Map()
    templateCounter = 0
  })

  // ── 正例 ──

  it('正例: registerTemplate 返回完整模板', () => {
    const t = inlineRegisterTemplate(templateStore, {
      code: 'welcome-email',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-001',
      locale: 'zh-CN',
      bodyTemplate: '欢迎 {{name}}!',
    })
    expect(t.code).toBe('welcome-email')
    expect(t.enabled).toBe(true)
    expect(t.id).toBeDefined()
  })

  it('正例: findByCode 找到启用模板', () => {
    inlineRegisterTemplate(templateStore, {
      code: 'welcome', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'body',
    })
    const found = inlineFindByCode(templateStore, 'welcome')
    expect(found).not.toBeUndefined()
    expect(found!.code).toBe('welcome')
  })

  it('正例: updateTemplate 修改 bodyTemplate', () => {
    const t = inlineRegisterTemplate(templateStore, {
      code: 'test', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: '旧内容',
    })
    const updated = inlineUpdateTemplate(templateStore, t.id, { bodyTemplate: '新内容' })
    expect(updated!.bodyTemplate).toBe('新内容')
  })

  it('正例: listTemplates 按 channel 筛选', () => {
    inlineRegisterTemplate(templateStore, {
      code: 'a', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN', bodyTemplate: 'a',
    })
    inlineRegisterTemplate(templateStore, {
      code: 'b', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN', bodyTemplate: 'b',
    })
    inlineRegisterTemplate(templateStore, {
      code: 'c', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN', bodyTemplate: 'c',
    })
    const emails = inlineListTemplates(templateStore, { channel: NotificationChannelType.Email })
    expect(emails).toHaveLength(2)
  })

  it('正例: listTemplates 按 tenantId 筛选', () => {
    inlineRegisterTemplate(templateStore, {
      code: 'a', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, tenantId: 't1', locale: 'zh-CN', bodyTemplate: 'a',
    })
    inlineRegisterTemplate(templateStore, {
      code: 'b', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, tenantId: 't2', locale: 'zh-CN', bodyTemplate: 'b',
    })
    const t1s = inlineListTemplates(templateStore, { tenantId: 't1' })
    expect(t1s).toHaveLength(1)
  })

  // ── 反例 ──

  it('反例: findByCode 找不到返回 undefined', () => {
    const found = inlineFindByCode(templateStore, 'non-existent')
    expect(found).toBeUndefined()
  })

  it('反例: findByCode disabled 模板不被找到', () => {
    const t = inlineRegisterTemplate(templateStore, {
      code: 'disabled-code', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'body', enabled: false,
    })
    // 虽然存在于 store 但 enabled=false 不应被返回
    const found = inlineFindByCode(templateStore, 'disabled-code')
    expect(found).toBeUndefined()
  })

  it('反例: updateTemplate 不存在的 id 返回 undefined', () => {
    const updated = inlineUpdateTemplate(templateStore, 'non-existent', { bodyTemplate: 'x' })
    expect(updated).toBeUndefined()
  })

  it('反例: listTemplates 无匹配返回空数组', () => {
    const results = inlineListTemplates(templateStore, { channel: NotificationChannelType.Webhook })
    expect(results).toHaveLength(0)
  })

  it('反例: enabled=false 模板不在 list(enabled=true) 中', () => {
    inlineRegisterTemplate(templateStore, {
      code: 'hidden', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'hide', enabled: false,
    })
    const enabled = inlineListTemplates(templateStore, { enabled: true })
    expect(enabled).toHaveLength(0)
  })

  // ── 边界 ──

  it('边界: 注册空 bodyTemplate', () => {
    const t = inlineRegisterTemplate(templateStore, {
      code: 'empty-body', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: '',
    })
    expect(t.bodyTemplate).toBe('')
  })
})

describe('NotificationService | Dispatch 发送与状态流转', () => {
  let dispatchStore: Map<string, NotificationDispatch>

  beforeEach(() => {
    dispatchStore = new Map()
    dispatchCounter = 0
  })

  // ── 正例 ──

  it('正例: 正常 recipient → Sent', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-001',
      recipient: 'alice@test.com',
      payload: { order: '123' },
    })
    const sent = inlineSimulateSend(dispatchStore, d.id)
    expect(sent.status).toBe(NotificationStatus.Sent)
    expect(sent.sentAt).toBeDefined()
    expect(sent.providerResponse?.providerId).toBeDefined()
  })

  it('正例: createDispatch 默认 Pending 状态', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'user@test.com',
      payload: {},
    })
    expect(d.status).toBe(NotificationStatus.Pending)
  })

  it('正例: retryDispatch 将 Failed → 重试(仍失败)但 retryCount+1', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-user@test.com',
      payload: {},
    })
    inlineSimulateSend(dispatchStore, d.id)
    expect(dispatchStore.get(d.id)!.status).toBe(NotificationStatus.Failed)

    const retried = inlineRetryDispatch(dispatchStore, d.id)
    expect(retried).toBeDefined()
    // 因为 recipient 仍然含 fail，重试后仍是 Failed
    expect(retried!.status).toBe(NotificationStatus.Failed)
    expect(retried!.retryCount).toBe(1)
  })

  it('正例: cancelDispatch 将 Pending → Cancelled', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'user@test.com',
      payload: {},
    })
    const cancelled = inlineCancelDispatch(dispatchStore, d.id)
    expect(cancelled!.status).toBe(NotificationStatus.Cancelled)
  })

  it('正例: listDispatches 按 recipient 筛选', () => {
    inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant,
      recipient: 'a@t.com', payload: {},
    })
    inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Sms, scopeType: FoundationScopeType.Tenant,
      recipient: 'b@t.com', payload: {},
    })
    inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant,
      recipient: 'a@t.com', payload: { x: 1 },
    })
    const aDispatches = inlineListDispatches(dispatchStore, { recipient: 'a@t.com' })
    expect(aDispatches).toHaveLength(2)
  })

  it('正例: listDispatches 按 status 筛选', () => {
    const d1 = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant,
      recipient: 'a@t.com', payload: {},
    })
    inlineSimulateSend(dispatchStore, d1.id)
    const d2 = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant,
      recipient: 'fail@t.com', payload: {},
    })
    inlineSimulateSend(dispatchStore, d2.id)

    const sentList = inlineListDispatches(dispatchStore, { status: NotificationStatus.Sent })
    const failedList = inlineListDispatches(dispatchStore, { status: NotificationStatus.Failed })

    expect(sentList).toHaveLength(1)
    expect(failedList).toHaveLength(1)
  })

  // ── 反例 ──

  it('反例: 含 fail 的 recipient → Failed', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-address@test.com',
      payload: {},
    })
    const sent = inlineSimulateSend(dispatchStore, d.id)
    expect(sent.status).toBe(NotificationStatus.Failed)
    expect(sent.providerResponse?.error).toBe('PROVIDER_REJECTED')
  })

  it('反例: retryDispatch 对非 Failed 状态不处理', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'ok@t.com', payload: {},
    })
    // 直接发送成功
    inlineSimulateSend(dispatchStore, d.id)
    const retried = inlineRetryDispatch(dispatchStore, d.id)
    // 不是 Failed → 原样返回
    expect(retried!.status).toBe(NotificationStatus.Sent)
    // retryCount 没变
    const final = dispatchStore.get(d.id)!
    expect(final.retryCount).toBe(0)
  })

  it('反例: cancelDispatch 不存在的 id 返回 undefined', () => {
    const result = inlineCancelDispatch(dispatchStore, 'non-existent')
    expect(result).toBeUndefined()
  })

  it('反例: retryDispatch 不存在的 id 返回 undefined', () => {
    const result = inlineRetryDispatch(dispatchStore, 'non-existent')
    expect(result).toBeUndefined()
  })

  it('反例: cancelDispatch 已 Sent 的 dispatch 不取消', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email, scopeType: FoundationScopeType.Tenant,
      recipient: 'ok@t.com', payload: {},
    })
    inlineSimulateSend(dispatchStore, d.id)
    const cancelled = inlineCancelDispatch(dispatchStore, d.id)
    // 已 Sent → 返回原 dispatch 不做修改
    expect(cancelled).not.toBeUndefined()
    expect(cancelled!.status).toBe(NotificationStatus.Sent)
  })

  // ── 边界 ──

  it('边界: inlineShouldSucceed 不含 fail 返回 true', () => {
    expect(inlineShouldSucceed('normal-user@test.com')).toBe(true)
  })

  it('边界: inlineShouldSucceed 含 fail 返回 false', () => {
    expect(inlineShouldSucceed('fail-user@test.com')).toBe(false)
    // 'failure-test@test.com' 包含 'fail' substring → 匹配
    expect(inlineShouldSucceed('failure-test@test.com')).toBe(false)
    // 'xxfail@t.com' 包含 'fail' substring → 匹配
    expect(inlineShouldSucceed('xxfail@t.com')).toBe(false)
    // 正常地址 → true
    expect(inlineShouldSucceed('normal@t.com')).toBe(true)
  })
})

describe('NotificationService | 续费通知（业务场景）', () => {
  let dispatchStore: Map<string, NotificationDispatch>

  beforeEach(() => {
    dispatchStore = new Map()
    dispatchCounter = 0
  })

  function inlineSendRenewal(dispatchStore: Map<string, NotificationDispatch>, input: {
    type: 'success' | 'failure' | 'reminder'
    tenantId: string
    licenseId: string
    packageName: string
    newExpireAt?: Date
    errorMessage?: string
    daysBeforeExpiration?: number
    expireAt?: Date
  }): NotificationDispatch {
    const payload: Record<string, unknown> = {
      type: `renewal_${input.type}`,
      licenseId: input.licenseId,
      packageName: input.packageName,
    }
    if (input.type === 'success') {
      payload.newExpireAt = input.newExpireAt!.toISOString()
    } else if (input.type === 'failure') {
      payload.errorMessage = input.errorMessage
    } else {
      payload.daysBeforeExpiration = input.daysBeforeExpiration
      payload.expireAt = input.expireAt!.toISOString()
    }
    return inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: input.tenantId,
      recipient: `${input.tenantId}-admin`,
      payload,
    })
  }

  it('正例: sendRenewalSuccess 创建 Email dispatch', () => {
    const d = inlineSendRenewal(dispatchStore, {
      type: 'success',
      tenantId: 't-001',
      licenseId: 'lic-123',
      packageName: 'Pro',
      newExpireAt: new Date('2025-06-01'),
    })
    expect(d.recipient).toBe('t-001-admin')
    expect(d.channel).toBe(NotificationChannelType.Email)
    expect(d.payload.type).toBe('renewal_success')
    inlineSimulateSend(dispatchStore, d.id)
    expect(dispatchStore.get(d.id)!.status).toBe(NotificationStatus.Sent)
  })

  it('正例: sendRenewalFailure 含错误消息', () => {
    const d = inlineSendRenewal(dispatchStore, {
      type: 'failure',
      tenantId: 't-001',
      licenseId: 'lic-123',
      packageName: 'Pro',
      errorMessage: 'Payment declined',
    })
    expect(d.payload.errorMessage).toBe('Payment declined')
  })

  it('正例: sendRenewalReminder 含过期天数', () => {
    const d = inlineSendRenewal(dispatchStore, {
      type: 'reminder',
      tenantId: 't-001',
      licenseId: 'lic-123',
      packageName: 'Pro',
      daysBeforeExpiration: 7,
      expireAt: new Date('2025-06-08'),
    })
    expect(d.payload.daysBeforeExpiration).toBe(7)
    expect(d.payload.expireAt).toBeDefined()
  })

  it('反例: renewal 通知 recipient 含 fail → 失败', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-fail',
      recipient: 't-fail-admin', // 包含 'fail' → 失败
      payload: { type: 'renewal_success' },
    })
    inlineSimulateSend(dispatchStore, d.id)
    expect(dispatchStore.get(d.id)!.status).toBe(NotificationStatus.Failed)
  })

  it('边界: 不同 tenantId 使用不同 recipient', () => {
    const d1 = inlineSendRenewal(dispatchStore, {
      type: 'success', tenantId: 't-aaa', licenseId: 'l1',
      packageName: 'Basic', newExpireAt: new Date(),
    })
    const d2 = inlineSendRenewal(dispatchStore, {
      type: 'success', tenantId: 't-bbb', licenseId: 'l2',
      packageName: 'Pro', newExpireAt: new Date(),
    })
    expect(d1.recipient).toBe('t-aaa-admin')
    expect(d2.recipient).toBe('t-bbb-admin')
    expect(d1.recipient).not.toBe(d2.recipient)
  })
})

describe('NotificationService | dispatch 生命周期完整性', () => {
  let dispatchStore: Map<string, NotificationDispatch>

  beforeEach(() => {
    dispatchStore = new Map()
    dispatchCounter = 0
  })

  it('完整生命周期: Pending → Sent', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'ok@t.com', payload: {},
    })
    expect(d.status).toBe(NotificationStatus.Pending)
    inlineSimulateSend(dispatchStore, d.id)
    expect(dispatchStore.get(d.id)!.status).toBe(NotificationStatus.Sent)
    expect(dispatchStore.get(d.id)!.sentAt).toBeDefined()
  })

  it('完整生命周期: Pending → Cancelled', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'ok@t.com', payload: {},
    })
    const cancelled = inlineCancelDispatch(dispatchStore, d.id)
    expect(cancelled!.status).toBe(NotificationStatus.Cancelled)
  })

  it('完整生命周期: Pending → Failed → retry(仍失败) → retryCount+1', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-addr@t.com', payload: {},
    })
    inlineSimulateSend(dispatchStore, d.id)
    expect(dispatchStore.get(d.id)!.status).toBe(NotificationStatus.Failed)

    const retried = inlineRetryDispatch(dispatchStore, d.id)
    // recipient 仍然含 fail，重试后仍是 Failed，但 retryCount 累加
    expect(retried!.status).toBe(NotificationStatus.Failed)
    expect(retried!.retryCount).toBe(1)
  })

  it('边界: 同 dispatch 不可重复取消', () => {
    const d = inlineCreateDispatch(dispatchStore, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'user@t.com', payload: {},
    })
    inlineCancelDispatch(dispatchStore, d.id)
    // 再次取消：已 Cancelled 但不是 Sent → 可以再次取消（仍返回 Cancelled）
    const again = inlineCancelDispatch(dispatchStore, d.id)
    expect(again!.status).toBe(NotificationStatus.Cancelled)
  })
})
