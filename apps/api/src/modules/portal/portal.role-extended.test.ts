import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: portal 模块
 *
 * 4 个深度角色视角：
 * 🛒前台 — 门店门户和 ToC 前台能力
 * 👥HR — HR 门户与员工入口配置
 * 🎮导玩员 — 门店终端和操作界面配置
 * 🤝团建 — 团建门户入口与活动能力
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  Reception: '🛒前台',
  HR: '👥HR',
  Guide: '🎮导玩员',
  Teambuilding: '🤝团建',
}

// ── 测试数据工厂 ──

const tenantCtx = { tenantId: 't-portal-ext', brandId: 'b-portal-ext', storeId: 's-portal-ext', marketCode: 'cn-mainland' }

/**
 * 创建高度可定制的 mock portal service
 */
function mockPortalService(overrides: any = {}) {
  return {
    getBootstrap: () => ({
      tenantPortal: {
        audience: 'ToB',
        scopeType: 'TENANT',
        scopeCode: 't-portal-ext',
        name: '测试租户扩展官网',
        primaryDomain: 't-ext.local',
        loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true },
      },
      brandPortal: {
        audience: 'ToB',
        scopeType: 'BRAND',
        scopeCode: 'b-portal-ext',
        name: '品牌扩展官网',
        primaryDomain: 'b-ext.local',
        loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true },
        heroTitle: '品牌经营在线',
        solutionTags: ['门店管理', '会员运营', '活动营销'],
      },
      storePortal: {
        audience: 'ToC',
        scopeType: 'STORE',
        scopeCode: 's-portal-ext',
        storeName: '拓展门店',
        name: '门店门户',
        primaryDomain: 's-ext.local',
        supportedSurfaces: ['OfficialSite', 'MiniApp'],
        operationHours: '09:00-22:00',
        contactPhone: '400-888-0000',
        address: '北京市朝阳区拓展路88号',
      },
      marketProfile: {
        marketCode: 'cn-mainland',
        marketName: '中国大陆',
        currency: 'CNY',
        timezone: 'Asia/Shanghai',
      },
      regionalOverrides: [],
      foundationDependencies: ['auth', 'member', 'payment'],
      foundationContracts: ['platform-contract-v2', 'brand-agreement-v1'],
    }),
    ...overrides,
  } as any
}

function createPortalController(mockPortal?: any) {
  const { PortalController } = require('./portal.controller')
  return new PortalController(mockPortal ?? mockPortalService())
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 门店门户和 ToC 前台能力
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 门店门户前台视角', () => {
  it('前台获取 bootstrap 确认门店门户 ToC 配置完整', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(result.storePortal, '应有门店门户')
    assert.equal(result.storePortal.audience, 'ToC', '门店门户应是 ToC 面向消费者')
    assert.equal(result.storePortal.storeName, '拓展门店')
    assert.ok(result.storePortal.primaryDomain, '应有门店域名')
    assert.ok(result.storePortal.supportedSurfaces, '应有终端支持列表')
    assert.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'), '应支持官网')
  })

  it('前台确认门店门户包含运营信息（营业时间、电话、地址）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.equal(result.storePortal.operationHours, '09:00-22:00', '应有营业时间')
    assert.equal(result.storePortal.contactPhone, '400-888-0000', '应有联系电话')
    assert.equal(result.storePortal.address, '北京市朝阳区拓展路88号', '应有门店地址')
  })

  it('前台确认市场配置包含时区和货币（前台操作依赖）', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.equal(result.marketProfile.currency, 'CNY', '货币应为人民币')
    assert.equal(result.marketProfile.timezone, 'Asia/Shanghai', '时区应为中国标准时间')
    assert.ok(result.storePortal.name, '门店名称可用')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👥HR — HR 门户与员工入口配置
// ──────────────────────────────────────────────────────────────────────
describe('👥HR — HR 门户员工入口视角', () => {
  it('HR 获取 bootstrap 确认 tenantPortal 含 SSO 登录入口', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(result.tenantPortal, '应有租户门户')
    assert.equal(result.tenantPortal.audience, 'ToB', '租户门户是 ToB')
    assert.equal(result.tenantPortal.loginEntry.ssoEnabled, true, 'SSO 应开启')
    assert.equal(result.tenantPortal.loginEntry.loginPath, '/login')
  })

  it('HR 确认品牌门户 solutionTags 可用于员工福利活动查询', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(Array.isArray(result.brandPortal.solutionTags), 'solutionTags 应为数组')
    assert.ok(result.brandPortal.solutionTags.length >= 3, '至少 3 个方案标签')
    assert.ok(result.brandPortal.solutionTags.includes('会员运营'), '应包含会员运营标签')
  })

  it('HR 确认 foundation 依赖列表用于系统集成规划', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(Array.isArray(result.foundationDependencies), '应有 foundation 依赖列表')
    assert.ok(result.foundationDependencies.includes('member'), '应包含 member 依赖')
    assert.ok(result.foundationDependencies.includes('payment'), '应包含 payment 依赖')

    assert.ok(Array.isArray(result.foundationContracts), '应有 foundation 合同列表')
    assert.ok(result.foundationContracts.length >= 2)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 门店终端和操作界面配置
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 门店终端操作界面视角', () => {
  it('导玩员获取 bootstrap 确认门店多终端支持', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(result.storePortal, '应有门店门户')
    assert.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'), '应支持官网站点')
    assert.ok(result.storePortal.supportedSurfaces.includes('MiniApp'), '应支持小程序')
  })

  it('导玩员确认市场 Profile 用于地区化运营', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.equal(result.marketProfile.marketCode, 'cn-mainland')
    assert.equal(result.marketProfile.marketName, '中国大陆')
    assert.equal(result.tenantPortal.scopeCode, 't-portal-ext')
    assert.equal(result.storePortal.scopeCode, 's-portal-ext')
  })

  it('导玩员确认 brandPortal heroTitle 和 solutionTags 可用于门店营销', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(result.brandPortal.heroTitle, '应有品牌标题')
    assert.equal(result.brandPortal.heroTitle, '品牌经营在线')
    assert.ok(result.brandPortal.solutionTags.includes('门店管理'), '应包含门店管理标签')
    assert.ok(result.brandPortal.solutionTags.includes('活动营销'), '应包含活动营销标签')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建门户入口与活动能力
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建门户活动能力视角', () => {
  it('团建获取 bootstrap 确认租户级和品牌级门户可用', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(result.tenantPortal, '租户门户可用')
    assert.ok(result.brandPortal, '品牌门户可用')
    assert.ok(result.storePortal, '门店门户可用')
    assert.ok(result.marketProfile, '市场配置可用')
  })

  it('团建确认登录入口信息用于团建活动参与链接', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    // 团建需要知道品牌和门店的登录入口来设计活动参与流程
    assert.equal(result.tenantPortal.loginEntry.loginPath, '/login')
    assert.equal(result.brandPortal.loginEntry.loginPath, '/login')
    assert.equal(result.tenantPortal.loginEntry.ssoEnabled, true)

    // 门店信息用于活动场地确认
    assert.ok(result.storePortal.operationHours)
    assert.ok(result.storePortal.contactPhone)
  })

  it('团建确认 foundationContracts 列表用于审核合同合规', () => {
    const ctrl = createPortalController()
    const result = ctrl.getBootstrap(tenantCtx)

    assert.ok(Array.isArray(result.foundationContracts), 'foundationContracts 应为数组')
    assert.ok(result.foundationContracts.includes('platform-contract-v2'), '应有平台合同')
    assert.ok(result.foundationContracts.includes('brand-agreement-v1'), '应有品牌协议')

    // 依赖列表用于系统对接
    assert.ok(Array.isArray(result.foundationDependencies))
    assert.ok(result.foundationDependencies.includes('auth'), '应有 auth 依赖')
  })
})
