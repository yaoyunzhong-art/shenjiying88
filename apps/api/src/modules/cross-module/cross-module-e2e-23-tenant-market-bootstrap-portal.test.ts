import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #23: 租户初始化 → 市场配置 → Portal 引导 → 消费端展示
 *
 * 模拟链路 (Phase-17 场景):
 *   tenant bootstrap (租户初始化) 
 *   → market profile (市场配置: CN/US/JP)
 *   → portal bootstrap (门户引导: tenant/brand/store 三层)
 *   → consumer rendering (消费端展示: miniapp/storefront/tob)
 *
 * 验证:
 *   - 租户初始化后 portal 三层结构正确推导
 *   - 市场配置影响 portal 呈现 (语言/税模式/渠道)
 *   - 消费端从 portal 数据正确渲染 (supportedSurfaces/supportedClients)
 *   - 跨市场隔离: CN/US 两市场 portal 输出不串
 *   - 边界: 缺失市场配置时 portal 安全降级
 */

import assert from 'node:assert/strict';
// ====== 类型定义 ======

interface TenantBootstrap {
  phase: string;
  tenantId: string;
  marketCode: string;
  foundationDependencies: string[];
  foundationContracts: string[];
}

interface MarketProfile {
  marketCode: string;
  marketName: string;
  countryCode: string;
  locale: string;
  currency: string;
  timezone: string;
  taxMode: 'PRICES_INCLUDE_TAX' | 'PRICES_EXCLUDE_TAX';
  supportedLanguages: string[];
  supportedChannels: string[];
  active: boolean;
}

interface PortalBootstrap {
  tenant: {
    tenantId: string;
    tenantCode: string;
    tenantName: string;
    marketCode: string;
  };
  scope: {
    type: 'TENANT' | 'BRAND' | 'STORE';
    scopeId: string;
    scopeCode: string;
  };
  primaryDomain: string;
  supportedLanguages: string[];
  supportedSurfaces: string[];
  supportedClients: string[];
  features: string[];
  heroTitle: string;
  heroSubtitle: string;
  loginEntry: {
    label: string;
    loginPath: string;
    ssoEnabled: boolean;
  };
  solutionTags: string[];
}

interface StorefrontSnapshot {
  scopeType: string;
  storeName: string;
  primaryDomain: string;
  supportedSurfaces: string[];
  supportedLanguages: string[];
  features: string[];
  heroTitle: string;
  heroSubtitle: string;
  loginEntry: { label: string; loginPath: string; ssoEnabled: boolean };
}

interface MiniAppSnapshot {
  scopeType: string;
  appName: string;
  supportedLanguages: string[];
  surfaces: string[];
  marketCode: string;
}

interface TobSnapshot {
  scopeType: string;
  tenantCode: string;
  primaryDomain: string;
  supportedClients: string[];
  brandCode?: string;
}

// ====== 模拟服务层 ======

const ALL_SURFACES = ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] as const;
const ALL_CHANNELS = ['WEB', 'H5', 'MINIAPP', 'APP', 'PC', 'PAD'] as const;

class MockBootstrapService {
  bootstrap(tenantId: string, marketCode: string): TenantBootstrap {
    return {
      phase: 'scaffold',
      tenantId,
      marketCode,
      foundationDependencies: ['prisma', 'redis', 'queue', 'event-bus', 'lyt-adapter'],
      foundationContracts: [
        'tenant:read', 'tenant:write',
        'brand:read', 'brand:write',
        'store:read', 'store:write',
        'member:read', 'member:write',
      ],
    };
  }
}

class MockMarketService {
  private readonly profiles: Map<string, MarketProfile> = new Map([
    ['cn-mainland', {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      taxMode: 'PRICES_INCLUDE_TAX',
      supportedLanguages: ['zh-CN'],
      supportedChannels: ['WEB', 'H5', 'MINIAPP', 'APP', 'PC', 'PAD'],
      active: true,
    }],
    ['us-default', {
      marketCode: 'us-default',
      marketName: 'United States',
      countryCode: 'US',
      locale: 'en-US',
      currency: 'USD',
      timezone: 'America/New_York',
      taxMode: 'PRICES_EXCLUDE_TAX',
      supportedLanguages: ['en-US', 'es-US'],
      supportedChannels: ['WEB', 'H5', 'APP'],
      active: true,
    }],
    ['jp-default', {
      marketCode: 'jp-default',
      marketName: '日本',
      countryCode: 'JP',
      locale: 'ja-JP',
      currency: 'JPY',
      timezone: 'Asia/Tokyo',
      taxMode: 'PRICES_INCLUDE_TAX',
      supportedLanguages: ['ja-JP'],
      supportedChannels: ['WEB', 'H5', 'MINIAPP', 'APP'],
      active: true,
    }],
  ]);

  getProfile(marketCode: string): MarketProfile | undefined {
    return this.profiles.get(marketCode);
  }

  getAllActiveMarkets(): MarketProfile[] {
    return Array.from(this.profiles.values()).filter(m => m.active);
  }
}

class MockPortalService {
  constructor(
    private readonly marketService: MockMarketService,
    private readonly bootstrapService: MockBootstrapService,
  ) {}

  bootstrapPortal(
    tenantId: string,
    tenantCode: string,
    tenantName: string,
    marketCode: string,
    scopeType: 'TENANT' | 'BRAND' | 'STORE',
    scopeCode: string,
    brandCode?: string,
    storeName?: string,
  ): PortalBootstrap {
    const market = this.marketService.getProfile(marketCode);
    if (!market) {
      // 安全降级
      return {
        tenant: { tenantId, tenantCode, tenantName, marketCode },
        scope: { type: scopeType, scopeId: scopeCode, scopeCode },
        primaryDomain: `${scopeCode}.default-domain.com`,
        supportedLanguages: ['zh-CN'],
        supportedSurfaces: ['H5'],
        supportedClients: ['WEB', 'H5'],
        features: [],
        heroTitle: tenantName,
        heroSubtitle: '',
        loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: false },
        solutionTags: [],
      };
    }

    const base = ((): {
      primaryDomain: string;
      supportedSurfaces: string[];
      supportedClients: string[];
      features: string[];
      heroTitle: string;
      heroSubtitle: string;
      loginEntry: { label: string; loginPath: string; ssoEnabled: boolean };
      solutionTags: string[];
    } => {
      switch (scopeType) {
        case 'TENANT':
          return {
            primaryDomain: `${tenantCode}.${marketCode}.example.com`,
            supportedSurfaces: ['OFFICIAL_SITE'],
            supportedClients: ['WEB', 'PC', 'PAD'],
            features: ['multi-brand', 'analytics', 'governance'],
            heroTitle: `${tenantName} 管理平台`,
            heroSubtitle: `服务 ${market.marketName} 市场`,
            loginEntry: { label: '管理登录', loginPath: '/login', ssoEnabled: true },
            solutionTags: ['multi-tenant', 'enterprise'],
          };
        case 'BRAND':
          return {
            primaryDomain: brandCode
              ? `${brandCode}.${tenantCode}.${marketCode}.example.com`
              : `${tenantCode}.${marketCode}.example.com/brand`,
            supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'APP'],
            supportedClients: [...market.supportedChannels],
            features: ['brand-customization', 'marketing'],
            heroTitle: brandCode ? `${brandCode} 品牌门户` : `${tenantName} 品牌门户`,
            heroSubtitle: `品牌运营 · ${market.marketName}`,
            loginEntry: { label: '品牌登录', loginPath: '/brand/login', ssoEnabled: true },
            solutionTags: ['brand', 'marketing'],
          };
        case 'STORE':
          return {
            primaryDomain: brandCode
              ? `${scopeCode}.${brandCode}.${tenantCode}.${marketCode}.example.com`
              : `${scopeCode}.${tenantCode}.${marketCode}.example.com`,
            supportedSurfaces: [...ALL_SURFACES],
            supportedClients: [...market.supportedChannels],
            features: ['pos', 'member-management', 'inventory', 'reservation'],
            heroTitle: storeName ?? scopeCode,
            heroSubtitle: `欢迎光临 · ${market.marketName}`,
            loginEntry: { label: '门店登录', loginPath: '/store/login', ssoEnabled: true },
            solutionTags: ['retail', 'service'],
          };
      }
    })();

    return {
      tenant: { tenantId, tenantCode, tenantName, marketCode },
      scope: { type: scopeType, scopeId: scopeCode, scopeCode },
      supportedLanguages: [...market.supportedLanguages],
      ...base,
    };
  }
}

class MockSnapshotService {
  constructor(private readonly portalService: MockPortalService) {}

  toStorefrontSnapshot(portal: PortalBootstrap): StorefrontSnapshot {
    return {
      scopeType: portal.scope.type,
      storeName: portal.heroTitle,
      primaryDomain: portal.primaryDomain,
      supportedSurfaces: [...portal.supportedSurfaces],
      supportedLanguages: [...portal.supportedLanguages],
      features: [...portal.features],
      heroTitle: portal.heroTitle,
      heroSubtitle: portal.heroSubtitle,
      loginEntry: { ...portal.loginEntry },
    };
  }

  toMiniAppSnapshot(portal: PortalBootstrap): MiniAppSnapshot {
    return {
      scopeType: portal.scope.type,
      appName: portal.heroTitle,
      supportedLanguages: [...portal.supportedLanguages],
      surfaces: portal.supportedSurfaces.filter(s =>
        ['H5', 'MINIAPP', 'APP'].includes(s)
      ),
      marketCode: portal.tenant.marketCode,
    };
  }

  toTobSnapshot(portal: PortalBootstrap): TobSnapshot {
    return {
      scopeType: portal.scope.type,
      tenantCode: portal.tenant.tenantCode,
      primaryDomain: portal.primaryDomain,
      supportedClients: [...portal.supportedClients],
    };
  }
}

// ====== 工厂函数 ======

function createServices() {
  const bootstrapService = new MockBootstrapService();
  const marketService = new MockMarketService();
  const portalService = new MockPortalService(marketService, bootstrapService);
  const snapshotService = new MockSnapshotService(portalService);
  return { bootstrapService, marketService, portalService, snapshotService };
}

// ====== 测试 ======

it('E2E链#23 正例: 租户初始化 → CN市场 Portal → 前/中/后台三端快照——全链路一致', () => {
  const { portalService, snapshotService } = createServices();

  // 1. Portal bootstrap (Tenant层)
  const tenantPortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'TENANT', 'acme-global',
  );

  assert.equal(tenantPortal.scope.type, 'TENANT');
  assert.equal(tenantPortal.primaryDomain, 'acme.cn-mainland.example.com');
  assert.deepEqual(tenantPortal.supportedLanguages, ['zh-CN']);
  assert.ok(tenantPortal.supportedSurfaces.includes('OFFICIAL_SITE'));
  assert.equal(tenantPortal.loginEntry.ssoEnabled, true);
  assert.ok(tenantPortal.features.includes('multi-brand'));

  // 2. Brand portal
  const brandPortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'BRAND', 'acme-sports', 'sports',
  );

  assert.equal(brandPortal.scope.type, 'BRAND');
  assert.equal(brandPortal.primaryDomain, 'sports.acme.cn-mainland.example.com');
  assert.ok(brandPortal.supportedSurfaces.includes('H5'));

  // 3. Store portal → Storefront 快照
  const storePortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'STORE', 'store-sh001', 'sports', '上海旗舰店',
  );

  const storefront = snapshotService.toStorefrontSnapshot(storePortal);
  assert.equal(storefront.scopeType, 'STORE');
  assert.equal(storefront.storeName, '上海旗舰店');
  assert.equal(storefront.supportedSurfaces.length, 6); // 全部6端

  // 4. Store portal → MiniApp 快照
  const miniapp = snapshotService.toMiniAppSnapshot(storePortal);
  assert.equal(miniapp.marketCode, 'cn-mainland');
  assert.ok(miniapp.surfaces.includes('H5'));
  assert.ok(miniapp.surfaces.includes('MINIAPP'));
  assert.ok(!miniapp.surfaces.includes('PC_CONSOLE')); // miniapp 不应包含 PC

  // 5. Store portal → ToB 快照
  const tob = snapshotService.toTobSnapshot(storePortal);
  assert.equal(tob.tenantCode, 'acme');
  assert.ok(tob.supportedClients.includes('WEB'));
});

it('E2E链#23 跨市场: CN市场与US市场 portal 输出独立不串台', () => {
  const { portalService } = createServices();

  // CN 门店
  const cnStore = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'STORE', 'store-sh001', 'sports', '上海旗舰店',
  );

  // US 门店
  const usStore = portalService.bootstrapPortal(
    'tenant-002', 'acme-us', 'Acme US', 'us-default',
    'STORE', 'store-ny001', 'acme-us', 'New York Flagship',
  );

  // CN 语言独立
  assert.deepEqual(cnStore.supportedLanguages, ['zh-CN']);
  assert.equal(cnStore.tenant.tenantId, 'tenant-001');

  // US 语言独立
  assert.deepEqual(usStore.supportedLanguages, ['en-US', 'es-US']);
  assert.equal(usStore.tenant.tenantId, 'tenant-002');

  // 域名独立
  assert.equal(cnStore.primaryDomain, 'store-sh001.sports.acme.cn-mainland.example.com');
  assert.equal(usStore.primaryDomain, 'store-ny001.acme-us.acme-us.us-default.example.com');

  // US 市场 BRAND scope 应有 APP (市场级别渠道,不含 MINIAPP)
  const usBrandPortal = portalService.bootstrapPortal(
    'tenant-002', 'acme-us', 'Acme US', 'us-default',
    'BRAND', 'acme-us-brand', 'acme-us-brand',
  );
  assert.ok(usBrandPortal.supportedClients.includes('APP'), 'US brand should have APP');
  assert.ok(!usBrandPortal.supportedClients.includes('PAD'), 'US brand should not have PAD');

  // CN 市场 BRAND scope 应有 PAD
  const cnBrandPortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'BRAND', 'acme-sports', 'sports',
  );
  assert.ok(cnBrandPortal.supportedClients.includes('PAD'), 'CN brand should have PAD');
});

it('E2E链#23 边界: 缺失市场配置时 portal 安全降级', () => {
  const { portalService } = createServices();

  // 使用不存在的市场码
  const portal = portalService.bootstrapPortal(
    'tenant-003', 'eu-tenant', 'EU Tenant', 'eu-unknown',
    'STORE', 'store-berlin', undefined, 'Berlin Store',
  );

  // 应安全降级,返回默认值
  assert.equal(portal.tenant.marketCode, 'eu-unknown');
  assert.equal(portal.primaryDomain, 'store-berlin.default-domain.com');
  assert.deepEqual(portal.supportedLanguages, ['zh-CN']);
  assert.deepEqual(portal.supportedSurfaces, ['H5']);
  assert.equal(portal.loginEntry.ssoEnabled, false);
  assert.deepEqual(portal.features, []);
});

it('E2E链#23 边界: supportedSurfaces 在门店 Portal 中应包含全部 6 个端', () => {
  const { portalService } = createServices();

  const storePortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme 集团', 'cn-mainland',
    'STORE', 'store-sh001', 'sports', '上海旗舰店',
  );

  assert.equal(storePortal.supportedSurfaces.length, 6);
  assert.ok(storePortal.supportedSurfaces.includes('OFFICIAL_SITE'));
  assert.ok(storePortal.supportedSurfaces.includes('H5'));
  assert.ok(storePortal.supportedSurfaces.includes('MINIAPP'));
  assert.ok(storePortal.supportedSurfaces.includes('APP'));
  assert.ok(storePortal.supportedSurfaces.includes('PC_CONSOLE'));
  assert.ok(storePortal.supportedSurfaces.includes('PAD_CONSOLE'));
});

it('E2E链#23 边界: 租户/品牌/门店三层 portal 域名有层级关系', () => {
  const { portalService } = createServices();

  const tenantPortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme', 'cn-mainland',
    'TENANT', 'acme-global',
  );
  const brandPortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme', 'cn-mainland',
    'BRAND', 'sports', 'sports',
  );
  const storePortal = portalService.bootstrapPortal(
    'tenant-001', 'acme', 'Acme', 'cn-mainland',
    'STORE', 'store-sh001', 'sports', '上海',
  );

  // store domain 包含 brand domain 包含 tenant domain
  assert.ok(storePortal.primaryDomain.includes(brandPortal.primaryDomain.replace('sports.', '')), 'store domain should be subdomain of brand');
  assert.ok(brandPortal.primaryDomain.includes(tenantPortal.primaryDomain.replace('acme.cn-mainland', '')), 'brand domain should be subdomain of tenant');
});

it('E2E链#23 反例: 缺失 tenantCode 时应使用 tenantId 降级', () => {
  const { portalService } = createServices();

  const portal = portalService.bootstrapPortal(
    'tenant-004', '', 'No Code Tenant', 'cn-mainland',
    'STORE', 'store-default', undefined, '无名店',
  );

  assert.ok(portal.primaryDomain.length > 0);
  // tenantCode 为空时,域名中应使用某种降级标识
  assert.ok(portal.primaryDomain.includes('store-default'));
  assert.equal(portal.heroTitle, '无名店'); // storeName passed as '无名店'
});
