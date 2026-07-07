import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-dormancy] [D] controller 测试补全
 *
 * 覆盖 MemberDormancyController 的 5 个端点:
 *  - POST /api/member/dormancy/:memberId/reactivate  (唤醒)
 *  - POST /api/member/dormancy/scan                  (手动触发扫描)
 *  - GET  /api/member/dormancy/stats                  (统计)
 *  - GET  /api/member/dormancy/list/:stage            (按阶段列表)
 *  - GET  /api/member/dormancy/cron-metrics           (cron 指标)
 *
 * 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict'
import { BadRequestException } from '@nestjs/common'
import { MemberDormancyController } from './member-dormancy.controller'
import { MemberDormancyService, MemberLifecycleStage } from './member-dormancy.service'
import { MemberDormancyCron } from './member-dormancy.cron'
import { MemberConfigService } from './member-config'

// ── 辅助: 生成会员 profile ──
function makeProfile(overrides: any = {}) {
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 8)}`,
    nickname: 'test',
    level: 'BRONZE',
    tenantContext: { tenantId: 't1' },
    status: 'ACTIVE',
    points: 0,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides
  }
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString()
}

describe('MemberDormancyController', () => {
  let config: MemberConfigService
  let dormancy: MemberDormancyService
  let cron: MemberDormancyCron
  let ctrl: MemberDormancyController
  /** in-memory members store */
  let members: any[]

  beforeEach(() => {
    members = []
    config = new MemberConfigService()
    dormancy = new MemberDormancyService(undefined, config)
    // inject mock memberService
    ;(dormancy as any).memberService = {
      listProfiles: () => members,
      getProfile: (id: string) => members.find((m: any) => m.memberId === id)
    }
    cron = new MemberDormancyCron(dormancy)
    ctrl = new MemberDormancyController(dormancy, cron)
  })

  // ── POST :memberId/reactivate ──
  describe('POST :memberId/reactivate', () => {
    it('正例: 唤醒 DORMANT 会员', async () => {
      members.push(makeProfile({ memberId: 'm1', lastActiveAt: daysAgo(91) }))
      await dormancy.scanAndPromote()
      const result = await ctrl.reactivate('m1', { tenantId: 't1', reason: 'customer arrived' })
      assert.equal(result.ok, true)
      assert.equal(result.memberId, 'm1')
      assert.equal(result.stage, MemberLifecycleStage.Active)
    })

    it('反例: 缺少 tenantId 抛 BadRequest', async () => {
      await assert.rejects(
        () => ctrl.reactivate('m1', {} as any),
        /tenantId required/
      )
    })

    it('反例: 不存在的 memberId 抛 NotFoundException', async () => {
      await assert.rejects(
        () => ctrl.reactivate('nonexist', { tenantId: 't1' }),
        /not found/
      )
    })

    it('反例: 跨租户唤醒抛 BadRequestException', async () => {
      members.push(makeProfile({ memberId: 'm2' }))
      await assert.rejects(
        () => ctrl.reactivate('m2', { tenantId: 'other-tenant' }),
        /different tenant/
      )
    })
  })

  // ── POST /scan ──
  describe('POST /scan', () => {
    it('正例: 手动扫描返回结果', async () => {
      members.push(makeProfile({ memberId: 's1', lastActiveAt: daysAgo(91) }))
      const result = await ctrl.manualScan({}) as any
      assert.ok(result)
      assert.equal(result.dormantPromoted, 1)
      assert.equal(result.scannedCount, 1)
    })

    it('正例: 无会员时扫描返回 0', async () => {
      const result = await ctrl.manualScan({}) as any
      assert.equal(result.scannedCount, 0)
      assert.equal(result.dormantPromoted, 0)
    })

    it('防御: cron 不可用抛 BadRequest', async () => {
      ctrl = new MemberDormancyController(dormancy, undefined)
      await assert.rejects(
        () => ctrl.manualScan({}),
        /not available/
      )
    })
  })

  // ── GET /stats ──
  describe('GET /stats', () => {
    it('正例: 返回统计结构包含 active/dormant/churned/total', async () => {
      const stats = await ctrl.stats({})
      assert.equal(typeof stats.active, 'number')
      assert.equal(typeof stats.dormant, 'number')
      assert.equal(typeof stats.churned, 'number')
      assert.equal(typeof stats.total, 'number')
    })

    it('正例: 扫描后统计数据正确', async () => {
      members.push(makeProfile({ memberId: 'm3', lastActiveAt: daysAgo(91) }))
      await dormancy.scanAndPromote()
      const stats = await ctrl.stats({ tenantId: 't1' })
      assert.equal(stats.total, 1)
      assert.equal(stats.dormant, 1)
      assert.equal(stats.active, 0)
    })

    it('边界: 服务不可用抛 BadRequest', async () => {
      ctrl = new MemberDormancyController(undefined, undefined)
      await assert.rejects(
        () => ctrl.stats({}),
        /not available/
      )
    })
  })

  // ── GET /list/:stage ──
  describe('GET /list/:stage', () => {
    it('正例: 列出 ACTIVE 会员', async () => {
      members.push(makeProfile({ memberId: 'm4' }))
      const result = await ctrl.listByStage('ACTIVE', {})
      assert.equal(result.stage, 'ACTIVE')
      assert.equal(result.members.length, 1)
      assert.equal(result.members[0].memberId, 'm4')
    })

    it('正例: 列出 DORMANT 会员', async () => {
      members.push(makeProfile({ memberId: 'm5', lastActiveAt: daysAgo(91) }))
      await dormancy.scanAndPromote()
      const result = await ctrl.listByStage('DORMANT', { tenantId: 't1' })
      assert.equal(result.stage, 'DORMANT')
      assert.equal(result.members.length, 1)
    })

    it('反例: invalid stage 抛 BadRequest', async () => {
      await assert.rejects(
        () => ctrl.listByStage('INVALID_STAGE', {}),
        /invalid stage/
      )
    })

    it('边界: 服务不可用抛 BadRequest', async () => {
      ctrl = new MemberDormancyController(undefined, undefined)
      await assert.rejects(
        () => ctrl.listByStage('ACTIVE', {}),
        /not available/
      )
    })
  })

  // ── GET /cron-metrics ──
  describe('GET /cron-metrics', () => {
    it('正例: 返回 cron 指标结构', async () => {
      const metrics = await ctrl.cronMetrics()
      assert.equal(typeof metrics.totalRuns, 'number')
      assert.equal(typeof metrics.totalScanned, 'number')
      assert.equal(metrics.lastError, null)
    })

    it('正例: 扫描后指标更新', async () => {
      await cron.hourlyScan()
      const metrics = await ctrl.cronMetrics()
      assert.equal(metrics.totalRuns, 1)
    })

    it('边界: cron 不可用抛 BadRequest', async () => {
      ctrl = new MemberDormancyController(dormancy, undefined)
      await assert.rejects(
        () => ctrl.cronMetrics(),
        /not available/
      )
    })
  })

  // ── 端点完整性 ──
  describe('端点完整性', () => {
    it('5 个端点方法全部存在', () => {
      const proto = MemberDormancyController.prototype
      const hasReactivate = typeof proto.reactivate === 'function'
      const hasManualScan = typeof proto.manualScan === 'function'
      const hasStats = typeof proto.stats === 'function'
      const hasListByStage = typeof proto.listByStage === 'function'
      const hasCronMetrics = typeof proto.cronMetrics === 'function'
      assert.ok(hasReactivate, 'reactivate missing')
      assert.ok(hasManualScan, 'manualScan missing')
      assert.ok(hasStats, 'stats missing')
      assert.ok(hasListByStage, 'listByStage missing')
      assert.ok(hasCronMetrics, 'cronMetrics missing')
    })
  })
})
