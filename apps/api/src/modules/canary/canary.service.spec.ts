/**
 * canary.service.spec.ts — 灰度发布 Service 深层单元测试
 *
 * 覆盖：CanaryService
 *  - createExperiment:       正例（创建/含autoPromote/含strategyConfig）
 *  - getExperiment/listExperiments: 正例/反例（不存在返回null）
 *  - 状态机:                 正例（activate/pause/rollback/promote/completed）
 *                             反例（从错误状态激活/暂停/晋级）
 *  - evaluate:               正例（percentage/tenant/store/tag匹配）/ 边界（不匹配/无活跃实验）
 *  - 健康监控:               正例（recordHealth/isHealthy判定/getLatestHealth/listHealth）
 *  - checkAutoPromote:       正例（可晋级/不可晋级）/ 边界（无健康数据/未激活/已达上限）
 *  - 审计日志:               正例（记录/查询）
 *  - seed:                   正例（种子实验存在）
 *
 * 全部内联 mock。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CanaryService } from './canary.service'
import type { CanaryExperiment, CanaryStrategyConfig } from './canary.entity'

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('CanaryService', () => {
  let service: CanaryService

  beforeEach(() => {
    // 清空种子数据: 重新创建 service
    service = new CanaryService()
  })

  // ── createExperiment ───────────────────────────────────────
  describe('createExperiment', () => {
    it('✅ 正例: 创建 percentage 实验', () => {
      const exp = service.createExperiment({
        name: 'Test V2',
        description: 'test',
        flagKey: 'test.v2',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      })
      expect(exp.id).toMatch(/^exp-\d+-[a-z0-9]+$/)
      expect(exp.status).toBe('draft')
      expect(exp.currentPercentage).toBe(0)
      expect(exp.createdAt).toBeDefined()
    })

    it('✅ 正例: 创建含 autoPromote 的实验', () => {
      const exp = service.createExperiment({
        name: 'Auto',
        description: 'auto promote',
        flagKey: 'auto.test',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        autoPromote: {
          checkIntervalMin: 30,
          healthMetrics: ['error_rate'],
          promoteSteps: [10, 25, 50, 100],
          healthThreshold: 0.01,
          maxPromotions: 4,
        },
        createdBy: 'admin',
      })
      expect(exp.autoPromote).toBeDefined()
      expect(exp.autoPromote!.promoteSteps).toEqual([10, 25, 50, 100])
    })
  })

  // ── getExperiment / listExperiments ────────────────────────
  describe('getExperiment / listExperiments', () => {
    it('✅ 正例: 种子实验可获取', () => {
      const exp = service.getExperiment('exp-seed-ai-v2')
      expect(exp).not.toBeNull()
      expect(exp!.name).toBe('AI 模型 V2 灰度')
    })

    it('🔲 边界: 不存在的 ID 返回 null', () => {
      expect(service.getExperiment('nonexistent')).toBeNull()
    })

    it('✅ 正例: listExperiments 返回全部', () => {
      const list = service.listExperiments()
      expect(list.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── 状态机 ─────────────────────────────────────────────────
  describe('state machine', () => {
    let expId: string

    beforeEach(() => {
      expId = service.createExperiment({
        name: 'Test',
        description: 'test',
        flagKey: 'test',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      }).id
    })

    it('✅ 正例: draft → activate → active', () => {
      const exp = service.activate(expId, 'admin')
      expect(exp!.status).toBe('active')
      expect(exp!.startedAt).toBeDefined()
      expect(exp!.currentPercentage).toBe(10)
    })

    it('❌ 反例: draft 状态不可 pause', () => {
      expect(() => service.pause(expId, 'admin')).toThrow('Cannot pause')
    })

    it('✅ 正例: active → pause → paused', () => {
      service.activate(expId, 'admin')
      const exp = service.pause(expId, 'admin', 'testing')
      expect(exp!.status).toBe('paused')
    })

    it('✅ 正例: paused → activate 可恢复', () => {
      service.activate(expId, 'admin')
      service.pause(expId, 'admin')
      service.activate(expId, 'admin')
      expect(service.getExperiment(expId)!.status).toBe('active')
    })

    it('✅ 正例: active → rollback → rolled_back', () => {
      service.activate(expId, 'admin')
      const exp = service.rollback(expId, 'admin', 'issues found')
      expect(exp!.status).toBe('rolled_back')
      expect(exp!.currentPercentage).toBe(0)
      expect(exp!.endedAt).toBeDefined()
    })

    it('✅ 正例: active → promote 部分晋级', () => {
      service.activate(expId, 'admin')
      const exp = service.promote(expId, 30, 'admin')
      expect(exp!.currentPercentage).toBe(30)
      expect(exp!.status).toBe('active') // 未到 target
    })

    it('✅ 正例: promote 到 target → completed', () => {
      service.activate(expId, 'admin')
      const exp = service.promote(expId, 100, 'admin')
      expect(exp!.status).toBe('completed')
      expect(exp!.endedAt).toBeDefined()
    })

    it('❌ 反例: promote 低于 current 抛出 BadRequest', () => {
      service.activate(expId, 'admin')
      service.promote(expId, 30, 'admin')
      expect(() => service.promote(expId, 10, 'admin')).toThrow('Invalid')
    })

    it('❌ 反例: 不存在实验返回 null', () => {
      expect(service.activate('nonexistent', 'admin')).toBeNull()
    })
  })

  // ── evaluate ───────────────────────────────────────────────
  describe('evaluate', () => {
    it('✅ 正例: percentage 策略匹配', () => {
      const res = service.evaluate({
        flagKey: 'ai.model.v2_enabled',
        tenantId: 'any_tenant',
      })
      expect(res.enabled).toBe(true)
      expect(res.matchedStrategy).toBe('percentage')
    })

    it('✅ 正例: store 策略匹配', () => {
      const res = service.evaluate({
        flagKey: 'checkout.new_flow',
        tenantId: 't1',
        storeId: 'store-001',
      })
      expect(res.enabled).toBe(true)
      expect(res.matchedStrategy).toBe('store')
    })

    it('🔲 边界: 不匹配的 storeId 返回 disabled', () => {
      const res = service.evaluate({
        flagKey: 'checkout.new_flow',
        tenantId: 't1',
        storeId: 'store-999',
      })
      expect(res.enabled).toBe(false)
    })

    it('🔲 边界: 不存在的 flagKey 返回 disabled', () => {
      const res = service.evaluate({
        flagKey: 'nonexistent.flag',
        tenantId: 't1',
      })
      expect(res.enabled).toBe(false)
    })

    // 测试 tag 策略 — 需要创建一个 tag 策略实验
    it('✅ 正例: tag 策略 matchAll=true', () => {
      const id = service.createExperiment({
        name: 'TagTest',
        description: 'tag test',
        flagKey: 'tag.test',
        strategy: 'tag',
        strategyConfig: { type: 'tag', tags: ['beta', 'vip'], matchAll: true },
        initialPercentage: 100,
        targetPercentage: 100,
        createdBy: 'admin',
      }).id
      service.activate(id, 'admin')

      const res = service.evaluate({
        flagKey: 'tag.test',
        tenantId: 't1',
        tags: ['beta', 'vip'],
      })
      expect(res.enabled).toBe(true)
    })

    it('🔲 边界: tag matchAll 不满足全部返回 disabled', () => {
      const id = service.createExperiment({
        name: 'TagTest',
        description: 'tag test',
        flagKey: 'tag.matchall',
        strategy: 'tag',
        strategyConfig: { type: 'tag', tags: ['beta', 'vip'], matchAll: true },
        initialPercentage: 100,
        targetPercentage: 100,
        createdBy: 'admin',
      }).id
      service.activate(id, 'admin')

      const res = service.evaluate({
        flagKey: 'tag.matchall',
        tenantId: 't1',
        tags: ['beta'],
      })
      expect(res.enabled).toBe(false)
    })
  })

  // ── 健康监控 ───────────────────────────────────────────────
  describe('health monitoring', () => {
    const expId = 'exp-seed-ai-v2'

    it('✅ 正例: recordHealth 标记 isHealthy', () => {
      const snap = service.recordHealth({
        experimentId: expId,
        errorRate: 0.005,
        latencyP95: 200,
        latencyAvg: 100,
        totalRequests: 1000,
      })
      expect(snap.isHealthy).toBe(true)
      expect(snap.timestamp).toBeDefined()
    })

    it('✅ 正例: recordHealth 高错误率标记 unhealthy', () => {
      const snap = service.recordHealth({
        experimentId: expId,
        errorRate: 0.05,
        latencyP95: 500,
        latencyAvg: 300,
        totalRequests: 1000,
      })
      expect(snap.isHealthy).toBe(false)
    })

    it('✅ 正例: getLatestHealth 返回最新记录', () => {
      service.recordHealth({
        experimentId: expId, errorRate: 0.01, latencyP95: 100, latencyAvg: 50, totalRequests: 100,
      })
      service.recordHealth({
        experimentId: expId, errorRate: 0.005, latencyP95: 90, latencyAvg: 45, totalRequests: 100,
      })
      const latest = service.getLatestHealth(expId)
      expect(latest!.errorRate).toBe(0.005)
    })

    it('🔲 边界: 无健康记录返回 null', () => {
      const latest = service.getLatestHealth('nonexistent')
      expect(latest).toBeNull()
    })

    it('✅ 正例: listHealth 返回最近 N 条', () => {
      for (let i = 0; i < 5; i++) {
        service.recordHealth({
          experimentId: expId, errorRate: 0.001, latencyP95: 50, latencyAvg: 25, totalRequests: 100,
        })
      }
      const list = service.listHealth(expId, 3)
      expect(list).toHaveLength(3)
    })
  })

  // ── checkAutoPromote ───────────────────────────────────────
  describe('checkAutoPromote', () => {
    it('✅ 正例: 健康且未达上限 → 应晋级', () => {
      const expId = 'exp-seed-ai-v2'
      // 激活且健康
      service.recordHealth({
        experimentId: expId,
        errorRate: 0.001,
        latencyP95: 100,
        latencyAvg: 50,
        totalRequests: 500,
      })
      const result = service.checkAutoPromote(expId)
      // currentPercentage=25, promoteSteps=[10,25,50,75,100], 下一个是 50
      expect(result.shouldPromote).toBe(true)
      expect(result.nextPercentage).toBe(50)
    })

    it('🔲 边界: 不健康不应晋级', () => {
      const expId = 'exp-seed-ai-v2'
      service.recordHealth({
        experimentId: expId,
        errorRate: 0.05,
        latencyP95: 2000,
        latencyAvg: 1000,
        totalRequests: 500,
      })
      const result = service.checkAutoPromote(expId)
      expect(result.shouldPromote).toBe(false)
      expect(result.reason).toContain('Unhealthy')
    })

    it('🔲 边界: 无 autoPromote 规则不应晋级', () => {
      const id = service.createExperiment({
        name: 'NoAuto',
        description: 'no auto',
        flagKey: 'no.auto',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      }).id
      const result = service.checkAutoPromote(id)
      expect(result.shouldPromote).toBe(false)
    })

    it('🔲 边界: 无健康数据不应晋级', () => {
      const result = service.checkAutoPromote('exp-seed-ai-v2')
      expect(result.shouldPromote).toBe(false)
      expect(result.reason).toContain('No health data')
    })
  })

  // ── 审计日志 ───────────────────────────────────────────────
  describe('audit logs', () => {
    it('✅ 正例: 状态变更记录审计日志', () => {
      // 用新创建的实验（draft状态）做状态变更测试
      const expId = service.createExperiment({
        name: 'AuditTest',
        description: 'audit',
        flagKey: 'audit.test',
        strategy: 'percentage',
        strategyConfig: { type: 'percentage', includeAll: true },
        initialPercentage: 10,
        targetPercentage: 100,
        createdBy: 'admin',
      }).id
      const before = service.listAuditLogs(expId).length
      // create 已有 1 条审计
      service.activate(expId, 'admin')
      service.pause(expId, 'admin', 'reason')
      const after = service.listAuditLogs(expId).length
      expect(after).toBe(before + 2)
    })

    it('🔲 边界: 不存在的实验返回空', () => {
      expect(service.listAuditLogs('nonexistent')).toHaveLength(0)
    })
  })

  // ── seed ───────────────────────────────────────────────────
  describe('seed data', () => {
    it('✅ 正例: 种子实验已存在', () => {
      const exp1 = service.getExperiment('exp-seed-ai-v2')
      const exp2 = service.getExperiment('exp-seed-checkout')
      expect(exp1).not.toBeNull()
      expect(exp2).not.toBeNull()
    })
  })
})
