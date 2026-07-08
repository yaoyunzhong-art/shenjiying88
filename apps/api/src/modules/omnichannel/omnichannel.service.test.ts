import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [omnichannel] [A] service test 补全
 *
 * 全渠道触达服务单元测试
 * 直接实例化 OmnichannelReachService, SMSDualChannelService, InternationalEmailService
 *
 * 覆盖:
 *   OmnichannelReachService: reach / reachAll / getReachHistory / getChannelStatus / setChannelStatus
 *   SMSDualChannelService:   sendViaPrimary / sendViaBackup / sendWithFallback / getDeliveryStatus
 *   InternationalEmailService: sendEmail / sendBulkEmail / getEmailStatus / renderTemplate / registerTemplate
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OmnichannelReachService, SMSDualChannelService, InternationalEmailService } from './omnichannel.service'
import type { ReachHistory, SMSDeliveryStatus, EmailDeliveryStatus, Locale } from './omnichannel.service'

// ─── OmnichannelReachService ─────────────────────────────────

describe('OmnichannelReachService', () => {
  let service: OmnichannelReachService

  beforeEach(() => {
    service = new OmnichannelReachService()
  })

  // ── reach ──
  describe('reach()', () => {
    it('应该通过 SMS 渠道成功触达会员', async () => {
      const result = await service.reach('member-001', 'SMS', '您好，欢迎光临！')
      assert.equal(result.success, true)
      assert.ok(result.messageId.startsWith('msg_'))
      assert.equal(result.channel, 'SMS')
    })

    it('应该通过所有 4 种渠道成功触达', async () => {
      for (const channel of ['SMS', 'Email', 'Push', 'App'] as const) {
        const result = await service.reach('member-001', channel, `Test via ${channel}`)
        assert.equal(result.success, true, `${channel} should succeed`)
        assert.equal(result.channel, channel)
      }
    })

    it('渠道 maintenance 时应该返回失败', async () => {
      service.setChannelStatus('SMS', 'maintenance')
      const result = await service.reach('member-001', 'SMS', '测试消息')
      assert.equal(result.success, false)
      assert.ok(result.error?.includes('maintenance'))
    })

    it('渠道 failed 时应该返回失败', async () => {
      service.setChannelStatus('Email', 'failed')
      const result = await service.reach('member-001', 'Email', '测试邮件')
      assert.equal(result.success, false)
      assert.ok(result.error?.includes('failed'))
    })

    it('渠道恢复后应该能再次成功发送', async () => {
      service.setChannelStatus('Push', 'maintenance')
      const failResult = await service.reach('m1', 'Push', 'Failing')
      assert.equal(failResult.success, false)

      service.setChannelStatus('Push', 'available')
      const successResult = await service.reach('m1', 'Push', 'Recovered')
      assert.equal(successResult.success, true)
    })
  })

  // ── reachAll ──
  describe('reachAll()', () => {
    it('应该批量触达所有会员', async () => {
      const results = await service.reachAll(['m1', 'm2', 'm3'], 'SMS', '批量通知')
      assert.equal(results.length, 3)
      assert.ok(results.every(r => r.success))
    })

    it('空成员列表应该返回空数组', async () => {
      const results = await service.reachAll([], 'Email', '批量')
      assert.equal(results.length, 0)
    })

    it('部分渠道故障时对应成员触达失败', async () => {
      service.setChannelStatus('SMS', 'failed')
      const results = await service.reachAll(['m1', 'm2'], 'SMS', '通知')
      assert.ok(results.every(r => r.success === false))
    })
  })

  // ── getReachHistory ──
  describe('getReachHistory()', () => {
    it('应该返回指定会员的触达历史', async () => {
      await service.reach('m1', 'SMS', 'Msg 1')
      await service.reach('m2', 'Email', 'Msg 2')
      await service.reach('m1', 'Push', 'Msg 3')

      const m1History = service.getReachHistory('m1')
      assert.equal(m1History.length, 2)
      assert.ok(m1History.every(h => h.memberId === 'm1'))
    })

    it('无历史的会员应返回空数组', () => {
      const history = service.getReachHistory('nonexistent')
      assert.deepEqual(history, [])
    })
  })

  // ── getChannelStatus / setChannelStatus ──
  describe('channel status management', () => {
    it('渠道默认状态为 available', () => {
      assert.equal(service.getChannelStatus('SMS'), 'available')
      assert.equal(service.getChannelStatus('Email'), 'available')
      assert.equal(service.getChannelStatus('Push'), 'available')
      assert.equal(service.getChannelStatus('App'), 'available')
    })

    it('应能切换渠道状态', () => {
      service.setChannelStatus('SMS', 'maintenance')
      assert.equal(service.getChannelStatus('SMS'), 'maintenance')

      service.setChannelStatus('SMS', 'available')
      assert.equal(service.getChannelStatus('SMS'), 'available')
    })

    it('未知渠道返回 failed', () => {
      const status = service.getChannelStatus('Unknown' as any)
      assert.equal(status, 'failed')
    })
  })
})

// ─── SMSDualChannelService ───────────────────────────────────

describe('SMSDualChannelService', () => {
  let smsService: SMSDualChannelService

  beforeEach(() => {
    smsService = new SMSDualChannelService()
  })

  describe('sendViaPrimary()', () => {
    it('主通道发送成功', async () => {
      const result = await smsService.sendViaPrimary('+8613800000000', '验证码 123456')
      assert.equal(result.status, 'sent')
      assert.equal(result.channel, 'primary')
      assert.ok(result.messageId.startsWith('sms_'))
    })
  })

  describe('sendViaBackup()', () => {
    it('备用通道发送成功', async () => {
      const result = await smsService.sendViaBackup('+8613800000000', '备用通道验证码')
      assert.equal(result.status, 'sent')
      assert.equal(result.channel, 'backup')
    })
  })

  describe('sendWithFallback()', () => {
    it('主通道正常时走主通道', async () => {
      const result = await smsService.sendWithFallback('+8613800000000', 'Fallback 测试')
      assert.equal(result.status, 'sent')
      assert.equal(result.channel, 'primary')
    })
  })

  describe('getDeliveryStatus()', () => {
    it('应返回已发送消息的投递状态', async () => {
      const sent = await smsService.sendViaPrimary('+8613800000000', '状态查询')
      const status = smsService.getDeliveryStatus(sent.messageId)
      assert.ok(status)
      assert.equal(status!.status, 'sent')
      assert.equal(status!.messageId, sent.messageId)
    })

    it('未知 messageId 应返回 undefined', () => {
      const status = smsService.getDeliveryStatus('nonexistent')
      assert.equal(status, undefined)
    })
  })
})

// ─── InternationalEmailService ───────────────────────────────

describe('InternationalEmailService', () => {
  let emailService: InternationalEmailService

  beforeEach(() => {
    emailService = new InternationalEmailService()
  })

  describe('sendEmail()', () => {
    it('应发送多语言邮件', async () => {
      const result = await emailService.sendEmail('user@test.com', 'Welcome', 'Body', 'zh-CN')
      assert.equal(result.status, 'sent')
      assert.equal(result.locale, 'zh-CN')
      assert.ok(result.messageId.startsWith('email_'))
    })

    it('默认 locale 为 en-US', async () => {
      const result = await emailService.sendEmail('user@test.com', 'Welcome', 'Body')
      assert.equal(result.locale, 'en-US')
    })
  })

  describe('sendBulkEmail()', () => {
    it('批量发送返回正确数量结果', async () => {
      const recipients = [{ to: 'a@test.com', name: 'A' }, { to: 'b@test.com', name: 'B' }]
      const results = await emailService.sendBulkEmail(recipients, 'Bulk', 'Body', 'en-US')
      assert.equal(results.length, 2)
      assert.ok(results.every(r => r.status === 'sent'))
    })

    it('空收件人列表应返回空数组', async () => {
      const results = await emailService.sendBulkEmail([], 'Test', 'Body')
      assert.equal(results.length, 0)
    })
  })

  describe('getEmailStatus()', () => {
    it('应返回已发送邮件的状态', async () => {
      const sent = await emailService.sendEmail('u@test.com', 'S', 'B', 'en-US')
      const status = emailService.getEmailStatus(sent.messageId)
      assert.ok(status)
      assert.equal(status!.status, 'sent')
    })

    it('未知 messageId 返回 undefined', () => {
      assert.equal(emailService.getEmailStatus('nonexistent'), undefined)
    })
  })

  describe('renderTemplate()', () => {
    it('应渲染英文 welcome 模板', () => {
      const text = emailService.renderTemplate('welcome', 'en-US', { name: 'Alice' })
      assert.equal(text, 'Welcome Alice to our platform!')
    })

    it('应渲染中文 promotion 模板', () => {
      const text = emailService.renderTemplate('promotion', 'zh-CN', { name: '小王', discount: '8' })
      assert.equal(text, '亲爱的 小王，您有一张 8 折优惠券！')
    })

    it('应渲染日文 welcome 模板', () => {
      const text = emailService.renderTemplate('welcome', 'ja-JP', { name: '山田' })
      assert.equal(text, '山田様ようこそ！')
    })

    it('不存在的模板应返回提示', () => {
      const text = emailService.renderTemplate('unknown', 'en-US', {})
      assert.ok(text.includes('not found'))
    })
  })

  describe('registerTemplate()', () => {
    it('应支持注册自定义模板并渲染', () => {
      emailService.registerTemplate('custom', {
        'zh-CN': '自定义模板 {name}',
        'en-US': 'Custom template {name}',
        'ja-JP': 'カスタムテンプレート {name}',
        'ko-KR': '커스텀 템플릿 {name}',
        'es-ES': 'Plantilla personalizada {name}',
      } as Record<Locale, string>)

      const text = emailService.renderTemplate('custom', 'zh-CN', { name: '测试' })
      assert.equal(text, '自定义模板 测试')
    })
  })
})
