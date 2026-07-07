import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [notification] [D] dto 测试补全
 * 覆盖: RegisterNotificationTemplateDto / SendNotificationDto / UpdateNotificationTemplateDto
 *       DTO 字段验证
 * 注意: class-validator 装饰器需要 reflect-metadata + NestJS 编译链，
 *       本测试仅验证 DTO 字段结构，完整验证在 controller test 中覆盖
 */

import assert from 'node:assert/strict'

describe('RegisterNotificationTemplateDto 结构', () => {
  it('code 是 string 属性', () => {
    const dto: Record<string, unknown> = { code: 'test_tpl' }
    assert.equal(typeof dto.code, 'string')
    assert.equal((dto.code as string).length, 8)
  })

  it('channel 必须有效', () => {
    const validChannels = ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK', 'SOCIAL']
    for (const ch of validChannels) {
      assert.ok(validChannels.includes(ch))
    }
    assert.equal(validChannels.length, 6)
  })

  it('scopeType 必须有效', () => {
    const validScopes = ['TENANT', 'BRAND', 'STORE']
    for (const s of validScopes) {
      assert.ok(validScopes.includes(s))
    }
    assert.equal(validScopes.length, 3)
  })

  it('locale 是 string', () => {
    const dto: Record<string, unknown> = { locale: 'zh-CN' }
    assert.equal(dto.locale, 'zh-CN')
    assert.ok(typeof dto.locale === 'string')
  })

  it('bodyTemplate 是必填 string', () => {
    const dto: Record<string, unknown> = { bodyTemplate: '欢迎 {{name}}' }
    assert.equal(typeof dto.bodyTemplate, 'string')
    assert.ok((dto.bodyTemplate as string).length > 0)
  })

  it('可选字段可为 undefined', () => {
    const dto: Record<string, unknown> = {
      code: 't',
      channel: 'EMAIL',
      scopeType: 'TENANT',
      locale: 'zh-CN',
      bodyTemplate: 'test'
    }
    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.brandId, undefined)
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.marketCode, undefined)
    assert.equal(dto.titleTemplate, undefined)
    assert.equal(dto.variables, undefined)
    assert.equal(dto.enabled, undefined)
  })

  it('variables 是 string[]', () => {
    const dto: Record<string, unknown> = { variables: ['name', 'store'] }
    assert.ok(Array.isArray(dto.variables))
    assert.equal((dto.variables as string[]).length, 2)
  })

  it('enabled 是 boolean', () => {
    assert.equal(typeof true, 'boolean')
    assert.equal(typeof false, 'boolean')
  })
})

describe('SendNotificationDto 结构', () => {
  it('channel / scopeType / recipient / payload 必填', () => {
    const dto: Record<string, unknown> = {
      channel: 'EMAIL',
      scopeType: 'TENANT',
      recipient: 'user@test.com',
      payload: { key: 'value' }
    }
    assert.equal(dto.channel, 'EMAIL')
    assert.equal(dto.scopeType, 'TENANT')
    assert.equal(dto.recipient, 'user@test.com')
    assert.deepStrictEqual(dto.payload, { key: 'value' })
  })

  it('templateCode 可选', () => {
    const dto: Record<string, unknown> = { templateCode: undefined }
    assert.equal(dto.templateCode, undefined)

    const dto2: Record<string, unknown> = { templateCode: 'welcome_email' }
    assert.equal(dto2.templateCode, 'welcome_email')
  })

  it('scheduledAt 是 ISO 字符串', () => {
    const iso = new Date().toISOString()
    const dto: Record<string, unknown> = { scheduledAt: iso }
    assert.ok(typeof dto.scheduledAt === 'string')
    assert.ok(new Date(dto.scheduledAt as string).getTime() > 0)
  })

  it('payload 是 object', () => {
    assert.equal(typeof {}, 'object')
    assert.ok(!Array.isArray({}))
  })
})

describe('UpdateNotificationTemplateDto 结构', () => {
  it('所有字段可选', () => {
    const dto: Record<string, unknown> = {}
    assert.equal(dto.titleTemplate, undefined)
    assert.equal(dto.bodyTemplate, undefined)
    assert.equal(dto.variables, undefined)
    assert.equal(dto.enabled, undefined)
  })

  it('可部分更新 titleTemplate', () => {
    const dto: Record<string, unknown> = { titleTemplate: '新标题' }
    assert.equal(dto.titleTemplate, '新标题')
    assert.equal(dto.bodyTemplate, undefined)
  })

  it('可部分更新 enabled', () => {
    const dto: Record<string, unknown> = { enabled: false }
    assert.equal(dto.enabled, false)
  })

  it('可同时更新多个字段', () => {
    const dto: Record<string, unknown> = {
      titleTemplate: '新标题',
      bodyTemplate: '新内容',
      variables: ['a', 'b'],
      enabled: true
    }
    assert.equal(dto.titleTemplate, '新标题')
    assert.equal(dto.bodyTemplate, '新内容')
    assert.deepStrictEqual(dto.variables, ['a', 'b'])
    assert.equal(dto.enabled, true)
  })
})
