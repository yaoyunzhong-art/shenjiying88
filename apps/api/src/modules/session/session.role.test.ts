/**
 * session.role.test.ts · 会话管理 8 角色视角测试
 *
 * 8 角色视角：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 2 个测试用例（正常流程 + 权限边界）
 */

import { describe, it, expect } from 'vitest'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

// ── 测试工厂 ──
function makeFixture() {
  const svc = new SessionService()
  const ctrl = new SessionController(svc)
  return { svc, ctrl }
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店管理视角
// ═══════════════════════════════════════════════════════════════
describe('👔店长 session 角色测试', () => {
  it('店长创建门店管理后台会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'store-manager-01',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'mgr-pc-01', deviceType: 'web', browser: 'Chrome', os: 'macOS' },
    })
    expect(r.sessionId).toBeTruthy()
    expect(r.status).toBe('active')
    expect(r.tenantId).toBe('store-001')
  })

  it('店长查看指定设备活跃会话（权限边界）', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'mgr-a', tenantId: 'store-001', deviceInfo: { deviceId: 'd1', deviceType: 'web' } })

    // 查看存在的用户
    const sessions = ctrl.getUserSessions('mgr-a')
    expect(sessions.count).toBe(1)

    // 查看不存在的用户应返回空列表（边界）
    const empty = ctrl.getUserSessions('ghost-user')
    expect(empty.count).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 前台收银视角
// ═══════════════════════════════════════════════════════════════
describe('🛒前台 session 角色测试', () => {
  it('前台为收银设备创建会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'cashier-01',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'pos-terminal-01', deviceType: 'pos' },
    })
    expect(r.status).toBe('active')
    expect(r.deviceInfo.deviceType).toBe('pos')
  })

  it('前台创建会话后验证其有效性（权限边界）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'cashier-02',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'pos-02', deviceType: 'pos' },
    })

    // 验证有效
    const v1 = ctrl.validateSession({ sessionId: r.sessionId })
    expect(v1.valid).toBe(true)

    // 作废后再验证
    ctrl.revokeSession({ sessionId: r.sessionId })
    const v2 = ctrl.validateSession({ sessionId: r.sessionId })
    expect(v2.valid).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 人力资源视角
// ═══════════════════════════════════════════════════════════════
describe('👥HR session 角色测试', () => {
  it('HR 查询员工活跃会话数（正常流程）', () => {
    const { svc } = makeFixture()
    const ctrl = new SessionController(svc)
    ctrl.createSession({ userId: 'emp-01', tenantId: 'store-001', deviceInfo: { deviceId: 'pc-01', deviceType: 'web' } })
    ctrl.createSession({ userId: 'emp-01', tenantId: 'store-001', deviceInfo: { deviceId: 'phone-01', deviceType: 'mobile' } })

    const count = svc.getUserSessionCount('emp-01')
    expect(count).toBe(2)
  })

  it('HR 作废离职员工所有会话（权限边界）', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'ex-emp', tenantId: 'store-001', deviceInfo: { deviceId: 'laptop', deviceType: 'web' } })
    ctrl.createSession({ userId: 'ex-emp', tenantId: 'store-001', deviceInfo: { deviceId: 'mobile', deviceType: 'mobile' } })

    const r = ctrl.revokeAllUserSessions({ userId: 'ex-emp' })
    expect(r.revokedCount).toBe(2)
    expect(r.success).toBe(true)

    // 作废后应全部清空
    const remaining = ctrl.getUserSessions('ex-emp')
    expect(remaining.count).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安防监控视角
// ═══════════════════════════════════════════════════════════════
describe('🔧安监 session 角色测试', () => {
  it('安监检测到异常设备后作废会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'unknown-user',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'suspicious-device', deviceType: 'unknown' },
    })

    // 检查会话存在
    const session = ctrl.getSession(r.sessionId)
    expect(session.status).toBe('active')

    // 安监手动作废
    const revoke = ctrl.revokeSession({ sessionId: r.sessionId })
    expect(revoke.success).toBe(true)
  })

  it('安监作废不存在的会话应抛异常（权限边界）', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.revokeSession({ sessionId: 'phantom-session-999' })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 导玩员视角，管理游戏机台绑定会话
// ═══════════════════════════════════════════════════════════════
describe('🎮导玩员 session 角色测试', () => {
  it('导玩员绑定游戏机台创建设备会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'player-guide-01',
      tenantId: 'arcade-001',
      deviceInfo: { deviceId: 'cabinet-08', deviceType: 'arcade' },
    })
    expect(r.status).toBe('active')
    expect(r.deviceInfo.deviceType).toBe('arcade')
  })

  it('导玩员通过 DELETE 删除不存在的会话应 404（权限边界）', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.deleteSession('phantom-session')).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 运维视角
// ═══════════════════════════════════════════════════════════════
describe('🎯运行专员 session 角色测试', () => {
  it('运行专员查看系统活跃会话总数（正常流程）', () => {
    const { svc } = makeFixture()
    const ctrl = new SessionController(svc)
    ctrl.createSession({ userId: 'u1', tenantId: 't1', deviceInfo: { deviceId: 'd1', deviceType: 'web' } })
    ctrl.createSession({ userId: 'u2', tenantId: 't2', deviceInfo: { deviceId: 'd2', deviceType: 'mobile' } })

    const stats = ctrl.getWSConnections ? ctrl.getWSConnections() : null
    // session 统计数据通过 service 查询
    const u1 = svc.getUserSessions('u1').length
    const u2 = svc.getUserSessions('u2').length
    expect(u1).toBe(1)
    expect(u2).toBe(1)
  })

  it('运行专员批量作废不存在的用户返回 success（边界）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.revokeAllUserSessions({ userId: 'ghost-user' })
    expect(r.success).toBe(true)
    expect(r.revokedCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团建组织者视角
// ═══════════════════════════════════════════════════════════════
describe('🤝团建 session 角色测试', () => {
  it('团建组织者为每位成员创建独立会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const members = ['member-a', 'member-b', 'member-c']
    const sessions = members.map((m) =>
      ctrl.createSession({
        userId: m,
        tenantId: 'teambuilding-01',
        deviceInfo: { deviceId: `device-${m}`, deviceType: 'mobile' },
      }),
    )
    expect(sessions.length).toBe(3)
    sessions.forEach((s) => expect(s.status).toBe('active'))

    // 所有 sessionId 唯一
    const ids = new Set(sessions.map((s) => s.sessionId))
    expect(ids.size).toBe(3)
  })

  it('团建结束统一作废所有会话（权限边界）', () => {
    const { ctrl } = makeFixture()
    const members = ['member-x', 'member-y']
    members.forEach((m) =>
      ctrl.createSession({ userId: m, tenantId: 'tb-event', deviceInfo: { deviceId: `d-${m}`, deviceType: 'mobile' } }),
    )

    members.forEach((m) => {
      const r = ctrl.revokeAllUserSessions({ userId: m })
      expect(r.success).toBe(true)
      expect(r.revokedCount).toBe(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 营销视角
// ═══════════════════════════════════════════════════════════════
describe('📢营销 session 角色测试', () => {
  it('营销员为推广活动创建观众会话（正常流程）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'campaign-viewer-001',
      tenantId: 'mkt-campaign-spring',
      deviceInfo: { deviceId: 'mini-prog', deviceType: 'weapp' },
    })
    expect(r.status).toBe('active')
    expect(r.tenantId).toBe('mkt-campaign-spring')
  })

  it('营销导出数据前验证会话合法性（权限边界）', () => {
    const { ctrl } = makeFixture()
    const r = ctrl.createSession({
      userId: 'mkt-manager',
      tenantId: 'store-001',
      deviceInfo: { deviceId: 'mkt-pc', deviceType: 'web' },
    })

    // 创建后有效
    const v1 = ctrl.validateSession({ sessionId: r.sessionId })
    expect(v1.valid).toBe(true)

    // 删除后无效
    ctrl.deleteSession(r.sessionId)
    const v2 = ctrl.validateSession({ sessionId: r.sessionId })
    expect(v2.valid).toBe(false)
  })
})
