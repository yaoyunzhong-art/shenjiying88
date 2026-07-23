/**
 * push-priority.guard.test.ts — 推送分级守卫测试
 *
 * WP-13A: PushPriorityGuard 单元测试
 * BS-0168 ~ BS-0184
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PushPriorityGuard } from './push-priority.guard'
import { DndConfigService, FrequencyCapService } from './dnd-config'
import { PushBusinessPriority, PUSH_MARKETING_SETTING_KEY } from './push-priority.enum'

describe('PushPriorityGuard', () => {
  let dndConfig: DndConfigService
  let frequencyCap: FrequencyCapService
  let guard: PushPriorityGuard

  beforeEach(() => {
    dndConfig = new DndConfigService()
    frequencyCap = new FrequencyCapService()
    guard = new PushPriorityGuard(dndConfig, frequencyCap)
    vi.useFakeTimers()
    // 设置非免打扰时段
    vi.setSystemTime(new Date('2026-07-23T14:00:00+08:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    dndConfig.reset()
    frequencyCap.reset()
  })

  describe('P0 紧急告警', () => {
    it('应始终放行', () => {
      const result = guard.check(PushBusinessPriority.P0, 'tenant-1')
      expect(result.allowed).toBe(true)
    })

    it('即使在免打扰时段也应放行', () => {
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      const result = guard.check(PushBusinessPriority.P0, 'tenant-1')
      expect(result.allowed).toBe(true)
    })

    it('即使超过频控也应放行', () => {
      frequencyCap.setConfig('tenant-1', { dailyMax: 0, cooldownSeconds: 0 })
      const result = guard.check(PushBusinessPriority.P0, 'tenant-1', 'member-1')
      expect(result.allowed).toBe(true)
    })
  })

  describe('P1 重要通知', () => {
    it('正常时段应放行', () => {
      const result = guard.check(PushBusinessPriority.P1, 'tenant-1')
      expect(result.allowed).toBe(true)
    })

    it('免打扰时段应拦截', () => {
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      const result = guard.check(PushBusinessPriority.P1, 'tenant-1')
      expect(result.allowed).toBe(false)
      expect(result.blockedByDnd).toBe(true)
    })

    it('超过频控时应拦截', () => {
      frequencyCap.setConfig('tenant-1', { dailyMax: 0, cooldownSeconds: 0 })
      const result = guard.check(PushBusinessPriority.P1, 'tenant-1', 'member-1')
      expect(result.allowed).toBe(false)
      expect(result.blockedByFrequencyCap).toBe(true)
    })
  })

  describe('P2 一般推送', () => {
    it('正常时段应放行', () => {
      const result = guard.check(PushBusinessPriority.P2, 'tenant-1')
      expect(result.allowed).toBe(true)
    })
  })

  describe('P3 营销推送', () => {
    it('正常时段 + 已开启营销应放行', () => {
      const result = guard.check(
        PushBusinessPriority.P3,
        'tenant-1',
        'member-1',
        { [PUSH_MARKETING_SETTING_KEY]: true }
      )
      expect(result.allowed).toBe(true)
    })

    it('用户关闭营销应拦截', () => {
      const result = guard.check(
        PushBusinessPriority.P3,
        'tenant-1',
        'member-1',
        { [PUSH_MARKETING_SETTING_KEY]: false }
      )
      expect(result.allowed).toBe(false)
      expect(result.blockedByPreference).toBe(true)
    })

    it('未配置偏好设置时应放行（默认开启）', () => {
      const result = guard.check(
        PushBusinessPriority.P3,
        'tenant-1',
        'member-1',
        {}
      )
      expect(result.allowed).toBe(true)
    })

    it('字符串 "false" 也应视为关闭', () => {
      const result = guard.check(
        PushBusinessPriority.P3,
        'tenant-1',
        'member-1',
        { [PUSH_MARKETING_SETTING_KEY]: 'false' }
      )
      expect(result.allowed).toBe(false)
      expect(result.blockedByPreference).toBe(true)
    })
  })
})
