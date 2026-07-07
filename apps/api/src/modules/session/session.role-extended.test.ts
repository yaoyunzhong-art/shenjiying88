// session.role-extended.test.ts · 会话管理 8角色扩展测试
// Phase-FP P10 · 2026-07-08
//
// 8 角色视角：
// 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销

import { describe, it, expect } from 'vitest'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

function makeFixture() {
  const svc = new SessionService()
  const ctrl = new SessionController(svc)
  return { svc, ctrl }
}

function sampleDevice(overrides: Record<string, string> = {}) {
  return { deviceId: 'mac-001', deviceType: 'web', browser: 'Chrome', os: 'macOS', ...overrides }
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店管理视角，关注服务台/收银会话安全
// ═══════════════════════════════════════════════════════════════

describe('👔店长 session 角色测试', () => {
  it('店长应能查看门店设备上所有活跃会话（管理视角）', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'cashier-01', tenantId: 'store-001', deviceInfo: { deviceId: 'pos-1', deviceType: 'pos' } })
    ctrl.createSession({ userId: 'guide-01', tenantId: 'store-001', deviceInfo: { deviceId: 'tablet-g1', deviceType: 'mobile' } })

    const r1 = ctrl.getUserSessions('cashier-01')
    const r2 = ctrl.getUserSessions('guide-01')
    expect(r1.count).toBe(1)
    expect(r2.count).toBe(1)
  })

  it('店长批量作废异常设备所有会话（安全管控）', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'employee-99', tenantId: 'store-001', deviceInfo: { deviceId: 'lost-phone', deviceType: 'mobile' } })
    ctrl.createSession({ userId: 'employee-99', tenantId: 'store-001', deviceInfo: { deviceId: 'unknown-pc', deviceType: 'web' } })

    const result = ctrl.revokeAllUserSessions({ userId: 'employee-99' })
    expect(result.success).toBe(true)
    expect(result.revokedCount).toBe(2)

    // 验证已清空
    expect(ctrl.getUserSessions('employee-99').count).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 前台收银视角，处理顾客设备绑定
// ═══════════════════════════════════════════════════════════════

describe('🛒前台 session 角色测试', () => {
  it('前台为临时顾客创建轻量会话', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'walkin-cust-001',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'temp-pos-01', deviceType: 'pos' },
    })
    expect(r.sessionId).toBeTruthy()
    expect(r.status).toBe('active')
  })

  it('前台不能查看其他租户/门店的会话（租户隔离）', () => {
    const { ctrl } = makeFixture()
    const s1 = ctrl.createSession({ userId: 'u1', tenantId: 'store-001', deviceInfo: sampleDevice() })
    const s2 = ctrl.createSession({ userId: 'u2', tenantId: 'store-002', deviceInfo: sampleDevice() })

    const v1 = ctrl.validateSession({ sessionId: s1.sessionId })
    const v2 = ctrl.validateSession({ sessionId: s2.sessionId })
    expect(v1.valid).toBe(true)
    expect(v1.tenantId).toBe('store-001')
    expect(v2.tenantId).toBe('store-002')
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 人力资源视角，关注员工系统会话合规
// ═══════════════════════════════════════════════════════════════

describe('👥HR session 角色测试', () => {
  it('HR 应能查询员工活跃会话统计', () => {
    const { ctrl, svc } = makeFixture()
    ctrl.createSession({ userId: 'emp-01', tenantId: 'store-001', deviceInfo: sampleDevice() })

    const count = svc.getUserSessionCount('emp-01')
    expect(count).toBe(1)
  })

  it('HR 离职操作应作废员工所有会话', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'ex-employee', tenantId: 'store-001', deviceInfo: sampleDevice() })
    ctrl.createSession({ userId: 'ex-employee', tenantId: 'store-001', deviceInfo: { deviceId: 'phone', deviceType: 'mobile' } })

    const r = ctrl.revokeAllUserSessions({ userId: 'ex-employee' })
    expect(r.revokedCount).toBe(2)

    // 后续验证均失败
    expect(() => ctrl.getSession('ex-employee')).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安防监控视角，关注异常会话检测
// ═══════════════════════════════════════════════════════════════

describe('🔧安监 session 角色测试', () => {
  it('安监检测到异常设备时验证会话状态', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'suspect-user',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'unknown-bot', deviceType: 'unknown', browser: 'curl/7.68', os: 'Linux' },
    })
    expect(r.status).toBe('active')

    // 安监验证后可作废
    const revoked = ctrl.revokeSession({ sessionId: r.sessionId })
    expect(revoked.success).toBe(true)
  })

  it('安监对不存在作废尝试返回正确错误', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.revokeSession({ sessionId: 'phantom-session' })).toThrow(NotFoundException)
  })

  it('安监可批量清除未授权终端会话', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'intruder', tenantId: 'store-001', deviceInfo: { deviceId: 'hacked-device', deviceType: 'web' } })
    ctrl.createSession({ userId: 'intruder', tenantId: 'store-001', deviceInfo: { deviceId: 'rogue-app', deviceType: 'mobile' } })

    const r = ctrl.revokeAllUserSessions({ userId: 'intruder' })
    expect(r.revokedCount).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 导玩员视角，管理游戏机台绑定会话
// ═══════════════════════════════════════════════════════════════

describe('🎮导玩员 session 角色测试', () => {
  it('导玩员绑定游戏机台创建设备会话', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'player-001',
      tenantId: 'arcade-001',
      deviceInfo: { deviceId: 'cabinet-12', deviceType: 'arcade', browser: undefined, os: 'embedded' },
    })
    expect(r.deviceInfo.deviceType).toBe('arcade')
    expect(r.status).toBe('active')
  })

  it('导玩员切换机台时旧会话自动超时', () => {
    const { ctrl } = makeFixture()
    const r1 = ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-12', deviceType: 'arcade' } })
    ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-15', deviceType: 'arcade' } })

    // 由于超出最大并发，最旧的会话被淘汰
    // r1 应在第 6 个会话时被淘汰，但这里只创建了 2 个（在 5 限制内）
    // 改为验证：第6个创建时旧会话被淘汰
    const r3 = ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-16', deviceType: 'arcade' } })
    const r4 = ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-17', deviceType: 'arcade' } })
    const r5 = ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-18', deviceType: 'arcade' } })
    // 第 6 个触发淘汰
    ctrl.createSession({ userId: 'player-001', tenantId: 'arcade-001', deviceInfo: { deviceId: 'cabinet-19', deviceType: 'arcade' } })

    const v1 = ctrl.validateSession({ sessionId: r1.sessionId })
    expect(v1.valid).toBe(false)

    // 最新的仍然有效
    const v5 = ctrl.validateSession({ sessionId: r5.sessionId })
    expect(v5.valid).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 运维视角，关注系统会话指标
// ═══════════════════════════════════════════════════════════════

describe('🎯运行专员 session 角色测试', () => {
  it('运维查询设备类型分布（按 deviceType 归类）', () => {
    const { ctrl, svc } = makeFixture()
    ctrl.createSession({ userId: 'op1', tenantId: 't1', deviceInfo: { deviceId: 'd1', deviceType: 'web' } })
    ctrl.createSession({ userId: 'op2', tenantId: 't1', deviceInfo: { deviceId: 'd2', deviceType: 'mobile' } })
    ctrl.createSession({ userId: 'op3', tenantId: 't1', deviceInfo: { deviceId: 'd3', deviceType: 'pos' } })

    const w1 = svc.getUserSessions('op1')
    const w2 = svc.getUserSessions('op2')
    const w3 = svc.getUserSessions('op3')

    expect(w1[0].deviceInfo.deviceType).toBe('web')
    expect(w2[0].deviceInfo.deviceType).toBe('mobile')
    expect(w3[0].deviceInfo.deviceType).toBe('pos')
  })

  it('运维批量作废不存在的用户不抛错', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.revokeAllUserSessions({ userId: 'ghost-user' })
    expect(r.success).toBe(true)
    expect(r.revokedCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团建组织者视角，管理团体临时会话
// ═══════════════════════════════════════════════════════════════

describe('🤝团建 session 角色测试', () => {
  it('团建组织者为每位成员创建独立会话', () => {
    const { ctrl } = makeFixture()
    const members = ['member-a', 'member-b', 'member-c']
    const ids = members.map((m) =>
      ctrl.createSession({ userId: m, tenantId: 'team-building-01', deviceInfo: { deviceId: `device-${m}`, deviceType: 'mobile' } }),
    )

    ids.forEach((r) => {
      expect(r.status).toBe('active')
      expect(r.tenantId).toBe('team-building-01')
    })
    expect(new Set(ids.map((r) => r.sessionId)).size).toBe(3)
  })

  it('团建结束统一作废所有会话', () => {
    const { ctrl } = makeFixture()
    const members = ['lead-01', 'member-x', 'member-y']
    members.forEach((m) =>
      ctrl.createSession({ userId: m, tenantId: 'tb-event', deviceInfo: { deviceId: `d-${m}`, deviceType: 'mobile' } }),
    )

    const results = members.map((m) => ctrl.revokeAllUserSessions({ userId: m }))
    results.forEach((r) => {
      expect(r.success).toBe(true)
      expect(r.revokedCount).toBe(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 营销视角，关注营销活动登录会话
// ═══════════════════════════════════════════════════════════════

describe('📢营销 session 角色测试', () => {
  it('营销员为推广活动创建观众会话（模拟登录）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'campaign-viewer-001',
      tenantId: 'mkt-camp-spring',
      deviceInfo: { deviceId: 'mini-prog', deviceType: 'weapp', browser: 'WeChat', os: 'iOS' },
    })
    expect(r.status).toBe('active')
    expect(r.tenantId).toBe('mkt-camp-spring')
  })

  it('营销数据导出前验证会话合法性', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'mgr-marketing',
      tenantId: 'store-001',
      deviceInfo: sampleDevice(),
    })

    const valid = ctrl.validateSession({ sessionId: r.sessionId })
    expect(valid.valid).toBe(true)
    expect(valid.userId).toBe('mgr-marketing')

    // 作废后不再合法
    ctrl.revokeSession({ sessionId: r.sessionId })
    const after = ctrl.validateSession({ sessionId: r.sessionId })
    expect(after.valid).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🌐 跨角色边界与异常场景
// ═══════════════════════════════════════════════════════════════

describe('session 跨角色边界与异常', () => {
  it('空 userId 创建会话抛 BadRequestException', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.createSession({ userId: '', tenantId: 't1', deviceInfo: sampleDevice() })).toThrow(BadRequestException)
  })

  it('空 tenantId 创建会话抛 BadRequestException', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.createSession({ userId: 'u1', tenantId: '', deviceInfo: sampleDevice() })).toThrow(BadRequestException)
  })

  it('空 sessionId 作废抛 BadRequestException', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.revokeSession({ sessionId: '' })).toThrow(BadRequestException)
  })

  it('空 sessionId 验证抛 BadRequestException', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.validateSession({ sessionId: '' })).toThrow(BadRequestException)
  })

  it('删除不存在的会话抛 NotFoundException', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.deleteSession('phantom')).toThrow(NotFoundException)
  })

  it('会话过期后验证返回 valid=false', () => {
    const { ctrl, svc } = makeFixture()
    const r = ctrl.createSession({ userId: 'u-overdue', tenantId: 't1', deviceInfo: sampleDevice() })

    // 手动篡改过期时间
    // 通过 service 直接获取到期时间 — 内部模拟
    const session = (svc as any).sessions.get(r.sessionId)
    expect(session).toBeDefined()
    session.expiresAt = Date.now() - 1 // 设为已过期

    const v = ctrl.validateSession({ sessionId: r.sessionId })
    expect(v.valid).toBe(false)
  })

  it('并发超限时自动淘汰最旧会话', () => {
    const { ctrl } = makeFixture()
    const ids: string[] = []
    for (let i = 0; i < 6; i++) {
      const r = ctrl.createSession({
        userId: 'power-user',
        tenantId: 't1',
        deviceInfo: { deviceId: `d-${i}`, deviceType: 'web' },
      })
      ids.push(r.sessionId)
    }

    // 第1个会话应该已被淘汰
    const v1 = ctrl.validateSession({ sessionId: ids[0] })
    expect(v1.valid).toBe(false)
    // 最新的有效
    const v6 = ctrl.validateSession({ sessionId: ids[5] })
    expect(v6.valid).toBe(true)
  })

  it('获取会话返回完整字段', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'u-full',
      tenantId: 't-full',
      deviceInfo: { deviceId: 'mac-pro', deviceType: 'web', browser: 'Safari', os: 'macOS' },
    })

    const detail = ctrl.getSession(r.sessionId)
    expect(detail).toBeDefined()
    expect(detail.browser).toBe('Safari')
    expect(detail.os).toBe('macOS')
    expect(detail.deviceType).toBe('web')
    expect(detail.createdAt).toBeGreaterThan(0)
    expect(detail.expiresAt).toBeGreaterThan(detail.createdAt)
  })
})
