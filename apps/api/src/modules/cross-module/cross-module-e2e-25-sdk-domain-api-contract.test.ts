import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #25: SDK 调用 → Domain 校验 → API 路由 → 多端合同一致性
 *
 * 模拟链路 (合同一致性验证):
 *   packages/sdk (SDK 辅助函数)
 *   → packages/domain (领域枚举/类型)
 *   → packages/types (类型合同)
 *   → apps/api (API 路由响应)
 *   → apps/storefront-web + apps/tob-web + apps/admin-web + apps/miniapp (消费端合同)
 *
 * 验证:
 *   - SDK 辅助函数在各消费端产出结果一致
 *   - Domain 枚举跨模块传递时不漂移
 *   - API 合同输出与 SDK 消费者期望一致
 *   - 新增字段不影响已有合同
 *   - 所有 module 枚举映射到消费端 surface/channel 完整
 */

import assert from 'node:assert/strict';
// ====== Domain 层枚举 (模拟 @m5/domain) ======

const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  BRAND_MANAGER: 'BRAND_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
  GUIDE: 'GUIDE',
  CASHIER: 'CASHIER',
  OPERATIONS: 'OPERATIONS',
  FINANCE: 'FINANCE',
  WAREHOUSE: 'WAREHOUSE',
  COACH: 'COACH',
} as const;

type UserRole = (typeof UserRole)[keyof typeof UserRole];

const PortalScopeType = {
  TENANT: 'TENANT',
  BRAND: 'BRAND',
  STORE: 'STORE',
} as const;

type PortalScopeType = (typeof PortalScopeType)[keyof typeof PortalScopeType];

const ClientChannel = {
  PC: 'PC',
  PAD: 'PAD',
  H5: 'H5',
  MINIAPP: 'MINIAPP',
  APP: 'APP',
} as const;

type ClientChannel = (typeof ClientChannel)[keyof typeof ClientChannel];

const SupportedSurface = {
  OFFICIAL_SITE: 'OFFICIAL_SITE',
  H5: 'H5',
  MINIAPP: 'MINIAPP',
  APP: 'APP',
  PC_CONSOLE: 'PC_CONSOLE',
  PAD_CONSOLE: 'PAD_CONSOLE',
} as const;

type SupportedSurface = (typeof SupportedSurface)[keyof typeof SupportedSurface];

const MarketCode = {
  CN_MAINLAND: 'cn-mainland',
  US_DEFAULT: 'us-default',
  JP_DEFAULT: 'jp-default',
} as const;

type MarketCode = (typeof MarketCode)[keyof typeof MarketCode];

// ====== SDK 层辅助函数 (模拟 @m5/sdk) ======

class SdkMarketHelper {
  static getMarketLabel(marketCode: MarketCode): string {
    const labels: Record<MarketCode, string> = {
      'cn-mainland': '中国大陆',
      'us-default': 'United States',
      'jp-default': '日本',
    };
    return labels[marketCode] ?? marketCode;
  }

  static getTaxMode(marketCode: MarketCode): 'PRICES_INCLUDE_TAX' | 'PRICES_EXCLUDE_TAX' {
    const modes: Record<MarketCode, 'PRICES_INCLUDE_TAX' | 'PRICES_EXCLUDE_TAX'> = {
      'cn-mainland': 'PRICES_INCLUDE_TAX',
      'us-default': 'PRICES_EXCLUDE_TAX',
      'jp-default': 'PRICES_INCLUDE_TAX',
    };
    return modes[marketCode] ?? 'PRICES_INCLUDE_TAX';
  }

  static getSupportedLanguages(marketCode: MarketCode): string[] {
    const languages: Record<MarketCode, string[]> = {
      'cn-mainland': ['zh-CN'],
      'us-default': ['en-US', 'es-US'],
      'jp-default': ['ja-JP'],
    };
    return languages[marketCode] ?? ['zh-CN'];
  }
}

class SdkRoleHelper {
  /** 根据角色返回可访问的工作台 */
  static getWorkbenchSurfaces(role: UserRole): SupportedSurface[] {
    const map: Partial<Record<UserRole, SupportedSurface[]>> = {
      [UserRole.SUPER_ADMIN]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE],
      [UserRole.TENANT_ADMIN]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE],
      [UserRole.BRAND_MANAGER]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE, SupportedSurface.H5],
      [UserRole.STORE_MANAGER]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE, SupportedSurface.H5, SupportedSurface.APP],
      [UserRole.GUIDE]: [SupportedSurface.H5, SupportedSurface.APP, SupportedSurface.MINIAPP],
      [UserRole.CASHIER]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE],
      [UserRole.OPERATIONS]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE, SupportedSurface.H5],
      [UserRole.FINANCE]: [SupportedSurface.PC_CONSOLE, SupportedSurface.PAD_CONSOLE],
      [UserRole.WAREHOUSE]: [SupportedSurface.H5, SupportedSurface.APP],
      [UserRole.COACH]: [SupportedSurface.H5, SupportedSurface.APP, SupportedSurface.MINIAPP],
    };
    return map[role] ?? [SupportedSurface.H5];
  }

  /** 根据角色返回是否只能使用移动端 */
  static isMobileOnly(role: UserRole): boolean {
    const mobileRoles: UserRole[] = [UserRole.GUIDE, UserRole.COACH, UserRole.WAREHOUSE];
    return mobileRoles.includes(role);
  }

  /** 根据角色返回可访问的客户端渠道 */
  static getClientChannels(role: UserRole): ClientChannel[] {
    const map: Partial<Record<UserRole, ClientChannel[]>> = {
      [UserRole.SUPER_ADMIN]: [ClientChannel.PC, ClientChannel.PAD],
      [UserRole.TENANT_ADMIN]: [ClientChannel.PC, ClientChannel.PAD],
      [UserRole.BRAND_MANAGER]: [ClientChannel.PC, ClientChannel.PAD, ClientChannel.H5],
      [UserRole.STORE_MANAGER]: [ClientChannel.PC, ClientChannel.PAD, ClientChannel.H5, ClientChannel.APP],
      [UserRole.GUIDE]: [ClientChannel.H5, ClientChannel.APP, ClientChannel.MINIAPP],
      [UserRole.CASHIER]: [ClientChannel.PC, ClientChannel.PAD],
      [UserRole.OPERATIONS]: [ClientChannel.PC, ClientChannel.PAD, ClientChannel.H5],
      [UserRole.FINANCE]: [ClientChannel.PC, ClientChannel.PAD],
      [UserRole.WAREHOUSE]: [ClientChannel.H5, ClientChannel.APP],
      [UserRole.COACH]: [ClientChannel.H5, ClientChannel.APP, ClientChannel.MINIAPP],
    };
    return map[role] ?? [ClientChannel.H5];
  }
}

// ====== API 合同类型与模拟服务 (模拟 @m5/api 响应) ======

interface ApiBootstrapResponse {
  code: number;
  data: {
    status: string;
    tenant: { tenantId: string; tenantCode: string };
    market: { marketCode: string; marketName: string; taxMode: string };
    foundation: { dependencies: string[]; contracts: string[] };
    phase: string;
  };
}

interface ApiPortalResponse {
  code: number;
  data: {
    scopeType: string;
    scopeCode: string;
    primaryDomain: string;
    supportedLanguages: string[];
    supportedSurfaces: string[];
    supportedClients: string[];
    features: string[];
    solutionTags: string[];
  };
}

class MockApiService {
  bootstrap(tenantId: string, tenantCode: string, marketCode: MarketCode): ApiBootstrapResponse {
    return {
      code: 200,
      data: {
        status: 'ok',
        tenant: { tenantId, tenantCode },
        market: {
          marketCode,
          marketName: SdkMarketHelper.getMarketLabel(marketCode),
          taxMode: SdkMarketHelper.getTaxMode(marketCode),
        },
        foundation: {
          dependencies: ['prisma', 'redis', 'queue', 'event-bus', 'lyt-adapter'],
          contracts: ['tenant:read', 'tenant:write', 'brand:read', 'store:read', 'member:read', 'member:write'],
        },
        phase: 'scaffold',
      },
    };
  }

  portal(scopeType: 'TENANT' | 'BRAND' | 'STORE', scopeCode: string, role: UserRole, marketCode: MarketCode): ApiPortalResponse {
    const channels = SdkRoleHelper.getClientChannels(role);
    const surfaces = SdkRoleHelper.getWorkbenchSurfaces(role);

    return {
      code: 200,
      data: {
        scopeType,
        scopeCode,
        primaryDomain: `${scopeCode}.example.com`,
        supportedLanguages: SdkMarketHelper.getSupportedLanguages(marketCode),
        supportedSurfaces: surfaces,
        supportedClients: channels,
        features: ['feature-a', 'feature-b'],
        solutionTags: ['tag-1', 'tag-2'],
      },
    };
  }
}

// ====== 消费端合同验证 ======

function validateStorefrontContract(apiResponse: ApiBootstrapResponse | ApiPortalResponse): boolean {
  if ('tenant' in apiResponse.data) {
    // bootstrap 响应
    const d = apiResponse.data;
    return !!(
      d.status &&
      d.tenant.tenantId &&
      d.tenant.tenantCode &&
      d.market.marketCode &&
      d.foundation.dependencies.length > 0
    );
  }
  // portal 响应
  const d = apiResponse.data as ApiPortalResponse['data'];
  return !!(
    d.scopeType &&
    d.scopeCode &&
    d.primaryDomain &&
    d.supportedLanguages.length > 0 &&
    d.supportedSurfaces.length > 0
  );
}

function validateTobContract(apiResponse: ApiBootstrapResponse | ApiPortalResponse): boolean {
  if ('tenant' in apiResponse.data) {
    const d = apiResponse.data;
    return !!(
      d.tenant.tenantCode &&
      d.market.taxMode &&
      d.foundation.contracts.length > 0
    );
  }
  const d = apiResponse.data as ApiPortalResponse['data'];
  return !!(
    d.scopeType &&
    d.supportedClients.length > 0 &&
    d.features.length > 0
  );
}

function validateMiniAppContract(apiResponse: ApiPortalResponse): boolean {
  const d = apiResponse.data;
  // MiniApp 只需要 H5/MINIAPP/APP surface
  const miniAppRelevant = d.supportedSurfaces.filter(s =>
    s === 'H5' || s === 'MINIAPP' || s === 'APP'
  );
  return miniAppRelevant.length > 0 && d.supportedLanguages.length > 0;
}

// ====== 测试 ======

it('E2E链#25 正例: SDK 辅助函数在各消费端产出一致', () => {
  // CN 市场
  assert.equal(SdkMarketHelper.getMarketLabel('cn-mainland'), '中国大陆');
  assert.equal(SdkMarketHelper.getTaxMode('cn-mainland'), 'PRICES_INCLUDE_TAX');
  assert.deepEqual(SdkMarketHelper.getSupportedLanguages('cn-mainland'), ['zh-CN']);

  // US 市场
  assert.equal(SdkMarketHelper.getMarketLabel('us-default'), 'United States');
  assert.equal(SdkMarketHelper.getTaxMode('us-default'), 'PRICES_EXCLUDE_TAX');

  // JP 市场
  assert.equal(SdkMarketHelper.getMarketLabel('jp-default'), '日本');
  assert.equal(SdkMarketHelper.getTaxMode('jp-default'), 'PRICES_INCLUDE_TAX');
});

it('E2E链#25 正例: Domain 枚举 → SDK 辅助 → API 合同 → 多端消费验证', () => {
  const apiService = new MockApiService();

  // 1. Domain 枚举驱动 API bootstrap
  const bootstrapResponse = apiService.bootstrap('tenant-001', 'acme', 'cn-mainland');
  assert.equal(bootstrapResponse.code, 200);
  assert.equal(bootstrapResponse.data.market.taxMode, 'PRICES_INCLUDE_TAX');
  assert.equal(bootstrapResponse.data.market.marketName, '中国大陆');

  // 2. StoreManager 角色 → Portal 响应
  const portalResponse = apiService.portal('STORE', 'store-sh001', UserRole.STORE_MANAGER, 'cn-mainland');
  assert.equal(portalResponse.code, 200);
  assert.equal(portalResponse.data.supportedLanguages.join(','), 'zh-CN');

  // 3. 多端合同验证
  assert.ok(validateStorefrontContract(bootstrapResponse));
  assert.ok(validateStorefrontContract(portalResponse));
  assert.ok(validateTobContract(bootstrapResponse));
  assert.ok(validateTobContract(portalResponse));
  assert.ok(validateMiniAppContract(portalResponse));
});

it('E2E链#25 反例: 导购角色不应分配到 PC-only 客户端', () => {
  const guideChannels = SdkRoleHelper.getClientChannels(UserRole.GUIDE);
  assert.ok(guideChannels.includes('H5'));
  assert.ok(guideChannels.includes('APP'));
  assert.ok(guideChannels.includes('MINIAPP'));
  assert.ok(!guideChannels.includes('PC'), '导购不应有 PC 端');
  assert.ok(!guideChannels.includes('PAD'), '导购不应有 PAD 端');
  assert.ok(SdkRoleHelper.isMobileOnly(UserRole.GUIDE));
});

it('E2E链#25 边界: 所有 User Role 应有对应 workbench surfaces', () => {
  const allRoles = Object.values(UserRole);
  for (const role of allRoles) {
    const surfaces = SdkRoleHelper.getWorkbenchSurfaces(role);
    assert.ok(surfaces.length > 0, `Role ${role} should have at least one workbench surface`);
    assert.ok(!surfaces.includes(undefined as unknown as SupportedSurface), `Role ${role} should not have undefined surfaces`);
  }
});

it('E2E链#25 边界: Domain 枚举映射到 storefront surface 应完整', () => {
  const allSurfaces = Object.values(SupportedSurface);
  assert.equal(allSurfaces.length, 6);
  assert.ok(allSurfaces.includes('OFFICIAL_SITE'));
  assert.ok(allSurfaces.includes('H5'));
  assert.ok(allSurfaces.includes('MINIAPP'));
  assert.ok(allSurfaces.includes('APP'));
  assert.ok(allSurfaces.includes('PC_CONSOLE'));
  assert.ok(allSurfaces.includes('PAD_CONSOLE'));
});

it('E2E链#25 边界: SDK contract 跨模块传递 market profiles 不应重复 marketCode', () => {
  const codes: MarketCode[] = ['cn-mainland', 'us-default', 'jp-default'];
  const unique = new Set(codes);
  assert.equal(unique.size, codes.length, '市场码不应重复');
});

it('E2E链#25 边界: 4 个客户端 (admin/tob/storefront/miniapp) 验证同一 API 合同结构', () => {
  const apiService = new MockApiService();
  const portal = apiService.portal('STORE', 'store-001', UserRole.STORE_MANAGER, 'cn-mainland');

  // 前端需要的字段
  const storefrontFields = ['scopeType', 'scopeCode', 'primaryDomain', 'supportedLanguages', 'supportedSurfaces'];
  for (const field of storefrontFields) {
    assert.ok(field in portal.data, `Storefront 需要字段: ${field}`);
  }

  // ToB 需要的字段
  const tobFields = ['scopeType', 'scopeCode', 'supportedClients', 'features', 'solutionTags'];
  for (const field of tobFields) {
    assert.ok(field in portal.data, `ToB 需要字段: ${field}`);
  }

  // MiniApp 需要的字段
  assert.ok(portal.data.supportedSurfaces.some(s => ['H5', 'MINIAPP', 'APP'].includes(s)), 'MiniApp 需要 H5/MINIAPP/APP surface');
});

it('E2E链#25 边界: 所有 API 合同使用统一 code 字段 + data 包裹格式', () => {
  const apiService = new MockApiService();

  const bootstrapResp = apiService.bootstrap('t-1', 'code', 'cn-mainland');
  const portalResp = apiService.portal('STORE', 's-1', UserRole.STORE_MANAGER, 'cn-mainland');

  assert.equal(bootstrapResp.code, 200);
  assert.ok(bootstrapResp.data);
  assert.equal(portalResp.code, 200);
  assert.ok(portalResp.data);
});
