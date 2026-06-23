/**
 * 🐜 自动: [notification] [D] entity 测试补全
 * 覆盖: NotificationChannelType / NotificationStatus / FoundationScopeType 枚举
 *       toNotificationTemplate / toNotificationDispatch factory
 *       NotificationTemplate / NotificationDispatch 接口
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
  toNotificationDispatch,
  toNotificationTemplate
} from './notification.entity'

// ── 枚举测试 ──

describe('NotificationChannelType 枚举', () => {
  test('包含 EMAIL / SMS / PUSH / IN_APP / WEBHOOK / SOCIAL', () => {
    assert.equal(NotificationChannelType.Email, 'EMAIL')
    assert.equal(NotificationChannelType.Sms, 'SMS')
    assert.equal(NotificationChannelType.Push, 'PUSH')
    assert.equal(NotificationChannelType.InApp, 'IN_APP')
    assert.equal(NotificationChannelType.Webhook, 'WEBHOOK')
    assert.equal(NotificationChannelType.Social, 'SOCIAL')
  })

  test('共 6 个渠道类型', () => {
    assert.equal(Object.values(NotificationChannelType).length, 6)
  })

  test('枚举值均为不同字符串', () => {
    const values = Object.values(NotificationChannelType)
    const unique = new Set(values)
    assert.equal(unique.size, values.length)
  })
})

describe('NotificationStatus 枚举', () => {
  test('包含 PENDING / SENT / FAILED / CANCELLED', () => {
    assert.equal(NotificationStatus.Pending, 'PENDING')
    assert.equal(NotificationStatus.Sent, 'SENT')
    assert.equal(NotificationStatus.Failed, 'FAILED')
    assert.equal(NotificationStatus.Cancelled, 'CANCELLED')
  })

  test('共 4 个状态值', () => {
    assert.equal(Object.values(NotificationStatus).length, 4)
  })
})

describe('FoundationScopeType 枚举', () => {
  test('包含 TENANT / BRAND / STORE', () => {
    assert.equal(FoundationScopeType.Tenant, 'TENANT')
    assert.equal(FoundationScopeType.Brand, 'BRAND')
    assert.equal(FoundationScopeType.Store, 'STORE')
  })

  test('共 3 个 scope 类型', () => {
    assert.equal(Object.values(FoundationScopeType).length, 3)
  })
})

// ── Factory 测试 ──

describe('toNotificationTemplate()', () => {
  const baseInput = {
    code: 'welcome_email',
    channel: NotificationChannelType.Email,
    scopeType: FoundationScopeType.Tenant,
    locale: 'zh-CN',
    bodyTemplate: '欢迎 {{username}} 加入!'
  }

  test('生成 NotificationTemplate 含必填字段', () => {
    const result = toNotificationTemplate(baseInput)
    assert.ok(result.id.startsWith('welcome_email-'))
    assert.equal(result.code, 'welcome_email')
    assert.equal(result.channel, 'EMAIL')
    assert.equal(result.scopeType, 'TENANT')
    assert.equal(result.locale, 'zh-CN')
    assert.equal(result.bodyTemplate, '欢迎 {{username}} 加入!')
  })

  test('默认 enabled = true', () => {
    const result = toNotificationTemplate(baseInput)
    assert.equal(result.enabled, true)
  })

  test('默认 variables = []', () => {
    const result = toNotificationTemplate(baseInput)
    assert.deepStrictEqual(result.variables, [])
  })

  test('可使用自定义 variables', () => {
    const result = toNotificationTemplate({ ...baseInput, variables: ['username', 'store_name'] })
    assert.deepStrictEqual(result.variables, ['username', 'store_name'])
  })

  test('可设置 enabled = false', () => {
    const result = toNotificationTemplate({ ...baseInput, enabled: false })
    assert.equal(result.enabled, false)
  })

  test('含 createdAt 和 updatedAt ISO 时间戳', () => {
    const result = toNotificationTemplate(baseInput)
    assert.ok(new Date(result.createdAt).getTime() > 0)
    assert.ok(new Date(result.updatedAt).getTime() > 0)
    assert.equal(result.createdAt, result.updatedAt)
  })

  test('tenantId / brandId / storeId / marketCode 默认 undefined', () => {
    const result = toNotificationTemplate(baseInput)
    assert.equal(result.tenantId, undefined)
    assert.equal(result.brandId, undefined)
    assert.equal(result.storeId, undefined)
    assert.equal(result.marketCode, undefined)
    assert.equal(result.titleTemplate, undefined)
  })

  test('可设置 tenantId / marketCode / titleTemplate', () => {
    const result = toNotificationTemplate({
      ...baseInput,
      tenantId: 't-1',
      marketCode: 'cn-mainland',
      titleTemplate: '🎉 欢迎 {{username}}'
    })
    assert.equal(result.tenantId, 't-1')
    assert.equal(result.marketCode, 'cn-mainland')
    assert.equal(result.titleTemplate, '🎉 欢迎 {{username}}')
  })

  test('每次调用生成不同 id', () => {
    const a = toNotificationTemplate(baseInput)
    const b = toNotificationTemplate(baseInput)
    assert.notEqual(a.id, b.id)
  })
})

describe('toNotificationDispatch()', () => {
  const baseInput = {
    channel: NotificationChannelType.Sms,
    scopeType: FoundationScopeType.Store,
    recipient: '+8613800000001',
    payload: { code: '123456' }
  }

  test('生成 NotificationDispatch 含必填字段', () => {
    const result = toNotificationDispatch(baseInput)
    assert.ok(result.id.startsWith('dispatch-'))
    assert.equal(result.channel, 'SMS')
    assert.equal(result.scopeType, 'STORE')
    assert.equal(result.recipient, '+8613800000001')
    assert.deepStrictEqual(result.payload, { code: '123456' })
  })

  test('默认状态为 PENDING', () => {
    const result = toNotificationDispatch(baseInput)
    assert.equal(result.status, 'PENDING')
  })

  test('默认 retryCount = 0', () => {
    const result = toNotificationDispatch(baseInput)
    assert.equal(result.retryCount, 0)
  })

  test('sentAt 默认 undefined', () => {
    const result = toNotificationDispatch(baseInput)
    assert.equal(result.sentAt, undefined)
  })

  test('可设置 scheduledAt', () => {
    const future = new Date(Date.now() + 3600000).toISOString()
    const result = toNotificationDispatch({ ...baseInput, scheduledAt: future })
    assert.equal(result.scheduledAt, future)
  })

  test('可关联 templateId', () => {
    const result = toNotificationDispatch({ ...baseInput, templateId: 'tpl-001' })
    assert.equal(result.templateId, 'tpl-001')
  })

  test('可设置 tenantId / brandId / storeId', () => {
    const result = toNotificationDispatch({
      ...baseInput,
      tenantId: 't-1',
      brandId: 'b-1',
      storeId: 's-1'
    })
    assert.equal(result.tenantId, 't-1')
    assert.equal(result.brandId, 'b-1')
    assert.equal(result.storeId, 's-1')
  })

  test('每次调用生成不同 id', () => {
    const a = toNotificationDispatch(baseInput)
    const b = toNotificationDispatch(baseInput)
    assert.notEqual(a.id, b.id)
  })
})
