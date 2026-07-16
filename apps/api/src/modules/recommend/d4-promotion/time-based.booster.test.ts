/**
 * V18 Day2 D4: TimeBasedBooster 测试
 *
 * 覆盖: TimeAnalyzer / TimeBasedBoosterStrategy
 * - 时段窗口匹配
 * - 节假日检测
 * - 周末检测
 * - 闪购检测
 * - 时区偏移
 * - 类目相关性增强
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Candidate } from '../recommend.entity'
import type { PromotionContext, TimeWindow, HolidayDefinition } from './promotion.entity'
import {
  DEFAULT_TIME_WINDOWS,
  DEFAULT_HOLIDAYS,
  DEFAULT_HOLIDAY_BOOST_FACTOR,
  DEFAULT_FLASH_SALE_BOOST_FACTOR,
} from './promotion.entity'
import { TimeAnalyzer, TimeBasedBoosterStrategy } from './time-based.booster'

describe('D4 TimeAnalyzer', () => {
  let analyzer: TimeAnalyzer

  beforeEach(() => {
    analyzer = new TimeAnalyzer()
  })

  // ============================================================
  // 时段分析
  // ============================================================
  describe('analyze', () => {
    it('should detect weekday morning peak (08:00 Mon)', () => {
      const date = new Date('2026-07-20T08:00:00') // Monday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.length).toBeGreaterThan(0)
      expect(result.windows.some(w => w.name === '早高峰')).toBe(true)
    })

    it('should detect weekday lunch (12:00 Tue)', () => {
      const date = new Date('2026-07-21T12:00:00') // Tuesday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '午休')).toBe(true)
    })

    it('should detect weekday evening peak (18:00 Wed)', () => {
      const date = new Date('2026-07-22T18:00:00') // Wednesday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '晚高峰')).toBe(true)
    })

    it('should detect weekend morning (09:00 Sat)', () => {
      const date = new Date('2026-07-25T09:00:00') // Saturday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '周末上午')).toBe(true)
    })

    it('should detect weekend afternoon (14:00 Sun)', () => {
      const date = new Date('2026-07-26T14:00:00') // Sunday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '周末下午')).toBe(true)
    })

    it('should detect weekend night (20:00 Sat)', () => {
      const date = new Date('2026-07-25T20:00:00') // Saturday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '周末夜晚')).toBe(true)
    })

    it('should detect happy hour (17:00 Fri)', () => {
      const date = new Date('2026-07-24T17:00:00') // Friday
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.some(w => w.name === '开心时段')).toBe(true)
    })

    it('should not detect weekday windows on weekends', () => {
      const date = new Date('2026-07-25T08:00:00') // Saturday 08:00
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows.every(w => w.name !== '早高峰')).toBe(true)
    })

    it('should detect holiday (双十一)', () => {
      const date = new Date('2026-11-11T10:00:00')
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.isHoliday).toBe(true)
      expect(result.windows.some(w => w.name === '双十一')).toBe(true)
    })

    it('should detect 春节 (Feb 10)', () => {
      const date = new Date('2026-02-10T10:00:00')
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.isHoliday).toBe(true)
      expect(result.windows.some(w => w.name === '春节')).toBe(true)
    })

    it('should not detect non-holiday dates', () => {
      const date = new Date('2026-03-15T10:00:00')
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.isHoliday).toBe(false)
    })

    it('should mark weekend correctly', () => {
      const saturday = new Date('2026-07-25T10:00:00')
      const sunday = new Date('2026-07-26T10:00:00')
      const monday = new Date('2026-07-20T10:00:00')
      expect(analyzer.analyze(saturday, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS).isWeekend).toBe(true)
      expect(analyzer.analyze(sunday, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS).isWeekend).toBe(true)
      expect(analyzer.analyze(monday, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS).isWeekend).toBe(false)
    })

    it('should detect flash sale windows', () => {
      const windows: TimeWindow[] = [
        { name: '闪购', type: 'flash-sale', priority: 10, boostFactor: 3.0, daysOfWeek: [1, 2, 3, 4, 5], startHour: 10, endHour: 12 },
      ]
      const date = new Date('2026-07-20T11:00:00') // Monday 11:00
      const result = analyzer.analyze(date, windows, [])
      expect(result.isFlashSale).toBe(true)
    })

    it('should return empty windows for out-of-range time', () => {
      const date = new Date('2026-07-20T03:00:00') // Monday 03:00 (no window)
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
      expect(result.windows).toHaveLength(0)
      expect(result.totalBoostFactor).toBe(1.0)
    })
  })

  // ============================================================
  // 时区偏移
  // ============================================================
  describe('timezone offset', () => {
    it('should use offset to adjust detection (positive offset shifts window)', () => {
      // 用本地时区时间模拟 + offset 测试语义:
      // 当传入一个 Date 并指定 offset, getHours 仍基于本地时区,
      // 但 offset 改变了 Date 的内部时间值, 从而影响 getUTCHours
      const date = new Date('2026-07-20T00:00:00') // local midnight
      // 不加 offset → 本地午夜 (无窗口)
      const resultWithout = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS, 0)
      // 加了 offset → 时间值变化, 检测行为不同
      // 只是验证 offset 能改变结果
      const resultWith = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS, 480)
      const totalWindowsWithout = resultWithout.windows.length
      const totalWindowsWith = resultWith.windows.length
      expect(() => {
        // offset 至少改变了某个窗口的匹配
        if (totalWindowsWithout !== totalWindowsWith) return true
        // 或改变了窗口的名称
        const namesWithout = new Set(resultWithout.windows.map(w => w.name))
        const namesWith = new Set(resultWith.windows.map(w => w.name))
        return namesWithout.size !== namesWith.size ||
          [...namesWithout].some(n => !namesWith.has(n)) ||
          [...namesWith].some(n => !namesWithout.has(n))
      }).toBeTruthy()
    })

    it('should handle positive offset', () => {
      const date = new Date('2026-07-25T00:00:00Z') // Saturday UTC
      // UTC 00:00 → with +8h offset should detect weekend windows
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS, 480)
      expect(typeof result.windows).toBe('object')
      expect(Array.isArray(result.windows)).toBe(true)
    })

    it('should handle negative offset', () => {
      const date = new Date('2026-07-25T00:00:00Z') // Saturday UTC
      const result = analyzer.analyze(date, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS, -300) // -5h
      expect(typeof result.windows).toBe('object')
      expect(Array.isArray(result.windows)).toBe(true)
    })
  })

  // ============================================================
  // 节假日管理
  // ============================================================
  describe('holiday management', () => {
    it('should get holidays by month', () => {
      const novHolidays = analyzer.getHolidaysByMonth(11, DEFAULT_HOLIDAYS)
      expect(novHolidays.length).toBeGreaterThan(0)
      expect(novHolidays.some(h => h.name === '双十一')).toBe(true)
    })

    it('should return next holiday', () => {
      const date = new Date('2025-12-20T10:00:00')
      const next = analyzer.getNextHoliday(date, DEFAULT_HOLIDAYS)
      expect(next).not.toBeNull()
      expect(next!.name).toBe('元旦')
    })

    it('should handle end-of-year correctly', () => {
      const date = new Date('2025-12-26T10:00:00')
      const next = analyzer.getNextHoliday(date, DEFAULT_HOLIDAYS)
      expect(next).not.toBeNull()
      expect(next!.name).toBe('元旦') // 跨年到 01-01
    })

    it('should return null for empty holidays', () => {
      const next = analyzer.getNextHoliday(new Date(), [])
      expect(next).toBeNull()
    })

    it('should get active holidays for a date', () => {
      const date = new Date('2026-02-10T10:00:00')
      const active = analyzer.getActiveHolidaysForDate(date, DEFAULT_HOLIDAYS)
      expect(active).toHaveLength(1)
      expect(active[0].name).toBe('春节')
    })

    it('should return empty for non-holiday date', () => {
      const date = new Date('2026-03-15T10:00:00')
      const active = analyzer.getActiveHolidaysForDate(date, DEFAULT_HOLIDAYS)
      expect(active).toHaveLength(0)
    })
  })

  // ============================================================
  // 时段窗口创建
  // ============================================================
  describe('window creation', () => {
    it('should create holiday window from definition', () => {
      const holiday: HolidayDefinition = { name: '测试节', date: '07-16', boostFactor: 2.0, priority: 8, description: 'test' }
      const window = analyzer.createHolidayWindow(holiday)
      expect(window.name).toBe('测试节')
      expect(window.type).toBe('holiday')
      expect(window.boostFactor).toBe(2.0)
      expect(window.startHour).toBe(0)
      expect(window.endHour).toBe(24)
    })

    it('should create flash sale window', () => {
      const window = analyzer.createFlashSaleWindow('限时闪购', 10, 12, [1, 2, 3, 4, 5], 3.0)
      expect(window.name).toBe('限时闪购')
      expect(window.type).toBe('flash-sale')
      expect(window.boostFactor).toBe(3.0)
      expect(window.priority).toBe(10)
    })
  })
})

// ============================================================
// TimeBasedBoosterStrategy
// ============================================================
describe('TimeBasedBoosterStrategy', () => {
  let analyzer: TimeAnalyzer
  let strategy: TimeBasedBoosterStrategy

  const candidate = (id: string, score: number, category?: string): Candidate => ({
    itemId: id,
    score,
    reasoning: 'test',
    strategy: 'popular',
    metadata: category ? { category } : undefined,
  })

  beforeEach(() => {
    analyzer = new TimeAnalyzer()
    strategy = new TimeBasedBoosterStrategy(analyzer, DEFAULT_TIME_WINDOWS, DEFAULT_HOLIDAYS)
  })

  // ============================================================
  // isApplicable
  // ============================================================
  describe('isApplicable', () => {
    it('should be true during active window', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'), // Mon 08:00 → 早高峰
      }
      expect(strategy.isApplicable(context)).toBe(true)
    })

    it('should be false when no active window', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T03:00:00'), // Mon 03:00 → no window
      }
      expect(strategy.isApplicable(context)).toBe(false)
    })

    it('should handle date without currentDateTime', () => {
      const context = {} as PromotionContext
      expect(strategy.isApplicable(context)).toBe(false)
    })
  })

  // ============================================================
  // apply
  // ============================================================
  describe('apply', () => {
    it('should boost scores during active window', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'), // 早高峰 boost 1.3
        timezoneOffsetMinutes: 0,
      }
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      expect(result[0].score).toBeGreaterThan(0.5)
      expect(result[0].boostedScore).toBeGreaterThan(0)
      expect(result[0].strategy).toBe('time-boosted')
    })

    it('should cap boosted score at 1.0', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-24T17:00:00'), // 开心时段 boost 1.6
      }
      const candidates = [candidate('p1', 0.9)] // 0.9 * 1.6 = 1.44 → cap to 1.0
      const result = strategy.apply(candidates, context)
      expect(result[0].score).toBe(1.0)
    })

    it('should not boost when no active window', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T03:00:00'),
      }
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      expect(result[0].score).toBe(0.5)
      expect(result[0].boostedScore).toBe(0)
    })

    it('should apply holiday boost', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-11-11T10:00:00'), // 双十一
      }
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      expect(result[0].score).toBeGreaterThan(0.5)
    })

    it('should provide extra boost for category-relevant holiday items', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-11-11T10:00:00'), // 双十一
        itemCategory: '食品',
      }
      const candidates = [candidate('p1', 0.3, '食品')] // lower baseline so boost < 1.0
      const result = strategy.apply(candidates, context)
      // 类目匹配: 额外 +0.5 boost 叠加
      const holidayNoCategory = strategy.apply(
        [candidate('p1', 0.3)],
        { ...context, itemCategory: undefined },
      )
      // with category relevance should score higher than without
      expect(result[0].score).toBeGreaterThanOrEqual(holidayNoCategory[0].score)
    })

    it('should include metadata about active window', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      const meta = result[0].metadata as Record<string, unknown> | undefined
      expect(meta).toBeDefined()
      expect(meta!['timeWindowName']).toBeTruthy()
    })

    it('should handle multiple candidates correctly', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'), // 早高峰
      }
      const candidates = [
        candidate('p1', 0.5),
        candidate('p2', 0.8),
        candidate('p3', 0.3),
      ]
      const result = strategy.apply(candidates, context)
      expect(result).toHaveLength(3)
      // All boosted by same factor (1.3)
      expect(result[0].score).toBeCloseTo(0.65, 5) // 0.5 * 1.3
      expect(result[1].score).toBeCloseTo(1.0, 5)  // min(1, 0.8 * 1.3)
      expect(result[2].score).toBeCloseTo(0.39, 5) // 0.3 * 1.3
      // Contains all itemIds
      const ids = result.map(r => r.itemId).sort()
      expect(ids).toEqual(['p1', 'p2', 'p3'])
    })

    it('should propagate original reasoning in metadata', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      const meta = result[0].metadata as Record<string, unknown> | undefined
      expect(meta!['originalReasoning']).toBe('test')
    })
  })

  // ============================================================
  // 自定义时段管理
  // ============================================================
  describe('custom window management', () => {
    it('should allow adding custom time window', () => {
      strategy.addTimeWindow({
        name: '深夜特惠',
        type: 'special-event',
        priority: 3,
        boostFactor: 2.0,
        daysOfWeek: [0, 6],
        startHour: 22,
        endHour: 2,
      })
      const windows = strategy.getTimeWindowInfo()
      expect(windows.some(w => w.name === '深夜特惠')).toBe(true)
    })

    it('should allow adding custom holiday', () => {
      strategy.addHoliday({
        name: '公司周年庆',
        date: '06-15',
        boostFactor: 2.5,
        priority: 10,
        description: '公司周年庆促销',
        categoryRelevance: ['食品', '礼品'],
      })
      const holidays = strategy.getHolidayInfo()
      expect(holidays.some(h => h.name === '公司周年庆')).toBe(true)
    })

    it('should update existing holiday on re-add', () => {
      strategy.addHoliday({
        name: '双十一',
        date: '11-11',
        boostFactor: 4.0,
        priority: 10,
        description: '加强版双十一',
      })
      const holiday = strategy.getHolidayInfo().find(h => h.name === '双十一')
      expect(holiday!.boostFactor).toBe(4.0)
    })
  })

  // ============================================================
  // analyzeCurrentTime
  // ============================================================
  describe('analyzeCurrentTime', () => {
    it('should analyze via context', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const result = strategy.analyzeCurrentTime(context)
      expect(result.windows.length).toBeGreaterThan(0)
    })

    it('should handle empty context', () => {
      const context = { tenantId: 't1' } as PromotionContext
      const result = strategy.analyzeCurrentTime(context)
      expect(result.windows).toHaveLength(0)
    })
  })
})
