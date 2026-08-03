/**
 * dnd-config.test.ts — 免打扰时段 & 频控单元测试
 *
 * WP-13A: 免打扰 (DND) + 频控
 * BS-0168 ~ BS-0184
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DndConfigService, FrequencyCapService, DEFAULT_DND_CONFIG, DEFAULT_FREQUENCY_CAP_CONFIG } from './dnd-config'

describe('DndConfigService', () => {
  let service: DndConfigService

  beforeEach(() => {
    service = new DndConfigService()
  })

  afterEach(() => {
    service.reset()
  })

  describe('getConfig', () => {
    it('未配置时应返回默认值', () => {
      const config = service.getConfig('tenant-1')
      expect(config.enabled).toBe(true)
      expect(config.startTime).toBe('22:00')
      expect(config.endTime).toBe('08:00')
      expect(config.bypassBelow).toBe('P0')
    })
  })

  describe('setConfig', () => {
    it('应能合并覆盖默认配置', () => {
      const config = service.setConfig('tenant-1', { startTime: '23:00', endTime: '07:00' })
      expect(config.enabled).toBe(true)
      expect(config.startTime).toBe('23:00')
      expect(config.endTime).toBe('07:00')
    })

    it('应能关闭免打扰', () => {
      const config = service.setConfig('tenant-1', { enabled: false })
      expect(config.enabled).toBe(false)
    })
  })

  describe('isInDndHours', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('22:00 ~ 08:00 时段应返回 true', () => {
      // 凌晨 3 点应当视作免打扰时段
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      expect(service.isInDndHours('tenant-1')).toBe(true)
    })

    it('14:00 不在免打扰时段应返回 false', () => {
      vi.setSystemTime(new Date('2026-07-23T14:00:00+08:00'))
      expect(service.isInDndHours('tenant-1')).toBe(false)
    })

    it('免打扰关闭时始终返回 false', () => {
      service.setConfig('tenant-1', { enabled: false })
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      expect(service.isInDndHours('tenant-1')).toBe(false)
    })
  })

  describe('shouldAllow', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('P0 (强制) 在免打扰时段也应放行', () => {
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      expect(service.shouldAllow('tenant-1', true)).toBe(true)
    })

    it('非强制推送在免打扰时段应拦截', () => {
      vi.setSystemTime(new Date('2026-07-23T03:00:00+08:00'))
      expect(service.shouldAllow('tenant-1', false)).toBe(false)
    })

    it('非强制推送在非免打扰时段应放行', () => {
      vi.setSystemTime(new Date('2026-07-23T14:00:00+08:00'))
      expect(service.shouldAllow('tenant-1', false)).toBe(true)
    })
  })
})

describe('FrequencyCapService', () => {
  let service: FrequencyCapService

  beforeEach(() => {
    service = new FrequencyCapService()
  })

  afterEach(() => {
    service.reset()
  })

  describe('getConfig', () => {
    it('未配置时应返回默认值', () => {
      const config = service.getConfig('tenant-1')
      expect(config.dailyMax).toBe(50)
      expect(config.weeklyMax).toBe(200)
      expect(config.perMinuteMax).toBe(10)
      expect(config.cooldownSeconds).toBe(5)
    })
  })

  describe('checkAndIncrement', () => {
    it('首次推送不应触发频控', () => {
      const state = service.checkAndIncrement('tenant-1', 'member-1')
      expect(state.exceeded).toBe(false)
      expect(state.dailyCount).toBe(1)
      expect(state.weeklyCount).toBe(1)
    })

    it('同一天多次推送应递增计数器', async () => {
      // 设置宽松频控，避免 cooldown 和 perMinuteMax 影响
      service.setConfig('tenant-1', { dailyMax: 100, weeklyMax: 500, perMinuteMax: 1000000, cooldownSeconds: 0 })
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1))
        const state = service.checkAndIncrement('tenant-1', 'member-2')
        if (state.exceeded) {
          expect.fail(`Unexpected cap exceeded at iteration ${i + 1}, state=${JSON.stringify(state)}`)
        }
      }
      const state = service.peek('tenant-1', 'member-2')
      expect(state.dailyCount).toBeGreaterThanOrEqual(5)
    })

    it('超过每日上限应触发频控', async () => {
      // 设置每日上限为 3，同时放宽 perMinuteMax 和 cooldown 避免干扰
      service.setConfig('tenant-1', { dailyMax: 3, perMinuteMax: 1000000, cooldownSeconds: 0 })

      // 前 3 次可推送
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1))
        const state = service.checkAndIncrement('tenant-1', 'member-3')
        expect(state.exceeded).toBe(false)
        expect(state.dailyCount).toBe(i + 1)
      }

      // 第 4 次应触发频控
      const state = service.checkAndIncrement('tenant-1', 'member-3')
      expect(state.exceeded).toBe(true)
      expect(state.dailyCount).toBe(4)
    })

    it('不同租户/会员的计数器应隔离', () => {
      const a = service.checkAndIncrement('tenant-a', 'member-1')
      expect(a.dailyCount).toBe(1)

      const b = service.checkAndIncrement('tenant-b', 'member-1')
      expect(b.dailyCount).toBe(1)

      const c = service.checkAndIncrement('tenant-a', 'member-2')
      expect(c.dailyCount).toBe(1)
    })
  })

  describe('shouldAllow', () => {
    it('未超频控时应返回 true', () => {
      expect(service.shouldAllow('tenant-1', 'member-1')).toBe(true)
    })

    it('超过频控时应返回 false', () => {
      service.setConfig('tenant-1', { dailyMax: 0, cooldownSeconds: 0 })
      // dailyMax=0, 首次就超标
      expect(service.shouldAllow('tenant-1', 'member-1')).toBe(false)
    })
  })
})
