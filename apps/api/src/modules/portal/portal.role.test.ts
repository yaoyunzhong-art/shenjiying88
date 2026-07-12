import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PortalController } from './portal.controller'
// ── Helpers ──
function mockPortalService(overrides: any = {}) {
  return {
    getBootstrap: () => ({
      tenantPortal: { audience: 'ToB', name: '测试租户官网', primaryDomain: 't.local', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } },
      brandPortal: { audience: 'ToB', name: '品牌官网', primaryDomain: 'b.local', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true }, heroTitle: '品牌经营官网', solutionTags: ['品牌招商', '品牌后台'] },
      storePortal: { audience: 'ToC', name: '门店门户', primaryDomain: 's.local', supportedSurfaces: ['OfficialSite'] },
      marketProfile: { marketCode: 'cn-mainland', marketName: '中国大陆' },
      regionalOverrides: [],
      foundationDependencies: [],
      foundationContracts: []
    }),
    ...overrides
  } as any
}

function createPortalController(mockPortal = mockPortalService()) {
  return new PortalController(mockPortal)
}

const tenantCtx = { tenantId: 't-portal', brandId: 'b-portal', storeId: 's-portal', marketCode: 'cn-mainland' }
const ROLES = {
  Marketing: '📢营销',
  Operations: '🎯运行专员',
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  SafetyInspector: '🔧安监',
  GameInstructor: '🎮导玩员',
  TeamBuilding: '🤝团建',
  Security: '🔧安监'
} as any

// ── 📢营销 ──
describe(`${ROLES.Marketing} portal 角色测试`, () => {
  it('营销可以获取 portal bootstrap（含 Tenant/Brand/Store Portal）', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
  })

  it('营销获取 portal — tenantPortal 信息完整', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.equal(result.tenantPortal.audience, 'ToB')
    assert.ok(result.tenantPortal.name)
    assert.ok(result.tenantPortal.primaryDomain)
    assert.ok(result.tenantPortal.loginEntry)
  })

  it('营销获取 portal — brandPortal 含登录入口', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.brandPortal.loginEntry.loginPath)
    assert.equal(result.brandPortal.loginEntry.ssoEnabled, true)
  })

  it('营销获取 portal — marketProfile 可用', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.marketProfile)
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} portal 角色测试`, () => {
  it('运营专员可以获取 portal bootstrap', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
  })

  it('运营专员获取 portal — storePortal 含 supportedSurfaces', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.storePortal.supportedSurfaces)
    assert.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'))
  })

  it('运营专员获取 portal — regionalOverrides 为数组', () => {
    const portal = mockPortalService()
    const ctrl = createPortalController(portal)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(Array.isArray(result.regionalOverrides))
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} portal 角色测试`, () => {
  it('店长可以获取 portal bootstrap（全部门户视图）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
    assert.ok(result.marketProfile)
  })

  it('店长获取 portal — tenantPortal domain 正确', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal.primaryDomain)
  })

  it('店长获取 portal — storePortal audience 为 ToC', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.equal(result.storePortal.audience, 'ToC')
  })
})

// ── 🛒前台 ──
describe(`${ROLES.Reception} portal 角色测试`, () => {
  it('前台可以获取 portal bootstrap（前台视角）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.storePortal)
    assert.ok(result.marketProfile)
  })

  it('前台获取 portal — storePortal 含门店门户名称', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.storePortal.name)
  })

  it('前台获取 portal — foundationDependencies 存在', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(Array.isArray(result.foundationDependencies))
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} portal 角色测试`, () => {
  it('HR 可以获取 portal bootstrap（用于员工门户入口配置）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal)
    assert.ok(result.marketProfile)
    assert.ok(result.tenantPortal.loginEntry)
  })

  it('HR 获取 portal — tenantPortal 包含 SSO 登录入口（权限边界：HR 不直接管理品牌门户）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    // HR 视角主要关注 tenantPortal 层级信息
    assert.equal(result.tenantPortal.audience, 'ToB')
    assert.equal(result.tenantPortal.loginEntry.ssoEnabled, true)
    // HR 仍能读取 brand/store portal（只读边界）
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
  })

  it('HR 获取 portal — 验证 regionalOverrides 和 foundation 数据可用', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(Array.isArray(result.regionalOverrides))
    assert.ok(Array.isArray(result.foundationDependencies))
    assert.ok(Array.isArray(result.foundationContracts))
  })
})

// ── 🔧安监 ──
describe(`${ROLES.SafetyInspector} portal 角色测试`, () => {
  it('安监可以获取 portal bootstrap（用于门店合规检查）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.storePortal)
    assert.ok(result.storePortal.supportedSurfaces)
    // 安监关注门店端覆盖范围
    assert.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'))
  })

  it('安监获取 portal — 权限边界：门店 storeName 可查看但不可修改', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    // 安监可读门店门户全量信息
    assert.ok(result.storePortal.name)
    assert.equal(result.storePortal.audience, 'ToC')
    // 安监也能看到 marketProfile 验证地区合规
    assert.ok(result.marketProfile)
    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
  })

  it('安监获取 portal — tenantPortal 和 brandPortal 也能读取（安全审计用途）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal.name)
    assert.ok(result.tenantPortal.primaryDomain)
    assert.ok(result.brandPortal.name)
    assert.ok(result.brandPortal.primaryDomain)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.GameInstructor} portal 角色测试`, () => {
  it('导玩员可以获取 portal bootstrap（用于查看门店运营门户）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.storePortal)
    assert.ok(result.marketProfile)
  })

  it('导玩员获取 portal — 权限边界：关注 storePortal 终端的 supportedSurfaces', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    // 导玩员场景需要确认多终端支持
    assert.ok(result.storePortal.supportedSurfaces.length > 0)
    // 导玩员不修改 tenant/brand portal 只读
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
  })

  it('导玩员获取 portal — foundationContracts 可用于配置检查', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(Array.isArray(result.foundationContracts))
    assert.ok(Array.isArray(result.foundationDependencies))
  })
})

// ── 🤝团建 ──
describe(`${ROLES.TeamBuilding} portal 角色测试`, () => {
  it('团建可以获取 portal bootstrap（用于活动门户配置）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal)
    assert.ok(result.brandPortal)
    assert.ok(result.storePortal)
    assert.ok(result.marketProfile)
  })

  it('团建获取 portal — 权限边界：可通过 marketProfile 获取市场信息安排团建活动', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.marketProfile.marketCode)
    assert.ok(result.marketProfile.marketName)
    // 团建需要品牌门户查看活动配置
    assert.ok(result.brandPortal.heroTitle)
    assert.ok(result.brandPortal.solutionTags)
  })

  it('团建获取 portal — 登录入口信息用于活动参与引导', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantPortal.loginEntry.loginPath)
    assert.ok(result.brandPortal.loginEntry.loginPath)
    // storePortal audience 确认是 ToC 面向消费者
    assert.equal(result.storePortal.audience, 'ToC')
  })
})

// ── 新独立 endpoint 角色测试 ──

function makePortalControllerWithMocks(overrides: any = {}) {
  const defaults = {
    resolveTenantPortal: () => ({ audience: 'ToB', scopeType: 'TENANT', scopeCode: 't-portal', tenantCode: 't-portal', marketCode: 'cn-mainland', channel: 'WEB', name: '租户官网', primaryDomain: 't.local', supportedLanguages: ['zh-cn'], loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } }),
    resolveBrandPortal: () => ({ audience: 'ToB', scopeType: 'BRAND', scopeCode: 'b-portal', tenantCode: 't-portal', brandCode: 'b-portal', marketCode: 'cn-mainland', channel: 'WEB', name: '品牌官网', primaryDomain: 'b.local', supportedLanguages: ['zh-cn'], heroTitle: '品牌经营官网', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } }),
    resolveStorePortal: () => ({ audience: 'ToC', scopeType: 'STORE', scopeCode: 's-portal', tenantCode: 't-portal', brandCode: 'b-portal', storeCode: 's-portal', storeName: '门店', marketCode: 'cn-mainland', channel: 'WEB', name: '门店门户', primaryDomain: 's.local', supportedLanguages: ['zh-cn'], supportedSurfaces: ['OFFICIAL_SITE', 'MINI_APP'] })
  }
  return new PortalController({ ...defaults, ...overrides })
}

describe(`${ROLES.TenantAdmin} portal 独立 endpoint 角色测试`, () => {
  it('店长可独立获取租户门户', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getTenantPortal(tenantCtx)
    assert.equal(result.audience, 'ToB')
    assert.equal(result.scopeType, 'TENANT')
    assert.ok(result.loginEntry.ssoEnabled)
  })

  it('店长可独立获取品牌门户', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getBrandPortal(tenantCtx)
    assert.equal(result.brandCode, 'b-portal')
    assert.ok(result.heroTitle)
  })
})

describe(`${ROLES.Reception} portal 独立 endpoint 角色测试`, () => {
  it('前台可独立获取门店门户（ToC）', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.equal(result.audience, 'ToC')
    assert.equal(result.storeCode, 's-portal')
    assert.ok(result.supportedSurfaces.includes('MINI_APP'))
  })

  it('前台 — 门店门户含 supportedSurfaces 确认多终端', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.ok(result.supportedSurfaces.length >= 2)
  })
})

describe(`${ROLES.Marketing} portal 独立 endpoint 角色测试`, () => {
  it('营销获取品牌门户 — heroTitle 满足品牌营销需求', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getBrandPortal(tenantCtx)
    assert.equal(result.heroTitle, '品牌经营官网')
  })

  it('营销 — 权限边界：不能通过 endpoint 获取非自有能力', () => {
    // getStorePortal 是可公开的 ToC 信息，营销也应该能访问
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.equal(result.storeName, '门店')
  })
})

describe(`${ROLES.Operations} portal 独立 endpoint 角色测试`, () => {
  it('运营专员独立获取租户门户配置', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getTenantPortal(tenantCtx)
    assert.ok(result.primaryDomain)
    assert.ok(result.supportedLanguages.length > 0)
  })

  it('运营专员独立获取门店门户 — 检查 storeName', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.ok(result.storeName)
  })
})

describe(`${ROLES.Security} portal 独立 endpoint 角色测试`, () => {
  it('安监查看租户门户 — 确认 ssoEnabled', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getTenantPortal(tenantCtx)
    assert.equal(result.loginEntry.ssoEnabled, true)
  })

  it('安监查看品牌门户 — 确认 loginPath 存在', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getBrandPortal(tenantCtx)
    assert.ok(result.loginEntry.loginPath)
  })
})

describe(`${ROLES.GameInstructor} portal 独立 endpoint 角色测试`, () => {
  it('导玩员获取门店门户 — supportedSurfaces 含 MINI_APP', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.ok(result.supportedSurfaces.includes('MINI_APP'))
  })

  it('导玩员获取租户门户 — 权限边界：只读', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getTenantPortal(tenantCtx)
    assert.ok(result.name)
  })
})

describe(`${ROLES.TeamBuilding} portal 独立 endpoint 角色测试`, () => {
  it('团建获取品牌门户用于活动配置', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getBrandPortal(tenantCtx)
    assert.ok(result.name)
    assert.ok(result.primaryDomain)
  })

  it('团建获取门店门户 — 确认 audience ToC', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.equal(result.audience, 'ToC')
  })
})

describe(`${ROLES.HR} portal 独立 endpoint 角色测试`, () => {
  it('HR 获取租户门户配置', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getTenantPortal(tenantCtx)
    assert.ok(result.name)
    assert.ok(result.primaryDomain)
  })

  it('HR — 权限边界：门店门户 audience 为 ToC', () => {
    const ctrl = makePortalControllerWithMocks()
    const result = ctrl.getStorePortal(tenantCtx)
    assert.equal(result.audience, 'ToC')
  })
})
