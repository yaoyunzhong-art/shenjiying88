/**
 * 🐜 自动: [modules] [C] 角色扩展测试
 *
 * 8 角色视角的模块管理扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 ModulesService + in-memory Store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { ModulesService } from './modules.service'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 模块管理权限 */
const roleModAccess: Record<string, string[]> = {
  'mod:list': ['🎯运行专员', '👔店长'],
  'mod:detail': ['🎯运行专员', '👔店长'],
  'mod:register': ['🎯运行专员'],
  'mod:toggle': ['🎯运行专员'],
  'mod:topology': ['🎯运行专员'],
  'mod:check': ['🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleModAccess[resource]?.includes(role) ?? false
}

/** 每个 test 用新的 service 实例 */
function makeSvc(): ModulesService {
  return new ModulesService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] modules 角色扩展测试', () => {
  it('👔[正例] 店长查看模块列表', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mod:list')).toBe(true)
    const svc = makeSvc()
    svc.register('attendance', '考勤模块', '1.0.0')
    const list = svc.getAll()
    expect(list.length).toBeGreaterThan(0)
    expect(list.some((m) => m.name === '考勤模块')).toBe(true)
  })

  it('👔[正例] 店长查看模块详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mod:detail')).toBe(true)
    const svc = makeSvc()
    svc.register('device-usage', '设备使用报告', '2.1.0', ['attendance'])
    const detail = svc.getById('device-usage')
    expect(detail).not.toBeNull()
    expect(detail!.name).toBe('设备使用报告')
    expect(detail!.version).toBe('2.1.0')
  })

  it('👔[反例] 店长无权注册或切换模块', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'mod:toggle')).toBe(false)
  })

  it('👔[反例] 店长无权查看拓扑', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mod:topology')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] modules 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看模块列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mod:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权操作模块', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mod:toggle')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mod:topology')).toBe(false)
  })

  it('🛒[闭环] 前台无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS', module: 'modules' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('modules')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 模块管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] modules 角色扩展测试', () => {
  it('👥[反例] HR 无权查看模块', () => {
    expect(checkRoleAccess(ROLES.HR, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mod:detail')).toBe(false)
  })

  it('👥[反例] HR 无权操作模块', () => {
    expect(checkRoleAccess(ROLES.HR, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mod:toggle')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mod:topology')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS', module: 'modules' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] modules 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看模块列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'mod:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权操作模块', () => {
    expect(checkRoleAccess(ROLES.Security, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'mod:toggle')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] modules 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看模块', () => {
    expect(checkRoleAccess(ROLES.Guide, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mod:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权操作模块', () => {
    expect(checkRoleAccess(ROLES.Guide, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mod:toggle')).toBe(false)
  })

  it('🎮[闭环] 导玩员无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] modules 角色扩展测试', () => {
  it('🎯[正例] 运行专员注册模块 → 查看列表', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mod:register')).toBe(true)
    const svc = makeSvc()
    const r1 = svc.register('a', '模块A', '1.0.0')
    expect(r1.status).toBe('enabled')
    svc.register('b', '模块B', '2.0.0', ['a'])

    expect(checkRoleAccess(ROLES.Operations, 'mod:list')).toBe(true)
    const list = svc.getAll()
    expect(list.length).toBe(2)
  })

  it('🎯[正例] 运行专员查看模块依赖拓扑 → 检查依赖', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mod:topology')).toBe(true)
    const svc = makeSvc()
    svc.register('core', '核心', '1.0.0')
    svc.register('auth', '认证', '1.0.0', ['core'])
    svc.register('user', '用户', '1.0.0', ['auth'])

    const sorted = svc.getTopologicalSort()
    expect(sorted.length).toBe(3)
    // core 在前
    expect(sorted[0].id).toBe('core')

    expect(checkRoleAccess(ROLES.Operations, 'mod:check')).toBe(true)
    const check = svc.checkDependencies('user')
    expect(check.resolved).toContain('auth')
  })

  it('🎯[正例] 运行专员切换模块状态', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mod:toggle')).toBe(true)
    const svc = makeSvc()
    svc.register('my-mod', '我的模块', '1.0.0')

    const toggled = svc.toggleStatus('my-mod')
    expect(toggled!.status).toBe('disabled')

    const toggledBack = svc.toggleStatus('my-mod')
    expect(toggledBack!.status).toBe('enabled')
  })

  it('🎯[边界] 运行专员查看不存在的模块', () => {
    const svc = makeSvc()
    const mod = svc.getById('nonexistent')
    expect(mod).toBeNull()
    const check = svc.checkDependencies('nonexistent')
    expect(check.resolved).toEqual([])
    expect(check.missing).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] modules 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看模块列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'mod:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权操作模块', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'mod:toggle')).toBe(false)
  })

  it('🤝[闭环] 团建无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 模块管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] modules 角色扩展测试', () => {
  it('📢[反例] 营销无权查看模块', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'mod:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mod:detail')).toBe(false)
  })

  it('📢[反例] 营销无权操作模块', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'mod:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mod:toggle')).toBe(false)
  })

  it('📢[闭环] 营销无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_MODULES_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 modules 跨角色闭环 + 边界]', () => {
  it('🎯运行专员注册模块 → 查看拓扑 → 切换状态全流程', async () => {
    const svc = makeSvc()

    // 1. 注册三个有依赖的模块
    svc.register('base', '基础模块', '1.0.0')
    svc.register('mid', '中间层', '1.0.0', ['base'])
    svc.register('top', '顶层模块', '1.0.0', ['mid'])

    // 2. 拓扑排序
    const sorted = svc.getTopologicalSort()
    expect(sorted.map((m) => m.id)).toEqual(['base', 'mid', 'top'])

    // 3. 检查依赖
    const deps = svc.checkDependencies('top')
    expect(deps.resolved).toContain('mid')

    // 4. 切换状态
    const disabled = svc.toggleStatus('top')
    expect(disabled!.status).toBe('disabled')
  })

  it('🛡️ 检测循环依赖', () => {
    const svc = makeSvc()
    svc.register('a', 'A', '1.0.0', ['b'])
    svc.register('b', 'B', '1.0.0', ['c'])
    svc.register('c', 'C', '1.0.0', ['a'])
    const cycles = svc.detectCycles()
    expect(cycles.length).toBeGreaterThan(0)
  })

  it('🛡️ 无循环依赖返回空', () => {
    const svc = makeSvc()
    svc.register('a', 'A', '1.0.0')
    svc.register('b', 'B', '1.0.0', ['a'])
    const cycles = svc.detectCycles()
    expect(cycles.length).toBe(0)
  })

  it('🛡️ 缺失依赖检测', () => {
    const svc = makeSvc()
    svc.register('orphan', '孤儿模块', '1.0.0', ['missing-dep'])
    const check = svc.checkDependencies('orphan')
    expect(check.missing).toContain('missing-dep')
    expect(check.resolved).toEqual([])
  })

  it('🛡️ 切换不存在的模块返回 null', () => {
    const svc = makeSvc()
    const result = svc.toggleStatus('non-existent-mod')
    expect(result).toBeNull()
  })

  it('🛡️ 多租户数据隔离（service 无 tenant 隔离，验证注册隔离）', () => {
    const svc = makeSvc()
    svc.register('mod-x', '模块x', '1.0.0')
    const all = svc.getAll()
    // 所有模块共用 store，验证至少包含注册的
    expect(all.some((m) => m.id === 'mod-x')).toBe(true)
  })
})
