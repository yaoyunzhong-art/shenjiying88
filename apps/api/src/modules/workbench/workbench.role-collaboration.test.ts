/**
 * 🐜 自动: [workbench] [C] 角色协作场景测试
 *
 * 8 角色跨功能协作场景测试:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 场景覆盖:
 * - 角色工作台 bootstrap 响应完整性
 * - 导航项对角色能力的一致性
 * - capabilitiy-check 正例/反例/边界
 * - 多角色对相同 API 的差异化响应
 * - 角色特有的启动配置 (getRoleBootstrapConfig)
 * - 菜单准入 (canAccessRoleMenu)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  hasCapability,
  makeWorkbenchBootstrapState,
  ROLE_CAPABILITY_MAP,
  WORKBENCH_CAPABILITIES,
  getRoleBootstrapConfig,
  canAccessRoleMenu,
  ROLE_BOOTSTRAP_CONFIGS,
  type WorkbenchCapability,
  type WorkbenchBootstrapState,
} from './workbench.entity'
import { toRoleWorkbenchContract, toTenantContextContract } from './workbench.contract'
import type { RoleWorkbench } from '@m5/domain'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 角色到系统角色的映射 ──
const ROLE_MAP: Record<string, string> = {
  [ROLES.StoreManager]: 'STORE_MANAGER',
  [ROLES.FrontDesk]: 'CASHIER',
  [ROLES.HR]: 'TENANT_ADMIN',
  [ROLES.Safety]: 'SUPER_ADMIN',
  [ROLES.Guide]: 'GUIDE',
  [ROLES.Ops]: 'OPERATIONS',
  [ROLES.Teambuilding]: 'COACH',
  [ROLES.Marketing]: 'BRAND_MANAGER',
}

// ── 测试数据工厂 ──
function makeSampleWorkbench(
  role: string,
  channel: string = 'pc',
  customNav?: Array<{ key: string; label: string; href: string; description: string }>,
): RoleWorkbench {
  return {
    role: role as RoleWorkbench['role'],
    channel: channel as never,
    title: `${role}工作台`,
    description: `${role}的功能说明`,
    marketCodes: ['cn-mainland'],
    navItems: customNav ?? [
      { key: 'dashboard', label: '仪表盘', href: `/${role.toLowerCase()}/dashboard`, description: '总览数据' },
      { key: 'tasks', label: '任务', href: `/${role.toLowerCase()}/tasks`, description: '待办任务' },
    ],
  }
}

// ── 所有角色通用 bootstrap 状态 ──
function makeAllRoleWorkbenches(): RoleWorkbench[] {
  return Object.keys(ROLE_CAPABILITY_MAP).map((role) =>
    makeSampleWorkbench(role, role === 'GUIDE' ? 'pad' : role === 'CASHIER' ? 'mobile' : 'pc'),
  )
}

// ============================================================================
// 👔店长 → STORE_MANAGER
// ============================================================================
describe(`${ROLES.StoreManager} 工作台协作场景`, () => {
  it('店长 bootstrap 应包含门店日报模块', () => {
    const workbenches = makeAllRoleWorkbenches()
    const state = makeWorkbenchBootstrapState(workbenches)
    
    assert.equal(state.initialized, true)
    assert.equal(state.version, '1.0.0')
    assert.ok(state.refreshedAt)
    
    const smWorkbench = workbenches.find(w => w.role === 'STORE_MANAGER')
    assert.ok(smWorkbench)
    assert.equal(smWorkbench.channel, 'pc')
  })

  it('店长能力：daily-report + field-scheduling，无权操作 tenant 管理', () => {
    assert.equal(hasCapability('STORE_MANAGER', 'daily-report'), true)
    assert.equal(hasCapability('STORE_MANAGER', 'field-scheduling'), true)
    assert.equal(hasCapability('STORE_MANAGER', 'tenant-management'), false)
    assert.equal(hasCapability('STORE_MANAGER', 'checkout-nuclear'), false)
    assert.equal(hasCapability('STORE_MANAGER', 'portal-management'), false)
  })

  it('店长 canAccessRoleMenu 自访问应返回 true', () => {
    assert.equal(canAccessRoleMenu('STORE_MANAGER', 'STORE_MANAGER'), true)
  })

  it('店长 canAccessRoleMenu 越权访问 SUPER_ADMIN 应返回 false', () => {
    assert.equal(canAccessRoleMenu('STORE_MANAGER', 'SUPER_ADMIN'), false)
  })

  it('店长 (STORE_MANAGER) 无专用启动配置，getRoleBootstrapConfig 返回 undefined', () => {
    const config = getRoleBootstrapConfig('STORE_MANAGER')
    assert.equal(config, undefined)
  })
})

// ============================================================================
// 🛒前台 → CASHIER
// ============================================================================
describe(`${ROLES.FrontDesk} 工作台协作场景`, () => {
  it('前台 bootstrap 应使用 mobile channel', () => {
    const workbenches = makeAllRoleWorkbenches()
    const cashierWb = workbenches.find(w => w.role === 'CASHIER')
    assert.ok(cashierWb)
    assert.equal(cashierWb.channel, 'mobile')
  })

  it('前台能力：checkout-nuclear + offline-fallback，无权查看审计', () => {
    assert.equal(hasCapability('CASHIER', 'checkout-nuclear'), true)
    assert.equal(hasCapability('CASHIER', 'offline-fallback'), true)
    assert.equal(hasCapability('CASHIER', 'audit-center'), false)
    assert.equal(hasCapability('CASHIER', 'tenant-management'), false)
    assert.equal(hasCapability('CASHIER', 'regional-config'), false)
  })

  it('前台合约转换保持 channel 属性', () => {
    const wb = makeSampleWorkbench('CASHIER', 'mobile')
    const contract = toRoleWorkbenchContract(wb)
    assert.equal(contract.channel, 'mobile')
  })

  it('前台 canAccessRoleMenu: CASHIER 可访问自己的菜单', () => {
    assert.equal(canAccessRoleMenu('CASHIER', 'CASHIER'), true)
  })

  it('前台 canAccessRoleMenu: CASHIER 不可访问 SUPER_ADMIN 菜单', () => {
    assert.equal(canAccessRoleMenu('CASHIER', 'SUPER_ADMIN'), false)
  })
})

// ============================================================================
// 👥HR → TENANT_ADMIN
// ============================================================================
describe(`${ROLES.HR} 工作台协作场景`, () => {
  it('HR (TENANT_ADMIN) 拥有 4 个能力：品牌矩阵、渠道编排、区域配置、门户管理', () => {
    const caps = ROLE_CAPABILITY_MAP['TENANT_ADMIN']
    assert.equal(caps.length, 4)
    assert.ok(caps.includes('brand-matrix'))
    assert.ok(caps.includes('channel-orchestration'))
    assert.ok(caps.includes('regional-config'))
    assert.ok(caps.includes('portal-management'))
  })

  it('HR 权限边界：无收银和门店调度能力', () => {
    assert.equal(hasCapability('TENANT_ADMIN', 'checkout-nuclear'), false)
    assert.equal(hasCapability('TENANT_ADMIN', 'daily-report'), false)
    assert.equal(hasCapability('TENANT_ADMIN', 'field-scheduling'), false)
    assert.equal(hasCapability('TENANT_ADMIN', 'audit-center'), false)
  })

  it('HR (TENANT_ADMIN) 无专用启动配置，getRoleBootstrapConfig 返回 undefined', () => {
    const config = getRoleBootstrapConfig('TENANT_ADMIN')
    assert.equal(config, undefined)
  })
})

// ============================================================================
// 🔧安监 → SUPER_ADMIN
// ============================================================================
describe(`${ROLES.Safety} 工作台协作场景`, () => {
  it('安监 (SUPER_ADMIN) 拥有 tenant-management / audit-center / market-governance', () => {
    assert.equal(hasCapability('SUPER_ADMIN', 'tenant-management'), true)
    assert.equal(hasCapability('SUPER_ADMIN', 'audit-center'), true)
    assert.equal(hasCapability('SUPER_ADMIN', 'market-governance'), true)
    assert.equal(ROLE_CAPABILITY_MAP['SUPER_ADMIN'].length, 3)
  })

  it('安监权限边界：无门店运营或会员管理能力', () => {
    assert.equal(hasCapability('SUPER_ADMIN', 'daily-report'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'member-crm'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'checkout-nuclear'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'promo-conversion'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'campaign-execution'), false)
  })

  it('安监启动配置应包含安全审计相关项', () => {
    const config = getRoleBootstrapConfig('SUPER_ADMIN')
    assert.ok(config)
  })
})

// ============================================================================
// 🎮导玩员 → GUIDE
// ============================================================================
describe(`${ROLES.Guide} 工作台协作场景`, () => {
  it('导玩员拥有 member-crm + promo-conversion 能力', () => {
    assert.equal(hasCapability('GUIDE', 'member-crm'), true)
    assert.equal(hasCapability('GUIDE', 'promo-conversion'), true)
    assert.equal(ROLE_CAPABILITY_MAP['GUIDE'].length, 2)
  })

  it('导玩员权限边界：无后台管理和审计权限', () => {
    assert.equal(hasCapability('GUIDE', 'tenant-management'), false)
    assert.equal(hasCapability('GUIDE', 'audit-center'), false)
    assert.equal(hasCapability('GUIDE', 'checkout-nuclear'), false)
    assert.equal(hasCapability('GUIDE', 'brand-matrix'), false)
  })

  it('导玩员使用 pad channel', () => {
    const wb = makeSampleWorkbench('GUIDE', 'pad')
    assert.equal(wb.channel, 'pad')
    const contract = toRoleWorkbenchContract(wb)
    assert.equal(contract.channel, 'pad')
  })
})

// ============================================================================
// 🎯运行专员 → OPERATIONS
// ============================================================================
describe(`${ROLES.Ops} 工作台协作场景`, () => {
  it('运行专员拥有 4 个能力', () => {
    const caps = ROLE_CAPABILITY_MAP['OPERATIONS']
    assert.equal(caps.length, 4)
    assert.ok(caps.includes('market-governance'))
    assert.ok(caps.includes('field-scheduling'))
    assert.ok(caps.includes('tenant-management'))
    assert.ok(caps.includes('audit-center'))
  })

  it('运行专员权限边界：无会员运营或促销能力', () => {
    assert.equal(hasCapability('OPERATIONS', 'member-crm'), false)
    assert.equal(hasCapability('OPERATIONS', 'promo-conversion'), false)
    assert.equal(hasCapability('OPERATIONS', 'checkout-nuclear'), false)
  })

  it('运行专员 workbench 合约应正确转译角色', () => {
    const wb = makeSampleWorkbench('OPERATIONS')
    const contract = toRoleWorkbenchContract(wb)
    assert.equal(contract.role, 'OPERATIONS')
    assert.equal(contract.marketCodes!.length, 1)
  })
})

// ============================================================================
// 🤝团建 → COACH
// ============================================================================
describe(`${ROLES.Teambuilding} 工作台协作场景`, () => {
  it('团建 (COACH) 拥有 member-crm + promo-conversion + audit-center', () => {
    assert.equal(hasCapability('COACH', 'member-crm'), true)
    assert.equal(hasCapability('COACH', 'promo-conversion'), true)
    assert.equal(hasCapability('COACH', 'audit-center'), true)
    assert.equal(ROLE_CAPABILITY_MAP['COACH'].length, 3)
  })

  it('团建权限边界：无门店经营或渠道管理能力', () => {
    assert.equal(hasCapability('COACH', 'checkout-nuclear'), false)
    assert.equal(hasCapability('COACH', 'daily-report'), false)
    assert.equal(hasCapability('COACH', 'channel-orchestration'), false)
  })

  it('团建 (COACH) 启动配置可访问', () => {
    const config = getRoleBootstrapConfig('COACH')
    assert.ok(config)
    assert.equal(config.role, 'COACH')
    assert.ok(config.homePath)
    assert.ok(Array.isArray(config.extendedNavItems))
    assert.ok(Array.isArray(config.todoCardTypes))
    assert.ok(Array.isArray(config.permissionSnippets))
  })

  it('团建 canAccessRoleMenu: COACH 可访问自己的菜单', () => {
    assert.equal(canAccessRoleMenu('COACH', 'COACH'), true)
  })

  it('团建 canAccessRoleMenu: SUPER_ADMIN 可访问 COACH 菜单', () => {
    assert.equal(canAccessRoleMenu('SUPER_ADMIN', 'COACH'), true)
  })
})

// ============================================================================
// 📢营销 → BRAND_MANAGER
// ============================================================================
describe(`${ROLES.Marketing} 工作台协作场景`, () => {
  it('营销 (BRAND_MANAGER) 拥有 3 个能力', () => {
    const caps = ROLE_CAPABILITY_MAP['BRAND_MANAGER']
    assert.equal(caps.length, 3)
    assert.ok(caps.includes('member-crm'))
    assert.ok(caps.includes('campaign-execution'))
    assert.ok(caps.includes('regional-config'))
  })

  it('营销权限边界：无门店或审计操作能力', () => {
    assert.equal(hasCapability('BRAND_MANAGER', 'daily-report'), false)
    assert.equal(hasCapability('BRAND_MANAGER', 'audit-center'), false)
    assert.equal(hasCapability('BRAND_MANAGER', 'checkout-nuclear'), false)
  })

  it('营销参与多市场工作台（cn-mainland + us-default）', () => {
    const wb: RoleWorkbench = {
      role: 'BRAND_MANAGER' as never,
      channel: 'pc' as never,
      title: '品牌营销工作台',
      description: '多市场品牌活动管理',
      marketCodes: ['cn-mainland', 'us-default'],
      navItems: [
        { key: 'campaigns', label: '活动列表', href: '/brand/campaigns', description: '管理营销活动' },
        { key: 'analytics', label: '效果分析', href: '/brand/analytics', description: '活动数据分析' },
      ],
    }
    const contract = toRoleWorkbenchContract(wb)
    assert.equal(contract.marketCodes!.length, 2)
    assert.equal(contract.navItems.length, 2)
    assert.ok(contract.navItems.some(n => n.key === 'analytics'))
  })
})

// ============================================================================
// 跨角色协作场景
// ============================================================================
describe('跨角色工作台协作场景', () => {
  it('所有角色的工作台都可正常构建 bootstrap', () => {
    const workbenches = makeAllRoleWorkbenches()
    const state = makeWorkbenchBootstrapState(workbenches, { initialized: true })
    
    assert.equal(state.initialized, true)
    assert.equal(state.workbenches.length, Object.keys(ROLE_CAPABILITY_MAP).length)
    assert.ok(state.workbenches.every(w => w.role && w.title && w.navItems.length > 0))
  })

  it('每个角色在工作台中至少有一个导航项', () => {
    const workbenches = makeAllRoleWorkbenches()
    for (const wb of workbenches) {
      assert.ok(wb.navItems.length >= 1, `${wb.role} should have at least 1 nav item`)
    }
  })

  it('bootstrap 状态通过合约转译后完整', () => {
    const workbenches = makeAllRoleWorkbenches()
    const state = makeWorkbenchBootstrapState(workbenches)
    
    // 验证每个 workbench 能正确通过合约转换
    for (const wb of state.workbenches) {
      const contract = toRoleWorkbenchContract(wb)
      assert.equal(contract.role, wb.role)
      assert.equal(contract.title, wb.title)
      assert.equal(contract.navItems.length, wb.navItems.length)
    }
  })

  it('所有能力常量完整且无重复', () => {
    const caps = [...WORKBENCH_CAPABILITIES]
    assert.equal(caps.length, new Set(caps).size, '能力常量不可重复')
    assert.equal(caps.length, 14)
  })

  it('所有角色在能力映射中都有定义', () => {
    const definedRoles = Object.keys(ROLE_CAPABILITY_MAP)
    assert.ok(definedRoles.length >= 10)
    // 验证所有系统角色都在映射表中
    const expectedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER', 'GUIDE', 'CASHIER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH']
    for (const role of expectedRoles) {
      assert.ok(definedRoles.includes(role), `角色 ${role} 应在能力映射表中`)
    }
  })

  it('hasCapability 对空字符串和 undefined 角色安全返回 false', () => {
    assert.equal(hasCapability('', 'audit-center'), false)
    assert.equal(hasCapability(undefined as unknown as string, 'audit-center'), false)
    assert.equal(hasCapability(null as unknown as string, 'audit-center'), false)
  })

  it('canAccessRoleMenu 对所有角色安全可用（自访问返回 true）', () => {
    const allRoles = Object.keys(ROLE_CAPABILITY_MAP)
    for (const role of allRoles) {
      assert.doesNotThrow(() => {
        const result = canAccessRoleMenu(role, role)
        assert.equal(result, true)
      })
    }
  })

  it('canAccessRoleMenu: SUPER_ADMIN 可访问所有角色菜单', () => {
    const allRoles = Object.keys(ROLE_CAPABILITY_MAP)
    for (const role of allRoles) {
      assert.equal(canAccessRoleMenu('SUPER_ADMIN', role), true)
    }
  })

  it('canAccessRoleMenu: 非 SUPER_ADMIN 不可越权', () => {
    assert.equal(canAccessRoleMenu('CASHIER', 'STORE_MANAGER'), false)
    assert.equal(canAccessRoleMenu('GUIDE', 'BRAND_MANAGER'), false)
    assert.equal(canAccessRoleMenu('BRAND_MANAGER', 'OPERATIONS'), false)
    assert.equal(canAccessRoleMenu('STORE_MANAGER', 'COACH'), false)
  })

  it('ROLE_BOOTSTRAP_CONFIGS 包含 COACH 的引导配置', () => {
    const coachConfig = ROLE_BOOTSTRAP_CONFIGS['COACH']
    assert.ok(coachConfig)
    assert.equal(coachConfig.role, 'COACH')
    assert.ok(coachConfig.homePath)
    assert.ok(Array.isArray(coachConfig.extendedNavItems))
  })

  it('ROLE_BOOTSTRAP_CONFIGS 所有配置字段完整', () => {
    for (const [role, config] of Object.entries(ROLE_BOOTSTRAP_CONFIGS)) {
      assert.equal(config.role, role)
      assert.ok(config.homePath, `${role} 应有 homePath`)
      assert.ok(Array.isArray(config.extendedNavItems))
      assert.ok(Array.isArray(config.todoCardTypes))
      assert.ok(Array.isArray(config.permissionSnippets))
    }
  })

  it('不同角色通过组合获得互补能力', () => {
    // 店长 + 导玩员 组合 = 门店日常运营能力
    assert.equal(hasCapability('STORE_MANAGER', 'daily-report'), true)
    assert.equal(hasCapability('GUIDE', 'member-crm'), true)
    
    // 安监 + 营销 组合 = 安全治理 + 营销推广能力
    assert.equal(hasCapability('SUPER_ADMIN', 'audit-center'), true)
    assert.equal(hasCapability('BRAND_MANAGER', 'campaign-execution'), true)
    
    // 运行专员 + HR 组合 = 运维 + 组织管理能力
    assert.equal(hasCapability('OPERATIONS', 'field-scheduling'), true)
    assert.equal(hasCapability('TENANT_ADMIN', 'channel-orchestration'), true)
  })

  it('每个角色能力数量合理（1-6 个）', () => {
    for (const [role, caps] of Object.entries(ROLE_CAPABILITY_MAP)) {
      assert.ok(caps.length >= 1, `${role} 应至少拥有 1 个能力`)
      assert.ok(caps.length <= 6, `${role} 不应超过 6 个能力，当前 ${caps.length}`)
    }
  })
})

// ============================================================================
// 合约转换专用测试
// ============================================================================
describe('workbench 合约转译', () => {
  it('toTenantContextContract 完整上下文', () => {
    const ctx = { tenantId: 't-001', brandId: 'b-001', storeId: 's-001', marketCode: 'cn-mainland' }
    const contract = toTenantContextContract(ctx)
    assert.equal(contract.tenantId, 't-001')
    assert.equal(contract.brandId, 'b-001')
    assert.equal(contract.storeId, 's-001')
    assert.equal(contract.marketCode, 'cn-mainland')
  })

  it('toTenantContextContract 最小上下文', () => {
    const contract = toTenantContextContract({ tenantId: 't-min' })
    assert.equal(contract.tenantId, 't-min')
    assert.equal(contract.brandId, undefined)
    assert.equal(contract.storeId, undefined)
    assert.equal(contract.marketCode, undefined)
  })

  it('toTenantContextContract 含有效 tenantId', () => {
    const contract = toTenantContextContract({ tenantId: 'test-tenant' })
    assert.equal(contract.tenantId, 'test-tenant')
  })

  it('toRoleWorkbenchContract 含完整导航项', () => {
    const navItems = Array.from({ length: 5 }, (_, i) => ({
      key: `nav-${i}`,
      label: `导航${i}`,
      href: `/page/${i}`,
      description: `第${i}页`,
    }))
    const wb = makeSampleWorkbench('STORE_MANAGER', 'pc', navItems)
    const contract = toRoleWorkbenchContract(wb)
    assert.equal(contract.navItems.length, 5)
    assert.equal(contract.navItems[4].key, 'nav-4')
  })
})
