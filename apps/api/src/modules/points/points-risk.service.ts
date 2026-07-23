/**
 * points-risk.service.ts - T107-1 Points 风控服务
 *
 * 包含三大风控机制：
 * - InflationMonitor: 通胀实时监控
 * - CircuitBreaker: 熔断机制
 * - ExpirationNotifier: 过期提醒
 */

import { Injectable } from '@nestjs/common'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface InflationTrendPoint {
  date: string
  issuance: number
  redemption: number
  index: number
}

export interface CircuitState {
  failures: number
  lastFailure: number | null
  state: 'closed' | 'open' | 'half-open'
  openedAt: number | null
}

export interface ReminderRecord {
  memberId: string
  points: number
  expireAt: Date
  reminderCount: number
  scheduledAt: Date
}

/** BS-0278: 过期提醒计划 — 5次定时 */
export interface ExpirationReminderSchedule {
  memberId: string
  points: number
  expireAt: Date
  /** 已触发的提醒索引 (0-4) */
  triggered: number[]
  /** 排定的提醒日期 (第30天/14天/7天/3天/1天) */
  reminderDates: Date[]
  createdAt: Date
}

/** BS-0278: 提醒触发结果 */
export interface ReminderTriggerResult {
  sent: boolean
  scheduleIndex: number
  daysBefore: number
  message: string
}

export interface AlertPayload {
  type: 'inflation' | 'circuit_breaker' | 'expiration'
  threshold: number
  actual: number
  message: string
  timestamp: number
}

// ============================================================================
// InflationMonitor - 通胀实时监控
// ============================================================================

@Injectable()
export class InflationMonitor {
  private totalIssuance = 0
  private totalRedemption = 0

  private readonly dailyIssuance = new Map<string, number>()
  private readonly dailyRedemption = new Map<string, number>()
  private readonly datePrefix = () => new Date().toISOString().slice(0, 10)

  recordPointIssuance(amount: number, memberId: string): void {
    if (amount <= 0) return
    this.totalIssuance += amount

    const today = this.datePrefix()
    const key = `${today}:${memberId}`
    this.dailyIssuance.set(key, (this.dailyIssuance.get(key) ?? 0) + amount)
  }

  recordPointRedemption(amount: number, memberId: string): void {
    if (amount <= 0) return
    this.totalRedemption += amount

    const today = this.datePrefix()
    const key = `${today}:${memberId}`
    this.dailyRedemption.set(key, (this.dailyRedemption.get(key) ?? 0) + amount)
  }

  getTotalIssuance(): number {
    return this.totalIssuance
  }

  getInflationIndex(): number {
    if (this.totalRedemption === 0) {
      return this.totalIssuance > 0 ? Number.MAX_SAFE_INTEGER : 1
    }
    return this.totalIssuance / this.totalRedemption
  }

  getInflationTrend(days = 7): InflationTrendPoint[] {
    const result: InflationTrendPoint[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)

      let issuance = 0
      let redemption = 0

      for (const [key, val] of this.dailyIssuance) {
        if (key.startsWith(dateStr)) issuance += val
      }
      for (const [key, val] of this.dailyRedemption) {
        if (key.startsWith(dateStr)) redemption += val
      }

      const index = redemption === 0 ? (issuance > 0 ? Infinity : 1) : issuance / redemption

      result.push({ date: dateStr, issuance, redemption, index })
    }

    return result
  }

  alertIfHigh(threshold = 1.5): AlertPayload | null {
    const index = this.getInflationIndex()
    if (!isFinite(index) || index <= threshold) return null

    return {
      type: 'inflation',
      threshold,
      actual: index,
      message: `通胀指数 ${index.toFixed(2)} 超过阈值 ${threshold}`,
      timestamp: Date.now()
    }
  }

  reset(): void {
    this.totalIssuance = 0
    this.totalRedemption = 0
    this.dailyIssuance.clear()
    this.dailyRedemption.clear()
  }
}

// ============================================================================
// CircuitBreaker - 熔断机制
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold?: number
  recoveryTimeoutMs?: number
  halfOpenAttempts?: number
}

const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
  failureThreshold: 5,
  recoveryTimeoutMs: 60_000,
  halfOpenAttempts: 3
}

@Injectable()
export class CircuitBreaker {
  private readonly circuits = new Map<string, CircuitState>()
  private readonly config: Required<CircuitBreakerConfig>

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private getOrCreate(endpoint: string): CircuitState {
    if (!this.circuits.has(endpoint)) {
      this.circuits.set(endpoint, {
        failures: 0,
        lastFailure: null,
        state: 'closed',
        openedAt: null
      })
    }
    return this.circuits.get(endpoint)!
  }

  recordFailure(endpoint: string): void {
    const circuit = this.getOrCreate(endpoint)
    circuit.failures++
    circuit.lastFailure = Date.now()

    if (circuit.state === 'half-open') {
      this.trip(endpoint)
      return
    }

    if (circuit.failures >= this.config.failureThreshold) {
      this.trip(endpoint)
    }
  }

  recordSuccess(endpoint: string): void {
    const circuit = this.getOrCreate(endpoint)

    if (circuit.state === 'half-open') {
      circuit.failures = 0
      this.circuits.delete(endpoint)
      return
    }

    if (circuit.state === 'closed') {
      circuit.failures = Math.max(0, circuit.failures - 1)
    }
  }

  isOpen(endpoint: string): boolean {
    const circuit = this.circuits.get(endpoint)
    if (!circuit) return false

    if (circuit.state === 'open') {
      const elapsed = Date.now() - (circuit.openedAt ?? 0)
      if (elapsed >= this.config.recoveryTimeoutMs) {
        this.halfOpen(endpoint)
        return false
      }
      return true
    }

    return false
  }

  getStatus(endpoint: string): {
    state: 'closed' | 'open' | 'half-open'
    failures: number
    remainingMs: number | null
  } {
    const circuit = this.circuits.get(endpoint)

    if (!circuit) {
      return { state: 'closed', failures: 0, remainingMs: null }
    }

    let remainingMs: number | null = null
    if (circuit.state === 'open' && circuit.openedAt) {
      const elapsed = Date.now() - circuit.openedAt
      remainingMs = Math.max(0, this.config.recoveryTimeoutMs - elapsed)
    }

    return {
      state: circuit.state,
      failures: circuit.failures,
      remainingMs
    }
  }

  halfOpen(endpoint: string): void {
    const circuit = this.getOrCreate(endpoint)
    circuit.state = 'half-open'
    circuit.failures = 0
  }

  private trip(endpoint: string): void {
    const circuit = this.getOrCreate(endpoint)
    circuit.state = 'open'
    circuit.openedAt = Date.now()
    circuit.failures = this.config.failureThreshold
  }

  reset(endpoint: string): void {
    this.circuits.delete(endpoint)
  }

  resetAll(): void {
    this.circuits.clear()
  }
}

// ============================================================================
// ExpirationNotifier - 过期提醒
// ============================================================================

@Injectable()
export class ExpirationNotifier {
  private readonly reminders = new Map<string, ReminderRecord>()
  private readonly MAX_REMINDERS = 5

  /** BS-0278: 过期提醒排程存储（按精确时间点） */
  private readonly schedules = new Map<string, ExpirationReminderSchedule>()

  /** BS-0278: 过期提醒时间点：第30天/14天/7天/3天/1天 */
  private readonly REMINDER_BEFORE_DAYS = [30, 14, 7, 3, 1]

  scheduleReminder(memberId: string, points: number, expireAt: Date): void {
    if (this.reminders.has(memberId)) return

    this.reminders.set(memberId, {
      memberId,
      points,
      expireAt,
      reminderCount: 0,
      scheduledAt: new Date()
    })
  }

  sendReminder(memberId: string, points: number, reminderCount?: number): boolean {
    const record = this.reminders.get(memberId)
    if (!record) return false

    const count = reminderCount ?? record.reminderCount
    if (count >= this.MAX_REMINDERS) return false

    record.reminderCount = count + 1
    record.points = points

    return true
  }

  cancelReminder(memberId: string): boolean {
    return this.reminders.delete(memberId)
  }

  getReminderCount(memberId: string): number {
    return this.reminders.get(memberId)?.reminderCount ?? 0
  }

  getReminder(memberId: string): ReminderRecord | null {
    return this.reminders.get(memberId) ?? null
  }

  hasScheduled(memberId: string): boolean {
    return this.reminders.has(memberId)
  }

  getAllReminders(): ReminderRecord[] {
    return Array.from(this.reminders.values())
  }

  clear(): void {
    this.reminders.clear()
    this.schedules.clear()
  }

  // ════════════════════════════════════════════════════════════════
  // BS-0278: 积分过期5次提醒（第30天/14天/7天/3天/1天）
  // ════════════════════════════════════════════════════════════════

  /**
   * BS-0278: 排定积分过期5次提醒时间表
   * 过期前第30天、14天、7天、3天、1天各提醒一次
   * @returns 排定的提醒日期列表
   */
  schedule5TimingReminder(memberId: string, points: number, expireAt: Date): ExpirationReminderSchedule {
    const reminderDates = this.REMINDER_BEFORE_DAYS.map(daysBefore => {
      const date = new Date(expireAt)
      date.setDate(date.getDate() - daysBefore)
      return date
    })

    const schedule: ExpirationReminderSchedule = {
      memberId,
      points,
      expireAt,
      triggered: [],
      reminderDates,
      createdAt: new Date()
    }

    this.schedules.set(memberId, schedule)

    // 保持原有提醒
    if (!this.reminders.has(memberId)) {
      this.scheduleReminder(memberId, points, expireAt)
    }

    return schedule
  }

  /**
   * BS-0278: 检查并触发当天的过期提醒
   * 由定时任务每日调用
   * @returns 当天触发的提醒列表
   */
  checkAndSend5TimingReminders(): ReminderTriggerResult[] {
    const results: ReminderTriggerResult[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const [memberId, schedule] of this.schedules.entries()) {
      for (let i = 0; i < schedule.reminderDates.length; i++) {
        const reminderDate = schedule.reminderDates[i]
        if (!reminderDate) continue

        // 已触发过的跳过
        if (schedule.triggered.includes(i)) continue

        const reminderDay = new Date(reminderDate)
        reminderDay.setHours(0, 0, 0, 0)

        if (reminderDay.getTime() <= today.getTime()) {
          const daysBefore = this.REMINDER_BEFORE_DAYS[i]!
          const message = this.buildReminderMessage(memberId, schedule.points, daysBefore)

          // 标记已触发
          schedule.triggered.push(i)
          this.schedules.set(memberId, schedule)

          // 同时记录到旧版提醒
          const record = this.reminders.get(memberId)
          if (record) {
            record.reminderCount = Math.max(record.reminderCount, schedule.triggered.length)
          }

          results.push({
            sent: true,
            scheduleIndex: i,
            daysBefore,
            message
          })
        }
      }
    }

    return results
  }

  /**
   * BS-0278: 获取指定会员的过期提醒排程
   */
  getReminderSchedule(memberId: string): ExpirationReminderSchedule | undefined {
    return this.schedules.get(memberId)
  }

  /**
   * BS-0278: 获取所有排程中的最近提醒日期
   */
  getAllSchedules(): ExpirationReminderSchedule[] {
    return Array.from(this.schedules.values())
  }

  /**
   * BS-0278: 取消指定会员的5次提醒排程
   */
  cancelSchedule(memberId: string): boolean {
    return this.schedules.delete(memberId)
  }

  /**
   * BS-0278: 构建提醒消息
   */
  private buildReminderMessage(memberId: string, points: number, daysBefore: number): string {
    if (daysBefore === 1) {
      return `【紧急提醒】会员 ${memberId} 的 ${points} 积分将于明天过期，请尽快使用`
    }
    return `【积分过期提醒】会员 ${memberId} 的 ${points} 积分将在 ${daysBefore} 天后过期`
  }
}

// ============================================================================
// PointsRiskService - 统一导出
// ============================================================================

@Injectable()
export class PointsRiskService {
  readonly inflation: InflationMonitor
  readonly circuitBreaker: CircuitBreaker
  readonly expiration: ExpirationNotifier

  constructor() {
    this.inflation = new InflationMonitor()
    this.circuitBreaker = new CircuitBreaker()
    this.expiration = new ExpirationNotifier()
  }
}
