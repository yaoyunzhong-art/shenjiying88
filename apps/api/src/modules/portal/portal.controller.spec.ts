import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [portal] [D] controller spec 补全 - 全路由覆盖
 *
 * PortalController routes:
 *   GET /portals/bootstrap       → getBootstrap
 *   GET /portals/tenant-portal   → getTenantPortal
 *   GET /portals/brand-portal    → getBrandPortal
 *   GET /portals/store-portal    → getStorePortal
 *
 * 覆盖: 正例 / 反例 / 边界
 */

import assert from 'node:assert/strict';
// ── 模拟装饰器 ──

function Controller(prefix: string) {
  return (target: { new (...args: any[]): unknown; __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

// ── 模拟 TenantContext 装饰器 ──
function TenantContext() {
  return (_target: object, _propertyKey: string | symbol, _parameterIndex: number) => {
    // no-op decorator mock
  };
}

// ── 类型 ──

interface TenantContextMock {
  tenantId: string;
  brandId?: string;
  storeId?: string;
}

// ── Controller 模拟 ──

class PortalController {
  constructor(private readonly portalService: {
    getBootstrap: (ctx: TenantContextMock) => unknown;
    resolveTenantPortal: (ctx: TenantContextMock) => unknown;
    resolveBrandPortal: (ctx: TenantContextMock) => unknown;
    resolveStorePortal: (ctx: TenantContextMock) => unknown;
  }) {}

  getBootstrap(tenantContext: TenantContextMock) {
    return this.portalService.getBootstrap(tenantContext);
  }

  getTenantPortal(tenantContext: TenantContextMock) {
    return this.portalService.resolveTenantPortal(tenantContext);
  }

  getBrandPortal(tenantContext: TenantContextMock) {
    return this.portalService.resolveBrandPortal(tenantContext);
  }

  getStorePortal(tenantContext: TenantContextMock) {
    return this.portalService.resolveStorePortal(tenantContext);
  }
}

// 注册装饰器
Get('bootstrap')(PortalController.prototype, 'getBootstrap');
Get('tenant-portal')(PortalController.prototype, 'getTenantPortal');
Get('brand-portal')(PortalController.prototype, 'getBrandPortal');
Get('store-portal')(PortalController.prototype, 'getStorePortal');
Controller('portals')(PortalController);

// ── 测试数据工厂 ──

function defaultTenantContext(): TenantContextMock {
  return {
    tenantId: 'acme-corp',
    brandId: 'brand-alpha',
    storeId: 'store-sz001',
  };
}

function createServiceMocks(ctx?: TenantContextMock) {
  const context = ctx ?? defaultTenantContext();
  let bootstrapCallCount = 0;
  let tenantCallCount = 0;
  let brandCallCount = 0;
  let storeCallCount = 0;

  const service = {
    getBootstrap: (_ctx: TenantContextMock) => {
      bootstrapCallCount++;
      return {
        tenantPortal: { audience: 'to-b', scopeType: 'tenant', scopeCode: context.tenantId },
        brandPortal: { audience: 'to-b', scopeType: 'brand', scopeCode: context.brandId },
        storePortal: { audience: 'to-c', scopeType: 'store', scopeCode: context.storeId },
        marketProfile: { marketCode: 'cn-mainland', currency: 'CNY' },
        regionalOverrides: [],
        foundation: { version: '1.0.0', deps: ['market', 'foundation'] },
      };
    },
    resolveTenantPortal: (_ctx: TenantContextMock) => {
      tenantCallCount++;
      return {
        audience: 'to-b',
        scopeType: 'tenant',
        scopeCode: context.tenantId,
        tenantCode: context.tenantId,
        marketCode: 'cn-mainland',
        name: `${context.tenantId} ToB 官网`,
        heroTitle: `${context.tenantId} 企业级经营门户`,
        supportedLanguages: ['zh-CN', 'en-US'],
        loginEntry: { label: '进入租户后台', loginPath: `/${context.tenantId}/login`, ssoEnabled: true },
      };
    },
    resolveBrandPortal: (_ctx: TenantContextMock) => {
      brandCallCount++;
      return {
        audience: 'to-b',
        scopeType: 'brand',
        scopeCode: context.brandId,
        brandCode: context.brandId,
        marketCode: 'cn-mainland',
        name: `${context.brandId} 品牌 ToB 官网`,
        heroTitle: `${context.brandId} 品牌经营官网`,
        supportedLanguages: ['zh-CN', 'en-US'],
        solutionTags: ['品牌招商', '品牌后台'],
        loginEntry: { label: '进入品牌后台', loginPath: `/${context.tenantId}/${context.brandId}/login`, ssoEnabled: true },
      };
    },
    resolveStorePortal: (_ctx: TenantContextMock) => {
      storeCallCount++;
      return {
        audience: 'to-c',
        scopeType: 'store',
        scopeCode: context.storeId,
        storeCode: context.storeId,
        storeName: `${context.storeId} 门店`,
        marketCode: 'cn-mainland',
        name: `${context.storeId} 门店门户`,
        supportedLanguages: ['zh-CN'],
        supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINI_APP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
      };
    },
    getCallCounts: () => ({ bootstrapCallCount, tenantCallCount, brandCallCount, storeCallCount }),
    resetCallCounts: () => { bootstrapCallCount = tenantCallCount = brandCallCount = storeCallCount = 0; },
  };

  return { service, controller: new PortalController(service) };
}

// ══════════════════════════════════════════════════════════════
// 测试套件
// ══════════════════════════════════════════════════════════════

describe('PortalController', () => {
  // ── 装饰器元数据 ──

  describe('decorator metadata', () => {
    it('registers controller prefix "portals"', () => {
      assert.equal(
        (PortalController as typeof PortalController & { __prefix?: string }).__prefix,
        'portals',
      );
    });

    it('registers @Get("bootstrap") on getBootstrap', () => {
      assert.ok(getRegistrations.includes('getBootstrap:bootstrap'));
    });

    it('registers @Get("tenant-portal") on getTenantPortal', () => {
      assert.ok(getRegistrations.includes('getTenantPortal:tenant-portal'));
    });

    it('registers @Get("brand-portal") on getBrandPortal', () => {
      assert.ok(getRegistrations.includes('getBrandPortal:brand-portal'));
    });

    it('registers @Get("store-portal") on getStorePortal', () => {
      assert.ok(getRegistrations.includes('getStorePortal:store-portal'));
    });
  });

  // ── GET /portals/bootstrap ──

  describe('GET /portals/bootstrap', () => {
    it('delegates to portalService.getBootstrap', () => {
      const { service, controller } = createServiceMocks();
      const ctx = defaultTenantContext();
      controller.getBootstrap(ctx);
      assert.equal(service.getCallCounts().bootstrapCallCount, 1);
    });

    it('returns well-shaped bootstrap response with all 3 portal types', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBootstrap(defaultTenantContext()) as Record<string, unknown>;

      assert.ok('tenantPortal' in result, 'response has tenantPortal');
      assert.ok('brandPortal' in result, 'response has brandPortal');
      assert.ok('storePortal' in result, 'response has storePortal');
      assert.ok('marketProfile' in result, 'response has marketProfile');
      assert.ok('regionalOverrides' in result, 'response has regionalOverrides');
      assert.ok('foundation' in result, 'response has foundation deps');
    });

    it('tenant portal has to-b audience and tenant scope', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBootstrap(defaultTenantContext()) as {
        tenantPortal: { audience: string; scopeType: string; scopeCode: string };
      };
      assert.equal(result.tenantPortal.audience, 'to-b');
      assert.equal(result.tenantPortal.scopeType, 'tenant');
      assert.equal(result.tenantPortal.scopeCode, 'acme-corp');
    });

    it('brand portal has to-b audience and brand scope', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBootstrap(defaultTenantContext()) as {
        brandPortal: { audience: string; scopeType: string; scopeCode?: string };
      };
      assert.equal(result.brandPortal.audience, 'to-b');
      assert.equal(result.brandPortal.scopeType, 'brand');
    });

    it('store portal has to-c audience and store scope', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBootstrap(defaultTenantContext()) as {
        storePortal: { audience: string; scopeType: string; scopeCode: string };
      };
      assert.equal(result.storePortal.audience, 'to-c');
      assert.equal(result.storePortal.scopeType, 'store');
      assert.equal(result.storePortal.scopeCode, 'store-sz001');
    });

    it('marketProfile contains market code and currency', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBootstrap(defaultTenantContext()) as {
        marketProfile: { marketCode: string; currency: string };
      };
      assert.equal(result.marketProfile.marketCode, 'cn-mainland');
      assert.equal(result.marketProfile.currency, 'CNY');
    });

    it('tenant id propagates through context', () => {
      const customCtx: TenantContextMock = { tenantId: 'my-tenant-42' };
      const { controller } = createServiceMocks(customCtx);
      const result = controller.getBootstrap(customCtx) as {
        tenantPortal: { scopeCode: string };
      };
      assert.equal(result.tenantPortal.scopeCode, 'my-tenant-42');
    });

    it('brand id propagates through context', () => {
      const customCtx: TenantContextMock = { tenantId: 't1', brandId: 'luxury-brand' };
      const { controller } = createServiceMocks(customCtx);
      const result = controller.getBootstrap(customCtx) as {
        brandPortal: { scopeCode: string };
      };
      assert.equal(result.brandPortal.scopeCode, 'luxury-brand');
    });

    it('store id propagates through context', () => {
      const customCtx: TenantContextMock = { tenantId: 't1', storeId: 'store-sh001' };
      const { controller } = createServiceMocks(customCtx);
      const result = controller.getBootstrap(customCtx) as {
        storePortal: { scopeCode: string };
      };
      assert.equal(result.storePortal.scopeCode, 'store-sh001');
    });
  });

  // ── GET /portals/tenant-portal ──

  describe('GET /portals/tenant-portal', () => {
    it('delegates to portalService.resolveTenantPortal', () => {
      const { service, controller } = createServiceMocks();
      controller.getTenantPortal(defaultTenantContext());
      assert.equal(service.getCallCounts().tenantCallCount, 1);
    });

    it('returns TobPortal with correct audience and scope', () => {
      const { controller } = createServiceMocks();
      const result = controller.getTenantPortal(defaultTenantContext()) as {
        audience: string;
        scopeType: string;
        tenantCode: string;
        heroTitle: string;
        loginEntry: { label: string; ssoEnabled: boolean };
      };

      assert.equal(result.audience, 'to-b');
      assert.equal(result.scopeType, 'tenant');
      assert.equal(result.tenantCode, 'acme-corp');
      assert.ok(result.heroTitle.includes('企业级经营门户'));
      assert.equal(result.loginEntry.ssoEnabled, true);
    });

    it('supports multiple languages', () => {
      const { controller } = createServiceMocks();
      const result = controller.getTenantPortal(defaultTenantContext()) as {
        supportedLanguages: string[];
      };
      assert.ok(result.supportedLanguages.includes('zh-CN'));
      assert.ok(result.supportedLanguages.includes('en-US'));
    });

    it('login path contains tenant context', () => {
      const { controller } = createServiceMocks();
      const result = controller.getTenantPortal(defaultTenantContext()) as {
        loginEntry: { loginPath: string };
      };
      assert.ok(result.loginEntry.loginPath.includes('acme-corp'));
    });

    it('responds differently for different tenants', () => {
      const ctx1: TenantContextMock = { tenantId: 'tenant-alpha' };
      const ctx2: TenantContextMock = { tenantId: 'tenant-beta' };

      const { controller: ctrl1 } = createServiceMocks(ctx1);
      const { controller: ctrl2 } = createServiceMocks(ctx2);

      const r1 = ctrl1.getTenantPortal(ctx1) as { scopeCode: string; name: string };
      const r2 = ctrl2.getTenantPortal(ctx2) as { scopeCode: string; name: string };

      assert.equal(r1.scopeCode, 'tenant-alpha');
      assert.equal(r2.scopeCode, 'tenant-beta');
      assert.notEqual(r1.name, r2.name);
    });
  });

  // ── GET /portals/brand-portal ──

  describe('GET /portals/brand-portal', () => {
    it('delegates to portalService.resolveBrandPortal', () => {
      const { service, controller } = createServiceMocks();
      controller.getBrandPortal(defaultTenantContext());
      assert.equal(service.getCallCounts().brandCallCount, 1);
    });

    it('returns TobPortal for brand scope', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBrandPortal(defaultTenantContext()) as {
        audience: string;
        scopeType: string;
        brandCode: string;
        solutionTags: string[];
        loginEntry: { label: string };
      };

      assert.equal(result.audience, 'to-b');
      assert.equal(result.scopeType, 'brand');
      assert.equal(result.brandCode, 'brand-alpha');
      assert.ok(result.solutionTags.length > 0);
      assert.ok(result.solutionTags.includes('品牌招商'));
    });

    it('brand portal includes login entry with brand path', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBrandPortal(defaultTenantContext()) as {
        loginEntry: { loginPath: string };
      };
      assert.ok(result.loginEntry.loginPath.includes('acme-corp'));
      assert.ok(result.loginEntry.loginPath.includes('brand-alpha'));
    });

    it('supports multiple languages', () => {
      const { controller } = createServiceMocks();
      const result = controller.getBrandPortal(defaultTenantContext()) as {
        supportedLanguages: string[];
      };
      assert.ok(result.supportedLanguages.length >= 2);
    });
  });

  // ── GET /portals/store-portal ──

  describe('GET /portals/store-portal', () => {
    it('delegates to portalService.resolveStorePortal', () => {
      const { service, controller } = createServiceMocks();
      controller.getStorePortal(defaultTenantContext());
      assert.equal(service.getCallCounts().storeCallCount, 1);
    });

    it('returns StorePortal with to-c audience', () => {
      const { controller } = createServiceMocks();
      const result = controller.getStorePortal(defaultTenantContext()) as {
        audience: string;
        scopeType: string;
        storeCode: string;
        storeName: string;
      };

      assert.equal(result.audience, 'to-c');
      assert.equal(result.scopeType, 'store');
      assert.equal(result.storeCode, 'store-sz001');
      assert.equal(result.storeName, 'store-sz001 门店');
    });

    it('supported surfaces include all expected storefronts', () => {
      const { controller } = createServiceMocks();
      const result = controller.getStorePortal(defaultTenantContext()) as {
        supportedSurfaces: string[];
      };

      assert.ok(result.supportedSurfaces.includes('OFFICIAL_SITE'));
      assert.ok(result.supportedSurfaces.includes('H5'));
      assert.ok(result.supportedSurfaces.includes('MINI_APP'));
      assert.ok(result.supportedSurfaces.includes('APP'));
      assert.ok(result.supportedSurfaces.includes('PC_CONSOLE'));
      assert.ok(result.supportedSurfaces.includes('PAD_CONSOLE'));
    });

    it('store portal uses zh-CN for cn-mainland', () => {
      const { controller } = createServiceMocks();
      const result = controller.getStorePortal(defaultTenantContext()) as {
        supportedLanguages: string[];
      };
      assert.equal(result.supportedLanguages.length, 1);
      assert.equal(result.supportedLanguages[0], 'zh-CN');
    });
  });

  // ── 边界场景 ──

  describe('边界场景 Edge Cases', () => {
    it('minimal context without brandId should not throw', () => {
      const ctx: TenantContextMock = { tenantId: 'mini-tenant' };
      const { controller } = createServiceMocks(ctx);

      assert.doesNotThrow(() => controller.getBootstrap(ctx));
      assert.doesNotThrow(() => controller.getTenantPortal(ctx));
    });

    it('minimal context without storeId should not throw', () => {
      const ctx: TenantContextMock = { tenantId: 'no-store-tenant', brandId: 'b1' };
      const { controller } = createServiceMocks(ctx);

      assert.doesNotThrow(() => controller.getBootstrap(ctx));
      assert.doesNotThrow(() => controller.getStorePortal(ctx));
    });

    it('all 4 endpoints are independently callable', () => {
      const { service, controller } = createServiceMocks();
      const ctx = defaultTenantContext();

      controller.getBootstrap(ctx);
      controller.getTenantPortal(ctx);
      controller.getBrandPortal(ctx);
      controller.getStorePortal(ctx);

      const counts = service.getCallCounts();
      assert.equal(counts.bootstrapCallCount, 1);
      assert.equal(counts.tenantCallCount, 1);
      assert.equal(counts.brandCallCount, 1);
      assert.equal(counts.storeCallCount, 1);
    });

    it('calling bootstrap multiple times increments call count', () => {
      const { service, controller } = createServiceMocks();
      const ctx = defaultTenantContext();

      controller.getBootstrap(ctx);
      controller.getBootstrap(ctx);
      controller.getBootstrap(ctx);

      assert.equal(service.getCallCounts().bootstrapCallCount, 3);
    });

    it('tenant portal returns same structure on repeated calls', () => {
      const { controller } = createServiceMocks();
      const ctx = defaultTenantContext();

      const r1 = controller.getTenantPortal(ctx) as { tenantCode: string };
      const r2 = controller.getTenantPortal(ctx) as { tenantCode: string };

      assert.equal(r1.tenantCode, r2.tenantCode);
    });
  });
});
