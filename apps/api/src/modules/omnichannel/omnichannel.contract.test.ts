import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [omnichannel] [A] 合约测试
 *
 * 验证 omnichannel 模块的合约类型 Shape 与版本兼容性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  OmnichannelContractVersion,
  checkContractCompatibility,
} from './omnichannel.contract'
import type {
  ReachResultContract,
  BatchReachResultContract,
  SmsDeliveryStatusContract,
  EmailDeliveryStatusContract,
  ChannelConfigContract,
  ChannelStatusContract,
  DeliveryHistoryContract,
  RenderedTemplateContract,
} from './omnichannel.contract'

describe('Omnichannel Contract', () => {
  describe('版本兼容性', () => {
    it('合约版本应格式正确', () => {
      assert.equal(typeof OmnichannelContractVersion, 'string')
      assert.ok(OmnichannelContractVersion.match(/^\d+\.\d+\.\d+$/))
    })

    it('主版本相同应判定为兼容', () => {
      assert.equal(checkContractCompatibility('1.5.0'), true)
      assert.equal(checkContractCompatibility('1.0.0'), true)
    })

    it('主版本不同应判定为不兼容', () => {
      assert.equal(checkContractCompatibility('2.0.0'), false)
      assert.equal(checkContractCompatibility('0.9.0'), false)
    })
  })

  describe('类型 Shape 验证', () => {
    it('ReachResultContract 应有正确 shape', () => {
      const result: ReachResultContract = {
        success: true,
        messageId: 'msg_123',
        channel: 'SMS',
        timestamp: new Date().toISOString(),
      }
      assert.equal(result.success, true)
      assert.equal(result.channel, 'SMS')
      assert.ok(typeof result.messageId, 'string')
    })

    it('BatchReachResultContract 应有正确 shape', () => {
      const batch: BatchReachResultContract = {
        results: [
          { success: true, messageId: 'msg_1', channel: 'SMS', timestamp: new Date().toISOString() },
        ],
        total: 1,
      }
      assert.equal(batch.total, 1)
      assert.equal(batch.results.length, 1)
    })

    it('SmsDeliveryStatusContract 应有正确 shape', () => {
      const status: SmsDeliveryStatusContract = {
        messageId: 'sms_123',
        status: 'sent',
        channel: 'primary',
        timestamp: new Date().toISOString(),
      }
      assert.equal(status.channel, 'primary')
      assert.equal(status.status, 'sent')
    })

    it('EmailDeliveryStatusContract 应有正确 shape', () => {
      const status: EmailDeliveryStatusContract = {
        messageId: 'email_123',
        status: 'delivered',
        locale: 'zh-CN',
        timestamp: new Date().toISOString(),
      }
      assert.equal(status.locale, 'zh-CN')
      assert.equal(status.status, 'delivered')
    })

    it('ChannelConfigContract 应有正确 shape', () => {
      const config: ChannelConfigContract = {
        channel: 'SMS',
        status: 'available',
        priority: 1,
        fallbackChannels: ['Push'],
      }
      assert.equal(config.priority, 1)
      assert.ok(config.fallbackChannels.includes('Push'))
    })

    it('ChannelStatusContract 应有正确 shape', () => {
      const status: ChannelStatusContract = {
        channel: 'Email',
        status: 'available',
        lastChecked: new Date().toISOString(),
      }
      assert.equal(status.channel, 'Email')
      assert.equal(status.status, 'available')
    })

    it('DeliveryHistoryContract 应有正确 shape', () => {
      const item: DeliveryHistoryContract = {
        id: 'hist_1',
        memberId: 'm1',
        channel: 'Push',
        content: 'Hello',
        status: 'sent',
        messageId: 'msg_1',
        timestamp: new Date().toISOString(),
      }
      assert.equal(item.memberId, 'm1')
      assert.equal(item.status, 'sent')
    })

    it('RenderedTemplateContract 应有正确 shape', () => {
      const rendered: RenderedTemplateContract = {
        templateId: 'welcome',
        locale: 'en-US',
        rendered: 'Welcome Alice!',
      }
      assert.equal(rendered.templateId, 'welcome')
      assert.ok(rendered.rendered.includes('Alice'))
    })
  })
})
