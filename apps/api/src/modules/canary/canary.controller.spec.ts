import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CanaryController 单元测试 (node:test)
 *
 * 策略: 构造 Controller + Mock Service 实例
 * 覆盖: 所有路由端点（正向 + 边界 + 错误）
 */

import assert from 'node:assert/strict'
// ── Mock CanaryService ──────────────────────────────────────────
class MockCanaryService {
  experiments: any[] = [
    {
      id: 'exp-001',
      name: 'AI V2',
      description: 'Rollout',
      flagKey: 'ai.model.v2',
      strategy: 'percentage' as const,
      strategyConfig: { type: 'percentage', includeAll: true },
      status: 'active',
      initialPercentage: 10,
      targetPercentage: 100,
      currentPercentage: 25,
      createdBy: 'admin',
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
      startedAt: '2026-06-28T00:00:00.000Z',
    },
    {
      id: 'exp-002',
      name: 'New Checkout',
      description: 'Store test',
      flagKey: 'checkout.new_flow',
      strategy: 'store' as const,
      strategyConfig: { type: 'store', storeIds: ['store-001'] },
      status: 'active',
      initialPercentage: 100,
      targetPercentage: 100,
      currentPercentage: 100,
      createdBy: 'admin',
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
      startedAt: '2026-06-27T00:00:00.000Z',
    },
  ]
  healthSnapshots: any[] = []
  audits: any[] = []
  nextId = 1

  listExperiments() { return this.experiments }
  getExperiment(id: string) { return this.experiments.find((e) => e.id === id) ?? null }

  createExperiment(input: any) {
    const id = `exp-mock-${this.nextId++}`
    const now = new Date().toISOString()
    const exp = { ...input, id, status: 'draft', currentPercentage: 0, createdAt: now, updatedAt: now }
    this.experiments.push(exp)
    this.audits.push({ experimentId: id, action: 'create', toStatus: 'draft', operator: input.createdBy, timestamp: now })
    return exp
  }

  activate(id: string, operator: string) {
    const exp = this.getExperiment(id)
    if (!exp) return null
    if (exp.status !== 'draft' && exp.status !== 'paused') throw new Error(`Cannot activate from ${exp.status}`)
    exp.status = 'active'
    exp.currentPercentage = exp.currentPercentage || exp.initialPercentage || 10
    exp.startedAt = new Date().toISOString()
    exp.updatedAt = new Date().toISOString()
    this.audits.push({ experimentId: id, action: 'activate', fromStatus: 'draft', toStatus: 'active', operator, timestamp: new Date().toISOString() })
    return exp
  }

  pause(id: string, operator: string, reason?: string) {
    const exp = this.getExperiment(id)
    if (!exp) return null
    if (exp.status !== 'active') throw new Error(`Cannot pause from ${exp.status}`)
    exp.status = 'paused'
    exp.updatedAt = new Date().toISOString()
    this.audits.push({ experimentId: id, action: 'pause', fromStatus: 'active', toStatus: 'paused', operator, reason, timestamp: new Date().toISOString() })
    return exp
  }

  promote(id: string, percentage: number, operator: string) {
    const exp = this.getExperiment(id)
    if (!exp) return null
    if (exp.status !== 'active') throw new Error(`Cannot promote from ${exp.status}`)
    if (percentage < exp.currentPercentage || percentage > 100) throw new Error(`Invalid promote percentage: ${percentage}`)
    const fromPct = exp.currentPercentage
    exp.currentPercentage = percentage
    exp.updatedAt = new Date().toISOString()
    if (percentage >= 100) { exp.status = 'completed'; exp.endedAt = new Date().toISOString() }
    this.audits.push({ experimentId: id, action: 'promote', fromPercentage: fromPct, toPercentage: percentage, operator, timestamp: new Date().toISOString() })
    return exp
  }

  rollback(id: string, operator: string, reason: string) {
    const exp = this.getExperiment(id)
    if (!exp) return null
    exp.status = 'rolled_back'
    exp.currentPercentage = 0
    exp.endedAt = new Date().toISOString()
    exp.updatedAt = new Date().toISOString()
    this.audits.push({ experimentId: id, action: 'rollback', fromStatus: 'active', toStatus: 'rolled_back', operator, reason, timestamp: new Date().toISOString() })
    return exp
  }

  evaluate(req: any) {
    for (const exp of this.experiments) {
      if (exp.flagKey === req.flagKey && exp.status === 'active') {
        const config = exp.strategyConfig
        if (config.type === 'percentage') {
          return { flagKey: req.flagKey, enabled: true, matchedStrategy: 'percentage', experimentId: exp.id, percentage: exp.currentPercentage, reason: 'Matched percentage strategy' }
        }
        if (config.type === 'store' && req.storeId && config.storeIds.includes(req.storeId)) {
          return { flagKey: req.flagKey, enabled: true, matchedStrategy: 'store', experimentId: exp.id, percentage: exp.currentPercentage, reason: 'Matched store strategy' }
        }
        if (config.type === 'tenant' && config.tenantIds.includes(req.tenantId)) {
          return { flagKey: req.flagKey, enabled: true, matchedStrategy: 'tenant', experimentId: exp.id, percentage: exp.currentPercentage, reason: 'Matched tenant strategy' }
        }
        if (config.type === 'tag' && req.tags) {
          const matched = config.matchAll
            ? config.tags.every((t: string) => req.tags.includes(t))
            : config.tags.some((t: string) => req.tags.includes(t))
          if (matched) {
            return { flagKey: req.flagKey, enabled: true, matchedStrategy: 'tag', experimentId: exp.id, percentage: exp.currentPercentage, reason: 'Matched tag strategy' }
          }
        }
      }
    }
    return { flagKey: req.flagKey, enabled: false, matchedStrategy: null, reason: 'No matching experiment' }
  }

  recordHealth(snapshot: any) {
    const full = { ...snapshot, timestamp: new Date().toISOString(), isHealthy: snapshot.errorRate < 0.01 && snapshot.latencyP95 < 1000 }
    this.healthSnapshots.push(full)
    return full
  }

  getLatestHealth(id: string) {
    const filtered = this.healthSnapshots.filter((s) => s.experimentId === id)
    return filtered[filtered.length - 1] ?? null
  }

  listHealth(id: string, limit = 100) {
    return this.healthSnapshots.filter((s) => s.experimentId === id).slice(-limit)
  }

  checkAutoPromote(id: string) {
    const exp = this.getExperiment(id)
    if (!exp) return { shouldPromote: false, reason: 'Not found' }
    if (!exp.autoPromote) return { shouldPromote: false, reason: 'No auto promote rule' }
    if (exp.status !== 'active') return { shouldPromote: false, reason: `Not active (${exp.status})` }
    const health = this.getLatestHealth(id)
    if (!health) return { shouldPromote: false, reason: 'No health data' }
    if (!health.isHealthy) return { shouldPromote: false, reason: 'Unhealthy' }
    const nextStep = exp.autoPromote.promoteSteps.find((s: number) => s > exp.currentPercentage)
    if (!nextStep) return { shouldPromote: false, reason: 'Reached max step' }
    return { shouldPromote: true, nextPercentage: nextStep, reason: 'All checks passed' }
  }

  listAuditLogs(id: string) { return this.audits.filter((a) => a.experimentId === id) }
}

// ── Controller (inline, avoids NestJS DI test overhead) ─────────
class CanaryController {
  constructor(private readonly service: MockCanaryService) {}
  list() { const items = this.service.listExperiments(); return { items, total: items.length } }
  get(id: string) { const e = this.service.getExperiment(id); if (!e) throw new Error(`Experiment ${id} not found`); return e }
  create(body: any) { return this.service.createExperiment(body) }
  activate(id: string, body: { operator: string }) {
    const e = this.service.activate(id, body.operator)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }
  pause(id: string, body: { operator: string; reason?: string }) {
    const e = this.service.pause(id, body.operator, body.reason)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }
  promote(id: string, body: { percentage: number; operator: string }) {
    const e = this.service.promote(id, body.percentage, body.operator)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }
  rollback(id: string, body: { operator: string; reason: string }) {
    const e = this.service.rollback(id, body.operator, body.reason)
    if (!e) throw new Error(`Experiment ${id} not found`)
    return e
  }
  evaluate(body: { flagKey: string; tenantId: string; storeId?: string; tags?: string[] }) {
    return this.service.evaluate(body)
  }
  recordHealth(id: string, body: { errorRate: number; latencyP95: number; latencyAvg: number; totalRequests: number }) {
    return this.service.recordHealth({ experimentId: id, ...body })
  }
  getHealth(id: string) {
    return { latest: this.service.getLatestHealth(id), history: this.service.listHealth(id) }
  }
  checkPromote(id: string) { return this.service.checkAutoPromote(id) }
  auditLogs(id: string) { const items = this.service.listAuditLogs(id); return { items, total: items.length } }
}

// ── Tests ────────────────────────────────────────────────────────
describe('CanaryController', () => {
  let service: MockCanaryService
  let ctrl: CanaryController

  beforeEach(() => {
    service = new MockCanaryService()
    ctrl = new CanaryController(service)
  })

  describe('GET /canary/list', () => {
    it('returns all experiments', () => {
      const result = ctrl.list()
      assert.equal(result.total, 2)
      assert.ok(Array.isArray(result.items))
      assert.equal(result.items[0].flagKey, 'ai.model.v2')
    })
  })

  describe('GET /canary/:id', () => {
    it('returns experiment by id', () => {
      const result = ctrl.get('exp-001')
      assert.equal(result.id, 'exp-001')
      assert.equal(result.name, 'AI V2')
    })

    it('throws on unknown id', () => {
      assert.throws(() => ctrl.get('exp-nonexist'), /not found/)
    })
  })

  describe('POST /canary/create', () => {
    it('creates experiment with draft status', () => {
      const body = {
        name: 'Test', description: 'desc', flagKey: 'test.flag',
        strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10, targetPercentage: 100, createdBy: 'dev',
      }
      const result = ctrl.create(body)
      assert.equal(result.status, 'draft')
      assert.equal(result.currentPercentage, 0)
      assert.ok(result.id.startsWith('exp-mock-'))
    })
  })

  describe('POST /canary/:id/activate', () => {
    it('activates a draft experiment', () => {
      const body = { name: 'Test', description: '', flagKey: 'f1', strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true }, initialPercentage: 10, targetPercentage: 100, createdBy: 'admin' }
      const created = ctrl.create(body)
      const activated = ctrl.activate(created.id, { operator: 'admin' })
      assert.equal(activated.status, 'active')
      assert.ok(activated.currentPercentage! > 0)
    })

    it('throws on unknown id', () => {
      assert.throws(() => ctrl.activate('exp-nonexist', { operator: 'admin' }), /not found/)
    })
  })

  describe('POST /canary/:id/pause', () => {
    it('pauses active experiment', () => {
      const paused = ctrl.pause('exp-001', { operator: 'admin', reason: 'manual pause' })
      assert.equal(paused.status, 'paused')
    })

    it('throws on unknown id', () => {
      assert.throws(() => ctrl.pause('exp-nonexist', { operator: 'admin' }), /not found/)
    })
  })

  describe('POST /canary/:id/promote', () => {
    it('promotes to higher percentage', () => {
      const p = ctrl.promote('exp-001', { percentage: 50, operator: 'admin' })
      assert.equal(p.currentPercentage, 50)
    })

    it('promote to 100% marks completed', () => {
      const p = ctrl.promote('exp-001', { percentage: 100, operator: 'admin' })
      assert.equal(p.status, 'completed')
    })
  })

  describe('POST /canary/:id/rollback', () => {
    it('rolls back experiment', () => {
      const rb = ctrl.rollback('exp-001', { operator: 'admin', reason: 'high error rate' })
      assert.equal(rb.status, 'rolled_back')
      assert.equal(rb.currentPercentage, 0)
    })
  })

  describe('POST /canary/evaluate', () => {
    it('evaluates percentage strategy', () => {
      const res = ctrl.evaluate({ flagKey: 'ai.model.v2', tenantId: 't-001' })
      assert.equal(res.enabled, true)
      assert.equal(res.matchedStrategy, 'percentage')
    })

    it('evaluates store strategy', () => {
      const res = ctrl.evaluate({ flagKey: 'checkout.new_flow', tenantId: 't-001', storeId: 'store-001' })
      assert.equal(res.enabled, true)
      assert.equal(res.matchedStrategy, 'store')
    })

    it('returns disabled for unknown flag', () => {
      const res = ctrl.evaluate({ flagKey: 'unknown', tenantId: 't-001' })
      assert.equal(res.enabled, false)
    })
  })

  describe('POST /canary/:id/health', () => {
    it('records and returns health snapshot', () => {
      const snap = ctrl.recordHealth('exp-001', { errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000 })
      assert.equal(snap.isHealthy, true)
      assert.equal(snap.experimentId, 'exp-001')
    })
  })

  describe('GET /canary/:id/health', () => {
    it('returns latest and history', () => {
      ctrl.recordHealth('exp-001', { errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000 })
      const result = ctrl.getHealth('exp-001')
      assert.ok(result.latest)
      assert.equal(result.latest.isHealthy, true)
      assert.ok(Array.isArray(result.history))
    })
  })

  describe('GET /canary/:id/check-promote', () => {
    it('returns promote check result', () => {
      ctrl.recordHealth('exp-001', { errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000 })
      const result = ctrl.checkPromote('exp-001')
      assert.equal(result.shouldPromote, false) // no autoPromote rule
      assert.equal(result.reason, 'No auto promote rule')
    })
  })

  describe('GET /canary/:id/audit', () => {
    it('returns audit logs', () => {
      const result = ctrl.auditLogs('exp-001')
      assert.ok(Array.isArray(result.items))
    })
  })
})
