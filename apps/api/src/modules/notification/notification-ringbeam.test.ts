/**
 * notification-ringbeam.test.ts - V17#圈梁 Phase2 基础设施圈梁
 * 用途: PRD对齐测试 - 验证通知模板注册/发送/查询
 * 覆盖: 正例(模板注册+发送) + 反例(不存在的模板/Id) + 边界(重试/失败处理/批量)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  NotificationService,
  resetNotificationServiceTestState,
} from './notification.service'
import {
  NotificationChannelType,
  NotificationStatus,
  FoundationScopeType,
} from './notification.entity'

describe('🔵 NotificationRingBeam: 通知模块PRD对齐', () => {
  let notificationService: NotificationService

  beforeEach(() => {
    resetNotificationServiceTestState()
    notificationService = new NotificationService()
  })

  afterEach(() => {
    resetNotificationServiceTestState()
  })

  // ─── 1. 通知模板 ──────────────────────────────────────────────────

  describe('通知模板', () => {
    it('[P0] 注册通知模板并查询', () => {
      const template = notificationService.registerTemplate({
        code: 'welcome_email',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        locale: 'zh-CN',
        titleTemplate: '欢迎 {name}',
        bodyTemplate: '尊敬的 {name}, 欢迎加入 {platform}!',
        variables: ['name', 'platform'],
        enabled: true,
      })

      expect(template.id).toBeDefined()
      expect(template.code).toBe('welcome_email')

      const found = notificationService.getTemplate(template.id)
      expect(found).toBeDefined()
      expect(found!.code).toBe('welcome_email')
    })

    it('[P0] 按code查询已启用模板', () => {
      notificationService.registerTemplate({
        code: 'shipment_notice',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        locale: 'zh-CN',
        titleTemplate: '发货通知',
        bodyTemplate: '您的包裹已发货',
        enabled: true,
      })

      const found = notificationService.findTemplateByCode('shipment_notice')
      expect(found).toBeDefined()
      expect(found!.code).toBe('shipment_notice')
    })

    it('[P1] 不存在的模板ID返回undefined', () => {
      const found = notificationService.getTemplate('nonexistent-template-id')
      expect(found).toBeUndefined()
    })

    it('[P1] 按条件筛选模板列表', () => {
      notificationService.registerTemplate({
        code: 'tmpl_a', channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
        bodyTemplate: 'A', enabled: true,
      })
      notificationService.registerTemplate({
        code: 'tmpl_b', channel: NotificationChannelType.Push,
        scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
        bodyTemplate: 'B', enabled: false,
      })

      const templates = notificationService.listTemplates({ channel: NotificationChannelType.Email })
      expect(templates.length).toBe(1)
      expect(templates[0].code).toBe('tmpl_a')
    })

    it('[P1] 更新模板内容', () => {
      const tpl = notificationService.registerTemplate({
        code: 'updatable', channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant, locale: 'zh-CN',
        bodyTemplate: '旧内容', enabled: true,
      })

      notificationService.updateTemplate(tpl.id, {
        bodyTemplate: '新内容',
      })

      const updated = notificationService.getTemplate(tpl.id)
      expect(updated!.bodyTemplate).toBe('新内容')
    })
  })

  // ─── 2. 通知发送 ──────────────────────────────────────────────────

  describe('通知发送', () => {
    it('[P0] 发送消息后应返回dispatch记录(自动模拟发送)', () => {
      const dispatch = notificationService.send({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'test@example.com',
        payload: { type: 'test', body: '测试消息' },
      })

      expect(dispatch.id).toBeDefined()
      expect(dispatch.channel).toBe(NotificationChannelType.Email)
      expect(dispatch.status).toBe(NotificationStatus.Sent)
    })

    it('[P0] 通过getDispatch查询发送记录', () => {
      const dispatch = notificationService.send({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'user@example.com',
        payload: { subject: '订单通知' },
      })

      const found = notificationService.getDispatch(dispatch.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(dispatch.id)
    })

    it('[P1] 收件人含"fail"的应自动标记为失败', () => {
      const dispatch = notificationService.send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'fail-test@example.com',
        payload: { body: '测试失败' },
      })

      expect(dispatch.status).toBe(NotificationStatus.Failed)
      expect(dispatch.providerResponse).toBeDefined()
    })

    it('[P1] 不存在的dispatch ID查询返回undefined', () => {
      const found = notificationService.getDispatch('nonexistent-dispatch-id')
      expect(found).toBeUndefined()
    })

    it('[P1] 重试失败dispatch应始终可重试', () => {
      const dispatch = notificationService.send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'fail-test@test.com',
        payload: { msg: '需要重试' },
      })

      expect(dispatch.status).toBe(NotificationStatus.Failed)
      expect(dispatch.retryCount).toBe(0)

      const retried = notificationService.retryDispatch(dispatch.id)
      expect(retried).toBeDefined()
      expect(retried!.retryCount).toBeGreaterThanOrEqual(1)
    })

    it('[P1] listDispatches按状态过滤', () => {
      notificationService.send({
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'good@test.com',
        payload: { a: 1 },
      })
      notificationService.send({
        channel: NotificationChannelType.Sms,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'fail@test.com',
        payload: { a: 2 },
      })

      const sentItems = notificationService.listDispatches({ status: NotificationStatus.Sent })
      expect(sentItems.length).toBeGreaterThanOrEqual(1)
      sentItems.forEach(s => expect(s.status).toBe(NotificationStatus.Sent))
    })

    it('[P1] 使用模板code发送', () => {
      notificationService.registerTemplate({
        code: 'order_template',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        locale: 'zh-CN',
        bodyTemplate: '订单 {orderId}',
        enabled: true,
      })

      const dispatch = notificationService.send({
        templateCode: 'order_template',
        channel: NotificationChannelType.Email,
        scopeType: FoundationScopeType.Tenant,
        tenantId: 'tenant-demo',
        recipient: 'user@test.com',
        payload: { orderId: 'ORD-001' },
      })

      expect(dispatch.id).toBeDefined()
      expect(dispatch.templateId).toBeDefined()
    })
  })
})
