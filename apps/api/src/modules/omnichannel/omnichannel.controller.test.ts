import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OmnichannelController } from './omnichannel.controller'
import { OmnichannelReachService, SMSDualChannelService, InternationalEmailService } from './omnichannel.service'
import type { ReachRequest, SendSmsRequest, SendEmailRequest, SendBulkEmailRequest, RenderTemplateRequest, SetChannelStatusRequest } from './omnichannel.dto'

function createController(): OmnichannelController {
  const reachService = new OmnichannelReachService()
  const smsService = new SMSDualChannelService()
  const emailService = new InternationalEmailService()
  return new OmnichannelController(reachService, smsService, emailService)
}

describe('OmnichannelController', () => {
  let controller: OmnichannelController

  beforeEach(() => {
    controller = createController()
  })

  describe('reach()', () => {
    it('POST /omnichannel/reach returns success for SMS', async () => {
      const body: ReachRequest = { memberId: 'm1', channel: 'SMS', content: 'Hello' }
      const result = await controller.reach(body)
      assert.ok(result)
      assert.equal(result.success, true)
      assert.equal(result.channel, 'SMS')
      assert.ok(result.messageId)
    })

    it('POST /omnichannel/reach fails when channel is in maintenance', async () => {
      await controller.setChannelStatus('SMS', { channel: 'SMS', status: 'maintenance' })
      const body: ReachRequest = { memberId: 'm1', channel: 'SMS', content: 'Test' }
      const result = await controller.reach(body)
      assert.equal(result.success, false)
      assert.ok(result.error)
    })

    it('POST /omnichannel/reach supports all channel types', async () => {
      for (const channel of ['SMS', 'Email', 'Push', 'App'] as const) {
        const body: ReachRequest = { memberId: 'm1', channel, content: 'Test' }
        const result = await controller.reach(body)
        assert.equal(result.success, true)
        assert.equal(result.channel, channel)
      }
    })
  })

  describe('reachAll()', () => {
    it('POST /omnichannel/reach-all returns correct count', async () => {
      const body = { memberIds: ['m1', 'm2', 'm3'], channel: 'SMS' as const, content: 'Batch' }
      const result = await controller.reachAll(body)
      assert.equal(result.total, 3)
      assert.equal(result.results.length, 3)
      assert.ok(result.results.every(r => r.success))
    })

    it('POST /omnichannel/reach-all handles empty array', async () => {
      const body = { memberIds: [], channel: 'Email' as const, content: 'Empty' }
      const result = await controller.reachAll(body)
      assert.equal(result.total, 0)
      assert.equal(result.results.length, 0)
    })
  })

  describe('getHistory()', () => {
    it('GET /omnichannel/history/:memberId returns deliveries', async () => {
      await controller.reach({ memberId: 'm1', channel: 'SMS', content: 'Msg 1' })
      await controller.reach({ memberId: 'm1', channel: 'Email', content: 'Msg 2' })
      const result = await controller.getHistory('m1', { memberId: 'm1' })
      assert.equal(result.total, 2)
      assert.equal(result.deliveries.length, 2)
    })

    it('GET /omnichannel/history/:memberId returns empty for unknown member', async () => {
      const result = await controller.getHistory('nonexistent', { memberId: 'nonexistent' })
      assert.equal(result.total, 0)
    })

    it('GET /omnichannel/history/:memberId can filter by channel', async () => {
      await controller.reach({ memberId: 'm1', channel: 'SMS', content: 'SMS' })
      await controller.reach({ memberId: 'm1', channel: 'Email', content: 'Email' })
      const result = await controller.getHistory('m1', { memberId: 'm1', channel: 'SMS' })
      assert.equal(result.total, 1)
      assert.equal(result.deliveries[0].channel, 'SMS')
    })
  })

  describe('getChannelStatus()', () => {
    it('GET /omnichannel/channel/:channel returns current status', async () => {
      const result = await controller.getChannelStatus('SMS')
      assert.equal(result.channel, 'SMS')
      assert.equal(result.status, 'available')
    })
  })

  describe('setChannelStatus()', () => {
    it('PATCH /omnichannel/channel/:channel updates status', async () => {
      const result = await controller.setChannelStatus('SMS', { channel: 'SMS', status: 'maintenance' })
      assert.equal(result.updated, true)
      // Verify the change
      const status = await controller.getChannelStatus('SMS')
      assert.equal(status.status, 'maintenance')
    })
  })

  describe('listChannels()', () => {
    it('GET /omnichannel/channels returns all 4 channels', async () => {
      const result = await controller.listChannels()
      assert.equal(result.length, 4)
      assert.ok(result.every(c => ['SMS', 'Email', 'Push', 'App'].includes(c.channel)))
    })
  })

  describe('SMS send endpoints', () => {
    it('POST /omnichannel/sms/send via primary', async () => {
      const body: SendSmsRequest = { phone: '+8613800000000', content: 'Primary SMS' }
      const result = await controller.sendSms(body)
      assert.equal(result.status, 'sent')
      assert.equal(result.channel, 'primary')
    })

    it('POST /omnichannel/sms/send-backup', async () => {
      const body: SendSmsRequest = { phone: '+8613800000000', content: 'Backup SMS' }
      const result = await controller.sendSmsBackup(body)
      assert.equal(result.status, 'sent')
      assert.equal(result.channel, 'backup')
    })

    it('POST /omnichannel/sms/send-fallback uses primary by default', async () => {
      const body: SendSmsRequest = { phone: '+8613800000000', content: 'Fallback SMS' }
      const result = await controller.sendSmsFallback(body)
      assert.equal(result.status, 'sent')
      assert.ok(['primary', 'backup'].includes(result.channel))
    })

    it('GET /omnichannel/sms/status/:id for sent message', async () => {
      const sent = await controller.sendSms({ phone: '+8613800000000', content: 'Test' })
      const status = await controller.getSmsStatus(sent.messageId)
      assert.equal(status.status, 'sent')
    })

    it('GET /omnichannel/sms/status/:id for unknown ID', async () => {
      const result = await controller.getSmsStatus('nonexistent_id')
      assert.equal(result.status, 'not_found')
    })
  })

  describe('Email send endpoints', () => {
    it('POST /omnichannel/email/send', async () => {
      const body: SendEmailRequest = { to: 'user@test.com', subject: 'Welcome', body: 'Body', locale: 'zh-CN' }
      const result = await controller.sendEmail(body)
      assert.equal(result.status, 'sent')
      assert.equal(result.locale, 'zh-CN')
    })

    it('POST /omnichannel/email/send defaults to en-US', async () => {
      const body: SendEmailRequest = { to: 'user@test.com', subject: 'Welcome', body: 'Body' }
      const result = await controller.sendEmail(body)
      assert.equal(result.locale, 'en-US')
    })

    it('POST /omnichannel/email/bulk returns correct count', async () => {
      const body: SendBulkEmailRequest = { recipients: ['a@t.com', 'b@t.com'], subject: 'Bulk', body: 'Body' }
      const result = await controller.sendBulkEmail(body)
      assert.equal(result.total, 2)
    })

    it('POST /omnichannel/email/render renders template', async () => {
      const body: RenderTemplateRequest = { templateId: 'welcome', locale: 'zh-CN', data: { name: '张三' } }
      const result = await controller.renderTemplate(body)
      assert.equal(result.rendered, '欢迎 张三 加入我们！')
    })

    it('POST /omnichannel/email/render for unknown template', async () => {
      const body: RenderTemplateRequest = { templateId: 'void', locale: 'en-US', data: { name: 'Test' } }
      const result = await controller.renderTemplate(body)
      assert.ok(result.rendered.includes('not found'))
    })

    it('GET /omnichannel/email/status/:id for sent email', async () => {
      const sent = await controller.sendEmail({ to: 'u@t.com', subject: 'S', body: 'B' })
      const status = await controller.getEmailStatus(sent.messageId)
      assert.equal(status.status, 'sent')
    })

    it('GET /omnichannel/email/status/:id for unknown ID', async () => {
      const result = await controller.getEmailStatus('nonexistent')
      assert.equal(result.status, 'not_found')
    })
  })
})
