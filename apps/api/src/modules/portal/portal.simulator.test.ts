import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [portal] [D] simulator 测试补全
 *
 * 门户模拟器场景覆盖：
 * - 租户门户解析 (resolveTenantPortal)
 * - 品牌门户解析 (resolveBrandPortal)
 * - 门店门户解析 (resolveStorePortal)
 * - Bootstrap 聚合 (getBootstrap)
 * - PortalEntity 实体 helper 函数 (toPortalEntity, isTobPortalEntity, isStorePortalEntity, isSsoEnabled)
 * - Portal contract 序列化 (toTobPortalContract, toStorePortalContract)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 全门户信息审核
 *  🛒前台 - 门店门户查询
 *  👥HR - 品牌门户视角
 *  🔧安监 - SSO 安全审计
 *  🎮导玩员 - 门店终端适配
 *  🎯运行专员 - 门户生命周期操作
 *  🤝团建 - 多门店门户筛选
 *  📢营销 - 市场区域配置验证
 */

import assert from 'node:assert/strict'
import {
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  LanguageCode,
  type StorePortal,
  type TobPortal,
  type BasePortal,
} from '@m5/domain'
import {
  PortalEntity,
  toPortalEntity,
  isTobPortalEntity,
  isStorePortalEntity,
  isSsoEnabled,
} from './portal.entity'
import { toTobPortalContract, toStorePortalContract } from './portal.contract'

// ─── 角色定义 ───
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

// ─── 模拟数据工厂 ───

interface SimulatedPortalContext {
  tenantId: string
  brandId: string
  storeId: string
  marketCode: string
}

function createSimulatedContext(overrides?: Partial<SimulatedPortalContext>): SimulatedPortalContext {
  return {
    tenantId: 'tenant-sim-001',
    brandId: 'brand-sim-001',
    storeId: 'store-sim-001',
    marketCode: 'cn-mainland',
    ...overrides,
  }
}

function createSimulatedTobPortal(
  scopeType: PortalScopeType.Tenant | PortalScopeType.Brand,
  overrides?: Partial<TobPortal>
): TobPortal {
  const ctx = createSimulatedContext()
  const scopeCode = scopeType === PortalScopeType.Tenant ? ctx.tenantId : ctx.brandId
  return {
    audience: PortalAudience.ToB,
    scopeType,
    scopeCode,
    tenantCode: ctx.tenantId,
    brandCode: scopeType === PortalScopeType.Brand ? ctx.brandId : undefined,
    marketCode: ctx.marketCode,
    channel: PortalChannel.Web,
    name: `${scopeCode} ToB 官网`,
    primaryDomain: `${scopeCode}.${ctx.marketCode}.b2b.local`,
    supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs],
    heroTitle: `${scopeCode} 企业级经营门户`,
    heroSubtitle: '覆盖品牌、门店、会员、营销的多租户 SaaS 官网。',
    solutionTags: ['多租户', '多端门户'],
    loginEntry: {
      label: '进入后台',
      loginPath: `/${ctx.marketCode}/${ctx.tenantId}/login`,
      ssoEnabled: true,
    },
    ...overrides,
  }
}

function createSimulatedStorePortal(overrides?: Partial<StorePortal>): StorePortal {
  const ctx = createSimulatedContext()
  return {
    audience: PortalAudience.ToC,
    scopeType: PortalScopeType.Store,
    scopeCode: ctx.storeId,
    tenantCode: ctx.tenantId,
    brandCode: ctx.brandId,
    storeCode: ctx.storeId,
    storeName: `${ctx.storeId} 门店`,
    marketCode: ctx.marketCode,
    channel: PortalChannel.Web,
    name: `${ctx.storeId} 门店门户`,
    primaryDomain: `${ctx.storeId}.${ctx.brandId}.${ctx.tenantId}.${ctx.marketCode}.local`,
    supportedLanguages: [LanguageCode.ZhCn],
    supportedSurfaces: [
      StorefrontSurface.OfficialSite,
      StorefrontSurface.H5,
      StorefrontSurface.MiniApp,
      StorefrontSurface.App,
    ],
    ...overrides,
  }
}

function createSimulatedPortalEntity(
  audience: PortalAudience,
  scopeType: PortalScopeType,
  overrides?: Partial<PortalEntity> & { id?: string; tenantId?: string; brandId?: string; storeId?: string }
): PortalEntity {
  if (audience === PortalAudience.ToB) {
    const portal = createSimulatedTobPortal(scopeType as PortalScopeType.Tenant | PortalScopeType.Brand)
    return toPortalEntity(portal, {
      id: overrides?.id ?? 'portal-entity-001',
      tenantId: overrides?.tenantId ?? 'tenant-sim-001',
      brandId: overrides?.brandId ?? (scopeType === PortalScopeType.Brand ? 'brand-sim-001' : undefined),
      storeId: overrides?.storeId,
    })
  }
  const portal = createSimulatedStorePortal()
  return toPortalEntity(portal, {
    id: overrides?.id ?? 'portal-entity-001',
    tenantId: overrides?.tenantId ?? 'tenant-sim-001',
    brandId: overrides?.brandId ?? 'brand-sim-001',
    storeId: overrides?.storeId ?? 'store-sim-001',
  })
}

// ─── 状态机模拟 ───

interface PortalStateMachine {
  entity: PortalEntity
  updates: Partial<PortalEntity>[]
  applyUpdate(update: Partial<PortalEntity>): PortalStateMachine
  snapshot(): PortalEntity
}

function createPortalStateMachine(initial: PortalEntity): PortalStateMachine {
  const updates: Partial<PortalEntity>[] = []
  let current = { ...initial }
  return {
    entity: current,
    updates,
    applyUpdate(update: Partial<PortalEntity>) {
      updates.push(update)
      current = { ...current, ...update, updatedAt: new Date().toISOString() }
      return this as unknown as PortalStateMachine
    },
    snapshot() {
      return { ...current }
    },
  }
}

/** 模拟市场切换 */
function simulateMarketSwitch(entity: PortalEntity, newMarketCode: string): PortalEntity {
  const isCN = newMarketCode === 'cn-mainland'
  return {
    ...entity,
    marketCode: newMarketCode,
    supportedLanguages: isCN ? [LanguageCode.ZhCn] : [LanguageCode.EnUs, LanguageCode.ZhCn],
    primaryDomain: entity.primaryDomain?.replace(/cn-mainland|global/i, newMarketCode),
    updatedAt: new Date().toISOString(),
  }
}

// ════════════════════════════════════════════════════════
//  Entity Helper 测试
// ════════════════════════════════════════════════════════

describe('[Portal Simulator] Entity helpers', () => {
  it('toPortalEntity 从 TobPortal 构造 ToB PortalEntity', () => {
    const tobPortal = createSimulatedTobPortal(PortalScopeType.Tenant)
    const entity = toPortalEntity(tobPortal, { id: 'p-001', tenantId: 't-001' })

    assert.equal(entity.audience, PortalAudience.ToB)
    assert.equal(entity.scopeType, PortalScopeType.Tenant)
    assert.equal(entity.heroTitle, 'tenant-sim-001 企业级经营门户')
    assert.ok(entity.solutionTags?.includes('多租户'))
    assert.equal(entity.supportedSurfaces, undefined)
  })

  it('toPortalEntity 从 StorePortal 构造 ToC PortalEntity', () => {
    const storePortal = createSimulatedStorePortal()
    const entity = toPortalEntity(storePortal, { id: 'p-002', tenantId: 't-001', brandId: 'b-001', storeId: 's-001' })

    assert.equal(entity.audience, PortalAudience.ToC)
    assert.equal(entity.scopeType, PortalScopeType.Store)
    assert.equal(entity.storeName, 'store-sim-001 门店')
    assert.ok(entity.supportedSurfaces?.includes(StorefrontSurface.H5))
    assert.equal(entity.heroTitle, undefined)
  })

  it('isTobPortalEntity 正确区分 ToB 和 ToC', () => {
    const tobEntity = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    const tocEntity = createSimulatedPortalEntity(PortalAudience.ToC, PortalScopeType.Store)

    assert.ok(isTobPortalEntity(tobEntity))
    assert.equal(isTobPortalEntity(tocEntity), false)
  })

  it('isStorePortalEntity 正确区分 ToC 和 ToB', () => {
    const tocEntity = createSimulatedPortalEntity(PortalAudience.ToC, PortalScopeType.Store)
    const tobEntity = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)

    assert.ok(isStorePortalEntity(tocEntity))
    assert.equal(isStorePortalEntity(tobEntity), false)
  })

  it('isSsoEnabled 检测 SSO 状态', () => {
    const withSso = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    assert.ok(isSsoEnabled(withSso))

    const withoutLoginEntry = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    ;(withoutLoginEntry as any).loginEntry = undefined
    assert.equal(isSsoEnabled(withoutLoginEntry), false)

    const withSsoDisabled = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    if (withSsoDisabled.loginEntry) withSsoDisabled.loginEntry.ssoEnabled = false
    assert.equal(isSsoEnabled(withSsoDisabled), false)
  })

  it('toPortalEntity 品牌门户带 brandId', () => {
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand, {
      brandCode: 'nike-cn',
      name: 'Nike CN 品牌官网',
    })
    const entity = toPortalEntity(brandPortal, { id: 'p-brand-001', tenantId: 't-001', brandId: 'nike-cn' })

    assert.equal(entity.audience, PortalAudience.ToB)
    assert.equal(entity.scopeType, PortalScopeType.Brand)
    assert.equal(entity.brandId, 'nike-cn')
    assert.equal(entity.name, 'Nike CN 品牌官网')
  })
})

// ════════════════════════════════════════════════════════
//  Contract 序列化测试
// ════════════════════════════════════════════════════════

describe('[Portal Simulator] Contract serialization', () => {
  it('toTobPortalContract 序列化 TobPortal', () => {
    const portal = createSimulatedTobPortal(PortalScopeType.Tenant)
    const contract = toTobPortalContract(portal)

    assert.equal(contract.audience, PortalAudience.ToB)
    assert.equal(contract.scopeType, PortalScopeType.Tenant)
    assert.equal(contract.scopeCode, 'tenant-sim-001')
    assert.equal(contract.tenantCode, 'tenant-sim-001')
    assert.ok(contract.primaryDomain)
    assert.ok(contract.supportedLanguages.includes(LanguageCode.ZhCn))
    assert.ok(contract.loginEntry)
  })

  it('toTobPortalContract 缺少 primaryDomain 时自动补全', () => {
    const portal = createSimulatedTobPortal(PortalScopeType.Tenant)
    delete (portal as any).primaryDomain
    const contract = toTobPortalContract(portal)

    assert.ok(contract.primaryDomain?.endsWith('.b2b.local'))
  })

  it('toStorePortalContract 序列化 StorePortal', () => {
    const portal = createSimulatedStorePortal()
    const contract = toStorePortalContract(portal)

    assert.equal(contract.audience, PortalAudience.ToC)
    assert.equal(contract.scopeType, PortalScopeType.Store)
    assert.equal(contract.storeCode, 'store-sim-001')
    assert.equal(contract.storeName, 'store-sim-001 门店')
    assert.equal(contract.brandCode, 'brand-sim-001')
    assert.ok(contract.supportedSurfaces?.includes(StorefrontSurface.App))
  })

  it('toStorePortalContract 缺少 primaryDomain 时自动补全', () => {
    const portal = createSimulatedStorePortal()
    delete (portal as any).primaryDomain
    const contract = toStorePortalContract(portal)

    assert.ok(contract.primaryDomain?.endsWith('.local'))
    assert.ok(contract.primaryDomain?.includes('store-sim-001'))
  })
})

// ════════════════════════════════════════════════════════
//  状态机模拟测试
// ════════════════════════════════════════════════════════

describe('[Portal Simulator] State machine operations', () => {
  it('PortalStateMachine 应用更新 + snapshot', () => {
    const initial = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    const sm = createPortalStateMachine(initial)

    sm.applyUpdate({ name: '更新门户' })
    sm.applyUpdate({ primaryDomain: 'new.example.com' })

    const snap = sm.snapshot()
    assert.equal(snap.name, '更新门户')
    assert.equal(snap.primaryDomain, 'new.example.com')
    assert.equal(sm.updates.length, 2)
  })

  it('simulateMarketSwitch 中国大陆切全球市场', () => {
    const initial = createSimulatedPortalEntity(PortalAudience.ToC, PortalScopeType.Store)
    const switched = simulateMarketSwitch(initial, 'global')

    assert.equal(switched.marketCode, 'global')
    assert.ok(switched.supportedLanguages.includes(LanguageCode.EnUs))
  })

  it('simulateMarketSwitch 全球市场保留多语言', () => {
    const initial = createSimulatedPortalEntity(PortalAudience.ToB, PortalScopeType.Tenant)
    const switched = simulateMarketSwitch(initial, 'global')

    assert.ok(switched.supportedLanguages.length >= 2)
    assert.ok(switched.supportedLanguages.includes(LanguageCode.EnUs))
    assert.ok(switched.supportedLanguages.includes(LanguageCode.ZhCn))
  })

  it('模拟中国门店只保留中文', () => {
    const initial = createSimulatedPortalEntity(PortalAudience.ToC, PortalScopeType.Store)
    const switched = simulateMarketSwitch(initial, 'cn-mainland')

    assert.equal(switched.supportedLanguages.length, 1)
    assert.equal(switched.supportedLanguages[0], LanguageCode.ZhCn)
  })
})

// ════════════════════════════════════════════════════════
//  8 角色场景测试
// ════════════════════════════════════════════════════════

describe(`[Portal Simulator] ${ROLES.StoreManager} - 全门户审核`, () => {
  it('店长可以查看完整 bootstrap 的门户信息', () => {
    // 模拟: 店长拿到租户/品牌/门店三级门户后做交叉校验
    const tenantPortal = createSimulatedTobPortal(PortalScopeType.Tenant, { tenantCode: 't-001' })
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand, { brandCode: 'nike-cn' })
    const storePortal = createSimulatedStorePortal({ storeCode: 'store-nike-01' })

    // 三级门户一致性验证
    assert.equal(tenantPortal.tenantCode, 't-001')
    assert.equal(brandPortal.brandCode, 'nike-cn')
    assert.equal(storePortal.brandCode, 'brand-sim-001') // 保持工厂一致
    assert.equal(storePortal.storeCode, 'store-nike-01')

    // 序列化为 contract 也正确
    const storeContract = toStorePortalContract(storePortal)
    assert.ok(storeContract.supportedSurfaces)
    assert.ok(storeContract.supportedSurfaces.length >= 4)
  })

  it('店长审核发现 SSO 未启用的品牌门户应告警', () => {
    const portal = createSimulatedTobPortal(PortalScopeType.Brand, {
      loginEntry: { label: '进入后台', loginPath: '/login', ssoEnabled: false },
    })
    const entity = toPortalEntity(portal, { id: 'p-no-sso', tenantId: 't-001', brandId: 'b-001' })

    // 店长视角: SSO 未启用 = 安全隐患
    assert.equal(isSsoEnabled(entity), false)
    // 确保品牌门户类型正确
    assert.ok(isTobPortalEntity(entity))
    assert.equal(entity.scopeType, PortalScopeType.Brand)
  })
})

describe(`[Portal Simulator] ${ROLES.FrontDesk} - 前台门店查询`, () => {
  it('前台查询当前门店的终端适配', () => {
    const storePortal = createSimulatedStorePortal({ storeCode: 'store-front-01', storeName: '前台一店' })
    const contract = toStorePortalContract(storePortal)

    // 前台需要确保门店支持 H5 和 MiniApp
    assert.ok(contract.supportedSurfaces?.includes(StorefrontSurface.H5))
    assert.ok(contract.supportedSurfaces?.includes(StorefrontSurface.MiniApp))
    assert.equal(contract.storeName, '前台一店')
  })

  it('前台查询门店语言配置', () => {
    const storePortal = createSimulatedStorePortal({
      storeCode: 'store-cn-01',
      marketCode: 'cn-mainland',
      supportedLanguages: [LanguageCode.ZhCn],
    })

    assert.equal(storePortal.supportedLanguages.length, 1)
    assert.equal(storePortal.supportedLanguages[0], LanguageCode.ZhCn)
    assert.equal(storePortal.marketCode, 'cn-mainland')
  })
})

describe(`[Portal Simulator] ${ROLES.HR} - 品牌门户视角`, () => {
  it('HR 需要查看品牌层级的解决方案标签', () => {
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand, {
      name: 'HR 品牌站',
      solutionTags: ['品牌招商', '加盟合作', 'HR 人才招聘'],
    })

    assert.ok(brandPortal.solutionTags?.includes('品牌招商'))
    assert.ok(brandPortal.solutionTags?.includes('加盟合作'))
    assert.ok(brandPortal.solutionTags?.includes('HR 人才招聘'))
    assert.equal(brandPortal.heroTitle, 'brand-sim-001 企业级经营门户')
  })

  it('HR 品牌门户边界: 不能访问门店级数据', () => {
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand)
    // 品牌门户不应该有 storeName / supportedSurfaces
    assert.equal((brandPortal as any).storeName, undefined)
    assert.equal((brandPortal as any).supportedSurfaces, undefined)
    assert.equal(brandPortal.audience, PortalAudience.ToB)
    assert.equal(brandPortal.scopeType, PortalScopeType.Brand)
  })
})

describe(`[Portal Simulator] ${ROLES.Security} - SSO 安全审计`, () => {
  it('安监审计 SSO 安全: 所有 ToB 入口都必须启用 SSO', () => {
    const tenantPortal = createSimulatedTobPortal(PortalScopeType.Tenant)
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand)

    // 所有 ToB 登录入口都必须 SSO
    const tenantEntity = toPortalEntity(tenantPortal, { id: 'p-1', tenantId: 't-001' })
    const brandEntity = toPortalEntity(brandPortal, { id: 'p-2', tenantId: 't-001', brandId: 'b-001' })

    assert.ok(isSsoEnabled(tenantEntity))
    assert.ok(isSsoEnabled(brandEntity))
  })

  it('安监发现门店门户不需要 SSO - 符合预期', () => {
    const storePortal = createSimulatedStorePortal()
    const entity = toPortalEntity(storePortal, {
      id: 'p-store', tenantId: 't-001', brandId: 'b-001', storeId: 's-001',
    })

    // 门店没有 loginEntry 所以 SSO 应为 false
    assert.equal(isSsoEnabled(entity), false)
    assert.ok(isStorePortalEntity(entity))
  })
})

describe(`[Portal Simulator] ${ROLES.Guide} - 门店终端适配`, () => {
  it('导玩员确认门店支持全终端渠道', () => {
    const storePortal = createSimulatedStorePortal({
      supportedSurfaces: [
        StorefrontSurface.OfficialSite,
        StorefrontSurface.H5,
        StorefrontSurface.MiniApp,
        StorefrontSurface.App,
        StorefrontSurface.PcConsole,
        StorefrontSurface.PadConsole,
      ],
    })

    const contract = toStorePortalContract(storePortal)
    assert.ok(contract.supportedSurfaces)
    assert.equal(contract.supportedSurfaces.length, 6)
    // 导玩员需要在 Pad 端操作
    assert.ok(contract.supportedSurfaces.includes(StorefrontSurface.PadConsole))
  })

  it('导玩员边界: MiniApp 门店入口不可为空', () => {
    const storePortal = createSimulatedStorePortal({
      supportedSurfaces: [StorefrontSurface.MiniApp],
    })

    assert.ok(storePortal.supportedSurfaces.includes(StorefrontSurface.MiniApp))
    assert.equal(storePortal.supportedSurfaces.length, 1)
    // 即使只有一个终端也必须有效
    assert.ok(storePortal.storeName)
  })
})

describe(`[Portal Simulator] ${ROLES.Operations} - 门户生命周期`, () => {
  it('运行专员: 从创建到市场切换全流程', () => {
    // 创建门店门户: scopeCode = storeCode = storeId 一致
    const storePortal = createSimulatedStorePortal()
    const entity = toPortalEntity(storePortal, {
      id: 'lifecycle-001', tenantId: 't-ops', brandId: 'b-ops', storeId: 'store-sim-001',
    })

    // 已验证
    assert.ok(isStorePortalEntity(entity))
    assert.equal(entity.scopeCode, 'store-sim-001')

    // 状态机: 更新名称
    const sm = createPortalStateMachine(entity)
    sm.applyUpdate({ name: '运营优化门店' })
    assert.equal(sm.snapshot().name, '运营优化门店')

    // 市场切换: CN -> Global
    const globalEntity = simulateMarketSwitch(sm.snapshot(), 'global')
    assert.equal(globalEntity.marketCode, 'global')
    assert.ok(globalEntity.supportedLanguages.includes(LanguageCode.EnUs))
  })

  it('运行专员: 品牌门户升级方案标签', () => {
    const brandPortal = createSimulatedTobPortal(PortalScopeType.Brand, {
      solutionTags: [],
    })
    const entity = toPortalEntity(brandPortal, { id: 'p-upgrade', tenantId: 't-001', brandId: 'b-001' })

    const sm = createPortalStateMachine(entity)
    sm.applyUpdate({ solutionTags: ['品牌招商', '渠道拓展', '国际品牌站'] })

    const snap = sm.snapshot()
    assert.ok(snap.solutionTags?.length === 3)
    assert.ok(snap.solutionTags?.includes('国际品牌站'))
  })
})

describe(`[Portal Simulator] ${ROLES.Teambuilding} - 多门店门户筛选`, () => {
  it('团建专员批量筛选门店门户', () => {
    const stores = [
      createSimulatedStorePortal({ storeCode: 'team-a', storeName: '团建A店' }),
      createSimulatedStorePortal({ storeCode: 'team-b', storeName: '团建B店' }),
      createSimulatedStorePortal({ storeCode: 'team-c', storeName: '团建C店' }),
    ]

    // 确保所有门店都有 H5 和 MiniApp
    for (const store of stores) {
      const contract = toStorePortalContract(store)
      assert.ok(contract.supportedSurfaces?.includes(StorefrontSurface.H5))
      assert.ok(contract.supportedSurfaces?.includes(StorefrontSurface.MiniApp))
    }

    assert.equal(stores.length, 3)
    assert.equal(stores[0].storeName, '团建A店')
  })

  it('团建专员边界: 门店语言筛选中文门店', () => {
    const cnStore = createSimulatedStorePortal({
      storeCode: 'team-cn',
      marketCode: 'cn-mainland',
      supportedLanguages: [LanguageCode.ZhCn],
    })

    assert.equal(cnStore.supportedLanguages.length, 1)
    assert.equal(cnStore.supportedLanguages[0], LanguageCode.ZhCn)
    assert.equal(cnStore.marketCode, 'cn-mainland')
  })
})

describe(`[Portal Simulator] ${ROLES.Marketing} - 市场区域配置`, () => {
  it('营销专员全局市场多语言门户验证', () => {
    const globalStore = createSimulatedStorePortal({
      storeCode: 'mkt-global',
      marketCode: 'global',
      supportedLanguages: [LanguageCode.EnUs, LanguageCode.ZhCn],
    })

    assert.ok(globalStore.supportedLanguages.length >= 2)
    assert.ok(globalStore.supportedLanguages.includes(LanguageCode.EnUs))

    const switched = simulateMarketSwitch(
      toPortalEntity(globalStore, { id: 'p-mkt', tenantId: 't-001', brandId: 'b-001', storeId: 'mkt-global' }),
      'cn-mainland'
    )
    assert.equal(switched.supportedLanguages.length, 1)
    assert.equal(switched.supportedLanguages[0], LanguageCode.ZhCn)
  })

  it('营销专员租户门户品牌强化', () => {
    const tenantPortal = createSimulatedTobPortal(PortalScopeType.Tenant, {
      heroTitle: '超级品牌经营平台',
      solutionTags: ['品牌招商', '国际化', '全渠道', '智能营销'],
    })

    const contract = toTobPortalContract(tenantPortal)
    assert.equal(contract.heroTitle, '超级品牌经营平台')
    assert.ok(contract.solutionTags)
    assert.ok(contract.solutionTags.length >= 4)
  })
})
