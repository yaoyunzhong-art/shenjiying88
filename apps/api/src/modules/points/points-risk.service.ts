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
