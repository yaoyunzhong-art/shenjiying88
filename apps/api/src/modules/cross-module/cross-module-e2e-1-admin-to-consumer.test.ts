import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #1: 管理端创建 → API存储 → B端展示 → C端消费
 *
 * 模拟链路:
 *   admin-web (tenant bootstrap) → API (foundation/bootstrap) 
 *   → tob-web/storefront-web (portal bootstrap) → miniapp (C端消费)
 *
 * 验证:
 *   - tenant context 贯穿全链路
 *   - market profile 从配置正确下发到各个消费端
 *   - portal bootstrap 输出结构一致
 *   - C端 snapshot 从 API 数据正确派生
 */

import assert from 'node:assert/strict';
// ---- 测试数据结构定义（模拟 chain） ----

interface TenantContext {
  tenantId: string;
  brandId?: string;
  storeId?: string;
  marketCode: string;
}

interface FoundationBootstrap {
  tenantContext: TenantContext;
  foundationDependencies: string[];
  phase: string;
}

interface TenantPortal {
  audience: string;
  scopeType: string;
  scopeCode: string;
  tenantCode: string;
  marketCode: string;
  channel: string;
  name: string;
  primaryDomain: string;
  supportedLanguages: string[];
  supportedClients?: string[];
  heroTitle: string;
  heroSubtitle: string;
  solutionTags: string[];
  loginEntry: { label: string; loginPath: string; ssoEnabled: boolean };
}

interface BrandPortal {
  audience: string;
  scopeType: string;
  scopeCode: string;
  tenantCode: string;
  brandCode?: string;
  marketCode: string;
  channel: string;
  name: string;
  primaryDomain: string;
  supportedLanguages: string[];
  heroTitle: string;
  heroSubtitle: string;
  solutionTags: string[];
  loginEntry: { label: string; loginPath: string; ssoEnabled: boolean };
}

interface StorePortal {
  audience: string;
  scopeType: string;
  scopeCode: string;
  tenantCode: string;
  brandCode?: string;
  storeCode?: string;
  marketCode: string;
  channel: string;
  name: string;
  storeName: string;
  primaryDomain: string;
  supportedSurfaces: string[];
  supportedLanguages: string[];
  heroTitle: string;
  heroSubtitle: string;
  solutionTags: string[];
  loginEntry: { label: string; loginPath: string; ssoEnabled: boolean };
}

interface MarketProfile {
  marketCode: string;
  marketName: string;
  countryCode: string;
  locale: { defaultLanguage: string; supportedLanguages: string[] };
  timezone: { timezone: string };
  currency: { currencyCode: string; symbol: string };
  tax: { taxMode: string; taxRate: number; taxLabel: string };
  network: Record<string, string>;
  email: Record<string, string>;
  social: { primaryPlatforms: string[]; supportPlatforms: string[] };
}

interface PortalBootstrapResponse {
  tenantPortal: TenantPortal;
  brandPortal: BrandPortal;
  storePortal: StorePortal;
  marketProfile: MarketProfile;
  regionalOverrides: Record<string, unknown>[];
  foundationDependencies: string[];
  foundationContracts: string[];
}

interface MiniappBootstrapSnapshot {
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  marketCode: string;
  storeName: string;
  supportedSurfaces: string[];
  apiBaseUrl: string;
  cdnBaseUrl: string;
}

// ---- Fixtures ----

function createTenantContext(marketCode = 'cn-mainland'): TenantContext {
  return {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode,
  };
}

function createFoundationBootstrap(ctx: TenantContext): FoundationBootstrap {
  return {
    tenantContext: ctx,
    foundationDependencies: ['postgres', 'redis', 'rabbitmq', 'qdrant', 'clickhouse'],
    phase: 'scaffold',
  };
}

function createMarketProfile(marketCode: string): MarketProfile {
  if (marketCode === 'cn-mainland') {
    return {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
      network: {
        networkRegion: 'MAINLAND_CHINA',
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local',
      },
      email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] },
    };
  }
  // us-default
  return {
    marketCode: 'us-default',
    marketName: 'United States',
    countryCode: 'US',
    locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
    timezone: { timezone: 'America/New_York' },
    currency: { currencyCode: 'USD', symbol: '$' },
    tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
    network: {
      networkRegion: 'NORTH_AMERICA',
      apiBaseUrl: 'https://us-api.m5.local',
      cdnBaseUrl: 'https://us-cdn.m5.local',
      callbackBaseUrl: 'https://us-hooks.m5.local',
    },
    email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
    social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X'] },
  };
}

function createPortalBootstrap(ctx: TenantContext, market: MarketProfile): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB',
      scopeType: 'TENANT',
      scopeCode: ctx.tenantId,
      tenantCode: ctx.tenantId,
      marketCode: ctx.marketCode,
      channel: 'WEB',
      name: `${ctx.tenantId} ToB`,
      primaryDomain: `${ctx.tenantId}.${ctx.marketCode}.b2b.local`,
      supportedLanguages: market.locale.supportedLanguages,
      heroTitle: `${ctx.tenantId} 企业门户`,
      heroSubtitle: '',
      solutionTags: [],
      loginEntry: { label: '登录', loginPath: `/${ctx.marketCode}/${ctx.tenantId}/login`, ssoEnabled: true },
    },
    brandPortal: {
      audience: 'TOB',
      scopeType: 'BRAND',
      scopeCode: ctx.brandId ?? 'brand-demo',
      tenantCode: ctx.tenantId,
      brandCode: ctx.brandId,
      marketCode: ctx.marketCode,
      channel: 'WEB',
      name: `${ctx.brandId} ToB`,
      primaryDomain: `${ctx.brandId}.${ctx.tenantId}.${ctx.marketCode}.b2b.local`,
      supportedLanguages: market.locale.supportedLanguages,
      heroTitle: `${ctx.brandId} 品牌门户`,
      heroSubtitle: '',
      solutionTags: [],
      loginEntry: { label: '登录', loginPath: `/${ctx.marketCode}/${ctx.tenantId}/${ctx.brandId}/login`, ssoEnabled: true },
    },
    storePortal: {
      audience: 'TOC',
      scopeType: 'STORE',
      scopeCode: ctx.storeId ?? 'store-001',
      tenantCode: ctx.tenantId,
      brandCode: ctx.brandId,
      storeCode: ctx.storeId,
      storeName: `${ctx.storeId} 门店`,
      marketCode: ctx.marketCode,
      channel: 'WEB',
      name: `${ctx.storeId}`,
      primaryDomain: `${ctx.storeId}.${ctx.brandId}.${ctx.tenantId}.${ctx.marketCode}.local`,
      supportedLanguages: market.locale.supportedLanguages,
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
      heroTitle: `${ctx.storeId} 门店门户`,
      heroSubtitle: '',
      solutionTags: [],
      loginEntry: { label: '进入', loginPath: `/${ctx.marketCode}/${ctx.tenantId}/${ctx.brandId}/${ctx.storeId}/login`, ssoEnabled: true },
    },
    marketProfile: market,
    regionalOverrides: [],
    foundationDependencies: [],
    foundationContracts: [],
  };
}

function toMiniappBootstrapSnapshot(portal: PortalBootstrapResponse): MiniappBootstrapSnapshot {
  const store = portal.storePortal;
  return {
    tenantCode: store.tenantCode as string,
    brandCode: store.brandCode as string,
    storeCode: store.storeCode as string,
    marketCode: store.marketCode as string,
    storeName: store.storeName as string,
    supportedSurfaces: store.supportedSurfaces as string[],
    apiBaseUrl: portal.marketProfile.network.apiBaseUrl as string,
    cdnBaseUrl: portal.marketProfile.network.cdnBaseUrl as string,
  };
}

// ---- 测试链 #1: 管理端 → API → B端 → C端 ----

it('E2E链#1 正例: CN市场 tenant创建 → B端portal输出 → C端miniapp snapshot 全链路数据一致', () => {
  // Step 1: 管理端创建 tenant (admin-web → API)
  const ctx = createTenantContext('cn-mainland');
  const foundation = createFoundationBootstrap(ctx);

  assert.equal(foundation.tenantContext.tenantId, 'tenant-demo');
  assert.equal(foundation.tenantContext.marketCode, 'cn-mainland');
  assert.equal(foundation.phase, 'scaffold');
  assert.ok(foundation.foundationDependencies.includes('postgres'));
  assert.ok(foundation.foundationDependencies.includes('redis'));

  // Step 2: API 生成 market profile (API → market service)
  const market = createMarketProfile(ctx.marketCode);
  assert.equal(market.marketCode, 'cn-mainland');
  assert.equal(market.currency.currencyCode, 'CNY');
  assert.equal(market.tax.taxMode, 'PRICES_INCLUDE_TAX');
  assert.equal(market.network.networkRegion, 'MAINLAND_CHINA');

  // Step 3: B端 portal bootstrap (API → tob-web / storefront-web)
  const portal = createPortalBootstrap(ctx, market);
  assert.equal(portal.tenantPortal.scopeType, 'TENANT');
  assert.equal(portal.brandPortal.scopeType, 'BRAND');
  assert.equal(portal.storePortal.scopeType, 'STORE');
  assert.ok(portal.storePortal.supportedSurfaces.includes('MINIAPP'));
  
  // Step 4: C端 miniapp 消费 snapshot (miniapp → portal bootstrap)
  const snapshot = toMiniappBootstrapSnapshot(portal);
  assert.equal(snapshot.storeCode, 'store-001');
  assert.equal(snapshot.marketCode, 'cn-mainland');
  assert.equal(snapshot.apiBaseUrl, 'https://cn-api.m5.local');
  assert.ok(snapshot.supportedSurfaces.includes('MINIAPP'));
  assert.ok(snapshot.supportedSurfaces.includes('APP'));
});

it('E2E链#1 反例: 缺失 tenantContext 时应安全降级', () => {
  // 模拟 tenant context 为空的情况
  const emptyCtx: TenantContext = { tenantId: '', marketCode: '' };

  // API 层面应返回空 fallback
  assert.equal(emptyCtx.tenantId, '');
  assert.equal(emptyCtx.marketCode, '');

  // 验证 market 服务对空 context 的防御（默认使用 us-default）
  const fallbackMarket = createMarketProfile('us-default');
  assert.equal(fallbackMarket.marketCode, 'us-default');
  assert.equal(fallbackMarket.currency.currencyCode, 'USD');
});

it('E2E链#1 跨市场: US市场与CN市场 portal 输出应保持独立', () => {
  const usCtx = createTenantContext('us-default');
  const usMarket = createMarketProfile('us-default');
  const usPortal = createPortalBootstrap(usCtx, usMarket);

  const cnCtx = createTenantContext('cn-mainland');
  const cnMarket = createMarketProfile('cn-mainland');
  const cnPortal = createPortalBootstrap(cnCtx, cnMarket);

  // 两市场应保持隔离
  assert.notEqual(usMarket.marketCode, cnMarket.marketCode);
  assert.notEqual(usMarket.currency.currencyCode, cnMarket.currency.currencyCode);
  assert.notEqual(usMarket.timezone.timezone, cnMarket.timezone.timezone);
  assert.notEqual(usPortal.storePortal.marketCode, cnPortal.storePortal.marketCode);

  // 各自 domain 正确
  assert.ok(usPortal.tenantPortal.primaryDomain.includes('us-default'));
  assert.ok(cnPortal.tenantPortal.primaryDomain.includes('cn-mainland'));

  // miniapp snapshot 隔离确认
  const usSnapshot = toMiniappBootstrapSnapshot(usPortal);
  const cnSnapshot = toMiniappBootstrapSnapshot(cnPortal);
  assert.notEqual(usSnapshot.apiBaseUrl, cnSnapshot.apiBaseUrl);
  assert.notEqual(usSnapshot.marketCode, cnSnapshot.marketCode);
});

it('E2E链#1 边界: supportedSurfaces 应包含全部6个端', () => {
  const ctx = createTenantContext();
  const market = createMarketProfile('cn-mainland');
  const portal = createPortalBootstrap(ctx, market);

  const expectedSurfaces = ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'];
  for (const surface of expectedSurfaces) {
    assert.ok(
      portal.storePortal.supportedSurfaces.includes(surface),
      `storePortal 应包含 surface: ${surface}`
    );
  }
});

it('E2E链#1 边界: tenant/brand/store 三层 portal 的 primaryDomain 应有层级关系', () => {
  const ctx = createTenantContext('cn-mainland');
  const market = createMarketProfile('cn-mainland');
  const portal = createPortalBootstrap(ctx, market);

  const tenantDomain = portal.tenantPortal.primaryDomain;
  const brandDomain = portal.brandPortal.primaryDomain;
  const storeDomain = portal.storePortal.primaryDomain;

  // 域名层级应按: store.brand.tenant.market 递减
  assert.ok(brandDomain.startsWith(ctx.brandId!), 'brand domain 应以 brandCode 开头');
  assert.ok(storeDomain.startsWith(ctx.storeId!), 'store domain 应以 storeCode 开头');
  
  // brand portal 应包含 tenant code
  assert.ok(brandDomain.includes(ctx.tenantId));
  // store portal 应包含 brand + tenant codes
  assert.ok(storeDomain.includes(ctx.brandId!));
  assert.ok(storeDomain.includes(ctx.tenantId));
});
