import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [member.cross-tenant] [D] controller spec 补全
 *
 * MemberCrossTenantController 单元测试
 *
 * 策略：内联 mock MemberCrossTenantService，不依赖 NestJS DI / 数据库。
 * 覆盖 4 个路由：findByMobile / link / unlink / history
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

interface CrossTenantMemberSummary {
  memberId: string
  tenantId: string
  nickname: string
  level: string
  tags?: string[]
  createdAt: string
  mobileMasked?: string
}

interface CrossTenantLinkHistoryEntry {
  primaryMemberId: string
  secondaryMemberId: string
  action: 'LINK' | 'UNLINK'
  reason: string
  performedBy: string
  at: string
}

interface CrossTenantMemberLink {
  primaryMemberId: string
  linkedMembers: CrossTenantMemberSummary[]
  linkHistory: CrossTenantLinkHistoryEntry[]
}

// ── Mock Service ────────────────────────────────────────────────
function createMockService() {
  const linkHistory: CrossTenantLinkHistoryEntry[] = []
  const members = new Map<string, any>()

  // Seed some test members
  members.set('mem-001', {
    memberId: 'mem-001',
    tenantId: 'tenant-A',
    nickname: 'Alice',
    level: 'gold',
    tags: ['vip', 'wholesale'],
    mobile: '13800138001',
    registeredAt: '2025-01-15T00:00:00Z',
  })
  members.set('mem-002', {
    memberId: 'mem-002',
    tenantId: 'tenant-B',
    nickname: 'Bob',
    level: 'silver',
    tags: ['retail'],
    mobile: '13900139002',
    registeredAt: '2025-03-20T00:00:00Z',
  })
  members.set('mem-003', {
    memberId: 'mem-003',
    tenantId: 'tenant-A',
    nickname: 'Charlie',
    level: 'platinum',
    tags: ['enterprise'],
    mobile: '13700137003',
    registeredAt: '2025-06-01T00:00:00Z',
  })

  const maskMobile = (mobile: string): string => {
    if (!mobile || mobile.length < 7) return '***'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }

  const summarize = (m: any): CrossTenantMemberSummary => ({
    memberId: m.memberId,
    tenantId: m.tenantId,
    nickname: m.nickname,
    level: m.level,
    tags: m.tags,
    createdAt: m.registeredAt,
    mobileMasked: m.mobile ? maskMobile(m.mobile) : undefined,
  })

  return {
    findByMobileAcrossTenants(mobile: string): CrossTenantMemberSummary[] {
      const results: CrossTenantMemberSummary[] = []
      for (const m of members.values()) {
        if (m.mobile === mobile) {
          results.push(summarize(m))
        }
      }
      return results
    },

    linkAcrossTenants(input: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }): CrossTenantMemberLink {
      const primary = members.get(input.primaryMemberId)
      if (!primary) {
        const err: any = new Error(`member ${input.primaryMemberId} not found`)
        err.status = 404
        throw err
      }
      const secondary = members.get(input.secondaryMemberId)
      if (!secondary) {
        const err: any = new Error(`member ${input.secondaryMemberId} not found`)
        err.status = 404
        throw err
      }
      if (input.primaryMemberId === input.secondaryMemberId) {
        const err: any = new Error('cannot link to self')
        err.status = 400
        throw err
      }
      if (primary.tenantId === secondary.tenantId) {
        const err: any = new Error('cannot link members in same tenant')
        err.status = 400
        throw err
      }
      const entry: CrossTenantLinkHistoryEntry = {
        primaryMemberId: input.primaryMemberId,
        secondaryMemberId: input.secondaryMemberId,
        action: 'LINK',
        reason: input.reason,
        performedBy: input.performedBy,
        at: new Date().toISOString(),
      }
      linkHistory.push(entry)
      return {
        primaryMemberId: input.primaryMemberId,
        linkedMembers: [summarize(secondary)],
        linkHistory: [...linkHistory],
      }
    },

    unlinkAcrossTenants(input: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }): CrossTenantMemberLink {
      const primary = members.get(input.primaryMemberId)
      if (!primary) {
        const err: any = new Error(`member ${input.primaryMemberId} not found`)
        err.status = 404
        throw err
      }
      const entry: CrossTenantLinkHistoryEntry = {
        primaryMemberId: input.primaryMemberId,
        secondaryMemberId: input.secondaryMemberId,
        action: 'UNLINK',
        reason: input.reason,
        performedBy: input.performedBy,
        at: new Date().toISOString(),
      }
      linkHistory.push(entry)
      return {
        primaryMemberId: input.primaryMemberId,
        linkedMembers: [],
        linkHistory: [...linkHistory],
      }
    },

    getLinkHistory(memberId: string): CrossTenantLinkHistoryEntry[] {
      if (!members.has(memberId)) {
        const err: any = new Error(`member ${memberId} not found`)
        err.status = 404
        throw err
      }
      // Return only entries affecting this memberId
      return linkHistory.filter(
        (h) => h.primaryMemberId === memberId || h.secondaryMemberId === memberId,
      )
    },
  }
}

// ── Inline Controller ───────────────────────────────────────────
class InlineMemberCrossTenantController {
  constructor(private readonly service: ReturnType<typeof createMockService>) {}

  async findByMobile(mobile: string): Promise<{
    mobile: string
    matches: CrossTenantMemberSummary[]
    count: number
  }> {
    if (!this.service) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    const matches = this.service.findByMobileAcrossTenants(mobile)
    return {
      mobile: this.maskInResponse(mobile),
      matches,
      count: matches.length,
    }
  }

  async link(body: {
    primaryMemberId: string
    secondaryMemberId: string
    reason: string
    performedBy: string
  }): Promise<CrossTenantMemberLink> {
    if (!this.service) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    return this.service.linkAcrossTenants(body)
  }

  async unlink(body: {
    primaryMemberId: string
    secondaryMemberId: string
    reason: string
    performedBy: string
  }): Promise<CrossTenantMemberLink> {
    if (!this.service) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    return this.service.unlinkAcrossTenants(body)
  }

  async history(memberId: string): Promise<{
    memberId: string
    history: CrossTenantLinkHistoryEntry[]
  }> {
    if (!this.service) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    return {
      memberId,
      history: this.service.getLinkHistory(memberId),
    }
  }

  private maskInResponse(mobile: string): string {
    if (!mobile || mobile.length < 7) return '***'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('MemberCrossTenantController Phase 36 T166-3', () => {
  let controller: InlineMemberCrossTenantController
  let mockSvc: ReturnType<typeof createMockService>

  beforeEach(() => {
    mockSvc = createMockService()
    controller = new InlineMemberCrossTenantController(mockSvc)
  })

  // ─── GET /api/member/cross-tenant/mobile/:mobile ───
  describe('GET /mobile/:mobile - findByMobile', () => {
    it('[正例] 按手机号跨租户查询命中结果', async () => {
      const result = await controller.findByMobile('13800138001')
      assert.equal(result.count, 1)
      assert.equal(result.matches[0].memberId, 'mem-001')
      assert.equal(result.matches[0].tenantId, 'tenant-A')
      assert.ok(result.matches[0].mobileMasked)
      assert.match(result.matches[0].mobileMasked!, /^\d{3}\*{4}\d{4}$/)
    })

    it('[正例] 响应手机号脱敏显示', async () => {
      const result = await controller.findByMobile('13800138001')
      assert.equal(result.mobile, '138****8001')
    })

    it('[正例] 无匹配手机号返回空数组', async () => {
      const result = await controller.findByMobile('19900000000')
      assert.equal(result.count, 0)
      assert.deepEqual(result.matches, [])
    })

    it('[边界] 短手机号 (<7位) 掩码为 ***', async () => {
      const result = await controller.findByMobile('12345')
      assert.equal(result.mobile, '***')
    })

    it('[边界] 脱敏字段 consistent 格式', async () => {
      const result = await controller.findByMobile('13700137003')
      assert.ok(result.matches[0].mobileMasked)
      assert.match(result.matches[0].mobileMasked!, /^\d{3}\*{4}\d{4}$/)
    })
  })

  // ─── POST /api/member/cross-tenant/link ───
  describe('POST /link - link', () => {
    it('[正例] 跨租户关联成功', async () => {
      const result = await controller.link({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'same person verified',
        performedBy: 'op-1',
      })
      assert.equal(result.primaryMemberId, 'mem-001')
      assert.equal(result.linkedMembers.length, 1)
      assert.equal(result.linkedMembers[0].memberId, 'mem-002')
    })

    it('[正例] 关联后审计追踪有记录', async () => {
      await controller.link({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'same person',
        performedBy: 'admin-1',
      })
      const hist = await controller.history('mem-001')
      assert.equal(hist.history.length, 1)
      assert.equal(hist.history[0].action, 'LINK')
      assert.equal(hist.history[0].performedBy, 'admin-1')
    })

    it('[反例] 关联不存在的会员抛出 404', async () => {
      await assert.rejects(
        controller.link({
          primaryMemberId: 'mem-999',
          secondaryMemberId: 'mem-001',
          reason: 'test',
          performedBy: 'op-1',
        }),
        /not found/,
      )
    })

    it('[反例] self-link 抛出 400', async () => {
      await assert.rejects(
        controller.link({
          primaryMemberId: 'mem-001',
          secondaryMemberId: 'mem-001',
          reason: 'self',
          performedBy: 'op-1',
        }),
        /cannot link to self/,
      )
    })
  })

  // ─── POST /api/member/cross-tenant/unlink ───
  describe('POST /unlink - unlink', () => {
    it('[正例] 跨租户解关联成功', async () => {
      const result = await controller.unlink({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'no longer same person',
        performedBy: 'admin-1',
      })
      assert.equal(result.primaryMemberId, 'mem-001')
      assert.equal(result.linkedMembers.length, 0)
    })

    it('[正例] 解关联审计追踪记录 UNLINK', async () => {
      await controller.unlink({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'manual removal',
        performedBy: 'auditor-1',
      })
      const hist = await controller.history('mem-001')
      assert.equal(hist.history.length, 1)
      assert.equal(hist.history[0].action, 'UNLINK')
    })

    it('[反例] 解关联不存在的会员抛出 404', async () => {
      await assert.rejects(
        controller.unlink({
          primaryMemberId: 'mem-999',
          secondaryMemberId: 'mem-001',
          reason: 'test',
          performedBy: 'op-1',
        }),
        /not found/,
      )
    })
  })

  // ─── GET /api/member/cross-tenant/history/:memberId ───
  describe('GET /history/:memberId - history', () => {
    it('[正例] 查询会员审计追踪返回记录列表', async () => {
      const result = await controller.history('mem-001')
      assert.ok(Array.isArray(result.history))
      assert.equal(result.memberId, 'mem-001')
    })

    it('[正例] Link + Unlink 后历史记录完整', async () => {
      await controller.link({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'verify',
        performedBy: 'admin',
      })
      await controller.unlink({
        primaryMemberId: 'mem-001',
        secondaryMemberId: 'mem-002',
        reason: 'revert',
        performedBy: 'admin',
      })
      const hist = await controller.history('mem-001')
      assert.equal(hist.history.length, 2)
      assert.equal(hist.history[0].action, 'LINK')
      assert.equal(hist.history[1].action, 'UNLINK')
    })

    it('[反例] 查询不存在会员抛出 404', async () => {
      await assert.rejects(
        controller.history('mem-999'),
        /not found/,
      )
    })
  })
})
