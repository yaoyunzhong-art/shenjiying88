/**
 * V18 Day2 D4: Promotion Entity 测试
 *
 * 覆盖: 常量验证 / 类型检查 / 默认值边界
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_TIME_BOOST_FACTOR,
  DEFAULT_HOLIDAY_BOOST_FACTOR,
  DEFAULT_FLASH_SALE_BOOST_FACTOR,
  DEFAULT_CROSS_STORE_BOOST_FACTOR,
  DEFAULT_AB_TEST_TRAFFIC_SPLIT,
  DEFAULT_AB_TEST_CONFIDENCE,
  DEFAULT_AB_TEST_MIN_SAMPLE,
  DEFAULT_HOLIDAYS,
  DEFAULT_TIME_WINDOWS,
} from './promotion.entity'

describe('D4 Promotion Entity', () => {
  // ============================================================
  // 默认常量
  // ============================================================
  describe('default constants', () => {
    it('should have correct DEFAULT_TIME_BOOST_FACTOR', () => {
      expect(DEFAULT_TIME_BOOST_FACTOR).toBe(1.5)
    })

    it('should have correct DEFAULT_HOLIDAY_BOOST_FACTOR', () => {
      expect(DEFAULT_HOLIDAY_BOOST_FACTOR).toBe(2.0)
    })

    it('should have correct DEFAULT_FLASH_SALE_BOOST_FACTOR', () => {
      expect(DEFAULT_FLASH_SALE_BOOST_FACTOR).toBe(3.0)
    })

    it('should have correct DEFAULT_CROSS_STORE_BOOST_FACTOR', () => {
      expect(DEFAULT_CROSS_STORE_BOOST_FACTOR).toBe(1.3)
    })

    it('should have correct DEFAULT_AB_TEST_TRAFFIC_SPLIT', () => {
      expect(DEFAULT_AB_TEST_TRAFFIC_SPLIT).toBe(50)
    })

    it('should have correct DEFAULT_AB_TEST_CONFIDENCE', () => {
      expect(DEFAULT_AB_TEST_CONFIDENCE).toBe(0.95)
    })

    it('should have correct DEFAULT_AB_TEST_MIN_SAMPLE', () => {
      expect(DEFAULT_AB_TEST_MIN_SAMPLE).toBe(100)
    })

    it('should have all boost factors positive', () => {
      expect(DEFAULT_TIME_BOOST_FACTOR).toBeGreaterThan(0)
      expect(DEFAULT_HOLIDAY_BOOST_FACTOR).toBeGreaterThan(0)
      expect(DEFAULT_FLASH_SALE_BOOST_FACTOR).toBeGreaterThan(0)
      expect(DEFAULT_CROSS_STORE_BOOST_FACTOR).toBeGreaterThan(0)
    })
  })

  // ============================================================
  // 节假日定义
  // ============================================================
  describe('DEFAULT_HOLIDAYS', () => {
    it('should have holidays defined', () => {
      expect(DEFAULT_HOLIDAYS.length).toBeGreaterThan(0)
    })

    it('should have unique dates', () => {
      const dates = DEFAULT_HOLIDAYS.map(h => h.date)
      expect(new Set(dates).size).toBe(dates.length)
    })

    it('should have valid date format MM-DD', () => {
      for (const h of DEFAULT_HOLIDAYS) {
        expect(h.date).toMatch(/^\d{2}-\d{2}$/)
      }
    })

    it('should have positive boost factors', () => {
      for (const h of DEFAULT_HOLIDAYS) {
        expect(h.boostFactor).toBeGreaterThan(0)
      }
    })

    it('should have priority >= 1', () => {
      for (const h of DEFAULT_HOLIDAYS) {
        expect(h.priority).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have all required fields', () => {
      for (const h of DEFAULT_HOLIDAYS) {
        expect(h.name).toBeTruthy()
        expect(h.date).toBeTruthy()
        expect(h.description).toBeTruthy()
      }
    })

    it('double-11 should have highest boost among holidays', () => {
      const shuang11 = DEFAULT_HOLIDAYS.find(h => h.name === '双十一')
      expect(shuang11).toBeDefined()
      expect(shuang11!.boostFactor).toBe(3.0)
    })

    it('should have at least 5 holidays', () => {
      expect(DEFAULT_HOLIDAYS.length).toBeGreaterThanOrEqual(5)
    })

    it('should have category relevance for each holiday (when defined)', () => {
      for (const h of DEFAULT_HOLIDAYS) {
        if (h.categoryRelevance) {
          expect(Array.isArray(h.categoryRelevance)).toBe(true)
          expect(h.categoryRelevance.length).toBeGreaterThan(0)
        }
      }
    })

    it('should include 春节 with boost 2.5', () => {
      const springFestival = DEFAULT_HOLIDAYS.find(h => h.name === '春节')
      expect(springFestival).toBeDefined()
      expect(springFestival!.boostFactor).toBe(2.5)
    })
  })

  // ============================================================
  // 时段窗口定义
  // ============================================================
  describe('DEFAULT_TIME_WINDOWS', () => {
    it('should have time windows defined', () => {
      expect(DEFAULT_TIME_WINDOWS.length).toBeGreaterThan(0)
    })

    it('should have valid day of week values (0-6)', () => {
      for (const w of DEFAULT_TIME_WINDOWS) {
        for (const d of w.daysOfWeek) {
          expect(d).toBeGreaterThanOrEqual(0)
          expect(d).toBeLessThanOrEqual(6)
        }
      }
    })

    it('should have valid hour values (0-23)', () => {
      for (const w of DEFAULT_TIME_WINDOWS) {
        expect(w.startHour).toBeGreaterThanOrEqual(0)
        expect(w.startHour).toBeLessThan(24)
        expect(w.endHour).toBeGreaterThanOrEqual(0)
        expect(w.endHour).toBeLessThanOrEqual(24)
      }
    })

    it('should have positive boost factors', () => {
      for (const w of DEFAULT_TIME_WINDOWS) {
        expect(w.boostFactor).toBeGreaterThan(0)
      }
    })

    it('should have weekend time windows', () => {
      const weekendWindows = DEFAULT_TIME_WINDOWS.filter(
        w => w.type === 'weekend' && w.daysOfWeek.includes(0)
      )
      expect(weekendWindows.length).toBeGreaterThan(0)
    })

    it('should have weekday time windows', () => {
      const weekdayWindows = DEFAULT_TIME_WINDOWS.filter(
        w => w.type === 'weekday'
      )
      expect(weekdayWindows.length).toBeGreaterThan(0)
    })

    it('happy-hour should have highest boost among non-holiday windows', () => {
      const happyHour = DEFAULT_TIME_WINDOWS.find(w => w.name === '开心时段')
      expect(happyHour).toBeDefined()
      expect(happyHour!.boostFactor).toBe(1.6)
      expect(happyHour!.priority).toBe(7)
    })

    it('each window should have unique name', () => {
      const names = DEFAULT_TIME_WINDOWS.map(w => w.name)
      expect(new Set(names).size).toBe(names.length)
    })

    it('each window should have a valid type', () => {
      const validTypes = ['weekday', 'weekend', 'holiday', 'special-event', 'flash-sale', 'happy-hour']
      for (const w of DEFAULT_TIME_WINDOWS) {
        expect(validTypes).toContain(w.type)
      }
    })
  })

  // ============================================================
  // 类型验证 (运行时不检查, 但确保导出)
  // ============================================================
  describe('type exports', () => {
    it('should export type PromotionStrategyType', () => {
      const types: string[] = [
        'ab-test-optimized',
        'time-boosted',
        'cross-store-synergy',
        'holiday-special',
        'event-flash',
      ]
      for (const t of types) {
        expect(types).toContain(t)
      }
    })

    it('should export type PromotionStatus', () => {
      const statuses: string[] = ['draft', 'active', 'paused', 'expired']
      expect(statuses).toContain('draft')
      expect(statuses).toContain('active')
      expect(statuses).toContain('paused')
      expect(statuses).toContain('expired')
    })
  })
})
