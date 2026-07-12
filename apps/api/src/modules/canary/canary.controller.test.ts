// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
// 用 require 动态加载绕过 esbuild decorator 限制
const { CanaryController } = require('./canary.controller')
const { CanaryService } = require('./canary.service')

// ── Helper: 创建测试用 controller + mock service ──
function makeController(overrides: Record<string, any> = {}) {
  const service = {
    listExperiments: overrides.listExperiments ?? (() => []),
    getExperiment: overrides.getExperiment ?? (() => null),
    createExperiment: overrides.createExperiment ?? ((input: any) => ({ ...input, id: 'mock-1', status: 'draft', currentPercentage: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
    activate: overrides.activate ?? (() => null),
    pause: overrides.pause ?? (() => null),
    promote: overrides.promote ?? (() => null),
    rollback: overrides.rollback ?? (() => null),
    evaluate: overrides.evaluate ?? (() => ({ flagKey: '', enabled: false, matchedStrategy: null, reason: 'No match' })),
    recordHealth: overrides.recordHealth ?? ((snap: any) => ({ ...snap, timestamp: new Date().toISOString(), isHealthy: true })),
    getLatestHealth: overrides.getLatestHealth ?? (() => null),
    listHealth: overrides.listHealth ?? (() => []),
    checkAutoPromote: overrides.checkAutoPromote ?? (() => ({ shouldPromote: false, reason: 'No rule' })),
    listAuditLogs: overrides.listAuditLogs ?? (() => []),
  }
  return new CanaryController(service as any)
}

// ── 路由元数据 ──
describe('CanaryController 路由元数据', () => {
  it('controller metadata path is canary', () => {
    const path = Reflect.getMetadata('path', CanaryController)
    assert.equal(path, 'canary')
  })

  it('list GET /list', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.list)
    const path = Reflect.getMetadata('path', CanaryController.prototype.list)
    assert.equal(method, 0) // GET
    assert.equal(path, 'list')
  })

  it('get GET /:id', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.get)
    const path = Reflect.getMetadata('path', CanaryController.prototype.get)
    assert.equal(method, 0) // GET
    assert.equal(path, ':id')
  })

  it('create POST /create', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.create)
    const path = Reflect.getMetadata('path', CanaryController.prototype.create)
    assert.equal(method, 1) // POST
    assert.equal(path, 'create')
  })

  it('activate POST /:id/activate', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.activate)
    const path = Reflect.getMetadata('path', CanaryController.prototype.activate)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/activate')
  })

  it('pause POST /:id/pause', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.pause)
    const path = Reflect.getMetadata('path', CanaryController.prototype.pause)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/pause')
  })

  it('promote POST /:id/promote', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.promote)
    const path = Reflect.getMetadata('path', CanaryController.prototype.promote)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/promote')
  })

  it('rollback POST /:id/rollback', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.rollback)
    const path = Reflect.getMetadata('path', CanaryController.prototype.rollback)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/rollback')
  })

  it('evaluate POST /evaluate', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.evaluate)
    const path = Reflect.getMetadata('path', CanaryController.prototype.evaluate)
    assert.equal(method, 1) // POST
    assert.equal(path, 'evaluate')
  })

  it('recordHealth POST /:id/health', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.recordHealth)
    const path = Reflect.getMetadata('path', CanaryController.prototype.recordHealth)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/health')
  })

  it('getHealth GET /:id/health', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.getHealth)
    const path = Reflect.getMetadata('path', CanaryController.prototype.getHealth)
    assert.equal(method, 0) // GET
    assert.equal(path, ':id/health')
  })

  it('checkPromote GET /:id/check-promote', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.checkPromote)
    const path = Reflect.getMetadata('path', CanaryController.prototype.checkPromote)
    assert.equal(method, 0) // GET
    assert.equal(path, ':id/check-promote')
  })

  it('auditLogs GET /:id/audit', () => {
    const method = Reflect.getMetadata('method', CanaryController.prototype.auditLogs)
    const path = Reflect.getMetadata('path', CanaryController.prototype.auditLogs)
    assert.equal(method, 0) // GET
    assert.equal(path, ':id/audit')
  })
})

// ── GET /canary/list ──
describe('CanaryController.list', () => {
  it('正常流程：返回实验列表与总数', () => {
    const experiments = [
      { id: 'exp-1', name: 'AI V2', flagKey: 'ai.v2', status: 'active', currentPercentage: 25 },
      { id: 'exp-2', name: 'Checkout', flagKey: 'checkout.new', status: 'active', currentPercentage: 50 },
    ]
    const ctrl = makeController({
      listExperiments: () => experiments,
    })
    const result = ctrl.list()
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
    assert.equal(result.items[0].id, 'exp-1')
  })

  it('反例：空列表', () => {
    const ctrl = makeController({
      listExperiments: () => [],
    })
    const result = ctrl.list()
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  it('边界：大量实验不截断', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ id: `exp-${i}`, name: `Exp ${i}` }))
    const ctrl = makeController({ listExperiments: () => many })
    const result = ctrl.list()
    assert.equal(result.total, 500)
  })
})

// ── GET /canary/:id ──
describe('CanaryController.get', () => {
  it('正常流程：按 ID 获取实验', () => {
    const exp = { id: 'exp-001', name: 'AI V2', flagKey: 'ai.v2', status: 'active' }
    const ctrl = makeController({ getExperiment: (id: string) => (id === 'exp-001' ? exp : null) })
    const result = ctrl.get('exp-001')
    assert.equal(result.id, 'exp-001')
    assert.equal(result.name, 'AI V2')
  })

  it('反例：不存在的 ID 抛异常', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.get('exp-nonexist'), /not found/)
  })

  it('边界：ID 为空字符串', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.get(''), /not found/)
  })

  it('边界：ID 含特殊字符', () => {
    const ctrl = makeController({ getExperiment: () => null })
    assert.throws(() => ctrl.get('<script>'), /not found/)
  })
})

// ── POST /canary/create ──
describe('CanaryController.create', () => {
  const createBody = {
    name: '新产品测试',
    description: '测试新结算流程',
    flagKey: 'checkout.new_flow',
    strategy: 'store',
    strategyConfig: { type: 'store', storeIds: ['store-001'] },
    initialPercentage: 100,
    targetPercentage: 100,
    createdBy: 'admin',
  }

  it('正常流程：创建实验返回 draft 状态', () => {
    const ctrl = makeController()
    const result = ctrl.create(createBody)
    assert.equal(result.status, 'draft')
    assert.equal(result.currentPercentage, 0)
    assert.ok(result.id)
    assert.ok(result.createdAt)
    assert.ok(result.updatedAt)
  })

  it('反例：缺少 name 时 service 仍被调用', () => {
    let captured: any = null
    const ctrl = makeController({
      createExperiment: (input: any) => {
        captured = input
        return { ...input, id: 'mock', status: 'draft', currentPercentage: 0, createdAt: '', updatedAt: '' }
      },
    })
    ctrl.create({ ...createBody, name: '' })
    assert.equal(captured.name, '')
  })

  it('边界：未提供可选字段 autoPromote', () => {
    const ctrl = makeController()
    const result = ctrl.create({ ...createBody, autoPromote: undefined })
    assert.equal(result.status, 'draft')
    assert.equal(result.autoPromote, undefined)
  })
})

// ── POST /canary/:id/activate ──
describe('CanaryController.activate', () => {
  it('正常流程：激活 draft 实验', () => {
    const activated = { id: 'exp-001', name: 'Test', status: 'active', currentPercentage: 10 }
    const ctrl = makeController({
      activate: (id: string) => (id === 'exp-001' ? activated : null),
    })
    const result = ctrl.activate('exp-001', { operator: 'admin' })
    assert.equal(result.status, 'active')
    assert.equal(result.currentPercentage, 10)
  })

  it('反例：不存在的实验抛异常', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.activate('exp-nonexist', { operator: 'admin' }), /not found/)
  })

  it('反例：已完成的实验不允许激活', () => {
    const ctrl = makeController({
      activate: () => { throw new Error('Cannot activate from status=completed') },
    })
    assert.throws(() => ctrl.activate('exp-completed', { operator: 'admin' }), /Cannot activate/)
  })

  it('边界：operator 为空字符串', () => {
    const activated = { id: 'exp-001', status: 'active' }
    const ctrl = makeController({
      activate: (id: string, operator: string) => {
        assert.equal(operator, '')
        return activated
      },
    })
    ctrl.activate('exp-001', { operator: '' })
  })
})

// ── POST /canary/:id/pause ──
describe('CanaryController.pause', () => {
  it('正常流程：暂停 active 实验', () => {
    const paused = { id: 'exp-001', status: 'paused' }
    const ctrl = makeController({
      pause: (id: string) => (id === 'exp-001' ? paused : null),
    })
    const result = ctrl.pause('exp-001', { operator: 'admin', reason: '需要审核' })
    assert.equal(result.status, 'paused')
  })

  it('反例：不存在的实验抛异常', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.pause('exp-nonexist', { operator: 'admin' }), /not found/)
  })

  it('反例：draft 实验不允许暂停', () => {
    const ctrl = makeController({
      pause: () => { throw new Error('Cannot pause from status=draft') },
    })
    assert.throws(() => ctrl.pause('exp-draft', { operator: 'admin' }), /Cannot pause/)
  })

  it('边界：不传 reason 仍可暂停', () => {
    const paused = { id: 'exp-001', status: 'paused' }
    const ctrl = makeController({ pause: () => paused })
    const result = ctrl.pause('exp-001', { operator: 'admin' })
    assert.equal(result.status, 'paused')
  })
})

// ── POST /canary/:id/promote ──
describe('CanaryController.promote', () => {
  it('正常流程：提升百分比', () => {
    const promoted = { id: 'exp-001', status: 'active', currentPercentage: 50 }
    const ctrl = makeController({
      promote: (id: string, percentage: number) => (id === 'exp-001' ? { ...promoted, currentPercentage: percentage } : null),
    })
    const result = ctrl.promote('exp-001', { percentage: 50, operator: 'admin' })
    assert.equal(result.currentPercentage, 50)
  })

  it('正常流程：提升到 100% 标记为 completed', () => {
    const completed = { id: 'exp-001', status: 'completed', currentPercentage: 100 }
    const ctrl = makeController({
      promote: (id: string) => (id === 'exp-001' ? completed : null),
    })
    const result = ctrl.promote('exp-001', { percentage: 100, operator: 'admin' })
    assert.equal(result.status, 'completed')
    assert.equal(result.currentPercentage, 100)
  })

  it('反例：不存在的实验抛异常', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.promote('exp-nonexist', { percentage: 50, operator: 'admin' }), /not found/)
  })

  it('反例：百分比低于当前值抛异常', () => {
    const ctrl = makeController({
      promote: () => { throw new Error('Invalid promote percentage') },
    })
    assert.throws(() => ctrl.promote('exp-001', { percentage: 5, operator: 'admin' }), /Invalid promote/)
  })

  it('边界：百分比为 0', () => {
    const ctrl = makeController({
      promote: (id: string, percentage: number) => ({ id, currentPercentage: percentage }),
    })
    const result = ctrl.promote('exp-001', { percentage: 0, operator: 'admin' })
    assert.equal(result.currentPercentage, 0)
  })
})

// ── POST /canary/:id/rollback ──
describe('CanaryController.rollback', () => {
  it('正常流程：回滚实验', () => {
    const rolledBack = { id: 'exp-001', status: 'rolled_back', currentPercentage: 0 }
    const ctrl = makeController({
      rollback: (id: string) => (id === 'exp-001' ? rolledBack : null),
    })
    const result = ctrl.rollback('exp-001', { operator: 'admin', reason: '错误率过高' })
    assert.equal(result.status, 'rolled_back')
    assert.equal(result.currentPercentage, 0)
  })

  it('反例：不存在的实验抛异常', () => {
    const ctrl = makeController()
    assert.throws(() => ctrl.rollback('exp-nonexist', { operator: 'admin', reason: '测试' }), /not found/)
  })

  it('反例：draft 实验不允许回滚', () => {
    const ctrl = makeController({
      rollback: () => { throw new Error('Cannot rollback from status=draft') },
    })
    assert.throws(() => ctrl.rollback('exp-draft', { operator: 'admin', reason: '取消' }), /Cannot rollback/)
  })

  it('边界：reason 为空白字符串', () => {
    const rolledBack = { id: 'exp-001', status: 'rolled_back' }
    const ctrl = makeController({ rollback: () => rolledBack })
    const result = ctrl.rollback('exp-001', { operator: 'admin', reason: '' })
    assert.equal(result.status, 'rolled_back')
  })
})

// ── POST /canary/evaluate ──
describe('CanaryController.evaluate', () => {
  it('正常流程：按 percentage 策略匹配', () => {
    const response = { flagKey: 'ai.model.v2', enabled: true, matchedStrategy: 'percentage', experimentId: 'exp-001', percentage: 25, reason: 'Matched percentage strategy' }
    const ctrl = makeController({ evaluate: () => response })
    const result = ctrl.evaluate({ flagKey: 'ai.model.v2', tenantId: 'tnt-001' })
    assert.equal(result.enabled, true)
    assert.equal(result.matchedStrategy, 'percentage')
  })

  it('正常流程：按 store 策略匹配', () => {
    const response = { flagKey: 'checkout.new_flow', enabled: true, matchedStrategy: 'store', experimentId: 'exp-002', percentage: 100, reason: 'Matched store strategy' }
    const ctrl = makeController({ evaluate: () => response })
    const result = ctrl.evaluate({ flagKey: 'checkout.new_flow', tenantId: 'tnt-001', storeId: 'store-001' })
    assert.equal(result.matchedStrategy, 'store')
  })

  it('反例：不存在的 flagKey 返回 disabled', () => {
    const ctrl = makeController()
    const result = ctrl.evaluate({ flagKey: 'unknown.flag', tenantId: 'tnt-001' })
    assert.equal(result.enabled, false)
    assert.equal(result.matchedStrategy, null)
  })

  it('边界：不传 storeId/tags', () => {
    const ctrl = makeController()
    const result = ctrl.evaluate({ flagKey: 'any', tenantId: 'tnt-001' })
    assert.equal(result.enabled, false)
  })

  it('边界：传空 tags 数组', () => {
    const ctrl = makeController()
    const result = ctrl.evaluate({ flagKey: 'any', tenantId: 'tnt-001', tags: [] })
    assert.equal(result.enabled, false)
  })
})

// ── POST /canary/:id/health ──
describe('CanaryController.recordHealth', () => {
  const healthBody = { errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000 }

  it('正常流程：记录健康快照并返回 isHealthy', () => {
    const expected = { experimentId: 'exp-001', ...healthBody, timestamp: '2026-01-01T00:00:00.000Z', isHealthy: true }
    const ctrl = makeController({ recordHealth: () => expected })
    const result = ctrl.recordHealth('exp-001', healthBody)
    assert.equal(result.isHealthy, true)
    assert.equal(result.experimentId, 'exp-001')
  })

  it('反例：高错误率标记为不健康', () => {
    const unhealthy = { experimentId: 'exp-001', ...healthBody, errorRate: 0.05, isHealthy: false }
    const ctrl = makeController({ recordHealth: () => unhealthy })
    const result = ctrl.recordHealth('exp-001', healthBody)
    assert.equal(result.isHealthy, false)
    assert.equal(result.errorRate, 0.05)
  })

  it('边界：延迟与错误率均为 0', () => {
    const zero = { experimentId: 'exp-001', errorRate: 0, latencyP95: 0, latencyAvg: 0, totalRequests: 0, isHealthy: true }
    const ctrl = makeController({ recordHealth: () => zero })
    const result = ctrl.recordHealth('exp-001', { errorRate: 0, latencyP95: 0, latencyAvg: 0, totalRequests: 0 })
    assert.equal(result.isHealthy, true)
  })

  it('边界：错误率正好 0.01', () => {
    const borderline = { experimentId: 'exp-001', errorRate: 0.01, latencyP95: 500, latencyAvg: 200, totalRequests: 100, isHealthy: true }
    const ctrl = makeController({ recordHealth: () => borderline })
    const result = ctrl.recordHealth('exp-001', { errorRate: 0.01, latencyP95: 500, latencyAvg: 200, totalRequests: 100 })
    assert.equal(result.isHealthy, true)
  })
})

// ── GET /canary/:id/health ──
describe('CanaryController.getHealth', () => {
  it('正常流程：返回最新和历史快照', () => {
    const latest = { experimentId: 'exp-001', isHealthy: true }
    const history = [{ experimentId: 'exp-001', isHealthy: true }, { experimentId: 'exp-001', isHealthy: false }]
    const ctrl = makeController({
      getLatestHealth: () => latest,
      listHealth: () => history,
    })
    const result = ctrl.getHealth('exp-001')
    assert.deepEqual(result.latest, latest)
    assert.equal(result.history.length, 2)
  })

  it('反例：无健康数据返回 null', () => {
    const ctrl = makeController()
    const result = ctrl.getHealth('exp-001')
    assert.equal(result.latest, null)
    assert.equal(result.history.length, 0)
  })

  it('边界：不存在的实验 ID', () => {
    const ctrl = makeController()
    const result = ctrl.getHealth('exp-nonexist')
    assert.equal(result.latest, null)
    assert.equal(result.history.length, 0)
  })
})

// ── GET /canary/:id/check-promote ──
describe('CanaryController.checkPromote', () => {
  it('正常流程：无自动晋级规则返回 false', () => {
    const ctrl = makeController()
    const result = ctrl.checkPromote('exp-001')
    assert.equal(result.shouldPromote, false)
    assert.equal(result.reason, 'No rule')
  })

  it('正常流程：可自动晋级时返回建议百分比', () => {
    const ctrl = makeController({
      checkAutoPromote: () => ({ shouldPromote: true, nextPercentage: 50, reason: 'All checks passed' }),
    })
    const result = ctrl.checkPromote('exp-001')
    assert.equal(result.shouldPromote, true)
    assert.equal(result.nextPercentage, 50)
  })

  it('反例：不健康的实验不能晋级', () => {
    const ctrl = makeController({
      checkAutoPromote: () => ({ shouldPromote: false, reason: 'Unhealthy' }),
    })
    const result = ctrl.checkPromote('exp-001')
    assert.equal(result.shouldPromote, false)
    assert.equal(result.reason, 'Unhealthy')
  })

  it('边界：不存在的实验返回 false', () => {
    const ctrl = makeController()
    const result = ctrl.checkPromote('exp-nonexist')
    assert.equal(result.shouldPromote, false)
  })
})

// ── GET /canary/:id/audit ──
describe('CanaryController.auditLogs', () => {
  it('正常流程：返回审计日志', () => {
    const logs = [
      { id: 'audit-1', experimentId: 'exp-001', action: 'create', operator: 'admin', timestamp: '2026-01-01T00:00:00.000Z' },
      { id: 'audit-2', experimentId: 'exp-001', action: 'activate', operator: 'admin', timestamp: '2026-01-01T01:00:00.000Z' },
    ]
    const ctrl = makeController({ listAuditLogs: () => logs })
    const result = ctrl.auditLogs('exp-001')
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
    assert.equal(result.items[0].action, 'create')
  })

  it('反例：无审计日志返回空数组', () => {
    const ctrl = makeController({ listAuditLogs: () => [] })
    const result = ctrl.auditLogs('exp-001')
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  it('边界：不存在的实验 ID', () => {
    const ctrl = makeController()
    const result = ctrl.auditLogs('exp-nonexist')
    assert.equal(result.total, 0)
  })
})
