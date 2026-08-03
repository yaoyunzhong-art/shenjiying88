/**
 * monitor-collector.service.ts — P-50 V2 竞争数据采集服务
 *
 * 职责:
 *   1. 模拟采集美团/抖音竞品数据（mock实现，接口可替换为HTTP爬虫）
 *   2. 支持「增量」vs「全量」扫描
 *   3. 告警去重：同一竞品同一类型24h内不重复
 *
 * 扩展路径:
 *   将 collectXxx 方法体内的 mock 逻辑替换为 HTTP 请求即可接入真实数据源。
 */
import { Injectable, Logger } from '@nestjs/common'
import type { CompetitorAlert, CompetitorAlertType, AlertSeverity, ScanMode, TrendPoint } from './intelligence.entity'

// ───  Mock 数据工厂  ──────────────────────────────────

interface MockCompetitor {
  name: string
  city: string
  basePrice: number
  rating: number
  hasVR: boolean
  hasClaw: boolean
  activityDays: number
}

const MOCK_POOL: MockCompetitor[] = [
  { name: '竞品A', city: '上海', basePrice: 68, rating: 3.8, hasVR: true, hasClaw: true, activityDays: 14 },
  { name: '竞品B', city: '上海', basePrice: 65, rating: 4.0, hasVR: false, hasClaw: true, activityDays: 7 },
  { name: '竞品C', city: '上海', basePrice: 72, rating: 4.2, hasVR: true, hasClaw: false, activityDays: 21 },
  { name: '竞品D', city: '北京', basePrice: 80, rating: 3.9, hasVR: true, hasClaw: true, activityDays: 10 },
  { name: '竞品E', city: '北京', basePrice: 75, rating: 4.1, hasVR: false, hasClaw: true, activityDays: 5 },
  { name: '竞品F', city: '深圳', basePrice: 60, rating: 3.7, hasVR: true, hasClaw: false, activityDays: 30 },
  { name: '竞品G', city: '广州', basePrice: 55, rating: 3.6, hasVR: false, hasClaw: true, activityDays: 3 },
  { name: '竞品H', city: '成都', basePrice: 50, rating: 4.3, hasVR: true, hasClaw: true, activityDays: 20 },
  { name: '竞品I', city: '成都', basePrice: 48, rating: 3.5, hasVR: false, hasClaw: false, activityDays: 1 },
  { name: '竞品J', city: '杭州', basePrice: 62, rating: 4.0, hasVR: true, hasClaw: true, activityDays: 12 },
]

let seqId = 0

function nextId(): string {
  seqId++
  const ts = Date.now().toString(36)
  return `alert-${ts}-${seqId}`
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function dateOffset(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 3600000)
  d.setSeconds(0, 0)
  return d.toISOString()
}

// ─── 服务 ──────────────────────────────────────────────

@Injectable()
export class MonitorCollectorService {
  private readonly logger = new Logger(MonitorCollectorService.name)

  /** 采集竞品价格异动 */
  async collectPriceChanges(city?: string): Promise<CompetitorAlert[]> {
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const count = randomInt(1, Math.min(3, pool.length))
    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < count; i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const isUp = Math.random() > 0.5
      const delta = randomInt(5, 20)
      const newPrice = isUp ? comp.basePrice + delta : Math.max(comp.basePrice - delta, 30)
      const pct = Math.round(Math.abs(newPrice - comp.basePrice) / comp.basePrice * 100)
      const severity: AlertSeverity = pct >= 15 ? 'high' : pct >= 8 ? 'medium' : 'low'

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'price_change',
        severity,
        description: isUp
          ? `${comp.name}将价格从¥${comp.basePrice}上调至¥${newPrice}，涨幅${pct}%`
          : `${comp.name}将价格从¥${comp.basePrice}下调至¥${newPrice}，降幅${pct}%`,
        detectedAt: dateOffset(randomInt(0, 2)),
        recommendedAction: severity === 'high'
          ? '建议：密切关注竞品定价策略，评估是否调整自身价格体系'
          : '建议：继续保持监控，观察竞品后续动作',
      })
    }
    return results
  }

  /** 采集竞品新活动 */
  async collectNewActivities(city?: string): Promise<CompetitorAlert[]> {
    const ACTIVITY_THEMES = [
      '暑期亲子卡', '周末狂欢夜', '开学季特惠',
      '中秋团圆套票', '国庆畅玩周', '会员专属日',
    ]
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const count = randomInt(1, 2)
    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < count; i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const theme = pick(ACTIVITY_THEMES)
      const price = randomInt(199, 499)
      const times = randomInt(5, 20)
      const hasDiscount = Math.random() > 0.5
      const severity: AlertSeverity = hasDiscount && price < 300 ? 'high' : price < 400 ? 'medium' : 'low'

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'new_activity',
        severity,
        description: hasDiscount
          ? `${comp.name}推出"${theme}"活动，¥${price}/${times}次，含限时折扣`
          : `${comp.name}推出"${theme}"活动，¥${price}/${times}次`,
        detectedAt: dateOffset(randomInt(1, 8)),
        recommendedAction: severity === 'high'
          ? '建议：尽快评估对标活动方案，防止客源流失'
          : '建议：保持关注，记录竞品活动日历',
      })
    }
    return results
  }

  /** 采集竞品优惠 */
  async collectPromotions(city?: string): Promise<CompetitorAlert[]> {
    const PLATFORMS = ['抖音', '美团', '大众点评', '高德', '小红书']
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const count = randomInt(1, 2)
    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < count; i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const platform = pick(PLATFORMS)
      const originalPrice = comp.basePrice
      const promoPrice = Math.max(Math.round(originalPrice * randomInt(40, 75) / 100), 20)
      const discount = Math.round((1 - promoPrice / originalPrice) * 100)
      const days = randomInt(1, 7)
      const severity: AlertSeverity = discount >= 40 ? 'high' : discount >= 20 ? 'medium' : 'low'

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'new_promotion',
        severity,
        description: `${comp.name}在${platform}推出¥${promoPrice}团购券(原价¥${originalPrice})，${discount}%折扣，限时${days}天`,
        detectedAt: dateOffset(randomInt(0, 4)),
        recommendedAction: severity === 'high'
          ? '建议：评估竞品价格压力，准备差异化促销方案'
          : '建议：继续观察竞品渠道策略',
      })
    }
    return results
  }

  /** 采集竞品评分异动 */
  async collectRatingChanges(city?: string): Promise<CompetitorAlert[]> {
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const count = randomInt(0, 2)
    if (count === 0) return []

    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < count; i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const isUp = Math.random() > 0.5
      const delta = Math.round(randomInt(1, 5) * 10) / 100
      const newRating = isUp
        ? Math.min(comp.rating + delta, 5.0)
        : Math.max(comp.rating - delta, 1.0)
      const change = Math.round(delta * 100)
      const severity: AlertSeverity = !isUp && change >= 3 ? 'high' : change >= 2 ? 'medium' : 'low'

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'rating_change',
        severity,
        description: isUp
          ? `${comp.name}评分从${comp.rating.toFixed(1)}升至${newRating.toFixed(1)}，近期好评增多`
          : `${comp.name}评分从${comp.rating.toFixed(1)}降至${newRating.toFixed(1)}，近期差评增多`,
        detectedAt: dateOffset(randomInt(2, 12)),
        recommendedAction: severity === 'high' && !isUp
          ? '建议：抓住竞品口碑下滑窗口，加强自身服务品质'
          : '建议：持续监控各平台评分变化趋势',
      })
    }
    return results
  }

  /** 采集竞品设备异动 */
  async collectEquipmentChanges(city?: string): Promise<CompetitorAlert[]> {
    const EQUIPMENT_TYPES = [
      'VR头显', '跳舞机', '篮球机', '夹娃娃机',
      '赛车模拟器', '射击设备', '保龄球道', '射箭靶道',
    ]
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < randomInt(0, 2); i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const equip = pick(EQUIPMENT_TYPES)
      const isNew = Math.random() > 0.5
      const count = randomInt(2, 6)
      const severity: AlertSeverity = isNew && equip === 'VR头显' ? 'high' : 'medium'

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'equipment_change',
        severity,
        description: isNew
          ? `${comp.name}新增${count}台${equip}，设备能力显著提升`
          : `${comp.name}更换${count}台${equip}，疑似旧设备升级`,
        detectedAt: dateOffset(randomInt(4, 48)),
        recommendedAction: '建议：实地考察竞品设备更新情况，评估自身设备竞争力',
      })
    }
    return results
  }

  /** 采集竞品政策异动 */
  async collectPolicyChanges(city?: string): Promise<CompetitorAlert[]> {
    const POLICY_TYPES = [
      { desc: '营业时间延长至凌晨2点', sev: 'medium' as AlertSeverity },
      { desc: '营业时间调整为10:00-22:00', sev: 'low' as AlertSeverity },
      { desc: '取消原有限时段优惠', sev: 'medium' as AlertSeverity },
      { desc: '新增"凌晨畅玩"时段，22点后半价', sev: 'high' as AlertSeverity },
      { desc: '调整会员权益，积分抵现比例翻倍', sev: 'medium' as AlertSeverity },
      { desc: '新增团体接待规定，10人以上需预约', sev: 'low' as AlertSeverity },
    ]
    const pool = city ? MOCK_POOL.filter(c => c.city === city) : MOCK_POOL
    if (pool.length === 0) return []

    const results: CompetitorAlert[] = []
    const used = new Set<string>()

    for (let i = 0; i < randomInt(0, 2); i++) {
      const comp = pick(pool)
      if (used.has(comp.name)) continue
      used.add(comp.name)

      const policy = pick(POLICY_TYPES)

      results.push({
        id: nextId(),
        storeName: comp.name,
        city: comp.city,
        type: 'policy_change',
        severity: policy.sev,
        description: `${comp.name}${policy.desc}`,
        detectedAt: dateOffset(randomInt(2, 24)),
        recommendedAction: policy.sev === 'high'
          ? '建议：密切关注市场反应，评估是否需要跟进调整营业时间'
          : '建议：记录竞品政策变化，积累决策参考',
      })
    }
    return results
  }

  // ─── 扫描入口 ──────────────────────────────────────

  async incrementalScan(city?: string): Promise<CompetitorAlert[]> {
    this.logger.log(`[incremental] 开始增量扫描 city=${city ?? 'all'}`)

    const results = await Promise.all([
      this.collectPriceChanges(city),
      this.collectNewActivities(city),
      this.collectPromotions(city),
      this.collectRatingChanges(city),
      this.collectEquipmentChanges(city),
      this.collectPolicyChanges(city),
    ])
    const flat = results.flat()
    for (const a of flat) a.scanMode = 'incremental'

    this.logger.log(`[incremental] 采集到 ${flat.length} 条原始告警`)
    return flat
  }

  async fullScan(city?: string): Promise<CompetitorAlert[]> {
    this.logger.log(`[full] 开始全量扫描 city=${city ?? 'all'}`)

    const results = await Promise.all([
      this.collectPriceChanges(city),
      this.collectNewActivities(city),
      this.collectPromotions(city),
      this.collectRatingChanges(city),
      this.collectEquipmentChanges(city),
      this.collectPolicyChanges(city),
      // 全量模式额外扫描一轮，模拟更大覆盖
      this.collectPriceChanges(city),
    ])
    const flat = results.flat()
    for (const a of flat) a.scanMode = 'full'

    this.logger.log(`[full] 全量扫描产生 ${flat.length} 条告警`)
    return flat
  }

  /**
   * 告警去重：同一天同一竞品同一类型仅保留最新一条
   */
  deduplicate(alerts: CompetitorAlert[]): CompetitorAlert[] {
    const seen = new Map<string, CompetitorAlert>()

    for (const alert of alerts) {
      const key = this.makeDedupKey(alert)
      const existing = seen.get(key)
      if (!existing || new Date(alert.detectedAt).getTime() > new Date(existing.detectedAt).getTime()) {
        if (existing) existing.deduped = true
        seen.set(key, alert)
      } else {
        alert.deduped = true
      }
    }

    return Array.from(seen.values())
  }

  /**
   * 生成 7 天异动走势数据
   */
  async generateTrend(): Promise<TrendPoint[]> {
    const types: CompetitorAlertType[] = [
      'price_change', 'new_activity', 'new_promotion',
      'rating_change', 'equipment_change', 'policy_change',
    ]
    const trend: TrendPoint[] = []
    for (let day = 6; day >= 0; day--) {
      const d = new Date(Date.now() - day * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      for (const type of types) {
        trend.push({
          date: dateStr,
          type,
          count: randomInt(0, 5),
        })
      }
    }
    return trend
  }

  private makeDedupKey(alert: CompetitorAlert): string {
    const detected = new Date(alert.detectedAt).getTime()
    const bucket = Math.floor(detected / 86400000)
    return `${alert.storeName}|${alert.type}|${bucket}`
  }
}
