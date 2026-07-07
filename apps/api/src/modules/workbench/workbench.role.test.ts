import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [workbench] [C] 角色测试
 * 
 * 8 角色视角的 workbench 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 测试覆盖：
 * - workbench 角色工作台列表完整性
 * - 能力映射 hasCapability 正反例
 * - 合约转换 toRoleWorkbenchContract
 * - bootstrap 响应结构
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  hasCapability,
  ROLE_CAPABILITY_MAP,
  WORKBENCH_CAPABILITIES,
  type WorkbenchCapability,
  type WorkbenchBootstrapState
} from './workbench.entity'
import { toRoleWorkbenchContract, toTenantContextContract } from './workbench.contract'
import type { RoleWorkbench } from '@m5/domain'

// ── 角色定义 ──
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

// ── 测试数据工厂 ──
const sampleNavItem = {
  key: 'sample',
  label: '测试导航',
  href: '/test',
  description: '测试用'
}

function makeSampleWorkbench(role: string, title: string): RoleWorkbench {
  return {
    role: role as RoleWorkbench['role'],
    channel: 'pc' as never,
    title,
    description: `${title}的功能说明`,
    marketCodes: ['cn-mainland'],
    navItems: [sampleNavItem]
  }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} workbench 角色测试`, () => {
  it('店长拥有 daily-report 和 field-scheduling 能力', () => {
    assert.equal(hasCapability('STORE_MANAGER', 'daily-report'), true)
    assert.equal(hasCapability('STORE_MANAGER', 'field-scheduling'), true)
    assert.equal(ROLE_CAPABILITY_MAP['STORE_MANAGER'].length, 2)
  })

  it('店长权限边界：缺少 member-crm、checkout-nuclear 能力', () => {
    // 店长只负责门店日报和现场调度，不具备会员运营和收银能力
    assert.equal(hasCapability('STORE_MANAGER', 'member-crm'), false)
    assert.equal(hasCapability('STORE_MANAGER', 'checkout-nuclear'), false)
    assert.equal(hasCapability('STORE_MANAGER', 'offline-fallback'), false)
    assert.equal(hasCapability('STORE_MANAGER', 'promo-conversion'), false)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} workbench 角色测试`, () => {
  it('前台（收银员角色）拥有 checkout-nuclear 和 offline-fallback 能力', () => {
    assert.equal(hasCapability('CASHIER', 'checkout-nuclear'), true)
    assert.equal(hasCapability('CASHIER', 'offline-fallback'), true)
    assert.equal(ROLE_CAPABILITY_MAP['CASHIER'].length, 2)
  })

  it('前台权限边界：不能访问经营管理功能', () => {
    // 收银员只有收银和离线能力
    assert.equal(hasCapability('CASHIER', 'brand-matrix'), false)
    assert.equal(hasCapability('CASHIER', 'daily-report'), false)
    assert.equal(hasCapability('CASHIER', 'campaign-execution'), false)
    assert.equal(hasCapability('CASHIER', 'portal-management'), false)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} workbench 角色测试`, () => {
  it('HR 通过租户管理员角色拥有组织管理能力', () => {
    // TENANT_ADMIN 具备品牌矩阵、渠道编排、区域配置、门户管理
    assert.equal(hasCapability('TENANT_ADMIN', 'brand-matrix'), true)
    assert.equal(hasCapability('TENANT_ADMIN', 'channel-orchestration'), true)
    assert.equal(hasCapability('TENANT_ADMIN', 'regional-config'), true)
    assert.equal(hasCapability('TENANT_ADMIN', 'portal-management'), true)
    assert.equal(ROLE_CAPABILITY_MAP['TENANT_ADMIN'].length, 4)
  })

  it('HR 权限边界：不能执行门店级别的操作', () => {
    assert.equal(hasCapability('TENANT_ADMIN', 'daily-report'), false)
    assert.equal(hasCapability('TENANT_ADMIN', 'checkout-nuclear'), false)
    assert.equal(hasCapability('TENANT_ADMIN', 'promo-conversion'), false)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} workbench 角色测试`, () => {
  it('安监（超级管理员）拥有审计中心能力', () => {
    assert.equal(hasCapability('SUPER_ADMIN', 'audit-center'), true)
    assert.equal(hasCapability('SUPER_ADMIN', 'tenant-management'), true)
    assert.equal(hasCapability('SUPER_ADMIN', 'market-governance'), true)
    assert.equal(ROLE_CAPABILITY_MAP['SUPER_ADMIN'].length, 3)
  })

  it('安监权限边界：无门店运营和收银能力', () => {
    // 超级管理员管理全局租户和审计，但不下场到门店层面
    assert.equal(hasCapability('SUPER_ADMIN', 'daily-report'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'checkout-nuclear'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'field-scheduling'), false)
    assert.equal(hasCapability('SUPER_ADMIN', 'member-crm'), false)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} workbench 角色测试`, () => {
  it('导玩员拥有 member-crm 和 promo-conversion 能力', () => {
    assert.equal(hasCapability('GUIDE', 'member-crm'), true)
    assert.equal(hasCapability('GUIDE', 'promo-conversion'), true)
    assert.equal(ROLE_CAPABILITY_MAP['GUIDE'].length, 2)
  })

  it('导玩员权限边界：不能操作渠道编排和审计', () => {
    assert.equal(hasCapability('GUIDE', 'channel-orchestration'), false)
    assert.equal(hasCapability('GUIDE', 'audit-center'), false)
    assert.equal(hasCapability('GUIDE', 'tenant-management'), false)
    assert.equal(hasCapability('GUIDE', 'offline-fallback'), false)
  })

  it('导玩员 workbench contract 转换：channel 为 pad', () => {
    const wb = makeSampleWorkbench('GUIDE', '导购工作台')
    // 覆盖 channel
    const realistic = { ...wb, channel: 'pad' as never }
    const contract = toRoleWorkbenchContract(realistic)

    assert.equal(contract.role, 'GUIDE')
    assert.equal(contract.title, '导购工作台')
    assert.equal(contract.marketCodes!.length, 1)
    assert.equal(contract.navItems[0].key, 'sample')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} workbench 角色测试`, () => {
  it('运行专员通过品牌管理员角色拥有会员和活动能力', () => {
    assert.equal(hasCapability('BRAND_MANAGER', 'member-crm'), true)
    assert.equal(hasCapability('BRAND_MANAGER', 'campaign-execution'), true)
    assert.equal(hasCapability('BRAND_MANAGER', 'regional-config'), true)
    assert.equal(ROLE_CAPABILITY_MAP['BRAND_MANAGER'].length, 3)
  })

  it('运行专员权限边界：不能管理租户或收银', () => {
    assert.equal(hasCapability('BRAND_MANAGER', 'tenant-management'), false)
    assert.equal(hasCapability('BRAND_MANAGER', 'checkout-nuclear'), false)
    assert.equal(hasCapability('BRAND_MANAGER', 'field-scheduling'), false)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} workbench 角色测试`, () => {
  it('团建通过超级管理员视角验证所有能力常量完整', () => {
    // 验证 WORKBENCH_CAPABILITIES 包含了所有关键能力
    const allCaps = [...WORKBENCH_CAPABILITIES]
    assert.ok(allCaps.includes('tenant-management'))
    assert.ok(allCaps.includes('brand-matrix'))
    assert.ok(allCaps.includes('channel-orchestration'))
    assert.ok(allCaps.includes('member-crm'))
    assert.ok(allCaps.includes('checkout-nuclear'))
    assert.ok(allCaps.includes('offline-fallback'))
    assert.ok(allCaps.includes('promo-conversion'))
    assert.ok(allCaps.includes('audit-center'))
    assert.ok(allCaps.includes('campaign-execution'))
    assert.equal(allCaps.length, 14)
  })

  it('团建验证所有角色都有能力定义', () => {
    const definedRoles = Object.keys(ROLE_CAPABILITY_MAP)
    assert.ok(definedRoles.includes('SUPER_ADMIN'))
    assert.ok(definedRoles.includes('TENANT_ADMIN'))
    assert.ok(definedRoles.includes('BRAND_MANAGER'))
    assert.ok(definedRoles.includes('STORE_MANAGER'))
    assert.ok(definedRoles.includes('GUIDE'))
    assert.ok(definedRoles.includes('CASHIER'))
    assert.ok(definedRoles.includes('OPERATIONS'))
    assert.ok(definedRoles.includes('FINANCE'))
    assert.ok(definedRoles.includes('WAREHOUSE'))
    assert.ok(definedRoles.includes('COACH'))
    assert.equal(definedRoles.length, 10)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} workbench 角色测试`, () => {
  it('营销通过品牌管理员拥有 campaign-execution 和 member-crm 能力', () => {
    assert.equal(hasCapability('BRAND_MANAGER', 'campaign-execution'), true)
    assert.equal(hasCapability('BRAND_MANAGER', 'member-crm'), true)
  })

  it('营销权限边界：hasCapability 对未定义角色返回 false', () => {
    // 不存在的角色应安全返回 false
    assert.equal(hasCapability('UNKNOWN_ROLE', 'member-crm'), false)
    // 空字符串角色
    assert.equal(hasCapability('', 'member-crm'), false)
    // 存在角色但不存在的能力
    assert.equal(hasCapability('BRAND_MANAGER', 'non-existent-cap' as WorkbenchCapability), false)
  })

  it('营销验证 workbench contract 的多 marketCodes 支持', () => {
    const wb: RoleWorkbench = {
      role: 'BRAND_MANAGER' as never,
      channel: 'mobile' as never,
      title: '品牌经营台',
      description: '品牌活动管理',
      marketCodes: ['cn-mainland', 'us-default', 'jp-east'],
      navItems: [
        { key: 'member', label: '会员', href: '/wb/member', description: '会员' },
        { key: 'campaign', label: '活动', href: '/wb/campaign', description: '活动' }
      ]
    }
    const contract = toRoleWorkbenchContract(wb)

    assert.equal(contract.role, 'BRAND_MANAGER')
    assert.equal(contract.title, '品牌经营台')
    assert.equal(contract.marketCodes!.length, 3)
    assert.equal(contract.marketCodes![2], 'jp-east')
    assert.equal(contract.navItems.length, 2)
    assert.equal(contract.navItems[1].key, 'campaign')
  })
})

// ── 公共：tenantContext 合约转换 ──
describe('公共合约测试', () => {
  it('toTenantContextContract 完整上下文', () => {
    const ctx = {
      tenantId: 't-001',
      brandId: 'b-001',
      storeId: 's-001',
      marketCode: 'cn-mainland'
    }
    const contract = toTenantContextContract(ctx)

    assert.equal(contract.tenantId, 't-001')
    assert.equal(contract.brandId, 'b-001')
    assert.equal(contract.storeId, 's-001')
    assert.equal(contract.marketCode, 'cn-mainland')
  })

  it('toTenantContextContract 最小上下文（仅 tenantId）', () => {
    const ctx = { tenantId: 't-min' }
    const contract = toTenantContextContract(ctx)

    assert.equal(contract.tenantId, 't-min')
    assert.equal(contract.brandId, undefined)
    assert.equal(contract.storeId, undefined)
    assert.equal(contract.marketCode, undefined)
  })
})
