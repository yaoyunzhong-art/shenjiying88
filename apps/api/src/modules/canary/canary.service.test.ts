import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CanaryService test (V9 Art 6, V10 Day 8 Phase 92)
 */

import assert from 'node:assert/strict'
import { CanaryService } from './canary.service'

describe('CanaryService V10 Day 8 Phase 92', () => {
  let service: CanaryService

  beforeEach(() => { service = new CanaryService() })

  describe('Experiment CRUD', () => {
    it('create generates id and draft status', () => {
      const exp = service.createExperiment({
        name: 'Test', description: '', flagKey: 'test.flag',
        strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10, targetPercentage: 100,
        createdBy: 'admin',
      })
      assert.equal(exp.status, 'draft')
      assert.equal(exp.currentPercentage, 0)
    })

    it('list returns seeded experiments', () => {
      assert.ok(service.listExperiments().length >= 2)
    })
  })

  describe('State machine', () => {
    it('activate from draft works', () => {
      const exp = service.createExperiment({
        name: 'T', description: '', flagKey: 'f1',
        strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10, targetPercentage: 100, createdBy: 'admin',
      })
      const activated = service.activate(exp.id, 'admin')!
      assert.equal(activated.status, 'active')
      assert.equal(activated.currentPercentage, 10)
    })

    it('activate from active throws', () => {
      assert.throws(
        () => service.activate('exp-seed-ai-v2', 'admin'),
        /Cannot activate/,
      )
    })

    it('pause from active works', () => {
      const paused = service.pause('exp-seed-ai-v2', 'admin', 'manual')!
      assert.equal(paused.status, 'paused')
    })

    it('rollback from active works', () => {
      const rb = service.rollback('exp-seed-ai-v2', 'admin', 'high error rate')!
      assert.equal(rb.status, 'rolled_back')
      assert.equal(rb.currentPercentage, 0)
      assert.ok(rb.endedAt)
    })

    it('promote within range works', () => {
      const p = service.promote('exp-seed-ai-v2', 50, 'admin')!
      assert.equal(p.currentPercentage, 50)
    })

    it('promote to target completes', () => {
      const p = service.promote('exp-seed-ai-v2', 100, 'admin')!
      assert.equal(p.status, 'completed')
      assert.equal(p.currentPercentage, 100)
    })

    it('promote beyond target throws', () => {
      assert.throws(
        () => service.promote('exp-seed-ai-v2', 200, 'admin'),
        /Invalid promote percentage/,
      )
    })
  })

  describe('Strategy evaluation', () => {
    it('tenant strategy matches', () => {
      const exp = service.createExperiment({
        name: 'Tenant Test', description: '', flagKey: 'tenant.test',
        strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['t1', 't2'] },
        initialPercentage: 100, targetPercentage: 100, createdBy: 'admin',
      })
      service.activate(exp.id, 'admin')
      const res = service.evaluate({ flagKey: 'tenant.test', tenantId: 't1' })
      assert.equal(res.enabled, true)
      assert.equal(res.matchedStrategy, 'tenant')
    })

    it('tenant strategy non-match', () => {
      const exp = service.createExperiment({
        name: 'Tenant Test', description: '', flagKey: 'tenant.test2',
        strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['t1'] },
        initialPercentage: 100, targetPercentage: 100, createdBy: 'admin',
      })
      service.activate(exp.id, 'admin')
      const res = service.evaluate({ flagKey: 'tenant.test2', tenantId: 't-other' })
      assert.equal(res.enabled, false)
    })

    it('store strategy matches', () => {
      const res = service.evaluate({ flagKey: 'checkout.new_flow', tenantId: 't1', storeId: 'store-001' })
      assert.equal(res.enabled, true)
      assert.equal(res.matchedStrategy, 'store')
    })

    it('store strategy no storeId in request', () => {
      const res = service.evaluate({ flagKey: 'checkout.new_flow', tenantId: 't1' })
      assert.equal(res.enabled, false)
    })

    it('no matching experiment', () => {
      const res = service.evaluate({ flagKey: 'unknown.flag', tenantId: 't1' })
      assert.equal(res.enabled, false)
    })

    it('tag strategy matchAll', () => {
      const exp = service.createExperiment({
        name: 'Tag Test', description: '', flagKey: 'tag.test',
        strategy: 'tag', strategyConfig: { type: 'tag', tags: ['vip', 'beta'], matchAll: true },
        initialPercentage: 100, targetPercentage: 100, createdBy: 'admin',
      })
      service.activate(exp.id, 'admin')
      const res = service.evaluate({ flagKey: 'tag.test', tenantId: 't', tags: ['vip', 'beta'] })
      assert.equal(res.enabled, true)
    })

    it('tag strategy partial match', () => {
      const exp = service.createExperiment({
        name: 'Tag Test 2', description: '', flagKey: 'tag.test2',
        strategy: 'tag', strategyConfig: { type: 'tag', tags: ['vip'], matchAll: false },
        initialPercentage: 100, targetPercentage: 100, createdBy: 'admin',
      })
      service.activate(exp.id, 'admin')
      const res = service.evaluate({ flagKey: 'tag.test2', tenantId: 't', tags: ['vip', 'other'] })
      assert.equal(res.enabled, true)
    })
  })

  describe('Health monitoring', () => {
    it('recordHealth marks healthy for low error rate', () => {
      const snap = service.recordHealth({
        experimentId: 'exp-1', errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000,
      isHealthy: true,
      })
      assert.equal(snap.isHealthy, true)
    })

    it('recordHealth marks unhealthy for high error rate', () => {
      const snap = service.recordHealth({
        experimentId: 'exp-1', errorRate: 0.1, latencyP95: 100, latencyAvg: 50, totalRequests: 1000,
      isHealthy: true,
      })
      assert.equal(snap.isHealthy, false)
    })

    it('recordHealth marks unhealthy for high latency', () => {
      const snap = service.recordHealth({
        experimentId: 'exp-1', errorRate: 0, latencyP95: 2000, latencyAvg: 1500, totalRequests: 100,
      isHealthy: true,
      })
      assert.equal(snap.isHealthy, false)
    })

    it('checkAutoPromote when healthy', () => {
      service.recordHealth({
        experimentId: 'exp-seed-ai-v2', errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000,
      isHealthy: true,
      })
      const r = service.checkAutoPromote('exp-seed-ai-v2')
      assert.equal(r.shouldPromote, true)
      assert.equal(r.nextPercentage, 50)
    })

    it('checkAutoPromote when unhealthy', () => {
      service.recordHealth({
        experimentId: 'exp-seed-ai-v2', errorRate: 0.5, latencyP95: 5000, latencyAvg: 2000, totalRequests: 100,
      isHealthy: true,
      })
      const r = service.checkAutoPromote('exp-seed-ai-v2')
      assert.equal(r.shouldPromote, false)
    })
  })

  describe('Audit logs', () => {
    it('create + activate records audit', () => {
      const exp = service.createExperiment({
        name: 'Audit Test', description: '', flagKey: 'audit.test',
        strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10, targetPercentage: 100, createdBy: 'admin',
      })
      service.activate(exp.id, 'admin')
      const logs = service.listAuditLogs(exp.id)
      assert.ok(logs.length >= 2)
      assert.ok(logs.some((l) => l.action === 'create'))
      assert.ok(logs.some((l) => l.action === 'activate'))
    })
  })
})
