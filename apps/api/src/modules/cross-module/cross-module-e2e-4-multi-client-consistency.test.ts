/**
 * 🦞 跨模块 E2E 测试链 #4: 多端一致性验证
 *
 * 模拟链路:
 *   API bootstrap → miniapp snapshot → app snapshot → admin-web → tob-web → storefront-web
 *
 * 验证:
 *   - 所有前端消费端从同一 API bootstrap 数据派生，结果一致
 *   - consumer contract 在各端输出结构稳定
 *   - foundation consumers 消费顺序正确
 *   - fallback snapshot 兜底机制
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 共享类型 ----

interface PortalBootstrapResponse {
  tenantPortal: Record<string, unknown>;
  brandPortal: Record<string, unknown>;
  storePortal: Record<string, unknown>;
  marketProfile: Record<string, unknown>;
  regionalOverrides: Record<string, unknown>[];
  foundationDependencies: string[];
  foundationContracts: string[];
}

interface BootstrapSnapshot {
  source: string; // 数据来源端
  storeCode: string;
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  apiBaseUrl: string;
}

interface RuntimeConsumerContract {
  consumerKey: string;
  scope: string;
  recommendedSequence: string[];
  governanceTouchpoints: string[];
  highRiskEntrypoints: string[];
}

interface WorkbenchSnapshot {
  roleCode: string;
  roleName: string;
  navItems: { label: string; path: string }[];
  supportedClients: string[];
}

interface WorkbenchBootstrapResponse {
  tenantContext: Record<string, unknown>;
  marketCodes: string[];
  supportedClients: string[];
  workbenches: WorkbenchSnapshot[];
  foundationDependencies: string[];
}

// ---- Mock bootstrap data ----

function createPortalBootstrapResponse(marketCode = 'cn-mainland'): PortalBootstrapResponse {
  const isCn = marketCode === 'cn-mainland';
  const regionPrefix = isCn ? 'cn' : 'us';
  const countryCode = isCn ? 'CN' : 'US';
  const marketName = isCn ? '中国大陆' : 'United States';
  const lang = isCn ? 'zh-CN' : 'en-US';
  const tz = isCn ? 'Asia/Shanghai' : 'America/New_York';
  const currency = isCn ? 'CNY' : 'USD';
  const currencySymbol = isCn ? '¥' : '$';
  const taxMode = isCn ? 'PRICES_INCLUDE_TAX' : 'PRICES_EXCLUDE_TAX';
  const taxRate = isCn ? 6 : 8.25;
  const taxLabel = isCn ? '增值税' : 'Sales Tax';
  const networkRegion = isCn ? 'MAINLAND_CHINA' : 'NORTH_AMERICA';
  const emailProvider = isCn ? 'ALIYUN_DM' : 'SENDGRID';
  const primaryPlatforms = isCn ? ['WECHAT'] : ['LINKEDIN'];
  const supportPlatforms = isCn ? ['WECHAT', 'WEIBO'] : ['LINKEDIN', 'INSTAGRAM'];

  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 'tenant-demo', tenantCode: 'tenant-demo',
      marketCode, channel: 'WEB', name: 'Tenant Portal',
      primaryDomain: `tenant-demo.${marketCode}.b2b.local`, supportedLanguages: [lang],
      heroTitle: '企业门户', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: `/${marketCode}/tenant-demo/login`, ssoEnabled: true },
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'brand-demo', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode, channel: 'WEB', name: 'Brand Portal',
      primaryDomain: `brand-demo.tenant-demo.${marketCode}.b2b.local`, supportedLanguages: [lang],
      heroTitle: '品牌门户', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: `/${marketCode}/tenant-demo/brand-demo/login`, ssoEnabled: true },
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-001', storeName: '旗舰店', marketCode,
      channel: 'WEB', name: 'store-001',
      primaryDomain: `store-001.brand-demo.tenant-demo.${marketCode}.local`,
      supportedLanguages: [lang],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    },
    marketProfile: {
      marketCode, marketName, countryCode,
      locale: { defaultLanguage: lang, supportedLanguages: [lang] },
      timezone: { timezone: tz },
      currency: { currencyCode: currency, symbol: currencySymbol },
      tax: { taxMode, taxRate, taxLabel },
      network: { networkRegion, apiBaseUrl: `https://${regionPrefix}-api.m5.local`, cdnBaseUrl: `https://${regionPrefix}-cdn.m5.local`, callbackBaseUrl: `https://${regionPrefix}-hooks.m5.local` },
      email: { provider: emailProvider, fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms, supportPlatforms },
    },
    regionalOverrides: [],
    foundationDependencies: ['postgres', 'redis'],
    foundationContracts: [],
  };
}

// 模拟 miniapp bootstrap 派生
function toMiniappSnapshot(portal: PortalBootstrapResponse): BootstrapSnapshot {
  const store = portal.storePortal;
  const market = portal.marketProfile;
  return {
    source: 'miniapp',
    storeCode: store.storeCode as string,
    marketCode: store.marketCode as string,
    tenantCode: store.tenantCode as string,
    brandCode: store.brandCode as string,
    apiBaseUrl: (market.network as Record<string, string>).apiBaseUrl,
  };
}

// 模拟 app (RN) bootstrap 派生
function toAppSnapshot(portal: PortalBootstrapResponse): BootstrapSnapshot {
  const store = portal.storePortal;
  const market = portal.marketProfile;
  return {
    source: 'app',
    storeCode: store.storeCode as string,
    marketCode: store.marketCode as string,
    tenantCode: store.tenantCode as string,
    brandCode: store.brandCode as string,
    apiBaseUrl: (market.network as Record<string, string>).apiBaseUrl,
  };
}

// 模拟 admin-web bootstrap 派生（关注治理读模型）
function toAdminSnapshot(portal: PortalBootstrapResponse): BootstrapSnapshot {
  return {
    source: 'admin-web',
    storeCode: 'N/A', // admin 不绑定单个门店
    marketCode: portal.tenantPortal.marketCode as string,
    tenantCode: portal.tenantPortal.tenantCode as string,
    brandCode: 'N/A',
    apiBaseUrl: (portal.marketProfile.network as Record<string, string>).apiBaseUrl,
  };
}

// 模拟 tob-web bootstrap 派生
function toTobSnapshot(portal: PortalBootstrapResponse): BootstrapSnapshot {
  const brand = portal.brandPortal;
  return {
    source: 'tob-web',
    storeCode: 'N/A',
    marketCode: brand.marketCode as string,
    tenantCode: brand.tenantCode as string,
    brandCode: brand.brandCode as string,
    apiBaseUrl: (portal.marketProfile.network as Record<string, string>).apiBaseUrl,
  };
}

// 模拟 storefront-web bootstrap 派生
function toStorefrontSnapshot(portal: PortalBootstrapResponse): BootstrapSnapshot {
  const store = portal.storePortal;
  return {
    source: 'storefront-web',
    storeCode: store.storeCode as string,
    marketCode: store.marketCode as string,
    tenantCode: store.tenantCode as string,
    brandCode: store.brandCode as string,
    apiBaseUrl: (portal.marketProfile.network as Record<string, string>).apiBaseUrl,
  };
}

// ---- Consumer contracts (foundation/consumers) ----

function createMarketConsumerContract(): RuntimeConsumerContract {
  return {
    consumerKey: 'market',
    scope: 'tenant/brand/store',
    recommendedSequence: ['market-bootstrap', 'portal-bootstrap', 'workbench-bootstrap'],
    governanceTouchpoints: ['market-profile-override', 'regional-config'],
    highRiskEntrypoints: ['market-override-write'],
  };
}

function createPortalConsumerContract(): RuntimeConsumerContract {
  return {
    consumerKey: 'portal',
    scope: 'tenant/brand/store',
    recommendedSequence: ['market-bootstrap', 'portal-bootstrap'],
    governanceTouchpoints: ['domain-override', 'login-policy-write'],
    highRiskEntrypoints: ['sso-toggle'],
  };
}

// ---- 测试链 #4 ----

test('E2E链#4 正例: 同一API bootstrap → 多端 snapshot 核心数据一致', () => {
  const portal = createPortalBootstrapResponse('cn-mainland');

  // 各端各自派生 snapshot
  const miniapp = toMiniappSnapshot(portal);
  const app = toAppSnapshot(portal);
  const storefront = toStorefrontSnapshot(portal);

  // 核心字段必须一致
  assert.equal(miniapp.marketCode, app.marketCode);
  assert.equal(miniapp.tenantCode, app.tenantCode);
  assert.equal(miniapp.brandCode, app.brandCode);
  assert.equal(miniapp.storeCode, app.storeCode);
  assert.equal(miniapp.apiBaseUrl, app.apiBaseUrl);
  assert.equal(miniapp.apiBaseUrl, storefront.apiBaseUrl);
});

test('E2E链#4 正例: admin/tob/storefront 三端从同一 portal 正确解析各自 role', () => {
  const portal = createPortalBootstrapResponse('cn-mainland');

  const admin = toAdminSnapshot(portal);
  const tob = toTobSnapshot(portal);
  const storefront = toStorefrontSnapshot(portal);

  // admin 关注 tenant 维度
  assert.equal(admin.source, 'admin-web');
  assert.equal(admin.tenantCode, 'tenant-demo');
  assert.equal(admin.storeCode, 'N/A');

  // tob-web 关注 brand 维度
  assert.equal(tob.source, 'tob-web');
  assert.equal(tob.brandCode, 'brand-demo');
  assert.equal(tob.storeCode, 'N/A');

  // storefront-web 关注 store 维度
  assert.equal(storefront.source, 'storefront-web');
  assert.equal(storefront.storeCode, 'store-001');
});

test('E2E链#4 边界: consumer 消费顺序应保持 market → portal → workbench', () => {
  const marketContract = createMarketConsumerContract();
  const portalContract = createPortalConsumerContract();

  // market consumer 先于 portal
  assert.equal(marketContract.recommendedSequence[0], 'market-bootstrap');
  assert.equal(portalContract.recommendedSequence[0], 'market-bootstrap');

  // 两个 consumer 都包含治理触点
  assert.ok(marketContract.governanceTouchpoints.length > 0);

  // 高风险入口标识
  assert.ok(marketContract.highRiskEntrypoints.length > 0, 'market 应标记高风险入口');
  assert.ok(portalContract.highRiskEntrypoints.length > 0, 'portal 应标记高风险入口');
});

test('E2E链#4 反例: 各端不应独立维护第二套事实源', () => {
  const portal = createPortalBootstrapResponse('cn-mainland');

  // 如果 miniapp 和 app 独立拼装 apiBaseUrl（而非从 portal 拿），会出现硬编码漂移
  const snapshot = toMiniappSnapshot(portal);
  
  // apiBaseUrl 应从 portal.marketProfile 派生，而非硬编码
  assert.equal(snapshot.apiBaseUrl, 'https://cn-api.m5.local');
  
  // 验证不是硬编码 - 换 US 市场后也应正确
  const usPortal = createPortalBootstrapResponse('us-default');
  const usSnapshot = toMiniappSnapshot(usPortal);
  assert.ok(usSnapshot.apiBaseUrl.includes('us'));
});

test('E2E链#4 边界: supportedSurfaces 6端 在 store portal 中全部声明', () => {
  const portal = createPortalBootstrapResponse();
  const store = portal.storePortal;

  const requiredSurfaces = ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'];
  const surfaces = store.supportedSurfaces as string[];

  for (const s of requiredSurfaces) {
    assert.ok(surfaces.includes(s), `storePortal 应声明 ${s}`);
  }
});

test('E2E链#4 反例: fallback snapshot 机制 - API 不可用时的退化', () => {
  // 模拟 API 失败的场景
  const createFallbackSnapshot = (): BootstrapSnapshot => ({
    source: 'miniapp-fallback',
    storeCode: 'store-fallback',
    marketCode: 'cn-mainland',
    tenantCode: 'tenant-fallback',
    brandCode: 'brand-fallback',
    apiBaseUrl: 'https://cn-api.m5.local', // 只保留最核心的 URL
  });

  const fallback = createFallbackSnapshot();
  
  // fallback 必须保证最小可用集
  assert.ok(fallback.marketCode, 'fallback 必须有 marketCode');
  assert.ok(fallback.apiBaseUrl, 'fallback 必须有 apiBaseUrl');
  assert.ok(fallback.tenantCode, 'fallback 必须有 tenantCode');
});

test('E2E链#4 跨市场: 中美两市场 bootstrap 多端产出不串台', () => {
  const cnPortal = createPortalBootstrapResponse('cn-mainland');
  const usPortal = createPortalBootstrapResponse('us-default');

  const cnMiniapp = toMiniappSnapshot(cnPortal);
  const usMiniapp = toMiniappSnapshot(usPortal);
  const cnApp = toAppSnapshot(cnPortal);
  const usApp = toAppSnapshot(usPortal);
  const cnAdmin = toAdminSnapshot(cnPortal);
  const usAdmin = toAdminSnapshot(usPortal);

  // 同市场同端一致
  assert.equal(cnMiniapp.apiBaseUrl, cnApp.apiBaseUrl);
  assert.equal(usMiniapp.apiBaseUrl, usApp.apiBaseUrl);

  // 不同市场隔离
  assert.notEqual(cnMiniapp.apiBaseUrl, usMiniapp.apiBaseUrl);
  assert.notEqual(cnAdmin.marketCode, usAdmin.marketCode);
  assert.notEqual(cnMiniapp.marketCode, usMiniapp.marketCode);
});

// ---- Workbench 多角色多端验证 ----

function createWorkbenchBootstrap(): WorkbenchBootstrapResponse {
  return {
    tenantContext: { tenantId: 'demo', marketCode: 'cn-mainland' },
    marketCodes: ['cn-mainland'],
    supportedClients: ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'],
    workbenches: [
      {
        roleCode: 'TENANT_ADMIN', roleName: '租户管理员',
        navItems: [{ label: '概览', path: '/dashboard' }, { label: '审批', path: '/approvals' }],
        supportedClients: ['PC', 'PAD'],
      },
      {
        roleCode: 'BRAND_MANAGER', roleName: '品牌经理',
        navItems: [{ label: '品牌', path: '/brand' }, { label: '方案', path: '/solutions' }],
        supportedClients: ['PC', 'PAD'],
      },
      {
        roleCode: 'STORE_MANAGER', roleName: '门店经理',
        navItems: [{ label: '门店', path: '/store' }, { label: '预约', path: '/bookings' }],
        supportedClients: ['PC', 'PAD', 'H5'],
      },
      {
        roleCode: 'GUIDE', roleName: '导购',
        navItems: [{ label: '接待', path: '/reception' }, { label: '会员', path: '/members' }],
        supportedClients: ['PAD', 'APP', 'MINIAPP'],
      },
      {
        roleCode: 'CASHIER', roleName: '收银员',
        navItems: [{ label: '收银', path: '/pos' }],
        supportedClients: ['PAD'],
      },
    ],
    foundationDependencies: ['postgres', 'redis'],
  };
}

test('E2E链#4 工作台: 5个角色各有专属 workbench', () => {
  const wb = createWorkbenchBootstrap();
  
  const roles = wb.workbenches.map(w => w.roleCode);
  assert.equal(roles.length, 5);
  assert.ok(roles.includes('TENANT_ADMIN'));
  assert.ok(roles.includes('BRAND_MANAGER'));
  assert.ok(roles.includes('STORE_MANAGER'));
  assert.ok(roles.includes('GUIDE'));
  assert.ok(roles.includes('CASHIER'));
});

test('E2E链#4 工作台: 导购只能用移动端', () => {
  const wb = createWorkbenchBootstrap();
  const guide = wb.workbenches.find(w => w.roleCode === 'GUIDE');
  assert.ok(guide);
  
  // 导购不应有 PC 端
  assert.ok(!guide.supportedClients.includes('PC'), '导购不应有 PC 权限');
  assert.ok(guide.supportedClients.includes('PAD'));
  assert.ok(guide.supportedClients.includes('MINIAPP'));
});

test('E2E链#4 工作台: 租户管理员只能用 PC/PAD', () => {
  const wb = createWorkbenchBootstrap();
  const admin = wb.workbenches.find(w => w.roleCode === 'TENANT_ADMIN');
  assert.ok(admin);
  
  assert.ok(admin.supportedClients.includes('PC'));
  assert.ok(admin.supportedClients.includes('PAD'));
  assert.ok(!admin.supportedClients.includes('MINIAPP'), '租户管理员不应有 MINIAPP');
  assert.ok(!admin.supportedClients.includes('APP'), '租户管理员不应有 APP');
  assert.ok(!admin.supportedClients.includes('H5'), '租户管理员不应有 H5');
});
