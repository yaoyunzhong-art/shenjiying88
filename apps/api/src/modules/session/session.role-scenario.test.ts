/**
 * session.role-scenario.test.ts · 会话管理 多角色场景测试
 *
 * 覆盖 8 个角色的交叉场景：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个复合场景测试（正常流程 + 交叉边界）
 */

import { describe, it, expect } from 'vitest'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

// ── 角色常量 ──
const SM = '👔店长'
const FD = '🛒前台'
const HR = '👥HR'
const SF = '🔧安监'
const GD = '🎮导玩员'
const OP = '🎯运行专员'
const TB = '🤝团建'
const MK = '📢营销'

// ── 测试工厂 ──
function makeFixture() {
  const svc = new SessionService()
  const ctrl = new SessionController(svc)
  return { svc, ctrl }
}

function makeDeviceInfo(overrides: Record<string, unknown> = {}) {
  return {
    deviceId: 'dev-default',
    deviceType: 'web',
    browser: 'Chrome',
    os: 'macOS',
    ip: '192.168.1.1',
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店经营场景
// ═══════════════════════════════════════════════════════════════
describe(`${SM} - 门店经营场景`, () => {
  it('店长交接班：前台下班后店长需作废旧会话创建新会话', () => {
    const { ctrl } = makeFixture()
    // 前台下班前创建
    const oldSession = ctrl.createSession({
      userId: 'fd-cashier-01',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'pos-01', deviceType: 'pos' }),
    })
    // 前台自己的作废
    ctrl.revokeSession({ sessionId: oldSession.sessionId })

    // 店长坐下创建新会话
    const newSession = ctrl.createSession({
      userId: 'sm-manager-01',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'pos-01', deviceType: 'pos' }),
    })
    expect(newSession.status).toBe('active')
    expect(newSession.deviceInfo.deviceId).toBe('pos-01')

    // 前台旧会话已无效
    const validate = ctrl.validateSession({ sessionId: oldSession.sessionId })
    expect(validate.valid).toBe(false)
  })

  it('店长查看所有门店员工活跃会话数', () => {
    const { ctrl } = makeFixture()
    // 创建多个员工会话
    ctrl.createSession({ userId: 'staff-01', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'd1' }) })
    ctrl.createSession({ userId: 'staff-02', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'd2' }) })
    ctrl.createSession({ userId: 'staff-03', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'd3' }) })

    const s1 = ctrl.getUserSessions('staff-01')
    const s2 = ctrl.getUserSessions('staff-02')
    const s3 = ctrl.getUserSessions('staff-03')
    expect(s1.count).toBe(1)
    expect(s2.count).toBe(1)
    expect(s3.count).toBe(1)
  })

  it('店长在另一台设备登录不冲突：多设备管理', () => {
    const { ctrl } = makeFixture()
    // 店长在后台 PC 登录
    const pcSession = ctrl.createSession({
      userId: 'sm-boss',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'backoffice-pc', deviceType: 'web' }),
    })
    // 店长在手机端登录
    const mobileSession = ctrl.createSession({
      userId: 'sm-boss',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'boss-iphone', deviceType: 'mobile', os: 'iOS' }),
    })

    const sessions = ctrl.getUserSessions('sm-boss')
    expect(sessions.count).toBe(2)
    expect(sessions.sessions.map((s: any) => s.deviceType).sort()).toEqual(['mobile', 'web'])
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 收银与顾客接待场景
// ═══════════════════════════════════════════════════════════════
describe(`${FD} - 收银接待场景`, () => {
  it('前台换班：交班时前台主动作废自己的收银会话', () => {
    const { ctrl } = makeFixture()
    const session = ctrl.createSession({
      userId: 'cashier-morning',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'pos-terminal-a', deviceType: 'pos' }),
    })
    // 交班
    const revoke = ctrl.revokeSession({ sessionId: session.sessionId })
    expect(revoke.success).toBe(true)

    // 接班前台创建新会话
    const nextSession = ctrl.createSession({
      userId: 'cashier-afternoon',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'pos-terminal-a', deviceType: 'pos' }),
    })
    expect(nextSession.status).toBe('active')
  })

  it('前台验证顾客会员卡绑定会话的合法性', () => {
    const { ctrl } = makeFixture()
    // 顾客触发会员绑定会创建临时会话
    const memberSession = ctrl.createSession({
      userId: 'member-vip-01',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'member-card-reader', deviceType: 'pos' }),
    })
    // 前台查验证会话有效
    const v = ctrl.validateSession({ sessionId: memberSession.sessionId })
    expect(v.valid).toBe(true)
    expect(v.userId).toBe('member-vip-01')
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 员工管理场景
// ═══════════════════════════════════════════════════════════════
describe(`${HR} - 员工管理场景`, () => {
  it('HR 查询某门店夜班员工所有活跃会话', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'emp-night-01', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'guard-pc' }) })
    ctrl.createSession({ userId: 'emp-night-02', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'cleaner-phone', deviceType: 'mobile' }) })

    const s1 = ctrl.getUserSessions('emp-night-01')
    const s2 = ctrl.getUserSessions('emp-night-02')
    expect(s1.count).toBe(1)
    expect(s2.count).toBe(1)
  })

  it('HR 作废离职员工全部会话后，无法再查询到该员工作废记录的边界', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'ex-employee', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'laptop-offboard' }) })
    ctrl.createSession({ userId: 'ex-employee', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'phone-offboard', deviceType: 'mobile' }) })

    const r = ctrl.revokeAllUserSessions({ userId: 'ex-employee' })
    expect(r.revokedCount).toBe(2)

    // 作废后再次查询
    const remaining = ctrl.getUserSessions('ex-employee')
    expect(remaining.count).toBe(0)
  })

  it('HR 批量操作后查询另一个不相关的员工，其会话不受影响', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'layer-off', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'd1' }) })
    ctrl.createSession({ userId: 'active-staff', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'd2' }) })

    ctrl.revokeAllUserSessions({ userId: 'layer-off' })
    const active = ctrl.getUserSessions('active-staff')
    expect(active.count).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安全管控场景
// ═══════════════════════════════════════════════════════════════
describe(`${SF} - 安全管控场景`, () => {
  it('安监检测到异地登录：作废旧设备会话', () => {
    const { ctrl } = makeFixture()
    // 用户在办公 PC 登录
    const pcSession = ctrl.createSession({
      userId: 'user-sa-001',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'office-pc', ip: '192.168.1.10' }),
    })
    // 检测到异地 IP 登录，安监作废旧会话
    ctrl.revokeSession({ sessionId: pcSession.sessionId })
    // 创建新 IP 会话
    const newSession = ctrl.createSession({
      userId: 'user-sa-001',
      tenantId: 'store-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'unknown-pc', ip: '203.0.113.50' }),
    })
    expect(newSession.status).toBe('active')

    // 旧会话已无效
    const v = ctrl.validateSession({ sessionId: pcSession.sessionId })
    expect(v.valid).toBe(false)
  })

  it('安监批量检查：同一用户不应超过 5 个活跃会话', () => {
    const { ctrl, svc } = makeFixture()
    // 创建 6 个会话
    const sessions = []
    for (let i = 0; i < 6; i++) {
      sessions.push(ctrl.createSession({
        userId: 'heavy-user',
        tenantId: 'store-001',
        deviceInfo: makeDeviceInfo({ deviceId: `device-${i}` }),
      }))
    }
    // 服务层限制最多 5 个（实现可能不同，但至少可以创建成功）
    expect(sessions.length).toBe(6)
    // 安监检查当前活跃数
    const count = svc.getUserSessionCount('heavy-user')
    expect(count).toBeGreaterThanOrEqual(0)
    expect(count).toBeLessThanOrEqual(5)
  })

  it('安监作废不存在的会话返回 404', () => {
    const { ctrl } = makeFixture()
    expect(() => ctrl.revokeSession({ sessionId: 'phantom-phantom' })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 机台管理场景
// ═══════════════════════════════════════════════════════════════
describe(`${GD} - 机台管理场景`, () => {
  it('导玩员为多台游戏机绑定独立设备会话', () => {
    const { ctrl } = makeFixture()
    const cabinets = ['cab-01', 'cab-02', 'cab-03']
    const sessions = cabinets.map((cab) =>
      ctrl.createSession({
        userId: `guide-arcade`,
        tenantId: 'arcade-001',
        deviceInfo: makeDeviceInfo({ deviceId: cab, deviceType: 'arcade' }),
      }),
    )
    expect(sessions.length).toBe(3)
    sessions.forEach((s) => expect(s.status).toBe('active'))
    const ids = new Set(sessions.map((s) => s.sessionId))
    expect(ids.size).toBe(3)
  })

  it('导玩员通过 DELETE 删除已完成机台绑定会话', () => {
    const { ctrl } = makeFixture()
    const s = ctrl.createSession({
      userId: 'guide-shift-end',
      tenantId: 'arcade-001',
      deviceInfo: makeDeviceInfo({ deviceId: 'cab-99', deviceType: 'arcade' }),
    })
    const r = ctrl.deleteSession(s.sessionId)
    expect(r.success).toBe(true)
    expect(r.message).toBe('Session deleted')

    // 删除后无法获取
    expect(() => ctrl.getSession(s.sessionId)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 运维管理场景
// ═══════════════════════════════════════════════════════════════
describe(`${OP} - 运维管理场景`, () => {
  it('运行专员在系统升级时作废所有后台管理会话', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'ops-adm-01', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'ops-pc' }) })
    ctrl.createSession({ userId: 'ops-adm-02', tenantId: 'store-001', deviceInfo: makeDeviceInfo({ deviceId: 'ops-laptop' }) })

    // 运维批量作废
    const r1 = ctrl.revokeAllUserSessions({ userId: 'ops-adm-01' })
    const r2 = ctrl.revokeAllUserSessions({ userId: 'ops-adm-02' })
    expect(r1.revokedCount).toBe(1)
    expect(r2.revokedCount).toBe(1)
  })

  it('运行专员查看跨门店会话分布', () => {
    const { ctrl } = makeFixture()
    ctrl.createSession({ userId: 'u1', tenantId: 'store-a', deviceInfo: makeDeviceInfo({ deviceId: 'd1' }) })
    ctrl.createSession({ userId: 'u2', tenantId: 'store-b', deviceInfo: makeDeviceInfo({ deviceId: 'd2' }) })
    ctrl.createSession({ userId: 'u3', tenantId: 'store-c', deviceInfo: makeDeviceInfo({ deviceId: 'd3' }) })
    ctrl.createSession({ userId: 'u1', tenantId: 'store-a', deviceInfo: makeDeviceInfo({ deviceId: 'd4' }) })

    const u1 = ctrl.getUserSessions('u1').count
    const u2 = ctrl.getUserSessions('u2').count
    const u3 = ctrl.getUserSessions('u3').count
    expect(u1).toBe(2)
    expect(u2).toBe(1)
    expect(u3).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团队活动场景
// ═══════════════════════════════════════════════════════════════
describe(`${TB} - 团队活动场景`, () => {
  it('团建组织者创建活动后成员各自建立会话', () => {
    const { ctrl } = makeFixture()
    // 组织者创建
    ctrl.createSession({ userId: 'tb-organizer', tenantId: 'teambuild-01', deviceInfo: makeDeviceInfo({ deviceId: 'org-pc' }) })

    // 成员加入
    const members = ['member-alice', 'member-bob', 'member-charlie']
    members.forEach((m) => {
      ctrl.createSession({ userId: m, tenantId: 'teambuild-01', deviceInfo: makeDeviceInfo({ deviceId: `phone-${m}` }) })
    })

    const org = ctrl.getUserSessions('tb-organizer')
    expect(org.count).toBe(1)

    members.forEach((m) => {
      const u = ctrl.getUserSessions(m)
      expect(u.count).toBe(1)
    })
  })

  it('团建活动结束后作废所有参与者的会话', () => {
    const { ctrl } = makeFixture()
    const users = ['player-a', 'player-b', 'player-c', 'player-d']
    users.forEach((u) => {
      ctrl.createSession({ userId: u, tenantId: 'event-spring', deviceInfo: makeDeviceInfo({ deviceId: `d-${u}` }) })
    })

    users.forEach((u) => {
      const r = ctrl.revokeAllUserSessions({ userId: u })
      expect(r.success).toBe(true)
      expect(r.revokedCount).toBe(1)
    })

    // 全部作废后查询
    users.forEach((u) => {
      expect(ctrl.getUserSessions(u).count).toBe(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 营销活动场景
// ═══════════════════════════════════════════════════════════════
describe(`${MK} - 营销活动场景`, () => {
  it('营销员为线下活动创建临时设备会话', () => {
    const { ctrl } = makeFixture()
    const terminals = ['event-qr-scanner', 'event-self-service', 'event-lucky-draw']
    terminals.forEach((t) => {
      ctrl.createSession({
        userId: 'mkt-activity-host',
        tenantId: 'mkt-summer-2026',
        deviceInfo: makeDeviceInfo({ deviceId: t, deviceType: 'kiosk' }),
      })
    })

    const sessions = ctrl.getUserSessions('mkt-activity-host')
    expect(sessions.count).toBe(3)
    sessions.sessions.forEach((s: any) => expect(s.deviceType).toBe('kiosk'))
  })

  it('营销活动结束后批量清除所有临时设备会话', () => {
    const { ctrl } = makeFixture()
    // 创建活动相关会话
    ctrl.createSession({ userId: 'mkt-campaign-a', tenantId: 'campaign-promo', deviceInfo: makeDeviceInfo({ deviceId: 'kiosk-1', deviceType: 'kiosk' }) })
    ctrl.createSession({ userId: 'mkt-campaign-b', tenantId: 'campaign-promo', deviceInfo: makeDeviceInfo({ deviceId: 'kiosk-2', deviceType: 'kiosk' }) })
    ctrl.createSession({ userId: 'mkt-campaign-c', tenantId: 'campaign-promo', deviceInfo: makeDeviceInfo({ deviceId: 'kiosk-3', deviceType: 'kiosk' }) })

    // 活动结束，逐批清除
    const ids = ['mkt-campaign-a', 'mkt-campaign-b', 'mkt-campaign-c']
    let totalRevoked = 0
    ids.forEach((id) => {
      const r = ctrl.revokeAllUserSessions({ userId: id })
      totalRevoked += r.revokedCount
    })
    expect(totalRevoked).toBe(3)

    // 全部清除
    ids.forEach((id) => {
      expect(ctrl.getUserSessions(id).count).toBe(0)
    })
  })
})
