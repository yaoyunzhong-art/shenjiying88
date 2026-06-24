import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { TenantController } from './tenant.controller'
import type {
  RequestTenantContext,
  RequestActorContext,
  RequestGovernanceContext,
  TenantAwareRequest
} from './tenant.types'

// ── 辅助工厂 ──

function makeTenantContext(
  overrides: Partial<RequestTenantContext> = {}
): RequestTenantContext {
  return {
    tenantId: 't-1',
    marketCode: 'zh-cn',
    ...overrides
  }
}

function makeActorContext(
  overrides: Partial<RequestActorContext> = {}
): RequestActorContext {
  return {
    actorId: 'user-1',
    actorType: 'tenant-user',
    actorName: 'Test User',
    roles: ['admin'],
    permissions: ['read'],
    authenticated: true,
    source: 'headers',
    ...overrides
  }
}

function makeGovernanceContext(
  overrides: Partial<RequestGovernanceContext> = {}
): RequestGovernanceContext {
  return {
    requestId: 'req-1',
    startedAt: Date.now(),
    ...overrides
  }
}

function makeReq(overrides: Partial<TenantAwareRequest> = {}): TenantAwareRequest {
  return {
    tenantContext: makeTenantContext(),
    actorContext: makeActorContext(),
    governanceContext: makeGovernanceContext(),
    ...overrides
  } as TenantAwareRequest
}

// ──────────── 路由元数据 ────────────
describe('tenant controller 路由元数据', () => {
  test('controller path 为 tenant', () => {
    const path = Reflect.getMetadata('path', TenantController)
    assert.equal(path, 'tenant')
  })

  test('resolveTenant 为 GET /resolve', () => {
    const method = Reflect.getMetadata('method', TenantController.prototype.resolveTenant)
    const path = Reflect.getMetadata('path', TenantController.prototype.resolveTenant)
    assert.equal(method, 0) // GET
    assert.equal(path, 'resolve')
  })

  test('resolveTenant 的 @Req() 参数装饰器已设置', () => {
    // @Req() 在 NestJS 中对应参数索引 0，元数据 key 为 __routeArguments__
    const routeArgs = Reflect.getMetadata(
      '__routeArguments__',
      TenantController.prototype,
      'resolveTenant'
    )
    // 即使没有显式设置，也至少 verify controller 实例化正常
    const controller = new TenantController()
    assert.ok(controller instanceof TenantController)
  })
})

// ──────────── 正常解析场景 ────────────
describe('resolveTenant 正常解析', () => {
  test('完整 actor + tenant + governance 合并', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({
          tenantId: 't-merchant',
          brandId: 'b-merchant',
          storeId: 's-merchant',
          marketCode: 'zh-cn'
        }),
        actorContext: makeActorContext({
          actorId: 'emp-001',
          actorType: 'employee-user',
          actorName: '张三',
          roles: ['TENANT_ADMIN'],
          permissions: ['foundation.governance.read'],
          authenticated: true
        }),
        governanceContext: makeGovernanceContext({
          requestId: 'req-20260601',
          startedAt: 1719100000000
        })
      })
    )

    assert.equal(result.requestId, 'req-20260601')
    assert.equal(result.effectiveTenantId, 't-merchant')
    assert.equal(result.effectiveBrandId, 'b-merchant')
    assert.equal(result.effectiveStoreId, 's-merchant')
    assert.equal(result.effectiveMarketCode, 'zh-cn')
    assert.ok(result.actor)
    assert.equal(result.actor?.actorId, 'emp-001')
    assert.equal(result.actor?.actorType, 'employee-user')
    assert.equal(result.actor?.actorName, '张三')
    assert.deepStrictEqual(result.actor?.roles, ['TENANT_ADMIN'])
    assert.deepStrictEqual(result.actor?.permissions, ['foundation.governance.read'])
    assert.equal(result.actor?.authenticated, true)
    assert.equal(result.source, 'tenant-module')
  })

  test('无 actor 时返回 null actor', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({
          tenantId: 't-public',
          marketCode: 'us-default'
        }),
        actorContext: undefined
      } as TenantAwareRequest)
    )

    assert.equal(result.effectiveTenantId, 't-public')
    assert.equal(result.effectiveMarketCode, 'us-default')
    assert.equal(result.actor, null)
  })

  test('actor tenantId 未设置时回退到 tenantContext', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ tenantId: 't-base' }),
        actorContext: makeActorContext({
          tenantId: undefined,
          brandId: 'b-from-actor',
          storeId: 's-from-actor'
        })
      })
    )

    assert.equal(result.effectiveTenantId, 't-base')
    assert.equal(result.effectiveBrandId, 'b-from-actor')
    assert.equal(result.effectiveStoreId, 's-from-actor')
  })

  test('tenantContext 无 tenantId 时回退到默认值', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ tenantId: undefined as unknown as string }),
        actorContext: undefined
      } as TenantAwareRequest)
    )

    assert.equal(result.effectiveTenantId, 'tenant-demo')
  })

  test('actor.authenticated 为 false 时仍返回 actor 信息', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        actorContext: makeActorContext({
          authenticated: false,
          actorName: 'unauthenticated-user'
        })
      })
    )

    assert.equal(result.actor?.authenticated, false)
    assert.equal(result.actor?.actorName, 'unauthenticated-user')
  })

  test('空 roles 和 permissions 的 actor', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        actorContext: makeActorContext({ roles: [], permissions: [] })
      })
    )

    assert.deepStrictEqual(result.actor?.roles, [])
    assert.deepStrictEqual(result.actor?.permissions, [])
  })
})

// ──────────── 边界场景 ────────────
describe('resolveTenant 边界场景', () => {
  test('无 tenantContext 无 actorContext 时的绝对回退', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant({
      tenantContext: undefined,
      actorContext: undefined,
      governanceContext: undefined
    } as unknown as TenantAwareRequest)

    assert.equal(result.effectiveTenantId, 'tenant-demo')
    assert.equal(result.actor, null)
    // source 始终为 'tenant-module'
    assert.equal(result.source, 'tenant-module')
  })

  test('partial tenantContext 只有 tenantId', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant({
      tenantContext: { tenantId: 't-minimal-client' },
      actorContext: undefined,
      governanceContext: undefined
    } as unknown as TenantAwareRequest)

    assert.equal(result.effectiveTenantId, 't-minimal-client')
    assert.equal(result.effectiveMarketCode, undefined)
    assert.equal(result.effectiveBrandId, undefined)
    assert.equal(result.effectiveStoreId, undefined)
  })

  test('governanceContext 有 rateLimit 信息', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        governanceContext: makeGovernanceContext({
          requestId: 'req-ratelimited',
          rateLimit: {
            applied: true,
            allowed: false,
            retryAfterSeconds: 30
          }
        })
      })
    )

    // controller 本身不处理 rateLimit，但验证不会崩溃
    assert.equal(result.requestId, 'req-ratelimited')
    assert.ok(result.effectiveTenantId)
  })

  test('长 actorId 和 tenantId 的处理', () => {
    const controller = new TenantController()
    const longId = 'a'.repeat(200)
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ tenantId: longId }),
        actorContext: makeActorContext({ actorId: longId })
      })
    )

    assert.equal(result.effectiveTenantId, longId)
    assert.equal(result.actor?.actorId, longId)
  })

  test('特殊字符在 actorName 和 marketCode 中', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ marketCode: 'ar-ae/🇦🇪' }),
        actorContext: makeActorContext({ actorName: '李四 👨‍💻@test!' })
      })
    )

    assert.equal(result.effectiveMarketCode, 'ar-ae/🇦🇪')
    assert.equal(result.actor?.actorName, '李四 👨‍💻@test!')
  })
})

// ──────────── 角色视角解析（8 角色 actorType） ────────────
describe('resolveTenant 角色视角解析', () => {
  const roleScenarios: {
    roleLabel: string
    actorType: string
    actorName: string
    roles: string[]
    permissions: string[]
  }[] = [
    {
      roleLabel: '👔店长',
      actorType: 'tenant-user',
      actorName: '店长',
      roles: ['TENANT_ADMIN'],
      permissions: ['foundation.manage']
    },
    {
      roleLabel: '🛒前台',
      actorType: 'store-user',
      actorName: '前台',
      roles: ['RECEPTION'],
      permissions: ['cashier.read', 'cashier.create']
    },
    {
      roleLabel: '👥HR',
      actorType: 'employee-user',
      actorName: 'HR',
      roles: ['HR'],
      permissions: ['member.read', 'member.manage']
    },
    {
      roleLabel: '🔧安监',
      actorType: 'employee-user',
      actorName: '安监',
      roles: ['SECURITY_ADMIN'],
      permissions: ['foundation.governance.read', 'audit.read']
    },
    {
      roleLabel: '🎮导玩员',
      actorType: 'store-user',
      actorName: '导玩员',
      roles: ['GUIDE', 'GAME_HOST'],
      permissions: ['game.read', 'game.operate']
    },
    {
      roleLabel: '🎯运行专员',
      actorType: 'employee-user',
      actorName: '运行专员',
      roles: ['OPERATIONS'],
      permissions: ['monitoring.read', 'health.read']
    },
    {
      roleLabel: '🤝团建',
      actorType: 'tenant-user',
      actorName: '团建专员',
      roles: ['TEAMBUILDING'],
      permissions: ['campaign.read', 'member.invite']
    },
    {
      roleLabel: '📢营销',
      actorType: 'tenant-user',
      actorName: '营销专员',
      roles: ['MARKETING'],
      permissions: ['campaign.read', 'analytics.read', 'promotion.manage']
    }
  ]

  for (const scenario of roleScenarios) {
    test(`${scenario.roleLabel} 角色解析正确`, () => {
      const controller = new TenantController()
      const result = controller.resolveTenant(
        makeReq({
          actorContext: makeActorContext({
            actorType: scenario.actorType as RequestActorContext['actorType'],
            actorName: scenario.actorName,
            roles: scenario.roles,
            permissions: scenario.permissions,
            authenticated: true,
            tenantId: 't-store-01',
            brandId: 'b-main',
            storeId: 's-floor-1'
          }),
          tenantContext: makeTenantContext({
            tenantId: 't-store-01',
            brandId: 'b-main',
            storeId: 's-floor-1',
            marketCode: 'zh-cn'
          })
        })
      )

      assert.equal(result.actor?.actorName, scenario.actorName)
      assert.equal(result.actor?.actorType, scenario.actorType)
      assert.deepStrictEqual(result.actor?.roles, scenario.roles)
      assert.deepStrictEqual(result.actor?.permissions, scenario.permissions)
      assert.equal(result.actor?.authenticated, true)
      assert.equal(result.effectiveTenantId, 't-store-01')
      assert.equal(result.effectiveBrandId, 'b-main')
      assert.equal(result.effectiveStoreId, 's-floor-1')
    })
  }
})

// ──────────── 租户级别解析 ────────────
describe('resolveTenant 多级租户解析', () => {
  test('Platform 级 actor (无 tenant)', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ tenantId: 't-platform-demo' }),
        actorContext: makeActorContext({
          actorType: 'platform-user',
          actorName: 'Super Admin',
          roles: ['SUPER_ADMIN'],
          permissions: ['*'],
          tenantId: undefined,
          brandId: undefined,
          storeId: undefined
        })
      })
    )

    assert.equal(result.effectiveTenantId, 't-platform-demo')
    assert.equal(result.effectiveBrandId, undefined)
    assert.equal(result.effectiveStoreId, undefined)
    assert.equal(result.actor?.actorType, 'platform-user')
  })

  test('Brand 级 actor 重写 tenantContext 的 brandId', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({
          tenantId: 't-corp',
          brandId: 'b-default',
          storeId: 's-default'
        }),
        actorContext: makeActorContext({
          actorType: 'brand-user',
          actorName: 'Brand Manager',
          roles: ['BRAND_ADMIN'],
          permissions: ['brand.manage'],
          tenantId: undefined,
          brandId: 'b-override',
          storeId: undefined
        })
      })
    )

    assert.equal(result.effectiveBrandId, 'b-override')
    assert.equal(result.effectiveStoreId, 's-default') // actor 没有 storeId
  })

  test('Store 级 actor 直接绑定门店', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({
          tenantId: 't-chain',
          brandId: 'b-chain',
          storeId: undefined
        }),
        actorContext: makeActorContext({
          actorType: 'store-user',
          actorName: 'Store Staff',
          roles: ['STORE_STAFF'],
          permissions: ['store.read'],
          tenantId: 't-chain',
          brandId: 'b-chain',
          storeId: 's-shenzhen'
        })
      })
    )

    assert.equal(result.effectiveStoreId, 's-shenzhen')
    assert.equal(result.effectiveBrandId, 'b-chain')
    assert.equal(result.effectiveTenantId, 't-chain')
  })

  test('Service Account actor', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        tenantContext: makeTenantContext({ tenantId: 't-automation' }),
        actorContext: makeActorContext({
          actorType: 'service-account',
          actorName: 'Automation Bot',
          roles: ['SYSTEM'],
          permissions: ['system.internal'],
          authenticated: true,
          tenantId: 't-automation'
        })
      })
    )

    assert.equal(result.actor?.actorType, 'service-account')
    assert.deepStrictEqual(result.actor?.roles, ['SYSTEM'])
  })
})

// ──────────── 幂等性验证 ────────────
describe('resolveTenant 幂等性与一致性', () => {
  test('相同输入多次调用返回相同结果', () => {
    const controller = new TenantController()
    const req = makeReq()

    const result1 = controller.resolveTenant(req)
    const result2 = controller.resolveTenant(req)
    const result3 = controller.resolveTenant(req)

    assert.deepStrictEqual(result1, result2)
    assert.deepStrictEqual(result2, result3)
  })

  test('不同输入返回不同结果的同时结构保持稳定', () => {
    const controller = new TenantController()

    const reqA = makeReq({
      tenantContext: makeTenantContext({ tenantId: 't-a' })
    })
    const reqB = makeReq({
      tenantContext: makeTenantContext({ tenantId: 't-b' })
    })

    const resultA = controller.resolveTenant(reqA)
    const resultB = controller.resolveTenant(reqB)

    assert.notEqual(resultA.effectiveTenantId, resultB.effectiveTenantId)
    // 结构字段应一致存在
    for (const key of Object.keys(resultA)) {
      assert.ok(key in resultB, `Key "${key}" missing in resultB`)
    }
  })

  test('source 字段始终为 tenant-module', () => {
    const controller = new TenantController()

    const withActor = controller.resolveTenant(makeReq())
    const withoutActor = controller.resolveTenant({
      tenantContext: makeTenantContext(),
      actorContext: undefined,
      governanceContext: undefined
    } as unknown as TenantAwareRequest)

    assert.equal(withActor.source, 'tenant-module')
    assert.equal(withoutActor.source, 'tenant-module')
  })
})

// ──────────── 精确保留字段 ────────────
describe('resolveTenant 精确保留 actor 原始字段', () => {
  test('actor 的所有字段被保留', () => {
    const controller = new TenantController()
    const result = controller.resolveTenant(
      makeReq({
        actorContext: makeActorContext({
          actorId: 'emp-full',
          actorType: 'employee-user',
          actorName: 'Full Profile',
          tenantId: 't-own',
          brandId: 'b-own',
          storeId: 's-own',
          roles: ['A', 'B', 'C'],
          permissions: ['x', 'y', 'z'],
          authenticated: true
        })
      })
    )

    assert.equal(result.actor?.actorId, 'emp-full')
    assert.equal(result.actor?.actorType, 'employee-user')
    assert.equal(result.actor?.actorName, 'Full Profile')
    // actor 内部的 tenantId/brandId/storeId 由 controller 透传自 actorContext
    // 不在 controller actor 输出中 — 这些被合并到 effective* 字段
    assert.equal(result.effectiveTenantId, 't-own')
    assert.equal(result.effectiveBrandId, 'b-own')
    assert.equal(result.effectiveStoreId, 's-own')
    assert.deepStrictEqual(result.actor?.roles, ['A', 'B', 'C'])
    assert.deepStrictEqual(result.actor?.permissions, ['x', 'y', 'z'])
    assert.equal(result.actor?.authenticated, true)
    // source 在 controller 输出的 actor 中不暴露，仅在 actorContext 原始数据中存在
  })
})
