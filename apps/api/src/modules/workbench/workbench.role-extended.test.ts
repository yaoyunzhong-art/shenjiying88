import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 Wave-6: 5角色工作台补全 — 扩展测试
 *
 * 覆盖角色：SUPER_ADMIN / OPERATIONS / FINANCE / WAREHOUSE / COACH
 *
 * 测试维度：
 *   1. 每个角色能通过 bootstrap 加载
 *   2. 每个角色 ≥5 导航菜单项
 *   3. 每个角色有首页路径 / 待办卡片 / 权限片段
 *   4. 越权验证：WAREHOUSE 不能访问 FINANCE 菜单
 *   5. RoleBootstrapConfig 结构完整性
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  SUPER_ADMIN_BOOTSTRAP,
  OPERATIONS_BOOTSTRAP,
  FINANCE_BOOTSTRAP,
  WAREHOUSE_BOOTSTRAP,
  COACH_BOOTSTRAP,
  ROLE_BOOTSTRAP_CONFIGS,
  getRoleBootstrapConfig,
  canAccessRoleMenu,
  NavItemPriority
} from './workbench.entity'

// =========================================================================
const TARGET_ROLES = [
  { key: 'SUPER_ADMIN', label: '安监', home: '/admin/dashboard' },
  { key: 'OPERATIONS', label: '运营', home: '/ops/dashboard' },
  { key: 'FINANCE',  label: '财务', home: '/finance/dashboard' },
  { key: 'WAREHOUSE', label: '仓储', home: '/warehouse/dashboard' },
  { key: 'COACH',    label: '教练', home: '/coach/dashboard' },
] as const

// =========================================================================
// Test 1-5: 每个角色能通过 bootstrap 加载（含完整性断言）
// =========================================================================
for (const roleDef of TARGET_ROLES) {
  describe(`${roleDef.label} (${roleDef.key}) bootstrap 加载`, () => {
    it(`normal: ${roleDef.key} bootstrap config exists`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)
      assert.ok(config, `${roleDef.key} bootstrap config should exist`)
      assert.equal(config!.role, roleDef.key)
    })

    it(`normal: ${roleDef.key} homePath is ${roleDef.home}`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)!
      assert.equal(config.homePath, roleDef.home)
    })

    it(`normal: ${roleDef.key} has ≥5 nav items`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)!
      assert.ok(
        config.extendedNavItems.length >= 5,
        `${roleDef.key} should have ≥5 nav items (got ${config.extendedNavItems.length})`
      )
    })

    it(`normal: ${roleDef.key} has todo card types`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)!
      assert.ok(config.todoCardTypes.length > 0, `${roleDef.key} should have todo card types`)
    })

    it(`normal: ${roleDef.key} has permission snippets`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)!
      assert.ok(config.permissionSnippets.length > 0, `${roleDef.key} should have permission snippets`)
    })
  })
}

// =========================================================================
// Test 6-10: 每个角色导航菜单完整性 (≥5 items 互不重复)
// =========================================================================
describe('SUPER_ADMIN 导航菜单完整性', () => {
  it('SUPER_ADMIN nav items ≥ 7 (富菜单)', () => {
    assert.ok(SUPER_ADMIN_BOOTSTRAP.extendedNavItems.length >= 7)
  })

  it('SUPER_ADMIN nav keys unique', () => {
    const keys = SUPER_ADMIN_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.equal(keys.length, new Set(keys).size, 'nav keys should be unique')
  })

  it('SUPER_ADMIN nav items contain tenants + audit + markets', () => {
    const keys = SUPER_ADMIN_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.ok(keys.includes('tenants'))
    assert.ok(keys.includes('audit'))
    assert.ok(keys.includes('markets'))
  })
})

describe('OPERATIONS 导航菜单完整性', () => {
  it('OPERATIONS nav items ≥ 6', () => {
    assert.ok(OPERATIONS_BOOTSTRAP.extendedNavItems.length >= 6)
  })

  it('OPERATIONS nav items contain kpi-dashboard + campaign-effects + traffic-analysis', () => {
    const keys = OPERATIONS_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.ok(keys.includes('kpi-dashboard'))
    assert.ok(keys.includes('campaign-effects'))
    assert.ok(keys.includes('traffic-analysis'))
  })
})

describe('FINANCE 导航菜单完整性', () => {
  it('FINANCE nav items ≥ 6', () => {
    assert.ok(FINANCE_BOOTSTRAP.extendedNavItems.length >= 6)
  })

  it('FINANCE nav items contain reconciliation + settlements + invoices', () => {
    const keys = FINANCE_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.ok(keys.includes('reconciliation'))
    assert.ok(keys.includes('settlements'))
    assert.ok(keys.includes('invoices'))
  })
})

describe('WAREHOUSE 导航菜单完整性', () => {
  it('WAREHOUSE nav items ≥ 6', () => {
    assert.ok(WAREHOUSE_BOOTSTRAP.extendedNavItems.length >= 6)
  })

  it('WAREHOUSE nav items contain inventory-dashboard + purchase-orders + suppliers', () => {
    const keys = WAREHOUSE_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.ok(keys.includes('inventory-dashboard'))
    assert.ok(keys.includes('purchase-orders'))
    assert.ok(keys.includes('suppliers'))
  })
})

describe('COACH 导航菜单完整性', () => {
  it('COACH nav items ≥ 6', () => {
    assert.ok(COACH_BOOTSTRAP.extendedNavItems.length >= 6)
  })

  it('COACH nav items contain class-schedule + students + teaching-records', () => {
    const keys = COACH_BOOTSTRAP.extendedNavItems.map(i => i.key)
    assert.ok(keys.includes('class-schedule'))
    assert.ok(keys.includes('students'))
    assert.ok(keys.includes('teaching-records'))
  })
})

// =========================================================================
// Test 11: 越权验证 — WAREHOUSE 不能访问 FINANCE 菜单
// =========================================================================
describe('越权验证', () => {
  it('WAREHOUSE cannot access FINANCE menu', () => {
    assert.equal(canAccessRoleMenu('WAREHOUSE', 'FINANCE'), false)
  })

  it('COACH cannot access FINANCE menu', () => {
    assert.equal(canAccessRoleMenu('COACH', 'FINANCE'), false)
  })

  it('OPERATIONS cannot access FINANCE menu', () => {
    assert.equal(canAccessRoleMenu('OPERATIONS', 'FINANCE'), false)
  })

  it('FINANCE cannot access WAREHOUSE menu', () => {
    assert.equal(canAccessRoleMenu('FINANCE', 'WAREHOUSE'), false)
  })

  it('STORE_MANAGER cannot access WAREHOUSE menu', () => {
    assert.equal(canAccessRoleMenu('STORE_MANAGER', 'WAREHOUSE'), false)
  })

  it('SUPER_ADMIN can access any role menu', () => {
    for (const { key } of TARGET_ROLES) {
      assert.equal(canAccessRoleMenu('SUPER_ADMIN', key), true,
        `SUPER_ADMIN should access ${key} menu`)
    }
  })

  it('Self role can access own menu', () => {
    for (const { key } of TARGET_ROLES) {
      assert.equal(canAccessRoleMenu(key, key), true,
        `${key} should access own menu`)
    }
  })

  it('Unknown role cannot access FINANCE', () => {
    assert.equal(canAccessRoleMenu('UNKNOWN_ROLE', 'FINANCE'), false)
  })
})

// =========================================================================
// Test 12: 待办卡片类型完整性
// =========================================================================
describe('待办卡片类型', () => {
  for (const roleDef of TARGET_ROLES) {
    it(`${roleDef.key} todo cards have valid priorities`, () => {
      const config = getRoleBootstrapConfig(roleDef.key)!
      const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
      for (const card of config.todoCardTypes) {
        assert.ok(validPriorities.includes(card.priority),
          `${roleDef.key} card "${card.key}" has valid priority (got ${card.priority})`)
        assert.ok(card.key.length > 0, `${roleDef.key} card should have a key`)
        assert.ok(card.label.length > 0, `${roleDef.key} card should have a label`)
      }
    })
  }
})

// =========================================================================
// Test 13: 权限矩阵片段完整性
// =========================================================================
describe('权限矩阵片段完整性', () => {
  it('All 5 roles have permission snippets covering resources', () => {
    for (const { key } of TARGET_ROLES) {
      const config = getRoleBootstrapConfig(key)!
      assert.ok(config.permissionSnippets.length >= 2,
        `${key} should have ≥2 permission snippets`)
      const validScopes = ['platform', 'tenant', 'brand', 'store']
      for (const snippet of config.permissionSnippets) {
        assert.ok(validScopes.includes(snippet.scope),
          `${key} snippet "${snippet.resource}" has valid scope (got ${snippet.scope})`)
        assert.ok(snippet.actions.length > 0,
          `${key} snippet "${snippet.resource}" should have actions`)
      }
    }
  })
})

// =========================================================================
// Test 14: ROLE_BOOTSTRAP_CONFIGS 聚合正确
// =========================================================================
describe('ROLE_BOOTSTRAP_CONFIGS 聚合', () => {
  it('ROLE_BOOTSTRAP_CONFIGS contains all 5 target roles', () => {
    const keys = Object.keys(ROLE_BOOTSTRAP_CONFIGS)
    assert.equal(keys.length, 5)
    assert.ok(keys.includes('SUPER_ADMIN'))
    assert.ok(keys.includes('OPERATIONS'))
    assert.ok(keys.includes('FINANCE'))
    assert.ok(keys.includes('WAREHOUSE'))
    assert.ok(keys.includes('COACH'))
  })

  it('ROLE_BOOTSTRAP_CONFIGS entries match standalone exports', () => {
    assert.equal(ROLE_BOOTSTRAP_CONFIGS['SUPER_ADMIN'], SUPER_ADMIN_BOOTSTRAP)
    assert.equal(ROLE_BOOTSTRAP_CONFIGS['OPERATIONS'], OPERATIONS_BOOTSTRAP)
    assert.equal(ROLE_BOOTSTRAP_CONFIGS['FINANCE'], FINANCE_BOOTSTRAP)
    assert.equal(ROLE_BOOTSTRAP_CONFIGS['WAREHOUSE'], WAREHOUSE_BOOTSTRAP)
    assert.equal(ROLE_BOOTSTRAP_CONFIGS['COACH'], COACH_BOOTSTRAP)
  })
})

// =========================================================================
// Test 15: getRoleBootstrapConfig 边界
// =========================================================================
describe('getRoleBootstrapConfig 边界', () => {
  it('returns undefined for unknown role', () => {
    assert.equal(getRoleBootstrapConfig('GUIDE'), undefined)
    assert.equal(getRoleBootstrapConfig('CASHIER'), undefined)
    assert.equal(getRoleBootstrapConfig(''), undefined)
  })

  it('returns undefined for TENANT_ADMIN (不在新增5角色中)', () => {
    assert.equal(getRoleBootstrapConfig('TENANT_ADMIN'), undefined)
  })
})

// =========================================================================
// Test 16: NavItemPriority 枚举值
// =========================================================================
describe('NavItemPriority 枚举值', () => {
  it('has High/Medium/Low', () => {
    assert.equal(NavItemPriority.High, 'HIGH')
    assert.equal(NavItemPriority.Medium, 'MEDIUM')
    assert.equal(NavItemPriority.Low, 'LOW')
  })

  it('all config nav items use valid priorities', () => {
    const valid = new Set(Object.values(NavItemPriority))
    for (const config of Object.values(ROLE_BOOTSTRAP_CONFIGS)) {
      for (const item of config.extendedNavItems) {
        assert.ok(valid.has(item.priority),
          `nav item "${item.key}" has valid priority (got ${item.priority})`)
      }
    }
  })
})
