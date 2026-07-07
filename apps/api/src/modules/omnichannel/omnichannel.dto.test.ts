import { describe, it, expect as _exp, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import type {
  ReachRequest,
  ReachAllRequest,
  SendSmsRequest,
  SendEmailRequest,
  SendBulkEmailRequest,
  RenderTemplateRequest,
  SetChannelStatusRequest,
  ReachResponse,
  ChannelStatusResponse,
  DeliveryHistoryItem,
  SmsDeliveryStatusResponse,
  EmailDeliveryStatusResponse,
} from './omnichannel.dto'

describe('OmnichannelDto', () => {
  describe('ReachRequest', () => {
    it('can create a valid reach request', () => {
      const req: ReachRequest = {
        memberId: 'member_001',
        channel: 'SMS',
        content: 'Hello via SMS',
      }
      assert.equal(req.memberId, 'member_001')
      assert.equal(req.channel, 'SMS')
      assert.equal(req.content, 'Hello via SMS')
    })

    it('supports all channel types', () => {
      const channels: ReachRequest['channel'][] = ['SMS', 'Email', 'Push', 'App']
      channels.forEach(ch => {
        const req: ReachRequest = { memberId: 'm1', channel: ch, content: 'test' }
        assert.equal(req.channel, ch)
      })
    })
  })

  describe('ReachAllRequest', () => {
    it('supports multiple member IDs', () => {
      const req: ReachAllRequest = {
        memberIds: ['m1', 'm2', 'm3'],
        channel: 'Email',
        content: 'Batch message',
      }
      assert.equal(req.memberIds.length, 3)
      assert.equal(req.channel, 'Email')
    })

    it('handles empty member IDs array', () => {
      const req: ReachAllRequest = {
        memberIds: [],
        channel: 'Push',
        content: 'Empty batch',
      }
      assert.equal(req.memberIds.length, 0)
    })
  })

  describe('SendSmsRequest', () => {
    it('can create with phone and content', () => {
      const req: SendSmsRequest = {
        phone: '+8613812345678',
        content: 'Test SMS',
      }
      assert.equal(req.phone, '+8613812345678')
      assert.equal(req.content, 'Test SMS')
    })

    it('preferBackup is optional', () => {
      const req: SendSmsRequest = { phone: '+8613800000000', content: 'Test' }
      assert.equal(req.preferBackup, undefined)
    })

    it('can set preferBackup to true', () => {
      const req: SendSmsRequest = { phone: '+8613800000000', content: 'Test', preferBackup: true }
      assert.equal(req.preferBackup, true)
    })
  })

  describe('SendEmailRequest', () => {
    it('has required fields to, subject, body', () => {
      const req: SendEmailRequest = {
        to: 'user@example.com',
        subject: 'Welcome',
        body: 'Body text',
      }
      assert.equal(req.to, 'user@example.com')
      assert.equal(req.locale, undefined) // locale is optional
    })

    it('can specify locale', () => {
      const req: SendEmailRequest = {
        to: 'user@example.com',
        subject: 'Welcome',
        body: 'Body',
        locale: 'zh-CN',
      }
      assert.equal(req.locale, 'zh-CN')
    })
  })

  describe('SendBulkEmailRequest', () => {
    it('supports multiple recipients', () => {
      const req: SendBulkEmailRequest = {
        recipients: ['a@test.com', 'b@test.com'],
        subject: 'Bulk',
        body: 'Body',
      }
      assert.equal(req.recipients.length, 2)
    })

    it('handles empty recipients', () => {
      const req: SendBulkEmailRequest = {
        recipients: [],
        subject: 'Empty',
        body: '',
      }
      assert.equal(req.recipients.length, 0)
    })
  })

  describe('RenderTemplateRequest', () => {
    it('carries template ID, locale, and data', () => {
      const req: RenderTemplateRequest = {
        templateId: 'welcome',
        locale: 'zh-CN',
        data: { name: '张三' },
      }
      assert.equal(req.templateId, 'welcome')
      assert.equal(req.locale, 'zh-CN')
      assert.equal(req.data.name, '张三')
    })
  })

  describe('SetChannelStatusRequest', () => {
    it('can set to maintenance', () => {
      const req: SetChannelStatusRequest = { channel: 'SMS', status: 'maintenance' }
      assert.equal(req.status, 'maintenance')
    })

    it('can set to failed', () => {
      const req: SetChannelStatusRequest = { channel: 'Email', status: 'failed' }
      assert.equal(req.status, 'failed')
    })

    it('can set to available', () => {
      const req: SetChannelStatusRequest = { channel: 'Push', status: 'available' }
      assert.equal(req.status, 'available')
    })
  })

  describe('Response types', () => {
    it('ReachResponse includes success flag', () => {
      const res: ReachResponse = {
        success: true,
        messageId: 'msg_001',
        channel: 'SMS',
        timestamp: new Date().toISOString(),
      }
      assert.equal(res.success, true)
      assert.equal(res.messageId, 'msg_001')
    })

    it('ReachResponse can have error', () => {
      const res: ReachResponse = {
        success: false,
        messageId: '',
        channel: 'Email',
        timestamp: new Date().toISOString(),
        error: 'Channel maintenance',
      }
      assert.equal(res.success, false)
      assert.ok(res.error)
    })

    it('ChannelStatusResponse has required fields', () => {
      const res: ChannelStatusResponse = {
        channel: 'SMS',
        status: 'available',
        lastChecked: new Date().toISOString(),
      }
      assert.equal(res.channel, 'SMS')
      assert.equal(res.status, 'available')
    })

    it('DeliveryHistoryItem has delivery info', () => {
      const item: DeliveryHistoryItem = {
        id: 'hst_001',
        memberId: 'm1',
        channel: 'SMS',
        content: 'Hello',
        status: 'delivered',
        messageId: 'msg_001',
        timestamp: new Date().toISOString(),
      }
      assert.equal(item.status, 'delivered')
    })
  })
})
