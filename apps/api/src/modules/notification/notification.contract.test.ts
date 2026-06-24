/**
 * 🐜 自动: [notification] [D] contract 测试补全
 * 覆盖: toNotificationTemplateContract / toNotificationDispatchContract
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  toNotificationDispatchContract,
  toNotificationTemplateContract
} from './notification.contract'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
  toNotificationDispatch,
  toNotificationTemplate
} from './notification.entity'

describe('toNotificationTemplateContract()', () => {
  test('映射所有字段到 contract', () => {
    const entity = toNotificationTemplate({
      code: 'welcome_email',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-1',
      locale: 'zh-CN',
      bodyTemplate: '欢迎 {{name}}',
      variables: ['name'],
      titleTemplate: '🎉'
    })

    const contract = toNotificationTemplateContract(entity)
    assert.equal(contract.id, entity.id)
    assert.equal(contract.code, 'welcome_email')
    assert.equal(contract.channel, 'EMAIL')
    assert.equal(contract.scopeType, 'TENANT')
    assert.equal(contract.tenantId, 't-1')
    assert.equal(contract.locale, 'zh-CN')
    assert.equal(contract.bodyTemplate, '欢迎 {{name}}')
    assert.deepStrictEqual(contract.variables, ['name'])
    assert.equal(contract.titleTemplate, '🎉')
    assert.equal(contract.enabled, true)
  })

  test('enabled 字段传递正确', () => {
    const enabledEntity = toNotificationTemplate({
      code: 'enabled_test',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Store,
      locale: 'en-US',
      bodyTemplate: 'Hello',
      enabled: true
    })
    assert.equal(toNotificationTemplateContract(enabledEntity).enabled, true)

    const disabledEntity = toNotificationTemplate({
      code: 'disabled_test',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Store,
      locale: 'en-US',
      bodyTemplate: 'Hello',
      enabled: false
    })
    assert.equal(toNotificationTemplateContract(disabledEntity).enabled, false)
  })
})

describe('toNotificationDispatchContract()', () => {
  test('映射所有字段到 contract', () => {
    const entity = toNotificationDispatch({
      templateId: 'tpl-001',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Store,
      tenantId: 't-1',
      brandId: 'b-1',
      storeId: 's-1',
      recipient: '+8613800000001',
      payload: { code: '123456' }
    })

    // Simulate post-send state
    const sentEntity = { ...entity, status: NotificationStatus.Sent, sentAt: new Date().toISOString() }
    const contract = toNotificationDispatchContract(sentEntity)

    assert.equal(contract.id, entity.id)
    assert.equal(contract.templateId, 'tpl-001')
    assert.equal(contract.channel, 'SMS')
    assert.equal(contract.scopeType, 'STORE')
    assert.equal(contract.recipient, '+8613800000001')
    assert.deepStrictEqual(contract.payload, { code: '123456' })
    assert.equal(contract.status, 'SENT')
    assert.equal(contract.retryCount, 0)
    assert.ok(contract.sentAt)
  })

  test('FAILED 状态含 providerResponse', () => {
    const entity = toNotificationDispatch({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail@test.com',
      payload: {}
    })
    const failedEntity = {
      ...entity,
      status: NotificationStatus.Failed,
      providerResponse: { error: 'PROVIDER_REJECTED' }
    }
    const contract = toNotificationDispatchContract(failedEntity)
    assert.equal(contract.status, 'FAILED')
    assert.deepStrictEqual(contract.providerResponse, { error: 'PROVIDER_REJECTED' })
  })

  test('CANCELLED 状态正确传递', () => {
    const entity = toNotificationDispatch({
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Store,
      recipient: 'user-123',
      payload: { message: 'test' }
    })
    const cancelledEntity = { ...entity, status: NotificationStatus.Cancelled }
    const contract = toNotificationDispatchContract(cancelledEntity)
    assert.equal(contract.status, 'CANCELLED')
  })
})
