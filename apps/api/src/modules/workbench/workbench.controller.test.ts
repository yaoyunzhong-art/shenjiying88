/**
 * 🐜 自动: [workbench] [C] 角色测试编写
 * 
 * 完整工作台 controller 测试（正例 + 反例 + 边界 + 8 角色视角 + 权限边界）
 * 
 * 8 角色:
 * 👔店长(STORE_MANAGER) 🛒前台(CASHIER) 👥HR(TENANT_ADMIN) 🔧安监(SECURITY_ADMIN/SUPER_ADMIN)
 * 🎮导玩员(GUIDE) 🎯运行专员(OPERATIONS) 🤝团建(TEAM_BUILDING 无映射) 📢营销(MARKETING 无映射)
 * 
 * 覆盖:
 * - 角色 → 端点装饰器元数据验证 (@RequireRoles)
 * - 角色能力权限边界 (谁有/没有特定能力)
 * - 角色渠道分配 (PC vs PAD)
 * - read 端点和 action 端点的角色划分
 * - secret-rotation 角色限制 (SUPER_ADMIN + SECURITY_ADMIN)
 * 
 * 注意: channel 使用 ClientChannel 枚举值: PC, PAD (全大写)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { WorkbenchController } from './workbench.controller'
import { WorkbenchService } from './workbench.service'

// ── Mock 依赖构造: 只需要 service 层 ──
function createService(): WorkbenchService {
  // getRoleWorkbenches 使用原型上纯方法，不需要 mock 外部依赖
  // getBootstrap 需要完整依赖链，此处跳过
  return new WorkbenchService(null as never, null as never, null as never, null as never)
}

function createController() {
  const service = createService()
  return new WorkbenchController(service)
}

// ── 角色常量 ──
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

// ══════════════════════════════════════════════════
// 1. 路径 / 方法元数据
// ══════════════════════════════════════════════════

describe('workbench controller metadata', () => {
  const expectedRoles = [
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'BRAND_MANAGER',
    'STORE_MANAGER',
    'GUIDE',
    'CASHIER',
    'OPERATIONS',
    'SECURITY_ADMIN',
  ]

  test('controller path is "workbenches"', () => {
    const path = Reflect.getMetadata('path', WorkbenchController)
    assert.equal(path, 'workbenches')
  })

  test('getBootstrap route: GET /workbenches/bootstrap', () => {
    const method = Reflect.getMetadata('method', WorkbenchController.prototype.getBootstrap)
    const path = Reflect.getMetadata('path', WorkbenchController.prototype.getBootstrap)
    assert.equal(method, 0) // GET
    assert.equal(path, 'bootstrap')
  })

  test('getWorkbenches route: GET /workbenches', () => {
    const method = Reflect.getMetadata('method', WorkbenchController.prototype.getWorkbenches)
    const path = Reflect.getMetadata('path', WorkbenchController.prototype.getWorkbenches)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  test('getNavItems route: GET /workbenches/nav-items', () => {
    const method = Reflect.getMetadata('method', WorkbenchController.prototype.getNavItems)
    const path = Reflect.getMetadata('path', WorkbenchController.prototype.getNavItems)
    assert.equal(method, 0) // GET
    assert.equal(path, 'nav-items')
  })

  test('checkCapability route: GET /workbenches/capability-check', () => {
    const method = Reflect.getMetadata('method', WorkbenchController.prototype.checkCapability)
    const path = Reflect.getMetadata('path', WorkbenchController.prototype.checkCapability)
    assert.equal(method, 0) // GET
    assert.equal(path, 'capability-check')
  })

  test('all read endpoints require tenant scope, workbench roles and workbench.read permission', () => {
    const protectedHandlers = [
      WorkbenchController.prototype.getBootstrap,
      WorkbenchController.prototype.getWorkbenches,
      WorkbenchController.prototype.getNavItems,
      WorkbenchController.prototype.checkCapability,
    ]

    protectedHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), expectedRoles)
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['workbench.read'])
    })
  })
})

// ══════════════════════════════════════════════════
// 2. getWorkbenches 测试
// ══════════════════════════════════════════════════

describe('getWorkbenches', () => {
  test('[正例] 无参数返回全部 10 个工作台', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({})
    assert.ok(Array.isArray(result.workbenches))
    assert.equal(result.total, 10)
    assert.equal(result.workbenches.length, 10)
  })

  test('[正例] 按角色筛选 STORE_MANAGER', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ role: 'STORE_MANAGER' })
    assert.equal(result.total, 1)
    assert.equal(result.workbenches[0].title, '店长经营台')
  })

  test('[正例] 按渠道筛选 PAD（收银台 + 导购工作台 + 教练）', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ channel: 'PAD' })
    assert.equal(result.total, 3)
    result.workbenches.forEach((w: any) => {
      assert.equal(w.channel, 'PAD')
    })
  })

  test('[正例] 按渠道筛选 PC', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ channel: 'PC' })
    // SUPER_ADMIN / TENANT_ADMIN / BRAND_MANAGER / STORE_MANAGER +
    // OPERATIONS / FINANCE / WAREHOUSE = 7
    assert.equal(result.total, 7)
    result.workbenches.forEach((w: any) => {
      assert.equal(w.channel, 'PC')
    })
  })

  test('[反例] 不存在的角色返回空', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ role: 'NON_EXISTENT' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.workbenches, [])
  })

  test('[反例] 不存在的渠道返回空', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ channel: 'VR_HEADSET' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.workbenches, [])
  })

  test('[反例] initialized=false 返回空数组（模拟未初始化）', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ initialized: false })
    assert.equal(result.total, 0)
    assert.deepEqual(result.workbenches, [])
  })

  test('[边界] initialized=true 返回全量', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ initialized: true })
    assert.equal(result.total, 10)
  })

  test('[边界] 同时筛选 role=GUIDE + channel=PAD', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ role: 'GUIDE', channel: 'PAD' })
    assert.equal(result.total, 1)
    assert.equal(result.workbenches[0].title, '导购工作台')
  })

  test('[边界] role + channel 冲突时返回空（STORE_MANAGER 用 PC，查 PAD）', () => {
    const controller = createController()
    const result: any = controller.getWorkbenches({ role: 'STORE_MANAGER', channel: 'PAD' })
    assert.equal(result.total, 0)
  })

  test('[边界] 每个角色筛选结果都有完整字段', () => {
    const controller = createController()
    const allRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER', 'GUIDE', 'CASHIER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH']
    allRoles.forEach(role => {
      const result: any = controller.getWorkbenches({ role })
      assert.equal(result.total, 1, `role ${role} should have exactly 1 workbench`)
      const wb = result.workbenches[0]
      assert.equal(wb.role, role)
      assert.ok(wb.title, `role ${role} should have title`)
      assert.ok(wb.description, `role ${role} should have description`)
      assert.ok(wb.channel, `role ${role} should have channel`)
      assert.ok(Array.isArray(wb.navItems), `role ${role} should have navItems array`)
      assert.ok(wb.navItems.length >= 2, `role ${role} should have >= 2 nav items`)
    })
  })

  test('[边界] undefined role 不影响结果', () => {
    const controller = createController()
    // 传入 role 为 undefined 的 query，不过滤
    const result: any = controller.getWorkbenches({ role: undefined as any })
    assert.equal(result.total, 10)
  })
})

// ══════════════════════════════════════════════════
// 3. getNavItems 测试
// ══════════════════════════════════════════════════

describe('getNavItems', () => {
  test('[正例] 无参数返回全部导航项（含 role/channel/marketCodes 元数据）', () => {
    const controller = createController()
    const result: any = controller.getNavItems({})
    assert.ok(Array.isArray(result.navItems))
    // 6 个工作台，每个有 2-5 个 navItems，总计 > 10
    assert.ok(result.total > 10)
    result.navItems.forEach((item: any) => {
      assert.ok(item.key, 'every navItem should have key')
      assert.ok(item.label, 'every navItem should have label')
      assert.ok(item.href, 'every navItem should have href')
      assert.ok(item.description, 'every navItem should have description')
      assert.ok(item.role, 'every navItem should have role')
      assert.ok(item.channel, 'every navItem should have channel')
      assert.ok(Array.isArray(item.marketCodes), 'every navItem should have marketCodes array')
    })
  })

  test('[正例] 按角色筛选 STORE_MANAGER', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ role: 'STORE_MANAGER' })
    assert.ok(result.total > 0)
    result.navItems.forEach((item: any) => {
      assert.equal(item.role, 'STORE_MANAGER')
    })
  })

  test('[正例] 按渠道筛选 PAD', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ channel: 'PAD' })
    assert.ok(result.total > 0)
    result.navItems.forEach((item: any) => {
      assert.equal(item.channel, 'PAD')
    })
  })

  test('[正例] 按市场筛选 cn-mainland', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ marketCode: 'cn-mainland' })
    assert.ok(result.total > 0)
    result.navItems.forEach((item: any) => {
      assert.ok(item.marketCodes.includes('cn-mainland'))
    })
  })

  test('[正例] 按市场筛选 us-default', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ marketCode: 'us-default' })
    assert.ok(result.total > 0)
    result.navItems.forEach((item: any) => {
      assert.ok(item.marketCodes.includes('us-default'))
    })
  })

  test('[正例] 按能力筛选 promo-conversion 返回所有具备该能力的角色导航项', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ capability: 'promo-conversion' })
    // GUIDE (2 navItems) + COACH (4 navItems) = 6
    assert.equal(result.total, 6)
    const guideNav = result.navItems.filter((n: any) => n.role === 'GUIDE')
    assert.equal(guideNav.length, 2)
    const coachNav = result.navItems.filter((n: any) => n.role === 'COACH')
    assert.equal(coachNav.length, 4)
  })

  test('[反例] 不存在角色返回空', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ role: 'GHOST_ROLE' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.navItems, [])
  })

  test('[反例] 不存在市场代码返回空', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ marketCode: 'mars-colony' })
    assert.equal(result.total, 0)
  })

  test('[反例] 不存在能力返回空', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ capability: 'time-travel' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.navItems, [])
  })

  test('[边界] role=GUIDE + channel=PAD + marketCode=cn-mainland 联合筛选', () => {
    const controller = createController()
    const result: any = controller.getNavItems({
      role: 'GUIDE',
      channel: 'PAD',
      marketCode: 'cn-mainland'
    })
    assert.ok(result.total > 0)
    result.navItems.forEach((item: any) => {
      assert.equal(item.role, 'GUIDE')
      assert.equal(item.channel, 'PAD')
      assert.ok(item.marketCodes.includes('cn-mainland'))
    })
  })

  test('[边界] role=GUIDE + channel=PC 返回空（GUIDE 只用 PAD）', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ role: 'GUIDE', channel: 'PC' })
    assert.equal(result.total, 0)
  })

  test('[边界] 每个角色的导航项数量合理', () => {
    const controller = createController()
    const roleCounts: Record<string, number> = {}
    const all: any = controller.getNavItems({})
    all.navItems.forEach((item: any) => {
      roleCounts[item.role] = (roleCounts[item.role] || 0) + 1
    })
    // 每个角色至少有 2 个导航项
    Object.entries(roleCounts).forEach(([role, count]: [string, number]) => {
      assert.ok(count >= 2, `${role} expected >=2 nav items, got ${count}`)
    })
  })

  test('[边界] undefined 参数不过滤', () => {
    const controller = createController()
    const result: any = controller.getNavItems({ role: undefined as any, channel: undefined as any })
    assert.ok(result.total > 10)
  })
})

// ══════════════════════════════════════════════════
// 4. checkCapability 测试（角色能力检查）
// ══════════════════════════════════════════════════

describe('checkCapability', () => {
  test('[正例] SUPER_ADMIN 拥有 tenant-management', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'SUPER_ADMIN',
      capability: 'tenant-management'
    })
    assert.equal(result.role, 'SUPER_ADMIN')
    assert.equal(result.capability, 'tenant-management')
    assert.equal(result.has, true)
  })

  test('[正例] STORE_MANAGER 拥有 daily-report', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'STORE_MANAGER',
      capability: 'daily-report'
    })
    assert.equal(result.has, true)
  })

  test('[正例] CASHIER 拥有 checkout-nuclear', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'CASHIER',
      capability: 'checkout-nuclear'
    })
    assert.equal(result.has, true)
  })

  test('[反例] GUIDE 不拥有 tenant-management', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'GUIDE',
      capability: 'tenant-management'
    })
    assert.equal(result.has, false)
  })

  test('[反例] 不存在角色返回 false', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'UNKNOWN_ROLE',
      capability: 'tenant-management'
    })
    assert.equal(result.has, false)
  })

  test('[反例] 不存在能力返回 false', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'SUPER_ADMIN',
      capability: 'time-travel'
    })
    assert.equal(result.has, false)
  })

  test('[边界] 大小写必须严格匹配（小写角色返回 false）', () => {
    const controller = createController()
    const result1: any = controller.checkCapability({
      role: 'super_admin',
      capability: 'tenant-management'
    })
    assert.equal(result1.has, false)

    const result2: any = controller.checkCapability({
      role: 'SUPER_ADMIN',
      capability: 'tenant-management'
    })
    assert.equal(result2.has, true)
  })

  test('[边界] BRAND_MANAGER 拥有 3 个能力', () => {
    const controller = createController()
    const caps = ['member-crm', 'campaign-execution', 'regional-config']
    caps.forEach(cap => {
      const result: any = controller.checkCapability({ role: 'BRAND_MANAGER', capability: cap })
      assert.equal(result.has, true, `BRAND_MANAGER should have ${cap}`)
    })
  })

  test('[边界] SUPERA_ADMIN 拥有 3 个能力', () => {
    const controller = createController()
    const caps = ['tenant-management', 'audit-center', 'market-governance']
    caps.forEach(cap => {
      const result: any = controller.checkCapability({ role: 'SUPER_ADMIN', capability: cap })
      assert.equal(result.has, true, `SUPER_ADMIN should have ${cap}`)
    })
  })

  test('[正例] TENANT_ADMIN 拥有品牌矩阵', () => {
    const controller = createController()
    const result: any = controller.checkCapability({
      role: 'TENANT_ADMIN',
      capability: 'brand-matrix'
    })
    assert.equal(result.has, true)
  })
})

// ══════════════════════════════════════════════════
// 5. @RequireRoles 装饰器：端点角色权限矩阵验证
// ══════════════════════════════════════════════════

describe('@RequireRoles 装饰器：端点角色权限矩阵', () => {
  const READ_ROLES_EXPECTED = [
    'SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER',
    'GUIDE', 'CASHIER', 'OPERATIONS', 'SECURITY_ADMIN'
  ]
  const ACTION_ROLES_EXPECTED = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
  const SECRET_ROTATION_ROLES_EXPECTED = ['SUPER_ADMIN', 'SECURITY_ADMIN']

  // read 端点角色检查
  const readHandlers: Array<{ name: string; handler: Function }> = [
    { name: 'getBootstrap', handler: WorkbenchController.prototype.getBootstrap },
    { name: 'getWorkbenches', handler: WorkbenchController.prototype.getWorkbenches },
    { name: 'getNavItems', handler: WorkbenchController.prototype.getNavItems },
    { name: 'checkCapability', handler: WorkbenchController.prototype.checkCapability },
  ]

  readHandlers.forEach(({ name, handler }) => {
    test(`read 端点 ${name} @RequireRoles 包含 8 角色`, () => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler)
      assert.deepEqual(roles, READ_ROLES_EXPECTED)
    })
  })

  // action 端点角色检查
  const actionHandlers: Array<{ name: string; handler: Function }> = [
    { name: 'executeApproval', handler: WorkbenchController.prototype.executeApproval },
    { name: 'submitRuntimeReplay', handler: WorkbenchController.prototype.submitRuntimeReplay },
    { name: 'getActionReceipt', handler: WorkbenchController.prototype.getActionReceipt },
    { name: 'syncHandlerReceipt', handler: WorkbenchController.prototype.syncHandlerReceipt },
    { name: 'recordHandlerCallback', handler: WorkbenchController.prototype.recordHandlerCallback },
    { name: 'replayActionReceipt', handler: WorkbenchController.prototype.replayActionReceipt },
  ]

  actionHandlers.forEach(({ name, handler }) => {
    test(`action 端点 ${name} @RequireRoles 仅限 4 管理员角色`, () => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler)
      assert.deepEqual(roles, ACTION_ROLES_EXPECTED)
    })
  })

  // secret-rotation 端点角色检查
  test('secret-rotation 端点 @RequireRoles 仅限 SUPER_ADMIN + SECURITY_ADMIN', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret)
    assert.deepEqual(roles, SECRET_ROTATION_ROLES_EXPECTED)
  })
})

// ══════════════════════════════════════════════════
// 6. 8 角色视角：工作台访问 + 能力权限 + 渠道分配
// ══════════════════════════════════════════════════

describe('8 角色视角', () => {
  /**
   * 角色语义映射:
   * - 👔店长    → STORE_MANAGER   (PC, 店长经营台)
   * - 🛒前台    → CASHIER         (PAD, 收银台)
   * - 👥HR     → TENANT_ADMIN     (PC, 租户经营台)
   * - 🔧安监    → SECURITY_ADMIN  / SUPER_ADMIN  (PC, 安全中心/总部总控台)
   * - 🎮导玩员  → GUIDE           (PAD, 导购工作台)
   * - 🎯运行专员 → OPERATIONS      (PC, 运行中心)
   * - 🤝团建    → TEAM_BUILDING    (不在 WORKBENCH_READ_ROLES 中 → 无权限)
   * - 📢营销    → MARKETING        (不在 WORKBENCH_READ_ROLES 中 → 无权限)
   */
  const roleToDomainRole: Record<string, string> = {
    '👔店长': 'STORE_MANAGER',
    '🛒前台': 'CASHIER',
    '👥HR': 'TENANT_ADMIN',
    '🔧安监': 'SUPER_ADMIN',
    '🎮导玩员': 'GUIDE',
    '🎯运行专员': 'OPERATIONS',
    '🤝团建': 'TEAM_BUILDING',
    '📢营销': 'MARKETING',
  }

  const controller = createController()

  // ── 👔 店长 ──
  test('👔店长: 可见店长经营台 (PC 渠道)', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['👔店长'] })
    assert.equal(r.total, 1)
    assert.equal(r.workbenches[0].title, '店长经营台')
    assert.equal(r.workbenches[0].channel, 'PC')
    assert.equal(r.workbenches[0].role, 'STORE_MANAGER')
  })
  test('👔店长: 拥有 daily-report 和 field-scheduling 能力', () => {
    assert.equal(
      controller.checkCapability({ role: 'STORE_MANAGER', capability: 'daily-report' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'STORE_MANAGER', capability: 'field-scheduling' }).has,
      true
    )
  })
  test('👔店长: 不拥有 audit-center (权限边界)', () => {
    assert.equal(
      controller.checkCapability({ role: 'STORE_MANAGER', capability: 'audit-center' }).has,
      false
    )
  })

  // ── 🛒 前台 ──
  test('🛒前台: 使用 PAD 收银台', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['🛒前台'] })
    assert.equal(r.total, 1)
    assert.equal(r.workbenches[0].channel, 'PAD')
    assert.equal(r.workbenches[0].title, '收银台')
    assert.equal(r.workbenches[0].role, 'CASHIER')
  })
  test('🛒前台: 拥有 checkout-nuclear + offline-fallback', () => {
    assert.equal(
      controller.checkCapability({ role: 'CASHIER', capability: 'checkout-nuclear' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'CASHIER', capability: 'offline-fallback' }).has,
      true
    )
  })
  test('🛒前台: 不拥有 member-crm (前台不接触会员运营)', () => {
    assert.equal(
      controller.checkCapability({ role: 'CASHIER', capability: 'member-crm' }).has,
      false
    )
  })

  // ── 👥 HR (TENANT_ADMIN) ──
  test('👥HR: 访问租户经营台 (PC)', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['👥HR'] })
    assert.equal(r.workbenches[0].title, '租户经营台')
    assert.equal(r.workbenches[0].channel, 'PC')
    assert.equal(r.workbenches[0].role, 'TENANT_ADMIN')
  })
  test('👥HR: 拥有品牌矩阵+渠道编排+portal管理能力', () => {
    assert.equal(
      controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'brand-matrix' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'channel-orchestration' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'portal-management' }).has,
      true
    )
  })
  test('👥HR: 不拥有 checkout-nuclear (不懂收银)', () => {
    assert.equal(
      controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'checkout-nuclear' }).has,
      false
    )
  })

  // ── 🔧 安监 (SUPER_ADMIN) ──
  test('🔧安监: 访问总部总控台 (PC)', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['🔧安监'] })
    assert.equal(r.workbenches[0].title, '总部总控台')
    assert.equal(r.workbenches[0].channel, 'PC')
    assert.equal(r.workbenches[0].role, 'SUPER_ADMIN')
  })
  test('🔧安监: 拥有 ternary 审计/治理/租户管理能力', () => {
    assert.equal(
      controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'audit-center' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'market-governance' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'tenant-management' }).has,
      true
    )
  })
  test('🔧安监: 有 secret-rotation 端点权限 (与 SECURITY_ADMIN 共享)', () => {
    // 元数据验证: rotateSecret 只允许 SUPER_ADMIN + SECURITY_ADMIN
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret)
    assert.ok(roles.includes('SUPER_ADMIN'))
    assert.ok(roles.includes('SECURITY_ADMIN'))
    assert.equal(roles.length, 2)
  })

  // ── 🎮 导玩员 ──
  test('🎮导玩员: 使用 PAD 导购工作台', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['🎮导玩员'] })
    assert.equal(r.workbenches[0].title, '导购工作台')
    assert.equal(r.workbenches[0].channel, 'PAD')
    assert.equal(r.workbenches[0].role, 'GUIDE')
  })
  test('🎮导玩员: 有 member-crm + promo-conversion 推广能力', () => {
    assert.equal(
      controller.checkCapability({ role: 'GUIDE', capability: 'member-crm' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'GUIDE', capability: 'promo-conversion' }).has,
      true
    )
  })
  test('🎮导玩员: 不能使用 PC 渠道工作台', () => {
    const r: any = controller.getWorkbenches({ role: 'GUIDE', channel: 'PC' })
    assert.equal(r.total, 0)
  })

  // ── 🎯 运行专员 (OPERATIONS) ──
  test('🎯运行专员: 访问运行中心 (PC)', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['🎯运行专员'] })
    assert.equal(r.total, 1)
    assert.equal(r.workbenches[0].channel, 'PC')
    assert.equal(r.workbenches[0].role, 'OPERATIONS')
  })
  test('🎯运行专员: 拥有治理/调度/租户/审计四合一能力', () => {
    assert.equal(
      controller.checkCapability({ role: 'OPERATIONS', capability: 'market-governance' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'OPERATIONS', capability: 'field-scheduling' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'OPERATIONS', capability: 'tenant-management' }).has,
      true
    )
    assert.equal(
      controller.checkCapability({ role: 'OPERATIONS', capability: 'audit-center' }).has,
      true
    )
  })
  test('🎯运行专员: 不拥有 checkout-nuclear (非收银角色)', () => {
    assert.equal(
      controller.checkCapability({ role: 'OPERATIONS', capability: 'checkout-nuclear' }).has,
      false
    )
  })

  // ── 🤝 团建 (TEAM_BUILDING: 不在 WORKBENCH_READ_ROLES 中, 无任何端点访问权限) ──
  test('🤝团建: 系统无此角色工作台 → 返回空', () => {
    // TEAM_BUILDING 不在 ROLE_CAPABILITY_MAP 也不在 defaultRoleWorkbenchContracts 中
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['🤝团建'] })
    assert.equal(r.total, 0)
    assert.deepEqual(r.workbenches, [])
  })
  test('🤝团建: 无任何能力（capability check 返回 false）', () => {
    assert.equal(
      controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'member-crm' }).has,
      false
    )
    assert.equal(
      controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'field-scheduling' }).has,
      false
    )
    assert.equal(
      controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'tenant-management' }).has,
      false
    )
  })
  test('🤝团建: 不在任何 @RequireRoles 端点允许列表中（权限边界）', () => {
    // 验证所有 read handler 都不包含 TEAM_BUILDING
    const readHandlers = [
      WorkbenchController.prototype.getBootstrap,
      WorkbenchController.prototype.getWorkbenches,
      WorkbenchController.prototype.getNavItems,
      WorkbenchController.prototype.checkCapability,
    ]
    readHandlers.forEach(handler => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler) as string[]
      assert.ok(!roles.includes('TEAM_BUILDING'), `${handler.name} should not allow TEAM_BUILDING`)
    })
  })
  test('🤝团建: navItems 中无任何可访问项', () => {
    const r: any = controller.getNavItems({ role: 'TEAM_BUILDING' })
    assert.equal(r.total, 0)
    assert.deepEqual(r.navItems, [])
  })

  // ── 📢 营销 (MARKETING: 不在 WORKBENCH_READ_ROLES 中, 无任何端点访问权限) ──
  test('📢营销: 系统无此角色工作台 → 返回空', () => {
    const r: any = controller.getWorkbenches({ role: roleToDomainRole['📢营销'] })
    assert.equal(r.total, 0)
    assert.deepEqual(r.workbenches, [])
  })
  test('📢营销: 无任何能力（capability check 返回 false）', () => {
    assert.equal(
      controller.checkCapability({ role: 'MARKETING', capability: 'campaign-execution' }).has,
      false
    )
    assert.equal(
      controller.checkCapability({ role: 'MARKETING', capability: 'promo-conversion' }).has,
      false
    )
    assert.equal(
      controller.checkCapability({ role: 'MARKETING', capability: 'member-crm' }).has,
      false
    )
  })
  test('📢营销: 不在任何 @RequireRoles 端点允许列表中（权限边界）', () => {
    const actionHandlers = [
      WorkbenchController.prototype.executeApproval,
      WorkbenchController.prototype.submitRuntimeReplay,
      WorkbenchController.prototype.syncHandlerReceipt,
      WorkbenchController.prototype.rotateSecret,
    ]
    actionHandlers.forEach(handler => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler) as string[]
      assert.ok(!roles.includes('MARKETING'), `${handler.name} should not allow MARKETING`)
    })
  })
  test('📢营销: navItems 中无任何可访问项', () => {
    const r: any = controller.getNavItems({ role: 'MARKETING' })
    assert.equal(r.total, 0)
    assert.deepEqual(r.navItems, [])
  })
})

// ══════════════════════════════════════════════════
// 7. 角色与装饰器权限边界：交叉验证
// ══════════════════════════════════════════════════

describe('角色与装饰器权限边界', () => {
  test('READ 端点允许 GUIDE/CASHIER/STORE_MANAGER 但 action 端点不允许', () => {
    // read handler getBootstrap: 含 GUIDE/CASHIER/STORE_MANAGER
    const readRoles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.getBootstrap) as string[]
    assert.ok(readRoles.includes('GUIDE'))
    assert.ok(readRoles.includes('CASHIER'))
    assert.ok(readRoles.includes('STORE_MANAGER'))

    // action handler executeApproval: 不含 GUIDE/CASHIER/STORE_MANAGER
    const actionRoles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.executeApproval) as string[]
    assert.ok(!actionRoles.includes('GUIDE'), 'GUIDE should NOT be in action roles')
    assert.ok(!actionRoles.includes('CASHIER'), 'CASHIER should NOT be in action roles')
    assert.ok(!actionRoles.includes('STORE_MANAGER'), 'STORE_MANAGER should NOT be in action roles')
  })

  test('SUPER_ADMIN / TENANT_ADMIN / OPERATIONS / SECURITY_ADMIN 可以访问 read + action 端点; secret-rotation 仅 SUPER_ADMIN + SECURITY_ADMIN', () => {
    const regularHandlers = [
      { name: 'getBootstrap', handler: WorkbenchController.prototype.getBootstrap },
      { name: 'executeApproval', handler: WorkbenchController.prototype.executeApproval },
    ]
    const allAdminRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']

    regularHandlers.forEach(({ name, handler }) => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler) as string[]
      allAdminRoles.forEach(adminRole => {
        assert.ok(roles.includes(adminRole), `${adminRole} should have access to ${name}`)
      })
    })

    // rotateSecret: 仅 SUPER_ADMIN + SECURITY_ADMIN (不包括 TENANT_ADMIN / OPERATIONS)
    const secretRoles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret) as string[]
    assert.ok(secretRoles.includes('SUPER_ADMIN'))
    assert.ok(secretRoles.includes('SECURITY_ADMIN'))
    assert.ok(!secretRoles.includes('TENANT_ADMIN'), 'TENANT_ADMIN must NOT rotate secrets')
    assert.ok(!secretRoles.includes('OPERATIONS'), 'OPERATIONS must NOT rotate secrets')
  })

  test('SECURITY_ADMIN 有 secret-rotation 权限但 GUIDE 没有', () => {
    const secretRoles = Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret)
    assert.ok(secretRoles.includes('SECURITY_ADMIN'))
    assert.ok(!secretRoles.includes('GUIDE'), 'GUIDE must NOT rotate secrets')
    assert.ok(!secretRoles.includes('CASHIER'), 'CASHIER must NOT rotate secrets')
    assert.ok(!secretRoles.includes('STORE_MANAGER'), 'STORE_MANAGER must NOT rotate secrets')
  })

  test('所有 action 端点仅限 4 个管理员角色', () => {
    const actionOnlyHandlers = [
      WorkbenchController.prototype.executeApproval,
      WorkbenchController.prototype.rotateSecret,
      WorkbenchController.prototype.submitRuntimeReplay,
      WorkbenchController.prototype.getActionReceipt,
      WorkbenchController.prototype.syncHandlerReceipt,
      WorkbenchController.prototype.recordHandlerCallback,
      WorkbenchController.prototype.replayActionReceipt,
    ]

    const nonAdminRoles = ['GUIDE', 'CASHIER', 'STORE_MANAGER', 'BRAND_MANAGER', 'FINANCE', 'WAREHOUSE', 'COACH']

    actionOnlyHandlers.forEach(handler => {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, handler) as string[]
      if (roles) {
        nonAdminRoles.forEach(nonAdmin => {
          assert.ok(!roles.includes(nonAdmin), `${nonAdmin} must NOT have access to ${handler.name}`)
        })
      }
    })
  })

  test('read 端点允许 8 个角色, action 端点仅 4 个, secret-rotation 端点仅 2 个', () => {
    const readCount = (Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.getBootstrap) as string[]).length
    const actionCount = (Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.executeApproval) as string[]).length
    const secretCount = (Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret) as string[]).length

    assert.equal(readCount, 8, 'read endpoints should allow 8 roles')
    assert.equal(actionCount, 4, 'action endpoints should allow 4 roles')
    assert.equal(secretCount, 2, 'secret-rotation should allow 2 roles')
    assert.ok(readCount > actionCount, 'read roles > action roles')
    assert.ok(actionCount > secretCount, 'action roles > secret roles')
  })
})
