/**
 * channels.test.ts — 双通道单元测试
 *
 * WP-13A: 邮件 + 短信双通道
 * BS-0168 ~ BS-0184
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EmailPushChannel } from './email-channel'
import { SmsPushChannel } from './sms-channel'
import { DualChannelRouter } from './dual-channel-router'
import { PushBusinessPriority } from '../push-priority.enum'

describe('EmailPushChannel', () => {
  let channel: EmailPushChannel

  beforeEach(() => {
    channel = new EmailPushChannel()
  })

  it('名称应为 email', () => {
    expect(channel.name).toBe('email')
  })

  it('初始应可用', () => {
    expect(channel.available).toBe(true)
  })

  it('发送应返回成功', async () => {
    const result = await channel.send({
      recipient: 'test@example.com',
      subject: '测试邮件',
      body: '<h1>Hello</h1>',
      priority: PushBusinessPriority.P1,
      tenantId: 'tenant-1',
    })
    expect(result.success).toBe(true)
    expect(result.providerId).toMatch(/^email-mock-/)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  it('健康检查应返回 true', async () => {
    expect(await channel.healthCheck()).toBe(true)
  })
})

describe('SmsPushChannel', () => {
  let channel: SmsPushChannel

  beforeEach(() => {
    channel = new SmsPushChannel()
  })

  it('名称应为 sms', () => {
    expect(channel.name).toBe('sms')
  })

  it('发送应返回成功', async () => {
    const result = await channel.send({
      recipient: '13800138000',
      body: '您的验证码是123456',
      priority: PushBusinessPriority.P1,
      tenantId: 'tenant-1',
    })
    expect(result.success).toBe(true)
    expect(result.providerId).toMatch(/^sms-mock-/)
  })

  it('健康检查应返回 true', async () => {
    expect(await channel.healthCheck()).toBe(true)
  })
})

describe('DualChannelRouter', () => {
  let router: DualChannelRouter
  let email: EmailPushChannel
  let sms: SmsPushChannel

  beforeEach(() => {
    router = new DualChannelRouter()
    email = new EmailPushChannel()
    sms = new SmsPushChannel()
    router.register(email)
    router.register(sms)
  })

  it('应能注册通道', () => {
    expect(router.channelCount).toBe(2)
  })

  it('应能获取已注册通道', () => {
    const channels = router.getChannels()
    expect(channels).toHaveLength(2)
    expect(channels[0].name).toBe('email')
    expect(channels[1].name).toBe('sms')
  })

  it('主通道发送成功应返回结果', async () => {
    const result = await router.send(
      {
        recipient: 'test@example.com',
        body: '通知内容',
        priority: PushBusinessPriority.P1,
        tenantId: 'tenant-1',
      },
      { primary: 'email', fallback: 'sms' }
    )
    expect(result.success).toBe(true)
    expect(result.providerId).toMatch(/^email-mock-/)
  })

  it('主通道不可用时应降级到备用通道', async () => {
    // 模拟 email 不可用: 不注册 email, 只注册 sms
    const router2 = new DualChannelRouter()
    router2.register(sms)

    const result = await router2.send(
      {
        recipient: '13800138000',
        body: '通知内容',
        priority: PushBusinessPriority.P1,
        tenantId: 'tenant-1',
      },
      { primary: 'email', fallback: 'sms' }
    )
    expect(result.success).toBe(true)
    expect(result.providerId).toMatch(/^sms-mock-/)
  })

  it('两个通道都失败应返回错误', async () => {
    const router3 = new DualChannelRouter()
    const result = await router3.send(
      {
        recipient: 'test@example.com',
        body: '通知内容',
        priority: PushBusinessPriority.P1,
        tenantId: 'tenant-1',
      },
      { primary: 'nonexistent', fallback: 'also-nonexistent' }
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('not registered')
  })

  it('健康检查应返回各通道状态', async () => {
    const health = await router.healthCheck()
    expect(health).toEqual({ email: true, sms: true })
  })
})
