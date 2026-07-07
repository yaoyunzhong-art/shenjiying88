import { describe, it, expect, beforeEach } from 'vitest'
import { SvipService } from './svip.service'

/**
 * 🐜 [svip] 角色扩展测试
 */

function setup() {
  return { svip: new SvipService() }
}

describe('👔店长 svip 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('开通 SVIP 会员', () => {
    const member = svc.svip.createMember('user-1', 'monthly')
    expect(member.memberId).toBeTruthy()
    expect(member.plan).toBe('monthly')
    expect(member.status).toBe('active')
  })

  it('查询 SVIP 会员信息', () => {
    svc.svip.createMember('user-2', 'yearly')
    const info = svc.svip.getMember('user-2')
    expect(info).not.toBeNull()
    expect(info!.plan).toBe('yearly')
  })
})

describe('🛒前台 svip 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('续费 SVIP', () => {
    const m = svc.svip.createMember('user-3', 'monthly')
    const renewed = svc.svip.renewMember('user-3', 'yearly')
    expect(renewed.plan).toBe('yearly')
    expect(renewed.expiresAt.getTime()).toBeGreaterThan(m.expiresAt.getTime())
  })
})

describe('📢营销 svip 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('查询不存在的会员返回 null', () => {
    const info = svc.svip.getMember('no-such')
    expect(info).toBeNull()
  })

  it('获取所有 SVIP 会员列表', () => {
    svc.svip.createMember('u1', 'monthly')
    svc.svip.createMember('u2', 'yearly')
    const all = svc.svip.listMembers()
    expect(all.length).toBeGreaterThanOrEqual(2)
  })

  it('会员权益查询', () => {
    const benefits = svc.svip.getBenefits('yearly')
    expect(benefits.length).toBeGreaterThanOrEqual(1)
  })
})
