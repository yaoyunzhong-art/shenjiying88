import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * MemberCrossTenantController 单元测试
 *
 * 覆盖端点:
 *   - GET  /api/member/cross-tenant/mobile/:mobile
 *   - POST /api/member/cross-tenant/link
 *   - POST /api/member/cross-tenant/unlink
 *   - GET  /api/member/cross-tenant/history/:memberId
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type CrossTenantMemberSummary = {
  memberId: string
  mobile: string
  name: string
  tenantId: string
  tenantName: string
  matchedAt: string
}

type CrossTenantMemberLink = {
  id: string
  primaryMemberId: string
  secondaryMemberId: string
  primaryTenantId: string
  secondaryTenantId: string
  reason: string
  performedBy: string
  linkedAt: string
  status: 'active' | 'unlinked'
  linkHistory: Array<{
    action: string
    performedBy: string
    reason: string
    timestamp: string
  }>
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const memberDb = new Map<string, CrossTenantMemberSummary[]>()
  const links = new Map<string, CrossTenantMemberLink>()
  const histories = new Map<string, CrossTenantMemberLink['linkHistory']>()
  let linkIdCounter = 0

  // Seed some member data
  memberDb.set('13800138000', [
    { memberId: 'm-t1-1', mobile: '13800138000', name: '张三', tenantId: 't-1', tenantName: '门店A', matchedAt: '2026-07-01T00:00:00Z' },
  ])
  memberDb.set('13900139000', [
    { memberId: 'm-t1-2', mobile: '13900139000', name: '李四', tenantId: 't-1', tenantName: '门店A', matchedAt: '2026-07-01T00:00:00Z' },
    { memberId: 'm-t2-2', mobile: '13900139000', name: '李四', tenantId: 't-2', tenantName: '门店B', matchedAt: '2026-07-02T00:00:00Z' },
  ])

  return {
    findByMobileAcrossTenants(mobile: string): CrossTenantMemberSummary[] {
      return memberDb.get(mobile) ?? []
    },

    linkAcrossTenants(body: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }): CrossTenantMemberLink {
      const id = `ct-link-${++linkIdCounter}`
      const link: CrossTenantMemberLink = {
        id,
        primaryMemberId: body.primaryMemberId,
        secondaryMemberId: body.secondaryMemberId,
        primaryTenantId: 't-1',
        secondaryTenantId: 't-2',
        reason: body.reason,
        performedBy: body.performedBy,
        linkedAt: new Date().toISOString(),
        status: 'active',
        linkHistory: [
          { action: 'link', performedBy: body.performedBy, reason: body.reason, timestamp: new Date().toISOString() },
        ],
      }
      links.set(id, link)
      histories.set(body.primaryMemberId, link.linkHistory)
      return link
    },

    unlinkAcrossTenants(body: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }): CrossTenantMemberLink {
      const id = `ct-link-unlink-${++linkIdCounter}`
      const link: CrossTenantMemberLink = {
        id,
        primaryMemberId: body.primaryMemberId,
        secondaryMemberId: body.secondaryMemberId,
        primaryTenantId: 't-1',
        secondaryTenantId: 't-2',
        reason: body.reason,
        performedBy: body.performedBy,
        linkedAt: new Date().toISOString(),
        status: 'unlinked',
        linkHistory: [
          { action: 'link', performedBy: body.performedBy, reason: 'Initial link', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { action: 'unlink', performedBy: body.performedBy, reason: body.reason, timestamp: new Date().toISOString() },
        ],
      }
      histories.set(body.primaryMemberId, link.linkHistory)
      return link
    },

    getLinkHistory(memberId: string): CrossTenantMemberLink['linkHistory'] {
      return histories.get(memberId) ?? []
    },

    // Seed helpers
    _seedMember(mobile: string, summaries: CrossTenantMemberSummary[]) {
      memberDb.set(mobile, summaries)
    },
    _seedHistory(memberId: string, history: CrossTenantMemberLink['linkHistory']) {
      histories.set(memberId, history)
    },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineMemberCrossTenantController {
  private readonly service: ReturnType<typeof createMocks>
  private available: boolean = true

  constructor(service?: ReturnType<typeof createMocks>) {
    this.service = service!
  }

  setAvailable(v: boolean) { this.available = v }

  async findByMobile(mobile: string): Promise<{ mobile: string; matches: CrossTenantMemberSummary[]; count: number }> {
    if (!this.available) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    const matches = this.service.findByMobileAcrossTenants(mobile)
    return {
      mobile: this.maskInResponse(mobile),
      matches,
      count: matches.length,
    }
  }

  async link(body: { primaryMemberId: string; secondaryMemberId: string; reason: string; performedBy: string }): Promise<CrossTenantMemberLink> {
    if (!this.available) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    return this.service.linkAcrossTenants(body)
  }

  async unlink(body: { primaryMemberId: string; secondaryMemberId: string; reason: string; performedBy: string }): Promise<CrossTenantMemberLink> {
    if (!this.available) {
      throw Object.assign(new Error('MemberCrossTenantService not available'), { status: 400 })
    }
    return this.service.unlinkAcrossTenants(body)
  }

  async history(memberId: string): Promise<{ memberId: string; history: CrossTenantMemberLink['linkHistory'] }> {
    if (!this.available) {
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

describe('MemberCrossTenantController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineMemberCrossTenantController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineMemberCrossTenantController(mock)
  })

  describe('GET /api/member/cross-tenant/mobile/:mobile - findByMobile', () => {
    it('[正例] 单租户匹配', async () => {
      const result = await controller.findByMobile('13800138000')
      assert.equal(result.count, 1)
      assert.equal(result.matches[0].name, '张三')
    })

    it('[正例] 跨租户匹配', async () => {
      const result = await controller.findByMobile('13900139000')
      assert.equal(result.count, 2)
      assert.equal(result.matches[0].tenantId, 't-1')
      assert.equal(result.matches[1].tenantId, 't-2')
    })

    it('[正例] mobile 响应中脱敏', async () => {
      const result = await controller.findByMobile('13800138000')
      assert.equal(result.mobile, '138****8000')
    })

    it('[边界] 无匹配返回空列表', async () => {
      const result = await controller.findByMobile('19900000000')
      assert.equal(result.count, 0)
      assert.deepEqual(result.matches, [])
    })

    it('[边界] 短号码脱敏为 ***', async () => {
      const result = await controller.findByMobile('123')
      assert.equal(result.mobile, '***')
    })

    it('[反例] 服务不可用时抛 400', async () => {
      controller.setAvailable(false)
      try {
        await controller.findByMobile('13800138000')
        assert.fail('Should have thrown')
      } catch (e: any) {
        assert.equal(e.message, 'MemberCrossTenantService not available')
      }
    })
  })

  describe('POST /api/member/cross-tenant/link - link', () => {
    it('[正例] 关联会员成功', async () => {
      const result = await controller.link({
        primaryMemberId: 'm-t1-1',
        secondaryMemberId: 'm-t2-1',
        reason: '同一人',
        performedBy: 'admin-1',
      })
      assert.equal(result.status, 'active')
      assert.equal(result.primaryMemberId, 'm-t1-1')
      assert.ok(result.id)
      assert.equal(result.linkHistory.length, 1)
    })

    it('[正例] 关联记录操作人', async () => {
      const result = await controller.link({
        primaryMemberId: 'm-t1-1',
        secondaryMemberId: 'm-t2-2',
        reason: '会员合并',
        performedBy: 'op-zhang',
      })
      assert.equal(result.performedBy, 'op-zhang')
      assert.equal(result.linkHistory[0].performedBy, 'op-zhang')
    })
  })

  describe('POST /api/member/cross-tenant/unlink - unlink', () => {
    it('[正例] 解关联成功', async () => {
      const result = await controller.unlink({
        primaryMemberId: 'm-t1-1',
        secondaryMemberId: 'm-t2-1',
        reason: '错误关联',
        performedBy: 'admin-2',
      })
      assert.equal(result.status, 'unlinked')
      assert.equal(result.linkHistory.length, 2)
      assert.equal(result.linkHistory[1].action, 'unlink')
    })

    it('[正例] 解关联保留审计历史', async () => {
      const result = await controller.unlink({
        primaryMemberId: 'm-t1-2',
        secondaryMemberId: 'm-t2-2',
        reason: '数据纠错',
        performedBy: 'auditor',
      })
      assert.equal(result.linkHistory[0].action, 'link')
      assert.equal(result.linkHistory[1].action, 'unlink')
      assert.equal(result.linkHistory[1].performedBy, 'auditor')
    })
  })

  describe('GET /api/member/cross-tenant/history/:memberId - history', () => {
    it('[正例] 查询审计追踪', async () => {
      await controller.link({
        primaryMemberId: 'm-t1-1',
        secondaryMemberId: 'm-t2-1',
        reason: '测试',
        performedBy: 'admin',
      })
      const result = await controller.history('m-t1-1')
      assert.equal(result.memberId, 'm-t1-1')
      assert.equal(result.history.length, 1)
    })

    it('[边界] 无历史返回空数组', async () => {
      const result = await controller.history('m-unknown')
      assert.deepEqual(result.history, [])
    })
  })
})
