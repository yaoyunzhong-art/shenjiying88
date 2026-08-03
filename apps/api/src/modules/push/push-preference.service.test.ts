/**
 * push-preference.service.test.ts — 用户推送偏好服务 单元测试
 *
 * WP-13B: C端便捷化 (BS-0164~BS-0167)
 *
 * 覆盖范围:
 * - 构造函数 / 依赖
 * - getPreference 空值、默认值、已有值
 * - setPreference 全量覆盖、部分覆盖
 * - disableMarketingPush / enableMarketingPush
 * - setDndHours 设置免打扰时段
 * - setPreferredChannel 通道偏好
 * - shouldAllowPush 各类优先级拦截逻辑
 *   - P0 强制推送不可关闭
 *   - P3 营销推送关闭拦截
 *   - 用户级免打扰时段（同天/跨天）
 * - getPreferredChannels
 * - 边界条件: 空/undefined memberId/tenantId
 * - reset 测试辅助函数
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { PushPreferenceService, resetPushPreferenceTestState } from './push-preference.service'
import { PushBusinessPriority } from './push-priority.enum'
import type { PushUserPreference } from './push-preference.entity'

describe('PushPreferenceService', () => {
  let service: PushPreferenceService

  beforeEach(() => {
    resetPushPreferenceTestState()
    service = new PushPreferenceService()
  })

  // ── 构造函数 / 依赖 ──

  describe('constructor', () => {
    it('can be instantiated without arguments', () => {
      const svc = new PushPreferenceService()
      assert.ok(svc)
      assert.ok(svc instanceof PushPreferenceService)
    })

    it('creates an empty preference store', () => {
      assert.ok(service)
    })
  })

  // ── getPreference ──

  describe('getPreference()', () => {
    it('returns default preference for new user', () => {
      const pref = service.getPreference('member-1', 'tenant-1')
      assert.equal(pref.memberId, 'member-1')
      assert.equal(pref.tenantId, 'tenant-1')
      assert.equal(pref.dndEnabled, false)
      assert.equal(pref.marketingPushEnabled, false)
      assert.equal(pref.preferredChannel, 'push')
      assert.deepEqual(pref.fallbackChannels, ['email', 'sms'])
    })

    it('returns stored preference after setPreference', () => {
      service.setPreference('member-1', 'tenant-1', { preferredChannel: 'sms' })
      const pref = service.getPreference('member-1', 'tenant-1')
      assert.equal(pref.preferredChannel, 'sms')
    })

    it('returns default for different tenant even with same memberId', () => {
      service.setPreference('member-1', 'tenant-1', { marketingPushEnabled: true })
      const pref2 = service.getPreference('member-1', 'tenant-2')
      assert.equal(pref2.marketingPushEnabled, false)
    })

    it('returns default for different memberId even with same tenant', () => {
      service.setPreference('member-1', 'tenant-1', { marketingPushEnabled: true })
      const pref2 = service.getPreference('member-2', 'tenant-1')
      assert.equal(pref2.marketingPushEnabled, false)
    })

    it('returns a preference with valid timestamps', () => {
      const pref = service.getPreference('member-1', 'tenant-1')
      assert.ok(pref.createdAt)
      assert.ok(pref.updatedAt)
      assert.ok(!isNaN(Date.parse(pref.createdAt)))
      assert.ok(!isNaN(Date.parse(pref.updatedAt)))
    })
  })

  // ── setPreference ──

  describe('setPreference()', () => {
    it('sets and returns the updated preference', () => {
      const result = service.setPreference('member-1', 'tenant-1', {
        preferredChannel: 'email',
        fallbackChannels: ['sms'],
      })
      assert.equal(result.preferredChannel, 'email')
      assert.deepEqual(result.fallbackChannels, ['sms'])
    })

    it('preserves existing fields when partially updated', () => {
      service.setPreference('member-1', 'tenant-1', { dndEnabled: true, dndStartTime: '23:00' })
      const pref = service.getPreference('member-1', 'tenant-1')
      assert.equal(pref.dndEnabled, true)
      assert.equal(pref.dndStartTime, '23:00')
      // default values preserved
      assert.equal(pref.preferredChannel, 'push')
      assert.equal(pref.marketingPushEnabled, false)
    })

    it('updates updatedAt timestamp on each call', () => {
      const r1 = service.setPreference('member-1', 'tenant-1', { preferredChannel: 'sms' })
      const r2 = service.setPreference('member-1', 'tenant-1', { preferredChannel: 'email' })
      // force time progression by tiny wait — compare strings
      assert.ok(r2.updatedAt >= r1.updatedAt)
    })
  })

  // ── disableMarketingPush / enableMarketingPush ──

  describe('disableMarketingPush()', () => {
    it('sets marketingPushEnabled to false', () => {
      service.setPreference('member-1', 'tenant-1', { marketingPushEnabled: true })
      const result = service.disableMarketingPush('member-1', 'tenant-1')
      assert.equal(result.marketingPushEnabled, false)
    })

    it('disables P3 priority specifically', () => {
      const result = service.disableMarketingPush('member-1', 'tenant-1')
      assert.equal(result.priorityEnabled[PushBusinessPriority.P3], false)
    })

    it('does not affect P0 priority', () => {
      const result = service.disableMarketingPush('member-1', 'tenant-1')
      assert.equal(result.priorityEnabled[PushBusinessPriority.P0], true)
    })
  })

  describe('enableMarketingPush()', () => {
    it('sets marketingPushEnabled to true', () => {
      const result = service.enableMarketingPush('member-1', 'tenant-1')
      assert.equal(result.marketingPushEnabled, true)
    })

    it('enables P3 priority specifically', () => {
      const result = service.enableMarketingPush('member-1', 'tenant-1')
      assert.equal(result.priorityEnabled[PushBusinessPriority.P3], true)
    })
  })

  // ── setDndHours ──

  describe('setDndHours()', () => {
    it('sets DND enabled and time range', () => {
      const result = service.setDndHours('member-1', 'tenant-1', true, '23:00', '07:00')
      assert.equal(result.dndEnabled, true)
      assert.equal(result.dndStartTime, '23:00')
      assert.equal(result.dndEndTime, '07:00')
    })

    it('can disable DND while keeping existing time range', () => {
      service.setDndHours('member-1', 'tenant-1', true, '22:00', '08:00')
      const result = service.setDndHours('member-1', 'tenant-1', false, '22:00', '08:00')
      assert.equal(result.dndEnabled, false)
      assert.equal(result.dndStartTime, '22:00')
    })
  })

  // ── setPreferredChannel ──

  describe('setPreferredChannel()', () => {
    it('sets primary and fallback channels', () => {
      const result = service.setPreferredChannel('member-1', 'tenant-1', 'sms', ['email'])
      assert.equal(result.preferredChannel, 'sms')
      assert.deepEqual(result.fallbackChannels, ['email'])
    })

    it('updates previously set fallback channels', () => {
      service.setPreferredChannel('member-1', 'tenant-1', 'push', ['sms'])
      const result = service.setPreferredChannel('member-1', 'tenant-1', 'email', ['in_app'])
      assert.equal(result.preferredChannel, 'email')
      assert.deepEqual(result.fallbackChannels, ['in_app'])
    })
  })

  // ── shouldAllowPush ──

  describe('shouldAllowPush()', () => {
    it('allows P0 push even when priority is disabled (P0 is mandatory)', () => {
      service.setPreference('member-1', 'tenant-1', {
        priorityEnabled: { [PushBusinessPriority.P0]: false },
      })
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P0, 14, 0)
      assert.equal(result, true)
    })

    it('blocks P3 push when marketing push is disabled', () => {
      // Default: marketingPushEnabled = false
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P3, 10, 0)
      assert.equal(result, false)
    })

    it('allows P3 push when marketing push is enabled', () => {
      service.enableMarketingPush('member-1', 'tenant-1')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P3, 10, 0)
      assert.equal(result, true)
    })

    it('blocks P2 push when P2 priority is disabled', () => {
      service.setPreference('member-1', 'tenant-1', {
        priorityEnabled: { [PushBusinessPriority.P2]: false },
      })
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P2, 14, 0)
      assert.equal(result, false)
    })

    it('blocks push during DND hours (same day range)', () => {
      service.setDndHours('member-1', 'tenant-1', true, '13:00', '15:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 14, 0)
      assert.equal(result, false)
    })

    it('allows push outside DND hours (same day range)', () => {
      service.setDndHours('member-1', 'tenant-1', true, '13:00', '15:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 10, 0)
      assert.equal(result, true)
    })

    it('blocks push during DND hours (cross-day range 22:00~08:00)', () => {
      service.setDndHours('member-1', 'tenant-1', true, '22:00', '08:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 23, 30)
      assert.equal(result, false)
    })

    it('blocks push at early morning in cross-day DND range', () => {
      service.setDndHours('member-1', 'tenant-1', true, '22:00', '08:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 6, 0)
      assert.equal(result, false)
    })

    it('allows push outside cross-day DND range', () => {
      service.setDndHours('member-1', 'tenant-1', true, '22:00', '08:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 10, 0)
      assert.equal(result, true)
    })

    it('allows push when DND is disabled even during DND hours', () => {
      service.setDndHours('member-1', 'tenant-1', false, '22:00', '08:00')
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1, 23, 0)
      assert.equal(result, true)
    })

    it('uses current time when currentHour/currentMinute are not provided', () => {
      service.setDndHours('member-1', 'tenant-1', true, '00:00', '23:59')
      // without passing currentHour/currentMinute, it uses Date.now() at runtime
      const result = service.shouldAllowPush('member-1', 'tenant-1', PushBusinessPriority.P1)
      assert.equal(result, false)
    })
  })

  // ── getPreferredChannels ──

  describe('getPreferredChannels()', () => {
    it('returns default channels for new user', () => {
      const ch = service.getPreferredChannels('member-1', 'tenant-1')
      assert.equal(ch.primary, 'push')
      assert.deepEqual(ch.fallbacks, ['email', 'sms'])
    })

    it('returns updated channels after setPreferredChannel', () => {
      service.setPreferredChannel('member-1', 'tenant-1', 'sms', ['in_app'])
      const ch = service.getPreferredChannels('member-1', 'tenant-1')
      assert.equal(ch.primary, 'sms')
      assert.deepEqual(ch.fallbacks, ['in_app'])
    })
  })

  // ── reset ──

  describe('reset()', () => {
    it('clears all stored preferences', () => {
      service.setPreference('member-1', 'tenant-1', { marketingPushEnabled: true })
      service.reset()
      const pref = service.getPreference('member-1', 'tenant-1')
      assert.equal(pref.marketingPushEnabled, false) // back to default
    })

    it('does not throw after reset', () => {
      service.reset()
      const pref = service.getPreference('member-2', 'tenant-2')
      assert.ok(pref)
      assert.equal(pref.memberId, 'member-2')
    })
  })

  // ── 边界条件 / 异常情况 ──

  describe('edge cases', () => {
    it('handles empty memberId gracefully', () => {
      const pref = service.getPreference('', 'tenant-1')
      assert.ok(pref)
      assert.equal(pref.memberId, '')
    })

    it('handles empty tenantId gracefully', () => {
      const pref = service.getPreference('member-1', '')
      assert.ok(pref)
      assert.equal(pref.tenantId, '')
    })

    it('handles special characters in memberId', () => {
      const pref = service.getPreference('user@domain!', 'tenant-1')
      assert.ok(pref)
      assert.equal(pref.memberId, 'user@domain!')
    })

    it('setPreference with empty patch preserves all defaults', () => {
      const result = service.setPreference('member-1', 'tenant-1', {})
      assert.equal(result.marketingPushEnabled, false)
      assert.equal(result.dndEnabled, false)
      assert.equal(result.preferredChannel, 'push')
    })
  })
})
