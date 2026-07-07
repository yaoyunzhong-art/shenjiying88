import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  DEFAULT_CHANNEL_CONFIGS,
  type OmnichannelDelivery,
  type SmsDeliveryRecord,
  type ChannelConfig,
  type ChannelType,
  type DeliveryStatus,
} from './omnichannel.entity'

describe('OmnichannelEntity', () => {
  describe('DEFAULT_CHANNEL_CONFIGS', () => {
    it('has 4 channel configs for SMS, Email, Push, App', () => {
      assert.equal(DEFAULT_CHANNEL_CONFIGS.length, 4)
      const configs = DEFAULT_CHANNEL_CONFIGS
      assert.ok(configs.some(c => c.channel === 'SMS'))
      assert.ok(configs.some(c => c.channel === 'Email'))
      assert.ok(configs.some(c => c.channel === 'Push'))
      assert.ok(configs.some(c => c.channel === 'App'))
    })

    it('all channels start as available', () => {
      const allAvailable = DEFAULT_CHANNEL_CONFIGS.every(c => c.status === 'available')
      assert.equal(allAvailable, true)
    })

    it('has unique priority values', () => {
      const priorities = DEFAULT_CHANNEL_CONFIGS.map(c => c.priority)
      const uniquePriorities = new Set(priorities)
      assert.equal(uniquePriorities.size, priorities.length)
    })

    it('SMS has Push as fallback', () => {
      const sms = DEFAULT_CHANNEL_CONFIGS.find(c => c.channel === 'SMS')!
      assert.ok(sms.fallbackChannels.includes('Push'))
    })
  })

  describe('OmnichannelDelivery interface', () => {
    it('can create a valid delivery object', () => {
      const delivery: OmnichannelDelivery = {
        id: 'del_001',
        memberId: 'm1',
        channel: 'SMS',
        content: 'Hello',
        status: 'sent',
        messageId: 'msg_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      assert.equal(delivery.id, 'del_001')
      assert.equal(delivery.status, 'sent')
    })

    it('allows optional error field', () => {
      const delivery: OmnichannelDelivery = {
        id: 'del_002',
        memberId: 'm2',
        channel: 'Email',
        content: 'Test',
        status: 'failed',
        messageId: 'msg_002',
        error: 'channel_unavailable',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      assert.ok(delivery.error)
      assert.equal(delivery.error, 'channel_unavailable')
    })
  })

  describe('SmsDeliveryRecord interface', () => {
    it('can create primary channel record', () => {
      const record: SmsDeliveryRecord = {
        messageId: 'sms_001',
        phone: '+8613812345678',
        content: 'Test SMS',
        status: 'sent',
        channel: 'primary',
        createdAt: new Date(),
      }
      assert.equal(record.channel, 'primary')
      assert.equal(record.status, 'sent')
    })

    it('can create backup channel record', () => {
      const record: SmsDeliveryRecord = {
        messageId: 'sms_002',
        phone: '+8613812345678',
        content: 'Backup SMS',
        status: 'delivered',
        channel: 'backup',
        createdAt: new Date(),
      }
      assert.equal(record.channel, 'backup')
    })
  })

  describe('ChannelConfig interface', () => {
    it('supports all delivery statuses', () => {
      const statuses: DeliveryStatus[] = ['pending', 'sent', 'delivered', 'failed']
      assert.equal(statuses.length, 4)
    })

    it('supports all channel types', () => {
      const types: ChannelType[] = ['SMS', 'Email', 'Push', 'App']
      assert.equal(types.length, 4)
    })
  })

  describe('ChannelConfig type safety', () => {
    it('allows maintenance status', () => {
      const cfg: ChannelConfig = {
        channel: 'Push',
        status: 'maintenance',
        priority: 3,
        fallbackChannels: ['SMS'],
        rateLimitPerMinute: 600,
      }
      assert.equal(cfg.status, 'maintenance')
    })

    it('allows failed status', () => {
      const cfg: ChannelConfig = {
        channel: 'SMS',
        status: 'failed',
        priority: 1,
        fallbackChannels: ['Push'],
        rateLimitPerMinute: 60,
      }
      assert.equal(cfg.status, 'failed')
    })

    it('rate limits are positive numbers', () => {
      const allPositive = DEFAULT_CHANNEL_CONFIGS.every(c => c.rateLimitPerMinute > 0)
      assert.equal(allPositive, true)
    })
  })
})
