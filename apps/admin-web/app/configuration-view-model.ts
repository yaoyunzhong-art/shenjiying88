import {
  type ConfigurationCertificateMetadata,
  type ConfigurationConfigEntry,
  type ConfigurationFeatureFlag,
  type ConfigurationGovernanceMetadataEntry,
  type ConfigurationOverview,
  type ConfigurationOverviewQuery,
  type ConfigurationPosture,
  type ConfigurationScope,
  type ConfigurationSecretMetadata,
  buildConfigurationHref
} from '@m5/types';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

export interface ConfigurationSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: ConfigurationOverviewQuery;
  overview: ConfigurationOverview;
  managementMetadata: ConfigurationGovernanceMetadataEntry[];
}

const FALLBACK_SCOPE: ConfigurationScope = {
  scopeType: 'PLATFORM',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland'
};

const FALLBACK_TENANT_ID = 'tenant-demo';

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
}

function emptyPosture(): ConfigurationPosture {
  return {
    generatedAt: new Date().toISOString(),
    secrets: { total: 0, rotationDue: 0, expired: 0, sharedConsumers: 0 },
    certificates: { total: 0, expiringSoon: 0, expired: 0, autoRenewDisabled: 0 },
    attention: { secrets: [], certificates: [] }
  };
}

function emptyOverview(_query: ConfigurationOverviewQuery): ConfigurationOverview {
  return {
    generatedAt: new Date().toISOString(),
    approvals: {},
    audits: {},
    configuration: {
      entries: { total: 0, active: 0, namespaces: {}, items: [] },
      featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
      secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0, items: [] },
      certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0, items: [] }
    },
    posture: emptyPosture(),
    scopeChain: [FALLBACK_SCOPE]
  };
}

export async function loadConfigurationGovernanceSnapshot(
  query: ConfigurationOverviewQuery = {},
  init: RequestInit = {}
): Promise<ConfigurationSnapshotDelivery> {
  const normalized: ConfigurationOverviewQuery = {
    tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
    brandId: query.brandId,
    storeId: query.storeId,
    marketCode: query.marketCode
  };
  const client = createClient();
  try {
    const [overview, managementMetadata] = await Promise.all([
      client.getConfigurationGovernanceOverview(normalized, init),
      client.getConfigurationManagementMetadata(init).catch(() => [])
    ]);
    return {
      deliveryMode: 'api',
      generatedAt: overview.generatedAt,
      query: normalized,
      overview,
      managementMetadata
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      query: normalized,
      overview: emptyOverview(normalized),
      managementMetadata: []
    };
  }
}

export const SECRET_STATUS_LABEL: Record<string, string> = {
  active: '正常',
  'rotation-due': '待轮换',
  expired: '已过期'
};

export const SECRET_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  'rotation-due': 'warning',
  expired: 'danger'
};

export const CERTIFICATE_STATUS_LABEL: Record<string, string> = {
  active: '有效',
  'expiring-soon': '即将到期',
  expired: '已过期'
};

export const CERTIFICATE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  'expiring-soon': 'warning',
  expired: 'danger'
};

export const FEATURE_FLAG_STATUS_VARIANT = {
  true: 'success',
  false: 'neutral'
} as const satisfies Record<'true' | 'false', 'success' | 'neutral'>;

export function featureFlagStatusLabel(flag: ConfigurationFeatureFlag): string {
  return flag.enabled ? '启用' : '关闭';
}

export function summarizeConfigEntry(entry: ConfigurationConfigEntry): string {
  const value = entry.value;
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function summarizeSecret(secret: ConfigurationSecretMetadata): string {
  const consumers = secret.consumers && secret.consumers.length > 0
    ? ` · 消费者 ${secret.consumers.join(', ')}`
    : '';
  return `${secret.name}${consumers}`;
}

export function summarizeCertificate(cert: ConfigurationCertificateMetadata): string {
  const issuer = cert.issuer ? ` · ${cert.issuer}` : '';
  return `${cert.name}${issuer}`;
}

export { buildConfigurationHref };
