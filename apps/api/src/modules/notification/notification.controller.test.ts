/**
 * 🐜 自动: [notification] [D] controller 测试补全
 * 覆盖: metadata 路由定义 + route handler 运行行为 + 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { NotificationController } from './notification.controller'
import type { NotificationService } from './notification.service'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
  toNotificationDispatch,
  toNotificationTemplate
} from './notification.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const sampleCtx: RequestTenantContext = {
  tenantId: 't-1',
  brandId: 'b-1',
  storeId: 's-1',
  marketCode: 'cn-mainland'
}

// ── Metadata 测试 ──

describe('NotificationController 路由 metadata', () => {
  test('controller path = "notifications"', () => {
    const path = Reflect.getMetadata('path', NotificationController)
    assert.equal(path, 'notifications')
  })

  test('POST templates 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.registerTemplate)
    const path = Reflect.getMetadata('path', NotificationController.prototype.registerTemplate)
    assert.equal(method, 1) // POST
    assert.equal(path, 'templates')
  })

  test('GET templates 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.listTemplates)
    const path = Reflect.getMetadata('path', NotificationController.prototype.listTemplates)
    assert.equal(method, 0) // GET
    assert.equal(path, 'templates')
  })

  test('GET templates/:id 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.getTemplate)
    const path = Reflect.getMetadata('path', NotificationController.prototype.getTemplate)
    assert.equal(method, 0) // GET
    assert.equal(path, 'templates/:id')
  })

  test('PATCH templates/:id 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.updateTemplate)
    const path = Reflect.getMetadata('path', NotificationController.prototype.updateTemplate)
    assert.equal(method, 4) // PATCH = 4 in NestJS RequestMethod
    assert.equal(path, 'templates/:id')
  })

  test('POST send 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.send)
    const path = Reflect.getMetadata('path', NotificationController.prototype.send)
    assert.equal(method, 1) // POST
    assert.equal(path, 'send')
  })

  test('GET dispatches 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.listDispatches)
    const path = Reflect.getMetadata('path', NotificationController.prototype.listDispatches)
    assert.equal(method, 0) // GET
    assert.equal(path, 'dispatches')
  })

  test('GET dispatches/:id 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.getDispatch)
    const path = Reflect.getMetadata('path', NotificationController.prototype.getDispatch)
    assert.equal(method, 0) // GET
    assert.equal(path, 'dispatches/:id')
  })

  test('POST dispatches/:id/retry 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.retryDispatch)
    const path = Reflect.getMetadata('path', NotificationController.prototype.retryDispatch)
    assert.equal(method, 1) // POST
    assert.equal(path, 'dispatches/:id/retry')
  })

  test('POST dispatches/:id/cancel 路由', () => {
    const method = Reflect.getMetadata('method', NotificationController.prototype.cancelDispatch)
    const path = Reflect.getMetadata('path', NotificationController.prototype.cancelDispatch)
    assert.equal(method, 1) // POST
    assert.equal(path, 'dispatches/:id/cancel')
  })
})

// ── 行为测试 - Template ──

describe('NotificationController - registerTemplate()', () => {
  test('注册模板返回 contract', () => {
    const mockService = {
      registerTemplate: () => toNotificationTemplate({
        code: 'welcome',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 't-1',
        locale: 'zh-CN',
        bodyTemplate: '欢迎 {{name}}'
      })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.registerTemplate(sampleCtx, {
      code: 'welcome',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '欢迎 {{name}}'
    } as any)

    assert.equal(result.code, 'welcome')
    assert.equal(result.channel, 'EMAIL')
    assert.equal(result.enabled, true)
  })

  test('service 抛出异常向上传播', () => {
    const mockService = {
      registerTemplate: () => { throw new Error('code already exists') }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.throws(
      () => ctrl.registerTemplate(sampleCtx, { code: 'duplicate' } as any),
      /code already exists/
    )
  })
})

describe('NotificationController - listTemplates()', () => {
  test('返回模板列表 contract', () => {
    const mockService = {
      listTemplates: () => [
        toNotificationTemplate({
          code: 't1',
          channel: NotificationChannelType.Email,
          scopeType: FoundationScopeType.Tenant,
          locale: 'zh-CN',
          bodyTemplate: 'body1'
        }),
        toNotificationTemplate({
          code: 't2',
          channel: NotificationChannelType.Sms,
          scopeType: FoundationScopeType.Store,
          locale: 'zh-CN',
          bodyTemplate: 'body2'
        })
      ]
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.listTemplates(sampleCtx)
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 2)
    assert.equal(result[0].code, 't1')
    assert.equal(result[1].code, 't2')
  })

  test('空列表返回 []', () => {
    const mockService = { listTemplates: () => [] }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.listTemplates(sampleCtx)
    assert.deepStrictEqual(result, [])
  })

  test('传递 query 参数', () => {
    const calls: any[] = []
    const mockService = {
      listTemplates: (filters: any) => {
        calls.push(filters)
        return []
      }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    ctrl.listTemplates(sampleCtx, NotificationChannelType.Email, FoundationScopeType.Tenant, 'true')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].channel, 'EMAIL')
    assert.equal(calls[0].scopeType, 'TENANT')
    assert.equal(calls[0].enabled, true)
  })

  test('enabled 参数 false', () => {
    const calls: any[] = []
    const mockService = {
      listTemplates: (filters: any) => { calls.push(filters); return [] }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    ctrl.listTemplates(sampleCtx, undefined, undefined, 'false')
    assert.equal(calls[0].enabled, false)
  })
})

describe('NotificationController - getTemplate()', () => {
  test('返回存在的模板', () => {
    const tpl = toNotificationTemplate({
      code: 'exists',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: 'exists body'
    })
    const mockService = { getTemplate: () => tpl }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.getTemplate(tpl.id)
    assert.ok(result)
    assert.equal(result!.code, 'exists')
  })

  test('返回 null 对不存在的模板', () => {
    const mockService = { getTemplate: () => undefined }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.equal(ctrl.getTemplate('nope'), null)
  })
})

describe('NotificationController - updateTemplate()', () => {
  test('更新模板返回 contract', () => {
    const tpl = toNotificationTemplate({
      code: 'to_update',
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Brand,
      locale: 'zh-CN',
      bodyTemplate: 'original'
    })
    const mockService = {
      updateTemplate: () => ({ ...tpl, titleTemplate: 'NEW', enabled: false, updatedAt: new Date().toISOString() })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.updateTemplate(tpl.id, { titleTemplate: 'NEW', enabled: false } as any)
    assert.ok(result)
    assert.equal(result!.titleTemplate, 'NEW')
    assert.equal(result!.enabled, false)
  })

  test('不存在的模板返回 null', () => {
    const mockService = { updateTemplate: () => undefined }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.equal(ctrl.updateTemplate('nope', { enabled: false } as any), null)
  })
})

// ── 行为测试 - Dispatch ──

describe('NotificationController - send()', () => {
  test('发送通知返回 dispatch contract', () => {
    const dispatch = toNotificationDispatch({
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Store,
      tenantId: 't-1',
      recipient: '+8613800000001',
      payload: { code: '123456' }
    })
    const mockService = {
      send: () => ({ ...dispatch, status: NotificationStatus.Sent, sentAt: new Date().toISOString() })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.send(sampleCtx, {
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Store,
      recipient: '+8613800000001',
      payload: { code: '123456' }
    } as any)

    assert.equal(result.channel, 'SMS')
    assert.equal(result.recipient, '+8613800000001')
    assert.equal(result.status, 'SENT')
  })

  test('发送失败时返回 FAILED 状态', () => {
    const dispatch = toNotificationDispatch({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail@test.com',
      payload: {}
    })
    const mockService = {
      send: () => ({
        ...dispatch,
        status: NotificationStatus.Failed,
        providerResponse: { error: 'PROVIDER_REJECTED' }
      })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.send(sampleCtx, {
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail@test.com',
      payload: {}
    } as any)
    assert.equal(result.status, 'FAILED')
    assert.ok(result.providerResponse)
  })

  test('service 抛出异常向上传播', () => {
    const mockService = { send: () => { throw new Error('Rate limit exceeded') } }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.throws(
      () => ctrl.send(sampleCtx, {} as any),
      /Rate limit exceeded/
    )
  })
})

describe('NotificationController - listDispatches()', () => {
  test('返回 dispatch 列表', () => {
    const d1 = toNotificationDispatch({
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Store,
      recipient: 'a',
      payload: {}
    })
    const d2 = toNotificationDispatch({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'b',
      payload: {}
    })
    const mockService = {
      listDispatches: () => [
        { ...d1, status: NotificationStatus.Sent },
        { ...d2, status: NotificationStatus.Failed }
      ]
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.listDispatches(sampleCtx)
    assert.equal(result.length, 2)
  })

  test('传递过滤参数', () => {
    const calls: any[] = []
    const mockService = {
      listDispatches: (filters: any) => { calls.push(filters); return [] }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    ctrl.listDispatches(sampleCtx, NotificationStatus.Failed, NotificationChannelType.Email, 'test@user.com')
    assert.equal(calls[0].status, 'FAILED')
    assert.equal(calls[0].channel, 'EMAIL')
    assert.equal(calls[0].recipient, 'test@user.com')
    assert.equal(calls[0].tenantId, 't-1')
  })
})

describe('NotificationController - getDispatch()', () => {
  test('返回存在的 dispatch', () => {
    const d = toNotificationDispatch({
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Store,
      recipient: 'user-x',
      payload: {}
    })
    const mockService = { getDispatch: () => ({ ...d, status: NotificationStatus.Sent }) }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.getDispatch(d.id)
    assert.ok(result)
    assert.equal(result!.id, d.id)
  })

  test('返回 null 对不存在 dispatch', () => {
    const mockService = { getDispatch: () => undefined }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.equal(ctrl.getDispatch('nope'), null)
  })
})

describe('NotificationController - retryDispatch()', () => {
  test('重试失败 dispatch', () => {
    const d = toNotificationDispatch({
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail@test.com',
      payload: {}
    })
    const mockService = {
      retryDispatch: () => ({
        ...d,
        status: NotificationStatus.Sent,
        retryCount: 1,
        sentAt: new Date().toISOString()
      })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.retryDispatch(d.id)
    assert.ok(result)
    assert.equal(result!.status, 'SENT')
    assert.equal(result!.retryCount, 1)
  })

  test('不存在 dispatch 返回 null', () => {
    const mockService = { retryDispatch: () => undefined }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.equal(ctrl.retryDispatch('nope'), null)
  })
})

describe('NotificationController - cancelDispatch()', () => {
  test('取消 dispatch', () => {
    const d = toNotificationDispatch({
      channel: NotificationChannelType.Webhook,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'cancel-me@test.com',
      payload: {}
    })
    const mockService = {
      cancelDispatch: () => ({
        ...d,
        status: NotificationStatus.Cancelled,
        updatedAt: new Date().toISOString()
      })
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    const result = ctrl.cancelDispatch(d.id)
    assert.ok(result)
    assert.equal(result!.status, 'CANCELLED')
  })

  test('不存在 dispatch 返回 null', () => {
    const mockService = { cancelDispatch: () => undefined }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    assert.equal(ctrl.cancelDispatch('nope'), null)
  })
})

// ── 边界条件 ──

describe('NotificationController - 边界条件', () => {
  test('tenantContext 正确传递给模板注册', () => {
    const calls: any[] = []
    const mockService = {
      registerTemplate: (input: any) => {
        calls.push(input)
        return toNotificationTemplate(input)
      }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    ctrl.registerTemplate(sampleCtx, {
      code: 'boundary',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: 'test'
    } as any)

    assert.equal(calls[0].tenantId, 't-1')
    assert.equal(calls[0].brandId, 'b-1')
    assert.equal(calls[0].storeId, 's-1')
  })

  test('body 中的 tenantId 覆盖 tenantContext', () => {
    const calls: any[] = []
    const mockService = {
      registerTemplate: (input: any) => {
        calls.push(input)
        return toNotificationTemplate(input)
      }
    }
    const ctrl = new NotificationController(mockService as unknown as NotificationService)
    ctrl.registerTemplate(sampleCtx, {
      code: 'override',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-override',
      locale: 'zh-CN',
      bodyTemplate: 'test'
    } as any)

    assert.equal(calls[0].tenantId, 't-override')
  })
})
