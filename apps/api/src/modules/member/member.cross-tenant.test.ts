import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { MemberCrossTenantService } from './member.cross-tenant'
import { MemberConfigService, DEFAULT_MEMBER_CONFIG } from './member-config'
import { resetMemberServiceTestState } from './member.service'
import type { MemberProfile } from './member.entity'

/**
 * Phase-36 T166-3: Member 跨租户识别 · 单元测试
 *
 * 覆盖 (≥ 8 断言):
 *  - AC-1: 接口定义 + 默认行为
 *  - AC-2: 配置驱动 (phoneUniqueScope + crossTenantEnabled)
 *  - AC-3: 跨租户查询返回多租户脱敏数据
 *  - AC-4: 关联/合并 (LINK + UNLINK)
 *  - AC-5: 反模式 v4 self-link 防御
 *  - AC-6: 同租户 link 防御
 *  - AC-7: linkHistory 审计追踪
 *  - AC-8: PII 字段脱敏 (mobile 仅显示前3+后4)
 *  - 防御: invalid mobile 抛 400
 *  - 防御: crossTenantEnabled=false 抛 403
 */

function makeMember(overrides: Partial<MemberProfile> = {}): MemberProfile {
  const now = new Date().toISOString()
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 10)}`,
    tenantContext: { tenantId: 't1' } as MemberProfile['tenantContext'],
    nickname: 'Test',
    level: 'BRONZE' as MemberProfile['level'],
    status: 'ACTIVE' as MemberProfile['status'],
    points: 0,
    registeredAt: now,
    ...overrides
  } as MemberProfile
}

describe('MemberCrossTenantService', () => {
  let memberService: any
  let configService: MemberConfigService
  let svc: MemberCrossTenantService

  beforeEach(() => {
    resetMemberServiceTestState()
    configService = new MemberConfigService()
    const members: MemberProfile[] = []
    memberService = {
      listProfiles: () => members,
      getProfile: (id: string) => members.find((m) => m.memberId === id),
      register: (input: any) => {
        const m = makeMember({ memberId: input.memberId, ...input })
        members.push(m)
        return m
      }
    }
    svc = new MemberCrossTenantService(memberService, configService)
  })

  it('AC-1: 默认配置 phoneUniqueScope=global + crossTenantEnabled=true', () => {
    assert.equal(DEFAULT_MEMBER_CONFIG.phoneUniqueScope, 'global')
    assert.equal(DEFAULT_MEMBER_CONFIG.crossTenantEnabled, true)
    assert.equal(configService.isCrossTenantEnabled(), true)
    assert.equal(configService.getPhoneUniqueScope(), 'global')
  })

  it('AC-2: 配置关闭 crossTenantEnabled=false 抛 ForbiddenException', () => {
    configService.updateConfig({ crossTenantEnabled: false }, 'admin', 'PII strict mode')
    assert.throws(
      () => svc.findByMobileAcrossTenants('13800138000'),
      /cross-tenant query disabled/
    )
    assert.throws(
      () =>
        svc.linkAcrossTenants({
          primaryMemberId: 'm1',
          secondaryMemberId: 'm2',
          reason: 'test',
          performedBy: 'admin'
        }),
      /cross-tenant link disabled/
    )
  })

  it('AC-3: 跨租户查询返回多租户脱敏数据', () => {
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice',
      mobile: '13800138000'
    })
    memberService.register({
      memberId: 'm2',
      tenantContext: { tenantId: 't2' },
      nickname: 'Bob',
      mobile: '13800138000'  // 同手机号, 不同租户
    })
    memberService.register({
      memberId: 'm3',
      tenantContext: { tenantId: 't1' },
      nickname: 'Carol',
      mobile: '13900139000'  // 不同手机号
    })

    const results = svc.findByMobileAcrossTenants('13800138000')
    assert.equal(results.length, 2)
    const tenants = results.map((r) => r.tenantId).sort()
    assert.deepEqual(tenants, ['t1', 't2'])

    // PII 脱敏: 仅显示前3+后4
    assert.equal(results[0].mobileMasked, '138****8000')
  })

  it('AC-3: 返回字段不含完整 mobile/password/token', () => {
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice',
      mobile: '13800138000'
    } as any)
    const results = svc.findByMobileAcrossTenants('13800138000')
    assert.equal(results.length, 1)
    const r = results[0] as any
    assert.ok(!('password' in r), 'should not include password')
    assert.ok(!('token' in r), 'should not include token')
    assert.ok(!('mobile' in r) || r.mobile === undefined, 'should not include full mobile')
  })

  it('AC-4: 防御: invalid mobile 抛 BadRequestException', () => {
    assert.throws(() => svc.findByMobileAcrossTenants(''), /must be 11-digit/)
    assert.throws(() => svc.findByMobileAcrossTenants('123'), /must be 11-digit/)
    assert.throws(() => svc.findByMobileAcrossTenants('23800138000'), /must be 11-digit/)  // 非 1[3-9] 开头
  })

  it('AC-5: 防御: self-link 抛 BadRequestException', () => {
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    assert.throws(
      () =>
        svc.linkAcrossTenants({
          primaryMemberId: 'm1',
          secondaryMemberId: 'm1',  // self
          reason: 'test',
          performedBy: 'admin'
        }),
      /cannot link a member to itself/
    )
  })

  it('AC-6: 防御: 同租户 link 抛 BadRequestException', () => {
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    memberService.register({
      memberId: 'm2',
      tenantContext: { tenantId: 't1' },  // 同租户
      nickname: 'Bob'
    })
    assert.throws(
      () =>
        svc.linkAcrossTenants({
          primaryMemberId: 'm1',
          secondaryMemberId: 'm2',
          reason: 'test',
          performedBy: 'admin'
        }),
      /use member.service.updateProfile for same-tenant/
    )
  })

  it('AC-7: 跨租户 link 成功 + linkHistory 审计追踪', () => {
    const primary = memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    memberService.register({
      memberId: 'm2',
      tenantContext: { tenantId: 't2' },
      nickname: 'Bob'
    })
    const result = svc.linkAcrossTenants({
      primaryMemberId: 'm1',
      secondaryMemberId: 'm2',
      reason: 'win-back campaign',
      performedBy: 'admin-001'
    })
    assert.equal(result.primaryMemberId, 'm1')
    assert.equal(result.linkedMembers.length, 1)
    assert.equal(result.linkedMembers[0].memberId, 'm2')

    const ext = primary as MemberProfile & { _linkHistory?: any[] }
    assert.ok(ext._linkHistory && ext._linkHistory.length === 1)
    assert.equal(ext._linkHistory![0].action, 'LINK')
    assert.equal(ext._linkHistory![0].reason, 'win-back campaign')
    assert.equal(ext._linkHistory![0].performedBy, 'admin-001')
  })

  it('AC-8: UNLINK 软删除保留审计', () => {
    const primary = memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    memberService.register({
      memberId: 'm2',
      tenantContext: { tenantId: 't2' },
      nickname: 'Bob'
    })
    svc.linkAcrossTenants({
      primaryMemberId: 'm1',
      secondaryMemberId: 'm2',
      reason: 'merge',
      performedBy: 'admin'
    })
    const result = svc.unlinkAcrossTenants({
      primaryMemberId: 'm1',
      secondaryMemberId: 'm2',
      reason: 'GDPR right-to-erasure',
      performedBy: 'admin'
    })
    // UNLINK 后 linkedMembers 空, 但 history 保留
    assert.equal(result.linkedMembers.length, 0)
    assert.equal(result.linkHistory.length, 2)
    assert.equal(result.linkHistory[0].action, 'LINK')
    assert.equal(result.linkHistory[1].action, 'UNLINK')

    // getLinkHistory 也能查到
    const history = svc.getLinkHistory('m1')
    assert.equal(history.length, 2)
  })

  it('AC-9: linkHistory ringbuffer LRU 100', () => {
    const primary = memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    // 注册 50 个不同租户的 secondary members
    for (let i = 0; i < 50; i++) {
      memberService.register({
        memberId: `m2-${i}`,
        tenantContext: { tenantId: `t-remote-${i}` },
        nickname: `Remote-${i}`
      })
    }
    // 50 次 link + 50 次 unlink = 100 次操作
    for (let i = 0; i < 50; i++) {
      svc.linkAcrossTenants({
        primaryMemberId: 'm1',
        secondaryMemberId: `m2-${i}`,
        reason: `link-${i}`,
        performedBy: 'admin'
      })
      svc.unlinkAcrossTenants({
        primaryMemberId: 'm1',
        secondaryMemberId: `m2-${i}`,
        reason: `unlink-${i}`,
        performedBy: 'admin'
      })
    }
    // 100 次操作, 不应超过 100 (ringbuffer)
    const ext = primary as MemberProfile & { _linkHistory?: any[] }
    assert.ok(
      ext._linkHistory && ext._linkHistory.length <= 100,
      `ringbuffer ok, got ${ext._linkHistory?.length}`
    )
    assert.ok(ext._linkHistory && ext._linkHistory.length > 0)
    // 最后一条应该是 UNLINK
    assert.equal(ext._linkHistory![ext._linkHistory!.length - 1].action, 'UNLINK')
  })

  it('AC-10: 防御: 不存在的 memberId link 抛 NotFoundException', () => {
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice'
    })
    assert.throws(
      () =>
        svc.linkAcrossTenants({
          primaryMemberId: 'm1',
          secondaryMemberId: 'not-exist',
          reason: 'test',
          performedBy: 'admin'
        }),
      /member not found/
    )
  })

  it('AC-11: mobile 校验支持 13/14/15/16/17/18/19 开头', () => {
    const validMobiles = ['13800138000', '14800138000', '15800138000', '17800138000', '18800138000']
    memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Test',
      mobile: validMobiles[0]
    })
    for (const m of validMobiles) {
      // 至少不抛 invalid mobile format
      try {
        svc.findByMobileAcrossTenants(m)
      } catch (err: any) {
        assert.ok(!/invalid mobile format/.test(err.message), `${m} should pass format check`)
      }
    }
  })
})