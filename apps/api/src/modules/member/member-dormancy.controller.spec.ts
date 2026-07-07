/**
 * 🐜 自动: [member-dormancy] [D] controller.spec.ts 补全
 *
 * 覆盖 MemberDormancyController 的 5 个路由端点:
 *   POST :memberId/reactivate  — 唤醒单个会员
 *   POST /scan                — 手动触发扫描
 *   GET  /stats               — 获取统计
 *   GET  /list/:stage         — 列出某阶段会员
 *   GET  /cron-metrics        — cron 监控指标
 *
 * 每方法: 正例 + 反例 + 边界, ≥ 10 个测试
 * Mock 方式: 内联 mock (不依赖 NestJS DI)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { MemberDormancyController } from './member-dormancy.controller'
import { MemberDormancyService, MemberLifecycleStage } from './member-dormancy.service'
import { MemberDormancyCron, type CronMetrics } from './member-dormancy.cron'
import { MemberConfigService } from './member-config'

// ── 辅助: 生成会员 profile ──
function makeProfile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 8)}`,
    nickname: 'test-member',
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
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

// ── 本地类型 ──
interface Profile {
  memberId: string
  nickname: string
  tenantContext: { tenantId: string }
  lastActiveAt: string
  [key: string]: unknown
}

describe('MemberDormancyController', () => {
  let config: MemberConfigService
  let dormancy: MemberDormancyService
  let cron: MemberDormancyCron
  let ctrl: MemberDormancyController
  /** in-memory 会员仓库 */
  let members: Profile[]

  beforeEach(() => {
    members = []

    config = new MemberConfigService()

    // 内联 Mock: MemberDormancyService
    dormancy = new MemberDormancyService(undefined, config)
    ;(dormancy as unknown as Record<string, unknown>).memberService = {
      listProfiles: () => members,
      getProfile: (id: string) => members.find((m) => m.memberId === id)
    }

    cron = new MemberDormancyCron(dormancy)

    ctrl = new MemberDormancyController(dormancy, cron)
  })

  // ──────────────────────────────────────────────
  // POST /api/member/dormancy/:memberId/reactivate
  // ──────────────────────────────────────────────
  describe('POST reactivate', () => {
    it('正例: 唤醒 DORMANT 会员返回 ok + memberId + stage=ACTIVE', async () => {
      members.push(makeProfile({ memberId: 'm-reactivate-1', lastActiveAt: daysAgo(91) }) as Profile)
      await dormancy.scanAndPromote()

      const result = await ctrl.reactivate('m-reactivate-1', { tenantId: 't1', reason: 'customer arrived' })

      expect(result).toEqual({
        ok: true,
        memberId: 'm-reactivate-1',
        stage: MemberLifecycleStage.Active
      })
    })

    it('正例: 唤醒 CHURNED 会员也允许（召回）', async () => {
      members.push(makeProfile({ memberId: 'm-churned-recall', lastActiveAt: daysAgo(365) }) as Profile)
      await dormancy.scanAndPromote()

      const result = await ctrl.reactivate('m-churned-recall', { tenantId: 't1', reason: 'recall' })

      expect(result.ok).toBe(true)
      expect(result.stage).toBe(MemberLifecycleStage.Active)
    })

    it('反例: 缺少 tenantId 抛 BadRequestException', async () => {
      await expect(
        ctrl.reactivate('m-any', {} as { tenantId: string; reason?: string })
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.reactivate('m-any', {} as { tenantId: string; reason?: string })
      ).rejects.toThrow('tenantId required')
    })

    it('反例: 不存在的 memberId 抛 NotFoundException', async () => {
      await expect(
        ctrl.reactivate('nonexist-member', { tenantId: 't1' })
      ).rejects.toThrow(NotFoundException)

      await expect(
        ctrl.reactivate('nonexist-member', { tenantId: 't1' })
      ).rejects.toThrow(/not found/)
    })

    it('反例: 跨租户访问抛 BadRequestException', async () => {
      members.push(makeProfile({ memberId: 'm-cross', tenantContext: { tenantId: 'tenant-a' } }) as Profile)

      await expect(
        ctrl.reactivate('m-cross', { tenantId: 'tenant-b' })
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.reactivate('m-cross', { tenantId: 'tenant-b' })
      ).rejects.toThrow(/different tenant/)
    })

    it('边界: 服务不可用时抛 BadRequestException', async () => {
      ctrl = new MemberDormancyController(undefined, undefined)

      await expect(
        ctrl.reactivate('m-any', { tenantId: 't1' })
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.reactivate('m-any', { tenantId: 't1' })
      ).rejects.toThrow(/not available/)
    })

    it('边界: reason 为空字符串也正常工作', async () => {
      members.push(makeProfile({ memberId: 'm-no-reason', lastActiveAt: daysAgo(91) }) as Profile)
      await dormancy.scanAndPromote()

      const result = await ctrl.reactivate('m-no-reason', { tenantId: 't1', reason: '' })

      expect(result.ok).toBe(true)
      expect(result.stage).toBe(MemberLifecycleStage.Active)
    })
  })

  // ──────────────────────────────────────────────
  // POST /api/member/dormancy/scan
  // ──────────────────────────────────────────────
  describe('POST scan', () => {
    it('正例: 手动扫描返回 DormancyScanResult 结构', async () => {
      members.push(makeProfile({ memberId: 's-active', lastActiveAt: new Date().toISOString() }) as Profile)
      members.push(makeProfile({ memberId: 's-dormant', lastActiveAt: daysAgo(91) }) as Profile)

      const result = await ctrl.manualScan({}) as Record<string, unknown>

      expect(result).toHaveProperty('scannedCount')
      expect(result).toHaveProperty('dormantPromoted')
      expect(result).toHaveProperty('churnedPromoted')
      expect(result).toHaveProperty('durationMs')
      expect(result).toHaveProperty('scannedAt')
      expect(result).toHaveProperty('configSnapshot')
      expect((result as Record<string, unknown>).scannedCount).toBe(2)
      expect((result as Record<string, unknown>).dormantPromoted).toBe(1)
    })

    it('正例: 空会员扫描返回 0', async () => {
      const result = await ctrl.manualScan({}) as Record<string, unknown>

      expect(result).toHaveProperty('scannedCount', 0)
      expect(result).toHaveProperty('dormantPromoted', 0)
      expect(result).toHaveProperty('churnedPromoted', 0)
    })

    it('边界: cron 不可用抛 BadRequestException', async () => {
      ctrl = new MemberDormancyController(dormancy, undefined)

      await expect(
        ctrl.manualScan({})
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.manualScan({})
      ).rejects.toThrow(/not available/)
    })

    it('反例: cron @Optional() 依赖不存在时拒绝', async () => {
      ctrl = new MemberDormancyController(dormancy, undefined)

      await expect(
        ctrl.manualScan({})
      ).rejects.toThrow('MemberDormancyCron not available')
    })
  })

  // ──────────────────────────────────────────────
  // GET /api/member/dormancy/stats
  // ──────────────────────────────────────────────
  describe('GET stats', () => {
    it('正例: 空数据库返回全部为零', async () => {
      const stats = await ctrl.stats({})

      expect(stats).toEqual({
        active: 0,
        dormant: 0,
        churned: 0,
        total: 0
      })
    })

    it('正例: 扫描后统计数据正确反映状态分布', async () => {
      members.push(makeProfile({ memberId: 'st-active', lastActiveAt: new Date().toISOString() }) as Profile)
      members.push(makeProfile({ memberId: 'st-dormant', lastActiveAt: daysAgo(91) }) as Profile)
      members.push(makeProfile({ memberId: 'st-churn', lastActiveAt: daysAgo(365) }) as Profile)

      await dormancy.scanAndPromote()

      const stats = await ctrl.stats({})
      expect(stats.active).toBe(1)   // 刚扫完时只有 m-active 是活跃
      // churned 是 dormant→churned 但不包含 ACTIVE 直接跳级
      expect(stats.total).toBe(3)
    })

    it('正例: tenantId 过滤只返回指定租户统计', async () => {
      members.push(makeProfile({ memberId: 'st-t1', tenantContext: { tenantId: 't1' } }) as Profile)
      members.push(makeProfile({ memberId: 'st-t2', tenantContext: { tenantId: 't2' } }) as Profile)

      const stats = await ctrl.stats({ tenantId: 't1' })

      expect(stats.total).toBe(1)
      expect(stats.active).toBe(1)
    })

    it('边界: 服务不可用时抛 BadRequestException', async () => {
      ctrl = new MemberDormancyController(undefined, undefined)

      await expect(
        ctrl.stats({})
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.stats({})
      ).rejects.toThrow(/not available/)
    })
  })

  // ──────────────────────────────────────────────
  // GET /api/member/dormancy/list/:stage
  // ──────────────────────────────────────────────
  describe('GET list /:stage', () => {
    it('正例: 列出 ACTIVE 会员返回结构正确', async () => {
      members.push(makeProfile({ memberId: 'l-active' }) as Profile)

      const result = await ctrl.listByStage('ACTIVE', {})

      expect(result.stage).toBe('ACTIVE')
      expect(result.members).toHaveLength(1)
      expect(result.members[0].memberId).toBe('l-active')
      expect(result.members[0]).toHaveProperty('tenantId')
      expect(result.members[0]).toHaveProperty('nickname')
    })

    it('正例: 列出 DORMANT 会员', async () => {
      members.push(makeProfile({ memberId: 'l-dormant', lastActiveAt: daysAgo(91) }) as Profile)
      await dormancy.scanAndPromote()

      const result = await ctrl.listByStage('DORMANT', {})

      expect(result.stage).toBe('DORMANT')
      expect(result.members).toHaveLength(1)
      expect(result.members[0].memberId).toBe('l-dormant')
    })

    it('反例: 无效 stage 抛 BadRequestException', async () => {
      await expect(
        ctrl.listByStage('BOGUS_STAGE', {})
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.listByStage('BOGUS_STAGE', {})
      ).rejects.toThrow(/invalid stage/)
    })

    it('边界: tenantId 过滤只返回该租户成员', async () => {
      members.push(makeProfile({ memberId: 'l-tenant1', tenantContext: { tenantId: 'tenant-x' } }) as Profile)
      members.push(makeProfile({ memberId: 'l-tenant2', tenantContext: { tenantId: 'tenant-y' } }) as Profile)

      const result = await ctrl.listByStage('ACTIVE', { tenantId: 'tenant-x' })

      expect(result.members).toHaveLength(1)
      expect(result.members[0].memberId).toBe('l-tenant1')
    })

    it('边界: tenantId 不存在返回空列表', async () => {
      members.push(makeProfile({ memberId: 'l-nomatch' }) as Profile)

      const result = await ctrl.listByStage('ACTIVE', { tenantId: 'nonexistent' })

      expect(result.members).toHaveLength(0)
    })

    it('边界: 服务不可用时抛 BadRequestException', async () => {
      ctrl = new MemberDormancyController(undefined, undefined)

      await expect(
        ctrl.listByStage('ACTIVE', {})
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.listByStage('ACTIVE', {})
      ).rejects.toThrow(/not available/)
    })
  })

  // ──────────────────────────────────────────────
  // GET /api/member/dormancy/cron-metrics
  // ──────────────────────────────────────────────
  describe('GET cron-metrics', () => {
    it('正例: 初始状态指标返回默认零值', async () => {
      const metrics = await ctrl.cronMetrics()

      expect(metrics).toHaveProperty('totalRuns', 0)
      expect(metrics).toHaveProperty('totalScanned', 0)
      expect(metrics).toHaveProperty('totalDormantPromoted', 0)
      expect(metrics).toHaveProperty('totalChurnedPromoted', 0)
      expect(metrics).toHaveProperty('totalDurationMs', 0)
      expect(metrics).toHaveProperty('lastRunAt', null)
      expect(metrics).toHaveProperty('lastErrorAt', null)
      expect(metrics).toHaveProperty('lastError', null)
    })

    it('正例: 扫描后指标累计更新', async () => {
      members.push(makeProfile({ memberId: 'mc-dormant', lastActiveAt: daysAgo(91) }) as Profile)
      await cron.hourlyScan()

      const metrics = await ctrl.cronMetrics()
      expect(metrics.totalRuns).toBe(1)
      expect(metrics.totalScanned).toBe(1)
      expect(metrics.totalDormantPromoted).toBe(1)
      expect(metrics.lastRunAt).not.toBeNull()
    })

    it('边界: cron 不可用时抛 BadRequestException', async () => {
      ctrl = new MemberDormancyController(dormancy, undefined)

      await expect(
        ctrl.cronMetrics()
      ).rejects.toThrow(BadRequestException)

      await expect(
        ctrl.cronMetrics()
      ).rejects.toThrow(/not available/)
    })

    it('边界: 多次扫描累计指标正确', async () => {
      members.push(makeProfile({ memberId: 'mc-m1', lastActiveAt: daysAgo(91) }) as Profile)
      members.push(makeProfile({ memberId: 'mc-m2', lastActiveAt: daysAgo(365) }) as Profile)
      await cron.hourlyScan()

      // 第二次扫描无新增
      await cron.hourlyScan()

      const metrics = await ctrl.cronMetrics()
      expect(metrics.totalRuns).toBe(2)
      expect(metrics.totalScanned).toBe(4) // 2 会员 × 2 次扫描
    })
  })

  // ──────────────────────────────────────────────
  // 端点完整性 & 结构检查
  // ──────────────────────────────────────────────
  describe('端点完整性', () => {
    it('Controller 包含全部 5 个公开路由方法', () => {
      const proto = MemberDormancyController.prototype as Record<string, unknown>
      expect(typeof proto.reactivate).toBe('function')
      expect(typeof proto.manualScan).toBe('function')
      expect(typeof proto.stats).toBe('function')
      expect(typeof proto.listByStage).toBe('function')
      expect(typeof proto.cronMetrics).toBe('function')
    })

    it('返回类型结构一致', async () => {
      // reactivate 返回 { ok, memberId, stage }
      const reactivateSpy = vi.spyOn(dormancy, 'reactivate').mockReturnValue({
        memberId: 'm-check',
        nickname: 'test',
        tenantContext: { tenantId: 't1' },
        lastActiveAt: new Date().toISOString()
      } as ReturnType<typeof dormancy.reactivate>)

      const r = await ctrl.reactivate('m-check', { tenantId: 't1' })
      expect(r).toHaveProperty('ok', true)
      expect(r).toHaveProperty('memberId')
      expect(r).toHaveProperty('stage')

      reactivateSpy.mockRestore()
    })
  })
})
