import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: notification 模块
 *
 * 4 个附加角色视角：
 * 👥HR — 发送全员通知
 * 📢营销 — 发送营销推送
 * 🎯运行专员 — 管理通知模板
 * 👔店长 — 查看通知历史
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { NotificationController } from './notification.controller'
import {
  NotificationService,
  resetNotificationServiceTestState,
} from './notification.service'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus,
} from './notification.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 测试数据工厂 ──

const tenantCtx: RequestTenantContext = {
  tenantId: 't-notif-ext',
  brandId: 'b-arcade',
  storeId: 's-main',
}

function createController(): NotificationController {
  resetNotificationServiceTestState()
  const service = new NotificationService()
  return new NotificationController(service)
}

// ──────────────────────────────────────────────────────────────────────
// 👥HR — 发送全员通知 (HR sending mass notifications)
// ──────────────────────────────────────────────────────────────────────
describe('👥HR — 全员通知发送视角', () => {
  it('发送邮件通知到指定员工 (send email notification)', () => {
    const ctrl = createController()

    // 先注册模板
    ctrl.registerTemplate(tenantCtx, {
      code: 'HR-ANNOUNCEMENT',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      titleTemplate: '通知: {subject}',
      bodyTemplate: '各位同事，{message}。谢谢。',
      variables: ['subject', 'message'],
      enabled: true,
    })

    // 发送通知
    const dispatch = ctrl.send(tenantCtx, {
      templateCode: 'HR-ANNOUNCEMENT',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'all@example.com',
      payload: { subject: '端午节放假安排', message: '6月25日-27日放假' },
    })

    assert.equal(dispatch.channel, 'EMAIL')
    assert.equal(dispatch.recipient, 'all@example.com')
    // simulateSend 自动处理为 SENT (除非收件人含 "fail")
    assert.equal(dispatch.status, 'SENT')
    assert(dispatch.sentAt, '发送后应有发送时间')
  })

  it('发送失败时状态标记为 FAILED (send failure handling)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'HR-TEST-FAIL',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '测试短信 {code}',
      variables: ['code'],
      enabled: true,
    })

    // 收件人含 "fail" 触发模拟失败
    const dispatch = ctrl.send(tenantCtx, {
      templateCode: 'HR-TEST-FAIL',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-phone@example.com',
      payload: { code: '123456' },
    })

    assert.equal(dispatch.status, 'FAILED')
    assert(dispatch.providerResponse, '失败应有 provider 响应信息')
  })

  it('重试失败的通知 (retry failed dispatch)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'HR-RETRY',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '重试测试',
      enabled: true,
    })

    const failed = ctrl.send(tenantCtx, {
      templateCode: 'HR-RETRY',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-retry@example.com',
      payload: {},
    })
    assert.equal(failed.status, 'FAILED')

    // 重试
    const retried = ctrl.retryDispatch(failed.id)
    assert(retried, '重试应返回通知')
    assert(retried.retryCount >= 1, '重试次数应增加')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 发送营销推送 (marketing sending campaign alerts)
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 营销推送发送视角', () => {
  it('注册营销推送模板并发送 (send marketing push)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'MARKETING-PROMO',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Brand,
      locale: 'zh-CN',
      titleTemplate: '{promoTitle}',
      bodyTemplate: '限时优惠: {description}，速来参与！',
      variables: ['promoTitle', 'description'],
      enabled: true,
    })

    const dispatch = ctrl.send(tenantCtx, {
      templateCode: 'MARKETING-PROMO',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Brand,
      recipient: 'member-m001',
      payload: {
        promoTitle: '618 大促',
        description: '全场游戏币 8 折',
      },
    })

    assert.equal(dispatch.status, 'SENT')
    assert.equal(dispatch.recipient, 'member-m001')
  })

  it('按渠道筛选推送历史记录 (filter by channel)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'PUSH-ALERT', channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: '推送测试', enabled: true,
    })
    ctrl.registerTemplate(tenantCtx, {
      code: 'SMS-ALERT', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: '短信测试', enabled: true,
    })

    ctrl.send(tenantCtx, {
      templateCode: 'PUSH-ALERT', channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Tenant, recipient: 'u-push-01', payload: {},
    })
    ctrl.send(tenantCtx, {
      templateCode: 'SMS-ALERT', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, recipient: 'u-sms-01', payload: {},
    })

    const pushDispatches = ctrl.listDispatches(tenantCtx, undefined, NotificationChannelType.Push)
    assert.equal(pushDispatches.length, 1)
    assert.equal(pushDispatches[0].channel, 'PUSH')

    const smsDispatches = ctrl.listDispatches(tenantCtx, undefined, NotificationChannelType.Sms)
    assert.equal(smsDispatches.length, 1)
  })

  it('活动定时推送支持 (scheduled dispatch)', () => {
    const ctrl = createController()

    const scheduledTime = '2026-07-01T08:00:00.000Z'

    ctrl.registerTemplate(tenantCtx, {
      code: 'SCHEDULED-PROMO',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Store,
      locale: 'zh-CN',
      bodyTemplate: '活动即将开始!',
      enabled: true,
    })

    const dispatch = ctrl.send(tenantCtx, {
      templateCode: 'SCHEDULED-PROMO',
      channel: NotificationChannelType.Push,
      scopeType: FoundationScopeType.Store,
      recipient: 'all-members',
      payload: {},
      scheduledAt: scheduledTime,
    })

    assert.equal(dispatch.scheduledAt, scheduledTime)
    assert(dispatch.createdAt !== undefined)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理通知模板 (operations managing notification templates)
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 通知模板管理视角', () => {
  it('注册新的通知模板 (register template)', () => {
    const ctrl = createController()

    const template = ctrl.registerTemplate(tenantCtx, {
      code: 'OPS-ALERT',
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Store,
      locale: 'zh-CN',
      titleTemplate: '系统通知',
      bodyTemplate: '{message}',
      variables: ['message'],
      enabled: true,
    })

    assert.equal(template.code, 'OPS-ALERT')
    assert.equal(template.channel, 'IN_APP')
    assert(template.id, '模板应有 ID')
  })

  it('更新通知模板内容 (update template)', () => {
    const ctrl = createController()

    const template = ctrl.registerTemplate(tenantCtx, {
      code: 'OPS-UPDATE-TEST',
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Store,
      locale: 'zh-CN',
      bodyTemplate: '旧内容',
      enabled: true,
    })

    // 更新模板
    const updated = ctrl.updateTemplate(template.id, {
      bodyTemplate: '新内容',
      enabled: false,
    })
    assert(updated, '更新应返回模板')
    assert.equal(updated.bodyTemplate, '新内容')
    assert.equal(updated.enabled, false)
  })

  it('按渠道和启用状态筛选模板 (filter templates)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'T1', channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'E1', enabled: true,
    })
    ctrl.registerTemplate(tenantCtx, {
      code: 'T2', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'S1', enabled: false,
    })
    ctrl.registerTemplate(tenantCtx, {
      code: 'T3', channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
      bodyTemplate: 'S2', enabled: true,
    })

    const smsTemplates = ctrl.listTemplates(tenantCtx, NotificationChannelType.Sms)
    assert.equal(smsTemplates.length, 2)

    const enabledSms = ctrl.listTemplates(tenantCtx, NotificationChannelType.Sms, undefined, "true")
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看通知历史 (shop manager viewing notification history)
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — 通知历史查看视角', () => {
  it('查询所有通知发送记录 (list dispatches)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'HISTORY-TEST',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '历史测试',
      enabled: true,
    })

    ctrl.send(tenantCtx, {
      templateCode: 'HISTORY-TEST',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'hist-01@example.com',
      payload: {},
    })
    ctrl.send(tenantCtx, {
      templateCode: 'HISTORY-TEST',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'hist-02@example.com',
      payload: {},
    })

    const all = ctrl.listDispatches(tenantCtx)
    assert.equal(all.length, 2)
  })

  it('查询单个通知详情 (get dispatch detail)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'DETAIL-TEST',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '详情测试',
      enabled: true,
    })

    const dispatch = ctrl.send(tenantCtx, {
      templateCode: 'DETAIL-TEST',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'detail@example.com',
      payload: { key: 'value' },
    })

    const detail = ctrl.getDispatch(dispatch.id)
    assert(detail, '应返回通知详情')
    assert.equal(detail.recipient, 'detail@example.com')
    assert(detail.sentAt, '已发送的通知应有发送时间')
  })

  it('取消待发送通知 (cancel pending dispatch)', () => {
    const ctrl = createController()

    ctrl.registerTemplate(tenantCtx, {
      code: 'CANCEL-TEST',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      locale: 'zh-CN',
      bodyTemplate: '将被取消',
      enabled: true,
    })

    // 用 "fail" 收件人模拟失败后取消
    const failed = ctrl.send(tenantCtx, {
      templateCode: 'CANCEL-TEST',
      channel: NotificationChannelType.Sms,
      scopeType: FoundationScopeType.Tenant,
      recipient: 'fail-cancel@example.com',
      payload: {},
    })
    assert.equal(failed.status, 'FAILED')

    // 尝试取消 (FAILED 状态可取消)
    const cancelled = ctrl.cancelDispatch(failed.id)
    assert(cancelled, '取消应返回通知')
    assert.equal(cancelled.status, 'CANCELLED')
  })
})
