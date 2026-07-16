/**
 * V18 Day2 D4: TimeBasedBooster (时段增强)
 *
 * 基于时间窗口和节假日的推荐增强:
 * - 工作日早晚高峰/午休
 * - 周末全天分时段
 * - 节假日日历 (自动检测)
 * - 开心时段/闪购事件
 * 节日/时段命中 → 分数提升 × boostFactor
 */

import { Injectable } from '@nestjs/common'
import { BasePromotionStrategy } from './promotion.strategy'
import type { PromotionContext, PromotionCandidate } from './promotion.entity'
import type { Candidate } from '../recommend.entity'
import {
  type TimeWindow,
  type TimeBoostResult,
  type HolidayDefinition,
  type TimeWindowType,
  DEFAULT_TIME_WINDOWS,
  DEFAULT_HOLIDAYS,
  DEFAULT_TIME_BOOST_FACTOR,
  DEFAULT_HOLIDAY_BOOST_FACTOR,
} from './promotion.entity'

// ============================================================
// 时段分析器
// ============================================================

@Injectable()
export class TimeAnalyzer {
  /**
   * 分析当前时间所处的所有活跃时段
   */
  analyze(
    dateTime: Date,
    windows: TimeWindow[],
    holidays: HolidayDefinition[],
    timezoneOffsetMinutes: number = 0,
  ): TimeBoostResult {
    // 调整时区
    const localDate = this.toLocalDate(dateTime, timezoneOffsetMinutes)
    const dayOfWeek = localDate.getDay()
    const hour = localDate.getHours()
    const month = localDate.getMonth() + 1
    const dayOfMonth = localDate.getDate()

    // 检测各时段
    const activeWindows: TimeWindow[] = []

    for (const window of windows) {
      if (!this.isWindowActive(window, dayOfWeek, hour, month, dayOfMonth)) continue
      activeWindows.push(window)
    }

    // 检测节假日
    const activeHolidays = this.getActiveHolidays(localDate, holidays)

    // 如果是节假日, 添加节假日时段
    for (const h of activeHolidays) {
      activeWindows.push({
        name: h.name,
        type: 'holiday',
        priority: h.priority,
        boostFactor: h.boostFactor,
        daysOfWeek: [],
        startHour: 0,
        endHour: 24,
        metadata: { holidayName: h.name },
      })
    }

    // 按优先级排序
    activeWindows.sort((a, b) => b.priority - a.priority)

    // 计算总 boost 因子 (最高优先级 + 叠加)
    let totalBoostFactor = 1.0
    let highestPriorityWindow: TimeWindow | null = null
    if (activeWindows.length > 0) {
      highestPriorityWindow = activeWindows[0]
      // 基础 boost 取最高优先级
      totalBoostFactor = highestPriorityWindow.boostFactor
      // 叠加节假日
      if (activeHolidays.length > 0) {
        totalBoostFactor *= 1.2 // 节假日额外叠加 20%
      }
    }

    return {
      windows: activeWindows,
      totalBoostFactor,
      activeWindowName: highestPriorityWindow?.name ?? null,
      isHoliday: activeHolidays.length > 0,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isFlashSale: activeWindows.some(w => w.type === 'flash-sale'),
    }
  }

  /**
   * 判断时段窗口是否活跃
   */
  private isWindowActive(
    window: TimeWindow,
    dayOfWeek: number,
    hour: number,
    month: number,
    dayOfMonth: number,
  ): boolean {
    // 检查星期
    if (window.daysOfWeek.length > 0 && !window.daysOfWeek.includes(dayOfWeek)) {
      return false
    }

    // 检查月份
    if (window.months && window.months.length > 0 && !window.months.includes(month)) {
      return false
    }

    // 检查日期 (特定日)
    if (window.dates && window.dates.length > 0 && !window.dates.includes(dayOfMonth)) {
      return false
    }

    // 检查小时
    if (window.startHour < window.endHour) {
      return hour >= window.startHour && hour < window.endHour
    }
    // 跨天 (例如 22:00 - 02:00)
    return hour >= window.startHour || hour < window.endHour
  }

  /**
   * 获取活跃的节假日
   */
  private getActiveHolidays(
    localDate: Date,
    holidays: HolidayDefinition[],
  ): HolidayDefinition[] {
    const mmdd = this.formatMMDD(localDate)
    return holidays.filter(h => h.date === mmdd)
  }

  /**
   * 获取指定月份的所有节假日
   */
  getHolidaysByMonth(month: number, holidays: HolidayDefinition[]): HolidayDefinition[] {
    return holidays.filter(h => {
      const m = parseInt(h.date.split('-')[0], 10)
      return m === month
    })
  }

  /**
   * 获取即将到来的下一个节假日
   */
  getNextHoliday(
    dateTime: Date,
    holidays: HolidayDefinition[],
    timezoneOffsetMinutes: number = 0,
  ): HolidayDefinition | null {
    const localDate = this.toLocalDate(dateTime, timezoneOffsetMinutes)
    const todayMMDD = this.formatMMDD(localDate)
    const todayNum = this.mmddToNumber(todayMMDD)

    let nextHoliday: HolidayDefinition | null = null
    let minDiff = 366

    for (const h of holidays) {
      const hNum = this.mmddToNumber(h.date)
      let diff = hNum - todayNum
      if (diff <= 0) diff += 366  // 跨年
      if (diff < minDiff) {
        minDiff = diff
        nextHoliday = h
      }
    }

    return nextHoliday
  }

  /**
   * 获取本日所有活跃节假日
   */
  getActiveHolidaysForDate(
    dateTime: Date,
    holidays: HolidayDefinition[],
    timezoneOffsetMinutes: number = 0,
  ): HolidayDefinition[] {
    const localDate = this.toLocalDate(dateTime, timezoneOffsetMinutes)
    return this.getActiveHolidays(localDate, holidays)
  }

  /**
   * 创建节假日时段窗口
   */
  createHolidayWindow(holiday: HolidayDefinition): TimeWindow {
    return {
      name: holiday.name,
      type: 'holiday',
      priority: holiday.priority,
      boostFactor: holiday.boostFactor,
      daysOfWeek: [],
      startHour: 0,
      endHour: 24,
      metadata: { holidayName: holiday.name },
    }
  }

  /**
   * 创建闪购时段窗口
   */
  createFlashSaleWindow(
    name: string,
    startHour: number,
    endHour: number,
    daysOfWeek: number[],
    boostFactor: number = 3.0,
  ): TimeWindow {
    return {
      name,
      type: 'flash-sale',
      priority: 10,
      boostFactor,
      daysOfWeek,
      startHour,
      endHour,
    }
  }

  // ============================================================
  // 工具方法
  // ============================================================

  private toLocalDate(dateTime: Date, offsetMinutes: number): Date {
    const utcMs = dateTime.getTime()
    const localMs = utcMs + offsetMinutes * 60 * 1000
    return new Date(localMs)
  }

  private formatMMDD(date: Date): string {
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${m}-${d}`
  }

  private mmddToNumber(mmdd: string): number {
    const parts = mmdd.split('-')
    return parseInt(parts[0], 10) * 100 + parseInt(parts[1], 10)
  }
}

// ============================================================
// 时段增强策略 (实现 IPromotionStrategy)
// ============================================================

@Injectable()
export class TimeBasedBoosterStrategy extends BasePromotionStrategy {
  readonly type = 'time-boosted' as const
  readonly name = '时段增强'
  readonly priority = 60

  private timeWindows: TimeWindow[]
  private holidays: HolidayDefinition[]

  constructor(
    private readonly analyzer: TimeAnalyzer,
    timeWindows?: TimeWindow[],
    holidays?: HolidayDefinition[],
  ) {
    super()
    this.timeWindows = timeWindows ?? DEFAULT_TIME_WINDOWS.map(w => ({ ...w }))
    this.holidays = holidays ?? DEFAULT_HOLIDAYS.map(h => ({ ...h }))
  }

  isApplicable(context: PromotionContext): boolean {
    if (!context.currentDateTime) return false
    const result = this.analyzer.analyze(
      context.currentDateTime,
      this.timeWindows,
      this.holidays,
      context.timezoneOffsetMinutes,
    )
    return result.windows.length > 0
  }

  apply(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionCandidate[] {
    const result = this.analyzeCurrentTime(context)
    if (result.windows.length === 0) {
      return candidates.map(c => ({
        itemId: c.itemId,
        score: c.score,
        baseScore: c.score,
        boostedScore: 0,
        strategy: this.type,
        reasoning: c.reasoning,
        metadata: c.metadata,
      }))
    }

    const boostFactor = result.totalBoostFactor
    const activeWindowName = result.activeWindowName ?? ''

    return candidates.map(candidate => {
      // 按节假日相关类目额外增强
      let finalBoost = boostFactor
      if (result.isHoliday && context.itemCategory) {
        const holidayWindows = result.windows.filter(w => w.type === 'holiday')
        for (const hw of holidayWindows) {
          const holidayName = (hw.metadata?.holidayName as string) ?? ''
          const holiday = this.holidays.find(h => h.name === holidayName)
          if (
            holiday?.categoryRelevance &&
            holiday.categoryRelevance.includes(context.itemCategory)
          ) {
            finalBoost += 0.5 // 类目匹配额外 +50%
          }
        }
      }

      return this.toPromotionCandidate(
        candidate,
        this.type,
        activeWindowName ? `${activeWindowName}热推` : '时段热推',
        finalBoost,
        {
          timeWindowName: activeWindowName,
          isHoliday: result.isHoliday,
          isWeekend: result.isWeekend,
          boostFactor: finalBoost,
        },
      )
    })
  }

  /**
   * 获取当前时段分析结果 (给外部调用)
   */
  analyzeCurrentTime(context: PromotionContext): TimeBoostResult {
    const dateTime = context.currentDateTime ?? new Date()
    return this.analyzer.analyze(
      dateTime,
      this.timeWindows,
      this.holidays,
      context.timezoneOffsetMinutes,
    )
  }

  /**
   * 获取可用的时段窗口元数据
   */
  getTimeWindowInfo(): TimeWindow[] {
    return this.timeWindows
  }

  /**
   * 获取节假日日历
   */
  getHolidayInfo(): HolidayDefinition[] {
    return this.holidays
  }

  /**
   * 添加自定义时段窗口
   */
  addTimeWindow(window: TimeWindow): void {
    this.timeWindows.push(window)
  }

  /**
   * 添加自定义节假日
   */
  addHoliday(holiday: HolidayDefinition): void {
    // 检查是否已存在同一天
    const existing = this.holidays.findIndex(h => h.date === holiday.date)
    if (existing >= 0) {
      this.holidays[existing] = holiday
    } else {
      this.holidays.push(holiday)
    }
  }
}
