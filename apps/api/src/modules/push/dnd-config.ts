/**
 * dnd-config.ts — 免打扰 (DND) 与频控配置
 *
 * WP-13A: 免打扰时段配置 + 每日/每周频控限制
 *
 * BS-0168 ~ BS-0184
 *
 * 使用方式：
 *   const dnd = new DndConfigService()
 *   if (dnd.isInDndHours(tenantId)) {
 *     // 跳过非 P0 推送
 *   }
 *
 *   const cap = await frequencyCapService.checkAndIncrement(tenantId, memberId)
 *   if (cap.exceeded) {
 *     // 触发降级或等待
 *   }
 */

export interface DndHoursConfig {
  /** 是否启用免打扰时段 */
  enabled: boolean
  /** 每日免打扰起始时间 (HH:mm, 24h) */
  startTime: string
  /** 每日免打扰结束时间 (HH:mm, 24h) */
  endTime: string
  /** 免打扰时允许推送的最低级 (P0 默认不受限制) */
  bypassBelow?: 'P0' | 'P1'
}

export interface FrequencyCapConfig {
  /** 每日最大推送次数 */
  dailyMax: number
  /** 每周最大推送次数 */
  weeklyMax: number
  /** 每分钟最大推送频率 (tps 限制) */
  perMinuteMax: number
  /** 降级等待秒数 */
  cooldownSeconds: number
}

export interface FrequencyCapState {
  /** 当前日期 (YYYY-MM-DD) 的推送次数 */
  dailyCount: number
  /** 当前日历周的推送次数 */
  weeklyCount: number
  /** 上次推送时间戳 */
  lastPushAt: number | null
  /** 是否超出频控限制 */
  exceeded: boolean
}

/**
 * 默认免打扰配置
 * 每日 22:00 ~ 08:00, P0 不受限制
 */
export const DEFAULT_DND_CONFIG: DndHoursConfig = {
  enabled: true,
  startTime: '22:00',
  endTime: '08:00',
  bypassBelow: 'P0',
}

/**
 * 默认频控配置
 * 每日 50 次 / 每周 200 次 / 每分钟 10 次
 */
export const DEFAULT_FREQUENCY_CAP_CONFIG: FrequencyCapConfig = {
  dailyMax: 50,
  weeklyMax: 200,
  perMinuteMax: 10,
  cooldownSeconds: 5,
}

// ── In-memory 频控计数器 ──────────────────────────────────────

const dailyCounter = new Map<string, { date: string; count: number }>()
const weeklyCounter = new Map<string, { week: string; count: number }>()
const lastPushTimestamps = new Map<string, number>()

/**
 * DndConfigService — 免打扰时段配置
 *
 * 基础设施：当前使用内存存储 + 默认配置
 * 生产部署需改为从 DB / Config Center 加载租户级配置
 */
export class DndConfigService {
  private configs = new Map<string, DndHoursConfig>()

  /**
   * 设置租户的免打扰配置
   */
  setConfig(tenantId: string, config: Partial<DndHoursConfig>): DndHoursConfig {
    const existing = this.configs.get(tenantId) ?? { ...DEFAULT_DND_CONFIG }
    const merged: DndHoursConfig = {
      ...existing,
      ...config,
    }
    this.configs.set(tenantId, merged)
    return merged
  }

  /**
   * 获取租户的免打扰配置（若无配置则返回默认值）
   */
  getConfig(tenantId: string): DndHoursConfig {
    return this.configs.get(tenantId) ?? { ...DEFAULT_DND_CONFIG }
  }

  /**
   * 检查当前时间是否在租户的免打扰时段内
   */
  isInDndHours(tenantId: string): boolean {
    const config = this.getConfig(tenantId)

    if (!config.enabled) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // 支持跨天: startTime > endTime 表示跨越午夜
    const [startH, startM] = config.startTime.split(':').map(Number)
    const [endH, endM] = config.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes <= endMinutes) {
      // 同天内: 22:00 ~ 08:00 这种情况不可能，但用于边界
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    } else {
      // 跨天: 22:00 ~ 08:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }
  }

  /**
   * 检查推送是否被免打扰屏蔽
   * @param tenantId 租户 ID
   * @param isMandatory 是否强制推送 (P0 = true)
   * @returns true 表示应该放行，false 表示应被拦截
   */
  shouldAllow(tenantId: string, isMandatory: boolean): boolean {
    if (isMandatory) return true // P0 不受免打扰限制
    return !this.isInDndHours(tenantId)
  }

  /** 测试辅助: 清空所有配置 */
  reset(): void {
    this.configs.clear()
  }
}

/**
 * FrequencyCapService — 推送频控
 *
 * 基础设施：当前使用内存计数器
 * 生产部署需换用 Redis + Lua 脚本保证原子性 + 断电恢复
 */
export class FrequencyCapService {
  private configs = new Map<string, FrequencyCapConfig>()

  /**
   * 设置频控配置
   */
  setConfig(tenantId: string, config: Partial<FrequencyCapConfig>): FrequencyCapConfig {
    const existing = this.configs.get(tenantId) ?? { ...DEFAULT_FREQUENCY_CAP_CONFIG }
    const merged: FrequencyCapConfig = {
      ...existing,
      ...config,
    }
    this.configs.set(tenantId, merged)
    return merged
  }

  /**
   * 获取租户的频控配置
   */
  getConfig(tenantId: string): FrequencyCapConfig {
    return this.configs.get(tenantId) ?? { ...DEFAULT_FREQUENCY_CAP_CONFIG }
  }

  /**
   * 检查并递增频控计数器
   * @returns 频控状态
   */
  checkAndIncrement(tenantId: string, memberId: string): FrequencyCapState {
    const config = this.getConfig(tenantId)
    const key = `${tenantId}:${memberId}`

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const week = getWeekKey(now)

    // 每日计数器
    const daily = dailyCounter.get(key)
    const dailyCount = daily?.date === today ? daily.count : 0
    const newDailyCount = dailyCount + 1

    // 每周计数器
    const weekly = weeklyCounter.get(key)
    const weeklyCount = weekly?.week === week ? weekly.count : 0
    const newWeeklyCount = weeklyCount + 1

    // 上次推送时间
    const lastPushAt = lastPushTimestamps.get(key) ?? null

    // 检查是否超出
    const exceeded = this.isExceeded(config, key, newDailyCount, newWeeklyCount, lastPushAt)

    if (!exceeded) {
      // 更新计数器
      dailyCounter.set(key, { date: today, count: newDailyCount })
      weeklyCounter.set(key, { week, count: newWeeklyCount })
      lastPushTimestamps.set(key, Date.now())
    }

    return {
      dailyCount: newDailyCount,
      weeklyCount: newWeeklyCount,
      lastPushAt,
      exceeded,
    }
  }

  /**
   * 查询频控状态（不递增）
   */
  peek(tenantId: string, memberId: string): FrequencyCapState {
    const key = `${tenantId}:${memberId}`
    const daily = dailyCounter.get(key)
    const weekly = weeklyCounter.get(key)
    const lastPushAt = lastPushTimestamps.get(key) ?? null

    return {
      dailyCount: daily?.count ?? 0,
      weeklyCount: weekly?.count ?? 0,
      lastPushAt,
      exceeded: false,
    }
  }

  /**
   * 检查是否被频控拦截
   * @returns true = 可以推送, false = 触发频控
   */
  shouldAllow(tenantId: string, memberId: string): boolean {
    const state = this.checkAndIncrement(tenantId, memberId)
    return !state.exceeded
  }

  /**
   * 判断是否超出频控（抽出为独立方法以便测试和可读性）
   */
  private isExceeded(
    config: FrequencyCapConfig,
    _key: string,
    dailyCount: number,
    weeklyCount: number,
    lastPushAt: number | null
  ): boolean {
    if (dailyCount > config.dailyMax) return true
    if (weeklyCount > config.weeklyMax) return true
    if (lastPushAt !== null) {
      const elapsed = Date.now() - lastPushAt
      if (elapsed < config.cooldownSeconds * 1000) return true
      if (elapsed < 60_000 / config.perMinuteMax) return true
    }
    return false
  }

  /** 测试辅助: 清空所有状态 */
  reset(): void {
    dailyCounter.clear()
    weeklyCounter.clear()
    lastPushTimestamps.clear()
    this.configs.clear()
  }
}

/**
 * 获取本周的标识键 (ISO 8601)
 */
function getWeekKey(date: Date): string {
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / 86400000)
  const weekNumber = Math.ceil((dayOfYear + yearStart.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}
