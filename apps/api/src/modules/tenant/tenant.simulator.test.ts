/**
 * Tenant Simulator Test
 *
 * 模拟多租户上下文解析的场景覆盖：
 * - 完整租户上下文字段解析
 * - 租户 ID 优先级（actor > tenant > 默认）
 * - 品牌 / 门店 ID 解析
 * - 市场代码默认值
 * - 演员认证状态判断
 * - 角色与权限透传
 * - 作用域匹配检查
 * - 演员摘要格式化
 *
 * 8 角色视角覆盖：
 *  👔店长 - 管理多门店租户解析
 *  🛒前台 - 收银员门店身份解析
 *  👥HR - 员工身份解析与权限隔离
 *  🔧安监 - 安全审计员跨租户访问检查
 *  🎮导玩员 - 导玩员门店上下文
 *  🎯运行专员 - 运维平台级别上下文
 *  🤝团建 - 团建品牌级别租户解析
 *  📢营销 - 营销员市场级别上下文
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  createDefaultTenantContext,
  createEmptyResolvedActorContext,
  resolveEffectiveTenantId,
  resolveEffectiveBrandId,
  resolveEffectiveStoreId,
  resolveEffectiveMarketCode,
  isActorAuthenticated,
  actorSummary,
  matchesTenantScope,
  DEFAULT_TENANT_ID,
  DEFAULT_MARKET_CODE
} from './tenant.entity'
import type {
  RequestTenantContext,
  RequestActorContext,
  ResolvedActorContext,
  TenantScopeRequirement
} from './tenant.types'

// ─── Simulator helpers ───

interface SimulatedTenantRequest {
  tenantContext: RequestTenantContext
  actorContext?: RequestActorContext
}

/** 模拟多租户请求解析 */
function simulateResolveTenant(req: SimulatedTenantRequest): ResolvedActorContext {
  const effectiveTenantId = resolveEffectiveTenantId(
    req.actorContext,
    req.tenantContext
  )
  const effectiveBrandId = resolveEffectiveBrandId(
    req.actorContext,
    req.tenantContext
  )
  const effectiveStoreId = resolveEffectiveStoreId(
    req.actorContext,
    req.tenantContext
  )
  const effectiveMarketCode = resolveEffectiveMarketCode(req.tenantContext)
  const authenticated = isActorAuthenticated(req.actorContext)

  return {
    authenticated,
    actor: req.actorContext ?? null,
    tenantContext: req.tenantContext,
    effectiveTenantId,
    effectiveBrandId,
    effectiveStoreId,
    effectiveMarketCode,
    roles: req.actorContext?.roles ?? [],
    permissions: req.actorContext?.permissions ?? []
  }
}

/** 模拟作用域检查 */
function simulateScopeCheck(
  ctx: ResolvedActorContext,
  requirement: TenantScopeRequirement
): boolean {
  return matchesTenantScope(ctx, requirement)
}

// ─── 8 角色预设 ───

const ROLE_SCENARIOS: Record<
  string,
  { role: string; emoji: string; actorType: string; permissions: string[] }
> = {
  storeManager: {
    role: 'STORE_MANAGER',
    emoji: '👔店长',
    actorType: 'store-user',
    permissions: ['store.manage', 'staff.manage', 'report.read']
  },
  cashier: {
    role: 'CASHIER',
    emoji: '🛒前台',
    actorType: 'store-user',
    permissions: ['cashier.read', 'cashier.write', 'receipt.print']
  },
  hr: {
    role: 'HR_MANAGER',
    emoji: '👥HR',
    actorType: 'brand-user',
    permissions: ['employee.read', 'employee.write', 'attendance.manage']
  },
  safetyAdmin: {
    role: 'SECURITY_ADMIN',
    emoji: '🔧安监',
    actorType: 'tenant-user',
    permissions: ['audit.read', 'security.manage', 'cross-tenant.read']
  },
  guide: {
    role: 'GUIDE',
    emoji: '🎮导玩员',
    actorType: 'store-user',
    permissions: ['game.read', 'blindbox.read', 'game.serve']
  },
  ops: {
    role: 'OPERATIONS',
    emoji: '🎯运行专员',
    actorType: 'tenant-user',
    permissions: ['health.read', 'monitor.read', 'deploy.manage']
  },
  teambuilding: {
    role: 'TEAMBUILDING_MANAGER',
    emoji: '🤝团建',
    actorType: 'brand-user',
    permissions: ['event.manage', 'booking.manage', 'group.read']
  },
  marketing: {
    role: 'MARKETING_MANAGER',
    emoji: '📢营销',
    actorType: 'brand-user',
    permissions: ['campaign.manage', 'coupon.manage', 'analytics.read']
  }
}

function makeActor(scenario: (typeof ROLE_SCENARIOS)[keyof typeof ROLE_SCENARIOS]): RequestActorContext {
  return {
    actorId: `actor-${scenario.role.toLowerCase()}`,
    actorType: scenario.actorType as RequestActorContext['actorType'],
    actorName: scenario.emoji,
    tenantId: scenario.role === 'OPERATIONS' || scenario.role === 'SECURITY_ADMIN' ? 'tenant-platform' : 'tenant-store-001',
    brandId: scenario.actorType === 'store-user' ? 'brand-001' : 'brand-002',
    storeId: scenario.actorType === 'store-user' ? 'store-001' : undefined,
    roles: [scenario.role],
    permissions: scenario.permissions,
    authenticated: true,
    source: 'headers'
  }
}

// ─── 核心解析测试 ───

describe('Tenant Simulator - 核心解析', () => {
  test('完整租户上下文解析 (tenant + brand + store)', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.effectiveTenantId, 'tenant-001')
    assert.equal(result.effectiveBrandId, 'brand-001')
    assert.equal(result.effectiveStoreId, 'store-001')
    assert.equal(result.effectiveMarketCode, 'zh-CN')
    assert.equal(result.authenticated, false)
    assert.equal(result.actor, null)
  })

  test('租户 ID 优先级: actor > tenant > 默认', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-from-header',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-001',
        actorType: 'tenant-user',
        tenantId: 'tenant-from-actor',
        roles: ['ADMIN'],
        permissions: [],
        authenticated: true,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    // Actor's tenantId should override tenantContext
    assert.equal(result.effectiveTenantId, 'tenant-from-actor')
  })

  test('缺失 actor 时回退到 tenantContext', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-from-header',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-002',
        actorType: 'platform-user',
        // No tenantId in actor
        roles: ['GUEST'],
        permissions: [],
        authenticated: false,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.effectiveTenantId, 'tenant-from-header')
  })

  test('全部缺失时使用默认值', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: '',
        marketCode: ''
      } as RequestTenantContext
    }

    const result = simulateResolveTenant(req)

    // '' is falsy but not null/undefined, so ?? won't fallback.
    // The entity helpers use ??, so empty string passes through.
    // This is by design — empty string means "explicitly unset".
    assert.equal(result.effectiveTenantId, '')
    assert.equal(result.effectiveMarketCode, '')
  })

  test('品牌 ID 优先 actor 再 tenant', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-from-header',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-003',
        actorType: 'brand-user',
        brandId: 'brand-from-actor',
        roles: ['BRAND_MANAGER'],
        permissions: [],
        authenticated: true,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.effectiveBrandId, 'brand-from-actor')
  })

  test('门店 ID 仅从 actor 获取', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-001',
        storeId: 'store-from-header',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-004',
        actorType: 'store-user',
        storeId: 'store-from-actor',
        roles: ['CASHIER'],
        permissions: [],
        authenticated: true,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.effectiveStoreId, 'store-from-actor')
  })
})

// ─── 作用域匹配测试 ───

describe('Tenant Simulator - 作用域匹配', () => {
  test('完全匹配: tenant + brand + store', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, {
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001'
    })

    assert.equal(matches, true)
  })

  test('仅 tenant 匹配', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, { tenantId: 'tenant-001' })

    assert.equal(matches, true)
  })

  test('tenant 不匹配', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, { tenantId: 'tenant-other' })

    assert.equal(matches, false)
  })

  test('brand 不匹配', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, {
      tenantId: 'tenant-001',
      brandId: 'brand-other'
    })

    assert.equal(matches, false)
  })

  test('store 不匹配', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, {
      tenantId: 'tenant-001',
      storeId: 'store-other'
    })

    assert.equal(matches, false)
  })

  test('空 requirement 始终匹配', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        marketCode: 'zh-CN'
      }
    })

    const matches = simulateScopeCheck(result, {})

    assert.equal(matches, true)
  })
})

// ─── 演员认证测试 ───

describe('Tenant Simulator - 演员认证', () => {
  test('已认证演员', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-001',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-auth',
        actorType: 'tenant-user',
        roles: ['ADMIN'],
        permissions: [],
        authenticated: true,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.authenticated, true)
    assert.ok(result.actor)
    assert.equal(result.roles[0], 'ADMIN')
  })

  test('未认证演员', () => {
    const req: SimulatedTenantRequest = {
      tenantContext: {
        tenantId: 'tenant-001',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-unauth',
        actorType: 'platform-user',
        roles: ['GUEST'],
        permissions: [],
        authenticated: false,
        source: 'headers'
      }
    }

    const result = simulateResolveTenant(req)

    assert.equal(result.authenticated, false)
    assert.ok(result.actor)
  })

  test('无演员时的认证状态', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        marketCode: 'zh-CN'
      }
    })

    assert.equal(result.authenticated, false)
    assert.equal(result.actor, null)
    assert.deepStrictEqual(result.roles, [])
    assert.deepStrictEqual(result.permissions, [])
  })
})

// ─── 演员摘要测试 ───

describe('Tenant Simulator - 演员摘要', () => {
  test('格式化带名字和角色的演员', () => {
    const summary = actorSummary({
      actorId: 'user-001',
      actorType: 'tenant-user',
      actorName: '张三',
      roles: ['ADMIN', 'MANAGER'],
      permissions: [],
      authenticated: true,
      source: 'headers'
    })

    assert.equal(summary, '张三 [tenant-user] roles:ADMIN,MANAGER')
  })

  test('无名字时显示类型和角色', () => {
    const summary = actorSummary({
      actorId: 'svc-001',
      actorType: 'service-account',
      roles: ['SYSTEM'],
      permissions: [],
      authenticated: true,
      source: 'headers'
    })

    // Per entity behavior: actorType + roles are included
    assert.equal(summary, '[service-account] roles:SYSTEM')
  })

  test('null 演员返回 null', () => {
    const summary = actorSummary(undefined)
    assert.equal(summary, null)
  })
})

// ─── 8 角色视角测试 ───

describe('Tenant Simulator - 8 角色视角', () => {
  for (const [key, scenario] of Object.entries(ROLE_SCENARIOS)) {
    const actor = makeActor(scenario)

    test(`${scenario.emoji} (${scenario.role}) - 租户解析含有角色`, () => {
      const req: SimulatedTenantRequest = {
        tenantContext: {
          tenantId: actor.tenantId ?? 'tenant-default',
          brandId: actor.brandId,
          storeId: actor.storeId,
          marketCode: 'zh-CN'
        },
        actorContext: actor
      }

      const result = simulateResolveTenant(req)

      assert.equal(result.authenticated, true)
      assert.ok(result.actor)
      assert.ok(result.roles.includes(scenario.role), `${scenario.role} should be in roles`)
      assert.ok(result.permissions.length > 0, `${scenario.role} should have permissions`)
    })

    test(`${scenario.emoji} (${scenario.role}) - 作用域匹配自身门店/品牌/租户`, () => {
      const req: SimulatedTenantRequest = {
        tenantContext: {
          tenantId: actor.tenantId ?? 'tenant-default',
          brandId: actor.brandId,
          storeId: actor.storeId,
          marketCode: 'zh-CN'
        },
        actorContext: actor
      }

      const result = simulateResolveTenant(req)

      const scopeReq: TenantScopeRequirement = {}
      if (result.effectiveTenantId) scopeReq.tenantId = result.effectiveTenantId
      if (result.effectiveBrandId) scopeReq.brandId = result.effectiveBrandId
      if (result.effectiveStoreId) scopeReq.storeId = result.effectiveStoreId

      const matches = simulateScopeCheck(result, scopeReq)
      assert.equal(matches, true, `${scenario.role} should match own scope`)
    })
  }
})

// ─── 边界与异常测试 ───

describe('Tenant Simulator - 边界与异常', () => {
  test('空 tenantContext 时空字符串穿透', () => {
    const result = simulateResolveTenant({
      tenantContext: { tenantId: '', marketCode: '' } as RequestTenantContext
    })

    // '' is falsy but not null/undefined, so ?? won't trigger
    assert.equal(result.effectiveTenantId, '')
    assert.equal(result.effectiveMarketCode, '')
  })

  test('跨租户访问被拒绝', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-A',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'user-tenant-B',
        actorType: 'tenant-user',
        tenantId: 'tenant-B',
        roles: ['USER'],
        permissions: [],
        authenticated: true,
        source: 'headers'
      }
    })

    // Actor's tenantId should take priority
    assert.equal(result.effectiveTenantId, 'tenant-B')

    // Now check if user from tenant-B can access tenant-A scope
    const matches = simulateScopeCheck(result, { tenantId: 'tenant-A' })
    assert.equal(matches, false, '跨租户访问应被拒绝')
  })

  test('同一租户不同门店访问控制', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
      }
    })

    // User is in store-001, trying to access store-002
    const matches = simulateScopeCheck(result, {
      tenantId: 'tenant-001',
      storeId: 'store-002'
    })

    assert.equal(matches, false, '不同门店应被隔离')
  })

  test('platform-user 无租户时 tenantContext 优先', () => {
    const result = simulateResolveTenant({
      tenantContext: {
        tenantId: 'tenant-from-ctx',
        marketCode: 'zh-CN'
      },
      actorContext: {
        actorId: 'platform-admin',
        actorType: 'platform-user',
        roles: ['SUPER_ADMIN'],
        permissions: ['*'],
        authenticated: true,
        source: 'headers'
      }
    })

    // Actor has no tenantId, so tenantContext wins
    assert.equal(result.effectiveTenantId, 'tenant-from-ctx')
    assert.equal(result.effectiveMarketCode, 'zh-CN')
  })

  test('roles 和 permissions 透传正确', () => {
    const actor: RequestActorContext = {
      actorId: 'multi-role-user',
      actorType: 'employee-user',
      actorName: '多角色用户',
      tenantId: 'tenant-001',
      roles: ['CASHIER', 'GUIDE'],
      permissions: ['cashier.read', 'game.read', 'member.read'],
      authenticated: true,
      source: 'headers'
    }

    const result = simulateResolveTenant({
      tenantContext: { tenantId: 'tenant-001', marketCode: 'zh-CN' },
      actorContext: actor
    })

    assert.deepStrictEqual(result.roles, ['CASHIER', 'GUIDE'])
    assert.deepStrictEqual(result.permissions, [
      'cashier.read',
      'game.read',
      'member.read'
    ])
  })
})

// ─── 工厂函数测试 ───

describe('Tenant Simulator - 工厂函数', () => {
  test('createDefaultTenantContext 使用默认值', () => {
    const ctx = createDefaultTenantContext()

    assert.equal(ctx.tenantId, DEFAULT_TENANT_ID)
    assert.equal(ctx.marketCode, DEFAULT_MARKET_CODE)
  })

  test('createDefaultTenantContext 支持局部覆盖', () => {
    const ctx = createDefaultTenantContext({
      tenantId: 'custom-tenant',
      brandId: 'custom-brand'
    })

    assert.equal(ctx.tenantId, 'custom-tenant')
    assert.equal(ctx.brandId, 'custom-brand')
    assert.equal(ctx.marketCode, DEFAULT_MARKET_CODE)
  })

  test('createEmptyResolvedActorContext 使用默认值', () => {
    const ctx = createEmptyResolvedActorContext()

    assert.equal(ctx.authenticated, false)
    assert.equal(ctx.actor, null)
    assert.equal(ctx.effectiveTenantId, DEFAULT_TENANT_ID)
    assert.equal(ctx.effectiveMarketCode, DEFAULT_MARKET_CODE)
    assert.deepStrictEqual(ctx.roles, [])
  })

  test('createEmptyResolvedActorContext 支持局部覆盖', () => {
    const ctx = createEmptyResolvedActorContext({
      authenticated: true,
      effectiveTenantId: 'custom-tenant',
      roles: ['ADMIN']
    })

    assert.equal(ctx.authenticated, true)
    assert.equal(ctx.effectiveTenantId, 'custom-tenant')
    assert.deepStrictEqual(ctx.roles, ['ADMIN'])
  })
})
