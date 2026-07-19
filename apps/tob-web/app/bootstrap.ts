import {
  ApiClient,
  buildActorHeaders,
  createFoundationPortalConsumerSnapshotBase,
  createFoundationGovernanceReadModelLoader,
  getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor,
  type FoundationGovernanceReadModel
} from '@m5/sdk';
import {
  buildDomainGovernanceWorkspaceHref,
  getFoundationAppBootstrapWiring,
  type AppBootstrapWiring,
  type FoundationConsumerDescriptor,
  type MarketProfileContract,
  type PortalDomainGovernanceSummaryContract,
  type PortalBootstrapResponse,
  type PortalLoginEntryContract,
  type TobPortalContract
} from '@m5/types';

export const tobWebBootstrap = getFoundationAppBootstrapWiring('tob-web');

const portalBootstrapActor = {
  actorId: 'portal-bootstrap-operator',
  actorType: 'employee-user',
  actorName: 'Portal Bootstrap Operator',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['foundation.governance.read'],
  authenticated: true,
} as const;

export interface TobPortalConsumerSnapshot {
  deliveryMode: 'api' | 'fallback';
  wiring: AppBootstrapWiring;
  consumerDescriptor: FoundationConsumerDescriptor;
  portal: TobPortalContract;
  market: MarketProfileContract;
  domainGovernance: PortalDomainGovernanceSummaryContract;
  domainGovernanceWorkspaceHref: string;
  foundationDependencies: string[];
  foundationContracts: string[];
  regionalOverridesCount: number;
  scope: {
    resolver: string;
    revalidateOn: string[];
    mismatchStrategy: string;
  };
  degradation: {
    featureFlagFallback: string;
    desensitizationMode: string;
    cacheableCapabilities: string[];
  };
  challenge: {
    enforcement: string;
    notes: string[];
  };
  governance: TobGovernanceReadModel;
}

export type TobGovernanceReadModel = FoundationGovernanceReadModel;

function createFallbackDomainGovernanceSummary(): PortalDomainGovernanceSummaryContract {
  return {
    totalMissingPrimaryScopes: 0,
    totalActiveWithoutPrimaryDomains: 0,
    recommendedReadyScopes: 0,
    tenantMissingPrimaryScopes: 0,
    brandMissingPrimaryScopes: 0,
    storeMissingPrimaryScopes: 0,
    requiresAttention: false,
    lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
    currentScopes: []
  };
}

function getFallbackMarketProfile(marketCode: string): MarketProfileContract {
  const profiles: Record<string, MarketProfileContract> = {
    'cn-mainland': {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: {
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN']
      },
      timezone: {
        timezone: 'Asia/Shanghai'
      },
      currency: {
        currencyCode: 'CNY',
        symbol: '¥'
      },
      tax: {
        taxMode: 'PRICES_INCLUDE_TAX',
        taxRate: 6,
        taxLabel: '增值税'
      },
      network: {
        networkRegion: 'MAINLAND_CHINA',
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local'
      },
      email: {
        provider: 'ALIYUN_DM',
        fromName: 'M5 China',
        fromAddress: 'hello-cn@m5.local',
        replyTo: 'support-cn@m5.local'
      },
      social: {
        primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'],
        supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN']
      }
    },
    'us-default': {
      marketCode: 'us-default',
      marketName: 'United States',
      countryCode: 'US',
      locale: {
        defaultLanguage: 'en-US',
        supportedLanguages: ['en-US']
      },
      timezone: {
        timezone: 'America/New_York'
      },
      currency: {
        currencyCode: 'USD',
        symbol: '$'
      },
      tax: {
        taxMode: 'PRICES_EXCLUDE_TAX',
        taxRate: 8.25,
        taxLabel: 'Sales Tax'
      },
      network: {
        networkRegion: 'NORTH_AMERICA',
        apiBaseUrl: 'https://us-api.m5.local',
        cdnBaseUrl: 'https://us-cdn.m5.local',
        callbackBaseUrl: 'https://us-hooks.m5.local'
      },
      email: {
        provider: 'SENDGRID',
        fromName: 'M5 US',
        fromAddress: 'hello-us@m5.local',
        replyTo: 'support-us@m5.local'
      },
      social: {
        primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'],
        supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X']
      }
    },
    'sea-sg': {
      marketCode: 'sea-sg',
      marketName: 'Singapore',
      countryCode: 'SG',
      locale: {
        defaultLanguage: 'en-SG',
        supportedLanguages: ['en-SG', 'zh-CN']
      },
      timezone: {
        timezone: 'Asia/Singapore'
      },
      currency: {
        currencyCode: 'SGD',
        symbol: 'S$'
      },
      tax: {
        taxMode: 'PRICES_INCLUDE_TAX',
        taxRate: 9,
        taxLabel: 'GST'
      },
      network: {
        networkRegion: 'SOUTHEAST_ASIA',
        apiBaseUrl: 'https://sg-api.m5.local',
        cdnBaseUrl: 'https://sg-cdn.m5.local',
        callbackBaseUrl: 'https://sg-hooks.m5.local'
      },
      email: {
        provider: 'SENDGRID',
        fromName: 'M5 Singapore',
        fromAddress: 'hello-sg@m5.local',
        replyTo: 'support-sg@m5.local'
      },
      social: {
        primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'],
        supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP']
      }
    },
    'jp-tokyo': {
      marketCode: 'jp-tokyo',
      marketName: 'Japan',
      countryCode: 'JP',
      locale: {
        defaultLanguage: 'ja-JP',
        supportedLanguages: ['ja-JP', 'en-US']
      },
      timezone: {
        timezone: 'Asia/Tokyo'
      },
      currency: {
        currencyCode: 'JPY',
        symbol: '¥'
      },
      tax: {
        taxMode: 'PRICES_INCLUDE_TAX',
        taxRate: 10,
        taxLabel: '消費税'
      },
      network: {
        networkRegion: 'JAPAN',
        apiBaseUrl: 'https://jp-api.m5.local',
        cdnBaseUrl: 'https://jp-cdn.m5.local',
        callbackBaseUrl: 'https://jp-hooks.m5.local'
      },
      email: {
        provider: 'SES',
        fromName: 'M5 Japan',
        fromAddress: 'hello-jp@m5.local',
        replyTo: 'support-jp@m5.local'
      },
      social: {
        primaryPlatforms: ['LINE', 'X'],
        supportPlatforms: ['LINE', 'X', 'INSTAGRAM']
      }
    },
    'eu-de': {
      marketCode: 'eu-de',
      marketName: 'Germany',
      countryCode: 'DE',
      locale: {
        defaultLanguage: 'de-DE',
        supportedLanguages: ['de-DE', 'en-US']
      },
      timezone: {
        timezone: 'Europe/Berlin'
      },
      currency: {
        currencyCode: 'EUR',
        symbol: 'EUR'
      },
      tax: {
        taxMode: 'PRICES_INCLUDE_TAX',
        taxRate: 19,
        taxLabel: 'MwSt'
      },
      network: {
        networkRegion: 'EUROPE',
        apiBaseUrl: 'https://eu-api.m5.local',
        cdnBaseUrl: 'https://eu-cdn.m5.local',
        callbackBaseUrl: 'https://eu-hooks.m5.local'
      },
      email: {
        provider: 'SES',
        fromName: 'M5 Europe',
        fromAddress: 'hello-eu@m5.local',
        replyTo: 'support-eu@m5.local'
      },
      social: {
        primaryPlatforms: ['LINKEDIN', 'XING'],
        supportPlatforms: ['LINKEDIN', 'XING', 'INSTAGRAM']
      }
    }
  }

  return profiles[marketCode] ?? profiles['us-default']!
}

function buildLoginEntry(label: string, loginPath: string): PortalLoginEntryContract {
  return {
    label,
    loginPath,
    ssoEnabled: true
  };
}

function getFallbackTenantPortal(marketCode: string, tenantCode: string): { portal: TobPortalContract; market: MarketProfileContract } {
  const market = getFallbackMarketProfile(marketCode);
  return {
    market,
    portal: {
      audience: 'TOB',
      scopeType: 'TENANT',
      scopeCode: tenantCode,
      tenantCode,
      marketCode,
      channel: 'WEB',
      name: `${tenantCode} ToB 官网`,
      primaryDomain: `${tenantCode}.${marketCode}.b2b.local`,
      supportedLanguages: market.locale.supportedLanguages,
      heroTitle: `${tenantCode} 企业级经营官网`,
      heroSubtitle: '统一承接租户解决方案、渠道合作、门店网络能力展示与后台登录入口。',
      solutionTags: ['多租户 SaaS', '全球化配置', '门店网络', '数据经营'],
      loginEntry: buildLoginEntry('进入租户后台', `/${marketCode}/${tenantCode}/login`),
      domainSource: 'default'
    }
  };
}

function getFallbackBrandPortal(
  marketCode: string,
  tenantCode: string,
  brandCode: string
): { portal: TobPortalContract; market: MarketProfileContract } {
  const market = getFallbackMarketProfile(marketCode);
  return {
    market,
    portal: {
      audience: 'TOB',
      scopeType: 'BRAND',
      scopeCode: brandCode,
      tenantCode,
      brandCode,
      marketCode,
      channel: 'WEB',
      name: `${brandCode} 品牌 ToB 官网`,
      primaryDomain: `${brandCode}.${tenantCode}.${marketCode}.b2b.local`,
      supportedLanguages: market.locale.supportedLanguages,
      heroTitle: `${brandCode} 品牌增长官网`,
      heroSubtitle: '面向招商加盟、品牌合作、联合营销、赛事活动和品牌后台登录的统一入口。',
      solutionTags: ['品牌招商', '品牌联营', '全球社媒', '品牌后台'],
      loginEntry: buildLoginEntry('进入品牌后台', `/${marketCode}/${tenantCode}/${brandCode}/login`),
      domainSource: 'default'
    }
  };
}

function createPortalClient(marketCode: string, tenantCode: string, brandCode?: string) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: tenantCode,
    brandId: brandCode,
    marketCode,
    headers: buildActorHeaders({
      ...portalBootstrapActor,
      tenantId: tenantCode,
      brandId: brandCode,
    })
  });
}

async function loadPortalBootstrap(
  marketCode: string,
  tenantCode: string,
  brandCode?: string
): Promise<PortalBootstrapResponse | null> {
  try {
    return await createPortalClient(marketCode, tenantCode, brandCode).getPortalBootstrap({ cache: 'no-store' });
  } catch {
    return null;
  }
}

async function loadPortalConsumerDescriptor(
  marketCode: string,
  tenantCode: string,
  brandCode?: string
): Promise<FoundationConsumerDescriptor | null> {
  return loadFoundationConsumerDescriptor(createPortalClient(marketCode, tenantCode, brandCode), 'portal');
}

async function loadPortalDomainGovernance(
  marketCode: string,
  tenantCode: string,
  brandCode?: string
): Promise<PortalDomainGovernanceSummaryContract> {
  try {
    return await createPortalClient(marketCode, tenantCode, brandCode).getPortalDomainGovernanceSummary({
      cache: 'no-store'
    });
  } catch {
    return createFallbackDomainGovernanceSummary();
  }
}

export const loadTobGovernanceReadModel: (
  marketCode: string,
  tenantCode: string,
  brandCode?: string
)=> Promise<TobGovernanceReadModel> = createFoundationGovernanceReadModelLoader(createPortalClient);

async function buildPortalConsumerSnapshot(
  marketCode: string,
  tenantCode: string,
  brandCode?: string
): Promise<TobPortalConsumerSnapshot> {
  const [bootstrap, governance, consumerDescriptor, domainGovernance] = await Promise.all([
    loadPortalBootstrap(marketCode, tenantCode, brandCode),
    loadTobGovernanceReadModel(marketCode, tenantCode, brandCode),
    loadPortalConsumerDescriptor(marketCode, tenantCode, brandCode),
    loadPortalDomainGovernance(marketCode, tenantCode, brandCode)
  ]);

  const fallback = brandCode
    ? getFallbackBrandPortal(marketCode, tenantCode, brandCode)
    : getFallbackTenantPortal(marketCode, tenantCode);

  const portal =
    brandCode && bootstrap?.brandPortal ? bootstrap.brandPortal : !brandCode && bootstrap?.tenantPortal ? bootstrap.tenantPortal : fallback.portal;

  const snapshotBase = createFoundationPortalConsumerSnapshotBase({
    wiring: tobWebBootstrap,
    bootstrap,
    consumerDescriptor
  });

  return {
    ...snapshotBase,
    portal,
    market: bootstrap?.marketProfile ?? fallback.market,
    domainGovernance,
    domainGovernanceWorkspaceHref: buildDomainGovernanceWorkspaceHref(domainGovernance, portal.marketCode),
    governance
  };
}

export async function getTenantPortal(
  marketCode: string,
  tenantCode: string
): Promise<{ portal: TobPortalContract; market: MarketProfileContract }> {
  const snapshot = await buildPortalConsumerSnapshot(marketCode, tenantCode);
  return { portal: snapshot.portal, market: snapshot.market };
}

export async function getBrandPortal(
  marketCode: string,
  tenantCode: string,
  brandCode: string
): Promise<{ portal: TobPortalContract; market: MarketProfileContract }> {
  const snapshot = await buildPortalConsumerSnapshot(marketCode, tenantCode, brandCode);
  return { portal: snapshot.portal, market: snapshot.market };
}

export async function getTenantPortalConsumerSnapshot(marketCode: string, tenantCode: string) {
  return buildPortalConsumerSnapshot(marketCode, tenantCode);
}

export async function getBrandPortalConsumerSnapshot(marketCode: string, tenantCode: string, brandCode: string) {
  return buildPortalConsumerSnapshot(marketCode, tenantCode, brandCode);
}

export async function getTobLandingSnapshot() {
  const [tenantPortal, brandPortal] = await Promise.all([
    getTenantPortalConsumerSnapshot('cn-mainland', 'demo-tenant'),
    getBrandPortalConsumerSnapshot('us-default', 'demo-tenant', 'demo-brand')
  ]);

  return {
    wiring: tobWebBootstrap,
    tenantPortal,
    brandPortal
  };
}
