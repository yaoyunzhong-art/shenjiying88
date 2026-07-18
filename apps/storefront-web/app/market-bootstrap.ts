import {
  ApiClient,
  createFoundationPortalConsumerSnapshotBase,
  createFoundationGovernanceReadModelLoader,
  getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor,
  type FoundationGovernanceReadModel
} from '@m5/sdk';
import {
  getFoundationAppBootstrapWiring,
  type AppBootstrapWiring,
  type FoundationConsumerDescriptor,
  type PortalBootstrapResponse,
  type StorePortalContract
} from '@m5/types';

export const storefrontWebBootstrap = getFoundationAppBootstrapWiring('storefront-web');

export interface StorefrontConsumerSnapshot {
  deliveryMode: 'api' | 'fallback';
  wiring: AppBootstrapWiring;
  consumerDescriptor: FoundationConsumerDescriptor;
  portal: StorePortalContract;
  foundationDependencies: string[];
  foundationContracts: string[];
  regionalOverridesCount: number;
  scope: {
    scopePath: string;
    resolver: string;
    mismatchStrategy: string;
    revalidateOn: string[];
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
  governance: StorefrontGovernanceReadModel;
}

export type StorefrontGovernanceReadModel = FoundationGovernanceReadModel;

const STOREFRONT_SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'];

function getFallbackDefaultLanguage(marketCode: string): string {
  return marketCode === 'cn-mainland' ? 'zh-CN' : 'en-US';
}

function resolveFallbackStoreLanguages(
  marketCode: string,
  localeHint?: Partial<PortalBootstrapResponse['marketProfile']['locale']>
): string[] {
  const fallbackDefaultLanguage = getFallbackDefaultLanguage(marketCode);
  const defaultLanguage = STOREFRONT_SUPPORTED_LANGUAGES.includes(localeHint?.defaultLanguage ?? '')
    ? localeHint!.defaultLanguage!
    : fallbackDefaultLanguage;
  const normalized: string[] = [];

  for (const language of [...(localeHint?.supportedLanguages ?? []), defaultLanguage, fallbackDefaultLanguage]) {
    if (!STOREFRONT_SUPPORTED_LANGUAGES.includes(language)) continue;
    if (!normalized.includes(language)) {
      normalized.push(language);
    }
  }

  return normalized.length > 0 ? normalized : [fallbackDefaultLanguage];
}

function getFallbackStorePortal(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string,
  bootstrap?: PortalBootstrapResponse | null
): StorePortalContract {
  const supportedLanguages = resolveFallbackStoreLanguages(marketCode, bootstrap?.marketProfile?.locale);

  return {
    audience: 'TOC',
    scopeType: 'STORE',
    scopeCode: storeCode,
    tenantCode,
    brandCode,
    storeCode,
    storeName: `${storeCode} 门店`,
    marketCode,
    channel: 'WEB',
    name: `${storeCode} 门店门户`,
    primaryDomain: `${storeCode}.${brandCode}.${tenantCode}.${marketCode}.local`,
    supportedLanguages,
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    domainSource: 'default'
  };
}

function createStorePortalClient(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: tenantCode,
    brandId: brandCode,
    storeId: storeCode,
    marketCode
  });
}

async function loadPortalBootstrap(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
): Promise<PortalBootstrapResponse | null> {
  try {
    return await createStorePortalClient(marketCode, tenantCode, brandCode, storeCode).getPortalBootstrap({
      cache: 'no-store'
    });
  } catch {
    return null;
  }
}

async function loadPortalConsumerDescriptor(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
): Promise<FoundationConsumerDescriptor | null> {
  return loadFoundationConsumerDescriptor(createStorePortalClient(marketCode, tenantCode, brandCode, storeCode), 'portal');
}

export const loadStorefrontGovernanceReadModel: (
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
) => Promise<StorefrontGovernanceReadModel> = createFoundationGovernanceReadModelLoader(createStorePortalClient);

export async function getStorefrontConsumerSnapshot(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
): Promise<StorefrontConsumerSnapshot> {
  const [bootstrap, governance, consumerDescriptor] = await Promise.all([
    loadPortalBootstrap(marketCode, tenantCode, brandCode, storeCode),
    loadStorefrontGovernanceReadModel(marketCode, tenantCode, brandCode, storeCode),
    loadPortalConsumerDescriptor(marketCode, tenantCode, brandCode, storeCode)
  ]);
  const portal =
    bootstrap?.storePortal ?? getFallbackStorePortal(marketCode, tenantCode, brandCode, storeCode, bootstrap);
  const snapshotBase = createFoundationPortalConsumerSnapshotBase({
    wiring: storefrontWebBootstrap,
    bootstrap,
    consumerDescriptor
  });

  return {
    ...snapshotBase,
    portal,
    scope: {
      scopePath: `${portal.marketCode} / ${portal.tenantCode} / ${portal.brandCode} / ${portal.storeCode}`,
      ...snapshotBase.scope
    },
    governance
  };
}

export async function getStorePortal(
  marketCode: string,
  tenantCode: string,
  brandCode: string,
  storeCode: string
): Promise<StorePortalContract> {
  const snapshot = await getStorefrontConsumerSnapshot(marketCode, tenantCode, brandCode, storeCode);
  return snapshot.portal;
}

export async function getStorefrontLandingSnapshot() {
  const [cnStore, usStore] = await Promise.all([
    getStorefrontConsumerSnapshot('cn-mainland', 'demo-tenant', 'demo-brand', 'store-001'),
    getStorefrontConsumerSnapshot('us-default', 'demo-tenant', 'demo-brand', 'store-001')
  ]);

  return {
    wiring: storefrontWebBootstrap,
    cnStore,
    usStore
  };
}
