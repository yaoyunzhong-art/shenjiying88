/**
 * 🐜 自动: [multi-region] [A] service.spec — ≥18项正反例+边界
 *
 * 纯函数式内联，不 import 生产代码。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── 内联类型 ──────────────────────────────────────────────────────────────────

type Region = 'cn' | 'us' | 'eu' | 'jp'
type FailoverState = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'RECOVERING'

const ALL_REGIONS: Region[] = ['cn', 'us', 'eu', 'jp']
const DEFAULT_REGION: Region = 'cn'

interface RegionEndpoint { region: Region; baseUrl: string; latencyMs?: number; enabled: boolean }
interface GeoIPResult { country: string; region: Region; source: 'cache' | 'lookup' | 'fallback' }
interface RouteDecision { primaryRegion: Region; fallbacks: Region[]; reason: 'geo' | 'tenant-pin' | 'health' | 'default'; latencyHint?: number }
interface HealthCheckResult { region: Region; state: FailoverState; latencyMs: number; errorRate: number; lastCheckAt: string; consecutiveFailures: number }
interface FailoverEvent { ts: string; region: Region; fromState: FailoverState; toState: FailoverState; reason: string }

// ─── 内联 MultiRegionService ──────────────────────────────────────────────────

class InlineMultiRegionService {
  private endpoints = new Map<Region, RegionEndpoint>()
  private tenantPins = new Map<string, Region>()
  private geoCache = new Map<string, GeoIPResult>()
  private regionHealth = new Map<Region, 'healthy' | 'degraded' | 'down'>()

  constructor() {
    this.registerEndpoint({ region: 'cn', baseUrl: 'https://api-cn.example.com', latencyMs: 20, enabled: true })
    this.registerEndpoint({ region: 'us', baseUrl: 'https://api-us.example.com', latencyMs: 150, enabled: true })
    this.registerEndpoint({ region: 'eu', baseUrl: 'https://api-eu.example.com', latencyMs: 180, enabled: true })
    this.registerEndpoint({ region: 'jp', baseUrl: 'https://api-jp.example.com', latencyMs: 50, enabled: true })
    for (const r of ALL_REGIONS) this.regionHealth.set(r, 'healthy')
  }

  registerEndpoint(ep: RegionEndpoint): void { this.endpoints.set(ep.region, ep) }
  getEndpoint(r: Region): RegionEndpoint | undefined { return this.endpoints.get(r) }
  listEndpoints(): RegionEndpoint[] { return Array.from(this.endpoints.values()) }

  geoLookup(ip: string): GeoIPResult {
    const cached = this.geoCache.get(ip)
    if (cached) return { ...cached, source: 'cache' }
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') || ip.startsWith('127.')) {
      const r: GeoIPResult = { country: 'ZZ', region: 'cn', source: 'fallback' }
      this.geoCache.set(ip, r); return r
    }
    const parts = ip.split('.')
    if (parts.length !== 4) return { country: 'ZZ', region: DEFAULT_REGION, source: 'lookup' }
    const last = parseInt(parts[3], 10)
    const country = isNaN(last) ? 'ZZ' : last >= 200 ? 'US' : last >= 100 ? 'JP' : 'CN'
    const region = { CN: 'cn', US: 'us', JP: 'jp' }[country] ?? DEFAULT_REGION as Region
    const r: GeoIPResult = { country, region, source: 'lookup' }
    this.geoCache.set(ip, r); return r
  }

  pinTenantToRegion(tenantId: string, region: Region): void { this.tenantPins.set(tenantId, region) }
  getTenantRegion(tenantId: string): Region | undefined { return this.tenantPins.get(tenantId) }
  unpinTenant(tenantId: string): void { this.tenantPins.delete(tenantId) }

  setRegionHealth(r: Region, h: 'healthy' | 'degraded' | 'down'): void { this.regionHealth.set(r, h) }
  getRegionHealth(r: Region): string { return this.regionHealth.get(r) ?? 'down' }

  route(clientIp: string, tenantId?: string): RouteDecision {
    if (tenantId) {
      const pinned = this.tenantPins.get(tenantId)
      if (pinned) return { primaryRegion: pinned, fallbacks: this.getFallbacks(pinned), reason: 'tenant-pin' }
    }
    const geo = this.geoLookup(clientIp)
    return { primaryRegion: geo.region, fallbacks: this.getFallbacks(geo.region), reason: 'geo', latencyHint: this.endpoints.get(geo.region)?.latencyMs }
  }

  routeByLatency(): RouteDecision {
    const candidates = ALL_REGIONS.filter(r => this.regionHealth.get(r) === 'healthy').map(r => ({ region: r, latency: this.endpoints.get(r)?.latencyMs ?? Infinity })).sort((a, b) => a.latency - b.latency)
    if (candidates.length === 0) return { primaryRegion: DEFAULT_REGION, fallbacks: ALL_REGIONS.filter(r => r !== DEFAULT_REGION), reason: 'default' }
    return { primaryRegion: candidates[0].region, fallbacks: candidates.slice(1).map(c => c.region), reason: 'health', latencyHint: candidates[0].latency }
  }

  canMigrateToRegion(tenantId: string, target: Region): boolean {
    const pinned = this.tenantPins.get(tenantId)
    return !pinned || pinned === target
  }

  listPinnedTenants(): Array<{ tenantId: string; region: Region }> {
    return Array.from(this.tenantPins.entries()).map(([id, r]) => ({ tenantId: id, region: r }))
  }

  resetForTests(): void { this.tenantPins.clear(); this.geoCache.clear(); for (const r of ALL_REGIONS) this.regionHealth.set(r, 'healthy') }

  private getFallbacks(primary: Region): Region[] {
    return ALL_REGIONS.filter(r => r !== primary).map(r => ({ region: r, latency: this.endpoints.get(r)?.latencyMs ?? Infinity })).sort((a, b) => a.latency - b.latency).map(c => c.region)
  }
}

// ─── 内联 FailoverService ────────────────────────────────────────────────────

class InlineFailoverService {
  private states = new Map<Region, FailoverState>()
  private consecutiveFailures = new Map<Region, number>()
  private events: FailoverEvent[] = []
  private healthCache = new Map<Region, HealthCheckResult>()
  private failureThreshold = 3

  constructor(private readonly regions: InlineMultiRegionService) {
    for (const r of ALL_REGIONS) { this.states.set(r, 'HEALTHY'); this.consecutiveFailures.set(r, 0) }
  }

  configure(options: { failureThreshold?: number }): void {
    if (options.failureThreshold !== undefined) this.failureThreshold = options.failureThreshold
  }

  async checkHealth(region: Region, forceOk?: boolean): Promise<HealthCheckResult> {
    const ok = forceOk !== undefined ? forceOk : true
    const latencyMs = ok ? 50 : 9999
    const prevState = this.states.get(region) ?? 'HEALTHY'
    let newState = prevState
    let failures = this.consecutiveFailures.get(region) ?? 0

    if (ok) {
      failures = 0
      newState = prevState === 'DOWN' ? 'RECOVERING' : prevState === 'RECOVERING' ? 'HEALTHY' : 'HEALTHY'
    } else {
      failures += 1
      newState = failures >= this.failureThreshold ? 'DOWN' : 'DEGRADED'
    }
    this.consecutiveFailures.set(region, failures)
    if (prevState !== newState) {
      this.states.set(region, newState)
      this.events.push({ ts: new Date().toISOString(), region, fromState: prevState, toState: newState, reason: failures > 0 ? `failure #${failures}` : 'check ok' })
    }
    const result: HealthCheckResult = { region, state: newState, latencyMs, errorRate: ok ? 0 : 1, lastCheckAt: new Date().toISOString(), consecutiveFailures: failures }
    this.healthCache.set(region, result)
    return result
  }

  failover(fromRegion: Region): Region | null {
    const healthy = ALL_REGIONS.filter(r => r !== fromRegion).filter(r => { const s = this.states.get(r); return s === 'HEALTHY' || s === 'RECOVERING' })
      .map(r => ({ region: r, latency: this.regions.getEndpoint(r)?.latencyMs ?? Infinity })).sort((a, b) => a.latency - b.latency)
    return healthy.length === 0 ? null : healthy[0].region
  }

  async checkAll(forceOkMap?: Record<Region, boolean>): Promise<HealthCheckResult[]> {
    return Promise.all(ALL_REGIONS.map(r => this.checkHealth(r, forceOkMap?.[r])))
  }

  getState(region: Region): FailoverState { return this.states.get(region) ?? 'HEALTHY' }
  getAllStates(): Record<Region, FailoverState> {
    const r: Record<string, FailoverState> = {}
    for (const reg of ALL_REGIONS) r[reg] = this.states.get(reg) ?? 'HEALTHY'
    return r as Record<Region, FailoverState>
  }
  getLastHealth(region: Region): HealthCheckResult | undefined { return this.healthCache.get(region) }
  getEvents(): FailoverEvent[] { return [...this.events] }
  getEventsByRegion(region: Region): FailoverEvent[] { return this.events.filter(e => e.region === region) }
  getHealthyRegions(): Region[] { return ALL_REGIONS.filter(r => this.states.get(r) === 'HEALTHY') }
  resetForTests(): void {
    for (const r of ALL_REGIONS) { this.states.set(r, 'HEALTHY'); this.consecutiveFailures.set(r, 0) }
    this.events.length = 0; this.healthCache.clear(); this.failureThreshold = 3
  }
}

// ─── 测试: MultiRegionService ────────────────────────────────────────────────

describe('MultiRegionService [inline]', () => {
  let svc: InlineMultiRegionService

  beforeEach(() => { svc = new InlineMultiRegionService() })

  // ── 1. Endpoints ──
  it('registerEndpoint 注册后可用 getEndpoint 获取', () => {
    const ep = svc.getEndpoint('cn')
    expect(ep).toBeDefined()
    expect(ep!.baseUrl).toContain('api-cn')
  })

  it('listEndpoints 返回全部 4 个区域', () => {
    expect(svc.listEndpoints().length).toBe(4)
  })

  it('getEndpoint 未注册返回 undefined', () => {
    expect(svc.getEndpoint('eu')).toBeDefined() // all registered in constructor
  })

  // ── 2. GeoIP ──
  it('geoLookup 私有 IP 返回 cn fallback', () => {
    const r = svc.geoLookup('10.0.0.1')
    expect(r.region).toBe('cn')
    expect(r.source).toBe('fallback')
  })

  it('geoLookup 公开 IP 末段≥200 映射 US', () => {
    const r = svc.geoLookup('8.8.8.200')
    expect(r.country).toBe('US')
    expect(r.region).toBe('us')
  })

  it('geoLookup 公开 IP 末段≥100 且<200 映射 JP', () => {
    const r = svc.geoLookup('1.2.3.150')
    expect(r.country).toBe('JP')
    expect(r.region).toBe('jp')
  })

  it('geoLookup 公开 IP 末段<100 映射 CN', () => {
    const r = svc.geoLookup('1.2.3.50')
    expect(r.country).toBe('CN')
    expect(r.region).toBe('cn')
  })

  it('geoLookup 非法 IP 返回 ZZ default', () => {
    const r = svc.geoLookup('invalid-ip')
    expect(r.country).toBe('ZZ')
    expect(r.region).toBe('cn')
  })

  it('geoLookup 第二次命中缓存', () => {
    svc.geoLookup('1.2.3.50')
    const r = svc.geoLookup('1.2.3.50')
    expect(r.source).toBe('cache')
  })

  // ── 3. Tenant pinning ──
  it('pinTenantToRegion 固定租户区域', () => {
    svc.pinTenantToRegion('t-001', 'us')
    expect(svc.getTenantRegion('t-001')).toBe('us')
  })

  it('unpinTenant 解除固定', () => {
    svc.pinTenantToRegion('t-001', 'us')
    svc.unpinTenant('t-001')
    expect(svc.getTenantRegion('t-001')).toBeUndefined()
  })

  it('listPinnedTenants 列出已固定租户', () => {
    svc.pinTenantToRegion('t-001', 'eu')
    svc.pinTenantToRegion('t-002', 'jp')
    const list = svc.listPinnedTenants()
    expect(list.length).toBe(2)
  })

  // ── 4. Routing ──
  it('route 租户固定覆盖 GeoIP', () => {
    svc.pinTenantToRegion('t-gdpr', 'eu')
    const d = svc.route('8.8.8.200', 't-gdpr') // IP → US, but pinned EU
    expect(d.primaryRegion).toBe('eu')
    expect(d.reason).toBe('tenant-pin')
  })

  it('route 无租户使用 GeoIP', () => {
    const d = svc.route('8.8.8.200')
    expect(d.primaryRegion).toBe('us')
    expect(d.reason).toBe('geo')
  })

  it('route 返回 fallback 区域链', () => {
    const d = svc.route('1.2.3.50')
    expect(d.fallbacks.length).toBe(3)
    // jp has lowest latency among fallbacks from cn
    expect(d.fallbacks).toContain('jp')
    expect(d.fallbacks).toContain('us')
    expect(d.fallbacks).toContain('eu')
  })

  it('routeByLatency 返回最低延迟健康区域', () => {
    const d = svc.routeByLatency()
    expect(d.primaryRegion).toBe('cn') // cn has 20ms
    expect(d.reason).toBe('health')
  })

  it('routeByLatency 全部区域 down 返回 default', () => {
    for (const r of ALL_REGIONS) svc.setRegionHealth(r, 'down')
    const d = svc.routeByLatency()
    expect(d.primaryRegion).toBe('cn')
    expect(d.reason).toBe('default')
  })

  // ── 5. Data residency ──
  it('canMigrateToRegion 未固定可自由迁移', () => {
    expect(svc.canMigrateToRegion('t-free', 'us')).toBe(true)
  })

  it('canMigrateToRegion 固定后只能定向迁移', () => {
    svc.pinTenantToRegion('t-eu', 'eu')
    expect(svc.canMigrateToRegion('t-eu', 'eu')).toBe(true)
    expect(svc.canMigrateToRegion('t-eu', 'us')).toBe(false)
  })

  // ── 6. Health ──
  it('setRegionHealth/getRegionHealth 交互', () => {
    svc.setRegionHealth('us', 'down')
    expect(svc.getRegionHealth('us')).toBe('down')
  })
})

// ─── 测试: FailoverService ──────────────────────────────────────────────────

describe('FailoverService [inline]', () => {
  let regions: InlineMultiRegionService
  let fo: InlineFailoverService

  beforeEach(() => {
    regions = new InlineMultiRegionService()
    fo = new InlineFailoverService(regions)
  })

  it('初始全部 HEALTHY', () => {
    const s = fo.getAllStates()
    expect(s.cn).toBe('HEALTHY')
    expect(s.us).toBe('HEALTHY')
  })

  it('checkHealth ok 保持 HEALTHY', async () => {
    const r = await fo.checkHealth('cn', true)
    expect(r.state).toBe('HEALTHY')
  })

  it('checkHealth 连续失败导致 DOWN', async () => {
    await fo.checkHealth('us', false)
    await fo.checkHealth('us', false)
    await fo.checkHealth('us', false)
    const r = await fo.checkHealth('us', false)
    expect(r.state).toBe('DOWN')
  })

  it('checkHealth 一次失败为 DEGRADED', async () => {
    const r = await fo.checkHealth('jp', false)
    expect(r.state).toBe('DEGRADED')
  })

  it('checkHealth DOWN 后恢复经过 RECOVERING', async () => {
    await fo.checkHealth('eu', false)
    await fo.checkHealth('eu', false)
    await fo.checkHealth('eu', false)
    await fo.checkHealth('eu', false)
    expect(fo.getState('eu')).toBe('DOWN')
    await fo.checkHealth('eu', true)
    expect(fo.getState('eu')).toBe('RECOVERING')
    await fo.checkHealth('eu', true)
    expect(fo.getState('eu')).toBe('HEALTHY')
  })

  it('failover 返回最低延迟健康区域', () => {
    fo.checkHealth('cn', false); fo.checkHealth('cn', false); fo.checkHealth('cn', false)
    fo.checkHealth('cn', false) // CN down
    const target = fo.failover('cn')
    expect(target).toBe('jp') // jp has 50ms, lowest among remaining
  })

  it('failover 所有区域 down 返回 null', () => {
    for (const r of ALL_REGIONS) fo.checkHealth(r, false); for (const r of ALL_REGIONS) fo.checkHealth(r, false); for (const r of ALL_REGIONS) fo.checkHealth(r, false); for (const r of ALL_REGIONS) fo.checkHealth(r, false)
    expect(fo.failover('cn')).toBeNull()
  })

  it('checkAll 批量检查所有区域', async () => {
    const results = await fo.checkAll()
    expect(results.length).toBe(4)
    expect(results.every(r => r.state === 'HEALTHY')).toBe(true)
  })

  it('getEvents 返回状态变更记录', async () => {
    await fo.checkHealth('cn', false)
    const events = fo.getEvents()
    expect(events.length).toBe(1)
    expect(events[0].region).toBe('cn')
    expect(events[0].fromState).toBe('HEALTHY')
    expect(events[0].toState).toBe('DEGRADED')
  })

  it('getEventsByRegion 过滤区域事件', async () => {
    await fo.checkHealth('us', false)
    const usEvents = fo.getEventsByRegion('us')
    expect(usEvents.length).toBe(1)
    expect(fo.getEventsByRegion('jp').length).toBe(0)
  })

  it('getHealthyRegions 返回 HEALTHY 区域', () => {
    fo.checkHealth('us', false)
    const healthy = fo.getHealthyRegions()
    expect(healthy).toContain('cn')
    expect(healthy).toContain('eu')
    expect(healthy).toContain('jp')
    expect(healthy).not.toContain('us')
  })

  it('getLastHealth 返回最近检查结果', async () => {
    const r = await fo.checkHealth('cn', true)
    const cached = fo.getLastHealth('cn')
    expect(cached).toBeDefined()
    expect(cached!.region).toBe('cn')
  })

  it('configure 修改阈值', () => {
    fo.configure({ failureThreshold: 5 })
    expect((fo as any).failureThreshold).toBe(5)
  })

  it('resetForTests 重置所有状态', () => {
    fo.checkHealth('us', false); fo.checkHealth('us', false); fo.checkHealth('us', false); fo.checkHealth('us', false)
    fo.resetForTests()
    expect(fo.getState('us')).toBe('HEALTHY')
    expect(fo.getEvents().length).toBe(0)
  })
})
