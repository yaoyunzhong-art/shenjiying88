import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlatformService } from './platform.service'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------
function createService(): PlatformService {
  const svc = new PlatformService()
  // reset internal state so each test starts clean
  svc.reset()
  return svc
}

// ---------------------------------------------------------------------------
// PlatformService unit suite
// ---------------------------------------------------------------------------
describe('PlatformService', () => {
  let service: PlatformService

  beforeEach(() => {
    service = createService()
  })

  afterEach(() => {
    service.reset()
  })

  // ── getOverview ──────────────────────────────────────────────────────────

  it('getOverview returns an object with all required keys', () => {
    const overview = service.getOverview()
    expect(overview).toBeDefined()
    expect(overview).toBeTypeOf('object')
    expect(overview).toHaveProperty('version')
    expect(overview).toHaveProperty('health')
    expect(overview).toHaveProperty('metrics')
    expect(overview).toHaveProperty('activeTenants')
    expect(overview).toHaveProperty('servicesCount')
    expect(overview).toHaveProperty('uptimeHours')
  })

  it('getOverview returns version with fallback defaults when env empty', () => {
    const stored = { ...process.env }
    // Guard: save/restore
    delete process.env.APP_VERSION
    delete process.env.BUILD_NUMBER
    delete process.env.GIT_COMMIT

    const svc = createService()
    const overview = svc.getOverview()

    expect(overview.version.version).toBe('1.0.0')
    expect(overview.version.build).toBe('local')
    expect(overview.version.commit).toBe('unknown')

    // restore
    Object.assign(process.env, stored)
  })

  it('getOverview returns 4 services in health check', () => {
    const overview = service.getOverview()
    expect(overview.health.services).toHaveLength(4)
    expect(overview.health.services).toContain('api')
    expect(overview.health.services).toContain('redis')
    expect(overview.health.services).toContain('postgres')
    expect(overview.health.services).toContain('clickhouse')
  })

  it('getOverview returns health.status as healthy', () => {
    const overview = service.getOverview()
    expect(overview.health.status).toBe('healthy')
  })

  it('getOverview servicesCount is exactly 4', () => {
    const overview = service.getOverview()
    expect(overview.servicesCount).toBe(4)
  })

  it('getOverview activeTenants is a positive number', () => {
    const overview = service.getOverview()
    expect(overview.activeTenants).toBeGreaterThanOrEqual(1)
    expect(Number.isInteger(overview.activeTenants)).toBe(true)
  })

  it('getOverview uptimeHours is a non-negative integer', () => {
    const overview = service.getOverview()
    expect(overview.uptimeHours).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(overview.uptimeHours)).toBe(true)
  })

  it('getOverview metrics initially empty', () => {
    const overview = service.getOverview()
    expect(overview.metrics).toEqual([])
  })

  // ── recordMetric ────────────────────────────────────────────────────────

  it('recordMetric adds a new metric when name does not exist', () => {
    const metric = service.recordMetric('cpu_usage', 45.2, '%')
    expect(metric.name).toBe('cpu_usage')
    expect(metric.value).toBeCloseTo(45.2, 1)
    expect(metric.unit).toBe('%')
    expect(metric.updatedAt).toBeTypeOf('string')

    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(1)
  })

  it('recordMetric updates existing metric with same name', () => {
    service.recordMetric('cpu_usage', 10, '%')
    const updated = service.recordMetric('cpu_usage', 99, '%')
    expect(updated.value).toBe(99)

    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(1)
    expect(overview.metrics[0].value).toBe(99)
  })

  it('recordMetric keeps multiple distinct metrics', () => {
    service.recordMetric('cpu', 50, '%')
    service.recordMetric('ram', 2048, 'MB')
    service.recordMetric('disk', 500, 'GB')

    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(3)
  })

  it('recordMetric updates a metric and keeps others unchanged', () => {
    service.recordMetric('cpu', 10, '%')
    service.recordMetric('ram', 1024, 'MB')
    service.recordMetric('cpu', 80, '%')

    const metrics = service.getOverview().metrics
    expect(metrics).toHaveLength(2)
    const cpuMetric = metrics.find(m => m.name === 'cpu')
    expect(cpuMetric?.value).toBe(80)
  })

  // ── checkHealth (async) ─────────────────────────────────────────────────

  it('checkHealth returns status healthy', async () => {
    const health = await service.checkHealth()
    expect(health.status).toBe('healthy')
  })

  it('checkHealth contains four service names', async () => {
    const health = await service.checkHealth()
    expect(health.services).toHaveLength(4)
    expect(health.services).toEqual(['api', 'redis', 'postgres', 'clickhouse'])
  })

  it('checkHealth returns uptime as a number', async () => {
    const health = await service.checkHealth()
    expect(health.uptime).toBeTypeOf('number')
    expect(health.uptime).toBeGreaterThanOrEqual(0)
  })

  it('checkHealth lastCheck is an ISO string', async () => {
    const health = await service.checkHealth()
    const parsed = new Date(health.lastCheck)
    expect(parsed.toISOString()).toBe(health.lastCheck)
  })

  // ── getUptime ───────────────────────────────────────────────────────────

  it('getUptime returns a string with h/m/s format', () => {
    const uptime = service.getUptime()
    expect(uptime).toMatch(/^\d+h\d+m\d+s$/)
  })

  it('getUptime parses back to valid integers', () => {
    const uptime = service.getUptime()
    const parts = uptime.match(/^(\d+)h(\d+)m(\d+)s$/)
    expect(parts).not.toBeNull()
    const [, h, m, s] = parts!
    expect(Number.isInteger(Number(h))).toBe(true)
    expect(Number.isInteger(Number(m))).toBe(true)
    expect(Number.isInteger(Number(s))).toBe(true)
  })

  // ── reset ───────────────────────────────────────────────────────────────

  it('reset clears all recorded metrics', () => {
    service.recordMetric('cpu', 90, '%')
    service.recordMetric('ram', 4096, 'MB')
    expect(service.getOverview().metrics).toHaveLength(2)

    service.reset()
    expect(service.getOverview().metrics).toHaveLength(0)
  })

  it('reset allows recording new metrics after call', () => {
    service.recordMetric('old', 1, 'x')
    service.reset()
    const m = service.recordMetric('new', 2, 'y')
    expect(m.name).toBe('new')
    expect(m.value).toBe(2)
    expect(service.getOverview().metrics).toHaveLength(1)
  })

  // ── recordMetric edge cases ─────────────────────────────────────────────

  it('recordMetric handles zero and negative values', () => {
    const zero = service.recordMetric('zero', 0, 'x')
    expect(zero.value).toBe(0)

    const neg = service.recordMetric('neg', -1, 'y')
    expect(neg.value).toBe(-1)

    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(2)
  })

  it('recordMetric stores large number without overflow', () => {
    const large = 9_007_199_254_740_991 // Number.MAX_SAFE_INTEGER-ish
    const m = service.recordMetric('large', large, 'count')
    expect(m.value).toBe(large)
  })
})
